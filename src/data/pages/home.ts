import { PROJECTS } from '../projects.ts'
import type { PageValues } from '../../components/TemplatePage.tsx'

/** Home page values. Template: src/templates/home.html (ref 1). Cards 5 and 6 stay template placeholders. */
export const HOME_LEAD =
  'slopgang is an AI GmbH. We build apps for friends and family. Do you like a project? Join us and help with your time and skills.'

const cards: PageValues = {}
PROJECTS.forEach((p, i) => {
  cards[`card${i + 1}_href`] = p.href
  cards[`card${i + 1}_title`] = p.title
  cards[`card${i + 1}_summary`] = p.summary
})

export const home: PageValues = {
  hero_title: 'slopgang',
  hero_lead: HOME_LEAD,
  ...cards,
  // Strange Fruit card: the template's own blossom drawing (ref 1, Dither booth card).
  card1_visual: '<img src="/tpl/blossom.png" alt="A spray of blossom, stippled" style="position:absolute;inset:0;width:100%;height:100%">',
}
