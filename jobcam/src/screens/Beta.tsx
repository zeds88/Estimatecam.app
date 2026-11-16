import { ArrowDown, ArrowRight, ArrowUpRight, Camera, Check, CheckCheck, ChevronDown, ClipboardList, FileText, FolderOpen, HardDrive, Menu, MessageSquare, Pencil, ShieldCheck } from 'lucide-react'
import { useState, type ComponentProps, type MouseEvent } from 'react'
import AnalyticsSettings from '../components/AnalyticsSettings'
import './Beta.css'

// Real anchors work in the prerendered page and preserve the app's relative base.
function Link({ to, ...props }: { to: string } & Omit<ComponentProps<'a'>, 'href'>) {
  return <a href={`${import.meta.env.BASE_URL}#${to}`} {...props} onClick={(event) => {
    props.onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    window.location.hash = to
  }} />
}

const feedbackBody = `## What were you trying to do?

## What happened, or what would make this more useful?

## Would you use Estimate Cam on another job? Why or why not?

## Device and browser (optional)

Please leave out customer details, job photos, addresses, passwords, and API keys. This feedback is public.`
const feedbackUrl = `https://github.com/zeds88/Estimatecam.app/issues/new?title=${encodeURIComponent('Estimate Cam beta feedback')}&body=${encodeURIComponent(feedbackBody)}`
const imageUrl = `${import.meta.env.BASE_URL}beta/sample-drainage.webp`
const steps = [
  { name: 'Photos', icon: Camera, title: 'Start with what you see.', copy: 'Add site photos and notes. Mark the details that need a closer look.' },
  { name: 'Scope', icon: Pencil, title: 'Give the work a clear scope.', copy: 'Start with a template. Describe the work, assumptions and exclusions in your own words.' },
  { name: 'Estimate', icon: ClipboardList, title: 'Put your numbers to work.', copy: 'Add quantities and your rates. Review each line before it goes to the customer.' },
  { name: 'Report', icon: FileText, title: 'Make it easy to understand.', copy: 'Bring the photos, scope and estimate into a customer report with your branding.' },
] as const

function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  // Keep modified clicks and ordinary no-JavaScript anchors usable.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  event.currentTarget.closest('details')?.removeAttribute('open')
  const section = document.getElementById(id)
  section?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  section?.focus({ preventScroll: true })
}

function DemoPreview() {
  const [active, setActive] = useState(0)
  const current = steps[active]
  return <div className="beta-demo-wrap">
    <div className="beta-demo-tabs" role="tablist" aria-label="Explore the sample workflow">
      {steps.map(({ name, icon: Icon }, index) => <button
        key={name} id={`demo-tab-${name}`} type="button" role="tab" aria-selected={active === index}
        aria-controls="demo-panel" tabIndex={active === index ? 0 : -1}
        onClick={() => setActive(index)} onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length
          setActive(next)
          document.getElementById(`demo-tab-${steps[next].name}`)?.focus()
        }}><span className="beta-tab-number">{index + 1}</span><Icon size={19} aria-hidden="true" />{name}<ArrowRight className="beta-tab-arrow" size={16} aria-hidden="true" /></button>)}
    </div>
    <div className="beta-demo" id="demo-panel" role="tabpanel" tabIndex={0} aria-labelledby={`demo-tab-${current.name}`}>
      <div className="beta-demo-explainer"><span className="beta-demo-step">Step {active + 1} of 4</span><h3>{current.title}</h3><p>{current.copy}</p><Link to="/projects" className="beta-text-link">Try it in the free app <ArrowUpRight size={17} /></Link><p className="beta-preview-note">Interactive preview. Fictional project details.</p></div>
      <div className="beta-demo-stage">
        <div className="beta-demo-top"><span><FolderOpen size={17} /> Side-yard drainage</span><span>Practice project</span></div>
        {active === 0 && <div className="beta-photos-preview"><div className="beta-job-photo"><img src={imageUrl} alt="AI-generated illustration of standing water beside a side-yard walkway" width="1200" height="800" loading="lazy" /><span className="beta-photo-note"><Pencil size={14} /> Water beside walkway</span><span className="beta-photo-mark" aria-hidden="true" /><span className="beta-image-disclosure">AI-generated illustration</span></div><div className="beta-photo-caption"><Camera size={21} /><div><strong>Keep the whole picture.</strong><p>Existing conditions, before the work begins.</p></div><CheckCheck size={20} /></div></div>}
        {active === 1 && <div className="beta-sample-document"><span className="beta-document-label"><Pencil size={17} /> Scope of work</span><h4>A clear plan for the work ahead.</h4><p>Review standing water beside the walkway and inspect the existing drainage outlet.</p><ul><li><Check size={17} /> Document the existing conditions</li><li><Check size={17} /> Confirm access and outlet condition</li><li><Check size={17} /> Describe proposed work and exclusions</li></ul><div className="beta-document-foot">Assumption: the cause has not yet been confirmed.</div></div>}
        {active === 2 && <div className="beta-sample-document"><span className="beta-document-label"><ClipboardList size={17} /> Estimate preview</span><h4>Your scope. Your rates.</h4><div className="beta-price-table"><div><span>Description</span><span>Pricing</span></div><div><strong>Drainage assessment</strong><span>Your rate</span></div><div><strong>Proposed drainage work</strong><span>Your rate</span></div></div><p>You supply the quantities and prices. Review tax and totals before sharing.</p><div className="beta-document-foot"><ShieldCheck size={17} /> You review it before you share it.</div></div>}
        {active === 3 && <div className="beta-report-preview"><div className="beta-report-heading"><span className="beta-report-monogram" aria-hidden="true">YB</span><div><strong>Your business</strong><span>Customer report preview</span></div><FileText size={24} /></div><h4>Side-yard drainage</h4><p>Site observations & proposed work</p><div className="beta-report-content"><img src={imageUrl} alt="AI-generated drainage illustration included in a fictional report layout" width="1200" height="800" loading="lazy" /><div><strong>Existing conditions</strong><p>Standing water observed beside the walkway.</p><strong>Next step</strong><p>Inspect the outlet before settling the repair scope.</p></div></div><div className="beta-document-foot">Sample layout with an AI-generated illustration. Review your report before sharing.</div></div>}
        <div className="beta-demo-bottom"><span><HardDrive size={14} /> Saved in this browser</span><span>Photos, scope & estimate</span></div>
      </div>
    </div>
  </div>
}

