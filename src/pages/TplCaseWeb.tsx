import html from '../templates/case-web.html?raw'
import css from '../templates/case-web.css?raw'
import { TemplatePage } from '../components/TemplatePage.tsx'
import { page } from '../data/pages/glitch-the-system.ts'

export default function TplCaseWeb() {
  return <TemplatePage html={html} css={css} values={page} title={`slopgang — ${page.title}`} />
}
