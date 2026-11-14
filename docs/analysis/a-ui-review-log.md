# A-ui-review – UI review fixes on route A

**Branch:** `ui-review-fixes`, from `route-a-first-round` (02fe411, the end of Stage 5.1), as Rob chose
**Started:** 14 November 2026, 22:03. **Finished:** 23:28 (about 1 hour 25 minutes of Claude Code time, plus Rob's three answers)
**Scope:** Rob's UI review brief (`ui-review-prompt.md`): UI-A-01 to UI-A-03, DEC-76 (band chart C18), DEC-77 (bottom dock), UI spec §13 screenshots, and the checks in its §7.
**Measurement:** its own step, outside route A's totals. Route A's branches (`route-a`, `route-a-first-round`) are unchanged.

This log is written by Claude Code. Rob asked for it (14 November 2026).

---

## Before starting

| Question | Rob's answer |
|----------|--------------|
| Which commit to start from: `route-a-first-round` (end of 5.1, no grid) or `route-a` (with 5.2 and 5.3)? | `route-a-first-round` |
| The planner guide makes the documents read-only. Edit the decision log, UI spec, reference page and SCSS as the brief asks? | Yes, edit them |
| Where to log the effort? | A new log in `docs/analysis` (this file) |

**Is DEC-73 why the grid was left out (UI-A-03)?** No. This repository's decision log ends at DEC-62, so there's no DEC-73 here. On this branch the grid is missing because REQ-12 is a Should, which the planner guide puts in Stage 5.2, after the 5.1 stop this branch was cut at. On `route-a` it was built in Stage 5.2 (`458a70c`); this branch takes that grid, its print styles and its tests.

---

## What changed

### Documents

| File | Change |
|------|--------|
| `docs/analysis/decision-log.md` | DEC-76 and DEC-77 added word for word from the brief; DEC-32's decision gains "Refined by DEC-76: relative bar heights are allowed in the band chart, with no numbers shown." Status v1.6. DEC-63 to DEC-75 aren't in this copy of the log, so the numbering jumps |
| `docs/ui-spec.md` | v0.3. §3.1 tab bar at every width, a dock from 992 px, action bar above it, both hidden in print. §3.2 SCR-02 and SCR-03 gain C18; SCR-04 gains Battery types. §3.3 breakpoints. §4 C01 (tab bar), C06 (current slot, anchors), C08 (three views, `.gm-list__row--name`), new C18. §11 print hides the dock and C18. §12 reworded as the brief gives it. §13 item 1 as the brief gives it |
| `design/reference.html` | v0.2. C01: no header tabs; the live tab bar at the foot of the page, which is the dock from 992 px. C06: the band chart above the slots, the current slot with `aria-current="time"`, slot anchors. C08: the Battery types view. C18: new section, open and closed, phone and wide (dark follows the device) |
| `design/planner-components.scss` | UI-A-01: `.gm-slot__time` spans two rows; `.gm-slot--now` solid surface, `padding-inline: .75rem`, matching negative `margin-inline`, `border-radius: var(--gm-radius-md)`. UI-A-02: `.gm-list__row--name`. DEC-77: the dock from 992 px, content bottom padding, action bar above the dock at every width; header tab styles removed. C18: the `.gm-bandchart` component. Print hides `.gm-bandchart`. The dark-mode grid overdue colour Rob agreed on `route-a` (166dfb6), so AC-19.1's contrast holds here too |

### Planner

| Item | Where | What |
|------|-------|------|
| UI-A-01 | `ui/day-plan/Timeline.astro` | `aria-current="time"` on the current slot's `<time>`; each slot gets an anchor (`#slot-1200`) |
| UI-A-02 | `ui/fleet/FleetList.astro` | Battery type rows use `.gm-list__row--name` |
| UI-A-03 | `ui/day-plan/PlanGrid.astro`, `pages/demos/charging-planner/index.astro` | The grid from `route-a`'s Stage 5.2: real table, caption, time and band headers, bike row headers with next booking and flags, muted "–" with hidden state text, scrolling in `.gm-grid-wrap` (keyboard focusable), print button, A4 landscape print. Column headers get anchors (`#grid-1200`). The day plan uses the full width (UI spec §3.1) |
| C18 | `plan/band-chart.ts`, `ui/day-plan/BandChart.astro` | The chart model and component as DEC-76 and the brief describe. Process 2 now gives each slot a `level` (0 to 1 between the day's lowest and highest forecast); the raw intensity never leaves process 2's input. D1 reader reads `forecast_intensity` for this only |
| DEC-77 | `ui/Header.astro`, `ui/TabBar.astro`, `ui/PlannerLayout.astro` | No tabs in the header; the tab bar at every width. A page can have no current tab (the name picker) |

### Tests

| File | What |
|------|------|
| `plan/band-chart.test.ts`, `plan/day-plan.test.ts` | Chart model (19 bars, relative heights, stretches, description with no figures, no-forecast bar, now); slot levels relative 0 to 1 |
| `e2e/planner/ui-review.spec.ts` | UI-A-01, UI-A-02, C18 (placement, labels, no figures, links and anchors, 44 px, focus ring, cookie remembered by the server, no-JS open, print, axe light and dark) and DEC-77 (no header tabs, dock centred and content width, action bar above it, last row not covered) |
| `e2e/planner/screenshots.spec.ts`, `playwright.screenshots.config.ts` | UI spec §13.1: 21 screens and views at 390 × 844, 1024 × 768, 1440 × 900 and 1920 × 1080, light and dark, plus the reference page. `npm run test:screenshots`, output in `ui-review-screenshots/` (git-ignored) |
| `e2e/planner/s1-…`, `s7-…`, `s8-…`, `helpers.ts`, Playwright configs | From `route-a`'s 5.2 (grid-aware helpers, grid and print tests); C01 and S7.01 now use the tab bar instead of header tabs |

---

## Screenshot review (UI spec §13 item 1)

Each screen compared by eye with the reference page, at the four sizes, light and dark.

| Screen or view | Result | Notes |
|----------------|--------|-------|
| Day plan, chart open | Pass | Chart above the timeline (phone) or grid (wide); current slot solid with padding, band row no longer stretched |
| Day plan, chart closed | Pass | Summary only |
| Fleet: Bikes, Batteries, Battery types | Pass | Battery type names on one line, capacity to the right |
| Bike record M07, battery record B-09, battery type record | Pass | |
| Add bike, add bike with errors, add battery, add battery type, edit bike | Pass | Action bar above the tab bar or dock |
| Swap G01, quarantine warning, remove B-01 | Pass | |
| Fault report, service check, dealer service, clear fault | Pass | |
| Name picker | Pass after a fix | Fleet showed as the current tab; the name picker now has none |
| Reference page C01, C06, C08, C18 | Pass | |

Things that differ from what the full-page images show, but aren't faults: the fixed tab bar or dock is drawn where the first screen ended, because full-page screenshots capture fixed elements once; and Astro's dev toolbar (the dark pill) appears under `npm run dev` only.

---

## Questions for Rob

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q-1 | DEC-77 says the dock is "the width of the content". On the day plan the content is the full width, but the dock stays at 720 px, as on every other page | (a) Keep 720 px everywhere: one size to learn. (b) Match the day plan's full width | (a) |
| Q-2 | In dark mode the very low bars (#1E6B47) are faint against the dark card. The stretch labels give the same information, and DEC-76 keeps band colours unchanged | (a) Leave it. (b) A light outline on bars in dark mode only | (a), unless the CRP finds it hard to read |
| Q-4 | Bootstrap's default blue (#0d6efd) is in three rules of the built CSS: Bootstrap's `--bs-blue` palette variable, and the fallbacks in AdminLTE's `.focus-enhanced` and `.focus-trap` helpers. No planner page uses them, so no blue shows. It was the same on route A | (a) Leave it. (b) Set `$blue` in `planner-theme.scss` to a brand colour (a theme variable change) | (a) |
| Q-3 | "No numbers in its SVG or HTML": the SVG's geometry (`x`, `y`, `width`, `height`, `viewBox`) is numbers by necessity, and the times in the labels ("07:00–09:30") are the brief's own wording. No intensity, axis value or other figure appears in its text, title, description or attributes | Confirm this reading | Confirm |

---

## Fixes found while checking

| Found by | Problem | Fix |
|----------|---------|-----|
| Screenshot review | The name picker marked Fleet as the current tab | A page can have no current tab; the name picker has none |
| Full browser run | The print ran to two pages: the day plan is now full width, and Chrome scales a wide page down less when printing | In print, the day plan keeps the 720 px width it had before the review: one A4 landscape page again (AC-12.2). In print, no bottom padding is kept for the dock |
| Full browser run | The chart's cookie test read the cookie before the toggle event's script had set it | The test waits for the cookie |
| Full browser run | S1.01 still expected the old gradient on the current slot | Expects the solid background and `aria-current="time"` |

## Checks

| Check | Result |
|-------|--------|
| `npm run build` | Passes; blog pages static |
| Unit tests (`npm run test:unit`) | 118 planner and 48 stand-in tests pass |
| Browser tests at 360 × 740, 390 × 844, 430 × 932, 1024 × 768, 1366 × 1024 | 466 pass, 9 skipped by design (grid tests on phones, timeline tests on tablets) |
| Public demo | 6 pass |
| Screenshots (`npm run test:screenshots`) | 176 pass: 21 screens and views and the reference page, at 390 × 844, 1024 × 768, 1440 × 900 and 1920 × 1080, light and dark (208 images) |
| Accessibility (axe, WCAG 2.1 AA) | No failures: day plan with the chart open, light and dark, at every size; asset records; swap screen; a form with errors |
| Figures in the band chart | None: no `<text>` in its SVG; its text, title and description hold band names and times only; process 2 passes only a 0 to 1 level, never the intensity. The SVG's geometry attributes are numbers by necessity (Q-3) |
| UI spec §12 "Don't" search (§13 item 3) | Planner markup: no `.form-floating`, toast, modal, `.is-valid`, `placeholder=`, named colour classes, "Submit", "OK" or exclamation marks ("toast" appears only in `Notice.astro`'s comment "never toasts"). Built CSS: Bootstrap's default blue in three unused rules (Q-4) |

Not merged; route A's branches unchanged.
