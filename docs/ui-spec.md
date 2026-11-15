# UI spec – Charging planner

**Project:** Community e-bike library – Charging planner (proof of concept)
**Document:** `docs/ui-spec.md`
**Status:** Draft v0.4 (15 November 2026: collapsible slots on the phone timeline, DEC-78. v0.3, 14 November 2026, UI review on the `ui-review-fixes` branch: DEC-76 band chart C18, DEC-77 bottom dock, UI-A-01 to UI-A-03)
**Owner:** Rob
**Related:** `docs/prd.md` v0.8 (§6 screens and components, NFR-01 to NFR-07), `docs/technical-note.md` v0.8, `docs/analysis/decision-log.md` v1.7 (DEC-50, DEC-51, DEC-76 to DEC-78), `brand/brand-identity.md` v0.4, `brand/tokens.css`, `design/planner-theme.scss`, `design/planner-components.scss`, `design/reference.html`

> **Fictional example.** Greener Miles and its data are invented. This spec is real: it's how the planner's interface is built.

---

## 1. How to use this spec

Three files define the interface. Claude Code works from all three:

| File | What it is | Rule |
|------|------------|------|
| `design/reference.html` | Every PRD §6.1 component, in every state, as working markup | **The visual source of truth.** Copy its markup into Astro components. If a screen needs something that isn't on the reference page, ask Rob before inventing it |
| `design/planner-theme.scss` | Bootstrap 5.3 and AdminLTE 4 variables set from the brand, then imports AdminLTE | Compile this, never AdminLTE's own CSS. Don't change a variable without asking |
| `design/planner-components.scss` | The planner's own components, all prefixed `.gm-` | Add new components here, with the same naming, only after Rob agrees |

**Which classes the markup may use.** The planner's own components are the `.gm-` classes. Around them, the reference page also uses Bootstrap and AdminLTE base classes: layout, grid, spacing and display utilities, cards, forms, buttons, tables and `.visually-hidden`, all themed through `planner-theme.scss`. Use the `.gm-` components and the Bootstrap and AdminLTE classes that appear on the reference page, and nothing else. A Bootstrap or AdminLTE class that isn't on the reference page counts as a new component: ask first. The `.ref-` classes are reference-page scaffolding and never appear in the planner.

This document says **when** and **why** to use each component, and the rules the reference page can't show: behaviour, wording, accessibility and layout.

Where this spec and the PRD disagree, the PRD wins and this spec is corrected.

---

## 2. Principles

1. **The day plan's colour belongs to the bands.** Only band tags have coloured fills. Bike states, flags and warnings use icon plus text, so nobody mistakes a state for a band.
2. **Never colour alone.** Every band, state, flag, location and error carries words (NFR-03).
3. **Facts, not advice.** Show what's happening; never tell staff what to charge or when (DEC-32, OBS-1.3).
4. **One-handed at the counter.** Targets at least 44 × 44 px, main actions within thumb reach, a swap in two taps (NFR-01).
5. **Works without JavaScript.** Pages are server-rendered and forms post normally. JavaScript only adds polish (technical note §6.5).
6. **Plain UK English.** Sentence case, 24-hour times, reading age about 12 (NFR-07).

---

## 3. Layout and navigation

### 3.1 App shell (C01)

- **Header** on every page: the logo mark, "Charging planner", and the name chip on the right. Sticky at the top.
- **Two destinations only:** Day plan and Fleet (DEC-35), in a bottom tab bar at every width (DEC-77).
  - **Below 992 px:** the tab bar is fixed along the bottom, full width, with icon and label. It's within thumb reach.
  - **992 px and wider:** the tab bar becomes a dock: fixed to the bottom, centred, the width of the content, with the same icon and label and no count badges. The tabs never move into the header.
  - The action bar (C15) sits above the tab bar or dock at every width, and page content has bottom padding so neither covers the last row or the action bar. Both are hidden in print.
- **No AdminLTE sidebar.** Two destinations don't need one, and it costs width on a phone. Use AdminLTE's base styles, cards, forms and utilities, as the reference page does (§1); leave out the sidebar, the dashboard widgets (small box, info box), the control sidebar and the colour skins.
- A **skip link** to the main content is the first thing in the page.
- **Content width:** forms and records up to 720 px, centred. The day plan uses the full width.

### 3.2 Screens and their components

