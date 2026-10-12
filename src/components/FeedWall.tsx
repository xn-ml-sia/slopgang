import { useEffect, useMemo, useRef, useState } from 'react'
import { arrangedSpecimens, shortTitle, specimenPath, type ArchiveRecord } from '../data/feed.ts'

/**
 * HSL point cloud, after the color wall on meodai.github.io/color-names.
 * Each plate is a block placed in an HSL bicone by its thumbnail's mean color:
 * hue = angle, saturation x lightness-distance = radius, lightness = height.
 * DOM blocks, projected in JS with a perspective orbit camera (42deg FOV),
 * slow auto-orbit, drag to orbit, wheel/pinch-free. Depth sets z-order and fog.
 */

type Hsl = [number, number, number]
type Point = { item: ArchiveRecord; p: [number, number, number]; size: number; rank: number }

const R = 100 // bicone radius
const LY = 180 // lightness height
const FOV = (42 * Math.PI) / 180
const DIST = 310

export function FeedWall() {
  const items = useMemo(() => newestFirst(arrangedSpecimens()), [])
  const [colors, setColors] = useState<Record<string, Hsl>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const wrapRef = useRef<HTMLElement>(null)
  const nodes = useRef(new Map<string, HTMLAnchorElement>())
  const cam = useRef({ yaw: Math.random() * Math.PI * 2, pitch: 0.32, drag: null as null | { x: number; y: number; yaw: number; pitch: number; moved: boolean } })
  const activeRef = useRef<string | null>(null)
  activeRef.current = activeId

  // Mean color of each tiny thumbnail, read on load so new plates place themselves.
  useEffect(() => {
    let live = true
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 8
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    Promise.all(
      items.map(
        (item) =>
          new Promise<[string, Hsl]>((resolve) => {
            const img = new Image()
            img.onload = () => {
              try {
                ctx!.drawImage(img, 0, 0, 8, 8)
                const d = ctx!.getImageData(0, 0, 8, 8).data
                let r = 0, g = 0, b = 0
                for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2] }
                const n = d.length / 4
                resolve([item.id, rgbToHsl(r / n, g / n, b / n)])
              } catch {
                resolve([item.id, fallbackHsl(item.id)])
              }
            }
            img.onerror = () => {
              const full = fullSrc(item)
              if (full && !img.src.endsWith(full)) img.src = full
              else resolve([item.id, fallbackHsl(item.id)])
            }
            img.src = thumbSrc(item, 1)
          }),
      ),
    ).then((pairs) => live && setColors(Object.fromEntries(pairs)))
    return () => { live = false }
  }, [items])

  const points = useMemo<Point[]>(() => {
    if (!Object.keys(colors).length) return []
    return items.map((item, rank) => {
      const [h, s, l] = colors[item.id] ?? fallbackHsl(item.id)
      // Small seeded jitter so plates with near-equal colors do not stack.
      const j = rand(hash(item.id))
      const chroma = s * (l < 0.5 ? l : 1 - l) * 2
      const rad = (Math.sqrt(chroma) * 0.9 + 0.08) * R + (j() - 0.5) * 10
      const a = (h * Math.PI) / 180 + (j() - 0.5) * 0.15
      const p: [number, number, number] = [rad * Math.cos(a), (l - 0.5) * LY + (j() - 0.5) * 8, -rad * Math.sin(a)]
      // Newest plates are the largest blocks.
      const size = rank < 6 ? 20 : rank < 24 ? 14 : 10
      return { item, p, size, rank }
    })
  }, [colors, items])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !points.length) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      const c = cam.current
      if (!reduce && !c.drag && !activeRef.current) c.yaw += dt * 0.00008
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      const fpx = h / 2 / Math.tan(FOV / 2)
      const scaleFit = Math.min(1, w / h / 0.75)
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch)
      for (const pt of points) {
        const node = nodes.current.get(pt.item.id)
        if (!node) continue
        const [x, y, z] = pt.p
        const x1 = x * cy - z * sy
        const z1 = x * sy + z * cy
        const y2 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        const depth = DIST - z2
        const k = (fpx / depth) * scaleFit
        const sx = w / 2 + x1 * k
        const syy = h / 2 - y2 * k
        const sz = pt.size * k
        const fog = Math.min(1, Math.max(0.25, 1 - (depth - DIST + 60) / 260))
        node.style.transform = `translate3d(${(sx - sz / 2).toFixed(1)}px, ${(syy - sz / 2).toFixed(1)}px, 0)`
        node.style.width = node.style.height = `${sz.toFixed(1)}px`
        node.style.zIndex = String(Math.round(10000 - depth * 10))
        node.style.opacity = fog.toFixed(2)
      }
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const redraw = () => { if (reduce) requestAnimationFrame(frame) }
    window.addEventListener('resize', redraw)
    ;(wrap as HTMLElement & { _redraw?: () => void })._redraw = redraw
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', redraw) }
  }, [points])

  // Drag to orbit. A tap (no movement) still follows the link.
  function onDown(e: React.PointerEvent) {
    const c = cam.current
    c.drag = { x: e.clientX, y: e.clientY, yaw: c.yaw, pitch: c.pitch, moved: false }
  }
  function onMove(e: React.PointerEvent) {
    const d = cam.current.drag
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 6) return
    d.moved = true
    cam.current.yaw = d.yaw - dx * 0.006
    cam.current.pitch = Math.max(-1.4, Math.min(1.4, d.pitch + dy * 0.006))
    ;(wrapRef.current as (HTMLElement & { _redraw?: () => void }) | null)?._redraw?.()
  }
  function onUp() {
    const d = cam.current.drag
    window.setTimeout(() => { if (cam.current.drag === d) cam.current.drag = null }, 0)
  }
  function onClickCapture(e: React.MouseEvent) {
    if (cam.current.drag?.moved) { e.preventDefault(); e.stopPropagation() }
    cam.current.drag = null
  }

  const active = activeId ? points.find((pt) => pt.item.id === activeId) : null

  return (
    <section
      ref={wrapRef}
      className={`cloud${points.length ? ' is-ready' : ''}`}
      id="feed"
      aria-label="Specimen feed"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => setActiveId(null)}
      onClickCapture={onClickCapture}
    >
      {points.map((pt) => (
        <a
          key={pt.item.id}
          ref={(el) => { if (el) nodes.current.set(pt.item.id, el); else nodes.current.delete(pt.item.id) }}
          className={`block${pt.item.id === activeId ? ' is-active' : ''}`}
          href={specimenPath(pt.item.id)}
          draggable={false}
          aria-label={`${shortTitle(pt.item.title)}, ${pt.item.timestamp.slice(0, 4)}`}
          style={{ ['--in' as string]: `${Math.min(900, pt.rank * 8)}ms` }}
          onPointerEnter={(e) => { if (e.pointerType !== 'touch' && hoverCapable()) setActiveId(pt.item.id) }}
          onPointerLeave={() => setActiveId((cur) => (cur === pt.item.id ? null : cur))}
          onFocus={() => { if (hoverCapable()) setActiveId(pt.item.id) }}
          onBlur={() => setActiveId((cur) => (cur === pt.item.id ? null : cur))}
        >
          <img src={thumbSrc(pt.item, pt.size > 8 ? 4 : 1)} alt="" draggable={false} decoding="async" onError={fallbackImg(pt.item)} />
        </a>
      ))}
      {active ? <Preview item={active.item} node={nodes.current.get(active.item.id)} /> : null}
    </section>
  )
}

