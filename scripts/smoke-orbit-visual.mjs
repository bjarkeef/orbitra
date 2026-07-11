/**
 * Focused orbit visual smoke (Playwright).
 * Usage: ORBITRA_BASE=http://127.0.0.1:3010 node scripts/smoke-orbit-visual.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(__dirname, '../docs/screenshots')
const base = process.env.ORBITRA_BASE || 'http://127.0.0.1:3010'

await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(60_000)
page.setDefaultNavigationTimeout(60_000)

const fails = []
function ok(label, cond, detail = '') {
  if (cond) console.log('OK  ', label, detail)
  else {
    console.log('FAIL', label, detail)
    fails.push(label + (detail ? ': ' + detail : ''))
  }
}

async function goto(url, retries = 2) {
  let last
  for (let i = 0; i <= retries; i++) {
    try {
      return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    }
    catch (e) {
      last = e
      console.log('retry goto', url, i + 1)
      await page.waitForTimeout(1500)
    }
  }
  throw last
}

// 1) Home
{
  const res = await goto(base + '/')
  ok('home status', res && res.ok())
  await page.waitForTimeout(1200)
  ok('home orbit spotlight', (await page.getByText('Orbit spotlight').count()) > 0)
  ok('home link /orbit', (await page.locator('a[href="/orbit"]').count()) > 0)
  await page.screenshot({ path: path.join(out, '01-home.png') })
  console.log('-> 01-home.png')
}

// 2) Orbit explorer
{
  const res = await goto(base + '/orbit')
  ok('orbit index', res && res.ok())
  await page.waitForTimeout(800)
  ok('orbit headline', (await page.getByText('Map the orbits').count()) > 0)
  await page.screenshot({ path: path.join(out, '08-orbit-index.png') })
  console.log('-> 08-orbit-index.png')
}

// 3) Person orbit graph
{
  const res = await goto(base + '/orbit/6193')
  ok('orbit person', res && res.ok())
  await page.waitForSelector('.actor-graph canvas', { timeout: 30_000 })
  await page.waitForFunction(() => !document.querySelector('.actor-graph .animate-pulse'), {
    timeout: 90_000,
  }).catch(() => fails.push('orbit graph still loading'))
  await page.waitForTimeout(2500)

  ok('canvas present', (await page.locator('.actor-graph canvas').count()) > 0)
  const stats = await page.locator('.actor-graph').innerText().catch(() => '')
  ok('stats nodes', /nodes/.test(stats), stats.replace(/\s+/g, ' ').slice(0, 140))

  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector('.actor-graph canvas')
    if (!c) return { ok: false }
    const ctx = c.getContext('2d')
    const data = ctx.getImageData(0, 0, Math.min(c.width, 400), Math.min(c.height, 300)).data
    let nonZero = 0
    for (let i = 0; i < data.length; i += 16) {
      if (data[i] + data[i + 1] + data[i + 2] + data[i + 3] > 10) nonZero++
    }
    return { ok: nonZero > 50, nonZero, w: c.width, h: c.height }
  })
  ok('canvas painted', canvasInfo.ok, JSON.stringify(canvasInfo))
  ok('no graph error', (await page.getByText('Could not build orbit').count()) === 0)

  // collaborator chips should use real faces when TMDB has paths
  const chipImgs = await page.locator('img.w-7.h-7.rounded-full').count()
  ok('collaborator avatars present', chipImgs >= 1, `imgs=${chipImgs}`)

  await page.screenshot({ path: path.join(out, '06-person-orbit.png'), fullPage: false })
  console.log('-> 06-person-orbit.png')

  // filter Movies
  const movieBtn = page.getByRole('button', { name: /^Movies$/i })
  if (await movieBtn.count()) {
    await movieBtn.click()
    await page.waitForTimeout(5000)
    await page.screenshot({ path: path.join(out, '09-orbit-filter-movie.png') })
    console.log('-> 09-orbit-filter-movie.png')
  }

  // select first list item
  const listItem = page.locator('[role="option"]').nth(1)
  if (await listItem.count()) {
    await listItem.click()
    await page.waitForTimeout(800)
    ok('node panel open', (await page.getByText(/Movie|TV show|Co-star|Repeat/i).count()) > 0)
  }
}

// 4) Actor page — orbit first
{
  const res = await goto(base + '/actor/6193')
  ok('actor page', res && res.ok())
  await page.waitForTimeout(2000)
  ok('actor #orbit', (await page.locator('#orbit').count()) > 0)
  // orbit should appear before Biography heading in DOM order
  const order = await page.evaluate(() => {
    const orbit = document.querySelector('#orbit')
    const bio = Array.from(document.querySelectorAll('h2')).find(h => /Biography/i.test(h.textContent || ''))
    if (!orbit || !bio) return null
    return Boolean(orbit.compareDocumentPosition(bio) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  ok('orbit before biography', order === true, String(order))
  await page.locator('#orbit').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(4000)
  await page.screenshot({ path: path.join(out, '05-person.png') })
  console.log('-> 05-person.png')
}

// Remaining product shots
for (const [name, url, wait] of [
  ['02-discover.png', '/discover', 1500],
  ['04-movie.png', '/m/27205', 2000],
  ['07-collections.png', '/collections', 1500],
]) {
  await goto(base + url)
  await page.waitForTimeout(wait)
  await page.screenshot({ path: path.join(out, name) })
  console.log('->', name)
}

await goto(base + '/search')
await page.waitForTimeout(600)
await page.locator('input').first().fill('Inception')
await page.waitForTimeout(2500)
await page.screenshot({ path: path.join(out, '03-search.png') })
console.log('-> 03-search.png')

await browser.close()

if (fails.length) {
  console.error('\nSMOKE FAILED:', fails.length)
  for (const f of fails) console.error(' -', f)
  process.exit(1)
}
console.log('\nSMOKE PASSED')
