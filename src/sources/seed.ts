import type { FeedItem, SourceAdapter } from '../types/feed.ts'
import type { SlopTag } from '../types/feed.ts'
import raw from '../data/archive.json'

interface SeedRecord {
  id: string
  title: string
  caption?: string
  body?: string
  palette?: string[]
  url: string
  timestamp: string
  tags: SlopTag[]
  author?: string
}

const records = raw as SeedRecord[]

function toItem(record: SeedRecord): FeedItem {
  return {
    id: record.id,
    source: 'archive',
    sourceLabel: 'Archive',
    title: record.title,
    caption: record.caption,
    body: record.body,
    palette: record.palette,
    url: record.url,
    timestamp: record.timestamp,
    tags: record.tags,
    author: record.author,
  }
}

export const seedAdapter: SourceAdapter = {
  id: 'archive',
  label: 'Archive',
  async fetch() {
    return { items: records.map(toItem) }
  },
}
