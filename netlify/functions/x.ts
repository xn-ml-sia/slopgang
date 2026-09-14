import { lambdaResult, requestUrlFromLambda, xProxy } from '../../server/handlers.ts'

interface LambdaEvent {
  rawQuery?: string
  queryStringParameters?: Record<string, string | undefined> | null
}

export async function handler(event: LambdaEvent) {
  const url = requestUrlFromLambda('/api/x', event)
  return lambdaResult(await xProxy(url, process.env))
}
