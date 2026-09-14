interface ImportMetaEnv {
  readonly VITE_ENABLE_REDDIT?: string
  readonly VITE_REDDIT_SUBREDDIT?: string
  readonly VITE_REDDIT_SORT?: string
  readonly VITE_REDDIT_QUERY?: string
  readonly VITE_ENABLE_RSS?: string
  readonly VITE_RSS_FEED_URL?: string
  readonly VITE_ENABLE_X?: string
  readonly VITE_X_HANDLE?: string
  readonly VITE_X_QUERY?: string
  readonly VITE_X_RSS_URL?: string
  readonly VITE_ENABLE_INSTAGRAM?: string
  readonly VITE_INSTAGRAM_USERNAME?: string
  readonly VITE_INSTAGRAM_HASHTAG?: string
  readonly VITE_INSTAGRAM_RSS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
