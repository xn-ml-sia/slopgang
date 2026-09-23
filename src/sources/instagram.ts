import { config } from '../config.ts'
import { SourceFetchError, type SourceErrorKind } from '../lib/errors.ts'
import { fillTemplate, relabelSource } from '../lib/relabel.ts'
import { inferTags } from '../lib/tags.ts'
import { clip, normalizeMediaUrl } from '../lib/text.ts'
import { toIso } from '../lib/time.ts'
import type { FeedItem, SourceAdapter, SourcePage } from '../types/feed.ts'
import { loadRssFeed } from './rss.ts'

interface IgMedia {
  id?: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  username?: string
}

interface IgPayload {
  unconfigured?: boolean
  blocked?: boolean
  error?: string
  status?: number
  message?: string
  data?: IgMedia[]
  paging?: { cursors?: { after?: string } }
}

function igLabel(): string {
  if (config.instagram.username) return `IG @${config.instagram.username}`
  if (config.instagram.hashtag) return `IG #${config.instagram.hashtag}`
  return 'Instagram'
}

function mapMedia(payload: IgPayload): FeedItem[] {
  return (payload.data ?? [])
    .map((post): FeedItem | null => {
      if (!post.id || !post.permalink) return null
      const caption = clip(post.caption ?? '', 420)
      const title = caption ? clip(caption.replace(/\s+/g, ' '), 140) : `${igLabel()} still`
      const image = normalizeMediaUrl(
        post.media_type === 'VIDEO' ? post.thumbnail_url : (post.media_url ?? post.thumbnail_url),
      )

      return {
        id: `instagram:${post.id}`,
        source: 'instagram',
        sourceLabel: igLabel(),
        title,
        body: caption && caption !== title ? caption : undefined,
        media: image ? { type: 'image', url: image, alt: title } : undefined,
        url: post.permalink,
        timestamp: toIso(post.timestamp),
        tags: inferTags({ title, body: caption, hasMedia: Boolean(image), fallback: 'visual-slop' }),
        author: post.username || config.instagram.username || undefined,
      }
    })
    .filter((item): item is FeedItem => item != null)
}

async function fromBridge(): Promise<SourcePage> {
  const url = fillTemplate(config.instagram.rssUrl, {
    username: config.instagram.username,
    hashtag: config.instagram.hashtag,
  })
  if (!url) {
    throw new SourceFetchError('instagram', 'Instagram RSS bridge URL is empty', 'unconfigured')
  }
  const { items, title } = await loadRssFeed(url)
  return { items: relabelSource(items, 'instagram', /insta/i.test(title) ? title : igLabel()) }
}

async function fromOfficial(cursor?: string): Promise<SourcePage> {
  const params = new URLSearchParams()
  if (cursor) params.set('after', cursor)

  let res: Response
  try {
    res = await fetch(`/api/instagram?${params.toString()}`)
  } catch {
    throw new SourceFetchError('instagram', 'Instagram proxy unreachable', 'network')
  }

  const payload = (await res.json()) as IgPayload
  if (payload.unconfigured) {
    throw new SourceFetchError('instagram', 'No Instagram access token configured', 'unconfigured')
  }
  if (payload.blocked) {
    throw new SourceFetchError('instagram', `Instagram API blocked (${payload.status ?? 'auth'})`, 'blocked')
  }
  if (payload.error || !Array.isArray(payload.data)) {
    throw new SourceFetchError(
      'instagram',
      payload.message ?? payload.error ?? 'Instagram API returned no media',
      'network',
    )
  }

  return {
    items: mapMedia(payload),
    nextCursor: payload.paging?.cursors?.after,
  }
}

export const instagramAdapter: SourceAdapter = {
  id: 'instagram',
  label: 'Instagram',
  async fetch(cursor?: string): Promise<SourcePage> {
    try {
      return await fromOfficial(cursor)
    } catch (err) {
      const kind: SourceErrorKind | undefined = err instanceof SourceFetchError ? err.kind : undefined
      if (config.instagram.rssUrl && (kind === 'unconfigured' || kind === 'blocked') && !cursor) {
        return fromBridge()
      }
      throw err
    }
  },
}
