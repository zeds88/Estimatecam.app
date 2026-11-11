import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useObjectUrl } from '../lib/hooks'

export function Modal({ title, onClose, children, wide }: { title?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter((element) => element.getClientRects().length > 0)
    const frame = requestAnimationFrame(() => {
      if (!dialog.current?.contains(document.activeElement)) (dialog.current?.querySelector<HTMLElement>('[autofocus]') ?? focusable()[0] ?? dialog.current)?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current(); return }
      if (e.key !== 'Tab') return
      const items = focusable()
      const first = items[0], last = items[items.length - 1]
      if (!first) { e.preventDefault(); dialog.current?.focus(); return }
      if (e.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        ref={dialog}
        aria-modal="true"
        tabIndex={-1}
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`safe-b max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl dark:bg-slate-900 sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn btn-ghost !p-2" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>
}

export function Empty({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
      {icon}
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-relaxed">{hint}</p>}
      {children}
    </div>
  )
}

export function Img({ blob, alt = '', className = '' }: { blob?: Blob; alt?: string; className?: string }) {
  const url = useObjectUrl(blob)
  return url ? <img src={url} alt={alt} className={className} draggable={false} /> : <div className={`${className} animate-pulse bg-slate-300 dark:bg-slate-800`} />
}

export const PRESET_TAGS = ['Before', 'After', 'Progress', 'Issue', 'Damage', 'Materials', 'Safety', 'Final']

export function TagPicker({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const toggle = (t: string) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t])
  const all = [...PRESET_TAGS, ...value.filter((t) => !PRESET_TAGS.includes(t))]
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((t) => (
        <button key={t} type="button" className={`chip ${value.includes(t) ? 'chip-on' : ''}`} onClick={() => toggle(t)}>{t}</button>
      ))}
      <button
        type="button"
        className="chip"
        onClick={() => {
          const t = window.prompt('New tag')?.trim()
          if (t && !value.includes(t)) onChange([...value, t])
        }}
      >+ tag</button>
    </div>
  )
}
