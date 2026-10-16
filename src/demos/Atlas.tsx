import { useEffect } from 'react'
import { $$, radios, setLabel, toggle } from './dom.ts'

/* Ported from the reference TimeMachine. The dunes drawing engine (Illustration) is not in the source, so the
   saved still frame stays and the layer switch is a CSS treatment of it. Data, chart and storms are as in the source. */
const MONTHS = 144
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dateOf = (m: number) => `${MON[m % 12]} ${2014 + Math.floor(m / 12)}`
const STORMS: [number, string, number][] = [[35, 'Storm Urd', 14], [70, 'Storm Ciara', 9], [118, 'Storm Malik', 17]]
const SHORE = Array.from({ length: MONTHS }, (_, m) => {
  const storms = STORMS.reduce((a, [at, , d]) => a + (m >= at ? d : 0), 0)
  return Math.round((m * 0.21 + Math.sin(m / 1.9) * 0.9 + storms) * 10) / 10
})
const W = 640, H = 120, MAX = Math.max(...SHORE) * 1.1
const x = (m: number) => (m / (MONTHS - 1)) * W
const y = (v: number) => H - (v / MAX) * (H - 8)
const PLAY = 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z'

export function TimeMachine({ root }: { root: HTMLElement }) {
  useEffect(() => {
    const input = root.querySelector<HTMLInputElement>('input.kit-range[max="143"]')
    const chart = root.querySelector<SVGSVGElement>('svg[viewBox="0 0 640 140"]')
    if (!input || !chart) return
    const frame = $$(root, 'div[role=img]').find(d => d.getAttribute('aria-label')?.startsWith('Dunes at'))!
    const stage = frame.parentElement as HTMLElement
    const canvas = frame.querySelector('canvas') as HTMLElement | null
    const dateTag = [...stage.querySelectorAll<HTMLElement>(':scope > span')].find(s => /^[A-Z][a-z]{2} \d{4}$/.test(s.textContent ?? ''))
    const output = root.querySelector<HTMLOutputElement>(`output[for="${input.id}"]`)
    const thumb = input.parentElement!.querySelector<HTMLElement>('span[style*="inset-inline-start"]')
    const cursor = [...chart.querySelectorAll('line')].find(l => l.getAttribute('stroke-dasharray') === '2 3')
    const dot = chart.querySelector('circle')
    const note = chart.closest('figure')?.querySelector('figcaption span:last-child')
    const grid = stage.querySelector('svg[viewBox="0 0 1600 900"]')
    const play = [...root.querySelectorAll<HTMLButtonElement>('button')].find(b => b.querySelector('.lucide-play'))
    const callout = document.createElement('span')
    callout.setAttribute('role', 'status')
    callout.className = 'kit-print-in t-caption'
    callout.style.cssText = 'position:absolute;bottom:var(--s2);inset-inline-end:var(--s2);max-width:min(60%,320px);border:var(--bw) solid var(--ink);background:var(--surface);padding:var(--s1)'
    let m = Number(input.value), playing = false, raf = 0
    const draw = () => {
      const d = dateOf(m)
      frame.setAttribute('aria-label', `Dunes at Skagen Odde, ${d}`)
      if (dateTag) dateTag.textContent = d
      if (output) output.textContent = d
      input.value = String(m); input.setAttribute('aria-valuetext', d)
      const pct = (m / (MONTHS - 1)) * 100
      if (thumb) thumb.style.insetInlineStart = `calc(${pct}% - ${pct / 100}px)`
      cursor?.setAttribute('x1', String(x(m))); cursor?.setAttribute('x2', String(x(m)))
      dot?.setAttribute('cx', String(x(m))); dot?.setAttribute('cy', String(y(SHORE[m])))
      chart.setAttribute('aria-label', `Shoreline lost since 2014: ${SHORE[m]} m by ${d}`)
      if (note) note.textContent = `${SHORE[m]} m by ${d}`
      if (canvas) canvas.style.transform = `scale(${1 + (m / MONTHS) * 0.04})`
      const storm = [...STORMS].reverse().find(([at]) => m >= at && m - at < 10)
      if (storm) {
        const t = `${storm[1]}, ${dateOf(storm[0])}`
        if (callout.dataset.t !== t) {
          callout.dataset.t = t
          callout.innerHTML = `<span class="block t-label">${t}</span>${storm[2]} m of foredune lost in one night. Flagged before anyone asked.`
        }
        if (!callout.isConnected) stage.appendChild(callout)
      } else callout.remove()
    }
    const setPlaying = (p: boolean) => {
      playing = p
      if (play) {
        setLabel(play, p ? 'Pause' : 'Play')
        const path = play.querySelector('svg path')
        if (path) path.setAttribute('d', p ? 'M6 4h4v16H6zM14 4h4v16h-4z' : PLAY)
      }
      cancelAnimationFrame(raf)
      if (!p) return
      let last = performance.now(), acc = m
      const step = (now: number) => {
        acc += ((now - last) / 1000) * 14; last = now
        if (acc >= MONTHS - 1) { m = MONTHS - 1; draw(); setPlaying(false); return }
        m = Math.floor(acc); draw()
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    const onInput = () => { setPlaying(false); m = Number(input.value); draw() }
    const onPlay = () => { if (m >= MONTHS - 1) m = 0; setPlaying(!playing) }
    input.addEventListener('input', onInput)
    play?.addEventListener('click', onPlay)
    if (canvas) canvas.style.transition = 'filter var(--dur-slow) var(--ease), opacity var(--dur-slow) var(--ease)'
    const layer = root.querySelector('[role=radiogroup][aria-label=Layer]')
    const LAYERS = ['none', 'contrast(1.6) blur(0.4px)', 'invert(1) contrast(0.6)']
    const offs = [
      layer ? radios(layer, i => { if (canvas) canvas.style.filter = LAYERS[i] }) : () => {},
      ...$$<HTMLElement>(root, '[role=switch]').filter(s => s.parentElement?.textContent?.includes('Kilometre grid'))
        .map(s => toggle(s, on => grid?.querySelectorAll('line').forEach(l => ((l as SVGElement).style.display = on ? '' : 'none')))),
    ]
    draw()
    return () => { cancelAnimationFrame(raf); input.removeEventListener('input', onInput); play?.removeEventListener('click', onPlay); offs.forEach(f => f()) }
  }, [root])
  return null
}
