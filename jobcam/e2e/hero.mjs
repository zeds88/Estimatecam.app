// Real media playback, motion preferences, manual control and relative asset paths.
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import assert from 'node:assert/strict'
const root = resolve('dist')
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
}
let upgradeWorkerVersion = 1
const server = createServer(async (req, res) => {
  try {
    if (
      new URL(req.url, 'http://localhost').pathname === '/upgrade-worker.js'
    ) {
      res.writeHead(200, {
        'Content-Type': 'text/javascript',
        'Cache-Control': 'no-store'
      })
      res.end(`
        // Regression fixture: the retiring worker fails optional media requests.
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
        ${upgradeWorkerVersion === 1 ? "self.addEventListener('fetch', event => { if (event.request.url.includes('.mp4')) event.respondWith(Response.error()); });" : ''}
      `)
      return
    }
    const path = new URL(req.url, 'http://localhost').pathname.replace(
      /^\/Estimatecam\.app\//,
      '/'
    )
    const file = resolve(
      root,
      `.${path.endsWith('/') ? `${path}index.html` : path}`
    )
    if (!file.startsWith(`${root}/`)) throw Error('Invalid path')
    const data = await readFile(file)
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
    res.setHeader(
      'Content-Type',
      types[extname(file)] ?? 'application/octet-stream'
    )
    res.setHeader('Accept-Ranges', 'bytes')
    if (range) {
      const start = +range[1],
        end = Math.min(range[2] ? +range[2] : data.length - 1, data.length - 1)
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
        'Content-Length': end - start + 1
      })
      res.end(data.subarray(start, end + 1))
    } else {
      res.setHeader('Content-Length', data.length)
      res.end(data)
    }
  } catch {
    res.writeHead(404)
    res.end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
const videos = '.beta-video-hero video'
try {
  browser = await chromium.launch()
  for (const base of ['/', '/Estimatecam.app/']) {
    const context = await browser.newContext({
      reducedMotion: 'no-preference',
      viewport: { width: 1280, height: 900 },
      serviceWorkers: 'allow'
    })
    const page = await context.newPage(),
      errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${origin}${base}`)
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].length === 2 &&
        [...document.querySelectorAll(selector)].every(
          (video) =>
            !video.paused && video.currentTime > 0.1 && video.videoWidth > 0
        ),
      videos
    )
    for (const video of await page.locator(videos).all()) {
      assert.equal(
        await video.evaluate(
          (node) => node.muted && node.loop && node.playsInline
        ),
        true
      )
      assert.ok((await video.getAttribute('src')).startsWith('./beta/'))
    }
    assert.deepEqual(
      await page
        .locator(videos)
        .evaluateAll((nodes) => nodes.map((video) => video.playbackRate)),
      [0.8, 1],
      'only silent field B-roll is slowed'
    )
    await page.locator('.beta-phone-frame video').evaluate((video) => {
      video.currentTime = 20
    })
    await page.waitForFunction(() =>
      document
        .querySelector('.beta-phone-demo figcaption')
        .textContent.includes('Your services. Your rates.')
    )
    await page
      .getByRole('button', { name: 'Pause hero video', exact: true })
      .click()
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every((video) => video.paused),
      videos
    )
    const times = await page
      .locator(videos)
      .evaluateAll((nodes) => nodes.map((video) => video.currentTime))
    await page.waitForTimeout(300)
    assert.deepEqual(
      await page
        .locator(videos)
        .evaluateAll((nodes) => nodes.map((video) => video.currentTime)),
      times,
      'both videos remain paused'
    )
    await page
      .getByRole('button', { name: 'Play hero video', exact: true })
      .click()
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every(
          (video) => !video.paused
        ),
      videos
    )
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every((video) => video.paused),
      videos
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every(
          (video) => !video.paused
        ),
      videos
    )
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller)
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            resolve,
            { once: true }
          )
        )
    })
    await page.reload()
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every(
          (video) => !video.paused && video.currentTime > 0
        ),
      videos
    )
    await context.setOffline(true)
    await page
      .getByRole('button', { name: 'Video available online', exact: true })
      .waitFor()
    assert.equal(
      await page
        .getByRole('button', { name: 'Video available online', exact: true })
        .isDisabled(),
      true
    )
    assert.equal(
      await page
        .locator(videos)
        .evaluateAll((nodes) =>
          nodes.every((video) => video.paused && !video.getAttribute('src'))
        ),
      true
    )
    await context.setOffline(false)
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every(
          (video) => !video.paused && video.currentTime > 0
        ),
      videos
    )
    assert.deepEqual(errors, [])
    await context.close()
  }
  for (const preference of ['reduced-motion', 'save-data']) {
    const context = await browser.newContext({
      reducedMotion:
        preference === 'reduced-motion' ? 'reduce' : 'no-preference',
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'allow'
    })
    if (preference === 'save-data')
      await context.addInitScript(() => {
        const network = new EventTarget()
        network.saveData = true
        Object.defineProperty(navigator, 'connection', { value: network })
      })
    const page = await context.newPage(),
      requests = []
    page.on('request', (request) => {
      if (request.url().includes('.mp4')) requests.push(request.url())
    })
    await page.goto(origin)
    await page
      .getByRole('button', { name: 'Play hero video', exact: true })
      .waitFor()
    await page.waitForTimeout(300)
    assert.equal(
      requests.length,
      0,
      `${preference}: no video download before manual play`
    )
    assert.equal(
      await page
        .locator(videos)
        .evaluateAll((nodes) =>
          nodes.every(
            (video) =>
              video.paused && !!video.poster && !video.getAttribute('src')
          )
        ),
      true
    )
    await page
      .getByRole('button', { name: 'Play hero video', exact: true })
      .click()
    await page.waitForFunction(
      (selector) =>
        [...document.querySelectorAll(selector)].every(
          (video) => !video.paused && video.currentTime > 0
        ),
      videos
    )
    assert.ok(requests.length >= 2)
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    )
    await context.close()
  }
  // A returning visitor can load the new page while the retiring worker still
  // owns its requests. Playback must recover on takeover without a manual click.
  const upgradeContext = await browser.newContext({ serviceWorkers: 'allow' })
  await upgradeContext.addInitScript(() => {
    const register = navigator.serviceWorker.register.bind(
      navigator.serviceWorker
    )
    navigator.serviceWorker.register = (_url, options) =>
      register('/upgrade-worker.js', options)
  })
  const upgradePage = await upgradeContext.newPage()
  await upgradePage.goto(origin)
  await upgradePage.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true
        })
      )
    }
  })
  await upgradePage.reload()
  await upgradePage.waitForFunction(
    (selector) =>
      [...document.querySelectorAll(selector)].every((video) => video.error),
    videos
  )
  upgradeWorkerVersion = 2
  await upgradePage.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration()).update()
  )
  await upgradePage.waitForFunction(
    (selector) =>
      [...document.querySelectorAll(selector)].every(
        (video) => !video.error && !video.paused && video.currentTime > 0.1
      ),
    videos
  )
  await upgradeContext.close()

  const precache = await (await fetch(`${origin}/precache-manifest.js`)).text()
  assert.ok(
    precache.includes('hero-field-poster.jpg') &&
      precache.includes('hero-app-poster.png')
  )
  assert.ok(
    !precache.includes('hero-field.mp4') && !precache.includes('hero-app.mp4'),
    'large optional loops are not precached'
  )
  console.log(
    'HERO E2E PASS: real muted playback, shared pause/resume, offscreen pause, reduced-motion/save-data opt-in, root/Pages media, offline posters and automatic worker-upgrade recovery'
  )
} finally {
  await browser?.close()
  await new Promise((resolve) => server.close(resolve))
}
