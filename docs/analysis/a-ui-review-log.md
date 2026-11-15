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

---

## Follow-on: collapsible slots on the phone timeline (DEC-78)

**Asked:** 15 November 2026, by Rob: "On the mobile view can each timeslot be expandable/collapsible (current timeslot open)". Same branch, same measurement step (outside route A's totals).

| Question | Rob's answer |
|----------|--------------|
| What does a closed slot show? | Time, band and a change count ("1 bike changes", "N bikes change"). Slots with no changes say "No changes" and don't open |
| Which slots are open on load? | Only the current slot; with no current slot (before 07:00, after 16:30, another day), 07:00. Tapping a band chart bar opens its slot |
| How is it recorded? | DEC-78, refining REQ-04 and DEC-40. UI spec C06 and the reference page first; S1 tests open slots where a step reads them |
| Remember open slots between loads? | No. Native `<details>`, so it works without JavaScript |

### What changed

| File | Change |
|------|--------|
| `docs/analysis/decision-log.md` | DEC-78 added; status v1.7 |
| `docs/ui-spec.md` | v0.4. C06 describes the `<details>` slots; §9 says the summary names the time, band and count |
| `design/reference.html` | v0.3. C06 extract: 07:00 open (now), 07:30 and 12:00 closed, "No changes" slots as plain head rows |
| `design/planner-components.scss` | `.gm-slot__head` is the grid (time spanning two rows, band, count, chevron); `summary.gm-slot__head` hides the marker, keeps a focus ring and is at least 44 px; the chevron turns when open; bike rows indent under the band |
| `src/planner/ui/day-plan/Timeline.astro` | A `<details>` per slot with bikes listed; open only for the current slot, else 07:00; "No changes" slots are a plain head row |
| `src/planner/plan/wording.ts` | `allBikes()` ("All 18 bikes") and `bikesChange()` ("1 bike changes", "4 bikes change") |
| `src/pages/demos/charging-planner/index.astro` | A `#slot-HHMM` link (band chart bars, or a link from elsewhere) opens that slot, on load, on hash change and on click |
| `e2e/planner/dec-78-slots.spec.ts` | New: counts, "No changes" doesn't open, only the current slot open at 12:10, tap to open and close, 44 px and keyboard, bar opens its slot, link opens on load, not remembered, no-JS, axe, 07:00 open before 07:00 and after 16:30, grid unchanged on tablets |
| `e2e/planner/s1-day-at-0700.spec.ts` | On phones, S1.04 to S1.09 tap open the slots they read and check the rows show; S1.10 allows the slot counts as numbers that aren't figures |
| `e2e/planner/s7-asset-record.spec.ts` | S7.01 on phones opens the 07:00 slot, then taps M07 |
| `e2e/planner/ui-review.spec.ts` | UI-A-01 compares the band-to-count gap, since other slots' bike rows are now hidden |

### Checks

| Check | Result |
|-------|--------|
| `npm run build` | Passes; blog pages static |
| Unit tests | 118 planner tests pass |
| Browser tests at the five sizes | 501 pass, 34 skipped by design (the timeline tests on tablets, the grid tests on phones); public demo 6 pass |
| Accessibility (axe, WCAG 2.1 AA) | No failures on the day plan with one slot open and the rest closed |
| Screenshots, day plan and reference page, four sizes, light and dark | 24 pass. Checked by eye at 390 × 844: closed slots show time, band, count and chevron; the current slot (12:00) is open on its surface background with "now"; "No changes" slots have no chevron; the reference C06 extract matches. Tablet and desktop sizes show the grid as before |

### Things for Rob to know

- **AC-05.7 (two taps):** at 09:15 the 07:00 slot is closed, so on a phone M07's record is two taps from the day plan: open 07:00, then M07. Before DEC-78 it was one. Still within AC-05.7.
- **AC-04.3 and AC-04.4 ("without leaving the screen"):** the lunchtime returns and each bike's next booking are one tap away on the same page. I've read that as still meeting both; DEC-78 says so. If the CRP reads "without leaving the screen" as "without a tap", the PRD would need rewording, which is yours to do.
- **S1.10:** the slot counts ("All 18 bikes", "2 bikes change") are the only new numbers on the day plan. They count bikes, not carbon; no figure or advice is added.
- **The reference page's 12:00 extract** lists two bikes (M11, M01), so its count reads "2 bikes change"; the real 12:00 slot on the sample day lists four.

---

## Follow-on: the phone day plan, second round (DEC-79 to DEC-82)

**Asked:** 15 November 2026, by Rob: on the phone day plan, no print button; the chart collapsible with the hours in small text; no band labels under the chart; "Today's bands" renamed "Carbon Forecast"; a panel with the next low or very low time, Bikes in and Bikes out; every slot collapsed by default; and two views, "Rest of day" (default) and "All day". Same branch, same measurement step.

| Question | Rob's answer |
|----------|--------------|
| What do "Bikes in" and "Bikes out" count? | The state now. In: "In the workshop" and "Out of service" (at the depot). Out: "Out on loan" and "Overdue – not checked in" |
| "Next low / very low" singles out a slot, against DEC-32, DEC-76 and AC-01.4. Build it? | Leave it out |
| In "Rest of day", what does the first slot (the current one) list? | Every bike's state then, as 07:00 does (DEC-40) |
| Do the chart changes apply on tablets and desktop too? | Yes: one chart everywhere. The panel, the views and hiding the print button are phone only; the grid stays all day |

### What changed

| File | Change |
|------|--------|
| `docs/analysis/decision-log.md` | v1.8. DEC-79 (every slot closed on load; amends DEC-78), DEC-80 (chart: "Carbon forecast", hours, no band labels; amends DEC-76), DEC-81 (Bikes in and Bikes out; "next low" left out), DEC-82 ("Rest of day" and "All day"; no print button on phones) |
| `docs/ui-spec.md` | v0.5. SCR-02, C06, C18, and a §12 exception for DEC-81's two counts |
| `design/reference.html` | v0.4. C06: the counts, the views, every slot closed. C18 (all four charts): "Carbon forecast", hours, no band labels |
| `design/planner-components.scss` | `.gm-bandchart__hours`; the band labels' styles removed; the no-forecast hatch is set on the bar, since the page now has two charts; `.gm-summary--counts` puts the two facts side by side; `.gm-timeline__end` for "Nothing more today" |
| `src/planner/plan/timeline.ts` | `timeline(plan, start)`, `currentSlot`, `firstRemainingSlot`, `dayPlanView`, `bikeCounts` |
| `src/planner/plan/band-chart.ts` | `bandChart(plan, start)`; each bar's `hour` |
| `src/planner/plan/wording.ts` | "Carbon forecast", "Rest of day", "All day", "Nothing more today", "Bikes in", "Bikes out" |
| `src/planner/ui/day-plan/BandChart.astro` | Hours row, no labels, its own SVG ids; drawn twice (phone timeline from `start`, grid all day), each shown only at its widths |
| `src/planner/ui/day-plan/Timeline.astro` | Every slot closed; starts at `start`; "Nothing more today" |
| `src/pages/demos/charging-planner/index.astro` | Counts panel and views on phones (`?view=all`); print button from 992 px only |
| `src/planner/plan/rest-of-day.test.ts` | New unit tests: views, where "Rest of day" starts, the first slot listing every bike, the chart's slots and hours, the counts (16 in and 2 out at 07:00) |
| `e2e/planner/dec-80-82-phone-day-plan.spec.ts` | New: "Rest of day" by default, "All day", not remembered, 44 px links, before 07:00 and after 16:30, counts, no print button on phones, the chart's title and labels, axe in both views light and dark, the wide layout unchanged |
| `e2e/planner/dec-78-slots.spec.ts` | Every slot closed on load (DEC-79); morning slots read in "All day" |
| `e2e/planner/ui-review.spec.ts` | C18 tests use the chart on screen; "Carbon forecast", hours, no labels |
| `e2e/planner/day-plan-scenarios.spec.ts` | These steps read the whole day, so they use "All day" |
| `e2e/planner/s1-…`, `s7-…`, `s8-…`, `helpers.ts`, `screenshots.spec.ts` | S1.10 allows the hours and the counts; S7.01 opens the current slot (09:00 lists every bike) then M07; S8.03 expects no print button on phones; `url.dayPlanAll`; an "All day" screenshot |

### Things for Rob to know

- **UI spec §12** says "no stat tiles" and "no figures shown as numbers". Bikes in and Bikes out are two counts of bikes, shown in the asset summary card's facts style, not a tile. DEC-81 and §12 now say so. If you'd rather the counts weren't on the day plan at all, it's one component to remove.
- **"Carbon forecast"** is in sentence case, as UI spec §12 asks, not "Carbon Forecast".
- **The counts before opening and after closing** come from the 07:00 and 16:00 slots. The panel's accessible name gives the slot ("Bikes at 12:00").
- **AC-01.1 (19 slots):** at 07:00, as in S1, "Rest of day" is all 19 slots; later in the day the 19 are in "All day". DEC-82 records this.
- **S7.01 (AC-05.7):** at 09:15 the current slot, 09:00, lists every bike, so M07 is still two taps away: open 09:00, then M07.
- **The print button** is gone on phones, but printing from the phone's own browser still gives the grid on one A4 page.

### Checks

| Check | Result |
|-------|--------|
| `npm run build` | Passes; blog pages static (the build's "blog collection is empty" warning was there before: this branch has no posts) |
| Unit tests | 126 planner tests pass (8 new) |
| Browser tests at the five sizes | 527 pass, 53 skipped by design (phone tests on tablets, tablet tests on phones) |
| Public demo | 6 pass, after DEC-61's test reads the morning in "All day" |
| Accessibility (axe, WCAG 2.1 AA) | No failures in "Rest of day" and "All day", light and dark, and with a slot open |
| Screenshots, day plan and reference page, four sizes, light and dark | 32 pass. Checked by eye: at 390 × 844 the counts sit side by side, the views above the chart, the chart shows 12:00 to 16:00 with hours and "now", and every slot is closed; "All day" shows all 19 bars and slots; at 1024 × 768 the grid and print button are unchanged, and the chart reads "Carbon forecast" with hours and no band labels; the reference page's C06 matches |
