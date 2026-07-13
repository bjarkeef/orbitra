/**
 * Capture viewport screenshots for the README.
 *
 *   npm run build && node .output/server/index.mjs   # default :3000
 *   npm run capture:screenshots
 *
 * Override base URL if port 3000 is taken:
 *   $env:ORBITRA_BASE='http://127.0.0.1:3010'; npm run capture:screenshots
 *
 * Needs: playwright (devDep) + npx playwright install chromium
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

async function shot(name, url, {
  extraWait = 2000,
  waitSelector = null,
  scrollY = 0,
} = {}) {
  console.log('->', name)
  // load (not networkidle): TMDB images / analytics keep the network busy
  await page.goto(url, { waitUntil: 'load', timeout: 90_000 })
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 60_000 }).catch(() => {})
  }
  await page.waitForTimeout(extraWait)
  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY)
    await page.waitForTimeout(600)
  }
  await page.screenshot({ path: path.join(out, name) })
}

await shot('01-home.png', base + '/', {
  extraWait: 3500,
  waitSelector: 'text=Orbit spotlight',
})
// Scroll past the tall filter panel so posters land in frame
await shot('02-discover.png', base + '/discover', {
  extraWait: 4000,
  waitSelector: 'img',
  scrollY: 420,
})
await shot('02b-tonight.png', base + '/tonight', {
  extraWait: 4000,
  waitSelector: 'text=Tonight',
})

console.log('-> 03-search.png')
await page.goto(base + '/search', { waitUntil: 'load', timeout: 90_000 })
await page.waitForTimeout(800)
await page.locator('#orbitra-search-input, input[type="search"]').first().fill('Inception')
await page.waitForTimeout(3500)
await page.screenshot({ path: path.join(out, '03-search.png') })

await shot('04-movie.png', base + '/m/27205', {
  extraWait: 3500,
  waitSelector: 'h1, img',
})
await shot('05-person.png', base + '/actor/6193', {
  extraWait: 3500,
  waitSelector: '#orbit',
})
await shot('06-person-orbit.png', base + '/orbit/6193', {
  extraWait: 9000,
  waitSelector: 'canvas, .actor-graph',
})
await shot('07-collections.png', base + '/collections', {
  extraWait: 3500,
  waitSelector: 'img, a',
})
await shot('08-orbit-index.png', base + '/orbit', {
  extraWait: 2500,
  waitSelector: 'text=Map the orbits',
})
await shot('09-orbit-filter-movie.png', base + '/orbit/6193?media=movie', {
  extraWait: 9000,
  waitSelector: 'canvas, .actor-graph',
})

await browser.close()
console.log('Wrote screenshots to', out)
