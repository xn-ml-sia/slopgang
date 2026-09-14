import { useCallback, useEffect, useMemo, useState } from 'react'
import { SourceFetchError } from '../lib/errors.ts'
import { sources } from '../sources/registry.ts'
import type { FeedItem, SlopTag, SourceHealth, SourceId, SourceStatus } from '../types/feed.ts'
import { compareNewest } from '../lib/time.ts'

export type SortMode = 'newest' | 'mixed'
export type SourceFilter = 'all' | SourceId
export type TagFilter = 'all' | SlopTag

const PAGE = 9

function mixBySource(items: FeedItem[]): FeedItem[] {
  const buckets = new Map<SourceId, FeedItem[]>()
  for (const item of items) {
    const list = buckets.get(item.source) ?? []
    list.push(item)
    buckets.set(item.source, list)
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => compareNewest(a.timestamp, b.timestamp))
  }
  const keys = [...buckets.keys()]
  const result: FeedItem[] = []
  let added = true
  while (added) {
    added = false
    for (const key of keys) {
      const next = buckets.get(key)?.shift()
      if (next) {
        result.push(next)
        added = true
      }
    }
  }
  return result
}

function emptyStatus(): SourceStatus[] {
  return sources.map((source) => ({
    id: source.id,
    label: source.label,
    health: 'loading',
    count: 0,
  }))
}

export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [statuses, setStatuses] = useState<SourceStatus[]>(emptyStatus)
  const [sort, setSort] = useState<SortMode>('newest')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [tagFilter, setTagFilter] = useState<TagFilter>('all')
  const [visible, setVisible] = useState(PAGE)
  const [redditCursor, setRedditCursor] = useState<string | undefined>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const patchStatus = useCallback((id: SourceId, patch: Partial<SourceStatus>) => {
    setStatuses((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setInitializing(true)
      setItems([])
      setStatuses(emptyStatus())

      await Promise.all(
        sources.map(async (source) => {
          try {
            const page = await source.fetch()
            if (cancelled) return
            setItems((prev) => [...prev, ...page.items])
            if (source.id === 'reddit') setRedditCursor(page.nextCursor)
            patchStatus(source.id, {
              health: 'live',
              label: source.id === 'rss' ? (page.items[0]?.sourceLabel ?? source.label) : source.label,
            })
          } catch (err) {
            if (cancelled) return
            const kind: SourceHealth =
              err instanceof SourceFetchError && err.kind === 'blocked' ? 'blocked' : 'error'
            patchStatus(source.id, {
              health: kind,
              count: 0,
              detail: err instanceof Error ? err.message : 'failed',
            })
          }
        }),
      )

      if (cancelled) return
      setVisible(PAGE)
      setInitializing(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [patchStatus])

  const ordered = useMemo(() => {
    if (sort === 'mixed') return mixBySource(items)
    return [...items].sort((a, b) => compareNewest(a.timestamp, b.timestamp))
  }, [items, sort])

  const filtered = useMemo(() => {
    return ordered.filter((item) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false
      if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false
      return true
    })
  }, [ordered, sourceFilter, tagFilter])

  const shown = filtered.slice(0, visible)
  const hasLocalMore = visible < filtered.length
  const reddit = statuses.find((row) => row.id === 'reddit')
  const canFetchReddit = Boolean(redditCursor) && reddit?.health === 'live'

  const loadMore = useCallback(async () => {
    if (hasLocalMore) {
      setVisible((n) => n + PAGE)
      return
    }
    if (!canFetchReddit || loadingMore) return
    const redditSource = sources.find((source) => source.id === 'reddit')
    if (!redditSource || !redditCursor) return
    setLoadingMore(true)
    try {
      const page = await redditSource.fetch(redditCursor)
      setRedditCursor(page.nextCursor)
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id))
        return [...prev, ...page.items.filter((item) => !seen.has(item.id))]
      })
      setStatuses((prev) =>
        prev.map((row) =>
          row.id === 'reddit' ? { ...row, health: 'live', count: row.count + page.items.length } : row,
        ),
      )
      setVisible((n) => n + PAGE)
    } catch (err) {
      patchStatus('reddit', {
        health: err instanceof SourceFetchError && err.kind === 'blocked' ? 'blocked' : 'error',
        detail: err instanceof Error ? err.message : 'failed',
      })
    } finally {
      setLoadingMore(false)
    }
  }, [canFetchReddit, hasLocalMore, loadingMore, patchStatus, redditCursor])

  const liveCount = items.length
  const allFailed = !initializing && liveCount === 0 && statuses.every((row) => row.health !== 'loading')
  const statusesWithCounts = useMemo(
    () =>
      statuses.map((row) => ({
        ...row,
        count: items.filter((item) => item.source === row.id).length,
      })),
    [items, statuses],
  )

  return {
    initializing,
    allFailed,
    statuses: statusesWithCounts,
    shown,
    filteredCount: filtered.length,
    liveCount,
    hasMore: hasLocalMore || canFetchReddit,
    loadingMore,
    sort,
    setSort: (mode: SortMode) => {
      setSort(mode)
      setVisible(PAGE)
    },
    sourceFilter,
    setSourceFilter: (id: SourceFilter) => {
      setSourceFilter(id)
      setVisible(PAGE)
    },
    tagFilter,
    setTagFilter: (id: TagFilter) => {
      setTagFilter(id)
      setVisible(PAGE)
    },
    loadMore,
  }
}
