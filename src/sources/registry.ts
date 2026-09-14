import { config } from '../config.ts'
import type { SourceAdapter } from '../types/feed.ts'
import { redditAdapter } from './reddit.ts'
import { rssAdapter } from './rss.ts'
import { seedAdapter } from './seed.ts'

export const sources: SourceAdapter[] = [
  seedAdapter,
  ...(config.reddit.enabled ? [redditAdapter] : []),
  ...(config.rss.enabled ? [rssAdapter] : []),
]

export { seedAdapter, redditAdapter, rssAdapter }
