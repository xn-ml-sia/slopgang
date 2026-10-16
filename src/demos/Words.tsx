import { useEffect } from 'react'
import { $$, reduced } from './dom.ts'

/* Ported from the reference About "In their words" rotator. The TESTIMONIALS data file is not in the source:
   the quotes below are the template's own placeholder quotes (About and Atlas pages). */
const TODO = 'Quote to add (Mal).'
const QUOTES: Record<string, { text: string; role: string; link: string; href: string }> = {
  'Astrid Kiel': { text: 'It looks like it was always ours. People ask who designed it, and then they ask to book a class, in that order.', role: 'Founder, Kiln Studio', link: 'The Kiln case study', href: '' },
  'Emil Brandt': { text: 'Before Atlas we argued about which file was the right one. Now we argue about what the land is doing, which is the argument we are paid for.', role: 'Chief Product Officer, Lumen Earth', link: 'The Atlas case study', href: '/project/glitch-the-system' },
}

export function Words({ root }: { root: HTMLElement }) {
  useEffect(() => {
    const tabs = root.querySelector('[role=tablist][aria-label=Clients]')
    const fig = tabs?.parentElement?.querySelector('figure')
    if (!tabs || !fig) return
    const bq = fig.querySelector('blockquote')!, cap = fig.querySelector('figcaption')!
    const name = cap.querySelector('.t-label')!, role = name.nextElementSibling as HTMLElement, a = cap.querySelector('a')!
    const bs = $$<HTMLButtonElement>(tabs, '[role=tab]')
    a.dataset.href0 = a.getAttribute('href') ?? ''
    let i = bs.findIndex(b => b.getAttribute('aria-selected') === 'true'), hold = false, t = 0
    const show = (k: number) => {
      i = k
      const n = bs[k].getAttribute('aria-label') ?? ''
      const q = QUOTES[n] ?? { text: TODO, role: 'To add (Mal)', link: '', href: '' }
      bq.innerHTML = `<span aria-hidden="true" class="text-[color:var(--ink-3)]">“</span>${q.text}<span aria-hidden="true" class="text-[color:var(--ink-3)]">”</span>`
      name.textContent = n; role.textContent = q.role
      a.textContent = q.link; a.style.visibility = q.link ? '' : 'hidden'
      a.setAttribute('href', q.href || a.dataset.href0!)
      bs.forEach((b, j) => { b.setAttribute('aria-selected', String(j === k)); b.firstElementChild?.classList.toggle('opacity-40', j !== k) })
      fig.classList.remove('kit-print-in'); void (fig as HTMLElement).offsetWidth; fig.classList.add('kit-print-in')
      schedule()
    }
    const schedule = () => { window.clearTimeout(t); if (!hold && !reduced()) t = window.setTimeout(() => show((i + 1) % bs.length), 7000) }
    const box = tabs.parentElement!
    const on = () => { hold = true; window.clearTimeout(t) }, off = () => { hold = false; schedule() }
    box.addEventListener('pointerenter', on); box.addEventListener('pointerleave', off)
    box.addEventListener('focusin', on); box.addEventListener('focusout', off)
    const clicks = bs.map((b, k) => { const f = () => show(k); b.addEventListener('click', f); return () => b.removeEventListener('click', f) })
    schedule()
    return () => { window.clearTimeout(t); clicks.forEach(f => f()); box.removeEventListener('pointerenter', on); box.removeEventListener('pointerleave', off); box.removeEventListener('focusin', on); box.removeEventListener('focusout', off) }
  }, [root])
  return null
}
