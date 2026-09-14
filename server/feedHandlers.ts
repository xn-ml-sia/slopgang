export type Env = Record<string, string | undefined>

export const FEED_PATHS = ['/api/reddit', '/api/rss', '/api/x', '/api/instagram'] as const

const REDDIT_UA =
  'slopgang-archive/0.1 (forensic research; +https://github.com/xn-ml-sia/slopgang)'
const FETCH_MS = 12_000
const MAX_BYTES = 2_000_000

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

function textResponse(status: number, body: string, type: string): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'no-store',
    },
  })
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

export async function handleReddit(url: URL): Promise<Response> {
  const subreddit = (url.searchParams.get('subreddit') ?? 'midjourney').trim()
  if (!/^[A-Za-z0-9_]{2,50}$/.test(subreddit)) {
    return jsonResponse(400, { error: 'invalid_subreddit' })
  }

  const sort = (url.searchParams.get('sort') ?? 'hot').trim()
  if (!/^(hot|new|top|rising)$/.test(sort)) {
    return jsonResponse(400, { error: 'invalid_sort' })
  }

  const after = (url.searchParams.get('after') ?? '').trim()
  if (after && !/^[A-Za-z0-9_]+$/.test(after)) {
    return jsonResponse(400, { error: 'invalid_after' })
  }

  const query = (url.searchParams.get('query') ?? '').trim()
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 25) || 25))

  const target = new URL(
    query
      ? 'https://www.reddit.com/search.json'
      : `https://www.reddit.com/r/${subreddit}/${sort}.json`,
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
      headers: {
        'User-Agent': REDDIT_UA,
        Accept: 'application/json',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const { text } = await readLimited(upstream)
    if (!upstream.ok) {
      return jsonResponse(200, {
        blocked: upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
    }
    return textResponse(200, text, 'application/json; charset=utf-8')
  } catch (err) {
    return jsonResponse(200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

export async function handleRss(url: URL): Promise<Response> {
  const raw = url.searchParams.get('url') ?? ''
  const target = isAllowedRssUrl(raw)
  if (!target) {
    return jsonResponse(400, { error: 'invalid_url' })
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': REDDIT_UA,
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const { text, truncated } = await readLimited(upstream)
    if (!upstream.ok) {
      return jsonResponse(200, {
        error: 'upstream',
        status: upstream.status,
        xml: '',
      })
    }
    if (truncated) {
      return jsonResponse(200, { error: 'too_large', xml: '' })
    }
    return textResponse(200, text, 'application/xml; charset=utf-8')
  } catch (err) {
    return jsonResponse(200, {
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      xml: '',
    })
  }
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
      'User-Agent': REDDIT_UA,
      Accept: 'application/json',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_MS),
  })
}

// Official X API v2 only (api.twitter.com). No HTML scraping of x.com.
export async function handleX(url: URL, env: Env): Promise<Response> {
  const bearer = pickToken(env, 'X_BEARER_TOKEN', 'TWITTER_BEARER_TOKEN')
  if (!bearer) {
    return jsonResponse(200, { unconfigured: true, items: [] })
  }

  const handle = (url.searchParams.get('handle') ?? '').trim()
  const query = (url.searchParams.get('query') ?? '').trim()
  const after = (url.searchParams.get('after') ?? '').trim()
  if (handle && !/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    return jsonResponse(400, { error: 'invalid_handle' })
  }
  if (query.length > 512) {
    return jsonResponse(400, { error: 'invalid_query' })
  }
  if (after && !/^[A-Za-z0-9_-]+$/.test(after)) {
    return jsonResponse(400, { error: 'invalid_after' })
  }

  try {
    let target: URL
    if (handle && !query) {
      const userUrl = new URL(`https://api.twitter.com/2/users/by/username/${handle}`)
      const userRes = await twitterGet(userUrl, bearer)
      const userBody = (await userRes.json()) as { data?: { id?: string }; status?: number; title?: string }
      if (!userRes.ok || !userBody.data?.id) {
        return jsonResponse(200, {
          blocked: userRes.status === 401 || userRes.status === 403 || userRes.status === 429,
          error: 'upstream',
          status: userRes.status,
          message: userBody.title ?? 'X user lookup failed',
        })
      }
      if (!/^\d+$/.test(userBody.data.id)) {
        return jsonResponse(200, { error: 'invalid_user_id' })
      }
      target = new URL(`https://api.twitter.com/2/users/${userBody.data.id}/tweets`)
    } else {
      target = new URL('https://api.twitter.com/2/tweets/search/recent')
      const q = query || (handle ? `from:${handle}` : 'slop -is:retweet')
      target.searchParams.set('query', q)
    }

    for (const [key, value] of Object.entries(TWEET_FIELDS)) {
      target.searchParams.set(key, value)
    }
    if (after) target.searchParams.set('pagination_token', after)

    const upstream = await twitterGet(target, bearer)
    const { text } = await readLimited(upstream)
    if (!upstream.ok) {
      return jsonResponse(200, {
        blocked: upstream.status === 401 || upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
    }
    return textResponse(200, text, 'application/json; charset=utf-8')
  } catch (err) {
    return jsonResponse(200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

// Instagram Graph /me/media only. No HTML scraping of instagram.com.
export async function handleInstagram(url: URL, env: Env): Promise<Response> {
  const token = pickToken(env, 'INSTAGRAM_ACCESS_TOKEN', 'IG_ACCESS_TOKEN')
  if (!token) {
    return jsonResponse(200, { unconfigured: true, items: [] })
  }

  const after = (url.searchParams.get('after') ?? '').trim()
  if (after && !/^[A-Za-z0-9_-]+$/.test(after)) {
    return jsonResponse(400, { error: 'invalid_after' })
  }

  const target = new URL('https://graph.instagram.com/me/media')
  target.searchParams.set(
    'fields',
    'id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url',
  )
  target.searchParams.set('limit', '12')
  target.searchParams.set('access_token', token)
  if (after) target.searchParams.set('after', after)

  try {
    const upstream = await fetch(target, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': REDDIT_UA,
        Accept: 'application/json',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const { text } = await readLimited(upstream)
    if (!upstream.ok) {
      return jsonResponse(200, {
        blocked: upstream.status === 401 || upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
    }
    return textResponse(200, text, 'application/json; charset=utf-8')
  } catch (err) {
    return jsonResponse(200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

const HANDLERS: Record<string, (url: URL, env: Env) => Promise<Response>> = {
  reddit: (url) => handleReddit(url),
  rss: (url) => handleRss(url),
  x: handleX,
  instagram: handleInstagram,
}

export function feedRouteName(pathname: string): string | undefined {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if ((FEED_PATHS as readonly string[]).includes(clean)) {
    return clean.slice('/api/'.length)
  }
  const fn = /^\/\.netlify\/functions\/([^/]+)$/.exec(clean)
  if (fn && fn[1] && fn[1] in HANDLERS) return fn[1]
  return undefined
}

export async function dispatchFeed(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' })
  }
  const url = new URL(req.url)
  const route = feedRouteName(url.pathname)
  const handle = route ? HANDLERS[route] : undefined
  if (!handle) {
    return jsonResponse(404, { error: 'not_found' })
  }
  return handle(url, env)
}

export function netlifyFeedFunction(route: keyof typeof HANDLERS) {
  const handle = HANDLERS[route]
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'GET') {
      return jsonResponse(405, { error: 'method_not_allowed' })
    }
    return handle(new URL(req.url), process.env)
  }
}

export function netlifyFeedConfig(route: keyof typeof HANDLERS) {
  return {
    method: ['GET'],
    path: [`/api/${route}`, `/.netlify/functions/${route}`],
  }
}
