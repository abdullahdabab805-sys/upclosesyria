// Smaller copies of the guide photos (SEO day 6): public/guide/<name>.webp → public/guide/sm/<name>.webp
// at 560px wide. Vercel's image optimizer is off (quota), so these are made once here and committed;
// src/lib/imageLoader.ts serves them when the browser needs 560px or less (cards, gallery tiles, phone heroes).
//   npm run photos:variants          → makes the missing copies (and remakes any older than their photo)
//   npm run photos:variants -- --all → remakes every copy
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'public/guide'
const OUT = join(SRC, 'sm')
// Keep in step with GUIDE_SMALL_WIDTH in src/lib/guideImages.ts (tests/unit/mediaAudit.test.ts checks).
const WIDTH = 560
const all = process.argv.includes('--all')

mkdirSync(OUT, { recursive: true })
let made = 0
let before = 0
let after = 0
for (const f of readdirSync(SRC).filter((n) => n.endsWith('.webp'))) {
  const from = join(SRC, f)
  const to = join(OUT, f)
  if (!all && existsSync(to) && statSync(to).mtimeMs >= statSync(from).mtimeMs) continue
  await sharp(from).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(to)
  before += statSync(from).size
  after += statSync(to).size
  made++
}
console.log(`${made} copies made in ${OUT} (${Math.round(before / 1024)}KB of originals → ${Math.round(after / 1024)}KB).`)