| Screen | Layout | Components |
|--------|--------|------------|
| SCR-01 Name picker | Card with one field | C01, C12, C15 |
| SCR-02 Day plan, phone | Page heading with date; charging rules link; band chart (C18); timeline | C02 to C06, C16 to C18 |
| SCR-03 Day plan, grid | Page heading; print button; band chart (C18); grid | C02 to C05, C07, C15, C18 |
| SCR-04 Fleet list | Bikes, Batteries or Battery types switch; list; add button | C08, C15 |
| SCR-05 Bike record | Back link; summary card; actions; history | C05, C09, C10, C15 |
| SCR-06 Battery record | Back link; summary card with location; actions; history | C09, C10, C15 |
| SCR-07 Add or edit asset | Form | C12, C13, C15 |
| SCR-08 Swap and removal | Picker; optional time; save bar | C11, C12, C14, C15 |
| SCR-09 to SCR-11 Entries | Form | C12, C13, C15 |

### 3.3 Breakpoints

| Width | Day plan | Navigation |
|-------|----------|------------|
| Below 992 px (phones, portrait tablets) | Band chart (C18) and timeline (C06) | Bottom tab bar |
| 992 px and wider (landscape tablets, desktop) | Band chart (C18) and grid (C07) | Bottom dock (DEC-77) |
| Print | Grid on A4 landscape, no band chart | None |

Every screen must pass NFR-02's sizes with no sideways page scrolling. The grid scrolls inside its own box on narrow screens.

---

## 4. Components

The reference page shows each one. This table adds the rules.

| ID | Component | Use it for | Rules |
|----|-----------|-----------|-------|
| C01 | App shell, name chip, tab bar | Every page | The chip shows the picked name and links to the name picker. With no name it reads "Add your name" with a dashed border. The tab bar is at the bottom at every width; from 992 px it's a dock (§3.1, DEC-77) |
| C02 | Band tag | Each slot on the day plan; grid column headers | Band name exactly as the API gives it, lower case: "very low", "low", "moderate", "high", "very high". "No forecast" when D1 has nothing (BR-10). A leaf icon on "very low" only. Never a figure, a meaning or a highlight |
| C03 | Bike state label | Each bike on the day plan | Exactly: "Out on loan", "In the workshop", "Overdue – not checked in" with "due HH:MM" or "due Ddd HH:MM", "Out of service". Icons: `bike`, `warehouse`, `clock-alert`, `ban` |
| C04 | Next booking label | Beside each bike on the day plan | "next out: 14:00", "next out: Wed 13:00", "No booking" (BR-03). Times in IBM Plex Mono |
| C05 | Flags and warnings | Beside the state; on the bike record | "Open fault" (`triangle-alert`), "Booked again at 14:00" (`calendar-clock`), "Resource ID doesn't match LibreBooking" (`link-2-off`). They never change the state |
| C06 | Phone timeline | SCR-02 | An ordered list of 19 slots. 07:00 lists every bike; later slots list only bikes whose state changed, or "No changes" (DEC-40). Each slot with bikes listed is a native `<details>` (DEC-78): its summary shows the time, the band tag, the count ("1 bike changes", "4 bikes change", "All 18 bikes" at 07:00) and a chevron, at least 44 px tall; opened, the bike rows. Only the current slot is open on load, or 07:00 when there's no current slot; a slot with no changes reads "No changes" and doesn't open. Following a band chart bar opens its slot. Not remembered between loads. The current slot is marked "now": its time carries the label underneath and `aria-current="time"`, and the slot has a solid surface background with side padding (UI-A-01). Each bike row links to its record. Each slot has an anchor (`#slot-0700`) for the band chart |
| C07 | Plan grid | SCR-03 and print | A real `<table>` with a caption, column headers (time and band) and row headers (bike, next booking, flags). A cell the same as the one before shows a muted "–", with the state in visually hidden text |
| C08 | Fleet list | SCR-04 | Bikes, Batteries and Battery types are three views of one page, switched with the segmented control. Battery rows show the location. Battery type rows show the name and capacity, with `.gm-list__row--name` so long names don't wrap (UI-A-02). Sorted by asset tag, or by name for battery types |
| C09 | Asset summary card | Top of SCR-05 and SCR-06 | Bike: last service (type and date, DEC-38) and the fitted battery with its type, purchase date and cycle count. Battery: location first; if quarantined, a red edge and the fault. Change stamp at the foot (BR-11) |
| C10 | History list | Under the summary card | Newest first by Entry date, then Entry ID. Type with icon (`clipboard-check`, `triangle-alert`, `wrench`), date, description, who and when. Faults show "open" or "closed"; an open fault has "Clear this fault" |
| C11 | Asset picker | SCR-08 | Native radio inputs styled as cards. Batteries on the shelf first, then quarantined, then fitted to another bike. The first battery on the shelf is preselected, so a swap is tap a card (if needed) and tap Save |
| C12 | Form fields | Every form | See section 5 |
| C13 | Error summary | Top of a form after a failed save | See section 5.4 |
| C14 | Confirm warning | Before fitting a quarantined battery | Its own page, after the swap form is posted. Shows the battery, the open fault's date and description, and two actions: "Go back" (primary) and "Fit anyway" (secondary). Never blocks (BR-06) |
| C15 | Buttons and action bar | Every screen | See section 6 |
| C16 | Notices | Top of the page | See section 7 |
| C17 | Empty values, link out | Wherever a value is missing; the charging rules link | Section 8 |
| C18 | Band chart | Top of SCR-02 and SCR-03, above the slots or grid (DEC-76) | Today's 19 slots from 07:00, one equal-width bar each, filled with the band colour from the band tokens. Bar height is the slot's intensity scaled between the day's lowest and highest: no axis, gridlines, values or tooltip, and no number anywhere in its SVG or HTML. A slot with no forecast is a short hatched bar in the "No forecast" style. Under the bars, one text label per stretch of the same band ("moderate 07:00–09:30"), and "now" in text under the current slot. No highlighted window and no advice. A native `<details>` ("Today's bands"), open by default; the server renders it open or closed from the `gm_bandchart` cookie a small script sets on toggle, and without JavaScript it's always open. The drawing is `role="img"` with a `<title>` and a `<desc>` listing each stretch; each bar is a link to its slot, at least 44 px tall, with the focus ring. Hidden in print |

