/**
 * Capture viewport screenshots for the README (requires app running on :3000).
 *
 *   npm run build && node .output/server/index.mjs
 *   node scripts/capture-screenshots.mjs
 *
 * Needs: npm i -D playwright && npx playwright install chromium
 * Also writes docs/screenshots/orbit-demo.gif (motion frames via gifenc).
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import gifenc from 'gifenc'

const { GIFEncoder, quantize, applyPalette } = gifenc

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

/**
 * Grab downscaled RGBA from the orbit canvas (display CSS size × scale).
 */
async function grabCanvasRgba(scale = 0.55) {
  return page.evaluate((s) => {
    const canvas = document.querySelector('.actor-graph canvas')
    if (!canvas) return null
    const w = Math.max(1, Math.floor(canvas.clientWidth * s))
    const h = Math.max(1, Math.floor(canvas.clientHeight * s))
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const ctx = off.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(canvas, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    return { width: w, height: h, data: Array.from(data) }
  }, scale)
}

async function captureOrbitDemoGif() {
  console.log('-> orbit-demo.gif')
  await page.goto(base + '/orbit/6193', { waitUntil: 'load', timeout: 90_000 })
  await page.waitForSelector('.actor-graph canvas', { timeout: 60_000 }).catch(() => {})
  // Wait for loading overlay to clear
  await page.waitForFunction(
    () => !document.querySelector('.actor-graph .animate-pulse'),
    { timeout: 90_000 },
  ).catch(() => {})
  await page.waitForTimeout(2500)

  // Enable physics motion (OrbitStage button label "Motion off" when inactive)
  const motionBtn = page.getByRole('button', { name: /Motion off|Motion on/ })
  if (await motionBtn.count()) {
    const label = await motionBtn.first().innerText()
    if (/Motion off/i.test(label)) {
      await motionBtn.first().click()
      await page.waitForTimeout(400)
    }
  }
  else {
    // Fallback: canvas control ▶ when motion is off
    const play = page.locator('.actor-graph button[title*="physics motion"]').first()
    if (await play.count()) await play.click()
  }

  const frames = []
  const frameCount = 12
  for (let i = 0; i < frameCount; i++) {
    const frame = await grabCanvasRgba(0.5)
    if (frame) frames.push(frame)
    await page.waitForTimeout(120)
  }

  if (!frames.length) {
    console.warn('orbit-demo.gif skipped — no canvas frames')
    return
  }

  const { width, height } = frames[0]
  const gif = GIFEncoder()
  for (let i = 0; i < frames.length; i++) {
    const rgba = frames[i].data
    // gifenc quantize expects packed 0xAABBGGRR uint32 pixels, not flat RGBA.
    const packed = new Uint32Array(width * height)
    for (let p = 0; p < packed.length; p++) {
      const o = p * 4
      packed[p] = (255 << 24) | (rgba[o + 2] << 16) | (rgba[o + 1] << 8) | rgba[o]
    }
    const palette = quantize(packed, 128, { format: 'rgb565' })
    const index = applyPalette(packed, palette, 'rgb565')
    gif.writeFrame(index, width, height, {
      palette,
      delay: 100, // ms (gifenc stores centiseconds)
      dispose: 1,
    })
  }
  gif.finish()
  await writeFile(path.join(out, 'orbit-demo.gif'), Buffer.from(gif.bytes()))
  console.log('   wrote orbit-demo.gif', width + 'x' + height, frames.length, 'frames')
}

await shot('01-home.png', base + '/', { waitSelector: 'text=Orbit spotlight' })
await shot('02-discover.png', base + '/discover')
await shot('02b-tonight.png', base + '/tonight', { waitSelector: 'text=Tonight' })

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

await captureOrbitDemoGif()

await browser.close()
console.log('Wrote screenshots to', out)
