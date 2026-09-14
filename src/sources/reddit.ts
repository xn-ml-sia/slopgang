import { config } from '../config.ts'
import { SourceFetchError } from '../lib/errors.ts'
import { inferTags } from '../lib/tags.ts'
import { clip, normalizeMediaUrl, stripHtml } from '../lib/text.ts'
import { toIso } from '../lib/time.ts'
import type { FeedItem, SourceAdapter, SourcePage } from '../types/feed.ts'

interface RedditChild {
  kind?: string
  data?: RedditPost
}

interface RedditPost {
  id?: string
  name?: string
  title?: string
  selftext?: string
  url?: string
  permalink?: string
  created_utc?: number
  author?: string
  thumbnail?: string
  post_hint?: string
  is_video?: boolean
  over_18?: boolean
  stickied?: boolean
  preview?: {
    images?: Array<{
      source?: { url?: string; width?: number; height?: number }
    }>
  }
}

interface RedditListing {
  blocked?: boolean
  error?: string
  status?: number
  data?: {
    after?: string | null
    children?: RedditChild[]
  }
}

function previewUrl(post: RedditPost): string | undefined {
  const source = post.preview?.images?.[0]?.source
  const fromPreview = normalizeMediaUrl(source?.url)
  if (fromPreview) return fromPreview
  const url = post.url ?? ''
  if (/\.(png|jpe?g|gif|webp)$/i.test(url)) return normalizeMediaUrl(url)
  return undefined
}

function toItem(post: RedditPost): FeedItem | null {
  if (!post.id || !post.title || post.stickied || post.over_18) return null
  const image = previewUrl(post)
  const body = clip(stripHtml(post.selftext ?? ''))
  const permalink = post.permalink ? `https://www.reddit.com${post.permalink}` : (post.url ?? '')
  if (!permalink) return null
  const sub = config.reddit.subreddit

  return {
    id: `reddit:${post.id}`,
    source: 'reddit',
    sourceLabel: `r/${sub}`,
    title: post.title,
    body: body || undefined,
    media: image ? { type: 'image', url: image, alt: post.title } : undefined,
    url: permalink,
    timestamp: toIso(post.created_utc),
    tags: inferTags({ title: post.title, body, hasMedia: Boolean(image), fallback: 'visual-slop' }),
    author: post.author && post.author !== '[deleted]' ? post.author : undefined,
  }
}

export const redditAdapter: SourceAdapter = {
  id: 'reddit',
  label: `r/${config.reddit.subreddit}`,
  async fetch(cursor?: string): Promise<SourcePage> {
    const params = new URLSearchParams({
      subreddit: config.reddit.subreddit,
      sort: config.reddit.sort,
      limit: '25',
    })
    if (config.reddit.query) params.set('query', config.reddit.query)
    if (cursor) params.set('after', cursor)

    let res: Response
    try {
      res = await fetch(`/api/reddit?${params.toString()}`)
    } catch {
      throw new SourceFetchError('reddit', 'Reddit proxy unreachable', 'network')
    }

    const payload = (await res.json()) as RedditListing
    if (payload.blocked) {
      throw new SourceFetchError(
        'reddit',
        `Public JSON blocked (${payload.status ?? 403}). Common from datacenter IPs; try locally.`,
        'blocked',
      )
    }
    if (payload.error || !payload.data) {
      throw new SourceFetchError('reddit', 'Reddit returned no listing', 'network')
    }

    const items = (payload.data.children ?? [])
      .map((child) => toItem(child.data ?? {}))
      .filter((item): item is FeedItem => item != null)

    return {
      items,
      nextCursor: payload.data.after ?? undefined,
    }
  },
}
