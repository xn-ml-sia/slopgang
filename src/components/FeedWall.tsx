import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { arrangedSpecimens, shortTitle, specimenPath, type ArchiveRecord } from '../data/feed.ts'


export function FeedWall() {
  const items = useMemo(() => newestFirst(arrangedSpecimens()), [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [box, setBox] = useState({ w: 1200, h: 800 })
  const wrapRef = useRef<HTMLElement>(null)
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

  useLayoutEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const measure = () => setBox({ w: node.clientWidth - parseFloat(getComputedStyle(node).paddingLeft) - parseFloat(getComputedStyle(node).paddingRight), h: Math.max(320, window.innerHeight - node.getBoundingClientRect().top - 24) })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const grid = useMemo(() => layoutGrid(items, box.w, box.h), [items, box.w, box.h])

  return (
    <section ref={wrapRef} className="halftone-wrap" id="feed" aria-label="Specimen feed" onPointerLeave={() => setActiveId(null)}>
      <div
        className="halftone"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${grid.pitch}px)`,
          gridAutoRows: `${grid.pitch}px`,
        }}
      >
        {items.map((item, rank) => {
          const cell = grid.cells[rank]
          const r = rand(hash(item.id))
          r()
          const motion = motionFor(r())
          return (
            <a
              key={item.id}
              className={`cell${item.id === activeId ? ' is-active' : ''}`}
              href={specimenPath(item.id)}
              aria-label={`${shortTitle(item.title)}, ${item.timestamp.slice(0, 4)}`}
              style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
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
              <span
                className={`sq m-${motion}`}
                style={{
                  width: `${cell.size}px`,
                  height: `${cell.size}px`,
                  ['--dur' as string]: `${(8 + r() * 10).toFixed(2)}s`,
                  ['--delay' as string]: `${(r() * 12).toFixed(2)}s`,
                  ['--dx' as string]: `${(r() * 4 - 2).toFixed(1)}px`,
                  ['--dy' as string]: `${(r() * 4 - 2).toFixed(1)}px`,
                }}
              >
                <img
                  src={thumbSrc(item, cell.size >= 48 ? 4 : 1)}
                  alt=""
                  loading={rank < 40 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(event) => {
                    const fallback = previewImage(item)?.src
                    if (fallback && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback
                  }}
                />
              </span>
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

type Cell = { col: number; row: number; size: number }

/** Regular grid sized to the viewport; one plate per cell, seeded shuffle for placement,
 *  square size from a smooth halftone field (diagonal gradient x radial void with an arc). */
function layoutGrid(items: ArchiveRecord[], w: number, h: number): { cols: number; pitch: number; cells: Cell[] } {
  const n = items.length
  const aspect = Math.max(0.3, w / h)
  const cols = Math.max(6, Math.min(n, Math.round(Math.sqrt(n * aspect))))
  const rows = Math.ceil(n / cols)
  const pitch = Math.max(12, Math.floor(Math.min(w / cols, (h * 1.1) / rows, 112)))
  const field = rand(hash('slopgang-field-v1'))
  const angle = Math.PI * (0.15 + field() * 0.2) // light from the upper right
  const dir = { x: Math.cos(angle), y: -Math.sin(angle) }
  const void0 = { x: 0.35 + field() * 0.15, y: 0.6 + field() * 0.15 }
  const voidR = 0.24 + field() * 0.06
  const order = items.map((item, i) => ({ i, k: hash(`slot-${item.id}`) })).sort((a, b) => a.k - b.k)
  const cells: Cell[] = new Array(n)
  order.forEach(({ i }, slot) => {
    const col = slot % cols
    const row = Math.floor(slot / cols)
    const u = cols > 1 ? col / (cols - 1) : 0.5
    const v = rows > 1 ? row / (rows - 1) : 0.5
    const grad = clamp01(0.5 + ((u - 0.5) * dir.x + (v - 0.5) * dir.y) * 1.25)
    const d = Math.hypot((u - void0.x) * aspect * 0.8, v - void0.y)
    const hole = smooth(voidR, voidR + 0.3, d)
    const arc = Math.exp(-(((d - voidR - 0.06) / 0.06) ** 2)) * 0.55
    const t = clamp01(grad * hole + arc * (0.4 + grad))
    const size = Math.max(4, Math.round(pitch * 0.9 * t))
    cells[i] = { col, row, size }
  })
  return { cols, pitch, cells }
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

function smooth(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
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
