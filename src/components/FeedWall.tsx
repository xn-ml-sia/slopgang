import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { arrangedSpecimens, shortTitle, specimenPath, type ArchiveRecord } from '../data/feed.ts'


export function FeedWall() {
  const items = useMemo(() => newestFirst(arrangedSpecimens()), [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [box, setBox] = useState({ w: 1200, h: 800 })
  const wrapRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const measure = () =>
      setBox({
        w: document.documentElement.clientWidth,
        h: Math.max(320, window.innerHeight - node.getBoundingClientRect().top - window.scrollY - 24),
      })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const grid = useMemo(() => layoutGrid(items, box.w, box.h), [items, box.w, box.h])
  const colW = box.w / grid.cols
  const tile = Math.round(Math.min(grid.pitch, colW) * 4)
  const activeRank = activeId ? items.findIndex((item) => item.id === activeId) : -1
  const activeCell = activeRank >= 0 ? grid.cells[activeRank] : null

  // Displacement field: every other cell is pushed radially away from the expanded tile.
  // Transform-only, applied straight to the DOM so 150 nodes never re-render per hover.
  useLayoutEffect(() => {
    const root = gridRef.current
    if (!root) return
    const nodes = root.querySelectorAll<HTMLElement>('[data-c]')
    if (!activeCell) {
      nodes.forEach((node) => {
        node.style.transform = ''
      })
      return
    }
    const unit = Math.min(grid.pitch, colW)
    const half = tile / 2
    const gridH = grid.rows * grid.pitch
    const ax = (activeCell.col + 0.5) * colW
    const ay = (activeCell.row + 0.5) * grid.pitch
    const tx = Math.min(Math.max(ax, half + 4), box.w - half - 4)
    const ty = Math.min(Math.max(ay, half + 4), Math.max(half + 4, gridH - half - 4))
    const reach = half + unit * 0.55
    nodes.forEach((node) => {
      const c = Number(node.dataset.c)
      const r = Number(node.dataset.r)
      const cx = (c + 0.5) * colW
      const cy = (r + 0.5) * grid.pitch
      if (c === activeCell.col && r === activeCell.row) {
        node.style.transform = `translate3d(${tx - ax}px, ${ty - ay}px, 0)`
        return
      }
      const dx = cx - tx
      const dy = cy - ty
      const dc = Math.max(Math.abs(dx), Math.abs(dy), 1)
      // Square (Chebyshev) metric so the 4x4 tile's footprint is cleared; push decays with distance.
      const target = dc + reach * Math.exp(-dc / (unit * 3))
      const k = target / dc - 1
      node.style.transform = `translate3d(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px, 0)`
    })
  }, [activeCell, grid, colW, tile, box.w])

  return (
    <section
      ref={wrapRef}
      className={`halftone-wrap${activeCell ? ' is-open' : ''}`}
      id="feed"
      aria-label="Specimen feed"
      onPointerLeave={() => setActiveId(null)}
    >
      <div
        ref={gridRef}
        className="halftone"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridAutoRows: `${grid.pitch}px`,
        }}
      >
        {items.map((item, rank) => {
          const cell = grid.cells[rank]
          const r = rand(hash(item.id))
          r()
          const motion = motionFor(r())
          const open = item.id === activeId
          const size = open ? tile : cell.size
          return (
            <a
              key={item.id}
              data-c={cell.col}
              data-r={cell.row}
              className={`cell${open ? ' is-active' : ''}`}
              href={specimenPath(item.id)}
              aria-label={`${shortTitle(item.title)}, ${item.timestamp.slice(0, 4)}`}
              style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
              onPointerEnter={(event) => {
                if (canHover(event.pointerType)) setActiveId(item.id)
              }}
              onFocus={() => {
                if (hoverCapable()) setActiveId(item.id)
              }}
              onBlur={() => setActiveId((current) => (current === item.id ? null : current))}
            >
              <span
                className={`sq m-${open ? 'still' : motion}`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  ['--dur' as string]: `${(8 + r() * 10).toFixed(2)}s`,
                  ['--delay' as string]: `${(r() * 12).toFixed(2)}s`,
                  ['--dx' as string]: `${(r() * 4 - 2).toFixed(1)}px`,
                  ['--dy' as string]: `${(r() * 4 - 2).toFixed(1)}px`,
                }}
              >
                <img
                  src={thumbSrc(item, open || cell.size >= 48 ? 4 : 1)}
                  alt=""
                  loading={rank < 40 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(event) => {
                    const fallback = previewImage(item)?.src
                    if (fallback && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback
                  }}
                />
                {open ? (
                  <span className="sq-caption" aria-hidden="true">
                    <strong>{shortTitle(item.title)}</strong>
                    <span>{item.caption ?? item.timestamp.slice(0, 10)}</span>
                  </span>
                ) : null}
              </span>
            </a>
          )
        })}
        {grid.fillers.map((cell) => (
          <span
            key={`f-${cell.col}-${cell.row}`}
            data-c={cell.col}
            data-r={cell.row}
            className="cell cell-filler"
            aria-hidden="true"
            style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
          >
            <span
              className={`sq m-${cell.motion}`}
              style={{
                width: `${cell.size}px`,
                height: `${cell.size}px`,
                ['--dur' as string]: `${cell.dur.toFixed(2)}s`,
                ['--delay' as string]: `${cell.delay.toFixed(2)}s`,
                ['--dx' as string]: `${cell.dx.toFixed(1)}px`,
              }}
            />
          </span>
        ))}
      </div>
    </section>
  )
}

