import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { dispatchFeedProxy, type Env, type ProxyResult } from './handlers.ts'

function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', 'http://localhost')
}

function write(res: ServerResponse, result: ProxyResult) {
  res.statusCode = result.status
  res.setHeader('Content-Type', result.contentType)
  res.setHeader('Cache-Control', 'no-store')
  res.end(result.body)
}

function attach(middlewares: Connect.Server, env: Env) {
  middlewares.use((req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const url = requestUrl(req)
    if (req.method !== 'GET') {
      next()
      return
    }
    void dispatchFeedProxy(url, env)
      .then((result) => {
        if (!result) {
          next()
          return
        }
        write(res, result)
      })
      .catch(() => {
        write(res, {
          status: 500,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({ error: 'proxy_failed' }),
        })
      })
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
