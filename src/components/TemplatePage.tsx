import { useEffect } from 'react'

export type PageValues = Record<string, string>

/** TODO(Mal): no contact address exists in the repo yet. Set a mailto: here. */
export const JOIN_HREF = '#todo-join-contact'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Renders one of Mal's reference templates (src/templates) with its own CSS.
 * PLACEHOLDER: everything in the template that is not a {{token}} is template content.
 * Tokens ending in _visual are trusted HTML from our own data files; all others are escaped.
 */
export function TemplatePage({ html, css, values, title }: { html: string; css: string; values: PageValues; title: string }) {
  useEffect(() => {
    document.title = title
  }, [title])
  const all: PageValues = { brand: 'slopgang', join_href: JOIN_HREF, ...values }
  const out = html.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const v = all[k] ?? ''
    return k.endsWith('_visual') ? v : esc(v)
  })
  return (
    <>
      <style>{css}</style>
      <div className="tpl-page" dangerouslySetInnerHTML={{ __html: out }} />
    </>
  )
}
