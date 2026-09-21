import { useEffect, useRef, type CSSProperties } from 'react'
import '../fold-logo.css'

/** Named ink palettes inspired by playgrnd Fold. */
export type FoldVariation =
  | 'ink'
  | 'gold'
  | 'sky'
  | 'lime'
  | 'indigo'
  | 'kaleido'

/** Gallery-friendly subset for About section 2. */
export const FOLD_VARIATIONS: readonly FoldVariation[] = [
  'gold',
  'sky',
  'lime',
  'indigo',
] as const

export type FoldLogoProps = {
  size?: number
  className?: string
  /** Color palette + fold/wave seed; defaults to vivid gold. */
  variation?: FoldVariation | string | number
  /** Accessible name; omit (or pass empty) for decorative use. */
  'aria-label'?: string
}

type RGB = readonly [number, number, number]

/** Inspiration inks (playgrnd Fold). */
const GROUND: RGB = [0x22, 0x17, 0x12]
const PAPER: RGB = [0xf4, 0xf9, 0xfa]
const GOLD: RGB = [0xff, 0xcc, 0x57]
const SKY: RGB = [0x82, 0xc2, 0xff]
const LIME: RGB = [0xc4, 0xd1, 0x00]
const INDIGO: RGB = [0x4c, 0x48, 0xde]

/** Warm mid / cool mid for dither bridges. */
const WARM_MID: RGB = [0x8a, 0x6b, 0x42]
const COOL_MID: RGB = [0x4a, 0x5e, 0x72]
const OLIVE_MID: RGB = [0x5c, 0x62, 0x28]
const MUTED: RGB = [0x6b, 0x68, 0x62]

type PaletteConfig = {
  /** Dark → light (4–6 inks). */
  colors: readonly RGB[]
  /** Wave phase offset. */
  phase0: number
  /** Spatial wave frequencies. */
  waveCol: number
  waveRow: number
  /** Crease emphasis multiplier. */
  creaseGain: number
  /** Per-patch hash seed. */
  seed: number
  /** Mark (center ridge) darken factor. */
  markDark: number
}

const PALETTES: Record<FoldVariation, PaletteConfig> = {
  ink: {
    colors: [GROUND, MUTED, WARM_MID, PAPER],
    phase0: 0.1,
    waveCol: 2.0,
    waveRow: 1.4,
    creaseGain: 1.0,
    seed: 7,
    markDark: 0.45,
  },
  gold: {
    colors: [GROUND, WARM_MID, GOLD, [0xff, 0xe8, 0xa8], PAPER],
    phase0: 0.55,
    waveCol: 2.2,
    waveRow: 1.1,
    creaseGain: 1.15,
    seed: 13,
    markDark: 0.4,
  },
  sky: {
    colors: [GROUND, COOL_MID, SKY, [0xc5, 0xe4, 0xff], PAPER],
    phase0: 1.1,
    waveCol: 1.7,
    waveRow: 1.8,
    creaseGain: 0.95,
    seed: 19,
    markDark: 0.5,
  },
  lime: {
    colors: [GROUND, OLIVE_MID, LIME, [0xe0, 0xea, 0x6a], PAPER],
    phase0: 1.7,
    waveCol: 2.4,
    waveRow: 1.3,
    creaseGain: 1.05,
    seed: 23,
    markDark: 0.42,
  },
  indigo: {
    colors: [GROUND, [0x2a, 0x28, 0x6a], INDIGO, [0x9a, 0x98, 0xf0], PAPER],
    phase0: 2.3,
    waveCol: 1.9,
    waveRow: 2.0,
    creaseGain: 1.1,
    seed: 29,
    markDark: 0.38,
  },
  kaleido: {
    colors: [GROUND, INDIGO, LIME, GOLD, SKY, PAPER],
    phase0: 0.85,
    waveCol: 2.6,
    waveRow: 1.6,
    creaseGain: 1.2,
    seed: 31,
    markDark: 0.35,
  },
}

const VARIATION_IDS: readonly FoldVariation[] = [
  'ink',
  'gold',
  'sky',
  'lime',
  'indigo',
  'kaleido',
]

function resolveVariation(raw: FoldLogoProps['variation']): FoldVariation {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const i = ((Math.floor(raw) % VARIATION_IDS.length) + VARIATION_IDS.length) %
      VARIATION_IDS.length
    return VARIATION_IDS[i]!
  }
  if (typeof raw === 'string') {
    const key = raw.trim().toLowerCase()
    if ((VARIATION_IDS as readonly string[]).includes(key)) {
      return key as FoldVariation
    }
  }
  return 'gold'
}

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