**Icons.** Lucide only, at 1.75 px stroke, always next to text and hidden from screen readers (`aria-hidden="true"`). An icon on its own needs a visible or visually hidden label.

---

## 5. Forms and validation

### 5.1 Field anatomy

In this order, top to bottom:

1. **Label** above the field, bold. Required fields have no marker; optional fields add "(optional)" in muted text.
2. **Hint**, if the field needs one, under the label: an example of the format, or what to put.
3. **Error message**, only after a failed save, in red bold with a visually hidden "Error:" in front.
4. **The input**, sized to the expected answer (`.gm-w-tag`, `.gm-w-short`, `.gm-w-date`, `.gm-w-datetime`); free text is full width.

The hint and error are linked to the input with `aria-describedby`. A field in error has `aria-invalid="true"`, the `.gm-field--error` wrapper (red left edge) and `.is-invalid` on the input.

### 5.2 Input types

| Data | Control | Notes |
|------|---------|-------|
| Asset tag, serial, resource ID | `type="text"`, IBM Plex Mono | `autocapitalize="characters"` and `spellcheck="false"` for tags. Resource ID and cycle count use `inputmode="numeric"`, not `type="number"` (no spinners, no scroll-wheel changes) |
| Description | `<textarea rows="3">` | |
| Battery type, entry type | Native `<select>` | Not a custom dropdown |
| Entry date, cleared date, purchase date | `type="date"` | Defaults to today on the demo clock where the PRD says so. `max` set to today |
| Fitted from | `type="datetime-local"` | Defaults to now on the demo clock; `max` is now (AC-07.3). Hidden behind "Change the time" so the swap stays at two taps |
| Choose a bike or battery | Asset picker (C11) | |
| Faults cleared by a dealer service | Checkboxes, one per open fault | |

Native date and time controls show the device's own format, so a UK phone shows day/month/year. Display values elsewhere as "16 Jun 2026" and "13:30".

### 5.3 When to validate

- **On save only**, on the server. The server's rules (zod schemas from the data dictionary formats) are the only rules. Forms carry `novalidate`, so the browser's own pop-up messages never appear and every message uses our wording.
- No live validation while typing, no green ticks, no "valid" state.
- After a failed save, the form comes back with everything the user typed (NFR-19), the error summary at the top, and the message by each field.
- When the user fixes a field and saves again, errors are worked out afresh.

