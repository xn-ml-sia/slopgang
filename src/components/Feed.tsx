import { useEffect, useRef } from 'react'
import { useFeed, type SortMode, type SourceFilter, type TagFilter } from '../hooks/useFeed.ts'
import type { SourceHealth, SourceStatus } from '../types/feed.ts'
import { FeedCard } from './FeedCard.tsx'

const SOURCE_OPTIONS: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'All sources' },
  { id: 'archive', label: 'Archive' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'rss', label: 'RSS' },
  { id: 'x', label: 'X' },
  { id: 'instagram', label: 'Instagram' },
]

const TAG_OPTIONS: { id: TagFilter; label: string }[] = [
  { id: 'all', label: 'All tags' },
  { id: 'visual-slop', label: 'Visual slop' },
  { id: 'textual-slop', label: 'Textual slop' },
  { id: 'counter-slop', label: 'Counter-slop' },
]

function healthWord(health: SourceHealth): string {
  if (health === 'live') return 'live'
  if (health === 'blocked') return 'blocked'
  if (health === 'unconfigured') return 'unconfigured'
  if (health === 'loading') return 'collecting'
  if (health === 'idle') return 'idle'
  return 'error'
}

function SourceLedger({ statuses }: { statuses: SourceStatus[] }) {
  return (
    <ul className="ledger" id="sources">
      {statuses.map((row) => (
        <li key={row.id} className={`ledger-item is-${row.health}`} title={row.detail}>
          {row.health === 'live' ? <span className="star">*</span> : null}
          <span>
            {row.label}
            {row.health === 'live' ? ` · ${row.count}` : ` · ${healthWord(row.health)}`}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ToggleRow<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: T
  options: { id: T; label: string }[]
  onChange: (next: T) => void
}) {
  return (
    <fieldset className="toggles">
      <legend>{legend}</legend>
      <div className="toggle-row">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={value === option.id ? 'is-on' : undefined}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function Feed() {
  const feed = useFeed()
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasMore, loadingMore, initializing, loadMore } = feed

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && hasMore && !loadingMore && !initializing) {
          void loadMore()
        }
      },
      { rootMargin: '480px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, initializing, loadMore, loadingMore])

  const sourceOptions = SOURCE_OPTIONS.filter((option) => {
    if (option.id === 'all' || option.id === 'archive') return true
    return feed.statuses.some((row) => row.id === option.id)
  })

  return (
    <main id="archive" className="archive">
      <div className="wrap">
        <div className="archive-head">
          <div>
            <p className="overline">The sitting</p>
            <h2 className="archive-title">Specimens</h2>
            <p className="archive-count">
              {feed.initializing
                ? 'Collecting the list…'
                : `${feed.filteredCount} in view · ${feed.liveCount} captured`}
            </p>
          </div>
          <SourceLedger statuses={feed.statuses} />
        </div>

        <div className="filters">
          <ToggleRow<SourceFilter>
            legend="Source"
            value={feed.sourceFilter}
            options={sourceOptions}
            onChange={feed.setSourceFilter}
          />
          <ToggleRow<TagFilter>
            legend="Taxonomy"
            value={feed.tagFilter}
            options={TAG_OPTIONS}
            onChange={feed.setTagFilter}
          />
          <ToggleRow<SortMode>
            legend="Order"
            value={feed.sort}
            options={[
              { id: 'newest', label: 'Chronological' },
              { id: 'mixed', label: 'Mixed' },
            ]}
            onChange={feed.setSort}
          />
        </div>

        {feed.allFailed ? (
          <div className="state state-error">
            <p>No specimens could be collected. The archive seed should load without a network; check the console.</p>
          </div>
        ) : null}

        {!feed.initializing && feed.filteredCount === 0 && !feed.allFailed ? (
          <div className="state">
            <p>No items in this slice. Relax a filter, or wait for a blocked source to come back.</p>
          </div>
        ) : null}

        <section className="menu" aria-live="polite">
          {feed.initializing && feed.shown.length === 0
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="course skeleton" />)
            : feed.shown.map((item, index) => <FeedCard key={item.id} item={item} index={index} />)}
        </section>

        <div className="more">
          {feed.hasMore ? (
            <button type="button" className="btn-ghost" onClick={() => void feed.loadMore()} disabled={feed.loadingMore}>
              {feed.loadingMore ? 'Collecting…' : 'Further specimens'}
            </button>
          ) : !feed.initializing && feed.filteredCount > 0 ? (
            <p className="end-rule">The list ends here, for now.</p>
          ) : null}
          <div ref={sentinel} className="sentinel" />
        </div>
      </div>
    </main>
  )
}
