import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportAll, importAll } from './backup'
import { DEFAULT_SETTINGS, get, listProjects, loadSettings, newProject, resetDb, saveProject, saveSettings } from './db'

const settings = {
  ...DEFAULT_SETTINGS,
  companyName: 'Backup company',
  ai: { provider: 'openai' as const, endpoint: 'https://original.example/vision', model: 'vision', apiKey: 'private-vision-key' },
  transcription: { ...DEFAULT_SETTINGS.transcription, endpoint: 'https://original.example/audio', apiKey: 'private-audio-key' },
}

describe('backup credentials', () => {
  beforeEach(async () => { await resetDb() })
  afterEach(() => { vi.restoreAllMocks() })

  it('omits both API keys from exports without changing local settings', async () => {
    await saveSettings(settings)
    const json = await exportAll()
    expect(json).not.toContain('private-vision-key')
    expect(json).not.toContain('private-audio-key')
    const saved = JSON.parse(json).data.meta.find((row: { key: string }) => row.key === 'settings').value
    expect(saved.ai).not.toHaveProperty('apiKey')
    expect(saved.transcription).not.toHaveProperty('apiKey')
    expect(saved.ai.endpoint).toBe(settings.ai.endpoint)
    expect(await loadSettings()).toEqual(settings)
  })

  it('ignores legacy backup keys on a new device while restoring non-secret settings', async () => {
    await importAll(JSON.stringify({ app: 'jobcam', version: 1, data: { meta: [{ key: 'settings', value: settings }] } }))
    const restored = await loadSettings()
    expect(restored.companyName).toBe(settings.companyName)
    expect(restored.ai.endpoint).toBe(settings.ai.endpoint)
    expect(restored.ai.apiKey).toBe('')
    expect(restored.transcription.apiKey).toBe('')
  })

  it('preserves local keys together with their trusted provider configurations', async () => {
    await saveSettings(settings)
    const incoming = {
      ...settings, companyName: 'Imported company',
      ai: { ...settings.ai, endpoint: 'https://untrusted.example/vision', apiKey: 'imported-vision-key' },
      transcription: { ...settings.transcription, endpoint: 'https://untrusted.example/audio', apiKey: 'imported-audio-key' },
    }
    await importAll(JSON.stringify({ app: 'jobcam', version: 1, data: { meta: [{ key: 'settings', value: incoming }] } }))
    const restored = await loadSettings()
    expect(restored.companyName).toBe('Imported company')
    expect(restored.ai).toEqual(settings.ai)
    expect(restored.transcription).toEqual(settings.transcription)
  })

  it('rejects malformed later stores and media before overwriting existing projects', async () => {
    const original = await saveProject(newProject({ id: 'existing', name: 'Original project' }))
    for (const data of [
      { projects: [{ ...original, name: 'Overwritten' }], estimates: {} },
      { projects: [{ ...original, name: 'Overwritten' }], comments: [null] },
      { projects: [{ ...original, name: 'Overwritten' }], photos: [{ id: 'photo', projectId: original.id, blob: 'not a data URL', thumb: 'data:image/png;base64,AAAA' }] },
    ]) {
      await expect(importAll(JSON.stringify({ app: 'jobcam', version: 1, data }))).rejects.toThrow()
      expect((await get<{ name: string }>('projects', original.id))?.name).toBe('Original project')
    }
  })

  it('rolls back earlier writes if a later store cannot save', async () => {
    const original = await saveProject(newProject({ id: 'existing', name: 'Original project' }))
    const nativePut = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'meta') throw new DOMException('Simulated storage failure', 'QuotaExceededError')
      return nativePut.apply(this, args)
    })
    const data = { projects: [{ ...original, name: 'Overwritten' }, newProject({ id: 'new', name: 'New project' })], meta: [{ key: 'settings', value: settings }] }
    await expect(importAll(JSON.stringify({ app: 'jobcam', version: 1, data }))).rejects.toThrow('Simulated storage failure')
    expect((await listProjects()).map((p) => p.name)).toEqual(['Original project'])
    expect((await loadSettings()).companyName).toBe(DEFAULT_SETTINGS.companyName)
  })
})
