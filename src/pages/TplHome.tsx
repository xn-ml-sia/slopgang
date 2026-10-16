import html from '../templates/home.html?raw'
import css from '../templates/home.css?raw'
import { TemplatePage } from '../components/TemplatePage.tsx'
import { home } from '../data/pages/home.ts'

export default function TplHome() {
  return <TemplatePage html={html} css={css} values={home} title="slopgang" />
}
