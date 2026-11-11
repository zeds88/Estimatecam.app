# Estimate Cam

Free, open-source, local-first job-site photo documentation for contractors and field crews.
Create a project, capture or upload photos, mark up issues, and export a branded customer report.
No account or subscription is required. Job records live in the browser; export backups to keep a copy.
Optional AI uses your chosen provider, whose charges may apply.

**[Try Estimate Cam](https://estimatecam.com/)** · **[Full documentation](jobcam/README.md)** · **[Launch and operating guide](jobcam/docs/LAUNCH.md)**

## Develop Estimate Cam

```sh
cd jobcam
npm ci
npm run dev
```

Run `npm test` and `npm run build` before shipping. See the app README for browser tests.
Estimate Cam is MIT licensed: [license](jobcam/LICENSE).

## Deployment

Estimate Cam lives in `jobcam/` on the **main** branch. The workflow in
`.github/workflows/jobcam-pages.yml` tests and publishes it to GitHub Pages.
For other static hosts, set the project root to `jobcam` and output directory to `dist`.

The repository's default branch
currently contains a separate WaterWise irrigation prototype. Select **main** for Estimate Cam work.
The root Vite application is that prototype; do not deploy it as Estimate Cam.

## Privacy and scope

Photos, videos, customer details and notes stay in local browser storage unless the user chooses
an export or an external AI operation. Optional usage analytics is off by default and excludes job
content. Team sync, hosted customer portals and native mobile apps are not included.

## WaterWise prototype

The earlier irrigation prototype remains on
[claude/waterwise-visual-model-naQj2](https://github.com/zeds88/Estimatecam.app/tree/claude/waterwise-visual-model-naQj2).
