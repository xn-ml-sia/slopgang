import { attr, clip, firstImageSrc, innerXml, normalizeMediaUrl, splitBlocks, stripHtml } from './text.ts'
import { inferTags } from './tags.ts'
import { toIso } from './time.ts'
import type { FeedItem } from '../types/feed.ts'

function atomHref(block: string): string | undefined {
  const links = block.match(/<link\b[^>]*>/gi) ?? []
  for (const link of links) {
    const rel = /rel=["']([^"']+)["']/i.exec(link)?.[1] ?? 'alternate'
    const href = /href=["']([^"']+)["']/i.exec(link)?.[1]
    if (href && (rel === 'alternate' || rel === 'self')) return href
  }
  return innerXml(block, 'link')
}

function mediaUrl(block: string): string | undefined {
  const media = attr(block, 'media:content', 'url') ?? attr(block, 'media:thumbnail', 'url')
  if (media) return media
  const enclosureType = attr(block, 'enclosure', 'type') ?? ''
  const enclosureUrl = attr(block, 'enclosure', 'url')
  if (enclosureUrl && enclosureType.startsWith('image')) return enclosureUrl
  const html = innerXml(block, 'content:encoded') ?? innerXml(block, 'content') ?? innerXml(block, 'description') ?? ''
  return firstImageSrc(html)
}

function itemFromBlock(block: string, index: number): FeedItem | null {
  const title = stripHtml(innerXml(block, 'title') ?? '').replace(/\s+/g, ' ')
  const url = atomHref(block) ?? innerXml(block, 'guid') ?? innerXml(block, 'id')
  if (!title || !url) return null

  const html =
    innerXml(block, 'content:encoded') ??
    innerXml(block, 'content') ??
    innerXml(block, 'summary') ??
    innerXml(block, 'description') ??
    ''
  const body = clip(stripHtml(html))
  const image = normalizeMediaUrl(mediaUrl(block))
  const author =
    stripHtml(innerXml(block, 'dc:creator') ?? innerXml(block, 'name') ?? innerXml(block, 'author') ?? '') || undefined
  const timestamp = toIso(
    innerXml(block, 'pubDate') ?? innerXml(block, 'published') ?? innerXml(block, 'updated') ?? innerXml(block, 'dc:date'),
  )
  const guid = innerXml(block, 'guid') ?? innerXml(block, 'id') ?? url

  return {
    id: `rss:${guid || index}`,
    source: 'rss',
    sourceLabel: 'RSS',
    title,
    body: body || undefined,
    media: image ? { type: 'image', url: image, alt: title } : undefined,
    url,
    timestamp,
    tags: inferTags({ title, body, hasMedia: Boolean(image), fallback: 'textual-slop' }),
    author,
  }
}

export function parseRss(xml: string, sourceLabel = 'RSS'): FeedItem[] {
  if (!xml || xml.trimStart().startsWith('{')) return []
  const blocks = splitBlocks(xml, 'item').concat(splitBlocks(xml, 'entry'))
  const items: FeedItem[] = []
  const seen = new Set<string>()
  for (const [index, block] of blocks.entries()) {
    const item = itemFromBlock(block, index)
    if (!item || seen.has(item.id)) continue
    item.sourceLabel = sourceLabel
    seen.add(item.id)
    items.push(item)
  }
  return items
}

export function rssChannelTitle(xml: string): string | undefined {
  const channel = splitBlocks(xml, 'channel')[0] ?? splitBlocks(xml, 'feed')[0] ?? xml
  const title = innerXml(channel, 'title')
  return title ? stripHtml(title) : undefined
}
