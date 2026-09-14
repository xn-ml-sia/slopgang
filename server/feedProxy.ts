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

function attach(middlewares: Connect.Server) {
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
    next()
  })
}

export function feedProxyPlugin(): Plugin {
  return {
    name: 'slopgang-feed-proxy',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
