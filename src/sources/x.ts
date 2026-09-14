import { config } from '../config.ts'
import { SourceFetchError, type SourceErrorKind } from '../lib/errors.ts'
import { fillTemplate, relabelSource } from '../lib/relabel.ts'
import { inferTags } from '../lib/tags.ts'
import { clip, normalizeMediaUrl } from '../lib/text.ts'
import { toIso } from '../lib/time.ts'
import type { FeedItem, SourceAdapter, SourcePage } from '../types/feed.ts'
import { loadRssFeed } from './rss.ts'

interface XMedia {
  media_key?: string
  type?: string
  url?: string
  preview_image_url?: string
  width?: number
  height?: number
}

interface XUser {
  id?: string
  username?: string
  name?: string
}

interface XTweet {
  id?: string
  text?: string
  created_at?: string
  author_id?: string
  attachments?: { media_keys?: string[] }
}

interface XPayload {
  unconfigured?: boolean
  blocked?: boolean
  error?: string
  status?: number
  message?: string
  data?: XTweet[]
  includes?: { media?: XMedia[]; users?: XUser[] }
  meta?: { next_token?: string }
}

function xLabel(): string {
  if (config.x.handle) return `X @${config.x.handle}`
  if (config.x.query) return 'X search'
  return 'X'
}

function mapTweets(payload: XPayload): FeedItem[] {
  const users = new Map((payload.includes?.users ?? []).map((user) => [user.id ?? '', user]))
  const media = new Map((payload.includes?.media ?? []).map((item) => [item.media_key ?? '', item]))

  return (payload.data ?? [])
    .map((tweet): FeedItem | null => {
      if (!tweet.id || !tweet.text) return null
      const author = users.get(tweet.author_id ?? '')
      const handle = author?.username ?? config.x.handle ?? 'x'
      const key = tweet.attachments?.media_keys?.[0]
      const shot = key ? media.get(key) : undefined
      const imageUrl = normalizeMediaUrl(shot?.url ?? shot?.preview_image_url)
      const title = clip(tweet.text.replace(/\s+/g, ' '), 140)
      const body = clip(tweet.text)

      return {
        id: `x:${tweet.id}`,
        source: 'x',
        sourceLabel: xLabel(),
        title,
        body: body && body !== title ? body : undefined,
        media: imageUrl
          ? { type: 'image', url: imageUrl, alt: title, width: shot?.width, height: shot?.height }
          : undefined,
        url: `https://x.com/${handle}/status/${tweet.id}`,
        timestamp: toIso(tweet.created_at),
        tags: inferTags({ title, body, hasMedia: Boolean(imageUrl), fallback: 'textual-slop' }),
        author: handle,
      }
    })
    .filter((item): item is FeedItem => item != null)
}

async function fromBridge(): Promise<SourcePage> {
  const url = fillTemplate(config.x.rssUrl, {
    handle: config.x.handle,
    query: config.x.query,
  })
  if (!url) {
    throw new SourceFetchError('x', 'X RSS bridge URL is empty', 'unconfigured')
  }
  const { items, title } = await loadRssFeed(url)
  return { items: relabelSource(items, 'x', title.startsWith('X') ? title : xLabel()) }
}

async function fromOfficial(cursor?: string): Promise<SourcePage> {
  const params = new URLSearchParams()
  if (config.x.handle) params.set('handle', config.x.handle)
  if (config.x.query) params.set('query', config.x.query)
  if (cursor) params.set('after', cursor)

  let res: Response
  try {
    res = await fetch(`/api/x?${params.toString()}`)
  } catch {
    throw new SourceFetchError('x', 'X proxy unreachable', 'network')
  }

  const payload = (await res.json()) as XPayload
  if (payload.unconfigured) {
    throw new SourceFetchError('x', 'No X bearer token configured', 'unconfigured')
  }
  if (payload.blocked) {
    throw new SourceFetchError('x', `X API blocked (${payload.status ?? 'auth'})`, 'blocked')
  }
  if (payload.error || !Array.isArray(payload.data)) {
    throw new SourceFetchError('x', payload.message ?? payload.error ?? 'X API returned no tweets', 'network')
  }

  return {
    items: mapTweets(payload),
    nextCursor: payload.meta?.next_token,
  }
}

export const xAdapter: SourceAdapter = {
  id: 'x',
  label: 'X',
  async fetch(cursor?: string): Promise<SourcePage> {
    try {
      return await fromOfficial(cursor)
    } catch (err) {
      const kind: SourceErrorKind | undefined = err instanceof SourceFetchError ? err.kind : undefined
      if (config.x.rssUrl && (kind === 'unconfigured' || kind === 'blocked') && !cursor) {
        return fromBridge()
      }
      throw err
    }
  },
}
