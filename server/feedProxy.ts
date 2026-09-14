import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

const REDDIT_UA =
  'slopgang-archive/0.1 (forensic research; +https://github.com/xn-ml-sia/slopgang)'
const FETCH_MS = 12_000
const MAX_BYTES = 2_000_000

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function sendText(res: ServerResponse, status: number, body: string, type: string) {
  res.statusCode = status
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', 'http://localhost')
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

async function handleReddit(url: URL, res: ServerResponse) {
  const subreddit = (url.searchParams.get('subreddit') ?? 'midjourney').trim()
  if (!/^[A-Za-z0-9_]{2,50}$/.test(subreddit)) {
    sendJson(res, 400, { error: 'invalid_subreddit' })
    return
  }

  const sort = (url.searchParams.get('sort') ?? 'hot').trim()
  if (!/^(hot|new|top|rising)$/.test(sort)) {
    sendJson(res, 400, { error: 'invalid_sort' })
    return
  }

  const after = (url.searchParams.get('after') ?? '').trim()
  if (after && !/^[A-Za-z0-9_]+$/.test(after)) {
    sendJson(res, 400, { error: 'invalid_after' })
    return
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
      sendJson(res, 200, {
        blocked: upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
      return
    }
    sendText(res, 200, text, 'application/json; charset=utf-8')
  } catch (err) {
    sendJson(res, 200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

async function handleRss(url: URL, res: ServerResponse) {
  const raw = url.searchParams.get('url') ?? ''
  const target = isAllowedRssUrl(raw)
  if (!target) {
    sendJson(res, 400, { error: 'invalid_url' })
    return
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
      sendJson(res, 200, {
        error: 'upstream',
        status: upstream.status,
        xml: '',
      })
      return
    }
    if (truncated) {
      sendJson(res, 200, { error: 'too_large', xml: '' })
      return
    }
    sendText(res, 200, text, 'application/xml; charset=utf-8')
  } catch (err) {
    sendJson(res, 200, {
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      xml: '',
    })
  }
}

type Env = Record<string, string | undefined>

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
      'User-Agent': REDDIT_UA,
      Accept: 'application/json',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_MS),
  })
}

// Official X API v2 only (api.twitter.com). No HTML scraping of x.com.
async function handleX(url: URL, res: ServerResponse, env: Env) {
  const bearer = pickToken(env, 'X_BEARER_TOKEN', 'TWITTER_BEARER_TOKEN')
  if (!bearer) {
    sendJson(res, 200, { unconfigured: true, items: [] })
    return
  }

  const handle = (url.searchParams.get('handle') ?? '').trim()
  const query = (url.searchParams.get('query') ?? '').trim()
  const after = (url.searchParams.get('after') ?? '').trim()
  if (handle && !/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    sendJson(res, 400, { error: 'invalid_handle' })
    return
  }
  if (query.length > 512) {
    sendJson(res, 400, { error: 'invalid_query' })
    return
  }
  if (after && !/^[A-Za-z0-9_-]+$/.test(after)) {
    sendJson(res, 400, { error: 'invalid_after' })
    return
  }

  try {
    let target: URL
    if (handle && !query) {
      const userUrl = new URL(`https://api.twitter.com/2/users/by/username/${handle}`)
      const userRes = await twitterGet(userUrl, bearer)
      const userBody = (await userRes.json()) as { data?: { id?: string }; status?: number; title?: string }
      if (!userRes.ok || !userBody.data?.id) {
        sendJson(res, 200, {
          blocked: userRes.status === 401 || userRes.status === 403 || userRes.status === 429,
          error: 'upstream',
          status: userRes.status,
          message: userBody.title ?? 'X user lookup failed',
        })
        return
      }
      if (!/^\d+$/.test(userBody.data.id)) {
        sendJson(res, 200, { error: 'invalid_user_id' })
        return
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
      sendJson(res, 200, {
        blocked: upstream.status === 401 || upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
      return
    }
    sendText(res, 200, text, 'application/json; charset=utf-8')
  } catch (err) {
    sendJson(res, 200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

// Instagram Graph /me/media only. No HTML scraping of instagram.com.
async function handleInstagram(url: URL, res: ServerResponse, env: Env) {
  const token = pickToken(env, 'INSTAGRAM_ACCESS_TOKEN', 'IG_ACCESS_TOKEN')
  if (!token) {
    sendJson(res, 200, { unconfigured: true, items: [] })
    return
  }

  const after = (url.searchParams.get('after') ?? '').trim()
  if (after && !/^[A-Za-z0-9_-]+$/.test(after)) {
    sendJson(res, 400, { error: 'invalid_after' })
    return
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
      sendJson(res, 200, {
        blocked: upstream.status === 401 || upstream.status === 403 || upstream.status === 429,
        error: 'upstream',
        status: upstream.status,
        items: [],
      })
      return
    }
    sendText(res, 200, text, 'application/json; charset=utf-8')
  } catch (err) {
    sendJson(res, 200, {
      blocked: false,
      error: 'network',
      message: err instanceof Error ? err.message : 'fetch failed',
      items: [],
    })
  }
}

function attach(middlewares: Connect.Server, env: Env) {
  middlewares.use((req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const url = requestUrl(req)
    if (req.method !== 'GET') {
      next()
      return
    }
    if (url.pathname === '/api/reddit') {
      void handleReddit(url, res)
      return
    }
    if (url.pathname === '/api/rss') {
      void handleRss(url, res)
      return
    }
    if (url.pathname === '/api/x') {
      void handleX(url, res, env)
      return
    }
    if (url.pathname === '/api/instagram') {
      void handleInstagram(url, res, env)
      return
    }
    next()
  })
}

export function feedProxyPlugin(fileEnv: Record<string, string> = {}): Plugin {
  const env: Env = { ...fileEnv, ...process.env }
  return {
    name: 'slopgang-feed-proxy',
    configureServer(server) {
      attach(server.middlewares, env)
    },
    configurePreviewServer(server) {
      attach(server.middlewares, env)
    },
  }
}
