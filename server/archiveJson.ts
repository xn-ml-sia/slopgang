import type { Plugin } from 'vite'
import archive from '../src/data/archive.json' with { type: 'json' }
import about from '../src/data/about.json' with { type: 'json' }
import { essays } from '../src/data/essays.ts'

/**
 * Publishes /archive.json and /about.json in dist for the iOS app.
 * Built from src/data at build time, so there is no second hand-edited copy.
 * Each record gets its merged essay, slug, and thumbnail paths (px 32px, md 256px).
 */
type Rec = { id: string; essay?: string; author?: string; [k: string]: unknown }

const FALLBACK_LOGGERS = ['Ada Ridge', 'N. Vale', 'Jules Orm', 'Mira Chen', 'Theo Ash', 'Rin Calder', 'Ivy Moss', 'Seth Wren']

function loggedBy(r: Rec): string {
  const named = r.author?.trim()
  if (named && named.toLowerCase() !== 'lab') return named
  let h = 0
  for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) >>> 0
  return FALLBACK_LOGGERS[h % FALLBACK_LOGGERS.length]
}

export function buildArchive() {
  const items = (archive as unknown as Rec[]).map((r) => {
    const slug = r.id.replace(/^archive:/i, '')
    const sg = /sg-\d+/i.exec(r.id)?.[0]?.toLowerCase()
    return {
      ...r,
      slug,
      essay: r.essay ?? essays[r.id],
      loggedBy: loggedBy(r),
      thumbs: sg ? { px: `/archive/px/${sg}.webp`, md: `/archive/md/${sg}.webp` } : null,
    }
  })
  return { version: 1, generatedAt: new Date().toISOString(), items }
}

export function archiveJsonPlugin(): Plugin {
  return {
    name: 'slopgang-archive-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'archive.json', source: JSON.stringify(buildArchive()) })
      this.emitFile({ type: 'asset', fileName: 'about.json', source: JSON.stringify(about) })
    },
  }
}
