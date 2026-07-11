/**
 * Capture viewport screenshots for the README (requires app running on :3000).
 *
 *   npm run build && node .output/server/index.mjs
 *   node scripts/capture-screenshots.mjs
 *
 * Needs: npm i -D playwright && npx playwright install chromium
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(__dirname, '../docs/screenshots')
const base = process.env.ORBITRA_BASE || 'http://127.0.0.1:3000'

await mkdir(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})

async function shot(name, url, { extraWait = 2000, waitSelector = null } = {}) {
  console.log('->', name)
  // load (not networkidle): TMDB images / analytics keep the network busy
  await page.goto(url, { waitUntil: 'load', timeout: 90_000 })
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 60_000 }).catch(() => {})
  }
  await page.waitForTimeout(extraWait)
  await page.screenshot({ path: path.join(out, name) })
}

await shot('01-home.png', base + '/', { waitSelector: 'text=Orbit spotlight' })
await shot('02-discover.png', base + '/discover')

await page.goto(base + '/search', { waitUntil: 'load', timeout: 90_000 })
await page.waitForTimeout(800)
await page.locator('input').first().fill('Inception')
await page.waitForTimeout(3000)
await page.screenshot({ path: path.join(out, '03-search.png') })

await shot('04-movie.png', base + '/m/27205')
await shot('05-person.png', base + '/actor/6193', { extraWait: 3000, waitSelector: '#orbit' })
await shot('06-person-orbit.png', base + '/orbit/6193', {
  extraWait: 8000,
  waitSelector: 'canvas, .actor-graph',
})
await shot('07-collections.png', base + '/collections')

await browser.close()
console.log('Wrote screenshots to', out)
