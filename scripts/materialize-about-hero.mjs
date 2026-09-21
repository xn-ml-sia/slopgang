import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const b64Path = path.join(root, 'src/data/about-hero.webp.b64')
const outPath = path.join(root, 'public/about/hero.webp')

const b64 = fs.readFileSync(b64Path, 'utf8').trim()
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, Buffer.from(b64, 'base64'))
console.log(`materialized ${outPath} (${Buffer.from(b64, 'base64').length} bytes)`)
