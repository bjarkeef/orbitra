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

async function shot(name, url, { extraWait = 2000, clickOrbit = false } = {}) {
  console.log('->', name)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(extraWait)
  if (clickOrbit) {
    const orbit = page.locator('button', { hasText: /^Orbit$/i })
    if (await orbit.count()) {
      await orbit.first().click()
      await page.waitForTimeout(5000)
      await orbit.first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
    }
  }
  await page.screenshot({ path: path.join(out, name) })
}

await shot('01-home.png', base + '/')
await shot('02-discover.png', base + '/discover')

await page.goto(base + '/search', { waitUntil: 'networkidle', timeout: 90_000 })
await page.waitForTimeout(800)
await page.locator('input').first().fill('Inception')
await page.waitForTimeout(3000)
await page.screenshot({ path: path.join(out, '03-search.png') })

await shot('04-movie.png', base + '/m/27205')
await shot('05-person.png', base + '/actor/6193')
await shot('06-person-orbit.png', base + '/actor/6193', { clickOrbit: true, extraWait: 2500 })
await shot('07-collections.png', base + '/collections')

await browser.close()
console.log('Wrote screenshots to', out)