/**
 * Multi-ink Bayer dither: map luminance through N palette steps with
 * ordered threshold so folds read as ink mixes rather than smooth blends.
 */
function toneAt(
  x: number,
  y: number,
  value: number,
  colors: readonly RGB[],
): [number, number, number] {
  const n = colors.length
  if (n === 0) return [0, 0, 0]
  if (n === 1) {
    const c = colors[0]!
    return [c[0], c[1], c[2]]
  }

  const threshold = BAYER_4[y & 3]![x & 3]!
  const levels = n - 1
  const stepped = Math.floor(value * levels + threshold) / levels
  const clamped = Math.min(1, Math.max(0, stepped))
  const idx = Math.min(levels, Math.max(0, Math.round(clamped * levels)))
  const c = colors[idx]!
  return [c[0], c[1], c[2]]
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Compact fold-inspired mark: patch grid with a traveling wave, tilt-ish
 * shading, multi-ink Bayer dither, and light grain. Spirit only — not a
 * port of playgrnd Fold.
 */
export function FoldLogo({
  size = 360,
  className,
  variation: variationProp = 'gold',
  'aria-label': ariaLabel = 'slopgang',
}: FoldLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const variation = resolveVariation(variationProp)
  const palette = PALETTES[variation]

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const { colors, phase0, waveCol, waveRow, creaseGain, seed, markDark } =
      palette

    // Internal buffer stays modest for dither character + CPU (~12fps)
    const buffer = Math.max(96, Math.round(Math.min(size, 420) * 0.55))
    canvas.width = buffer
    canvas.height = buffer
    ctx.imageSmoothingEnabled = false

    const cellW = buffer / COLS
    const cellH = buffer / ROWS
    const image = ctx.createImageData(buffer, buffer)
    const data = image.data

    // Ground fill behind dither (matches darkest ink)
    const bg = colors[0]!
    wrap.style.backgroundColor = `rgb(${bg[0]},${bg[1]},${bg[2]})`

    let frame = 0
    let lastPaint = 0
    let raf = 0
    let running = false
    let visible = true
    let reduce = prefersReducedMotion()

    const paint = (t: number) => {
      const phase = reduce ? phase0 : t * 0.55 + phase0

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
          const crease = Math.min(foldAcross, foldDown) * creaseGain

          const wave =
            0.5 +
            0.5 *
              Math.sin(
                (col / COLS) * Math.PI * waveCol +
                  (row / ROWS) * Math.PI * waveRow +
                  phase,
              )

          // Soft tilt: brighter toward one fold face
          const tilt = 0.35 + 0.65 * (1 - Math.abs(lx + ly - 1))

          // Stable per-patch identity (seeded per variation)
          const patchHash = ((col * 13 + row * 37 + seed * 11) % 7) / 7

          let value =
            0.18 + 0.36 * Math.min(1, crease) + 0.3 * wave * tilt + 0.14 * patchHash

          // Soft vignette
          const nx = px / buffer - 0.5
          const ny = py / buffer - 0.5
          const vig = 1 - Math.min(1, (nx * nx + ny * ny) * 2.4) * 0.35
          value *= vig

          // Light grain (specks) — seed-shifted so variations feel distinct
          const grain =
            (((px * 374761 + py * 668265 + seed * 9973) ^ (frame * 97)) & 255) /
            255
          value = value * 0.92 + grain * 0.08

          // Geometric fold-mark in the center (stylized S / ridge)
          const mx = (col - (COLS - 1) / 2) / (COLS * 0.42)
          const my = (row - (ROWS - 1) / 2) / (ROWS * 0.42)
          const ridge = Math.abs(my - Math.sin(mx * Math.PI) * 0.55) < 0.28
          const bar = Math.abs(mx) > 0.55 && Math.abs(my) < 0.22
          const inMark =
            Math.abs(mx) < 0.85 && Math.abs(my) < 0.95 && (ridge || bar)
          if (inMark) value *= markDark

          const [r, g, b] = toneAt(px, py, value, colors)
          const i = (py * buffer + px) * 4
          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
          data[i + 3] = 255
        }
      }

      ctx.putImageData(image, 0, 0)

      // Hairline frame in buffer space (ground ink at low alpha)
      ctx.strokeStyle = `rgba(${GROUND[0]},${GROUND[1]},${GROUND[2]},0.18)`
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
  }, [size, variation, palette])

  const label = ariaLabel?.trim()
  const decorative = !label

  return (
    <div
      ref={wrapRef}
      className={['fold-logo', className].filter(Boolean).join(' ')}
      style={{ ['--fold-logo-size']: `${size}px` } as CSSProperties}
      data-variation={variation}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <canvas ref={canvasRef} className="fold-logo__canvas" />
    </div>
  )
}
