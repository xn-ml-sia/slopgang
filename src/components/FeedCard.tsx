import type { FeedItem } from '../types/feed.ts'
import { TAG_LABEL } from '../lib/tags.ts'
import { formatStamp } from '../lib/time.ts'

export function FeedCard({ item }: { item: FeedItem }) {
  const primaryTag = item.tags[0]
  const specimen = item.id.split(':').pop() ?? item.id

  return (
    <article className={`card source-${item.source}`}>
      <header className="card-meta">
        <span className="card-source">{item.sourceLabel}</span>
        <time dateTime={item.timestamp}>{formatStamp(item.timestamp)}</time>
      </header>

      {item.media ? (
        <a className="card-figure" href={item.url} target="_blank" rel="noreferrer">
          <img
            src={item.media.url}
            alt={item.media.alt ?? item.title}
            width={item.media.width}
            height={item.media.height}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </a>
      ) : item.palette ? (
        <div className="plate" aria-hidden="true">
          {item.palette.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </div>
      ) : (
        <div className="plate plate-text" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      <div className="card-body">
        <p className="card-kicker">
          {primaryTag ? TAG_LABEL[primaryTag] : 'Note'} · {specimen}
        </p>
        <h2 className="card-title">
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
        </h2>
        {item.caption ? <p className="card-caption">{item.caption}</p> : null}
        {item.body ? <p className="card-copy">{item.body}</p> : null}
        <ul className="card-tags">
          {item.tags.map((tag) => (
            <li key={tag}>{TAG_LABEL[tag]}</li>
          ))}
          {item.author ? <li className="card-author">{item.author}</li> : null}
        </ul>
      </div>
    </article>
  )
}
