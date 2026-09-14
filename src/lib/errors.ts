export class SourceFetchError extends Error {
  readonly sourceId: 'reddit' | 'rss'
  readonly kind: 'blocked' | 'network' | 'parse'

  constructor(sourceId: 'reddit' | 'rss', message: string, kind: 'blocked' | 'network' | 'parse') {
    super(message)
    this.name = 'SourceFetchError'
    this.sourceId = sourceId
    this.kind = kind
  }
}
