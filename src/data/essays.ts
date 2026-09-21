import { essaysPart as a } from './essays-a.ts'
import { essaysPart as b } from './essays-b.ts'

/** Curator essays keyed by archive id — merged into FeedItem.essay at load. */
export const essays: Record<string, string> = { ...a, ...b }
