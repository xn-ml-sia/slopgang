import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { arrangedSpecimens, shortTitle, specimenPath, type ArchiveRecord } from '../data/feed.ts'

/** Pixel field: every plate is one 16px square scattered in a 2.5D space. */
type Pixel = { item: ArchiveRecord; x: number; y: number; z: number }

export function FeedWall() {
  const items = useMemo(() => newestFirst(arrangedSpecimens()), [])
  const pixels = useMemo(() => scatter(items), [items])
  const [activeId, setActiveId] = useState<string | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const point = useRef({ x: 0, y: 0 })
  const active = items.find((item) => item.id === activeId) ?? null

  function place(x: number, y: number) {
    point.current = { x, y }
    if (previewRef.current) positionPreview(previewRef.current, x, y)
  }

  useLayoutEffect(() => {
    if (activeId && previewRef.current) positionPreview(previewRef.current, point.current.x, point.current.y)
  }, [activeId])

  // Subtle mouse parallax on desktop; none on touch or reduced motion.
  useEffect(() => {
    const field = fieldRef.current
    if (!field || !hoverCapable()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const px = event.clientX / window.innerWidth - 0.5
        const py = event.clientY / window.innerHeight - 0.5
        field.style.setProperty('--px', px.toFixed(3))
        field.style.setProperty('--py', py.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <section className="pixel-field-wrap" id="feed" aria-label="Specimen feed" onPointerLeave={() => setActiveId(null)}>
      <div className="pixel-field" ref={fieldRef} style={{ ['--rows' as string]: String(fieldRows(items.length)) }}>
        {pixels.map(({ item, x, y, z }) => (
          <a
            key={item.id}
            className={`pixel${item.id === activeId ? ' is-active' : ''}`}
            href={specimenPath(item.id)}
            aria-label={`${shortTitle(item.title)}, ${item.timestamp.slice(0, 4)}`}
            style={{
              left: `${(x * 100).toFixed(3)}%`,
              top: `${(y * 100).toFixed(3)}%`,
              ['--z' as string]: z.toFixed(3),
            }}
            onPointerEnter={(event) => {
              if (!canHover(event.pointerType)) return
              setActiveId(item.id)
              place(event.clientX, event.clientY)
            }}
            onPointerMove={(event) => {
              if (canHover(event.pointerType)) place(event.clientX, event.clientY)
            }}
            onFocus={(event) => {
              if (!hoverCapable()) return
              setActiveId(item.id)
              const rect = event.currentTarget.getBoundingClientRect()
              place(rect.right, rect.bottom)
            }}
            onBlur={() => setActiveId((current) => (current === item.id ? null : current))}
          >
            <img src={thumbSrc(item)} alt="" width={16} height={16} loading="lazy" decoding="async"
              onError={(event) => {
                const fallback = previewImage(item)?.src
                if (fallback && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback
              }}
            />
          </a>
        ))}
      </div>
      <FeedPreview
        item={active}
        previewRef={previewRef}
        onImageLoad={() => {
          if (previewRef.current) positionPreview(previewRef.current, point.current.x, point.current.y)
        }}
      />
    </section>
  )
}

function FeedPreview({ item, previewRef, onImageLoad }: {
  item: ArchiveRecord | null
  previewRef: RefObject<HTMLElement | null>
  onImageLoad: () => void
}) {
  const image = item ? previewImage(item) : null
  return (
    <aside ref={previewRef} className={`feed-preview${image ? ' is-on' : ''}`} aria-hidden="true">
      {image && item ? (
        <figure className="feed-preview-plate">
          <img src={image.src} alt="" width={image.width} height={image.height} onLoad={onImageLoad} />
          <figcaption>
            <strong>{shortTitle(item.title)}</strong>
            <span>{item.caption ?? item.timestamp.slice(0, 10)}</span>
          </figcaption>
        </figure>
      ) : null}
    </aside>
  )
}

/** Field height in viewport units: ~40 plates per screen so squares breathe. */
function fieldRows(count: number): number {
  return Math.max(1, Math.ceil(count / 40))
}

/** Deterministic scatter: jittered grid seeded from each id, so no overlaps and a stable layout. */
function scatter(items: ArchiveRecord[]): Pixel[] {
  const cols = 8
  const rows = Math.ceil(items.length / cols)
  // Shuffle cell assignment deterministically so newest-first focus order is not a reading grid.
  const cells = Array.from({ length: cols * rows }, (_, i) => i)
    .map((i) => ({ i, k: hash(`cell-${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((c) => c.i)
  return items.map((item, n) => {
    const cell = cells[n]
    const cx = cell % cols
    const cy = Math.floor(cell / cols)
    const r = rand(hash(item.id))
    const x = (cx + 0.15 + r() * 0.7) / cols
    const y = (cy + 0.15 + r() * 0.7) / rows
    return { item, x: 0.04 + x * 0.92, y: 0.03 + y * 0.94, z: r() }
  })
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function rand(seed: number): () => number {
  let a = seed || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function newestFirst(items: ArchiveRecord[]): ArchiveRecord[] {
  const num = (id: string) => Number(/sg-(\d+)/i.exec(id)?.[1] ?? -1)
  return [...items].sort((a, b) => num(b.id) - num(a.id))
}

function hoverCapable(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function canHover(pointerType: string): boolean {
  return pointerType !== 'touch' && hoverCapable()
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

function thumbSrc(item: ArchiveRecord): string {
  const id = /sg-\d+/i.exec(item.id)?.[0]?.toLowerCase()
  if (id) return `/archive/px/${id}.webp`
  return previewImage(item)?.src ?? ''
}

function previewImage(item: ArchiveRecord): { src: string; width?: number; height?: number } | null {
  const media = item.media
  if (!media) return null
  if (media.type === 'video') return media.poster ? { src: media.poster, width: media.width, height: media.height } : null
  return media.url ? { src: media.url, width: media.width, height: media.height } : null
}
