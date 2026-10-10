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
          const r = rand(hash(item.id))
          const tier = tierFor(r())
          const motion = motionFor(r())
          return (
            <a
              key={item.id}
              className={`tile t${tier} m-${motion}${item.id === activeId ? ' is-active' : ''}`}
              href={specimenPath(item.id)}
              aria-label={`${shortTitle(item.title)}, ${item.timestamp.slice(0, 4)}`}
              style={{
                order: Math.floor(r() * 100000),
                ['--dur' as string]: `${(8 + r() * 10).toFixed(2)}s`,
                ['--delay' as string]: `${(r() * 12).toFixed(2)}s`,
                ['--dx' as string]: `${(r() * 4 - 2).toFixed(1)}px`,
                ['--dy' as string]: `${(r() * 4 - 2).toFixed(1)}px`,
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

/** Chaos: each plate gets a seeded random tier (16px units). 1 = 16px ... 16 = 256px. */
function tierFor(x: number): number {
  if (x < 0.03) return 16
  if (x < 0.1) return 8
  if (x < 0.3) return 4
  if (x < 0.6) return 2
  return 1
}

/** Roughly half the squares stay still; the rest get one seeded motion type.
 *  Every type is built on the 12 principles (see keyframes in index.css). */
const MOTIONS = ['hop', 'tilt', 'pop', 'nudge'] as const
function motionFor(x: number): string {
  if (x < 0.5) return 'still'
  return MOTIONS[Math.min(MOTIONS.length - 1, Math.floor((x - 0.5) * 2 * MOTIONS.length))]
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
