export type Env = Record<string, string | undefined>

export interface ProxyResult {
  status: number
  contentType: string
  body: string
}

const UA = 'slopgang-archive/0.1 (forensic research; +https://github.com/xn-ml-sia/slopgang)'
const FETCH_MS = 12_000
const MAX_BYTES = 2_000_000

function json(status: number, body: unknown): ProxyResult {
  return {
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  }
}

function text(status: number, body: string, type: string): ProxyResult {
  return { status, contentType: type, body }
}

function isPrivateHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true
  if (h === '::1' || h === '0.0.0.0') return true
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) return false
  const [a, b] = h.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function isAllowedRssUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (isPrivateHostname(url.hostname)) return null
  return url
}

async function readLimited(res: Response): Promise<{ text: string; truncated: boolean }> {
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_BYTES) {
    return {
      text: new TextDecoder().decode(buf.slice(0, MAX_BYTES)),
      truncated: true,
    }
  }
  return { text: new TextDecoder().decode(buf), truncated: false }
}

function pickToken(env: Env, ...keys: string[]): string {
  for (const key of keys) {
    const value = env[key]?.trim()
    if (value) return value
  }
  return ''
}

const TWEET_FIELDS = {
  'tweet.fields': 'created_at,author_id,entities',
  expansions: 'attachments.media_keys,author_id',
  'media.fields': 'url,preview_image_url,width,height,type',
  'user.fields': 'username,name',
  max_results: '10',
}

async function twitterGet(target: URL, bearer: string): Promise<Response> {
  if (target.protocol !== 'https:' || target.hostname !== 'api.twitter.com') {
    throw new Error('refusing non-twitter host')
  }
  return fetch(target, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      'User-Agent': UA,
      Accept: 'application/json',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_MS),
  })
}

