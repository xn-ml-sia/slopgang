import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { dispatchFeed, feedRouteName, type Env } from './feedHandlers.ts'

function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', 'http://localhost')
}

async function pipe(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const buf = Buffer.from(await response.arrayBuffer())
  res.end(buf)
}

function attach(middlewares: Connect.Server, env: Env) {
  middlewares.use((req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const url = requestUrl(req)
    if (req.method !== 'GET' || !feedRouteName(url.pathname)) {
      next()
      return
    }
    const request = new Request(url, { method: 'GET' })
    void dispatchFeed(request, env).then((response) => pipe(res, response)).catch(next)
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
