/* eslint-disable react/only-export-components -- Build-time renderer; never imported by the client. */
import { renderToString } from 'react-dom/server'
import type { ReactNode } from 'react'
import Beta from './screens/Beta'

const origin = 'https://estimatecam.com'
const photoPath = '/guides/jobsite-photo-reports/'
const estimatePath = '/guides/contractor-estimate-checklist/'

function Guide({ title, children, related, relatedTitle }: { title: string; children: ReactNode; related: string; relatedTitle: string }) {
  return <div className="beta-site">
    <a className="skip-link" href="#guide-main">Skip to content</a>
    <header className="beta-nav beta-container"><a className="beta-brand" href="../../"><img src="../../icon.svg" alt="" width="38" height="38" /><span>Estimate Cam</span></a><nav aria-label="Guide navigation"><a className="beta-open-app" href="../../#/projects">Open free app ↗</a></nav></header>
    <main id="guide-main" className="beta-guide beta-container" tabIndex={-1}>
      <nav className="beta-breadcrumb" aria-label="Breadcrumb"><a href="../../">Estimate Cam</a><span aria-hidden="true"> / </span><span>Field guide</span></nav>
      <article><p className="beta-small-heading">Practical field guide</p><h1>{title}</h1>{children}</article>
      <aside className="beta-guide-next"><h2>Put the checklist to work.</h2><p>Start with a fictional job in the free beta. Review the customer report and export a separate project backup.</p><a className="beta-primary" href="../../#/projects">Try Estimate Cam →</a><p>Related: <a href={`../${related.split('/').filter(Boolean).at(-1)}/`}>{relatedTitle}</a></p></aside>
    </main>
    <footer className="beta-footer beta-container"><a className="beta-brand" href="../../">Estimate Cam</a><p>From site visit to estimate.</p><div><a href={`../${related.split('/').filter(Boolean).at(-1)}/`}>{relatedTitle}</a><a href="https://github.com/zeds88/Estimatecam.app/tree/main/jobcam">Source code</a></div></footer>
  </div>
}

function PhotoGuide() {
  return <Guide title="How to make a useful jobsite photo report" related={estimatePath} relatedTitle="Contractor estimate checklist">
    <p className="beta-guide-lead">A good jobsite photo report helps someone understand the work without standing beside you. It connects each photo to a location, an observation and a next step.</p>
    <h2>Capture context before detail</h2>
    <p>For each area, take an overview, a closer view of the condition and a detail that explains the concern. Include a familiar reference point so you can identify the location later. Check focus and lighting before leaving; an extra photo now can prevent another visit.</p>
    <p>Use this short capture checklist:</p>
    <ul><li>Which part of the property or building is shown?</li><li>What condition needs attention?</li><li>What nearby feature helps explain it?</li><li>Is a measurement needed, and has it actually been taken?</li><li>What remains hidden, inaccessible or uncertain?</li></ul>
    <p>Avoid including faces, license plates, personal documents or neighboring properties unless they are needed and you have permission to share them.</p>
    <h2>Write captions that separate facts from proposals</h2>
    <p>“Problem area” gives the reader little help. “Water collected beside the rear walkway after rain” records an observation. “Inspect the nearby outlet before proposing repairs” describes a next step. A photo alone does not establish the cause.</p>
    <p>Give each useful image a short reference, such as “Photo 3 — rear walkway.” Keep that reference beside the related scope note.</p>
    <h2>Build the report around the work</h2>
    <p>Put the job name, visit date and purpose first. Then group photos by area or task. For each group, include the observation, proposed work and any question that must be answered before the scope is settled.</p>
    <p>Remove repeated images that add no information. Keep an overview when it explains access or the relationship between work areas. Check the finished report on a phone as well as a larger screen: captions should remain readable and follow the images they describe.</p>
    <h2>A small fictional example</h2>
    <p><strong>Rear walkway review:</strong> Photo 1 shows the whole walkway. Photo 2 shows water beside its edge. Photo 3 shows the visible outlet nearby. The report notes that the cause has not been confirmed and lists an outlet inspection as the next step. It does not present a repair as already agreed.</p>
    <p>That gives the customer something specific to review without turning an observation into an assumed commitment.</p>
    <h2>Save the report and the working project</h2>
    <p><a href="../../">Estimate Cam</a> lets you organize photos, write scope, prepare an estimate and export a customer report in a free browser workflow without an account. Projects stay in that browser and do not sync between devices. Export a project backup before clearing browser data; keep the customer report separately. Optional AI features can send information to third-party providers, so check what you share.</p>
  </Guide>
}

