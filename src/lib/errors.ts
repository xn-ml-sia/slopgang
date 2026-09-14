import type { SourceHealth, SourceId } from '../types/feed.ts'

export type SourceErrorKind = 'blocked' | 'network' | 'parse' | 'unconfigured'

export class SourceFetchError extends Error {
  readonly sourceId: SourceId
  readonly kind: SourceErrorKind

  constructor(sourceId: SourceId, message: string, kind: SourceErrorKind) {
    super(message)
    this.name = 'SourceFetchError'
    this.sourceId = sourceId
    this.kind = kind
  }
}

export function healthFromError(err: unknown): SourceHealth {
  if (err instanceof SourceFetchError && (err.kind === 'blocked' || err.kind === 'unconfigured')) {
    return err.kind
  }
  return 'error'
}
