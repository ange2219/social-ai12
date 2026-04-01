// Run with: node scripts/gen-icons.mjs
// Generates PWA icons using canvas (Node.js built-in via @napi-rs/canvas or inline SVG approach)
// We use a simple approach: write SVG files that Next.js can serve

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

function makeSVG(size) {
  const r = Math.round(size * 0.18)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#3B7BF6"/>
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size * 0.52)}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">S</text>
</svg>`
}

mkdirSync(join(publicDir, 'icons'), { recursive: true })

writeFileSync(join(publicDir, 'icons', 'icon-192.svg'), makeSVG(192))
writeFileSync(join(publicDir, 'icons', 'icon-512.svg'), makeSVG(512))
writeFileSync(join(publicDir, 'icons', 'apple-touch-icon.svg'), makeSVG(180))

console.log('SVG icons generated in public/icons/')
