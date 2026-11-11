import { STORES, getAll, loadSettings, putAllAtomic, type StoreName } from './db'
import { blobToDataUrl, dataUrlToBlob } from './blob'
import type { Photo, Settings } from './types'

function withoutApiKey(config: unknown): Record<string, unknown> {
  const copy = config && typeof config === 'object' ? { ...config } as Record<string, unknown> : {}
  delete copy.apiKey
  return copy
}

/** Device credentials never travel with a portable backup. */
function exportMeta(row: Record<string, unknown>): Record<string, unknown> {
  if (row.key !== 'settings' || !row.value || typeof row.value !== 'object') return row
  const value = row.value as Partial<Settings>
  return { ...row, value: { ...value, ai: withoutApiKey(value.ai), transcription: withoutApiKey(value.transcription) } }
}

function importMeta(row: Record<string, unknown>, local: Settings): Record<string, unknown> {
  const clean = exportMeta(row)
  if (clean.key !== 'settings' || !clean.value || typeof clean.value !== 'object') return clean
  const value = clean.value as Record<string, unknown>
  // Keep the endpoint with an existing key: importing an endpoint while retaining a
  // local key could disclose that key to a different server on the next request.
  return { ...clean, value: {
    ...value,
    ai: local.ai.apiKey ? local.ai : { ...withoutApiKey(value.ai), apiKey: '' },
    transcription: local.transcription.apiKey ? local.transcription : { ...withoutApiKey(value.transcription), apiKey: '' },
  } }
}

/** Portable JSON backup without provider credentials. Photos are inlined as data URLs. */
export async function exportAll(): Promise<string> {
  const out: Record<string, unknown[]> = {}
  for (const store of STORES) {
    const rows = await getAll<Record<string, unknown>>(store)
    out[store] =
      store === 'photos'
        ? await Promise.all(
            (rows as unknown as Photo[]).map(async (p) => ({
              ...p,
              blob: await blobToDataUrl(p.blob),
              thumb: await blobToDataUrl(p.thumb),
            })),
          )
        : store === 'meta' ? rows.map(exportMeta) : rows
  }
  return JSON.stringify({ app: 'jobcam', version: 1, exportedAt: Date.now(), data: out })
}

export async function importAll(json: string): Promise<Record<string, number>> {
  const parsed = JSON.parse(json)
  if (parsed?.app !== 'jobcam' || parsed.version !== 1 || !isRecord(parsed.data)) throw new Error('Not a JobCam backup file or unsupported backup version')
  const localSettings = await loadSettings()
  const counts: Record<string, number> = {}
  const prepared: Partial<Record<StoreName, Record<string, unknown>[]>> = {}
  for (const store of STORES as readonly StoreName[]) {
    const rows: unknown = parsed.data[store] === undefined ? [] : parsed.data[store]
    if (!Array.isArray(rows)) throw new Error(`Invalid backup: ${store} must be an array. No records were changed.`)
    prepared[store] = []
    for (const row of rows) {
      const key = store === 'meta' ? 'key' : 'id'
      if (!isRecord(row) || typeof row[key] !== 'string' || !row[key].trim()) throw new Error(`Invalid backup record in ${store}. No records were changed.`)
      if (store !== 'meta' && store !== 'projects' && (typeof row.projectId !== 'string' || !row.projectId.trim())) throw new Error(`Invalid project reference in ${store}. No records were changed.`)
      if (store === 'meta' && row.key === 'settings') {
        const value = row.value
        if (!isRecord(value) || ['ai', 'transcription'].some((field) => value[field] !== undefined && !isRecord(value[field]))) throw new Error('Invalid backup settings. No records were changed.')
      }
      let decoded = row
      if (store === 'photos') {
        if (typeof row.blob !== 'string' || typeof row.thumb !== 'string') throw new Error('Invalid backup media. No records were changed.')
        decoded = { ...row, blob: dataUrlToBlob(row.blob), thumb: dataUrlToBlob(row.thumb) }
      }
      prepared[store].push(store === 'meta' ? importMeta(decoded, localSettings) : decoded)
    }
    counts[store] = rows.length
  }
  await putAllAtomic(prepared)
  return counts
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
