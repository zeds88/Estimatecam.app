# JobCam launch and operating guide

## Product and audience

JobCam is a free, MIT-licensed, local-first job-site documentation web app for contractors
and field crews. The first product loop is: create a project → add photos → create a useful
customer report. No account or backend is needed. AI is optional and uses the provider the
user configures; external provider charges can apply. It is not a team-sync or customer-portal product.

Start with independent contractors who need job photos and branded reports. Test the real
workflow with a few people before promoting the much larger set of advanced features.

## Source of truth

- Public app: https://zeds88.github.io/Estimatecam.app/.
- Release source: `main`, application root `jobcam/`.
- Default repository branch currently points to a separate WaterWise prototype. Until the owner
  chooses to change that setting, explicitly select `main` for JobCam work and link to its README.
- GitHub Pages publishes the built `jobcam/dist` from `gh-pages`.
- Keep the separate WaterWise prototype intact. Do not deploy the root Vite project as JobCam.

## Release checklist

1. Work on a branch from current `main`. Review the diff and preserve local user data.
2. In `jobcam/`, run `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
3. Run `npx playwright install chromium` and the browser tests. For the analytics regression,
   build with synthetic configuration first:

   ```sh
   VITE_POSTHOG_PROJECT_TOKEN=phc_jobcam_e2e VITE_POSTHOG_HOST=https://us.i.posthog.com VITE_POSTHOG_ENVIRONMENT=development npm run build
   npm run test:e2e
   ```

   Requests to PostHog are intercepted. Do not publish this synthetic test build.
4. Review the mobile flow on an actual iPhone/Safari and Android/Chrome: camera permissions,
   photo/video import, report opening/downloading, add-to-home-screen, offline reload, and
   backup/restore. Desktop Chromium emulation does not establish physical-device support.
5. For analytics, configure `JOBCAM_POSTHOG_PROJECT_TOKEN` and `JOBCAM_POSTHOG_HOST` as repository
   variables. Use the project's public browser token and regional ingestion host. No personal API
   key belongs in a browser build. Missing configuration disables analytics without breaking JobCam.
6. Approve the PR and production release. Merging into `main` triggers test → separate release
   build → GitHub Pages publication. The workflow must never publish the browser-test build.
7. Open the final public URL in a fresh browser and an existing installation. Verify the new build
   in Settings, a synthetic project, one photo, a generated report, and the existing local records.
8. With a consenting test browser, confirm live production events arrive in PostHog and contain
   only allowed properties. Filter `environment=production` for launch metrics. Test opt-out too.

Rollback: revert the release commit on `main` and let CI republish. Keep IndexedDB schema and data
unchanged. Confirm the previous build on the final URL. A hosting-origin change does not move a
user's IndexedDB: require backup/export before any domain migration.

## Analytics contract

Project: PostHog 703316 (currently named Default project). Consent is off by default, stored
per installation in localStorage, and excluded from backups. The SDK loads only after opt-in.
Autocapture, pageview/pageleave capture, session replay, surveys, feature flags, exception capture,
performance capture and person profiles are disabled for this integration. IP enrichment is disabled;
like any external HTTP service, the ingestion endpoint still receives network connection information.

The outgoing event filter discards unrecognized events and properties, including SDK-added full URLs,
referrers, query strings and person updates. Hash routes become coarse screen names; project IDs
are never sent. Events use a random browser identifier and are best effort, not an audit log.

| Event | Trigger | Allowed business property |
| --- | --- | --- |
| jobcam_app_opened | App starts with consent, or user opts in | None |
| jobcam_screen_viewed | Coarse screen changes | screen: projects/project/capture/walk/settings/other |
| jobcam_project_created | A new project is saved | source: form/walk |
| jobcam_media_added | A photo/video is saved | media_type: photo/video |
| jobcam_report_generated | Report HTML is generated and handed to the browser | action: open/download |
| jobcam_walk_saved | Walkthrough data is saved | None |
| jobcam_backup_exported | Backup download is requested | None |

Common properties: app, build, environment, anonymous SDK identifiers, library version and privacy
flags. No project/customer/address/phone/email/GPS/media/caption/narration/price/provider-key data.

Primary funnel: `jobcam_project_created` → `jobcam_media_added` → `jobcam_report_generated`,
ordered within seven days, same browser identifier, `environment=production` on every step.
This measures browser-level activation, not whether all events belong to the same project.
A report event is not evidence of customer delivery, download completion or payment.

Retention: consenting browsers that generate another report in a later week. Opt-outs, blocked
requests, storage clearing and different devices make this a partial view of usage. Do not report
opt-in-only counts as all visitors. Collect qualitative feedback to understand missing users.

## Launch assets — drafts for owner review

Headline: **Job-site photos. Clear customer reports. Your files stay with you.**

Description: JobCam helps contractors organize job photos, mark up issues and export branded
reports from their browser. No account or subscription. Your job records stay on this device;
back them up to keep a copy. AI is optional and uses your chosen provider.

Primary call to action: **Try JobCam**
Secondary: **View the source**

Short launch post:

> I’m opening up JobCam, a free, open-source tool for documenting jobs with photos and clear
> customer reports. Create a project, add photos, mark up an issue and export a branded report.
> No account or subscription. Job records are stored on your device, with backup/export available.
> I’m looking for contractors willing to try it on a small test job and tell me where it gets in the way.
> Try it: https://zeds88.github.io/Estimatecam.app/

Demo outline: create a sample project → upload two sample photos → mark up an issue → add your
branding → export a report → show backup. Label all sample customer/job content as demo data.
Do not use private customer photos or claim measured time savings before testing.

Distribution order: clarify the GitHub README and product identity; record the demo; personally
invite a few relevant testers after approval; fix observed friction; then share a useful walkthrough
in contractor communities that allow it. SEO and paid acquisition come after activation evidence.
No automated mass posting, outreach, ad launch or spending is authorized by this guide.

## Agent operating prompts

### Release agent

Inspect current main, CI and the live JobCam build. Choose the smallest change that fixes a verified
issue. Implement locally, run the relevant unit and browser checks, and prepare a reviewable PR.
Preserve IndexedDB data. Show proof, remaining physical-device gaps, and rollback steps. Obtain
owner approval before merging or publishing. Never deploy the root WaterWise application.

### Growth agent

Read approved product facts and production-only PostHog events. Check sample size and consent
limitations. Identify one observed point of friction in project → media → report, then draft one
improvement or a useful demonstration. Include the evidence, expected benefit and metric. Treat
unmeasured benefits as hypotheses. Prepare drafts for owner review before public posting or spending.

### Operations agent

Read CI failures, fresh-browser checks and GitHub issues. Inspect only the minimum user information
needed. Reproduce bugs with synthetic data. Prepare a fix and regression check. Report a meaningful
failure or decision; stay quiet when unchanged. Never reset production user storage, alter commercial
records, publish releases or enable additional telemetry without approval.

These prompts do not schedule themselves. Set up a separate recurring automation only when the
owner requests its frequency and scope.
