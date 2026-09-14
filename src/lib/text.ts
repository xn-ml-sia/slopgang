const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, ent: string) => {
    if (ent[0] === '#') {
      const code =
        ent[1] === 'x' || ent[1] === 'X' ? Number.parseInt(ent.slice(2), 16) : Number.parseInt(ent.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ''
    }
    return ENTITIES[ent.toLowerCase()] ?? `&${ent};`
  })
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function firstImageSrc(html: string): string | undefined {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? decodeEntities(match[1]) : undefined
}

export function clip(text: string, max = 420): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}

export function innerXml(block: string, tag: string): string | undefined {
  const cdata = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'),
  )
  if (cdata) return cdata[1].trim()
  const plain = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  if (plain) return decodeEntities(plain[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim()
  return undefined
}

export function attr(block: string, tag: string, name: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}([^>]*)/?>`, 'i'))
  if (!match) return undefined
  const value = match[1].match(new RegExp(`\\s${name}=["']([^"']+)["']`, 'i'))
  return value ? decodeEntities(value[1]) : undefined
}

export function splitBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = []
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(xml))) blocks.push(match[0])
  return blocks
}
