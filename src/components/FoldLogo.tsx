import { useEffect, useRef, type CSSProperties } from 'react'
import '../fold-logo.css'

export type FoldLogoProps = {
  size?: number
  className?: string
  /** Accessible name; omit (or pass empty) for decorative use. */
  'aria-label'?: string
}

const PAPER = [243, 240, 234] as const
const INK = [20, 20, 18] as const
const MUTED = [107, 104, 98] as const
const BRASS = [176, 141, 87] as const

const FPS = 12
const FRAME_MS = 1000 / FPS
const COLS = 9
const ROWS = 9

/** 4×4 Bayer matrix, normalized 0–1 */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

function toneAt(x: number, y: number, value: number): [number, number, number] {
  // 3-tone dither: paper / muted / ink, with sparse brass flecks on bright folds
  const threshold = BAYER_4[y & 3]![x & 3]!
  const levels = 3
  const stepped = Math.floor(value * levels + threshold) / levels
  const clamped = Math.min(1, Math.max(0, stepped))

  if (clamped > 0.72) {
    const fleck = ((x * 17 + y * 31) & 15) === 0
    return fleck ? [BRASS[0], BRASS[1], BRASS[2]] : [PAPER[0], PAPER[1], PAPER[2]]
  }
  if (clamped > 0.38) return [MUTED[0], MUTED[1], MUTED[2]]
  return [INK[0], INK[1], INK[2]]
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Compact fold-inspired mark: patch grid with a traveling wave, tilt-ish
 * shading, Bayer dither, and light grain. Spirit only — not a port of
 * playgrnd Fold.
 */
export function FoldLogo({
  size = 360,
  className,
  'aria-label': ariaLabel = 'slopgang',
}: FoldLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Internal buffer stays modest for dither character + CPU (~12fps)
    const buffer = Math.max(96, Math.round(Math.min(size, 420) * 0.55))
    canvas.width = buffer
    canvas.height = buffer
    ctx.imageSmoothingEnabled = false

    const cellW = buffer / COLS
    const cellH = buffer / ROWS
    const image = ctx.createImageData(buffer, buffer)
    const data = image.data

    let frame = 0
    let lastPaint = 0
    let raf = 0
    let running = false
    let visible = true
    let reduce = prefersReducedMotion()

    const paint = (t: number) => {
      const phase = reduce ? 0.35 : t * 0.55

      for (let py = 0; py < buffer; py++) {
        for (let px = 0; px < buffer; px++) {
          const cx = (px + 0.5) / cellW
          const cy = (py + 0.5) / cellH
          const col = Math.floor(cx)
          const row = Math.floor(cy)
          const lx = cx - col
          const ly = cy - row

          // Fold planes: crease across / down within each patch
          const foldAcross = Math.abs(lx - 0.5) * 2
          const foldDown = Math.abs(ly - 0.5) * 2
          const crease = Math.min(foldAcross, foldDown)

          const wave =
            0.5 +
            0.5 *
              Math.sin(
                (col / COLS) * Math.PI * 2 +
                  (row / ROWS) * Math.PI * 1.4 +
                  phase,
              )

          // Soft tilt: brighter toward one fold face
          const tilt = 0.35 + 0.65 * (1 - Math.abs(lx + ly - 1))

          // Stable per-patch identity
          const patchHash = ((col * 13 + row * 37) % 7) / 7

          let value =
            0.22 + 0.38 * crease + 0.28 * wave * tilt + 0.12 * patchHash

          // Soft vignette
          const nx = px / buffer - 0.5
          const ny = py / buffer - 0.5
          const vig = 1 - Math.min(1, (nx * nx + ny * ny) * 2.4) * 0.35
          value *= vig

          // Light grain (specks)
          const grain =
            (((px * 374761 + py * 668265) ^ (frame * 97)) & 255) / 255
          value = value * 0.92 + grain * 0.08

          // Geometric fold-mark in the center (stylized S / ridge)
          const mx = (col - (COLS - 1) / 2) / (COLS * 0.42)
          const my = (row - (ROWS - 1) / 2) / (ROWS * 0.42)
          const ridge = Math.abs(my - Math.sin(mx * Math.PI) * 0.55) < 0.28
          const bar = Math.abs(mx) > 0.55 && Math.abs(my) < 0.22
          const inMark = Math.abs(mx) < 0.85 && Math.abs(my) < 0.95 && (ridge || bar)
          if (inMark) value *= 0.45

          const [r, g, b] = toneAt(px, py, value)
          const i = (py * buffer + px) * 4
          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
          data[i + 3] = 255
        }
      }

      ctx.putImageData(image, 0, 0)

      // Hairline frame in buffer space
      ctx.strokeStyle = 'rgba(20,20,18,0.14)'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, buffer - 1, buffer - 1)
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible || reduce) return
      if (now - lastPaint < FRAME_MS) return
      lastPaint = now
      frame += 1
      paint(frame / FPS)
    }

    const start = () => {
      if (running || reduce) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
    }

    paint(0.35)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMq = () => {
      reduce = mq.matches
      if (reduce) {
        stop()
        paint(0.35)
      } else {
        start()
      }
    }
    mq.addEventListener('change', onMq)

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true
      },
      { root: null, threshold: 0.05 },
    )
    io.observe(wrap)

    start()

    return () => {
      stop()
      mq.removeEventListener('change', onMq)
      io.disconnect()
    }
  }, [size])

  const label = ariaLabel?.trim()
  const decorative = !label

  return (
    <div
      ref={wrapRef}
      className={['fold-logo', className].filter(Boolean).join(' ')}
      style={{ ['--fold-logo-size']: `${size}px` } as CSSProperties}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <canvas ref={canvasRef} className="fold-logo__canvas" />
    </div>
  )
}
