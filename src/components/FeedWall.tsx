import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import {
  arrangedSpecimens,
  shortTitle,
  specimenPath,
  type ArchiveRecord,
} from '../data/feed.ts'

export function FeedWall() {
  const items = arrangedSpecimens()
  const [activeId, setActiveId] = useState<string | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const point = useRef({ x: 0, y: 0 })
  const active = items.find((item) => item.id === activeId) ?? null

  function place(x: number, y: number) {
    point.current = { x, y }
    const node = previewRef.current
    if (node) positionPreview(node, x, y)
  }

  useLayoutEffect(() => {
    if (!activeId) return
    const node = previewRef.current
    if (!node) return
    positionPreview(node, point.current.x, point.current.y)
  }, [activeId])

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
              onPointerEnter={(event) => {
                setActiveId(item.id)
                place(event.clientX, event.clientY)
              }}
              onPointerMove={(event) => place(event.clientX, event.clientY)}
              onFocus={(event) => {
                setActiveId(item.id)
                const rect = event.currentTarget.getBoundingClientRect()
                place(rect.left + 32, rect.bottom)
              }}
              onBlur={() => setActiveId((current) => (current === item.id ? null : current))}
            >
              <span className="feed-row-name">{shortTitle(item.title)}</span>
              <span className="feed-row-caption">{item.caption}</span>
              <span className="feed-row-year">{item.timestamp.slice(0, 4)}</span>
            </a>
          </li>
        ))}
      </ol>
      <FeedPreview
        item={active}
        previewRef={previewRef}
        onImageLoad={() => {
          const node = previewRef.current
          if (node) positionPreview(node, point.current.x, point.current.y)
        }}
      />
    </section>
  )
}

function FeedPreview({
  item,
  previewRef,
  onImageLoad,
}: {
  item: ArchiveRecord | null
  previewRef: RefObject<HTMLElement | null>
  onImageLoad: () => void
}) {
  const image = item ? previewImage(item) : null
  const title = item ? shortTitle(item.title) : ''

  return (
    <aside ref={previewRef} className={`feed-preview${image ? ' is-on' : ''}`} aria-hidden="true">
      {image ? (
        <figure className="feed-preview-plate">
          <img src={image.src} alt="" width={image.width} height={image.height} onLoad={onImageLoad} />
          <figcaption>
            <strong>{title}</strong>
            {item?.caption ? <span>{item.caption}</span> : null}
          </figcaption>
        </figure>
      ) : null}
    </aside>
  )
}

function positionPreview(node: HTMLElement, x: number, y: number) {
  const pad = 16
  const width = node.offsetWidth
  const height = node.offsetHeight
  let left = x + pad
  let top = y + pad
  const maxX = window.innerWidth - 8
  const maxY = window.innerHeight - 8
  if (left + width > maxX) left = x - width - pad
  if (top + height > maxY) top = y - height - pad
  left = Math.max(8, Math.min(left, Math.max(8, maxX - width)))
  top = Math.max(8, Math.min(top, Math.max(8, maxY - height)))
  node.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`
}

function rowLabel(item: ArchiveRecord): string {
  const bits = [shortTitle(item.title)]
  if (item.caption) bits.push(item.caption)
  bits.push(item.timestamp.slice(0, 4))
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
