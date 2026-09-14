import { config } from '../config.ts'
import { SourceFetchError } from '../lib/errors.ts'
import { parseRss, rssChannelTitle } from '../lib/parseRss.ts'
import type { SourceAdapter, SourcePage } from '../types/feed.ts'

export const rssAdapter: SourceAdapter = {
  id: 'rss',
  label: 'RSS',
  async fetch(): Promise<SourcePage> {
    const params = new URLSearchParams({ url: config.rss.url })
    let res: Response
    try {
      res = await fetch(`/api/rss?${params.toString()}`)
    } catch {
      throw new SourceFetchError('rss', 'RSS proxy unreachable', 'network')
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await res.json()) as { error?: string; status?: number }
      throw new SourceFetchError(
        'rss',
        payload.error === 'invalid_url' ? 'RSS URL rejected' : `RSS upstream failed (${payload.status ?? 'error'})`,
        'network',
      )
    }

    const xml = await res.text()
    if (!xml.trim() || xml.trimStart().startsWith('{')) {
      throw new SourceFetchError('rss', 'RSS feed empty or blocked', 'parse')
    }

    const items = parseRss(xml, rssChannelTitle(xml) ?? 'RSS')
    if (items.length === 0) {
      throw new SourceFetchError('rss', 'No entries in feed', 'parse')
    }
    return { items }
  },
}
