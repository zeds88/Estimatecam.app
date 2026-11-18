// Record a fictional branded project in a disposable context. No live APIs.
// node scripts/media/record-hero-demo.mjs <origin> <output-dir> <local-photo>
import { chromium } from 'playwright'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const [origin = 'http://127.0.0.1:4180', outputArg, photoArg] =
  process.argv.slice(2)
if (!outputArg || !photoArg)
  throw Error('Output directory and local field photo required')
const output = resolve(outputArg)
await mkdir(output, { recursive: true })
const brand = JSON.parse(
  await readFile(new URL('./brand/ironvale.json', import.meta.url), 'utf8')
)
const logo = new URL('./brand/ironvale-mark.png', import.meta.url).pathname
const photo = (await readFile(photoArg)).toString('base64')
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 780 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'light',
  serviceWorkers: 'block',
  recordVideo: { dir: output, size: { width: 390, height: 780 } }
})
await context.route('https://**/*', (route) => route.abort())
const page = await context.newPage()
page.setDefaultTimeout(15000)
const phases = []
let start
const hold = (ms) => page.waitForTimeout(ms)
const phase = async (title, detail) => {
  phases.push({ at: (Date.now() - start) / 1000, title, detail })
  await page.screenshot({ path: `${output}/scene-${phases.length}.png` })
}
const business = async () => {
  await page.goto(`${origin}/#/settings`)
  await page.reload()
  await page
    .getByRole('heading', { name: 'Your business', exact: true })
    .scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, -12))
}
try {
  await page.goto(origin)
  await page
    .getByRole('link', { name: 'Try the free beta', exact: true })
    .first()
    .click()
  await page.getByText('No projects yet').waitFor()
  await page.evaluate(
    async ({ base64, brand }) => {
      const blob = new Blob(
        [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
        { type: 'image/jpeg' }
      )
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open('jobcam')
        r.onsuccess = () => resolve(r.result)
        r.onerror = () => reject(r.error)
      })
      const template = {
        id: 'ironvale-scope',
        custom: true,
        trade: 'Landscaping',
        title: 'Courtyard bed & drainage review',
        summary: 'Ironvale Outdoor Co. — sample project scope.',
        scope: [
          'Review {{area|Work area|text|Courtyard bed}} with the customer.',
          '{{work|Proposed work|text|Reset the existing bed edge.}}',
          'Confirm grades and drainage route before excavation.'
        ],
        included: ['Site photos and a written work summary.'],
        excluded: ['Hidden utilities, permits and drainage installation.'],
        assumptions: [
          'Sample scope only; all dimensions require field verification.'
        ],
        warranty: ''
      }
      const tx = db.transaction(
        ['projects', 'photos', 'estimates', 'scopes', 'meta'],
        'readwrite'
      )
      tx.objectStore('projects').put({
        id: 'hero-practice',
        name: 'Courtyard improvement',
        status: 'active',
        customer: '',
        address: '',
        phone: '',
        email: '',
        notes:
          'Fictional demonstration. Sample scope and quantities; verify all field conditions.',
        createdAt: Date.now()
      })
      tx.objectStore('photos').put({
        id: 'hero-photo',
        projectId: 'hero-practice',
        caption: 'Courtyard site review',
        blob,
        thumb: blob,
        tags: ['Before'],
        annotations: [],
        takenAt: Date.now()
      })
      tx.objectStore('scopes').put({
        id: 'hero-scope',
        projectId: 'hero-practice',
        title: template.title,
        template,
        values: { area: 'Courtyard bed', work: 'Reset the existing bed edge.' },
        createdAt: Date.now()
      })
      tx.objectStore('estimates').put({
        id: 'hero-estimate',
        projectId: 'hero-practice',
        title: 'Courtyard — sample allowance',
        items: [],
        taxRate: 0,
        proposal: true,
        createdAt: Date.now()
      })
      tx.objectStore('meta').put({
        key: 'settings',
        value: {
          companyName: brand.name,
          author: 'Demo',
          branding: {
            logo: '',
            color: brand.color,
            tagline: brand.tagline,
            email: brand.email,
            phone: '',
            website: brand.website,
            address: '',
            license: '',
            terms: brand.terms,
            footer: brand.footer
          },
          customTemplates: [template],
          priceBook: brand.priceBook
        }
      })
      await new Promise((res, rej) => {
        tx.oncomplete = res
        tx.onerror = () => rej(tx.error)
      })
      db.close()
    },
    { base64: photo, brand }
  )
  await business()
  await page.getByLabel('Upload logo', { exact: true }).setInputFiles(logo)
  await hold(800)
  await business()
  await hold(500)
  start = Date.now()
  await page.screenshot({ path: `${output}/app-poster.png` })
  await phase('Your company. Your look.', 'Logo, colors and business details')
  await hold(2500)
  await page.getByLabel('Custom brand color').scrollIntoViewIfNeeded()
  await hold(700)
  await page.getByLabel('Custom brand color').fill('#18324f')
  await hold(1600)
  await page.getByRole('button', { name: 'Use #b45309', exact: true }).click()
  await hold(2200)
  await page.goto(`${origin}/#/p/hero-practice`)
  await page
    .getByRole('button', { name: 'Courtyard site review', exact: true })
    .click()
  await phase(
    'Make every photo useful.',
    'Add your own site notes and captions'
  )
  const caption = page.getByPlaceholder('What does this photo show?')
  await caption.scrollIntoViewIfNeeded()
  await caption.fill('Review bed edge and surface drainage.')
  await caption.blur()
  await hold(4200)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Scope/ }).first().click()
  await page.getByRole('button', { name: 'Edit blanks', exact: true }).click()
  await phase(
    'Write the scope your way.',
    'Reusable templates with editable details'
  )
  await page
    .getByLabel('Proposed work', { exact: true })
    .fill('Lift and reset the existing bed edge; tidy the planting bed.')
  await hold(2100)
  await page
    .getByRole('button', { name: 'Save to project', exact: true })
    .click()
  await page.getByRole('button', { name: /Courtyard bed.*complete/ }).click()
  await page
    .getByText('Lift and reset the existing bed edge; tidy the planting bed.', {
      exact: true
    })
    .scrollIntoViewIfNeeded()
  await hold(3500)
  await page
    .getByRole('button', { name: /Estimate/ })
    .first()
    .click()
  await page.getByLabel('Add from price book').selectOption('0')
  await page.getByLabel('Quantity', { exact: true }).scrollIntoViewIfNeeded()
  await phase(
    'Your services. Your rates.',
    'Your price book, quantities and line items'
  )
  await page.getByLabel('Quantity', { exact: true }).fill('24')
  await page.getByLabel('Quantity', { exact: true }).blur()
  await hold(1800)
  await page.getByLabel('Unit price', { exact: true }).fill('32')
  await page.getByLabel('Unit price', { exact: true }).blur()
  await hold(2200)
  await page.getByText('Total', { exact: true }).last().scrollIntoViewIfNeeded()
  await hold(2400)
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Report', exact: true }).click()
  const report = await popupPromise
  await report.waitForURL('blob:**')
  await report.locator('.co').waitFor()
  const html = await report.content()
  await writeFile(`${output}/ironvale-report.html`, html)
  await report.close()
  // Display the app's actual generated document in the recorded viewport.
  await page.setContent(html)
  await page.evaluate(() => window.scrollTo(0, 0))
  await phase(
    'Put your name on the result.',
    'Branded reports with your scope and pricing'
  )
  await hold(3500)
  await page.locator('.scope').first().scrollIntoViewIfNeeded()
  await hold(3000)
  await page.locator('table').first().scrollIntoViewIfNeeded()
  await hold(4000)
  await business()
  await phase(
    'Built around your business.',
    'Try the free beta at estimatecam.com'
  )
  await hold(2800)
  const duration = (Date.now() - start) / 1000
  const video = page.video()
  await page.close()
  await video.saveAs(`${output}/app-session.webm`)
  await writeFile(
    `${output}/recording.json`,
    JSON.stringify(
      {
        duration,
        phases,
        viewport: { width: 390, height: 780 },
        brand,
        fictional: true
      },
      null,
      2
    )
  )
} finally {
  await context.close()
  await browser.close()
}
