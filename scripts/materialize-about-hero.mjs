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
const PINNED =
  'https://raw.githubusercontent.com/xn-ml-sia/slopgang/5dea36ed0a6f69f2cf32a41192a06499ee4c3c12/src/data/about-hero'

fs.mkdirSync(dir, { recursive: true })

async function ensurePart(i) {
  const name = `part-${String(i).padStart(2, '0')}`
  const local = path.join(dir, name)
  if (fs.existsSync(local) && fs.statSync(local).size > 0) {
    return fs.readFileSync(local, 'utf8').trim()
  }
  const res = await fetch(`${PINNED}/${name}`)
  if (!res.ok) throw new Error(`fetch ${name}: ${res.status}`)
  const text = (await res.text()).trim()
  fs.writeFileSync(local, text)
  return text
}

const parts = []
for (let i = 0; i < 17; i++) parts.push(await ensurePart(i))
const b64 = parts.join('')
const buf = Buffer.from(b64, 'base64')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, buf)
if (buf.length !== 50374) {
  throw new Error(`unexpected hero.webp size ${buf.length}, expected 50374`)
}
console.log(`materialized ${outPath} (${buf.length} bytes from ${parts.length} parts)`)
