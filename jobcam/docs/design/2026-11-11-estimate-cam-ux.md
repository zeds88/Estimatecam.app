# Estimate Cam UX refresh

User direction: rename the product Estimate Cam; make the UX clean, intuitive and professional; then resume deployment and monetization. The existing instruction to proceed autonomously remains in effect.

## Design

Keep the React/Vite local app and existing data model. The primary flow is create a project, add site photos and scope, build an estimate, then review a report/proposal. This is a working contractor tool, so the workspace leads with projects and a clear next action. Do not invent jobs, revenue, progress, or customer examples as actual records.

Palette: navy #18324f for product identity and primary actions; teal #087f8c for small workflow accents; white #ffffff for work surfaces; pale cool gray #f4f7fa for canvas; slate #526174 for supporting text; border #dbe3ec. Preserve user-selected document branding and its accessible derived color. Use the native system sans-serif stack for readable field use and offline availability; no external font requests. Headings 28–32px with restrained weight, body 15–16px, sentence-case labels. Left aligned content with consistent section spacing. Use borders to separate work areas; avoid decorative gradients, oversized marketing metrics, and repetitive empty cards.

Desktop: quiet fixed navigation, persistent Estimate Cam identity, customer business shown separately as the workspace, full-width page header and a constrained content area. Mobile: compact product header, four clear bottom destinations with safe-area padding, single-column forms and wrapping actions. Navigation: Projects, Capture, Walkthrough, Settings.

Projects: useful first-run guidance, one New project action, clear status filters and search, useful loading state, a separate no-match recovery, genuine project list with status/media count. Project: photos/scope/estimate before secondary checklists/activity; report is a clear output action; optional AI stays available behind a disclosure and retains explicit transmission confirmation. Estimate lines have readable mobile labels and total hierarchy without changing calculations. Settings: business branding and backup visible; advanced templates, price book and model connections use named expandable sections. Autosave behavior stays intact.

Shared controls: visible focus, 44px action targets, readable labels, reduced-motion support, accessible modal focus containment/restore and Escape close. Preserve dark-mode readability.

## Compatibility and verification

Rename public metadata, installed-app name, icons and user-visible copy. Keep database name, backup app marker/version, analytics consent and event identifiers, window events and existing storage contracts. Old backups must still import; existing local projects remain accessible. Do not add cloud, account, sync or paid-entitlement claims.

Run existing unit/build/lint and browser smoke/privacy/offline checks. Adapt selectors only for deliberate label changes and disclosures, preserving behavioral assertions. Inspect mobile and desktop screenshots, keyboard focus, no-match recovery, report output, backup roundtrip and upgrade preservation. Verify final production title, manifest, icon and fresh-browser workflow before resuming checkout work.
