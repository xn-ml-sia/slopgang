import { useFeed, type SortMode, type SourceFilter, type TagFilter } from '../hooks/useFeed.ts'
import type { SourceHealth, SourceStatus } from '../types/feed.ts'
import { FeedCard } from './FeedCard.tsx'

const SOURCE_OPTIONS: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'All sources' },
  { id: 'archive', label: 'Archive' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'rss', label: 'RSS' },
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
  if (health === 'loading') return 'collecting'
  if (health === 'idle') return 'idle'
  return 'error'
}

function SourceLeds({ statuses }: { statuses: SourceStatus[] }) {
  return (
    <ul className="leds">
      {statuses.map((row) => (
        <li key={row.id} className={`led led-${row.health}`} title={row.detail}>
          <span className="led-dot" />
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
  const redditOn = feed.statuses.some((row) => row.id === 'reddit')
  const rssOn = feed.statuses.some((row) => row.id === 'rss')
  const sourceOptions = SOURCE_OPTIONS.filter((option) => {
    if (option.id === 'reddit') return redditOn
    if (option.id === 'rss') return rssOn
    return true
  })

  return (
    <main id="feed" className="feed-wrap">
      <div className="toolbar">
        <div className="toolbar-lead">
          <h2 className="toolbar-title">Evidence of slop</h2>
          <p className="toolbar-count">
            {feed.initializing
              ? 'Collecting specimens…'
              : `${feed.shown.length} showing · ${feed.filteredCount} in slice · ${feed.liveCount} captured`}
          </p>
        </div>
        <SourceLeds statuses={feed.statuses} />
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

      <section className="grid" aria-live="polite">
        {feed.initializing && feed.shown.length === 0
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="card skeleton" />)
          : feed.shown.map((item) => <FeedCard key={item.id} item={item} />)}
      </section>

      <div className="more">
        {feed.hasMore ? (
          <button type="button" className="load-more" onClick={() => void feed.loadMore()} disabled={feed.loadingMore}>
            {feed.loadingMore ? 'Developing…' : 'Load more specimens'}
          </button>
        ) : !feed.initializing && feed.filteredCount > 0 ? (
          <p className="end-rule">End of current capture.</p>
        ) : null}
      </div>
    </main>
  )
}
