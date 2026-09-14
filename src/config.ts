function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === '') return fallback
  return !['0', 'false', 'off', 'no'].includes(value.toLowerCase())
}

export const config = {
  reddit: {
    enabled: envFlag(import.meta.env.VITE_ENABLE_REDDIT, true),
    subreddit: import.meta.env.VITE_REDDIT_SUBREDDIT?.trim() || 'midjourney',
    sort: import.meta.env.VITE_REDDIT_SORT?.trim() || 'hot',
    query: import.meta.env.VITE_REDDIT_QUERY?.trim() || '',
  },
  rss: {
    enabled: envFlag(import.meta.env.VITE_ENABLE_RSS, true),
    url: import.meta.env.VITE_RSS_FEED_URL?.trim() || 'https://www.404media.co/rss/',
  },
} as const
