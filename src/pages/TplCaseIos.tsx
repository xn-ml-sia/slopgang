import html from '../templates/case-ios.html?raw'
import css from '../templates/case-ios.css?raw'
import { TemplatePage } from '../components/TemplatePage.tsx'
import { page as ikebana } from '../data/pages/ikebana.ts'
import { page as petCemetery } from '../data/pages/pet-cemetery.ts'
import { page as ausgang } from '../data/pages/ausgang.ts'

const PAGES = { ikebana, 'pet-cemetery': petCemetery, ausgang } as const

export default function TplCaseIos({ slug }: { slug: keyof typeof PAGES }) {
  const v = PAGES[slug]
  return <TemplatePage html={html} css={css} values={v} title={`slopgang — ${v.title}`} />
}
