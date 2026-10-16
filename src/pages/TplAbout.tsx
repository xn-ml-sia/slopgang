import html from '../templates/about.html?raw'
import css from '../templates/about.css?raw'
import { TemplatePage } from '../components/TemplatePage.tsx'
import { about } from '../data/pages/about.ts'

export default function TplAbout() {
  return <TemplatePage html={html} css={css} values={about} title="slopgang — About" />
}
