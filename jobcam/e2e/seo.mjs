// Public content must be readable without JavaScript, at root and Pages paths.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const port = 4175
const origin = `http://localhost:${port}`
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  for (let n = 0; n < 50; n++) {
    try { if ((await fetch(origin)).ok) break } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  browser = await chromium.launch()
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const paths = ['/', '/guides/jobsite-photo-reports/', '/guides/contractor-estimate-checklist/']
  for (const path of paths) {
    const response = await page.goto(`${origin}${path}`)
    assert.equal(response.status(), 200)
    assert.equal(await page.locator('h1').count(), 1)
    assert.ok((await page.locator('main').innerText()).length > 1800, 'substantive initial HTML')
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `https://estimatecam.com${path}`)
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), `https://estimatecam.com${path}`)
    assert.match(await page.title(), /Estimate Cam/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'fits mobile')
    // All same-origin links and styles must resolve without a SPA rewrite.
    const resources = await page.locator('a[href], link[rel=stylesheet]').evaluateAll((nodes) => nodes.map((node) => node.href))
    for (const href of new Set(resources)) {
      const url = new URL(href)
      if (url.origin === origin) assert.equal((await fetch(url)).status, 200, href)
    }
    if (path !== '/') assert.equal(await page.locator('script[type=module]').count(), 0, 'guides need no app JavaScript')
  }
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text()
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, paths.length)
  for (const path of paths) assert.ok(sitemap.includes(`<loc>https://estimatecam.com${path}</loc>`))
  assert.ok(!sitemap.includes('#'), 'only real public URLs in sitemap')
  const robots = await (await fetch(`${origin}/robots.txt`)).text()
  assert.match(robots, /Allow: \/\n/)
  assert.match(robots, /Sitemap: https:\/\/estimatecam.com\/sitemap.xml/)
  await page.goto(origin)
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())
  assert.ok(schema['@graph'].some((node) => node['@type'] === 'SoftwareApplication' && node.offers.price === '0'))
  console.log('SEO E2E PASS: initial HTML, public links/assets, mobile, canonical URLs, structured data, robots and sitemap')
} finally { await browser?.close(); server.kill() }