function Preview({ item, node }: { item: ArchiveRecord; node?: HTMLElement }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (!node) return
    const r = node.getBoundingClientRect()
    const parent = node.parentElement!.getBoundingClientRect()
    setPos({ x: r.left - parent.left + r.width / 2, y: r.top - parent.top + r.height / 2 })
  }, [node])
  if (!pos) return null
  return (
    <div className="cloud-tip" aria-hidden="true" style={{ left: pos.x, top: pos.y }}>
      <img src={thumbSrc(item, 4)} alt="" onError={fallbackImg(item)} />
      <span className="cloud-tip-label">
        <strong>{shortTitle(item.title)}</strong>
        <span>{item.caption ?? item.timestamp.slice(0, 10)}</span>
      </span>
    </div>
  )
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60
  return [h, Math.min(1, s), l]
}

function fallbackHsl(id: string): Hsl {
  const r = rand(hash(`c-${id}`))
  return [r() * 360, 0.3, 0.3 + r() * 0.4]
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

function thumbSrc(item: ArchiveRecord, units: number): string {
  const id = /sg-\d+/i.exec(item.id)?.[0]?.toLowerCase()
  if (id) return `/archive/${units >= 4 ? 'md' : 'px'}/${id}.webp`
  const m = item.media
  return (m?.type === 'video' ? m.poster : m?.url) ?? ''
}

function fullSrc(item: ArchiveRecord): string {
  const m = item.media
  return (m?.type === 'video' ? m.poster : m?.url) ?? ''
}

function fallbackImg(item: ArchiveRecord) {
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const full = fullSrc(item)
    if (full && !event.currentTarget.src.endsWith(full)) event.currentTarget.src = full
  }
}