export default function Beta() {
  return <div className="beta-site">
    <a href="#beta-main" className="skip-link" onClick={(event) => { event.preventDefault(); document.getElementById('beta-main')?.focus() }}>Skip to content</a>
    <header className="beta-nav beta-container">
      <Link to="/beta" className="beta-brand" aria-label="Estimate Cam beta home"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="38" height="38" /><span>Estimate Cam</span></Link>
      <nav className="beta-desktop-nav" aria-label="Main navigation"><a href="#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>How it works</a><a href="#field-guides" onClick={(event) => scrollToSection(event, 'field-guides')}>Field guides</a><a href="#questions" onClick={(event) => scrollToSection(event, 'questions')}>Questions</a></nav>
      <div className="beta-nav-actions"><Link to="/projects" className="beta-open-app">Open app <ArrowUpRight size={16} /></Link><Link to="/projects" className="beta-primary beta-nav-cta">Try the free beta</Link></div>
      <details className="beta-mobile-menu"><summary aria-label="Navigation menu"><Menu size={23} /><span>Menu</span></summary><nav aria-label="Mobile navigation"><a href="#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>How it works</a><a href="#field-guides" onClick={(event) => scrollToSection(event, 'field-guides')}>Field guides</a><a href="#questions" onClick={(event) => scrollToSection(event, 'questions')}>Questions</a><Link to="/projects">Open the free app <ArrowUpRight size={17} /></Link></nav></details>
    </header>
    <main id="beta-main" tabIndex={-1}>
      <section className="beta-hero" aria-labelledby="beta-title">
        <img className="beta-hero-image" src={imageUrl} alt="Illustrative side-yard drainage assessment with standing water beside a stone path" width="1200" height="800" fetchPriority="high" />
        <div className="beta-container beta-hero-inner"><div className="beta-hero-copy"><p className="beta-status"><span /> Free public beta</p><h1 id="beta-title">Good work starts<br />with a clear picture.</h1><p className="beta-hero-description">From job photos to a scope, an estimate and a customer report. Keep the site visit together, and give your customer a clear next step.</p><div className="beta-hero-actions"><Link to="/projects" className="beta-primary">Try the free beta <ArrowRight size={20} /></Link><a href="#how-it-works" className="beta-hero-secondary" onClick={(event) => scrollToSection(event, 'how-it-works')}>Explore the workflow <ArrowDown size={17} /></a></div><p className="beta-no-signup">No signup. No subscription. No card required.</p></div><aside className="beta-field-note" aria-label="Fictional site note"><span><Camera size={17} /> From the site visit</span><strong>See it. Note it.<br />Explain the work.</strong><p>A photo is the start.<br />A clear proposal is the next step.</p><div><span /> Side-yard drainage · Practice project</div></aside></div>
        <p className="beta-hero-credit">AI-generated jobsite illustration</p>
      </section>
      <section className="beta-principles" aria-label="Free contractor photo reports and estimates"><div className="beta-container"><div><Camera size={25} /><span><strong>Start with the site.</strong><span>Photos, notes and markup in one project.</span></span></div><div><FileText size={25} /><span><strong>Send a clearer report.</strong><span>Your scope, your rates, your branding.</span></span></div><div><HardDrive size={25} /><span><strong>Skip the signup.</strong><span>Free beta. Projects saved in your browser.</span></span></div></div></section>
      <section id="how-it-works" className="beta-workflow beta-container" aria-labelledby="beta-workflow-title" tabIndex={-1}><div className="beta-section-intro"><div><p className="beta-small-heading">From the first photo to the proposal</p><h2 id="beta-workflow-title">Less piecing it together.<br />More moving the job along.</h2></div><p>A free contractor estimating app for drainage, irrigation and landscape work. Follow one practice project through the workflow.</p></div><DemoPreview /></section>
      <section className="beta-ownership" aria-labelledby="beta-ownership-title"><div className="beta-container beta-ownership-inner"><div className="beta-ownership-heading"><HardDrive size={34} strokeWidth={1.5} /><h2 id="beta-ownership-title">Your next job.<br />Already in your pocket.</h2><p>Start in your browser, without an account.</p></div><div className="beta-ownership-copy"><h3>Local projects. Separate backups.</h3><p>Estimate Cam saves your work in this browser on this device. There’s no cloud backup or device sync.</p><p>Export a backup regularly, especially before clearing browser data or moving to another device. Losing your device or clearing its data can remove your projects.</p><Link to="/settings" className="beta-backup-link">Open backup settings <ArrowUpRight size={18} /></Link><div className="beta-ai-note"><ShieldCheck size={19} /><p>AI is optional. You choose your provider; provider charges may apply. The core photo, scope, estimate and report workflow works without it.</p></div></div></div></section>
      <section id="field-guides" className="beta-resources beta-container" aria-labelledby="beta-resources-title" tabIndex={-1}><div className="beta-resource-heading"><div><p className="beta-small-heading">Practical field guides</p><h2 id="beta-resources-title">Make the next handoff easier.</h2></div><p>A little structure goes a long way when it’s time to explain the work.</p></div><div className="beta-resource-grid"><a href={`${import.meta.env.BASE_URL}guides/jobsite-photo-reports/`}><span className="beta-resource-icon"><Camera size={29} strokeWidth={1.5} /></span><div><span className="beta-resource-type">Photo documentation</span><h3>Build a photo report<br />that tells the story.</h3><p>Choose useful photos, add context and organize a report your customer can follow.</p><span className="beta-resource-link">Read the photo report guide <ArrowUpRight size={18} /></span></div></a><a href={`${import.meta.env.BASE_URL}guides/contractor-estimate-checklist/`}><span className="beta-resource-icon"><ClipboardList size={29} strokeWidth={1.5} /></span><div><span className="beta-resource-type">Estimating</span><h3>Check the details<br />before you send.</h3><p>Review scope, quantities, rates and exclusions before sharing an estimate.</p><span className="beta-resource-link">Read the estimate checklist <ArrowUpRight size={18} /></span></div></a></div></section>
      <section id="questions" className="beta-faq beta-container" aria-labelledby="beta-faq-title" tabIndex={-1}><div><p className="beta-small-heading">A few things to know</p><h2 id="beta-faq-title">Before your<br />first project.</h2></div><div className="beta-faq-list">{[
        ['Is Estimate Cam free?', 'The public beta is free and open source. No signup, subscription or card is required. Optional AI uses your chosen provider, which may charge separately.'],
        ['What can I include in a contractor report?', 'Organize job photos and notes, describe the scope and exclusions, review your estimate and export a customer report with your business branding. You supply and review the quantities and rates.'],
        ['Where are my projects saved?', 'In this browser on this device. There is no cloud backup or device sync. Export a separate backup before clearing browser data or changing devices.'],
        ['Do I need AI to use the app?', 'No. The photo, scope, estimate and report workflow can be used without an AI provider. If you enable a provider, the selected feature sends its inputs to that provider. Browser dictation may send audio to its speech provider.'],
      ].map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={19} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
      <section className="beta-invitation beta-container" aria-labelledby="beta-invitation-title"><div className="beta-invitation-inner"><span className="beta-invitation-icon"><Camera size={37} strokeWidth={1.5} /></span><h2 id="beta-invitation-title">Take it on a practice run.</h2><p>Add a nonsensitive photo. Write a scope. Review an estimate.<br className="beta-desktop-break" /> Then tell us what you’d need for your next real job.</p><div className="beta-invitation-actions"><Link to="/projects" className="beta-primary">Try the free beta <ArrowRight size={19} /></Link><a href={feedbackUrl} className="beta-text-link" target="_blank" rel="noopener noreferrer"><MessageSquare size={18} /> Share feedback</a></div><p className="beta-feedback-privacy">Feedback is public on GitHub and requires an account. Leave out customer details, job photos, addresses, passwords and API keys.</p></div></section>
      <section className="beta-privacy beta-container" aria-label="Optional beta measurement"><details><summary>Help improve the beta <span>Optional usage analytics <ChevronDown size={15} /></span></summary><div><AnalyticsSettings /></div></details></section>
    </main>
    <footer className="beta-footer beta-container"><div><Link to="/beta" className="beta-brand"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="30" height="30" /><span>Estimate Cam</span></Link><p>From site visit to estimate.</p></div><nav aria-label="Footer navigation"><a href="https://github.com/zeds88/Estimatecam.app/tree/main/jobcam" target="_blank" rel="noopener noreferrer">Source code</a><a href={feedbackUrl} target="_blank" rel="noopener noreferrer">Beta feedback</a><Link to="/projects">Open app <ArrowUpRight size={15} /></Link></nav><p className="beta-footer-note">Free, open-source contractor photo reports & estimates.</p></footer>
  </div>
}
