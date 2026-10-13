// Gera os ícones PNG do PWA a partir de public/icon.svg usando o Chromium do Playwright.
// Uso: node scripts/generate-icons.mjs
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svg = await readFile(path.join(root, 'public/icon.svg'), 'utf8')

const targets = [
  { file: 'pwa-64x64.png', size: 64 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'maskable-icon-512x512.png', size: 512 },
  { file: 'apple-touch-icon-180x180.png', size: 180 },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size } of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<html><body style="margin:0;background:#080816">
      <div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>
    </body></html>`,
  )
  await page.screenshot({ path: path.join(root, 'public', file), omitBackground: false })
  console.log('✔', file)
}
await browser.close()
