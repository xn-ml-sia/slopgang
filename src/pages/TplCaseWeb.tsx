import html from '../templates/case-web.html?raw'
import css from '../templates/case-web.css?raw'
import { TemplatePage } from '../components/TemplatePage.tsx'
import { page as glitch } from '../data/pages/glitch-the-system.ts'
import { page as objects } from '../data/pages/100-objects.ts'

const PAGES = { 'glitch-the-system': glitch, '100-objects': objects } as const

export default function TplCaseWeb({ slug }: { slug: keyof typeof PAGES }) {
  const v = PAGES[slug]
  return <TemplatePage html={html} css={css} values={v} title={`slopgang — ${v.title}`} />
}
