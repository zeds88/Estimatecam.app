// Public content must be readable without JavaScript, at root and Pages paths.
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import assert from 'node:assert/strict'

const root = resolve('dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' }
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname.replace(/^\/Estimatecam\.app\//, '/')
    const file = resolve(root, `.${path.endsWith('/') ? `${path}index.html` : path}`)
    if (!file.startsWith(`${root}/`)) throw Error('Invalid path')
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream')
    res.end(await readFile(file))
  } catch { res.writeHead(404); res.end() }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
try {
  browser = await chromium.launch()
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const paths = ['/', '/guides/jobsite-photo-reports/', '/guides/contractor-estimate-checklist/']
  for (const base of ['/', '/Estimatecam.app/']) for (const path of paths) {
    const response = await page.goto(`${origin}${base}${path.slice(1)}`)
    assert.equal(response.status(), 200)
    assert.equal(await page.locator('h1').count(), 1)
    assert.ok((await page.locator('main').innerText()).length > 1800, 'substantive initial HTML')
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `https://estimatecam.com${path}`)
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), `https://estimatecam.com${path}`)
    assert.match(await page.title(), /Estimate Cam/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'fits mobile')
    // All same-origin links and styles must resolve without a SPA rewrite.
    const resources = await page.locator('a[href], link[rel=stylesheet], img[src]').evaluateAll((nodes) => nodes.map((node) => node.href ?? node.src))
    for (const href of new Set(resources)) {
      const url = new URL(href)
      if (url.origin === origin) {
        assert.ok(url.pathname.startsWith(base), `resource must stay in app base: ${href}`)
        assert.equal((await fetch(url)).status, 200, href)
      }
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
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)) }