type Cell = { col: number; row: number; size: number }

/** Regular grid sized to the viewport; one plate per cell, seeded shuffle for placement,
 *  square size from a halftone field: gradient outside, a sharp bright ring, a void of dots inside.
 *  Trailing cells of the last row get non-link filler dots that follow the same field. */
function layoutGrid(items: ArchiveRecord[], w: number, h: number) {
  const n = items.length
  // ~25% blank pixels scattered among the plates.
  const want = Math.ceil(n / 0.75)
  const aspect = Math.max(0.3, w / h)
  const cols = Math.max(6, Math.min(want, Math.round(Math.sqrt(want * aspect))))
  const rows = Math.ceil(want / cols)
  const total = cols * rows
  const pitch = Math.max(12, Math.min(w / cols, Math.floor(h / rows)))
  const seed = rand(hash('slopgang-field-v3'))
  // Field in cell units so the ring keeps its shape on any grid.
  // Virtual field larger than the grid: the void sits at the lower-left edge and the ring
  // radius runs past the grid, so the arc is cropped by the viewport like the reference.
  const long = Math.max(cols, rows)
  const portrait = rows > cols
  const jx = seed()
  const jy = seed()
  // Landscape: void below the lower-left, ring sweeps from the top-left to the lower right.
  // Portrait: void past the left edge, ring bows out to the right side and back.
  const cx = portrait ? cols * (-0.1 + jx * 0.05) : cols * (0.2 + jx * 0.06)
  const cy = portrait ? rows * (0.68 + jy * 0.04) : rows * (1.0 + jy * 0.05)
  const R = portrait ? cols * 0.95 : long * 0.55
  const band = Math.max(0.8, R * 0.15)
  const fieldSize = (col: number, row: number) => {
    const d = Math.hypot(col - cx, row - cy)
    const ring = Math.exp(-(((d - R) / band) ** 2))
    const u = cols > 1 ? col / (cols - 1) : 0.5
    const v = rows > 1 ? row / (rows - 1) : 0.5
    const grad = 0.18 + 0.5 * clamp01(0.5 + (u - v) * 0.8)
    const t = d < R ? 0.04 + 0.96 * ring : Math.max(ring, grad * smooth(R, R + band * 2.5, d))
    return Math.max(4, Math.round(pitch * 0.9 * clamp01(t)))
  }
  const at = (slot: number): Cell => {
    const col = slot % cols
    const row = Math.floor(slot / cols)
    return { col, row, size: fieldSize(col, row) }
  }
  const shuffledSlots = Array.from({ length: total }, (_, i) => i).map((i) => ({ i, k: rand(hash(`blank-${i}`))() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.i)
  const blankSlots = shuffledSlots.slice(0, total - n).sort((a, b) => a - b)
  const plateSlots = shuffledSlots.slice(total - n).sort((a, b) => a - b)
  const order = items.map((item, i) => ({ i, k: hash(`slot-${item.id}`) })).sort((a, b) => a.k - b.k)
  const cells: Cell[] = new Array(n)
  order.forEach(({ i }, k) => {
    cells[i] = at(plateSlots[k])
  })
  const fillers = blankSlots.map((slot) => {
    const r = rand(hash(`blank-motion-${slot}`))
    return {
      ...at(slot),
      motion: motionFor(r()),
      dur: 8 + r() * 10,
      delay: r() * 12,
      dx: r() * 4 - 2,
    }
  })
  return { cols, rows, pitch, cells, fillers }
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
