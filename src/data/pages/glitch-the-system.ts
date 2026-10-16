import { findProject } from '../projects.ts'
import type { PageValues } from '../../components/TemplatePage.tsx'

/** /project/glitch-the-system values. Template: src/templates/case-web.html. Only title and summary are real; the rest is PLACEHOLDER template content. */
const p = findProject('glitch-the-system')!
export const page: PageValues = { title: p.title, summary: p.summary, next_href: '/project/ikebana' }
