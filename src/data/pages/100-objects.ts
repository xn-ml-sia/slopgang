import { findProject } from '../projects.ts'
import type { PageValues } from '../../components/TemplatePage.tsx'

/** /project/100-objects values. Template: src/templates/case-web.html. Only title and summary are real; the rest is PLACEHOLDER template content. */
const p = findProject('100-objects')!
export const page: PageValues = { title: p.title, summary: p.summary }
