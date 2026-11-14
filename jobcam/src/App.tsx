import { ArrowUpRight, Camera, FolderOpen, HardDrive, Mic, Settings as Cog } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { applyBrand } from './lib/brand'
import { listProjects, loadSettings } from './lib/db'
import Capture from './screens/Capture'
import ProjectDetail from './screens/ProjectDetail'
import Projects from './screens/Projects'
import SettingsScreen from './screens/SettingsScreen'
import Walk from './screens/Walk'
import AnalyticsScreenTracker from './components/AnalyticsScreenTracker'
import Beta from './screens/Beta'

const NAV = [
  { to: '/projects', label: 'Projects', description: 'Photos, scopes & estimates', icon: FolderOpen, end: true },
  { to: '/capture', label: 'Capture', description: 'Document the job', icon: Camera },
  { to: '/walk', label: 'Walkthrough', description: 'Turn site notes into a plan', icon: Mic },
  { to: '/settings', label: 'Settings', description: 'Your business & preferences', icon: Cog },
]

function ProductMark() {
  return <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="h-10 w-10 shrink-0" />
}

function Workspace() {
  const { pathname } = useLocation()
  const [{ logo, company }, setBrand] = useState({ logo: '', company: '' })
  useEffect(() => {
    let active = true
    const sync = () => loadSettings().then((s) => {
      if (!active) return
      applyBrand(s.branding.color)
      setBrand({ logo: /^data:image\//.test(s.branding.logo) ? s.branding.logo : '', company: s.companyName && s.companyName !== 'My Company' ? s.companyName : '' })
    }).catch(() => {})
    void sync()
    window.addEventListener('jobcam:settings', sync)
    return () => { active = false; window.removeEventListener('jobcam:settings', sync) }
  }, [])
  const current = pathname === '/beta' ? 'Beta & feedback' : pathname.startsWith('/p/') ? 'Project workspace' : NAV.find((item) => item.to === pathname)?.label ?? 'Projects'
  return (
    <div className="app-shell">
      <a href="#workspace-content" className="skip-link" onClick={(event) => { event.preventDefault(); document.getElementById('workspace-content')?.focus() }}>Skip to workspace</a>
      <aside className="app-sidebar">
        <Link to="/projects" className="product-brand" aria-label="Estimate Cam home">
          <ProductMark />
          <span><strong>Estimate Cam</strong><span className="product-tagline">From site visit to estimate</span></span>
        </Link>
        <div className="workspace-identity">
          {logo ? <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" /> : <span className="workspace-initial" aria-hidden="true">{company ? company.charAt(0).toUpperCase() : 'EC'}</span>}
          <div className="min-w-0"><p className="truncate font-semibold">{company || 'Your workspace'}</p><p className="text-xs text-slate-500 dark:text-slate-400">Stored on this device</p></div>
        </div>
        <nav aria-label="Main navigation" className="space-y-1">
          {NAV.map(({ to, label, description, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive || (to === '/projects' && (pathname === '/' || pathname.startsWith('/p/'))) ? 'sidebar-link-active' : ''}`}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" /><span><span className="block font-semibold">{label}</span><span className="nav-description">{description}</span></span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-storage">
          <HardDrive size={20} aria-hidden="true" />
          <p className="font-semibold">Your work stays with you</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Projects are saved in this browser. Export a backup to keep a separate copy.</p>
          <Link to="/settings" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">Manage backups <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="sidebar-footnote"><Link to="/beta" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Free public beta · Feedback</Link><p>Free &amp; open source</p></div>
      </aside>
      <div className="app-workspace">
        <header className="workspace-header">
          <Link to="/projects" className="product-brand md:hidden" aria-label="Estimate Cam home"><ProductMark /><strong>Estimate Cam</strong></Link>
          <p className="hidden text-sm font-medium text-slate-500 md:block">{company || 'Estimate Cam'}<span className="mx-3 text-slate-300" aria-hidden="true">/</span><span className="text-slate-900 dark:text-slate-100">{current}</span></p>
          <span className="device-indicator"><span aria-hidden="true" /> On this device</span>
        </header>
        <main id="workspace-content" tabIndex={-1} className="workspace-content">
          <Routes>
            <Route path="/" element={<Projects />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/p/:id" element={<ProjectDetail />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/walk" element={<Walk />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Projects />} />
          </Routes>
        </main>
      </div>
      <nav aria-label="Mobile navigation" className="mobile-nav safe-b">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-link ${isActive || (to === '/projects' && (pathname === '/' || pathname.startsWith('/p/'))) ? 'mobile-nav-active' : ''}`}>
            <Icon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function Entry() {
  const [hasProjects, setHasProjects] = useState<boolean | null>(null)
  useEffect(() => {
    let active = true
    listProjects().then((projects) => { if (active) setHasProjects(projects.length > 0) }).catch(() => { if (active) setHasProjects(false) })
    return () => { active = false }
  }, [])
  if (hasProjects === null) return <div className="p-8"><p role="status">Opening Estimate Cam…</p><Link className="btn mt-4" to="/projects">Open app</Link></div>
  return hasProjects ? <Workspace /> : <Beta />
}

export default function App() {
  return <HashRouter><AnalyticsScreenTracker /><Routes><Route path="/" element={<Entry />} /><Route path="/beta" element={<Beta />} /><Route path="/*" element={<Workspace />} /></Routes></HashRouter>
}