### 5.4 Error summary (C13)

- Heading "There's a problem", then one link per error, in the order the fields appear. Each link moves focus to its field.
- `role="alert"` and `tabindex="-1"`, and focus moves to it when the page loads, so a screen reader reads it straight away.
- The page title starts "Error: ", for example "Error: Report a fault – Charging planner".

### 5.5 Writing error messages

Say what to do, in the user's words. Use the field's label. No codes, no "invalid", no "please".

| Situation | Message |
|-----------|---------|
| Missing | "Enter a description of the fault" / "Choose a battery type" |
| Wrong format | "Enter the asset tag as a letter and 2 numbers, like M13" |
| Out of range | "Enter a cycle count from 0 to 9,999" |
| Date in the future | "Entry date can't be in the future" |
| Cleared date too early | "Cleared date can't be before the fault was reported (9 Jun 2026)" |
| Already in use | "Resource ID 107 is already used by M07. Check the ID in LibreBooking" |
| Fitted from in the future | "Fitted from can't be later than now" |

Each message is written against the data dictionary's rule for that item (DI-007 to DI-028), and listed in one module so they're consistent.

---

## 6. Buttons and actions (C15)

- **One primary button per screen**, for the main thing the screen is for: "Save swap", "Save fault", "Swap battery".
- **Secondary** actions are outlined. "Cancel" and "Back" are links.
- **Labels are a verb and a thing:** "Save dealer service", "Clear fault", "Add a battery", "Print day plan". Never "Submit", "OK", "Confirm" or "Yes".
- **No delete** anywhere (DEC-09, AC-06.5).
- **On phones**, form buttons sit in the action bar (`.gm-actionbar`), which stays above the tab bar as the page scrolls.
- **While saving**, the primary button is disabled and reads "Saving…" to stop double saves. Without JavaScript, the redirect after a save does the same job.
- **After a save**, redirect to the record (or the day plan) and show a save confirmation (C16). Never stay on the form.

---

## 7. Notices (C16)

Inline at the top of the main content. Never toasts, pop-ups or modals: they vanish before people read them and are hard to use one-handed.

| Notice | When | Wording |
|--------|------|---------|
| Saved (green edge) | After any save, on the page the user lands on | Say what changed: "Swap saved. G01 now has B-17. B-14 is on the shelf." |
| Offline (orange edge) | Showing the last loaded plan (REQ-17) | "You're offline. This is the plan your phone loaded at 07:05. It may be out of date." |
| Problem (red edge) | A source is down (PRD §7.3) or a save failed (NFR-19) | Say what's affected and what still works. "Bookings can't be loaded…", "Nothing was saved…" |
| Demo (amber edge) | Every page of the public demo (DEC-49) | "This is a demo. Greener Miles is a made-up e-bike library. You can try everything, but changes aren't saved." |

Use `role="status"` for saved and offline, `role="alert"` for problems.

---

## 8. Wording

### 8.1 Empty and missing values (C17)

Never a blank, "N/A", "null" or a dash.

| Missing | Shown as |
|---------|----------|
| Next booking | No booking |
| Forecast for a slot | No forecast (band tag variant) |
| Bosch serial, capacity | Not recorded |
| Cycle count | Not yet read |
| Frame size | One size |
| Fitted battery | No battery fitted |

### 8.2 Dates and times

- Times: 24-hour, "13:30", in IBM Plex Mono.
- Dates: "16 Jun 2026" in records and history; "Tue 16 Jun" as the day plan's heading; "Wed 13:00" for the next staffed day.
- Change stamps: "Last updated by Priya Shah, 10 Jun 2026 14:03".

### 8.3 Page titles

"<Page> – Charging planner", for example "Day plan – Charging planner", "M07 – Charging planner", "Report a fault on M07 – Charging planner".

---

## 9. Accessibility

On top of NFR-03 (WCAG 2.1 AA):

