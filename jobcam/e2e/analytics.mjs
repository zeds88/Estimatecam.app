// Real-browser privacy regression: intercept every analytics request; never send test data.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { gunzipSync } from 'node:zlib'
import assert from 'node:assert/strict'

const port = 4174
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
const page = await context.newPage()
const requests = []
const events = []
const errors = []
const messages = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => messages.push(m.text().slice(0, 500)))

function decode(request) {
  const url = new URL(request.url())
  let body = request.postDataBuffer()
  if (!body?.length) return []
  if (url.searchParams.get('compression') === 'gzip-js') body = gunzipSync(body)
  let payload
  try { payload = JSON.parse(body.toString()) } catch {
    const data = new URLSearchParams(body.toString()).get('data') ?? url.searchParams.get('data')
    if (!data) throw Error('Unknown analytics payload format')
    payload = JSON.parse(Buffer.from(data, 'base64').toString())
  }
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.batch)) return payload.batch
  if (Array.isArray(payload.data)) return payload.data
  if (payload.event) return [payload]
  throw Error(`Unknown analytics envelope: ${Object.keys(payload).join(', ')}`)
}

await context.route(/https:\/\/[^/]*posthog\.com\//, async (route) => {
  requests.push(route.request().url())
  if (route.request().method() === 'POST') events.push(...decode(route.request()))
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' })
})

async function waitFor(check) {
  const deadline = Date.now() + 15_000
  while (!check()) {
    if (Date.now() > deadline) throw Error(`Timed out waiting for analytics: ${JSON.stringify({ requests, names: events.map((e) => e.event) })}`)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

try {
  for (let n = 0; n < 50; n++) {
    try { if ((await fetch(`http://localhost:${port}`)).ok) break } catch { /* server starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  await page.goto(`http://localhost:${port}/?private=LEAK_QUERY&__posthog_debug=true`)
  await page.getByText('No projects yet').waitFor()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Project name').fill('LEAK_PROJECT_BEFORE_CONSENT')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('heading', { name: 'LEAK_PROJECT_BEFORE_CONSENT' }).waitFor()
  await page.getByRole('link', { name: 'Settings' }).last().click()
  const consent = page.getByRole('checkbox', { name: 'Share optional usage analytics' })
  assert.equal(await consent.isChecked(), false)
  assert.equal(await consent.isEnabled(), true, 'build with the test PostHog configuration before running this test')
  assert.equal(requests.length, 0, 'no SDK or analytics request before consent')

  await consent.check()
  await waitFor(() => events.some((e) => e.event === 'jobcam_app_opened'))
  await page.getByRole('link', { name: 'Projects' }).last().click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Project name').fill('LEAK_PROJECT_AFTER_CONSENT')
  await page.getByLabel('Address', { exact: true }).fill('LEAK_CUSTOMER_ADDRESS')
  await page.getByLabel('Email', { exact: true }).fill('LEAK_EMAIL@example.test')
  // Submit from the focused field so this privacy test does not depend on mobile viewport scrolling.
  await page.getByLabel('Email', { exact: true }).press('Enter')
  await page.getByRole('heading', { name: 'LEAK_PROJECT_AFTER_CONSENT' }).waitFor()
  await page.getByLabel('Upload photos or videos').setInputFiles('e2e/fixtures/iphone-rotated.jpg')
  await page.getByRole('button', { name: 'Open photo' }).waitFor()
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Report', exact: true }).click()
  const popup = await popupPromise
  await popup.waitForURL(/^blob:/, { waitUntil: 'domcontentloaded' })
  await popup.close()
  await waitFor(() => ['jobcam_project_created', 'jobcam_media_added', 'jobcam_report_generated'].every((name) => events.some((e) => e.event === name)))

  const wire = JSON.stringify(events)
  assert.doesNotMatch(wire, /LEAK_|\$current_url|\$referrer|\$set|caption|transcript|apiKey/, 'no job content, form inputs, full URLs or person updates in transmitted events')
  assert.ok(events.filter((e) => e.event === 'jobcam_screen_viewed').every((e) => ['projects', 'project', 'settings'].includes(e.properties.screen)))
  assert.ok(events.every((e) => e.properties.environment === 'development'))
  assert.ok(requests.every((url) => !/\/flags\/|\/s\/|\/surveys/.test(url)), 'no flags, recordings or survey requests')

  await page.getByRole('link', { name: 'Settings' }).last().click()
  await waitFor(() => events.filter((e) => e.event === 'jobcam_screen_viewed' && e.properties.screen === 'settings').length >= 2)
  await consent.uncheck()
  const sent = events.length
  await page.getByRole('link', { name: 'Projects' }).last().click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Project name').fill('LEAK_AFTER_OPT_OUT')
  await page.getByLabel('Project name').press('Enter')
  await page.getByRole('heading', { name: 'LEAK_AFTER_OPT_OUT' }).waitFor()
  await new Promise((resolve) => setTimeout(resolve, 4000))
  assert.equal(events.length, sent, 'no events after opting out')
  await page.reload()
  await page.getByRole('link', { name: 'Settings' }).last().click()
  assert.equal(await consent.isChecked(), false, 'opt-out persists across reload')
  assert.deepEqual(errors, [])
  console.log(`ANALYTICS E2E PASS: ${sent} intercepted events; no live telemetry sent`)
} catch (error) {
  await page.screenshot({ path: `${process.env.SHOTS ?? '/tmp'}/jobcam-analytics-FAIL.png`, fullPage: true }).catch(() => {})
  console.error(messages.slice(-20).join('\n'))
  throw error
} finally {
  await browser.close()
  server.kill()
}
