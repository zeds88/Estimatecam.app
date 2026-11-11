import { ArrowRight, Camera, FileText, FolderOpen, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProjectForm from '../components/ProjectForm'
import { Empty, Img, Modal } from '../components/ui'
import { getAll, listProjects, newProject, saveProject, get } from '../lib/db'
import { useLoad } from '../lib/hooks'
import type { Photo, Project, ProjectStatus } from '../lib/types'
import { captureAnalytics } from '../lib/analytics'

export default function Projects() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('active')
  const [creating, setCreating] = useState(false)
  const [data] = useLoad(async () => {
    const projects = await listProjects()
    const photos = await getAll<Photo>('photos')
    const counts = new Map<string, number>()
    photos.forEach((p) => counts.set(p.projectId, (counts.get(p.projectId) ?? 0) + 1))
    // full-text-ish search across captions and tags too
    const hay = new Map<string, string>()
    photos.forEach((p) => hay.set(p.projectId, `${hay.get(p.projectId) ?? ''} ${p.caption} ${p.tags.join(' ')}`))
    const covers = new Map<string, Photo>()
    for (const p of projects) if (p.coverPhotoId) { const c = await get<Photo>('photos', p.coverPhotoId); if (c) covers.set(p.id, c) }
    return { projects, counts, hay, covers }
  }, [])

  const needle = q.trim().toLowerCase()
  const shown = (data?.projects ?? []).filter(
    (p) =>
      (status === 'all' || p.status === status) &&
      (!needle || `${p.name} ${p.address} ${p.customer} ${p.notes} ${data?.hay.get(p.id) ?? ''}`.toLowerCase().includes(needle)),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Projects</h1>
          <p className="page-description">Your job photos, scope and pricing, in one place.</p>
        </div>
        <button className="btn btn-primary min-h-11" onClick={() => setCreating(true)}><Plus size={18} /> New project</button>
      </div>
      {!!data?.projects.length && <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
          <input className="input min-h-11 !pl-10" placeholder="Search projects, addresses, photo notes, tags…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter projects by status">
          {(['active', 'completed', 'archived', 'all'] as const).map((s) => (
            <button key={s} className={`chip min-h-11 capitalize ${status === s ? 'chip-on' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
        </div>
        <p className="text-sm text-slate-500" role="status">{shown.length} {shown.length === 1 ? 'project' : 'projects'}{needle || status !== 'all' ? ` · ${data.projects.length} total` : ''}</p>
      </div>}

      {!data && <p className="section-copy" role="status">Loading your projects…</p>}

      {data && data.projects.length === 0 && (
        <section className="card overflow-hidden !p-0">
          <div className="max-w-2xl px-6 py-9 sm:px-9 sm:py-12">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#18324f] dark:bg-slate-800 dark:text-slate-200"><FolderOpen size={24} /></div>
            <h2 className="section-heading !text-xl">No projects yet</h2>
            <p className="section-copy mt-2 max-w-lg">Start with the job you’re working on. Add photos, describe the work and prepare a clear report for your customer.</p>
            <button className="btn btn-primary mt-6 min-h-11" onClick={() => setCreating(true)}><Plus size={18} /> Create your first project</button>
          </div>
          <div className="grid gap-5 border-t border-slate-200 bg-slate-50/70 px-6 py-6 dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-3 sm:px-9">
            {[{ icon: FolderOpen, title: '1. Create a project', copy: 'Give the job a name and location.' }, { icon: Camera, title: '2. Document the work', copy: 'Capture photos and add a scope.' }, { icon: FileText, title: '3. Prepare your report', copy: 'Review pricing and export to share.' }].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex gap-3">
                <Icon size={18} className="mt-0.5 shrink-0 text-[#087f8c] dark:text-teal-400" />
                <div><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{copy}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data && data.projects.length > 0 && shown.length === 0 && (
        <Empty icon={<Search size={30} />} title="No matching projects" hint="Try a different search or show all project statuses.">
          <button className="btn mt-2 min-h-11" onClick={() => { setQ(''); setStatus('all') }}>Clear filters</button>
        </Empty>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => (
          <Link key={p.id} to={`/p/${p.id}`} className="card group flex min-w-0 flex-col gap-5 !p-5 transition-colors hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087f8c]">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                {data?.covers.get(p.id) ? <Img blob={data.covers.get(p.id)!.thumb} className="h-full w-full object-cover" /> : <FolderOpen size={24} />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-[#18324f] dark:text-slate-100">{p.name}</h2>
                <p className="mt-1 truncate text-sm text-slate-500">{p.address || p.customer || 'No location added'}</p>
                {p.address && p.customer && <p className="mt-1 truncate text-xs text-slate-500">{p.customer}</p>}
              </div>
              <ArrowRight size={17} className="mt-1 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium capitalize ${p.status === 'active' ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><span className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-[#087f8c]' : 'bg-slate-400'}`} />{p.status}</span>
              <span className="text-slate-500">{data?.counts.get(p.id) ?? 0} photos &amp; videos · {new Date(p.updatedAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {creating && (
        <Modal title="New project" onClose={() => setCreating(false)}>
          <ProjectForm
            initial={newProject()}
            onCancel={() => setCreating(false)}
            onSave={async (p: Project) => { await saveProject(p); captureAnalytics('jobcam_project_created', { source: 'form' }); nav(`/p/${p.id}`) }}
          />
        </Modal>
      )}
    </div>
  )
}
