import { ArrowRight, ArrowUpRight, Camera, Check, CheckCheck, ChevronRight, FileText, FolderOpen, HardDrive, MessageSquare, Pencil, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AnalyticsSettings from '../components/AnalyticsSettings'
import './Beta.css'

const feedbackBody = `## What were you trying to do?

## What happened, or what would make this more useful?

## Would you use Estimate Cam on another job? Why or why not?

## Device and browser (optional)

Please leave out customer details, job photos, addresses, passwords, and API keys. This feedback is public.`
const feedbackUrl = `https://github.com/zeds88/Estimatecam.app/issues/new?title=${encodeURIComponent('Estimate Cam beta feedback')}&body=${encodeURIComponent(feedbackBody)}`
const steps = ['Photos', 'Scope', 'Estimate'] as const
const scrollToWorkflow = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
  document.getElementById('how-it-works')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

function DemoPreview() {
  const [step, setStep] = useState<(typeof steps)[number]>('Photos')
  return <div className="beta-demo-wrap">
    <div className="beta-demo">
      <div className="beta-demo-top"><span><FolderOpen size={16} /> Side-yard drainage</span><span className="beta-demo-label">Demo project</span></div>
      <div className="beta-demo-tabs" role="tablist" aria-label="Explore the sample workflow">
        {steps.map((name, i) => <button key={name} id={`demo-tab-${name}`} type="button" role="tab" aria-selected={step === name} aria-controls="demo-panel" tabIndex={step === name ? 0 : -1} onClick={() => setStep(name)} onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (i + (event.key === 'ArrowRight' ? 1 : 2)) % 3
          setStep(steps[next]); document.getElementById(`demo-tab-${steps[next]}`)?.focus()
        }}><span>{i + 1}</span>{name}</button>)}
      </div>
      <div id="demo-panel" className="beta-demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${step}`}>
        {step === 'Photos' && <><div className="beta-job-photo"><img src={`${import.meta.env.BASE_URL}beta/sample-drainage.webp`} alt="Illustrative side-yard drainage assessment with standing water beside a stone path" width="1200" height="800" fetchPriority="high" /><span className="beta-photo-note"><Pencil size={13} /> Mark what matters</span><span className="beta-photo-mark" aria-hidden="true" /></div><div className="beta-photo-caption"><span className="beta-camera-icon"><Camera size={20} /></span><div><strong>Keep the whole picture.</strong><p>Photos, observations and job details, together.</p></div><CheckCheck size={20} /></div></>}
        {step === 'Scope' && <div className="beta-sample-document"><span className="beta-document-icon"><FileText size={25} /></span><p className="beta-document-kicker">Scope of work</p><h3>A clear plan for the work ahead.</h3><p>Review the existing surface drain and the standing water beside the walkway.</p><ul><li><Check size={17} /> Document the existing conditions</li><li><Check size={17} /> Describe the proposed work</li><li><Check size={17} /> State assumptions and exclusions</li></ul><div className="beta-document-foot">Start from a template. Make the wording your own.</div></div>}
        {step === 'Estimate' && <div className="beta-sample-document"><span className="beta-document-icon"><FileText size={25} /></span><p className="beta-document-kicker">Estimate preview</p><h3>Your scope. Your rates.</h3><div className="beta-price-table"><div><span>Description</span><span>Rate</span></div><div><strong>Drainage assessment</strong><span>Your rate</span></div><div><strong>Proposed drainage work</strong><span>Your rate</span></div></div><p>Review quantities, tax and totals before including an estimate in a customer report.</p><div className="beta-document-foot"><ShieldCheck size={16} /> You review it before you share it.</div></div>}
      </div>
      <div className="beta-demo-bottom"><span><span /> Saved on this device</span><span><FileText size={14} /> Customer report <ChevronRight size={14} /></span></div>
    </div><div className="beta-demo-caption">Interactive preview · Sample content and an AI-generated illustration</div>
  </div>
}

