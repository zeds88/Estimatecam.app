import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify((process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA)?.slice(0, 7) ?? 'dev') },
  plugins: [react(), {
    name: 'jobcam-offline-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = new Set(['./', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'beta/sample-drainage.webp'])
      const addChunk = (name: string) => {
        if (files.has(name)) return
        const chunk = bundle[name]
        if (chunk?.type !== 'chunk') return
        files.add(name)
        chunk.imports.forEach(addChunk)
      }
      for (const item of Object.values(bundle)) {
        if (item.type === 'chunk' && item.isEntry) addChunk(item.fileName)
        if (item.fileName.endsWith('.css')) files.add(item.fileName)
      }
      // Hashed entry/import names change with the shell; optional dynamic chunks
      // (analytics, Whisper and its WASM) stay lazy instead of blocking installation.
      const names = [...files].sort()
      const html = bundle['index.html']
      const identity = JSON.stringify(names) + (html?.type === 'asset' ? String(html.source) : '')
      let version = 2166136261
      for (let i = 0; i < identity.length; i++) version = Math.imul(version ^ identity.charCodeAt(i), 16777619) >>> 0
      this.emitFile({ type: 'asset', fileName: 'precache-manifest.js', source: `self.__JOBCAM_PRECACHE = ${JSON.stringify({ version: version.toString(16), files: names })};\n` })
    },
  }],
  test: { environment: 'node', setupFiles: ['./src/lib/test-setup.ts'] },
})
