import { useEffect } from 'react'
import { $$, commonRoot, findButton, radios, reduced, setLabel, toggle } from './dom.ts'

/* ---- The pacer (ported from the reference Pacer) ---- */
type Phase = { name: 'in' | 'hold' | 'out' | 'rest'; s: number }
const PATTERNS: { label: string; phases: Phase[] }[] = [
  { label: 'Box · 4 4 4 4', phases: [{ name: 'in', s: 4 }, { name: 'hold', s: 4 }, { name: 'out', s: 4 }, { name: 'rest', s: 4 }] },
  { label: 'Calm · 4 7 8', phases: [{ name: 'in', s: 4 }, { name: 'hold', s: 7 }, { name: 'out', s: 8 }] },
  { label: 'Even · 5 5', phases: [{ name: 'in', s: 5 }, { name: 'out', s: 5 }] },
]
const SAY = { in: 'Breathe in', hold: 'Hold', out: 'Breathe out', rest: 'Rest' }
const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2

export function Pacer({ root }: { root: HTMLElement }) {
  useEffect(() => {
    const group = root.querySelector('[role=radiogroup][aria-label=Pattern]')
    const svg = root.querySelector('svg[viewBox="-200 -200 400 400"]')
    if (!group || !svg) return
    const box = commonRoot(group, svg)!
    const rings = svg.querySelector<SVGGElement>('g')!
    const title = box.querySelector<HTMLElement>('[role=status] .t-title')!
    const cap = box.querySelector<HTMLElement>('[role=status] .t-caption')!
    const btn = findButton(box, 'Begin')
    if (!btn) return
    let pattern = 1, running = false, raf = 0
    const stop = () => {
      running = false; cancelAnimationFrame(raf)
      rings.style.transition = 'transform var(--dur-slow) var(--ease)'; rings.style.transform = 'scale(0.55)'
      title.textContent = 'Ready'; cap.textContent = PATTERNS[pattern].label; setLabel(btn, 'Begin')
    }
    const start = () => {
      running = true; setLabel(btn, 'Stop'); rings.style.transition = ''
      const phases = PATTERNS[pattern].phases, cycle = phases.reduce((a, p) => a + p.s, 0), t0 = performance.now()
      const run = (now: number) => {
        const el = (now - t0) / 1000
        let at = el % cycle, i = 0
        while (at >= phases[i].s) { at -= phases[i].s; i++ }
        const p = phases[i], k = at / p.s
        const level = p.name === 'in' ? ease(k) : p.name === 'out' ? 1 - ease(k) : p.name === 'hold' ? 1 : 0
        rings.style.transform = `scale(${reduced() ? 0.78 : 0.55 + level * 0.45})`
        title.textContent = SAY[p.name]
        cap.textContent = `${Math.ceil(p.s - at)} · breath ${Math.floor(el / cycle) + 1}`
        raf = requestAnimationFrame(run)
      }
      raf = requestAnimationFrame(run)
    }
    const click = () => (running ? stop() : start())
    btn.addEventListener('click', click)
    const off = radios(group, i => { pattern = i; stop() })
    return () => { off(); btn.removeEventListener('click', click); cancelAnimationFrame(raf) }
  }, [root])
  return null
}