function EstimateGuide() {
  return <Guide title="A contractor estimate checklist before you send" related={photoPath} relatedTitle="Jobsite photo report guide">
    <p className="beta-guide-lead">A useful estimate gives the customer a clear picture of the proposed work and gives you a record of what you priced. Before sending it, check that someone unfamiliar with the site can follow the scope, quantities and assumptions.</p>
    <h2>1. Confirm the job and the reader</h2>
    <p>Check the customer name, job location, estimate date and contact details. Date each revision clearly so an older copy cannot easily be mistaken for the current proposal.</p>
    <p>Confirm the intended recipient. Remove private internal notes and unnecessary photos.</p>
    <h2>2. Describe the work in concrete tasks</h2>
    <p>Replace broad labels such as “landscape improvements” with tasks the customer can recognize. Identify the work area, what you will remove or install and how the area will be left when the work is complete.</p>
    <ul><li>Does each task have a clear location and purpose?</li><li>Are preparation, access, removal and cleanup addressed where relevant?</li><li>Can the customer distinguish included work from possible additional work?</li><li>Are unresolved conditions clearly identified?</li></ul>
    <p>Use photos to support the description. The <a href="../jobsite-photo-reports/">jobsite photo report guide</a> explains how to connect an overview, detail and observation without assuming a cause.</p>
    <h2>3. Check quantities, units and arithmetic</h2>
    <p>For every priced item, confirm the quantity, unit and rate you intended to use. Distinguish a measured quantity from an allowance or an assumption. Do not let a rough field note look like a confirmed measurement.</p>
    <p>Recalculate line totals and the final total. Check for duplicated tasks, missing items and inconsistent units. If you include an adjustment or allowance, label it clearly enough that the customer can understand its effect.</p>
    <h2>4. Make assumptions and exclusions visible</h2>
    <p>Write down the conditions your estimate depends on: available access, the work area observed or a measurement still awaiting confirmation. Explain what is outside the current scope and what would require another discussion.</p>
    <p>Keep these notes beside the relevant work instead of hiding every qualification in a long closing paragraph. Include the payment and scheduling terms you actually intend to offer, and review them before sharing.</p>
    <h2>A small fictional example</h2>
    <p>For a walkway refresh, an estimate might separate lifting existing pavers, preparing the observed area, resetting the pavers and cleanup. It identifies which dimensions were measured and flags concealed conditions as unresolved. Replacement materials are either explicitly included or clearly outside the proposed work.</p>
    <h2>5. Review the exported copy</h2>
    <p>Read the customer-facing report from beginning to end. Check photo captions, scope, quantities, totals and open questions together.</p>
    <p><a href="../../">Estimate Cam</a> provides a free, no-account browser workflow for photos, scope, estimates and report exports. Projects stay in local browser storage without device sync, so export a backup before clearing it. Optional AI can involve third-party providers; review shared information and generated suggestions.</p>
  </Guide>
}

export function renderPages() {
  return [
    { path: '/', title: 'Free Contractor Photo Reports & Estimates | Estimate Cam', description: 'Create contractor photo reports, scopes and estimates with Estimate Cam. Free browser app, no signup. Add your branding and export a customer report.', html: renderToString(<Beta />), schema: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Estimate Cam', url: `${origin}/`, inLanguage: 'en' },
      { '@type': 'SoftwareApplication', '@id': `${origin}/#app`, name: 'Estimate Cam', url: `${origin}/`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser', description: 'Free browser app for contractors to organize job photos, write scope, prepare estimates and export branded customer reports. Projects are stored in the browser, with manual backups and no device sync.', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: `${origin}/` }, sameAs: 'https://github.com/zeds88/Estimatecam.app/tree/main/jobcam' },
    ] } },
    { path: photoPath, title: 'How to Make a Jobsite Photo Report | Estimate Cam', description: 'Organize jobsite photos into a clear customer report with observations, proposed work and open questions. Includes a practical photo checklist.', html: renderToString(<PhotoGuide />) },
    { path: estimatePath, title: 'Contractor Estimate Checklist: Scope & Review | Estimate Cam', description: 'Check scope, quantities, exclusions, assumptions and customer details before sending a contractor estimate. Includes a small fictional example.', html: renderToString(<EstimateGuide />) },
  ]
}
