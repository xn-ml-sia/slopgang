import { useState } from 'react'
import type { FeedItem } from '../types/feed.ts'
import { TAG_LABEL } from '../lib/tags.ts'
import { formatStamp } from '../lib/time.ts'
import { normalizeMediaUrl } from '../lib/text.ts'

function courseTitle(title: string): string {
  return title.replace(/^Specimen\s+\d+\s+[—–-]\s+/i, '')
}

function courseNo(index: number): string {
  return String(index + 1).padStart(2, '0')
}

function SwatchPlate({ item, large }: { item: FeedItem; large?: boolean }) {
  const className = `course-plate plate-swatch${large ? ' is-image' : ''}`
  if (item.palette?.length) {
    return (
      <div className={className} aria-hidden="true">
        {item.palette.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </div>
    )
  }
  return (
    <div className={`course-plate plate-text${large ? ' is-image' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

function ImagePlate({ item, url, eager }: { item: FeedItem; url: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)

  if (failed) return <SwatchPlate item={item} large />

  return (
    <a className="course-plate is-image" href={item.url} target="_blank" rel="noreferrer">
      <img
        src={url}
        alt={item.media?.alt ?? item.title}
        width={item.media?.width}
        height={item.media?.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </a>
  )
}

export function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  const marked = item.tags.includes('counter-slop')
  const specimen = item.id.split(':').pop() ?? item.id
  const mediaUrl = normalizeMediaUrl(item.media?.url)

  return (
    <article className={`course source-${item.source}${mediaUrl ? ' has-image' : ' has-swatch'}`}>
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
        {mediaUrl ? <ImagePlate item={item} url={mediaUrl} eager={index < 2} /> : null}
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

      {mediaUrl ? null : <SwatchPlate item={item} />}
    </article>
  )
}
