# Estimate Cam landing refresh

The owner requested a CompanyCam-style improvement to the app's public landing page. Use its broad product-marketing patterns as reference, while writing original React, CSS and copy and retaining Estimate Cam's own assets. Do not copy CompanyCam source, photography, branding, reviews, customer counts, integrations or unsupported product claims.

## Direction

A field-photo hero followed by a hands-on photo → scope → estimate → report preview. Keep the page oriented to solo drainage, irrigation and landscape contractors, with one primary action: try the free beta. Keep the existing landing/workspace behavior, IndexedDB data, opt-in analytics, no-account beta, canonical URLs, verification tags, guides and offline compatibility.

Updated at owner request: use a contractor-oriented industrial palette. Tokens: paper #ffffff; charcoal #18212b; ink #1f2933; safety orange #f28c28; steel surface #edf0f3; secondary text #526170. Dark navigation, neutral hero tint, orange action buttons, steel-gray panels and high-contrast selected tabs replace the green and pastel palette. Avenir Next/system sans for interface and large compact headings, left aligned. Photography provides the hero's depth; no decorative gradients, fake trust logos or carousel. The hero now pairs owner-supplied first-person field footage with a fictional-project recording of the real app. The interactive workflow section retains its separately labeled AI illustration. Distinct from the reference's blue/yellow identity, centered uppercase type and video backdrop.

```
Brand     Workflow / Field guides          Open app / Try beta
[full-width field image]
Large headline + CTA         practice-job scope annotation
[three concise product facts]
Workflow introduction     four keyboard-accessible steps
Photo / scope / estimate / report interactive preview
Local storage explanation + backup action
Useful guides / FAQ / practice-job invitation / footer
```

Use semantic links, native details for menus/FAQs, keyboard-operable tabs, 44px targets, visible focus, reduced motion, and layouts from 320px upward. Preserve meaningful initial HTML and public guide styling. Prefer the current React/CSS stack and assets; no dependencies, paid services or customer footage.

## Build and review

1. Replace Beta markup/styles; keep actual app and guide routes.
2. Update existing smoke checks for the new headline and four-stage demo. Check navigation, mobile menu, tab keyboard behavior, feedback, backups and initial HTML.
3. Run build/lint, relevant SEO and full workflow/offline/privacy checks. Review desktop and mobile screenshots and fix visual issues.
4. Commit and open a concrete reviewable PR with screenshots and validation. Publish only through the owning app's established deployment route if authorized; no unrelated hosting configuration changes.

## Hero video follow-up

Replace the static hero with an 11-second silent first-person field loop from the owner’s `IMG_5601.mov`, plus a phone-shaped actual-app recording showing photos, scope and sample pricing. This is a composed workflow demonstration; the original field clip does not show a physical phone. Label that distinction on the page. Keep customer identities and original audio/location metadata out of the public assets.

Deliver separate landscape and portrait versions, faststart H.264 and still posters. Load optional videos only when motion/data preferences allow; offer shared manual play/pause. Pause while offscreen, when the page is hidden or offline. Cache the still posters, and bypass service-worker caching for video/range requests so partial responses work correctly. Retain all existing application data and free-beta behavior.