/* ---- The sleep timer (ported from the reference SleepTimer; the foam drawing is not in the source) ---- */
const FADE = 10
export function SleepTimer({ root }: { root: HTMLElement }) {
  useEffect(() => {
    const soundG = root.querySelector('[role=radiogroup][aria-label=Sound]')
    const minsG = root.querySelector('[role=radiogroup][aria-label="Fade out after"]')
    if (!soundG || !minsG) return
    const go = $$<HTMLButtonElement>(root, 'button').find(b => /^Sleep in \d+ minutes$/.test(b.textContent?.trim() ?? ''))
    if (!go) return
    const screen = go.closest('.flex.h-full.flex-col') as HTMLElement | null
    if (!screen) return
    const ff = $$<HTMLElement>(root, '[role=switch]').find(s => s.parentElement?.textContent?.includes('Fast-forward'))
    let sound = 'Rain on a tin roof', mins = 30, fast = ff ? ff.getAttribute('aria-checked') === 'true' : true
    let left = 0, timer = 0, darkT = 0
    const saved = [...screen.children] as HTMLElement[]
    const panel = document.createElement('div')
    panel.style.cssText = 'position:relative;display:flex;flex-direction:column;height:100%;'
    const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    const show = (el: HTMLElement | null) => { saved.forEach(c => (c.style.display = el ? 'none' : '')); panel.remove(); if (el) screen.appendChild(el) }
    const reset = () => { window.clearTimeout(timer); window.clearTimeout(darkT); show(null) }
    const render = () => {
      if (left < 0) return
      const vol = Math.min(1, left / (FADE * 60)), pos = (1 - left / (mins * 60)) * 100
      panel.innerHTML = `
        <div style="flex:1;display:grid;place-items:center"><svg viewBox="-60 -60 120 120" width="160" height="160" fill="none" aria-hidden="true" style="opacity:${0.25 + vol * 0.75}">${[56, 44, 32].map(r => `<circle r="${r}" stroke="var(--ink-3)"></circle>`).join('')}</svg></div>
        <div class="flex flex-col items-center gap-[var(--s1)] px-[var(--s3)] text-center" role="status">
          <span class="tabular-nums" style="font-size:48px;line-height:52px;letter-spacing:-0.04em">${left === 0 ? 'Good night' : mmss(left)}</span>
          <span class="t-caption text-[color:var(--ink-2)]">${left === 0 ? 'Going dark' : left <= FADE * 60 ? `Fading · volume ${Math.round(vol * 100)}%` : sound}</span>
        </div>
        <div class="flex flex-col gap-[var(--s2)] p-[var(--s3)]" style="margin-top:auto">
          <div aria-hidden="true" style="position:relative;height:24px;border-bottom:var(--bw) solid var(--line-strong)">
            <svg viewBox="0 0 300 24" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" fill="none"><path d="M0 2H${300 * (1 - FADE / mins)}C${300 - (300 * FADE / mins) * 0.4} 2 260 24 300 24" stroke="var(--ink-2)"></path></svg>
            <span style="position:absolute;top:0;bottom:0;width:1px;background:var(--ink);left:${pos}%"></span>
          </div>
          <button type="button" data-stop style="height:var(--h-lg);border:var(--bw) solid var(--line-strong);background:transparent;color:var(--ink)" class="t-label">Stop</button>
        </div>`
      panel.querySelector('[data-stop]')!.addEventListener('click', reset)
    }
    const tick = () => {
      render()
      if (left > 0) timer = window.setTimeout(() => { left = Math.max(0, left - (fast ? 30 : 1)); tick() }, fast ? 50 : 1000)
      else darkT = window.setTimeout(() => {
        const black = document.createElement('button')
        black.type = 'button'; black.setAttribute('aria-label', 'Wake the screen')
        black.style.cssText = 'width:100%;height:100%;background:#000;border:0'
        black.addEventListener('click', reset)
        show(black)
      }, 1800)
    }
    const start = () => { left = mins * 60; show(panel); tick() }
    go.addEventListener('click', start)
    const offs = [
      radios(soundG, (_, b) => {
        sound = b.textContent?.trim() ?? sound
        $$(soundG, '[role=radio]').forEach(r => r.querySelector('span')?.classList.toggle('bg-[var(--ink)]', r === b))
      }),
      radios(minsG, (_, b) => { mins = parseInt(b.textContent ?? '30'); setLabel(go, `Sleep in ${mins} minutes`) }),
      ff ? toggle(ff, on => { fast = on }) : () => {},
    ]
    return () => { offs.forEach(f => f()); go.removeEventListener('click', start); reset() }
  }, [root])
  return null
}

/* ---- 2 a.m.: typical app vs Murmur. The Compare component is not in the source; this is a minimal rebuild. ---- */
export function Compare({ root }: { root: HTMLElement }) {
  useEffect(() => {
    const handle = root.querySelector<HTMLElement>('button[role=slider][aria-label^="A typical wellbeing app"]')
    if (!handle) return
    const box = handle.parentElement as HTMLElement
    const clip = [...box.querySelectorAll<HTMLElement>('div')].find(d => d.style.clipPath.startsWith('inset'))
    const line = [...box.children].find(c => c !== handle && (c as HTMLElement).style.left) as HTMLElement | undefined
    if (!clip) return
    const set = (p: number) => {
      p = Math.max(0, Math.min(100, Math.round(p)))
      clip.style.clipPath = `inset(0px 0px 0px ${p}%)`
      handle.style.left = `${p}%`; if (line) line.style.left = `${p}%`
      handle.setAttribute('aria-valuenow', String(p)); handle.setAttribute('aria-valuetext', `${100 - p}% murmur showing`)
    }
    let drag = false
    const at = (e: PointerEvent) => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100) }
    const down = (e: PointerEvent) => { drag = true; box.setPointerCapture(e.pointerId); at(e) }
    const move = (e: PointerEvent) => { if (drag) at(e) }
    const up = () => { drag = false }
    const key = (e: KeyboardEvent) => {
      const v = Number(handle.getAttribute('aria-valuenow'))
      const d = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 }[e.key]
      if (d !== undefined) { e.preventDefault(); set(v + d) }
    }
    box.style.touchAction = 'pan-y'
    box.addEventListener('pointerdown', down); box.addEventListener('pointermove', move); box.addEventListener('pointerup', up)
    handle.addEventListener('keydown', key)
    return () => { box.removeEventListener('pointerdown', down); box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); handle.removeEventListener('keydown', key) }
  }, [root])
  return null
}
