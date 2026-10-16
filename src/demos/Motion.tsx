import { useEffect } from 'react'
import { $$, reduced } from './dom.ts'

/** Ported from the kit's motion hooks: RiseText / Reveal (data-in), count-up stats, and the live clock. */
export function Motion({ root }: { root: HTMLElement }) {
  // Titles rise and blocks fade up the first time they enter the viewport.
  useEffect(() => {
    if (reduced() || typeof IntersectionObserver === 'undefined') return
    const els = $$(root, '.kit-rise[data-in], .kit-reveal[data-in]')
    els.forEach(el => el.setAttribute('data-in', 'false'))
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.setAttribute('data-in', 'true'); io.unobserve(e.target) }
    }), { rootMargin: '0px 0px -8% 0px' })
    requestAnimationFrame(() => els.forEach(el => io.observe(el)))
    return () => { io.disconnect(); els.forEach(el => el.setAttribute('data-in', 'true')) }
  }, [root])

  // Count-up stats: the big tabular numbers count from 0 when they come into view.
  useEffect(() => {
    if (reduced() || typeof IntersectionObserver === 'undefined') return
    const stats = $$(root, 'span.tabular-nums > span[aria-hidden="true"]').filter(s => /^\d[\d.,]*/.test(s.textContent ?? '') && s.nextElementSibling?.classList.contains('sr-only'))
    const raf: number[] = []
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return
      io.unobserve(e.target)
      const el = e.target as HTMLElement
      const full = el.dataset.final ?? el.textContent ?? ''
      el.dataset.final = full
      const m = full.match(/^(\d[\d.,]*)(.*)$/)!
      const target = parseFloat(m[1].replace(/,/g, '')), dec = (m[1].split('.')[1] ?? '').length
      const t0 = performance.now(), dur = 1400
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur), v = target * (1 - Math.pow(1 - k, 3))
        el.textContent = (k < 1 ? v.toFixed(dec) : m[1]) + m[2]
        if (k < 1) raf.push(requestAnimationFrame(step))
      }
      raf.push(requestAnimationFrame(step))
    }), { threshold: 0.6 })
    stats.forEach(s => { s.dataset.final = s.textContent ?? ''; io.observe(s) })
    return () => { io.disconnect(); raf.forEach(cancelAnimationFrame); stats.forEach(s => { if (s.dataset.final) s.textContent = s.dataset.final }) }
  }, [root])

  // Live Berlin clock, the same on every page.
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false })
    const nodes: Text[] = []
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) if (/^\s*Berlin \d\d:\d\d\s*$/.test(n.nodeValue ?? '')) nodes.push(n as Text)
    const tick = () => { const t = fmt.format(new Date()); nodes.forEach(n => { n.nodeValue = `Berlin ${t}` }) }
    tick()
    const id = window.setInterval(tick, 10_000)
    return () => window.clearInterval(id)
  }, [root])
  return null
}
