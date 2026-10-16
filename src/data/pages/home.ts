import { PROJECTS } from '../projects.ts'
import type { PageValues } from '../../components/TemplatePage.tsx'

/** Home page values. Template: src/templates/home.html (ref 1). Six cards, one per project. */
export const HOME_LEAD =
  'slopgang is an AI GmbH. We build apps for friends and family. Do you like a project? Join us and help with your time and skills.'

const cards: PageValues = {}
PROJECTS.forEach((p, i) => {
  cards[`card${i + 1}_href`] = p.href
  cards[`card${i + 1}_title`] = p.title
  cards[`card${i + 1}_summary`] = p.card ?? p.summary
  cards[`card${i + 1}_kind`] = p.kind
})

export const home: PageValues = {
  hero_title: 'slopgang',
  hero_lead: HOME_LEAD,
  ...cards,
  // Strange Fruit card: the template's own blossom drawing (ref 1, Dither booth card).
  card1_visual: '<img src="/tpl/blossom.png" alt="A spray of blossom, stippled" style="position:absolute;inset:0;width:100%;height:100%">',
  // Ausgang card: the template's own breathing rings (case-ios, Murmur "Breathe with me").
  card5_visual: '<div style="position:absolute;inset:0;display:grid;place-items:center"><svg viewBox="-60 -60 120 120" width="55%" height="80%" fill="none">' + [56, 44, 32, 20].map(r => `<circle r="${r}" stroke="var(--ink)" stroke-opacity="${r / 70}"></circle>`).join('') + '</svg></div>',
}
