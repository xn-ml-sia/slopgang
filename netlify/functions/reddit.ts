import { lambdaResult, redditProxy, requestUrlFromLambda } from '../../server/handlers.ts'

interface LambdaEvent {
  rawQuery?: string
  queryStringParameters?: Record<string, string | undefined> | null
}

export async function handler(event: LambdaEvent) {
  const url = requestUrlFromLambda('/api/reddit', event)
  return lambdaResult(await redditProxy(url))
}
