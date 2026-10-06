import { useState } from 'react'
import {
  arrangedSpecimens,
  catalogueLabel,
  shortTitle,
  specimenPath,
  type ArchiveRecord,
} from '../data/feed.ts'

export function FeedWall() {
  const items = arrangedSpecimens()
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = items.find((item) => item.id === activeId) ?? null

  return (
    <section
      className="feed-index"
      id="feed"
      aria-label="Specimen feed"
      onPointerLeave={() => setActiveId(null)}
    >
      <ol className="feed-list">
        {items.map((item) => (
          <li key={item.id}>
            <a
              className={`feed-row${item.id === activeId ? ' is-active' : ''}`}
              href={specimenPath(item.id)}
              aria-label={rowLabel(item)}
              onPointerEnter={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              onBlur={() => setActiveId((current) => (current === item.id ? null : current))}
            >
              <span className="feed-row-num">{catalogueLabel(item.id)}</span>
              <span className="feed-row-name">{shortTitle(item.title)}</span>
              <span className="feed-row-caption">{item.caption}</span>
              <span className="feed-row-year">{item.timestamp.slice(0, 4)}</span>
            </a>
          </li>
        ))}
      </ol>
      <FeedPreview item={active} />
    </section>
  )
}

function FeedPreview({ item }: { item: ArchiveRecord | null }) {
  const image = item ? previewImage(item) : null
  const title = item ? shortTitle(item.title) : ''

  return (
    <aside className={`feed-preview${image ? ' is-on' : ''}`} aria-hidden="true">
      {image ? (
        <figure className="feed-preview-plate">
          <img src={image.src} alt="" width={image.width} height={image.height} />
          <figcaption>
            <strong>{title}</strong>
            {item?.caption ? <span>{item.caption}</span> : null}
          </figcaption>
        </figure>
      ) : null}
    </aside>
  )
}

function rowLabel(item: ArchiveRecord): string {
  const title = shortTitle(item.title)
  const bits = [catalogueLabel(item.id), title]
  if (item.caption) bits.push(item.caption)
  return bits.join('. ')
}

function previewImage(item: ArchiveRecord): { src: string; width?: number; height?: number } | null {
  const media = item.media
  if (!media) return null
  if (media.type === 'video') {
    if (!media.poster) return null
    return { src: media.poster, width: media.width, height: media.height }
  }
  if (!media.url) return null
  return { src: media.url, width: media.width, height: media.height }
}
