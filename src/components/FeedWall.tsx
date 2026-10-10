import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { arrangedSpecimens, shortTitle, specimenPath, type ArchiveRecord } from '../data/feed.ts'


export function FeedWall() {
  const items = useMemo(() => newestFirst(arrangedSpecimens()), [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const point = useRef({ x: 0, y: 0 })
  const active = items.find((item) => item.id === activeId) ?? null

  function place(x: number, y: number) {
    point.current = { x, y }
    if (previewRef.current) positionPreview(previewRef.current, x, y)
  }

  useLayoutEffect(() => {
    if (activeId && previewRef.current) positionPreview(previewRef.current, point.current.x, point.current.y)
  }, [activeId])

  return (
    <section className="mosaic-wrap" id="feed" aria-label="Specimen feed" onPointerLeave={() => setActiveId(null)}>
      <div className="mosaic">
        {items.map((item, rank) => {
          const tier = tierFor(rank)
          const r = rand(hash(item.id))
          return (
            <a
              key={item.id}
              className={`tile t${tier}${item.id === activeId ? ' is-active' : ''}`}
              href={specimenPath(item.id)}
              aria-label={`${shortTitle(item.title)}, ${item.timestamp.slice(0, 4)}`}
              style={{
                ['--i' as string]: String(rank),
                ['--breathe-delay' as string]: `${(-r() * 9).toFixed(2)}s`,
                ['--breathe-dur' as string]: `${(7 + r() * 5).toFixed(2)}s`,
                ['--flicker-delay' as string]: `${(r() * 24).toFixed(2)}s`,
                ['--flicker-dur' as string]: `${(14 + r() * 18).toFixed(2)}s`,
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
              <img
                src={thumbSrc(item, tier)}
                alt=""
                loading={rank < 24 ? 'eager' : 'lazy'}
                decoding="async"
                onError={(event) => {
                  const fallback = previewImage(item)?.src
                  if (fallback && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback
                }}
              />
            </a>
          )
        })}
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

/** Size = attention. Rank 0 is the newest plate. Returns the tile side in 16px units. */
const TIERS: Array<[count: number, units: number]> = [
  [1, 16],
  [5, 8],
  [15, 4],
  [30, 2],
]
function tierFor(rank: number): number {
  let start = 0
  for (const [count, units] of TIERS) {
    if (rank < start + count) return units
    start += count
  }
  return 1
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

function thumbSrc(item: ArchiveRecord, units: number): string {
  const id = /sg-\d+/i.exec(item.id)?.[0]?.toLowerCase()
  if (id) return `/archive/${units >= 4 ? 'md' : 'px'}/${id}.webp`
  return previewImage(item)?.src ?? ''
}

function previewImage(item: ArchiveRecord): { src: string; width?: number; height?: number } | null {
  const media = item.media
  if (!media) return null
  if (media.type === 'video') return media.poster ? { src: media.poster, width: media.width, height: media.height } : null
  return media.url ? { src: media.url, width: media.width, height: media.height } : null
}
