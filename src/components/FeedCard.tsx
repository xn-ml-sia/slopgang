import type { FeedItem } from '../types/feed.ts'
import { TAG_LABEL } from '../lib/tags.ts'
import { formatStamp } from '../lib/time.ts'

function courseTitle(title: string): string {
  return title.replace(/^Specimen\s+\d+\s+[—–-]\s+/i, '')
}

function courseNo(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  const marked = item.tags.includes('counter-slop')
  const specimen = item.id.split(':').pop() ?? item.id

  return (
    <article className={`course source-${item.source}`}>
      <p className="course-no">
        <span>{courseNo(index)}</span>
        {marked ? (
          <span className="star" title="Counter-slop">
            *
          </span>
        ) : null}
      </p>

      <div className="course-body">
        <h3 className="course-title">
          <a href={item.url} target="_blank" rel="noreferrer">
            {courseTitle(item.title)}
          </a>
        </h3>
        {item.caption ? <p className="course-caption">{item.caption}</p> : null}
        {item.body ? <p className="course-copy">{item.body}</p> : null}
        <p className="course-meta">
          <span>{item.sourceLabel}</span>
          {item.tags.map((tag) => (
            <span key={tag}>{TAG_LABEL[tag].toLowerCase()}</span>
          ))}
          {item.author ? <span>{item.author}</span> : null}
          <time dateTime={item.timestamp}>{formatStamp(item.timestamp)}</time>
          <span>{specimen}</span>
        </p>
      </div>

      {item.media ? (
        <a className="course-plate" href={item.url} target="_blank" rel="noreferrer">
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
        <div className="course-plate plate-swatch" aria-hidden="true">
          {item.palette.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </div>
      ) : (
        <div className="course-plate plate-text" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
    </article>
  )
}
