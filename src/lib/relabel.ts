import type { FeedItem, SourceId } from '../types/feed.ts'

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => {
    const value = vars[key] ?? ''
    return value ? encodeURIComponent(value) : ''
  })
}

export function canonicalSocialUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (host === 'twitter.com' || host === 'www.twitter.com' || host === 'mobile.twitter.com') {
      parsed.hostname = 'x.com'
      return parsed.toString()
    }
    if (host === 'nitter.net' || host.startsWith('nitter.') || host.includes('nitter')) {
      return `https://x.com${parsed.pathname}${parsed.search}`
    }
    return url
  } catch {
    return url
  }
}

export function relabelSource(items: FeedItem[], source: SourceId, sourceLabel: string): FeedItem[] {
  return items.map((item) => ({
    ...item,
    id: `${source}:${item.id.replace(/^[^:]+:/, '')}`,
    source,
    sourceLabel,
    url: source === 'x' ? canonicalSocialUrl(item.url) : item.url,
  }))
}
