import { useRef, type RefObject } from 'react'
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const title = shortTitle(item.title)
  const label = item.caption ? `${title}. ${item.caption}` : title
  const isVideo = item.media?.type === 'video'

  function startPreview() {
    if (!isVideo) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const video = videoRef.current
    if (!video) return
    video.muted = true
    void video.play().catch(() => {})
  }

  function stopPreview() {
    const video = videoRef.current
    if (!video) return
    video.pause()
    try {
      video.currentTime = 0
    } catch {
      /* ignore if metadata is not ready */
    }
  }

  return (
    <a
      className={`feed-tile shape-${shape}${isVideo ? ' has-video' : ''}`}
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
    >
      <TileFace item={item} title={title} videoRef={videoRef} />
      <span className="feed-meta">
        <strong>{title}</strong>
        {item.caption ? <em>{item.caption}</em> : null}
      </span>
    </a>
  )
}

function TileFace({
  item,
  title,
  videoRef,
}: {
  item: ArchiveRecord
  title: string
  videoRef: RefObject<HTMLVideoElement | null>
}) {
  if (item.media?.type === 'video' && item.media.url) {
    return (
      <video
        ref={(node) => {
          videoRef.current = node
          if (node) node.muted = true
        }}
        src={item.media.url}
        poster={item.media.poster}
        width={item.media.width ?? 960}
        height={item.media.height ?? 540}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label={item.media.alt ?? title}
      />
    )
  }

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
