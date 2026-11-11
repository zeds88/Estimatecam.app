// First-visit offline regression, with both a custom-domain root and Pages subpath.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { chromium } from 'playwright'

const root = resolve('dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
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
  for (const base of ['/', '/Estimatecam.app/']) {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${origin}${base}?first-visit=1`)
      await page.getByText('No projects yet').waitFor()
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready
        if (!navigator.serviceWorker.controller) await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
      })
      const cached = await page.evaluate(async () => {
        const keys = await caches.keys()
        return (await Promise.all(keys.map(async (key) => (await (await caches.open(key)).keys()).map((req) => req.url)))).flat()
      })
      assert.ok(cached.includes(`${origin}${base}`), 'canonical shell cached even when first URL has a query')
      assert.ok(cached.some((url) => /\/assets\/.*\.js$/.test(url)), 'static app JavaScript cached')
      assert.ok(cached.every((url) => url.startsWith(`${origin}${base}`)), 'only app-scope resources cached')
      assert.ok(cached.every((url) => !/transformers|\.wasm$|\/module-/.test(url)), 'optional AI and analytics downloads stay lazy')
      await page.getByRole('button', { name: 'New', exact: true }).click()
      await page.getByLabel('Project name').fill('Offline regression project')
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await page.getByRole('heading', { name: 'Offline regression project' }).waitFor()
      await context.setOffline(true)
      await page.reload()
      await page.getByRole('heading', { name: 'Offline regression project' }).waitFor()
      await page.getByRole('link', { name: 'Settings' }).last().click()
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor()
      assert.deepEqual(errors, [])
      console.log(`OFFLINE E2E PASS: first visit, offline reload and stored project at ${base}`)
    } finally { await context.close() }
  }
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)) }