- **Focus:** the 3 px Grid Amber ring with a 2 px dark outline on every interactive element (brand §7). Never remove it.
- **Input borders** use Slate, not Mist, so they reach 3:1 against the surface. Mist is for card borders and dividers only.
- **Landmarks:** one `<header>`, `<nav aria-label="Main">`, one `<main>`. Headings in order, one `<h1>` per page.
- **Day plan:** the timeline is an ordered list and each slot's time is a `<time>`; a slot that opens is a native `<details>` whose `<summary>` names the time, band and count, so screen readers announce it as expandable (DEC-78); the grid is a table with a caption and header cells.
- **Asset tags** are read out letter by letter by most screen readers; that's fine.
- **Visually hidden text** inside a scrolling box needs a positioned parent (`.gm-grid-wrap` has `position: relative`), or the page scrolls sideways.
- **Motion:** none needed. Respect `prefers-reduced-motion`.
- **Language:** `<html lang="en-GB">`.

---

## 10. Dark theme

Follows the device's setting with no script and no switch (DEC-34). `planner-theme.scss` sets Bootstrap's `$color-mode-type: media-query`, so Bootstrap, AdminLTE and `tokens.css` all switch on the same `prefers-color-scheme` media query. Components use the `--gm-` tokens, so they switch too. Band colours don't change. The reference page shows the dark theme when the device is in dark mode.

---

## 11. Print

The day plan prints as the grid on one A4 landscape page (REQ-12): header, tab bar or dock, buttons, notices and the band chart (C18) are hidden; every band name and state is in text; band fills print with a black outline so a black and white copy reads correctly (NFR-03).

---

## 12. Don't

The things that make an interface look generated. None of these appear in the planner.

- **No Bootstrap or AdminLTE defaults showing through:** no blue, purple, teal or Bootstrap green; no "Source Sans 3"; no `.text-bg-info`, `.bg-primary-subtle` or named colour classes (`.text-blue`, `.bg-teal`). Theme colours only, through `planner-theme.scss`.
- No gradients, glows, glassmorphism, or a drop shadow on everything. Cards get the one soft shadow from the tokens.
- No rounded-everything: radii are 4 px (inputs, tags), 8 px (buttons, cards) and 16 px (large panels) only.
- No emoji, in the interface or in messages.
- No placeholder text used as a label, or as the only hint.
- No floating labels.
- No toasts, snackbars or modals for messages or validation.
- No live validation while typing, green ticks or "Looks good!" messages.
- No custom dropdowns, date pickers or toggle switches where a native control works.
- No icon-only buttons, except the print and back icons, which also have text.
- No dashboard widgets: stat tiles, progress rings or "insights". No figures shown as numbers, no advice and no highlighted window. The band chart (C18) is the only chart.
- No hover-only information: tooltips can't be the only way to see something on a phone.
- No "Submit", "OK", "Click here", "Oops", "Something went wrong" or exclamation marks.
- No title case, and no all caps except the logo descriptor.
- No grey text below 4.5:1 contrast for anything people need to read.

---

## 13. Checking the build against this spec

Part of NFR-18's automated tests, and of the CRP:

1. Screenshots of every screen and view (including Fleet > Battery types, and the day plan with the current slot and the band chart open and closed) at 390 × 844, 1024 × 768, 1440 × 900 and 1920 × 1080, light and dark, each compared with the reference page and recorded as pass or fail.
2. The automated accessibility check (NFR-03) on the day plan, an asset record, the swap screen and a form showing errors.
3. A search of the built CSS and markup for the "Don't" list: Bootstrap's default blue (`#0d6efd`) used in a rule, `.form-floating`, `toast`, `modal`, `.is-valid`, `placeholder=` without a label.
4. NFR-01's tap count on the swap screen.

---

## Change history

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 12 November 2026 | First draft, with the theme, component styles and reference page v0.1 (DEC-50, DEC-51) |
| 0.2 | 12 November 2026 | §1: which classes the markup may use. The `.gm-` components plus the Bootstrap and AdminLTE classes on the reference page; anything else is a new component. §3.1 points to it. §5.5's example resource ID corrected to 107, to match the sample data. Related versions updated |
| 0.3 | 14 November 2026 | UI review (`ui-review-fixes` branch): the current slot (C06, UI-A-01); the Battery types list (C08, UI-A-02); the grid on wide screens (C07, UI-A-03); the band chart, C18, in §3.2, §3.3, §4, §11 and §12 (DEC-76); the bottom dock at every width in §3.1, §3.3 and C01 (DEC-77); §13 item 1's screenshots |
| 0.4 | 15 November 2026 | C06 and §9: each slot on the phone timeline opens and closes, the current slot open on load (DEC-78) |
