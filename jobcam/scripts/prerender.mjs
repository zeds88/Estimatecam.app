// Build actual React landing markup once, for every visitor (no bot-specific HTML).
// Guides are static documents; the workspace keeps its existing hash routes.
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const output = resolve('dist')
const renderer = resolve('node_modules/.cache/estimate-cam-prerender')
await build({ configFile: false, base: './', plugins: [react()], define: { __BUILD__: JSON.stringify('prerender') }, build: { ssr: 'src/prerender.tsx', outDir: renderer, emptyOutDir: true } })
const { renderPages } = await import(pathToFileURL(`${renderer}/prerender.js`).href)
const template = await readFile(`${output}/index.html`, 'utf8')
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const pages = renderPages()
let identity = ''
for (const page of pages) {
  const url = `https://estimatecam.com${page.path}`
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/>)/, `$1${escape(page.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*("\s*\/>)/, `$1${escape(page.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*("\s*\/>)/, `$1${escape(page.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*("\s*\/>)/, `$1${url}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*("\s*\/>)/, `$1${url}$2`)
    .replace('<div id="root"></div>', `<div id="root">${page.html}</div>`)
  if (page.schema) html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(page.schema).replaceAll('<', '\\u003c')}</script>\n</head>`)
  if (page.path !== '/') {
    // Guides don't execute the application or initialize analytics/storage.
    html = html.replace(/\s*<script type="module"[^>]*><\/script>/g, '').replace(/\s*<link rel="modulepreload"[^>]*>/g, '').replaceAll('href="./', 'href="../../')
  }
  const directory = page.path === '/' ? output : `${output}${page.path}`
  await mkdir(directory, { recursive: true })
  await writeFile(`${directory}/index.html`, html)
  identity += html
}
await writeFile(`${output}/robots.txt`, 'User-agent: *\nAllow: /\n\nSitemap: https://estimatecam.com/sitemap.xml\n')
await writeFile(`${output}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>https://estimatecam.com${page.path}</loc></url>`).join('\n')}\n</urlset>\n`)
// Include the final rendered content in the offline-shell version as well.
const manifestFile = `${output}/precache-manifest.js`
const prefix = 'self.__JOBCAM_PRECACHE = '
const manifest = JSON.parse((await readFile(manifestFile, 'utf8')).slice(prefix.length).trim().replace(/;$/, ''))
manifest.version = createHash('sha256').update(manifest.version + identity).digest('hex').slice(0, 12)
await writeFile(manifestFile, `${prefix}${JSON.stringify(manifest)};\n`)
console.log(`Prerendered ${pages.length} public pages; generated robots.txt and sitemap.xml.`)
