import type { SlopTag } from '../types/feed.ts'

const COUNTER =
  /\b(grain|vhs|analog|chromatic|aberration|film[-\s]?stock|lo-?fi|handmade|scanograph|halation|gate\s?weave)\b/i
const TEXTUAL =
  /\b(delve|tapestry|landscape|nuanc|as an ai|it's important to note|in conclusion|leverage|unlock|game-?changer)\b/i

export function inferTags(input: {
  title: string
  body?: string
  hasMedia?: boolean
  fallback?: SlopTag
}): SlopTag[] {
  const blob = `${input.title} ${input.body ?? ''}`
  if (COUNTER.test(blob)) return ['counter-slop']
  if (TEXTUAL.test(blob)) return ['textual-slop']
  if (input.hasMedia) return ['visual-slop']
  return [input.fallback ?? 'textual-slop']
}

export const TAG_LABEL: Record<SlopTag, string> = {
  'visual-slop': 'Visual',
  'textual-slop': 'Textual',
  'counter-slop': 'Counter',
}
