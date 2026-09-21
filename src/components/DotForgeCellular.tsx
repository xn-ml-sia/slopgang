import { useEffect, useId, useRef, type CSSProperties } from 'react'

const CANVAS_SIZE = 800
const FG: [number, number, number] = [255, 255, 255]
const BG: [number, number, number] = [0, 0, 0]
const ACCENT: [number, number, number] = [0, 255, 170]
const PIXEL_SIZE = 2
const THRESHOLD = 128 / 255
const SPREAD = 50 / 100
const INTENSITY = 50
const SCALE = 4
const SPEED = 1
const ACCENT_MIX = 0
const ACCENT_MODE = 'blend'

const BAYER4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
]

function bayer4(x: number, y: number): number {
  return BAYER4[y & 3][x & 3]
}

function cellularEffect(
  buf: Float32Array,
  w: number,
  h: number,
  t: number,
  intensity: number,
  scale: number,
) {
  const cellSize = Math.max(2, Math.floor(scale * 2))
  const phase = Math.floor(t * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = Math.floor(x / cellSize)
      const cy = Math.floor(y / cellSize)
      const seed = (cx * 48271 + cy * 16807 + phase * 65521) | 0
      const hash = ((seed * 2654435761) >>> 0) / 4294967296
      const neighbors =
        ((((((cx - 1) * 48271 + cy * 16807 + phase * 65521) | 0) * 2654435761) >>> 0) /
          4294967296 +
          (((((cx + 1) * 48271 + cy * 16807 + phase * 65521) | 0) * 2654435761) >>> 0) /
            4294967296 +
          ((((cx * 48271 + (cy - 1) * 16807 + phase * 65521) | 0) * 2654435761) >>> 0) /
            4294967296 +
          ((((cx * 48271 + (cy + 1) * 16807 + phase * 65521) | 0) * 2654435761) >>> 0) /
            4294967296) /
        4
      const alive = (hash > 0.5) !== (neighbors > 0.55) ? 1 : 0
      buf[y * w + x] = alive * (intensity / 50)
    }
  }
}

export type DotForgeCellularProps = {
  className?: string
  /** Display size hint in CSS pixels (wrapper max width). Default fills parent. */
  size?: number
}

export function DotForgeCellular({ className, size }: DotForgeCellularProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reactId = useId()
  const canvasIdRef = useRef(`dl_${reactId.replace(/:/g, '')}`)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = CANVAS_SIZE
    const H = CANVAS_SIZE
    canvas.width = W
    canvas.height = H

    const buf = new Float32Array(W * H)
    const fg = FG
    const bg = BG
    const ac = ACCENT
    const px = PIXEL_SIZE
    const thr = THRESHOLD
    const spr = SPREAD
    const acMix = ACCENT_MIX
    const acMode = ACCENT_MODE

    let t = 0
    let raf = 0
    let stopped = false

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const drawFrame = () => {
      cellularEffect(buf, W, H, t, INTENSITY, SCALE)
      const img = ctx.createImageData(W, H)
      const d = img.data
      const halfZone = acMix * 0.45
      const acLo = 0.5 - halfZone
      const acHi = 0.5 + halfZone

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x
          const gray = buf[idx]
          const qx = Math.floor(x / px)
          const qy = Math.floor(y / px)
          const pv = bayer4(qx, qy)
          const dithered = gray + (pv - 0.5) * spr > thr ? 1 : 0
          let r: number
          let g: number
          let b: number

          if (gray < 0) {
            r = ac[0]
            g = ac[1]
            b = ac[2]
          } else if (acMix > 0.01 && gray >= acLo && gray <= acHi) {
            if (acMode === 'hard') {
              r = ac[0]
              g = ac[1]
              b = ac[2]
            } else if (acMode === 'pattern') {
              if (dithered) {
                r = ac[0]
                g = ac[1]
                b = ac[2]
              } else {
                r = bg[0]
                g = bg[1]
                b = bg[2]
              }
            } else {
              const dist = Math.abs(gray - 0.5)
              const ef = halfZone > 0.01 ? 1 - dist / halfZone : 1
              const bl = ef * ef
              if (dithered) {
                r = fg[0] + (ac[0] - fg[0]) * bl
                g = fg[1] + (ac[1] - fg[1]) * bl
                b = fg[2] + (ac[2] - fg[2]) * bl
              } else {
                r = bg[0] + (ac[0] - bg[0]) * bl
                g = bg[1] + (ac[1] - bg[1]) * bl
                b = bg[2] + (ac[2] - bg[2]) * bl
              }
            }
          } else {
            const col = dithered ? fg : bg
            r = col[0]
            g = col[1]
            b = col[2]
          }

          const p = idx * 4
          d[p] = r
          d[p + 1] = g
          d[p + 2] = b
          d[p + 3] = 255
        }
      }

      ctx.putImageData(img, 0, 0)
    }

    const loop = () => {
      if (stopped) return
      t += 0.016 * SPEED
      drawFrame()
      raf = requestAnimationFrame(loop)
    }

    if (reduceMotion) {
      drawFrame()
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [])

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    width: size ? `${size}px` : undefined,
    maxWidth: '100%',
    aspectRatio: '1',
    background: '#000',
    overflow: 'hidden',
  }

  return (
    <div
      className={['dotforge-cellular', className].filter(Boolean).join(' ')}
      style={wrapperStyle}
    >
      <canvas
        id={canvasIdRef.current}
        ref={canvasRef}
        className="dotforge-cellular__canvas"
        aria-hidden="true"
      />
    </div>
  )
}
