import { Plus, Receipt, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { put, remove } from '../lib/db'
import { money, totals } from '../lib/estimate'
import { uid } from '../lib/id'
import type { Estimate, PriceBookEntry } from '../lib/types'

export default function EstimateTab({ projectId, estimates: saved, priceBook, taxRate, reload }: { projectId: string; estimates: Estimate[]; priceBook: PriceBookEntry[]; taxRate: number; reload: () => void }) {
  const [estimates, setEstimates] = useState(saved)
  useEffect(() => setEstimates(saved), [saved])
  const save = (e: Estimate) => { setEstimates((l) => (l.some((x) => x.id === e.id) ? l.map((x) => (x.id === e.id ? e : x)) : [...l, e])); void put('estimates', e) }
  const create = async () => { await put('estimates', { id: uid(), projectId, title: 'Estimate', items: [], taxRate, createdAt: Date.now() }); reload() }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h2 className="section-heading">Pricing</h2>
          <p className="section-copy mt-1">Review quantities, rates and tax. Choose which estimates to include in the customer proposal and report.</p>
        </div>
        <button className="btn btn-primary min-h-11" onClick={create}><Plus size={18} /> New estimate</button>
      </div>
      {estimates.length === 0 && <div className="card flex gap-4 !p-6">
        <Receipt size={24} className="mt-0.5 shrink-0 text-slate-400" />
        <div><h3 className="font-semibold text-slate-800 dark:text-slate-200">No estimate yet</h3><p className="section-copy mt-1">Create an estimate, then add items from your price book or enter a custom line. Check your rates before sharing.</p></div>
      </div>}
      {estimates.map((e) => {
        const t = totals(e)
        return (
          <section key={e.id} className="card min-w-0 space-y-5">
            <div className="flex min-w-0 items-center gap-2">
              <input className="input min-w-0 font-semibold" value={e.title} onChange={(ev) => save({ ...e, title: ev.target.value })} aria-label="Estimate title" />
              <button className="btn btn-ghost min-h-11 min-w-11 shrink-0 !p-2" aria-label="Delete estimate" onClick={async () => { await remove('estimates', e.id); reload() }}><Trash2 size={16} /></button>
            </div>
            <label className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${e.proposal === false ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/40' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" checked={e.proposal !== false} onChange={(ev) => save({ ...e, proposal: ev.target.checked })} aria-label={`Include "${e.title}" in proposal`} />
              <span><span className="font-medium text-slate-800 dark:text-slate-200">Include in customer proposal &amp; report</span>{e.proposal === false && <span className="mt-1 block text-xs text-amber-800 dark:text-amber-300">Draft · excluded from customer documents</span>}</span>
            </label>
            {e.items.length === 0 && <p className="section-copy">Add your first line item below.</p>}
            <div className="space-y-3">
            {e.items.map((i) => (
              <div key={i.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-end gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_44px]">
                <label className="col-span-3 min-w-0 sm:col-span-1"><span className="label">Description</span>
                <input className="input" value={i.description} onChange={(ev) => save({ ...e, items: e.items.map((x) => (x.id === i.id ? { ...x, description: ev.target.value } : x)) })} aria-label="Description" />
                </label>
                <label className="min-w-0"><span className="label">Quantity ({i.unit})</span>
                <input className="input" type="number" min={0} step="any" value={i.qty} onChange={(ev) => save({ ...e, items: e.items.map((x) => (x.id === i.id ? { ...x, qty: +ev.target.value } : x)) })} aria-label="Quantity" />
                </label>
                <label className="min-w-0"><span className="label">Unit price</span>
                <input className="input" type="number" min={0} step="any" value={i.unitPrice} onChange={(ev) => save({ ...e, items: e.items.map((x) => (x.id === i.id ? { ...x, unitPrice: +ev.target.value } : x)) })} aria-label="Unit price" />
                </label>
                <button className="btn btn-ghost min-h-11 min-w-11 !p-2" aria-label="Remove line" onClick={() => save({ ...e, items: e.items.filter((x) => x.id !== i.id) })}><Trash2 size={16} /></button>
                <p className="col-span-3 flex flex-wrap justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-4">Line total <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{money(i.qty * i.unitPrice)}</span></p>
              </div>
            ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input min-h-11 min-w-0 sm:!w-auto sm:max-w-full" value="" aria-label="Add from price book" onChange={(ev) => {
                const entry = priceBook[+ev.target.value]
                if (entry) save({ ...e, items: [...e.items, { id: uid(), description: entry.description, qty: 1, unit: entry.unit, unitPrice: entry.price }] })
              }}>
                <option value="">+ Add from price book…</option>
                {priceBook.map((p, n) => <option key={n} value={n}>{p.description} ({money(p.price)}/{p.unit})</option>)}
              </select>
              <button className="btn min-h-11" onClick={() => save({ ...e, items: [...e.items, { id: uid(), description: 'Custom item', qty: 1, unit: 'ea', unitPrice: 0 }] })}>+ Custom line</button>
            </div>
            <div className="ml-auto w-full max-w-sm space-y-3 border-t border-slate-200 pt-4 text-sm tabular-nums dark:border-slate-700">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
              <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2"><span>Tax %</span><input className="input min-h-11 !w-20" type="number" min={0} step="any" value={e.taxRate} onChange={(ev) => save({ ...e, taxRate: +ev.target.value })} aria-label="Tax rate" /></label><span>{money(t.tax)}</span></div>
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-lg font-semibold text-[#18324f] dark:border-slate-700 dark:text-slate-100"><span>Total</span><span>{money(t.total)}</span></div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
