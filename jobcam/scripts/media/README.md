# Hero loop assets

The hero pairs a real first-person field walk-through with a recording of a fictional project in the actual Estimate Cam app. It does not depict a physical phone being operated in the original field footage. The page labels it as a sample app demonstration.

Source: owner-supplied `IMG_5601.mov` (1080×1920, SDR Rec.709 H.264, approximately 30 fps, 97.81 seconds). Retain the owner's immutable original outside the public repository. The selected source interval is 40–52 seconds at natural speed. Overlap the final and first second for an 11-second loop. Do not publish original audio, GPS or other source metadata. The shorter `IMG_5062.mov` is unused.

The app recording uses a disposable local browser context, one source-video still, fictional courtyard notes and an illustrative $125 assessment rate. No customer identity, address, provider key or live API is used. This is a workflow illustration, not a quote, testimonial or observed customer trial.

Requirements: the project's Playwright installation, Python 3 and FFmpeg with H.264/JPEG support. No paid generation, avatars or third-party media are used.

1. Extract a reference photo from the owner's clip (for example FFmpeg at source second 44, scaled uniformly to 900px wide), saving `field-photo.jpg` in a work directory.
2. Start the current local app at `http://127.0.0.1:4180`.
3. `node scripts/media/record-hero-demo.mjs http://127.0.0.1:4180 /absolute/work-dir /absolute/work-dir/field-photo.jpg`
4. `python3 scripts/media/render-hero.py /absolute/path/IMG_5601.mov /absolute/work-dir`
5. Inspect the exported clips at the beginning, transitions, pricing entry and seam. Run `npm run build` and `node e2e/hero.mjs`.

Public delivery: separate landscape and portrait field clips plus the app recording, as silent H.264/yuv420p MP4 with faststart; a JPEG field poster and PNG app poster. Posters are included in the offline shell, videos are optional downloads. With reduced motion or Save-Data enabled, neither video downloads or plays until the visitor chooses Play. A visible control pauses both; leaving the hero or hiding the tab pauses playback. Existing app data and opt-in analytics are unaffected.