export async function redditProxy(url: URL): Promise<ProxyResult> {
  const subreddit = (url.searchParams.get('subreddit') ?? 'midjourney').trim()
  if (!/^[A-Za-z0-9_]{2,50}$/.test(subreddit)) return json(400, { error: 'invalid_subreddit' })

  const sort = (url.searchParams.get('sort') ?? 'hot').trim()
  if (!/^(hot|new|top|rising)$/.test(sort)) return json(400, { error: 'invalid_sort' })

  const after = (url.searchParams.get('after') ?? '').trim()
  if (after && !/^[A-Za-z0-9_]+$/.test(after)) return json(400, { error: 'invalid_after' })

  const query = (url.searchParams.get('query') ?? '').trim()
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 25) || 25))

  const target = new URL(
    query ? 'https://www.reddit.com/search.json' : `https://www.reddit.com/r/${subreddit}/${sort}.json`,
  )
  target.searchParams.set('limit', String(limit))
  target.searchParams.set('raw_json', '1')
  if (query) {
    target.searchParams.set('q', query)
    target.searchParams.set('sort', sort)
    target.searchParams.set('restrict_sr', 'false')
  }
  if (after) target.searchParams.set('after', after)

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const { text: body } = await readLimited(upstream)
    if (!upstream.ok) {
      return json(200, {
        blocked: upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
    }
    return text(200, body, 'application/json; charset=utf-8')
  } catch (err) {
    return json(200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

export async function rssProxy(url: URL): Promise<ProxyResult> {
  const target = isAllowedRssUrl(url.searchParams.get('url') ?? '')
  if (!target) return json(400, { error: 'invalid_url' })

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': UA,
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const { text: body, truncated } = await readLimited(upstream)
    if (!upstream.ok) return json(200, { error: 'upstream', status: upstream.status, xml: '' })
    if (truncated) return json(200, { error: 'too_large', xml: '' })
    return text(200, body, 'application/xml; charset=utf-8')
  } catch (err) {
    return json(200, {
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      xml: '',
    })
  }
}

export async function xProxy(url: URL, env: Env): Promise<ProxyResult> {
  const bearer = pickToken(env, 'X_BEARER_TOKEN', 'TWITTER_BEARER_TOKEN')
  if (!bearer) return json(200, { unconfigured: true, items: [] })

  const handle = (url.searchParams.get('handle') ?? '').trim()
  const query = (url.searchParams.get('query') ?? '').trim()
  const after = (url.searchParams.get('after') ?? '').trim()
  if (handle && !/^[A-Za-z0-9_]{1,15}$/.test(handle)) return json(400, { error: 'invalid_handle' })
  if (query.length > 512) return json(400, { error: 'invalid_query' })
  if (after && !/^[A-Za-z0-9_-]+$/.test(after)) return json(400, { error: 'invalid_after' })

  try {
    let target: URL
    if (handle && !query) {
      const userRes = await twitterGet(new URL(`https://api.twitter.com/2/users/by/username/${handle}`), bearer)
      const userBody = (await userRes.json()) as { data?: { id?: string }; title?: string }
      if (!userRes.ok || !userBody.data?.id) {
        return json(200, {
          blocked: userRes.status === 401 || userRes.status === 403 || userRes.status === 429,
          error: 'upstream',
          status: userRes.status,
          message: userBody.title ?? 'X user lookup failed',
        })
      }
      if (!/^\d+$/.test(userBody.data.id)) return json(200, { error: 'invalid_user_id' })
      target = new URL(`https://api.twitter.com/2/users/${userBody.data.id}/tweets`)
    } else {
      target = new URL('https://api.twitter.com/2/tweets/search/recent')
      target.searchParams.set('query', query || (handle ? `from:${handle}` : 'slop -is:retweet'))
    }

    for (const [key, value] of Object.entries(TWEET_FIELDS)) {
      target.searchParams.set(key, value)
    }
    if (after) target.searchParams.set('pagination_token', after)

    const upstream = await twitterGet(target, bearer)
    const { text: body } = await readLimited(upstream)
    if (!upstream.ok) {
      return json(200, {
        blocked: upstream.status === 401 || upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
    }
    return text(200, body, 'application/json; charset=utf-8')
  } catch (err) {
    return json(200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

export async function instagramProxy(url: URL, env: Env): Promise<ProxyResult> {
  const token = pickToken(env, 'INSTAGRAM_ACCESS_TOKEN', 'IG_ACCESS_TOKEN')
  if (!token) return json(200, { unconfigured: true, items: [] })

  const after = (url.searchParams.get('after') ?? '').trim()
  if (after && !/^[A-Za-z0-9_-]+$/.test(after)) return json(400, { error: 'invalid_after' })

  const target = new URL('https://graph.instagram.com/me/media')
  target.searchParams.set('fields', 'id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url')
  target.searchParams.set('limit', '12')
  target.searchParams.set('access_token', token)
  if (after) target.searchParams.set('after', after)

  try {
    const upstream = await fetch(target, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': UA,
        Accept: 'application/json',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const { text: body } = await readLimited(upstream)
    if (!upstream.ok) {
      return json(200, {
        blocked: upstream.status === 401 || upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
    }
    return text(200, body, 'application/json; charset=utf-8')
  } catch (err) {
    return json(200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

export async function dispatchFeedProxy(url: URL, env: Env): Promise<ProxyResult | null> {
  switch (url.pathname) {
    case '/api/reddit':
      return redditProxy(url)
    case '/api/rss':
      return rssProxy(url)
    case '/api/x':
      return xProxy(url, env)
    case '/api/instagram':
      return instagramProxy(url, env)
    default:
      return null
  }
}

export function lambdaResult(result: ProxyResult) {
  return {
    statusCode: result.status,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'no-store',
    },
    body: result.body,
  }
}

export function requestUrlFromLambda(
  path: string,
  event: { rawQuery?: string; queryStringParameters?: Record<string, string | undefined> | null },
): URL {
  const url = new URL(path, 'https://slopgang.org')
  if (event.rawQuery) {
    url.search = event.rawQuery.startsWith('?') ? event.rawQuery : `?${event.rawQuery}`
    return url
  }
  for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
    if (value) url.searchParams.set(key, value)
  }
  return url
}
