import type { FeedItem, FeedMedia, SourceAdapter } from '../types/feed.ts'
import type { SlopTag } from '../types/feed.ts'
import { normalizeMediaUrl } from '../lib/text.ts'
import raw from '../data/archive.json'

interface SeedRecord {
  id: string
  title: string
  caption?: string
  body?: string
  palette?: string[]
  media?: Partial<FeedMedia> | null
  url: string
  timestamp: string
  tags: SlopTag[]
  author?: string
}

const records = raw as SeedRecord[]

function seedMedia(record: SeedRecord): FeedMedia | undefined {
  const url = normalizeMediaUrl(record.media?.url)
  if (!url) return undefined
  if (record.media?.type && record.media.type !== 'image') return undefined
  return {
    type: 'image',
    url,
    alt: record.media?.alt ?? record.title,
    width: record.media?.width,
    height: record.media?.height,
  }
}

function toItem(record: SeedRecord): FeedItem {
  return {
    id: record.id,
    source: 'archive',
    sourceLabel: 'Archive',
    title: record.title,
    caption: record.caption,
    body: record.body,
    media: seedMedia(record),
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
