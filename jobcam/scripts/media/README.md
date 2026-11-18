# Branded hero and review video

The hero pairs owner-supplied POV field footage with a recording of a fictional company in the actual Estimate Cam app. It does not depict a physical phone being operated in the original footage. Ironvale Outdoor Co. is an invented demonstration brand, with original artwork in `brand/`; its `.example` contact details are reserved placeholders.

The 40-second recording demonstrates business logo/color/details, photo captions, a custom scope, an owned price book, editable quantities/rates and the actual generated report. The report's 24 lf × $32 = $768 is a sample allowance, not a measurement or recommended rate. No customer identities, keys, real quotes, live API calls or analytics are used. Captures run in disposable browser contexts; the generated report is displayed as-is in the recorded viewport. Never count this as a tester trial.

## Rebuild

Requires the project's Playwright installation, Python 3, Pillow and FFmpeg with H.264/JPEG support. No paid generation or third-party media.

1. Run `python3 scripts/media/brand/create-mark.py` if changing the original logo.
2. Start the current app at `http://127.0.0.1:4180` and supply a retained local field photo.
3. `node scripts/media/record-hero-demo.mjs http://127.0.0.1:4180 /absolute/work-dir /absolute/field-photo.jpg`
4. `python3 scripts/media/render-hero.py retained /absolute/work-dir`
5. Optional standalone 1280×720 branded cut: `python3 scripts/media/render-branded-review.py /absolute/work-dir /absolute/output.mp4`.
6. Inspect openings, chapter transitions, text, rates, report and end/start seam. Run `npm run build` and `node e2e/hero.mjs`.

The app recording plays at natural speed with readable holds. Only silent ambient field footage plays at 0.8×, as requested by the owner. `recording.json` drives `src/lib/heroDemo.ts` and the standalone chapter plates; distinctive scope-editor frame matching aligns the recorder's clock. Keep the generated manifest with its matching video.

## Field footage provenance

Owner-supplied `IMG_5601.mov` was 1080×1920 SDR Rec.709 H.264, approximately 30 fps, 97.81 seconds. The original temporary Photos attachment has expired. Reuse the retained committed field clips and local extracted still; do not claim new source footage. If the owner supplies the original again, `render-hero.py /absolute/IMG_5601.mov /absolute/work-dir` recreates landscape/portrait delivery from seconds 40–52, with a one-second seam blend yielding an 11-second loop. The shorter `IMG_5062.mov` is unused. Originals stay outside the public repository; no audio, GPS or source metadata is published.

## Delivery and accessibility

Silent H.264/yuv420p MP4 with faststart; separate landscape/portrait field clips and one app recording. JPEG field posters and PNG app poster are cached for offline use. Videos stay optional and bypass service-worker caching/range handling. Reduced motion and Save-Data prevent video downloads until manual Play. Shared pause/play, offscreen/hidden pause and offline fallback remain supported. Caption space is reserved to prevent chapter changes shifting the page. Existing projects, settings, free-beta behavior and opt-in analytics remain intact.
