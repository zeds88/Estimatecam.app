import { ArrowLeft, Brain, ClipboardList, Columns2, FileText, ImagePlus, Camera, Pencil, Play, Sparkles, Trash2, MessageSquare, ListChecks, Receipt, Images } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Checklists from '../components/Checklists'
import ScopeTab from '../components/ScopeTab'
import { openPending, showHtml } from '../lib/open'
import { renderTemplate } from '../lib/scope'
import Compare from '../components/Compare'
import EstimateTab from '../components/EstimateTab'
import PhotoViewer from '../components/PhotoViewer'
import ProjectForm from '../components/ProjectForm'
import { Empty, Img, Modal } from '../components/ui'
import { blobToDataUrl } from '../lib/blob'
import { addMedia, stillOf } from '../lib/capture'
import { priceFor, reviewProject } from '../lib/ai'
import { runAnalysis } from '../components/AiPanel'
import { fmtDuration } from '../lib/video'
import { deleteProject, get, listChecklists, listComments, listEstimates, listPhotos, listScopes, loadSettings, put, remove, saveProject, savePhoto } from '../lib/db'
import { useLoad } from '../lib/hooks'
import { uid } from '../lib/id'
import { flattenPhoto } from '../lib/image'
import { aiRecap, localRecap } from '../lib/recap'
import { buildReportHtml } from '../lib/report'
import type { Checklist, Photo, Project } from '../lib/types'
import { captureAnalytics } from '../lib/analytics'

type Tab = 'photos' | 'scope' | 'checklists' | 'estimate' | 'activity'

