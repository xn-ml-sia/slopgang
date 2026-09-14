import { lambdaResult, requestUrlFromLambda, rssProxy } from '../../server/handlers.ts'

interface LambdaEvent {
  rawQuery?: string
  queryStringParameters?: Record<string, string | undefined> | null
}

export async function handler(event: LambdaEvent) {
  const url = requestUrlFromLambda('/api/rss', event)
  return lambdaResult(await rssProxy(url))
}
