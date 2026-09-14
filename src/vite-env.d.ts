interface ImportMetaEnv {
  readonly VITE_ENABLE_REDDIT?: string
  readonly VITE_REDDIT_SUBREDDIT?: string
  readonly VITE_REDDIT_SORT?: string
  readonly VITE_REDDIT_QUERY?: string
  readonly VITE_ENABLE_RSS?: string
  readonly VITE_RSS_FEED_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
