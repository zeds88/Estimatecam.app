import { useState } from 'react'
import { Field } from './ui'
import type { Project, ProjectStatus } from '../lib/types'

export default function ProjectForm({ initial, onSave, onCancel }: { initial: Project; onSave: (p: Project) => void | Promise<void>; onCancel: () => void }) {
  const [p, setP] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = <K extends keyof Project>(k: K, v: Project[K]) => setP((x) => ({ ...x, [k]: v }))
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (saving || (!p.name.trim() && !p.address.trim())) return
        setSaving(true); setError('')
        try { await onSave({ ...p, name: p.name.trim() || p.address.trim() }) }
        catch (err) { setError(err instanceof Error ? err.message : 'Could not save this project. Try again.') }
        finally { setSaving(false) }
      }}
    >
      <p className="section-copy">Add a project name or address to get started. You can fill in the rest later.</p>
      <div className="space-y-3">
      <Field label="Project name"><input className="input" autoFocus value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="Johnson – sprinkler repair" /></Field>
      <Field label="Address"><input className="input" value={p.address} onChange={(e) => set('address', e.target.value)} placeholder="4821 Oak Ridge Dr" /></Field>
      </div>
      <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
      <h3 className="section-heading !text-sm">Customer details <span className="font-normal text-slate-400">· optional</span></h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer"><input className="input" value={p.customer} onChange={(e) => set('customer', e.target.value)} /></Field>
        <Field label="Phone"><input className="input" type="tel" value={p.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="Email"><input className="input" type="email" value={p.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
      <Field label="Status">
        <select className="input" value={p.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
          <option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option>
        </select>
      </Field>
      <Field label="Notes"><textarea className="input min-h-20" value={p.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <p className="text-xs leading-relaxed text-slate-500">Project details and notes appear in exported reports. Review private information before sharing.</p>
      </div>
      {error && <p className="text-sm text-red-700 dark:text-red-300" role="alert">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <button type="button" className="btn min-h-11" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary min-h-11" disabled={saving || (!p.name.trim() && !p.address.trim())} aria-busy={saving}>Save</button>
      </div>
    </form>
  )
}
