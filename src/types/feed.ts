export type SourceId = 'archive' | 'reddit' | 'rss' | 'x' | 'instagram'

export type SlopTag = 'visual-slop' | 'textual-slop' | 'counter-slop'

export interface FeedMedia {
  type: 'image'
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface FeedItem {
  id: string
  source: SourceId
  sourceLabel: string
  title: string
  caption?: string
  body?: string
  media?: FeedMedia
  palette?: string[]
  url: string
  timestamp: string
  tags: SlopTag[]
  author?: string
}

export interface SourcePage {
  items: FeedItem[]
  nextCursor?: string
}

export type SourceHealth = 'idle' | 'loading' | 'live' | 'blocked' | 'unconfigured' | 'error'

export interface SourceStatus {
  id: SourceId
  label: string
  health: SourceHealth
  count: number
  detail?: string
}

export interface SourceAdapter {
  id: SourceId
  label: string
  fetch: (cursor?: string) => Promise<SourcePage>
}
