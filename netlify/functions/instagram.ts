import { instagramProxy, lambdaResult, requestUrlFromLambda } from '../../server/handlers.ts'

interface LambdaEvent {
  rawQuery?: string
  queryStringParameters?: Record<string, string | undefined> | null
}

export async function handler(event: LambdaEvent) {
  const url = requestUrlFromLambda('/api/instagram', event)
  return lambdaResult(await instagramProxy(url, process.env))
}
