import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dir = path.join(root, 'src/data/about-hero')
const outPath = path.join(root, 'public/about/hero.webp')

const parts = fs
  .readdirSync(dir)
  .filter((n) => n.startsWith('part-'))
  .sort()
const b64 = parts.map((n) => fs.readFileSync(path.join(dir, n), 'utf8').trim()).join('')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
const buf = Buffer.from(b64, 'base64')
fs.writeFileSync(outPath, buf)
console.log(`materialized ${outPath} (${buf.length} bytes from ${parts.length} parts)`)
