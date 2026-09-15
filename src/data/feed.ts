import raw from '../data/archive.json'

export type FeedTag = 'visual-slop' | 'textual-slop' | 'counter-slop'

export type FeedShape = 'portrait' | 'tall' | 'square' | 'wide' | 'land'

export type ArchiveRecord = {
  id: string
  title: string
  caption?: string
  body?: string
  palette?: string[]
  media?: {
    type: 'image'
    url: string
    alt?: string
    width?: number
    height?: number
  } | null
  url: string
  timestamp: string
  tags: FeedTag[]
}

const SHAPES: FeedShape[] = ['portrait', 'wide', 'square', 'tall', 'land', 'portrait', 'square']

const records = raw as ArchiveRecord[]

export function shortTitle(title: string): string {
  return title.replace(/^Specimen\s+\d+\s+[—–-]\s*/i, '').trim()
}

export function shapeFor(id: string, index: number): FeedShape {
  let n = index * 17
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i)
  return SHAPES[Math.abs(n) % SHAPES.length]
}

/** Photos first, with text/palette plates woven in so the wall is irregular, not a uniform stills row. */
export function arrangedSpecimens(): ArchiveRecord[] {
  const photos = records.filter((r) => r.media?.url)
  const rest = records.filter((r) => !r.media?.url)
  const out: ArchiveRecord[] = []
  let r = 0
  photos.forEach((photo, i) => {
    out.push(photo)
    if (i % 2 === 1 && r < rest.length) {
      out.push(rest[r])
      r += 1
    }
  })
  return out.concat(rest.slice(r))
}
