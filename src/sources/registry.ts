import { config } from '../config.ts'
import type { SourceAdapter } from '../types/feed.ts'
import { instagramAdapter } from './instagram.ts'
import { redditAdapter } from './reddit.ts'
import { rssAdapter } from './rss.ts'
import { seedAdapter } from './seed.ts'
import { xAdapter } from './x.ts'

export const sources: SourceAdapter[] = [
  seedAdapter,
  ...(config.reddit.enabled ? [redditAdapter] : []),
  ...(config.rss.enabled ? [rssAdapter] : []),
  ...(config.x.enabled ? [xAdapter] : []),
  ...(config.instagram.enabled ? [instagramAdapter] : []),
]

export { seedAdapter, redditAdapter, rssAdapter, xAdapter, instagramAdapter }