export default function ProjectDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('photos')
  const [filter, setFilter] = useState('')
  const [viewing, setViewing] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [comparing, setComparing] = useState<[Photo, Photo] | null>(null)
  const [busy, setBusy] = useState('')
  const [recap, setRecap] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const [data, reload] = useLoad(async () => {
    const [project, photos, checklists, comments, estimates, settings, scopes] = await Promise.all([
      get<Project>('projects', id), listPhotos(id), listChecklists(id), listComments(id), listEstimates(id), loadSettings(), listScopes(id),
    ])
    return { project, photos, checklists, comments, estimates, settings, scopes }
  }, [id])

  const [edits, setEdits] = useState<Record<string, Photo>>({})
  useEffect(() => setEdits({}), [data])
  const allTags = useMemo(() => [...new Set((data?.photos ?? []).flatMap((p) => p.tags))], [data?.photos])
  if (!data) return <p className="text-slate-500">Loading…</p>
  const { project, checklists, comments, estimates, settings, scopes } = data
  const photos = data.photos.map((p) => edits[p.id] ?? p)
  if (!project) return <Empty icon={<FileText size={32} />} title="Project not found"><Link to="/projects" className="btn mt-2">Back to projects</Link></Empty>

  const shown = filter ? photos.filter((p) => p.tags.includes(filter)) : photos
  const viewIdx = shown.findIndex((p) => p.id === viewing)

  const updatePhoto = (p: Photo) => { setEdits((e) => ({ ...e, [p.id]: p })); void savePhoto(p) }

  const addToPunchList = async (title: string, items: string[]) => {
    const fresh = await listChecklists(id)
    const list: Checklist = fresh.find((c) => c.title === title) ?? { id: uid(), projectId: id, title, items: [], createdAt: Date.now() }
    const have = new Set(list.items.map((i) => i.text.toLowerCase()))
    const add = items.filter((t) => !have.has(t.toLowerCase())).map((text) => ({ id: uid(), text, done: false }))
    await put('checklists', { ...list, items: [...list.items, ...add] })
    reload()
    window.alert(add.length ? `Added ${add.length} item${add.length === 1 ? '' : 's'} to “${title}”.` : 'Those items are already on the list.')
  }

  const addToEstimate = async (items: Omit<import('../lib/types').LineItem, 'id'>[]) => {
    await put('estimates', { id: uid(), projectId: id, title: 'Estimate from narration', proposal: false, items: items.map((i) => ({ ...i, id: uid() })), taxRate: settings.taxRate, createdAt: Date.now() })
    reload()
    window.alert('Draft estimate created – review it in the Estimate tab, then tick “Include in customer proposal”.')
  }

  const analyzeAll = async () => {
    const todo = photos.filter((p) => !p.ai)
    if (!todo.length) { window.alert('Everything has already been analyzed.'); return }
    if (!window.confirm(`Send ${todo.length} item${todo.length === 1 ? '' : 's'} to your AI provider (${settings.ai.model}) for analysis?`)) return
    for (const [n, p] of todo.entries()) {
      setBusy(`AI analyzing ${n + 1} of ${todo.length}…`)
      try { updatePhoto(await runAnalysis(p, project, settings, setBusy)) } catch (e) { window.alert(`Stopped at item ${n + 1}: ${(e as Error).message}`); break }
    }
    setBusy('')
    reload()
  }

  const doReview = async () => {
    if (!window.confirm(`Send this job’s notes and AI findings (text only) to ${settings.ai.model} for review?`)) return
    setBusy('AI is reasoning about the whole job…')
    try {
      const [fp, ch, co] = await Promise.all([listPhotos(id), listChecklists(id), listComments(id)])
      const digest = `${localRecap(project, fp, ch, co)}\n${project.notes ? `Project notes: ${project.notes}\n` : ''}${fp.filter((p) => p.transcript).map((p) => `- Video narration (${fmtDuration(p.duration)}): ${p.transcript!.text.slice(0, 1500)}`).join('\n')}\n${fp.filter((p) => p.ai).map((p) => `- ${p.ai!.summary} Evidence/issues: ${p.ai!.issues.map((i) => `${i.title} [${i.severity}] ${i.evidence}`).join('; ') || 'none'}. Reasoning: ${p.ai!.reasoning}`).join('\n')}`
      const review = await reviewProject(digest, settings.ai)
      await saveProject({ ...project, review })
      reload()
    } catch (e) { window.alert((e as Error).message) } finally { setBusy('') }
  }

  const reviewToEstimate = async () => {
    if (!project.review) return
    const items = project.review.suggestedItems.map((i) => ({ id: uid(), description: i.description, qty: i.qty, unit: i.unit, unitPrice: priceFor(i.description, settings.priceBook) }))
    await put('estimates', { id: uid(), projectId: id, title: 'AI-suggested estimate', proposal: false, items, taxRate: settings.taxRate, createdAt: Date.now() })
    reload()
    setTab('estimate')
  }

  const makeReport = async (action: 'open' | 'download') => {
    const win = action === 'open' ? openPending() : null // before any await, or Safari blocks the popup
    setBusy('Building report…')
    try {
      // re-read from the database: tabs save optimistically, so React state may be a beat behind
      const [fp, checklists, comments, estimates, scopeDocs, fresh] = await Promise.all([listPhotos(id), listChecklists(id), listComments(id), listEstimates(id), listScopes(id), loadSettings()])
      const rp = await Promise.all(
        fp.slice().reverse().map(async (p) => ({
          src: await blobToDataUrl(p.kind === 'video' ? p.thumb : await flattenPhoto(p, 1400)),
          caption: p.caption, tags: p.tags, takenAt: p.takenAt, lat: p.lat, lng: p.lng,
          isVideo: p.kind === 'video', duration: p.kind === 'video' ? fmtDuration(p.duration) : undefined,
          ai: p.ai && { summary: p.ai.summary, issues: p.ai.issues, reasoning: p.ai.reasoning },
          transcript: p.transcript?.chunks.length ? p.transcript.chunks.map((c) => `[${fmtDuration(c.start)}] ${c.text}`).join('\n') : p.transcript?.text,
        })),
      )
      const html = buildReportHtml({
        settings: fresh, project, photos: rp, checklists, comments, estimates, scopes: scopeDocs.map((d) => renderTemplate(d.template, d.values)),
        review: (await get<Project>('projects', id))?.review, recap: recap || localRecap(project, fp, checklists, comments),
      })
      showHtml(win, html, `${project.name.replace(/[^\w]+/g, '-')}-report.html`)
      captureAnalytics('jobcam_report_generated', { action })
    } catch (e) {
      win?.close()
      window.alert(`Couldn’t build the report: ${(e as Error).message}`)
    } finally { setBusy('') }
  }

  const doRecap = async (useAi: boolean) => {
    const digest = localRecap(project, photos, checklists, comments)
    if (!useAi) { setRecap(digest); return }
    setBusy('Asking your AI endpoint…')
    try { setRecap(await aiRecap(digest, settings.ai)) } catch (e) { window.alert((e as Error).message) } finally { setBusy('') }
  }

  const TABS: { key: Tab; label: string; icon: typeof Images; n?: number }[] = [
    { key: 'photos', label: 'Photos', icon: Images, n: photos.length },
    { key: 'scope', label: 'Scope', icon: ClipboardList, n: scopes.length },
    { key: 'estimate', label: 'Estimate', icon: Receipt, n: estimates.length },
    { key: 'checklists', label: 'Checklists', icon: ListChecks, n: checklists.length },
    { key: 'activity', label: 'Activity', icon: MessageSquare, n: comments.length },
  ]

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#18324f] dark:text-slate-400 dark:hover:text-slate-100"><ArrowLeft size={16} /> Projects</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="page-heading break-words">{project.name}</h1>
          <p className="page-description break-words">{[project.address, project.customer, project.phone].filter(Boolean).join(' · ') || 'Add a location or customer in project details.'}</p>
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${project.status === 'active' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><span className={`h-1.5 w-1.5 rounded-full ${project.status === 'active' ? 'bg-[#087f8c]' : 'bg-slate-400'}`} />{project.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn min-h-11 min-w-11" onClick={() => setEditing(true)} aria-label="Edit project"><Pencil size={18} /><span className="hidden sm:inline">Edit project</span></button>
          <button className="btn btn-primary min-h-11" onClick={() => makeReport('open')} disabled={!!busy}><FileText size={18} /> Report</button>
        </div>
      </div>
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-200">Before sharing.</span> Reports include project details, notes, comments, photo locations, transcripts and AI findings when present, plus estimates marked for the customer proposal. Review the report and remove private content before sharing.</p>
      {busy && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300" role="status">{busy}</p>}

      <div className="space-y-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <p className="section-copy">Start with photos, define the scope, then review your estimate.</p>
      <nav className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap" aria-label="Project sections">
        {TABS.map(({ key, label, icon: Icon, n }) => (
          <button key={key} className={`chip min-h-11 min-w-0 !px-2 !py-2 sm:!px-3.5 ${tab === key ? 'chip-on' : ''}`} aria-pressed={tab === key} onClick={() => { setTab(key); reload() }}><Icon size={16} className="mr-1.5 hidden sm:block" /> {label}{n ? ` (${n})` : ''}</button>
        ))}
      </nav>
      </div>

      {tab === 'photos' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="section-heading">Photos &amp; videos</h2>
              <p className="section-copy mt-1">Document the job and keep the important details with each photo.</p>
            </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/capture?project=${id}`} className="btn btn-primary min-h-11"><Camera size={18} /> Capture</Link>
            <label className="btn min-h-11 cursor-pointer"><ImagePlus size={18} /> Upload
              <input ref={file} type="file" accept="image/*,video/*,.heic,.heif,.mov,.mp4,.m4v,.webm" multiple className="sr-only" aria-label="Upload photos or videos" onChange={async (e) => {
                const files = Array.from(e.target.files ?? [])
                e.target.value = ''
                const failed: string[] = []
                for (const [n, f] of files.entries()) {
                  setBusy(`Importing ${n + 1} of ${files.length}: ${f.name}…`)
                  try { await addMedia(id, f, { withGps: false }) } catch (err) { failed.push(`• ${f.name}: ${(err as Error).message}`) }
                }
                setBusy('')
                if (failed.length) window.alert(`${files.length - failed.length} of ${files.length} imported.\n\n${failed.join('\n\n')}`)
                reload()
              }} />
            </label>
            <button className={`btn min-h-11 ${selecting ? 'btn-primary' : ''}`} aria-pressed={selecting} onClick={() => { setSelecting((s) => !s); setPicked([]) }}><Columns2 size={18} /> Select</button>
          </div>
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button className={`chip min-h-11 ${!filter ? 'chip-on' : ''}`} aria-pressed={!filter} onClick={() => setFilter('')}>All</button>
              {allTags.map((t) => <button key={t} className={`chip min-h-11 max-w-full break-words ${filter === t ? 'chip-on' : ''}`} aria-pressed={filter === t} onClick={() => setFilter(filter === t ? '' : t)}>{t}</button>)}
            </div>
          )}
          {selecting && (
            <div className="card flex flex-wrap items-center gap-2 !p-3 text-sm">
              <span>{picked.length} selected</span><span className="flex-1" />
              <button className="btn" disabled={picked.length !== 2} onClick={() => {
                const [a, b] = picked.map((pid) => photos.find((p) => p.id === pid)!).sort((x, y) => x.takenAt - y.takenAt)
                setComparing([a, b])
              }}>Before / after</button>
              <button className="btn btn-danger min-h-11 min-w-11" aria-label="Delete selected photos" disabled={!picked.length} onClick={async () => {
                if (!window.confirm(`Delete ${picked.length} photo(s)?`)) return
                for (const pid of picked) await remove('photos', pid)
                setPicked([]); setSelecting(false); reload()
              }}><Trash2 size={16} /></button>
            </div>
          )}
          {shown.length === 0 ? (
            <Empty icon={<Images size={30} />} title={photos.length ? 'No photos match this tag' : 'No photos or videos yet'} hint={photos.length ? 'Choose another tag or show all photos and videos.' : 'Use Capture for a new photo, or Upload to add photos and videos from this device.'}>
              {photos.length > 0 && <button className="btn min-h-11" onClick={() => setFilter('')}>Clear photo filter</button>}
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((p) => (
                <button key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800" onClick={() => (selecting ? setPicked((x) => (x.includes(p.id) ? x.filter((i) => i !== p.id) : [...x, p.id])) : setViewing(p.id))} aria-label={p.caption || (p.kind === 'video' ? 'Open video' : 'Open photo')}>
                  <Img blob={p.thumb} className="h-full w-full object-cover" />
                  {p.tags[0] && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] font-bold text-white">{p.tags[0]}</span>}
                  {p.annotations.length > 0 && <Pencil size={12} className="absolute right-1 top-1 text-white drop-shadow" />}
                  {p.kind === 'video' && <span className="absolute inset-0 grid place-items-center"><span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white"><Play size={12} fill="white" /> {fmtDuration(p.duration)}</span></span>}
                  {p.ai && <Sparkles size={12} className="absolute bottom-1 right-1 text-purple-300 drop-shadow" aria-label="AI analyzed" />}
                  {p.ai?.issues.some((i) => i.severity === 'high') && <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-label="High severity issue" />}
                  {picked.includes(p.id) && <span className="absolute inset-0 grid place-items-center bg-brand/60 text-2xl font-bold text-white">{picked.indexOf(p.id) + 1}</span>}
                </button>
              ))}
            </div>
          )}
          <details className="rounded-lg border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
            <summary className="flex min-h-12 cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Sparkles size={16} className="text-[#087f8c] dark:text-teal-400" /> Optional AI analysis <span className="ml-auto text-slate-400" aria-hidden="true">+</span></summary>
            <div className="space-y-3 border-t border-slate-100 py-4 dark:border-slate-800">
              <p className="section-copy">Analyze photos and sampled video frames with your configured provider. Review findings before using them in customer documents.</p>
              <button className="btn min-h-11" disabled={!!busy || !settings.ai.model} title={settings.ai.model ? '' : 'Set up AI in Settings'} onClick={analyzeAll}><Sparkles size={18} /> Analyze all{photos.some((p) => !p.ai) ? ` (${photos.filter((p) => !p.ai).length})` : ''}</button>
              {!settings.ai.model && <p className="text-xs text-slate-500">Set up an AI provider in Settings to use this optional feature.</p>}
            </div>
          </details>
        </div>
      )}

      {tab === 'scope' && <ScopeTab project={project} docs={scopes} settings={settings} reload={reload} />}
      {tab === 'checklists' && <Checklists projectId={id} lists={checklists} reload={reload} />}
      {tab === 'estimate' && <EstimateTab projectId={id} estimates={estimates} priceBook={settings.priceBook} taxRate={settings.taxRate} reload={reload} />}

      {tab === 'activity' && (
        <div className="space-y-5">
          <div><h2 className="section-heading">Activity &amp; updates</h2><p className="section-copy mt-1">Keep job notes together and prepare a summary for your report.</p></div>
          <div className="card space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="section-heading flex items-center gap-2"><Brain size={18} className="text-[#087f8c] dark:text-teal-400" /> AI job review</h3><span className="flex-1" />
              <button className="btn" disabled={!!busy || !settings.ai.model} onClick={doReview}><Sparkles size={16} /> {project.review ? 'Re-run review' : 'Review this job'}</button>
            </div>
            {!settings.ai.model && <p className="text-sm text-slate-500">Set up an AI provider in Settings to reason across all photos, videos and notes.</p>}
            {project.review && (
              <div className="space-y-3 text-sm">
                <p>{project.review.summary}</p>
                {project.review.progress && <p><b>Progress:</b> {project.review.progress}</p>}
                {project.review.risks.length > 0 && <div><p className="label">Risks</p><ul className="list-inside list-disc">{project.review.risks.map((r, n) => <li key={n}>{r}</li>)}</ul></div>}
                {project.review.nextSteps.length > 0 && <div><p className="label">Next steps</p><ol className="list-inside list-decimal">{project.review.nextSteps.map((r, n) => <li key={n}>{r}</li>)}</ol></div>}
                {project.review.suggestedItems.length > 0 && <div><p className="label">Suggested billable items</p><ul className="list-inside list-disc">{project.review.suggestedItems.map((r, n) => <li key={n}>{r.qty} {r.unit} – {r.description}</li>)}</ul></div>}
                <details><summary className="flex min-h-11 cursor-pointer items-center font-medium">How the AI reasoned</summary><p className="mt-1 text-slate-600 dark:text-slate-300">{project.review.reasoning}</p></details>
                <div className="flex flex-wrap gap-2">
                  {project.review.nextSteps.length > 0 && <button className="btn" onClick={() => addToPunchList('AI next steps', project.review!.nextSteps)}>Add next steps to checklist</button>}
                  {project.review.suggestedItems.length > 0 && <button className="btn" onClick={reviewToEstimate}>Create estimate from items</button>}
                </div>
                <p className="text-xs text-slate-500">{new Date(project.review.at).toLocaleString()} · {project.review.model} · AI can be wrong – verify before sending to customers.</p>
              </div>
            )}
          </div>
          <div className="card space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="section-heading">Progress recap</h3><span className="flex-1" />
              <button className="btn" onClick={() => doRecap(false)}><Sparkles size={16} /> Summarize</button>
              {settings.ai.endpoint && <button className="btn" onClick={() => doRecap(true)}><Sparkles size={16} /> Polish with AI</button>}
            </div>
            {recap ? <p className="whitespace-pre-wrap text-sm">{recap}</p> : <p className="text-sm text-slate-500">Generate a plain-language summary for your customer. It’s included in the report.</p>}
          </div>
          {comments.map((c) => (
            <div key={c.id} className="card !p-3">
              <p className="text-xs text-slate-500"><b>{c.author}</b> · {new Date(c.createdAt).toLocaleString()}</p>
              <p className="whitespace-pre-wrap text-sm">{c.text}</p>
            </div>
          ))}
          <form className="flex flex-wrap gap-2 sm:flex-nowrap" onSubmit={async (e) => {
            e.preventDefault()
            const form = e.currentTarget
            const text = new FormData(form).get('text')?.toString().trim()
            if (!text) return
            await put('comments', { id: uid(), projectId: id, author: settings.author, text, createdAt: Date.now() })
            form.reset(); reload()
          }}>
            <input name="text" className="input min-w-0 sm:flex-1" placeholder="Add a comment…" aria-label="Comment" />
            <button className="btn btn-primary" type="submit">Post</button>
          </form>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5 dark:border-slate-700">
            <button className="btn" onClick={() => makeReport('download')}>Download report (.html)</button>
            <button className="btn btn-danger" onClick={async () => { if (window.confirm('Delete this project and all its photos?')) { await deleteProject(id); nav('/projects') } }}><Trash2 size={16} /> Delete project</button>
          </div>
        </div>
      )}

      {viewIdx >= 0 && (
        <PhotoViewer
          photo={shown[viewIdx]} index={viewIdx} total={shown.length} isCover={project.coverPhotoId === shown[viewIdx].id}
          onClose={() => setViewing(null)}
          onNav={(d) => setViewing(shown[viewIdx + d]?.id ?? null)}
          onUpdate={updatePhoto}
          onDelete={async (p) => { await remove('photos', p.id); setViewing(null); reload() }}
          onCover={async (p) => { await saveProject({ ...project, coverPhotoId: p.id }); reload() }}
          project={project} settings={settings} onAddIssues={(items) => addToPunchList('AI findings', items)} onAddEstimate={addToEstimate}
        />
      )}
      {comparing && <Modal title="Before / after" onClose={() => setComparing(null)} wide><Compare before={stillOf(comparing[0])} after={stillOf(comparing[1])} /></Modal>}
      {editing && <Modal title="Edit project" onClose={() => setEditing(false)}><ProjectForm initial={project} onCancel={() => setEditing(false)} onSave={async (p) => { await saveProject(p); setEditing(false); reload() }} /></Modal>}
    </div>
  )
}
