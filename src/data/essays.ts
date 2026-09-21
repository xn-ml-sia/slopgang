import { essaysPart as e0 } from './essays-0.ts'
import { essaysPart as e1 } from './essays-1.ts'
import { essaysPart as e2 } from './essays-2.ts'
import { essaysPart as e3 } from './essays-3.ts'

/** Curator essays keyed by archive id — merged into FeedItem.essay at load. */
export const essays: Record<string, string> = { ...e0, ...e1, ...e2, ...e3 }