export default function Beta() {
  return <div className="beta-site">
    <a href="#beta-main" className="skip-link" onClick={(event) => { event.preventDefault(); document.getElementById('beta-main')?.focus() }}>Skip to content</a>
    <header className="beta-nav beta-container"><Link to="/beta" className="beta-brand" aria-label="Estimate Cam beta home"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="38" height="38" /><span>Estimate Cam</span></Link><nav aria-label="Beta navigation"><a className="beta-nav-detail" href="#how-it-works" onClick={scrollToWorkflow}>How it works</a><Link to="/projects" className="beta-open-app">Open app <ArrowUpRight size={17} /></Link></nav></header>
    <main id="beta-main" tabIndex={-1}>
      <section className="beta-hero beta-container" aria-labelledby="beta-title"><div className="beta-hero-copy"><p className="beta-status"><span /> Free public beta</p><h1 id="beta-title">Walk the site.<br />Leave with a<br className="beta-desktop-break" /> clear estimate.</h1><p className="beta-hero-description">Turn job photos into a scope, an estimate and a customer report you’re ready to put your name on.</p><div className="beta-hero-actions"><Link to="/projects" className="beta-primary">Try the free beta <ArrowRight size={19} /></Link><a href="#how-it-works" className="beta-text-link" onClick={scrollToWorkflow}>See how it works</a></div><p className="beta-no-signup">No account. No subscription. No card required.</p><div className="beta-made-for"><span /><p>Built for the work between<br /><strong>the site visit and the proposal.</strong></p></div></div><DemoPreview /></section>
      <div className="beta-principles"><div className="beta-container"><span><Camera size={19} /> Photos with context</span><span><FileText size={19} /> Reports with your branding</span><span><HardDrive size={19} /> Projects on your device</span></div></div>
      <section id="how-it-works" className="beta-workflow beta-container" aria-labelledby="beta-workflow-title"><div className="beta-section-intro"><p className="beta-small-heading">A simpler handoff</p><h2 id="beta-workflow-title">Keep the job together.<br />Make the next step clear.</h2><p>The photo you took, the work you described, the price you reviewed. One place to turn them into a useful customer document.</p></div><div className="beta-workflow-steps">{[{ icon: Camera, title: 'Capture what you see.', copy: 'Add job photos and notes. Mark up the details you want to explain.' }, { icon: Pencil, title: 'Put the work into words.', copy: 'Start with a scope template, then adjust the wording, assumptions and exclusions.' }, { icon: FileText, title: 'Review. Export. Share.', copy: 'Add your rates, check the estimate and export a report with your business branding.' }].map(({ icon: Icon, title, copy }, i) => <div key={title} className="beta-workflow-step"><span className="beta-step-number">{i + 1}</span><div><Icon size={24} strokeWidth={1.6} /><h3>{title}</h3><p>{copy}</p></div></div>)}</div></section>
      <section className="beta-ownership" aria-labelledby="beta-ownership-title"><div className="beta-container beta-ownership-inner"><div><span className="beta-storage-icon"><HardDrive size={32} strokeWidth={1.4} /></span><h2 id="beta-ownership-title">Your work.<br />Your browser.<br />Your backup.</h2></div><div className="beta-ownership-copy"><p>Estimate Cam saves projects in this browser. You can start without creating an account.</p><p>There’s no cloud backup or device sync. Export a backup regularly—and before changing devices. Clearing browser data or losing a device can remove your work.</p><Link to="/settings">Open backup settings <ArrowUpRight size={18} /></Link><span className="beta-ai-note">AI is optional. You choose your provider; provider charges may apply.</span></div></div></section>
      <section className="beta-invitation beta-container" aria-labelledby="beta-invitation-title"><div><p className="beta-small-heading">Help shape what comes next</p><h2 id="beta-invitation-title">Try one practice job.<br />Tell us where it gets in the way.</h2><p>Start with sample details and a nonsensitive photo. Make an estimate, open a report and export a backup. Then tell us what you would need to use it on your next job.</p><div className="beta-invitation-actions"><Link to="/projects" className="beta-primary">Try the free beta <ArrowRight size={19} /></Link><a href={feedbackUrl} className="beta-text-link" target="_blank" rel="noopener noreferrer"><MessageSquare size={18} /> Share feedback</a></div><p className="beta-feedback-privacy">Feedback is public on GitHub and requires a GitHub account. Leave out customer details, job photos, addresses, passwords and API keys.</p></div><aside className="beta-beta-notes"><h3>Good to know</h3><ul><li><Check size={18} /><span>Free and open source</span></li><li><Check size={18} /><span>No payment details needed</span></li><li><Check size={18} /><span>Review estimates before sharing</span></li><li><Check size={18} /><span>Keep a separate backup</span></li></ul><p>This is a beta. Start with a practice project and check the workflow on your device.</p></aside></section>
      <section className="beta-privacy beta-container" aria-label="Optional beta measurement"><details><summary>Want to help us understand what works? <span>Optional usage analytics</span></summary><div><AnalyticsSettings /></div></details></section>
    </main><footer className="beta-footer beta-container"><Link to="/beta" className="beta-brand"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="28" height="28" /><span>Estimate Cam</span></Link><p>From site visit to estimate.</p><div><a href="https://github.com/zeds88/Estimatecam.app/tree/main/jobcam" target="_blank" rel="noopener noreferrer">Source code</a><a href={feedbackUrl} target="_blank" rel="noopener noreferrer">Beta feedback</a><Link to="/projects">Open app</Link></div></footer>
  </div>
}
