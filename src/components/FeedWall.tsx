import { arrangedSpecimens, shapeFor, shortTitle, type ArchiveRecord, type FeedShape } from '../data/feed.ts'

export function FeedWall() {
  const items = arrangedSpecimens()

  return (
    <section className="feed-wall" id="feed" aria-label="Specimen feed">
      {items.map((item, index) => (
        <Tile key={item.id} item={item} shape={shapeFor(item.id, index)} />
      ))}
    </section>
  )
}

function Tile({ item, shape }: { item: ArchiveRecord; shape: FeedShape }) {
  const title = shortTitle(item.title)
  const label = item.caption ? `${title}. ${item.caption}` : title

  return (
    <a
      className={`feed-tile shape-${shape}`}
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
    >
      <TileFace item={item} title={title} />
      <span className="feed-meta">
        <strong>{title}</strong>
        {item.caption ? <em>{item.caption}</em> : null}
      </span>
    </a>
  )
}

function TileFace({ item, title }: { item: ArchiveRecord; title: string }) {
  if (item.media?.url) {
    return (
      <img
        src={item.media.url}
        alt={item.media.alt ?? title}
        width={item.media.width ?? 960}
        height={item.media.height ?? 540}
        loading="lazy"
        decoding="async"
      />
    )
  }

  if (item.palette && item.palette.length > 0) {
    return (
      <div className="feed-swatch" aria-hidden="true">
        {item.palette.map((color, i) => (
          <span key={`${item.id}-${color}-${i}`} style={{ background: color }} />
        ))}
      </div>
    )
  }

  return (
    <div className="feed-text">
      <p>{item.body ?? item.caption ?? title}</p>
    </div>
  )
}
