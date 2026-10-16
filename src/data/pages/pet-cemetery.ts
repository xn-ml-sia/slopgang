import { findProject } from '../projects.ts'
import type { PageValues } from '../../components/TemplatePage.tsx'

/** /project/pet-cemetery values. Template: src/templates/case-ios.html. Only title and summary are real; the rest is PLACEHOLDER template content. */
const p = findProject('pet-cemetery')!
export const page: PageValues = { title: p.title, summary: p.summary, next_href: '/project/glitch-the-system' }
