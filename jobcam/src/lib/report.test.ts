import { beforeEach, describe, expect, it } from 'vitest'
import { importAll } from './backup'
import { DEFAULT_SETTINGS, listEstimates, newProject, resetDb } from './db'
import { buildProposalHtml, buildReportHtml } from './report'
import type { Estimate } from './types'

describe('untrusted report data', () => {
  beforeEach(async () => { await resetDb() })
  const project = newProject({ id: 'report-project', name: 'Test project' })
  const estimate: Estimate = { id: 'estimate', projectId: project.id, title: 'Estimate', taxRate: 0, createdAt: 1, items: [{ id: 'item', description: 'Work', qty: 1, unit: 'ea', unitPrice: 10 }] }

  for (const field of ['qty', 'unitPrice', 'taxRate'] as const) {
    it(`rejects an imported script in ${field} before generating a customer document`, async () => {
      const payload = '<script>window.reportInjected=true</script>'
      const untrusted = field === 'taxRate' ? { ...estimate, taxRate: payload } : { ...estimate, items: [{ ...estimate.items[0], [field]: payload }] }
      await importAll(JSON.stringify({ app: 'jobcam', version: 1, data: { projects: [project], estimates: [untrusted] } }))
      const estimates = await listEstimates(project.id)
      const input = { settings: DEFAULT_SETTINGS, project, estimates, photos: [], checklists: [], comments: [] }
      expect(() => buildReportHtml(input)).toThrow('invalid quantities, prices or tax')
      expect(() => buildProposalHtml(input)).toThrow('invalid quantities, prices or tax')
    })
  }

  it('rejects overflowing totals rather than printing Infinity', () => {
    const estimates = [{ ...estimate, items: [{ ...estimate.items[0], qty: Number.MAX_VALUE }] }]
    expect(() => buildProposalHtml({ settings: DEFAULT_SETTINGS, project, estimates })).toThrow('too large')
  })

  it('rejects injected and remote image sources while retaining raster images', () => {
    const sources = ['x" onerror="window.reportInjected=true', 'https://tracking.example/image.png', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,AAAA']
    const html = buildReportHtml({ settings: DEFAULT_SETTINGS, project, estimates: [], checklists: [], comments: [], photos: sources.map((src) => ({ src, caption: '', tags: [], takenAt: 1 })) })
    expect(html).not.toContain('onerror=')
    expect(html).not.toContain('tracking.example')
    expect(html).not.toContain('svg+xml')
    expect(html).toContain('src="data:image/png;base64,AAAA"')
  })
})
