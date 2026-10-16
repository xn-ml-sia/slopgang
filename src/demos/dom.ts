/** Small DOM helpers shared by the template demos. The templates are static HTML, so each demo is a React
 *  component that binds the ported reference behaviour to the markup that is already on the page. */
export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel)) as T[]

/** Closest ancestor of `el` that also contains `other`. */
export function commonRoot(el: Element, other: Element): HTMLElement | null {
  let n: Element | null = el
  while (n && !n.contains(other)) n = n.parentElement
  return n as HTMLElement | null
}

/** Button whose visible label (plain text, or the doubled-letter flap) is `text`. */
export function findButton(root: ParentNode, text: string) {
  return $$<HTMLButtonElement>(root, 'button').find(b => (b.querySelector('.sr-only')?.textContent ?? b.textContent)?.trim() === text) ?? null
}

/** Rewrite a button label, keeping the doubled-letter flap when the button has one. */
export function setLabel(btn: Element, text: string) {
  const flap = btn.querySelector<HTMLElement>('.kit-flap')
  if (flap) {
    flap.style.setProperty('--n', String(text.length))
    const esc = (c: string) => (c === ' ' ? '&nbsp;' : c.replace(/&/g, '&amp;').replace(/</g, '&lt;'))
    flap.innerHTML = `<span class="sr-only">${esc(text)}</span>` +
      [...text].map((c, i) => `<span aria-hidden="true" style="--i:${i}"><span>${esc(c)}</span><span>${esc(c)}</span></span>`).join('')
    return
  }
  const leaf = [...btn.querySelectorAll('span')].reverse().find(s => !s.children.length && s.textContent?.trim())
  if (leaf) leaf.textContent = text
  else btn.textContent = text
}

/** Wire a role=radiogroup of buttons: aria-checked, roving tabindex, arrow keys. */
export function radios(group: Element, onPick: (i: number, b: HTMLButtonElement) => void) {
  const bs = $$<HTMLButtonElement>(group, '[role=radio]')
  const pick = (i: number, focus = false) => {
    bs.forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); if (b.hasAttribute('tabindex')) b.tabIndex = k === i ? 0 : -1 })
    if (focus) bs[i].focus()
    onPick(i, bs[i])
  }
  const offs = bs.map((b, i) => {
    const click = () => pick(i)
    const key = (e: KeyboardEvent) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
      if (d) { e.preventDefault(); pick((i + d + bs.length) % bs.length, true) }
    }
    b.addEventListener('click', click); b.addEventListener('keydown', key)
    return () => { b.removeEventListener('click', click); b.removeEventListener('keydown', key) }
  })
  return () => offs.forEach(f => f())
}

/** Wire a role=switch button; the "On"/"Off" caption next to it follows. */
export function toggle(sw: HTMLElement, onChange: (on: boolean) => void) {
  const cap = sw.parentElement?.querySelector<HTMLElement>('span[aria-hidden].t-caption, span[aria-hidden]:last-child')
  const click = () => {
    const on = sw.getAttribute('aria-checked') !== 'true'
    sw.setAttribute('aria-checked', String(on))
    if (cap && /^(On|Off)$/.test(cap.textContent ?? '')) cap.textContent = on ? 'On' : 'Off'
    onChange(on)
  }
  sw.addEventListener('click', click)
  return () => sw.removeEventListener('click', click)
}
