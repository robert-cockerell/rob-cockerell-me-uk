# Product requirements document – Charging planner

**Project:** Community e-bike library – day planner and fleet records (proof of concept)
**Document:** `docs/prd.md`
**Status:** Draft v0.8 (12 November 2026). NFR-08 to NFR-13 agreed and NFR-14 to NFR-20 added (DEC-52); CON-01, CON-05 and NFR-13 updated for the technical note (DEC-47, DEC-49). v0.7: OQ-09, OQ-10, OQ-11, OQ-16 and OQ-17 resolved (DEC-31 to DEC-35); OQ-05 to OQ-08, OQ-13 to OQ-15 and OQ-19 logged as assumed decisions to confirm at the CRP (DEC-36 to DEC-43); OQ-12 and OQ-18 confirmed by Priya (DEC-45, DEC-44). v0.5: BR-01 refined by DEC-30 and AC-04.3's wording corrected. OQ-01 to OQ-04 resolved as DEC-23 to DEC-26; DEC-27 to DEC-29 applied. References to other documents updated 12 November 2026; no change to requirements
**Owner:** Rob (analyst)
**Related:** `docs/analysis/workshop-1/notes.md` v1.1, `docs/analysis/decision-log.md` v1.5, `docs/analysis/dfds.md` v0.9 and `diagrams/dfd/*.mmd`, `docs/analysis/data-dictionary.md` v0.6, `docs/analysis/normalisation.md` v0.3 and `diagrams/lds/logical-data-structure.mmd` v0.2, `docs/analysis/research-charging-window.md`, `docs/technical-note.md` v0.8, `docs/ui-spec.md` v0.2, `brand/brand-identity.md` v0.4 and `brand/tokens.css`, `docs/article/measurement-plan.md` v0.9, `docs/crp-script.md` v1.3 and `test-data/`

> **Fictional example.** Greener Miles, its people, its fleet and its data are invented for an article and demo. Detail first added in this PRD is marked **(invented)**. Detail marked (invented) in the source documents keeps that mark where it matters.

---

## How to read this document

- **What and why, not how.** This PRD says what the tool must do and why. The models say how data moves: processes are numbered as in the DFDs (v0.9), data items as DI-nnn and flows as DF-nn in the data dictionary (v0.6), and decisions as DEC-nn in the decision log. They are referenced, not copied.
- **One role.** Everyone who uses the tool is **Library staff** (DEC-11, DEC-12). User stories name a person to show the situation, not a permission.
- **Acceptance criteria** are written as Given / When / Then and use the sample data in Appendix A. "Now" is the demo clock's time, set for each criterion.
- **Business rules** are stated once in section 4 (BR-nn) and referenced by the requirements.
- **Open questions** (OQ-nn, section 10.3) mark criteria that may change. Criteria tagged **[OQ-nn]** depend on the answer. OQ-01 to OQ-04 are resolved as DEC-23 to DEC-26 (section 10.4) and their tags are removed.
- **No tech stack.** Technology choices are in the technical note (`docs/technical-note.md`). This PRD only states constraints (section 2.3) and the non-functional requirements the build must meet (section 5).
- **The yardstick.** All three routes in the measurement plan are scored against the Must criteria here (REQ-01 to REQ-11) and scenarios S1 to S14. Each criterion scores Pass, Partial or Fail. The CRP script turns them into steps.

---

## 1. Overview

### 1.1 Problem

Greener Miles is a community e-bike library in Cowley, Oxford, with 18 bikes (12 Raleigh Motus, 6 Tern GSD), 26 batteries and a 16-slot charging rack (ASM-01). It's staffed 07:00–16:30 on weekdays, and batteries are only charged while someone is there (ASM-04).

The workshop ranked these pain points (workshop notes §4):

| ID | Pain point | Dots |
|----|------------|------|
| PP-01 | Staff can't see the day at a glance. LibreBooking shows bookings bike by bike and the carbon forecast is in a separate app, so on a busy day every battery goes straight on charge | 6 |
| PP-03a | Nobody knows where each battery is. Swaps are never recorded | 5 |
| PP-03b | Four spreadsheets name the same bike differently and can't be used on a phone | 5 |
| PP-04 | Faults are never closed, and are split between a notebook and a log | 4 |
| PP-05 | Late check-ins make returned bikes look as if they're still out | 3 |
| PP-06 | Newer volunteers aren't sure what's safe to charge, and don't know the handbook page exists | 2 |
| PP-02 | The greenest hours coincide with the busiest loans. Accepted as a fact of life | 0 |

In spring and summer the greenest part of the day falls around 13:00, inside staffed hours, so moving charging from the morning to midday saves carbon (research note).

### 1.2 Objective

> Give staff one screen on their phone that shows today's bikes, their next bookings and the low-carbon half hours, so they can choose greener charging times without extra effort. Give them one place to keep bike and battery records, including where every battery is.

(Workshop notes §12, revised at workshop 1.)

The tool shows; staff decide. It never tells anyone which battery to charge or when (OBS-1.3).

### 1.3 Users

One role, **Library staff**: the coordinator, volunteers and the volunteer mechanic. Everyone can see and change everything. There's no login; each person picks their name once on their device (DEC-11, DEC-12, DEC-19).

| Person (invented) | Who they are | What they need most |
|-------------------|--------------|---------------------|
| Priya Shah | Part-time coordinator. Owns the fleet records, sets bikes Unavailable in LibreBooking, keys dealer job sheets | One place for bikes and batteries; to know who changed what |
| Dave Morgan | Experienced volunteer. Runs handovers and charging | The day's bookings and the greenest half hours on one screen, without the tool deciding |
| Aisha Bello | Newer volunteer, Wednesday afternoons | To know what to do with a returned battery, on her phone |
| Sam Patel | Volunteer mechanic. Runs the Thursday fleet check | A bike's history while standing next to it |

Lewis Chen (invented), the volunteer who runs LibreBooking, is a stakeholder: he supplies the API access (action A-05). When he's on shift he uses the tool as Library staff.

### 1.4 In scope

1. **Day plan.** For each half hour of the staffed day, each bike's state, its next booking (even if that's on the next staffed day), any open fault, and the forecast carbon intensity band (REQ-01 to REQ-04, REQ-12, REQ-13, REQ-15 to REQ-17, REQ-19).
2. **Fleet records.** Bikes, batteries and battery types; which battery is where; battery swaps and removals; faults, service checks and dealer services; who changed what and when (REQ-05 to REQ-11, REQ-14, REQ-18, REQ-20). These replace the four spreadsheets.

### 1.5 Out of scope

- Members, bookings, payments, check-out, check-in and bike availability. These stay in LibreBooking, which the tool only reads (DEC-01, DEC-18).
- Telling staff what or when to charge; charge plans and recommendations (OBS-1.3).
- Charge times (DEC-08), battery charge levels (OBS-1.2), and recording charge sessions.
- Reporting carbon saved, member-facing slot suggestions and electricity prices.
- Battery compatibility and duplicate-fitting checks (DEC-06).
- Retiring or deleting assets (DEC-09, ASM-10).
- Logins and role-based permissions (DEC-11).
- Attaching documents or photos.
- Anything to do with the dealer's own systems. The dealer is outside the boundary.

### 1.6 Parking lot

To review a few months after go-live (workshop notes §11). None of these is a requirement in this PRD.

| Item | Raised by | Note |
|------|-----------|------|
| Advice on which battery to charge, and when | Aisha, Rob | Review after go-live |
| Highlighting the least bad time on days without a green band | Aisha (S9) | |
| Battery charge levels | Dave | No data source |
| Smart plugs on the rack | Sam, Priya | Cost |
| Attaching job sheet photos or PDFs | Sam | Storage and backups |
| Claude reading dealer PDFs into the form | Rob | Typing twice a month is fine |
| Dealer service type, odometer, battery health percentage, prices, cycle count history | Priya, Sam | Data dictionary OI-15 |
| Second battery on GSDs | Sam | About once a month |
| Scanning battery or bike labels | – | S4 |
| Standard and advanced view modes | Rob | Rejected for now (DEC-15) |
| Charge times, recording charge sessions, carbon saved reporting, member-facing slot suggestions, electricity prices, compatibility and duplicate-fitting checks, asset retirement, role-based permissions | Earlier | Carried over from the workshop plan |

---

## 2. Context

The context diagram is `diagrams/dfd/level-0-context.mmd` (DFDs §4). The tool exchanges ten flows with three external entities: Library staff, LibreBooking and the Carbon Intensity API.

### 2.1 External systems and parties

| Party | Role | What the tool does with it | Source |
|-------|------|----------------------------|--------|
| **LibreBooking** | Master for members, bookings, check-out, check-in and bike availability | **Reads only.** Reservations up to the next staffed day, check-in times and each bike's resource status (DF-01). Never writes (NFR-04). Replaced by a stand-in for the demo (section 7.1) | DEC-01, DEC-17, DEC-18, ASM-02 |
| **Carbon Intensity API** (National Grid ESO) | Regional half-hourly forecast of carbon intensity, with an index band | Fetches the forecast for the depot's region every 30 minutes and stores it (process 1, D1, DF-02) | ASM-03, research note |
| **Dealer** | Services bikes and reads Bosch battery diagnostics | **Outside the boundary.** Emails a job sheet (PDF) about twice a month; Priya keys it in as a dealer service, in about 10 minutes | OBS-2.3, OBS-5.4 |
| **Volunteer handbook** | Google Doc with the charging rules | A fixed link only (REQ-16). The page is shared as "anyone with the link". Proof of concept URL in AC-16.1 **(invented)** | OBS-5.6, A-01 |

### 2.2 How the tool fits a shift

At handover, staff find the booking in LibreBooking, check the bike, swap the battery if it shows fewer than four lights, and check the bike out in LibreBooking (OBS-3.1). The tool adds two things to that shift: a day plan to decide when to charge returned batteries, and a two-tap record of any battery swap (REQ-07, NFR-01). It doesn't add a check-out (DEC-18).

When a bike has a fault that should stop it being lent, whoever is on shift with a LibreBooking login sets it Unavailable in LibreBooking (DEC-02, S5, action A-09). The tool then shows it as out of service.

### 2.3 Constraints

| ID | Constraint | Source |
|----|------------|--------|
| CON-01 | Built and run locally while it's developed. The CRP runs on a protected Vercel preview deployment and the public demo on the personal site, where nothing is saved (technical note §7) | Rob's brief, DEC-47, DEC-49 |
| CON-02 | Works on a phone held upright, a tablet in landscape, and in print | DEC-15, NFR-02 |
| CON-03 | LibreBooking is replaced by a stand-in for the demo, with the contract in section 7.1. The stand-in also provides a demo clock, and recorded forecasts are loaded for the scenario dates (section 7.2) | ASM-02, measurement plan, DEC-26 |
| CON-04 | Reads LibreBooking only; never writes to it | DEC-01, DEC-18, NFR-04 |
| CON-05 | No tech stack is chosen here. Technology choices are in the technical note | Rob's brief, DEC-47 to DEC-51 |
| CON-06 | Uses the Greener Miles design tokens (`brand/tokens.css`) and brand identity | Brand identity §9 |
| CON-07 | Staffed hours are fixed at 07:00–16:30 on weekdays; there's no settings screen | ASM-04, data dictionary MM-05 |

---

## 3. Functional requirements

Each requirement has: ID, title and MoSCoW; a user story; acceptance criteria; and a trace line (DFD process, decisions, data items and flows, scenarios, business rules). Must is kept to what the conference room pilot (CRP) needs.

### REQ-01 Half-hourly day plan with carbon bands – Must

**Story:** As Dave, opening the planner at 07:00, I want to see every half hour of the staffed day with its forecast carbon intensity band, so that I can spot the greener times to charge without opening another app.

**Acceptance criteria**

- **AC-01.1** **Given** the demo date is Tue 16 June 2026 and D1 holds the sample forecast (A.5), **when** Dave opens the day plan, **then** it shows 19 slots starting 07:00, 07:30 … 16:00, and no others (BR-09).
- **AC-01.2** **Given** the sample forecast, **when** the day plan is shown, **then** every slot shows its band as a coloured fill **and** the band name in text, using the mapping in brand identity §4, and the slots 12:00 to 13:30 read "very low" (BR-10, NFR-03).
- **AC-01.3** **Given** the sample forecast with the 15:30 period removed from D1, **when** the day plan is shown, **then** the 15:30 slot reads "No forecast" and every other slot is unchanged (BR-10).
- **AC-01.4** **Given** the S9 sample day (Tue 8 December 2026), where no slot is low or very low, **when** Dave opens the day plan, **then** every slot shows its band, and no slot is singled out as the "least bad" (parking lot).
- **AC-01.5** **Given** any sample day, **when** the day plan is shown, **then** it shows bands only: no gCO₂/kWh figures (DI-004) and no instruction about which battery to charge or when (OBS-1.3, DEC-32).

**Trace:** Processes 1, 2 · DEC-13, DEC-15, DEC-21 · DI-001, DI-003 to DI-006, DI-033, DI-034; DF-02, DF-11, DF-12, DF-03 · S1, S9, S14 · BR-08, BR-09, BR-10

### REQ-02 Bike state per slot – Must

**Story:** As Aisha, I want to see what each bike is doing in each half hour, including bikes that are back but not yet checked in, so that I don't plan to charge a battery that isn't here and I know to look by the wall.

**Acceptance criteria** (all apply BR-01)

- **AC-02.1** **Given** G02's resource is unavailable and G05's is hidden in the stand-in, **when** the day plan is shown, **then** G02 and G05 read "Out of service" in every slot, whatever their reservations.
- **AC-02.2** **Given** now is 07:00 and M01 has a reservation 09:00–12:00 with no check-in, **when** the day plan is shown, **then** M01 reads "Out on loan" in the slots 09:00 to 11:30.
- **AC-02.3** **Given** now is 11:30 and M02's reservation 09:00–11:00 has no check-in (S11), **when** the day plan is shown, **then** M02 reads "Overdue – not checked in" with "due 11:00" in the 11:00 and 11:30 slots.
- **AC-02.4** **Given** now is 10:30 and M05's reservation 08:00–12:00 was checked in at 10:15 (S13), **when** the day plan is shown, **then** M05 reads "Out on loan" from 08:00 to 09:30 and "In the workshop" from 10:00 onwards, not "Out on loan".
- **AC-02.5** **Given** M09's resource is available and it has no reservation today, **when** the day plan is shown, **then** M09 reads "In the workshop" in every slot.
- **AC-02.6** **Given** now is 07:00 and M10's reservation 07:30–12:30 has no check-in yet, **when** the day plan is shown, **then** M10 reads "In the workshop" from 12:30, not "Overdue – not checked in", because 12:30 hasn't passed (DEC-23).
- **AC-02.7** **Given** M07 reads "In the workshop", **when** its resource status in the stand-in changes to unavailable and the day plan is opened again, **then** M07 reads "Out of service". There is no way to set a bike's availability in the tool (DEC-01).
- **AC-02.8** **Given** M12's LibreBooking resource ID matches no resource in the stand-in, **when** the day plan is shown, **then** M12 reads "Out of service" with a warning that its resource ID doesn't match LibreBooking (BR-12). **[OQ-15]**
- **AC-02.9** **Given** M08 was booked yesterday 14:00–16:30 and has never been checked in, **when** the day plan is shown at 07:00 today, **then** M08 reads "Overdue – not checked in" with "due Mon 16:30" in every slot (DEC-24).
- **AC-02.10** **Given** G04 is on a loan from Mon 15 June 09:00 to Wed 17 June 16:30 with no check-in, **when** the day plan is shown on Tue 16 June, **then** G04 reads "Out on loan" in every slot (DEC-24).

**Trace:** Process 2 · DEC-01, DEC-16, DEC-18, DEC-23, DEC-24, DEC-30 · DI-008, DI-029 to DI-032, DI-035; DF-01, DF-13, DF-03 · S2, S5, S11, S13 · BR-01, BR-08, BR-12

### REQ-03 Next booking – Must

**Story:** As Aisha, I want to see when each bike next goes out, even if that's tomorrow, so that I can decide whether a returned battery can wait for a greener half hour.

**Acceptance criteria** (all apply BR-03)

- **AC-03.1** **Given** now is 10:00 on Tue 16 June, M03 was checked in at 10:00 and its next reservation starts Wed 17 June at 13:00 (S2), **when** the day plan is shown, **then** M03 shows "next out: Wed 13:00".
- **AC-03.2** **Given** now is 10:00 and M04's next reservation starts at 14:00 today, **when** the day plan is shown, **then** M04 shows "next out: 14:00".
- **AC-03.3** **Given** now is 15:30, M06 was checked in at 15:30 and its next reservation starts Wed 17 June at 09:00 (S3), **when** the day plan is shown, **then** M06 shows "next out: Wed 09:00".
- **AC-03.4** **Given** M09 has no reservation today or on Wed 17 June, but has one on Thu 18 June, **when** the day plan is shown, **then** M09 shows "No booking".
- **AC-03.5** **Given** now is 10:00 and M01's reservation 09:00–12:00 has started and its next one starts at 14:00, **when** the day plan is shown, **then** M01 shows "next out: 14:00" (a reservation that has started isn't the next booking).
- **AC-03.6** **Given** the demo date is Fri 19 June 2026 and G03's next reservation starts Mon 22 June at 09:00, **when** the day plan is shown, **then** G03 shows "next out: Mon 09:00" (BR-09, DEC-45).

**Trace:** Process 2 · DEC-17 · DI-029, DI-041; DF-01, DF-03 · S2, S3 · BR-03, BR-09

### REQ-04 Phone timeline – Must

**Story:** As Dave, with my phone held upright at the counter, I want the day as a vertical list of half hours with the bikes that change state listed under each, so that I can read the whole day without scrolling sideways.

**Acceptance criteria**

- **AC-04.1** **Given** a phone screen 390 × 844 CSS pixels held upright (NFR-02), **when** Dave opens the day plan, **then** the slots run top to bottom from 07:00 to 16:00 and the page doesn't scroll sideways.
- **AC-04.2** **Given** the sample day, **when** the timeline is shown, **then** the 07:00 slot lists every bike with its state, and each later slot lists only the bikes whose state differs from the slot before, with their new state. **[OQ-13]**
- **AC-04.3** **Given** now is 07:00 on the sample day (S1), **when** Dave looks at the timeline, **then** he can see, without leaving the screen, that the 12:00 to 13:30 slots are very low and that M11 and M10 come back over lunch, shown as "In the workshop" from 12:00 (M11) and 12:30 (M10) (DEC-23).
- **AC-04.4** **Given** the timeline, **when** Dave looks at any bike listed on it, **then** he can see that bike's next booking (REQ-03), and any open fault flag (REQ-13) or rebooked-while-overdue warning (REQ-15), without leaving the day plan. The next booking is the Must part; the flag and warning are scored with REQ-13 and REQ-15 (measurement plan §6.1).
- **AC-04.5** **Given** the timeline, **when** it's shown, **then** each slot shows its band as in AC-01.2.

**Trace:** Process 2 (physical layout) · DEC-15 · DI-034, DI-035; DF-03 · S1 · BR-01, BR-10

### REQ-05 Asset record – Must

**Story:** As Sam, standing next to a bike, I want its last service and its fitted battery first, then its history newest first, so that I can answer questions about it in seconds.

**Acceptance criteria**

- **AC-05.1** **Given** M07 has a dealer service on 21 April 2026, a service check on 11 June 2026 and B-07 fitted (A.3), **when** Dave opens M07 (S7), **then** the first things shown are the last service **[OQ-07]** and the fitted battery: "B-07", its battery type, its purchase date (14 March 2023) and its cycle count (301).
- **AC-05.2** **Given** M07's entries, **when** its record is shown, **then** the history lists every service, fault and dealer service entry newest first by Entry date, and by Entry ID (newest first) for entries on the same date (data dictionary OI-14).
- **AC-05.3** **Given** B-17 is on the shelf and B-09 has an open fault (A.3), **when** each battery's record is opened, **then** B-17 shows "On the shelf" and B-09 shows "Quarantined", first, followed by the battery's details and history (BR-02).
- **AC-05.4** **Given** a fault with no Cleared date and another with one, **when** the record is shown, **then** the first reads "open" and the second reads "closed" with its Cleared date and Cleared by (BR-07).
- **AC-05.5** **Given** G01 has no Frame size, B-10 has no Bosch serial and B-18 has no Cycle count, **when** their records are shown, **then** they read "One size", "Not recorded" and "Not yet read" respectively; a bike with no battery fitted reads "No battery fitted" (data dictionary §2).
- **AC-05.6** **Given** Priya last edited M07 at 2026-06-10 14:03, **when** M07's record is shown, **then** it shows "Last updated by Priya Shah, 10 Jun 2026 14:03" or equivalent (BR-11).
- **AC-05.7** **Given** Dave is on the day plan, **when** he's asked "when was M07 last serviced?" while standing next to it, **then** he can answer in under 30 seconds (timed at the CRP; success measure, section 8).

**Trace:** Process 3.4 · DEC-07, DEC-09, DEC-14, DEC-19, DEC-20 · DI-007 to DI-028, DI-036 to DI-040; DF-10, DF-22, DF-23 · S7, S12 · BR-02, BR-07, BR-11

### REQ-06 Add and edit bikes, batteries and battery types – Must

**Story:** As Priya, I want to add and edit bikes, batteries and battery types in one place that works on my phone, so that we can stop using the four spreadsheets.

**Acceptance criteria**

- **AC-06.1** **Given** Priya has picked her name, **when** she adds bike G07 with LibreBooking resource ID, make and model, **then** it's saved with Last updated by "Priya Shah" and Last updated at now, and appears in the bike list (BR-11).
- **AC-06.2** **Given** the add or edit screen, **when** Priya tries to save a bike or battery without a mandatory item, with an asset tag or LibreBooking resource ID already in use, or with a value outside the format in the data dictionary (DI-007 to DI-019), **then** nothing is saved and a message names the item to fix.
- **AC-06.3** **Given** Priya adds the battery type "Bosch PowerPack 545" with no capacity **(invented)**, **when** she next adds a battery, **then** that type is offered, and its record shows capacity "Not recorded".
- **AC-06.4** **Given** M07's LibreBooking resource ID is wrong, **when** Priya corrects it, **then** the record shows the new ID with her name and the time, and M07 appears on the day plan with its bookings (OBS-2.2).
- **AC-06.5** **Given** any add or edit screen, **when** it's shown, **then** there's no availability or status field and no delete action (DEC-01, DEC-09, ASM-10).
- **AC-06.6** **Given** two new batteries arrive (S10), **when** Aisha adds B-27 and B-28 as Bosch PowerPack 500, **then** both are saved with her name and both show "On the shelf".

**Trace:** Process 3.1 · DEC-01, DEC-08, DEC-09, DEC-11, DEC-19 · DI-007 to DI-019, DI-038, DI-039; DF-04, DF-18, DF-26 · S10 · BR-11

### REQ-07 Record a battery swap – Must

**Story:** As Dave, mid-handover at the counter, I want to record a battery swap starting from whichever item I'm holding, the bike or the battery, so that we always know which battery is where.

**Acceptance criteria**

- **AC-07.1** **Given** now is 08:05, G01 has B-14 fitted, B-17 is on the shelf and the device remembers "Dave Morgan" (S4), **when** Dave opens G01 and swaps in B-17, **then** a fitting of B-17 to G01 is saved with Fitted from 08:05, Recorded by "Dave Morgan" and Recorded at 08:05; G01 shows B-17 fitted; B-14 shows "On the shelf". **[OQ-05]**
- **AC-07.2** **Given** the same starting data, **when** Dave opens B-17 and fits it to G01, **then** the result is the same as AC-07.1.
- **AC-07.3** **Given** the swap screen, **when** Dave saves without changing the time, **then** Fitted from is now; he can set an earlier time, but not a later one (DI-020).
- **AC-07.4** **Given** B-05 is fitted to M05, **when** Dave fits B-05 to M06, **then** M06 shows B-05 fitted and M05 shows "No battery fitted" (BR-02).
- **AC-07.5** **Given** B-17 (Bosch PowerPack 500) and M04 (fitted for a PowerTube 500), **when** Dave fits B-17 to M04, **then** it's saved without any compatibility or duplicate-fitting check (DEC-06).
- **AC-07.6** **Given** any swap, **when** it's saved, **then** nothing is sent to LibreBooking, and the tool offers no check-out or check-in (DEC-18, NFR-04).

**Trace:** Process 3.2 · DEC-06, DEC-18, DEC-19, DEC-20 · DI-007, DI-014, DI-020, DI-025, DI-037; DF-05, DF-19 · S4 · BR-02, BR-11 · NFR-01

### REQ-08 Remove a battery, and show where every battery is – Must

**Story:** As Sam, I want to take a battery out of a bike without fitting another, and see where every battery is, so that a swollen battery doesn't go back on the rack and the monthly stock check matches.

**Acceptance criteria**

- **AC-08.1** **Given** B-09 is fitted to M04 and has an open fault (S12), **when** Sam removes B-09 from M04, **then** a fitting of B-09 with no bike is saved with his name and the time; M04 shows "No battery fitted"; B-09 shows "Quarantined".
- **AC-08.2** **Given** B-01 is fitted to M01 and has no open fault, **when** Sam removes it, **then** B-01 shows "On the shelf" and M01 shows "No battery fitted".
- **AC-08.3** **Given** B-09 is still fitted to M04 and has an open fault, **when** B-09's record is shown, **then** it reads "Quarantined" (quarantine takes precedence, BR-02).
- **AC-08.4** **Given** B-28 was added in S10 (AC-06.6) and has never been fitted, **when** its record is shown, **then** it reads "On the shelf".
- **AC-08.5** **Given** the sample fleet, **when** Priya opens the battery list, **then** all 26 batteries are listed, each with its location ("Fitted to <bike>", "On the shelf" or "Quarantined"), so she can check them against the stock check. **[OQ-19]**

**Trace:** Processes 3.2, 3.4 · DEC-09, DEC-20 · DI-007 (optional on Fitting), DI-036, DI-040; DF-05, DF-19, DF-22, DF-10 · S4, S12 · BR-02, BR-06

### REQ-09 Faults, service checks and dealer services – Must

**Story:** As Sam, I want to log faults, service checks and dealer services against a bike or a battery, and clear a fault when I fix it, so that faults get closed and the history is in one place.

**Acceptance criteria**

- **AC-09.1** **Given** Sam has opened G02 (S5), **when** he reports the fault "Front brake pads worn below 1.5 mm" with today's date, **then** a fault entry is saved with no Cleared date, Recorded by "Sam Patel" and Recorded at now, and G02's record shows it as open.
- **AC-09.2** **Given** Sam has opened B-09, **when** he reports the fault "Swollen – do not charge or fit", **then** B-09 shows "Quarantined" (DEC-09).
- **AC-09.3** **Given** G02 has that open fault, **when** Sam clears it on Wed 17 June (S5), **then** it's saved with Cleared date 2026-06-17 and Cleared by "Sam Patel", reads "closed", and is no longer offered as an open fault to clear. The Cleared date can't be before the Entry date or in the future (DI-027).
- **AC-09.4** **Given** Sam's Thursday check, **when** he records a service check on M03, "Rear tyre low, pumped up", **then** a service check entry is saved with no Cleared date or Cleared by.
- **AC-09.5** **Given** M07 has the open fault "Rear light flickers" (entry 1043), **when** Priya records a dealer service for M07 with Entry date 2026-06-15, "Interim: new rear light, brake bleed", and marks fault 1043 as cleared by it (S6), **then** the dealer service entry is saved and fault 1043 reads "closed" with Cleared date 2026-06-15 and Cleared by "Priya Shah" (DEC-03, BR-07).
- **AC-09.6** **Given** any of these entry screens, **when** someone tries to save without a description, without exactly one bike or battery, or with an Entry date in the future, **then** nothing is saved and a message names the item to fix. Entry date defaults to today.
- **AC-09.7** **Given** G02 has an open fault and its resource is still available in LibreBooking, **when** the day plan is shown, **then** G02's state isn't "Out of service" (DEC-02). It only changes when someone sets it Unavailable in LibreBooking.

**Trace:** Process 3.3 · DEC-02, DEC-03, DEC-09, DEC-14 · DI-021 to DI-028, DI-037; DF-06 to DF-09, DF-20, DF-21 · S5, S6, S12 · BR-07, BR-11

### REQ-10 Pick a name once; stamp every change – Must

**Story:** As Priya, I want every change to carry the name of the person who made it and when, without anyone typing their name each time, so that I know who to ask when a record looks wrong.

**Acceptance criteria**

- **AC-10.1** **Given** no name has been picked on Aisha's phone, **when** she saves her first change, **then** she is asked to pick her name first, and the change is saved with it. **[OQ-06]**
- **AC-10.2** **Given** Aisha picked "Aisha Bello" yesterday and has since closed the browser, **when** she records a fault today, **then** it's saved with Recorded by "Aisha Bello" and she isn't asked again.
- **AC-10.3** **Given** the depot tablet remembers "Dave Morgan", **when** Sam changes the name to "Sam Patel", **then** later changes on the tablet carry "Sam Patel".
- **AC-10.4** **Given** a name is picked, **when** a fitting or entry is saved, **then** it carries Recorded by and Recorded at; **when** a bike or battery is saved, **then** its Last updated by and Last updated at are overwritten; **when** a fault is cleared, **then** Cleared by is the picked name (BR-11).
- **AC-10.5** **Given** Priya keys a dealer service on 16 June at 16:12 with Entry date 15 June, **when** the entry is shown, **then** it shows both the Entry date (15 June) and Recorded at (16 June 16:12).
- **AC-10.6** **Given** any device on the depot network, **when** the tool is opened, **then** there's no password or login (NFR-05).

**Trace:** Processes 3.1 to 3.3 · DEC-11, DEC-19 · DI-025, DI-028, DI-037 to DI-039; DF-04 to DF-09 · S4, S5 · BR-11

### REQ-11 Warn when fitting a quarantined battery – Must

**Story:** As Sam, I want a warning when anyone picks a quarantined battery to fit, but still to be able to fit one to test it, so that a swollen battery doesn't end up in a bike by mistake.

**Acceptance criteria** (all apply BR-06)

- **AC-11.1** **Given** B-09 has been removed from M04 and has the open fault "Swollen – do not charge or fit", **when** Dave picks B-09 to fit to M04, starting from either M04 or B-09 (S12), **then** before anything is saved he sees a warning that B-09 is quarantined, with the fault's date and description, and a choice to go back or fit it anyway.
- **AC-11.2** **Given** that warning, **when** Dave goes back, **then** nothing is saved.
- **AC-11.3** **Given** that warning, **when** Sam fits it anyway, **then** the fitting is saved with his name and the time, and B-09 still reads "Quarantined".
- **AC-11.4** **Given** B-17 has no open fault, **when** Dave fits it, **then** no warning is shown.
- **AC-11.5** **Given** B-09's fault has been cleared, **when** Dave fits B-09, **then** no warning is shown.

**Trace:** Process 3.2 · DEC-06, DEC-09, DEC-14 · DI-036; DF-25 · S12 · BR-06, BR-07

### REQ-12 Tablet and print grid – Should

**Story:** As Sam, on the depot tablet or on paper, I want the day as a grid of bikes by half hours, with a print button, so that I can see the whole fleet at once and have a paper copy on the days it's wanted.

**Acceptance criteria**

- **AC-12.1** **Given** a tablet screen 1024 × 768 CSS pixels in landscape, **when** Sam opens the day plan, **then** it's shown as a grid with one row per bike and one column per slot, each column headed by its time and band (name and colour), and each cell showing the bike's state in text.
- **AC-12.2** **Given** the day plan on any screen, **when** Priya presses the print button, **then** the grid prints on one A4 landscape page **(invented)** with the plan date, every band name and every bike state in text, so it reads correctly in black and white (NFR-03).
- **AC-12.3** **Given** the printed grid, **when** it's read, **then** each bike's next booking, open fault flag and rebooked-while-overdue warning are on it.

**Trace:** Process 2 (physical layout) · DEC-15, DEC-21 · DF-03 · S8 · BR-01, BR-10

### REQ-13 Flag bikes with an open fault – Should

**Story:** As Sam, I want bikes with an open fault flagged on the day plan without changing their state, so that whoever is on shift notices before handing one over.

**Acceptance criteria** (all apply BR-04)

- **AC-13.1** **Given** M07 has the open fault "Rear light flickers" and its resource is available, **when** the day plan is shown, **then** M07 carries a fault flag with an icon and text, and its state in each slot is unchanged.
- **AC-13.2** **Given** that fault is cleared, **when** the day plan is opened again, **then** the flag has gone.
- **AC-13.3** **Given** B-09 has an open fault and is fitted to M04, and M04 has no open fault, **when** the day plan is shown, **then** M04 isn't flagged (DI-042). **[OQ-14]**

**Trace:** Process 2 · DEC-02 · DI-042; DF-24 · S5 · BR-04

### REQ-14 Battery cycle counts on the dealer service screen – Should

**Story:** As Priya, keying a dealer job sheet, I want to enter each battery's cycle count on the same screen as the service, so that I key the job sheet once.

**Acceptance criteria**

- **AC-14.1** **Given** a job sheet for G01 dated 15 June that reads B-14: 170 cycles and B-17: 31 cycles **(invented)**, **when** Priya records the dealer service and enters both counts on the same screen, **then** the dealer service entry is saved, B-14's cycle count is 170 and B-17's is 31, and both batteries show Last updated by "Priya Shah" and the time (DEC-07).
- **AC-14.2** **Given** that screen, **when** Priya leaves a battery's cycle count blank, **then** that battery's stored cycle count is unchanged.
- **AC-14.3** **Given** that screen, **when** a cycle count isn't a whole number from 0 to 9,999, **then** nothing is saved and a message says why (DI-018).

**Trace:** Processes 3.1, 3.3 · DEC-07 · DI-018; DF-04, DF-09 · S6 · BR-11

### REQ-15 Warn when an overdue bike is booked again today – Should

**Story:** As Priya, I want a warning when an overdue bike has another booking later today, so that we can find the next member a different bike in time.

**Acceptance criteria** (all apply BR-05)

- **AC-15.1** **Given** now is 11:30, M02 is overdue (due 11:00) and has another reservation 14:00–16:00 today (S11), **when** the day plan is shown, **then** M02 carries a warning that it's booked again at 14:00.
- **AC-15.2** **Given** an overdue bike whose next reservation is on the next staffed day, **when** the day plan is shown, **then** there's no warning.
- **AC-15.3** **Given** M02 is checked in at 11:45, **when** the day plan is opened again, **then** the warning has gone.

**Trace:** Process 2 · DEC-16 · DI-043; DF-01 · S11 · BR-05

### REQ-16 Link to the charging rules – Should

**Story:** As Aisha, I want a link from the day plan to the charging rules in the volunteer handbook, so that I can check what's safe to charge when I'm not sure.

**Acceptance criteria**

- **AC-16.1** **Given** the day plan, **when** Aisha follows the "Charging rules" link, **then** the handbook page opens. For the proof of concept the URL is `https://docs.google.com/document/d/1RPkcPU35zs2kVmVeexJCgjuZUeO2-jFecB7i5H7U6nf/edit` **(invented)**, standing in for the page Priya shares under action A-01.
- **AC-16.2** **Given** the link, **when** it's set up, **then** it's one fixed URL held with the installation, not entered by staff (OBS-5.6).

**Trace:** No DFD process (a link) · DEC-15 (scope of the plan) · S2 · OBS-1.3, OBS-5.6

### REQ-17 Keep the last loaded day plan on the phone – Could

**Story:** As Dave, when the depot Wi-Fi drops, I want my phone to show the last day plan it loaded, clearly marked, so that I can carry on.

**Acceptance criteria**

- **AC-17.1** **Given** Dave loaded the day plan at 07:05, **when** the network is down at 08:00 and he opens it (S8), **then** the 07:05 plan is shown with a notice that it's the last loaded plan and the time it was loaded.
- **AC-17.2** **Given** the network is back, **when** Dave opens the day plan, **then** a fresh plan replaces the stored one.

**Trace:** Process 2 (physical) · DEC-21 · DF-03 · S8 · section 7.3

### REQ-18 Suggest the next free asset tag – Could

**Story:** As Priya, adding new stock, I want the next free asset tag suggested, so that I don't have to check which numbers are taken.

**Acceptance criteria**

- **AC-18.1** **Given** batteries B-01 to B-26 exist, **when** Aisha adds a battery (S10), **then** B-27 is suggested and she can change it.
- **AC-18.2** **Given** bikes M01 to M12 exist, **when** Priya adds a Motus, **then** M13 is suggested: the next number after the highest in use for that family **(invented rule)**.

**Trace:** Process 3.1 · – · DI-007, DI-014; DF-26 · S10 · –

### REQ-19 Dark theme for the depot wall display – Could

**Story:** As Dave, glancing at the wall display in the depot, I want a dark theme, so that the plan is easy to read from across the room.

**Acceptance criteria**

- **AC-19.1** **Given** the dark theme is on, **when** the day plan is shown, **then** it uses the dark theme colours in brand identity §4, band colours are unchanged, and text meets WCAG 2.1 AA contrast. The theme follows each device's dark mode setting (DEC-34).

**Trace:** Process 2 (physical) · – · brand identity §4, `tokens.css` · – · –

### REQ-20 Import current assets and the last year of entries – Won't (this phase); Must at go-live

**Story:** As Priya, at go-live, I want current bikes and batteries and the last year of service and fault entries imported once, so that I can make the spreadsheets read-only.

Not built or scored for the pilot, which uses sample data (DEC-22). Acceptance criteria for go-live:

- **AC-20.1** **Given** the four spreadsheets, **when** the one-off import runs, **then** columns are mapped as in normalisation §10.
- **AC-20.2** **Given** the import is done, **when** Priya runs a stock check, **then** all 26 batteries' locations match (B-09 reads "Quarantined").
- **AC-20.3** **Given** imported records with no name, **when** they're shown, **then** they read "Imported" with the import date and time as the stamp (data dictionary OI-09).

**Trace:** Processes 3.1, 3.3 (migration, not on the DFDs) · DEC-22 · normalisation §10; data dictionary OI-09 · – · –

---

## 4. Business rules

Stated once here and referenced by the requirements. Where the data dictionary or DFDs already state a rule, the source is given.

### BR-01 Bike state (DEC-16, DEC-23, DEC-30; DFDs §5; DI-035)

For each bike and each half-hour slot, apply the first rule that matches. "The reservation" is the bike's latest reservation that started at or before the slot, including reservations that started before today (DEC-24).

| # | State shown | Rule |
|---|-------------|------|
| 1 | Out of service | The bike's resource is unavailable or hidden in LibreBooking |
| 2 | In the workshop | The reservation covers the slot or has ended, and the bike was checked in against it at or before the slot's end |
| 3 | Out on loan | The reservation covers the slot and the bike wasn't checked in against it by the slot's end |
| 4 | Overdue – not checked in (with "due HH:MM") | The reservation ended before now and the bike wasn't checked in against it by the slot's end (DEC-23, DEC-30). Until the due time has passed, the bike isn't overdue: later slots fall through to rule 5, as if it comes back on time |
| 5 | In the workshop | None of the above |

A reservation covers a slot if it starts before the slot ends and ends after the slot starts. "Checked in by the slot's end" is judged for each slot, so after a late check-in the slots between the due time and the check-in still read overdue (DEC-30). For example, M02, due 11:00 and checked in at 11:45, reads overdue in the 11:00 slot and in the workshop from 11:30. A due time on an earlier day is shown with the day, for example "due Mon 16:30". If an overdue bike's next reservation has already started, rule 3 applies to that reservation (data dictionary OI-17); BR-05 warns earlier.

The tool holds no bike status of its own (DEC-01). An open fault doesn't change the state (DEC-02).

### BR-02 Battery location and a bike's current battery (DEC-20; DFDs §6; DI-040)

| # | Location | Rule |
|---|----------|------|
| 1 | Quarantined | The battery has an open fault (BR-07) |
| 2 | Fitted to <bike> | The battery's latest fitting names a bike, and that bike has no later fitting |
| 3 | On the shelf | Otherwise: removed, replaced by a later fitting to its bike, or never fitted |

A bike's current battery is the battery of the bike's latest fitting, but only if that fitting is also that battery's latest. Otherwise the bike reads "No battery fitted". Removing a battery records a fitting with no bike. Fittings are never changed or deleted (DF-19).

### BR-03 Next booking (DEC-17; DI-041)

The start of the bike's earliest reservation that hasn't started yet, today or on the next staffed day (BR-09). Shown as "next out: HH:MM" for today, "next out: Ddd HH:MM" for the next staffed day, and "No booking" if there's none.

### BR-04 Open fault flag (DEC-02 refined; DI-042)

A bike is flagged if it has at least one fault entry with no Cleared date. The flag doesn't change the bike's state. Faults against a fitted battery don't flag the bike (process 2 doesn't read fittings). **[OQ-14]**

### BR-05 Rebooked while overdue (REQ-15; DI-043)

A bike carries this warning if it's overdue (BR-01 rule 4) now and has another reservation starting later today. The warning shows that reservation's start time.

### BR-06 Quarantine warning (DEC-06 refined; DEC-09; DI-036)

A battery with an open fault is quarantined. When anyone picks a quarantined battery to fit, the tool warns before saving and lets them go back or fit it anyway. It never blocks. There's no compatibility or duplicate-fitting check.

### BR-07 Fault status and clearing faults (DEC-03, DEC-14; DI-026 to DI-028)

A fault is open while its Cleared date is blank and closed once it's filled. Status isn't stored. Whoever fixes a fault clears it. When a dealer service clears a fault, the fault takes the dealer service's Entry date as its Cleared date and its Recorded by as Cleared by (data dictionary OI-04). Cleared date and Cleared by are filled together, on faults only.

### BR-08 Time zones and the clock change (NFR-06; data dictionary §1, OI-03; DI-034)

- Forecasts are stored in UTC as the API supplies them (D1). Everything else is held and shown in UK local time (Europe/London).
- Slots are local times: 07:00 to 16:00 every staffed day, whether GMT or BST. Each slot takes the forecast period that starts at the same instant.
- A forecast period's end is always its start plus 30 minutes and isn't stored (DEC-13).
- All times are shown in 24-hour format, for example 13:30 (brand identity §5).

### BR-09 Staffed hours and the next staffed day (ASM-04; DI-033, DI-034)

Staffed hours are 07:00–16:30, Monday to Friday, fixed for the proof of concept. The day plan has 19 slots, 07:00 to 16:00. The next staffed day is the next weekday (Friday → Monday); bank holidays aren't skipped (DEC-45).

### BR-10 Forecast band per slot (DI-004, DI-005)

Each slot shows the API's index band for that half hour, as the band name and the band colour from brand identity §4. If D1 has no forecast for the slot, it reads "No forecast". The tool doesn't hold or apply its own thresholds.

### BR-11 Who and when (DEC-19; DI-025, DI-028, DI-037 to DI-039)

- Each device remembers the name its user picked; they can change it. It's not a login.
- Fittings and service or fault entries carry Recorded by (the picked name) and Recorded at (stamped by the tool).
- Bikes and batteries carry Last updated by and Last updated at, overwritten on each change. Battery types carry no stamp.
- Cleared by is the picked name of whoever clears the fault, or as BR-07 for a dealer service.

### BR-12 Bike with no matching LibreBooking resource (DI-032, invented in the data dictionary)

If a bike's LibreBooking resource ID matches no resource, the day plan shows it as out of service with a mismatch warning. **[OQ-15]**

---

## 5. Non-functional requirements

### 5.1 Agreed at workshop 1, made measurable

| ID | Requirement | Measure and test |
|----|-------------|------------------|
| NFR-01 | Record a battery swap in two taps after opening the bike or battery, one-handed at the counter mid-handover | **Test:** with a name already picked, on a phone held upright, count taps from the open bike or battery record to the saved swap: no more than 2. Scrolling a list doesn't count; the quarantine warning (BR-06) adds one confirm and is excluded. Every control used is at least 44 × 44 CSS pixels (brand identity §7). At the CRP, Dave and Aisha each record a swap holding the phone in one hand |
| NFR-02 | Work on a phone held upright, a tablet in landscape, and in print | **Test:** the day plan, an asset record and every entry screen are usable with no sideways scrolling at 360 × 740, 390 × 844 and 430 × 932 CSS pixels upright, and at 1024 × 768 and 1366 × 1024 in landscape **(invented sizes)**. The day plan prints on A4 landscape (REQ-12). Touch targets are at least 44 × 44 CSS pixels |
| NFR-03 | Never show a band by colour alone; meet WCAG 2.1 AA | **Test:** every band shown on screen and in print carries its name in text. Text contrast is at least 4.5:1 (3:1 for large text and interface parts), using the pairings in brand identity §4. Focus is visible on every control. An automated accessibility check of the day plan, an asset record and the swap screen reports no AA failures, and a greyscale print of the day plan reads correctly |
| NFR-04 | Read from LibreBooking only; never write to it | **Test:** the stand-in logs every request; after S1 to S14, it has received no request from the tool that creates, changes or deletes anything. Testers' own changes on the stand-in aren't counted. In production, the API key is read-only (A-05) |
| NFR-05 | No login or permissions; the name is picked, not authenticated | **Test:** there's no password screen, and every function in this PRD is available on every device (DEC-11, DEC-19) |
| NFR-06 | Show all times in UK local time, correct either side of the GMT/BST change | **Test:** S14. **Given** D1 holds the A.5 clock-change forecast, **when** the day plan is shown for Mon 30 March 2026 (BST), **then** the 07:00 and 07:30 slots read "very low" and 08:00 reads "moderate"; **when** shown for Mon 26 October 2026 (GMT), **then** 07:00 reads "moderate". Recorded at and Last updated at show local times on both dates (BR-08) |
| NFR-07 | Plain UK English in sentence case; reading age of about 12 | **Test:** all interface text uses UK spelling and sentence case, 24-hour times and units with values. A readability check of the interface text (labels, messages, warnings) gives a reading age of 12 or below **(invented test)** |

### 5.2 Proposed while drafting, agreed by Rob (DEC-52)

Proposed **(invented)** while drafting this PRD and agreed on 12 November 2026. NFR-08 to NFR-11 and NFR-13 apply to the pilot; NFR-12 applies from go-live.

| ID | Requirement | Measure | Why |
|----|-------------|---------|-----|
| NFR-08 | Performance | On depot Wi-Fi, the day plan for 18 bikes is shown within 3 seconds of opening; an asset record within 2 seconds; a save is confirmed within 1 second | Used at the counter mid-handover (NFR-01) |
| NFR-09 | Browser support | The current and previous major versions of Safari on iOS and Chrome on Android, and of the browser on the depot tablet | Volunteers use their own phones |
| NFR-10 | Data retention | D1 keeps 30 days of forecasts (data dictionary OI-12). D2 and D3 are kept indefinitely, since there's no delete (ASM-10). The phone keeps only the last loaded plan (REQ-17) | Keeps D1 small; records replace the spreadsheets |
| NFR-11 | Privacy of staff names | Staff names are the only personal data the tool holds. They are visible to all staff and never sent to LibreBooking or the Carbon Intensity API. The tool doesn't request or store member data: DF-01 carries none | No member data needed; UK GDPR |
| NFR-12 | Backup (from go-live) | From go-live, D2 and D3 are backed up daily and a restore is tested once before go-live. Not needed for the pilot | The tool becomes the only fleet record |
| NFR-13 | Network exposure | Because there's no login (NFR-05), the tool can only be reached from the depot network, or behind an access control agreed in the technical note. For the proof of concept: the CRP runs behind Vercel's deployment protection, and the public demo saves nothing (technical note §7, DEC-49) | Anyone who can reach it can change records |

### 5.3 Added from the technical note (DEC-52)

Found while writing the technical note (v0.3, §8) and agreed by Rob on 12 November 2026. All apply to the pilot.

| ID | Requirement | Measure and test |
|----|-------------|------------------|
| NFR-14 | One clock for all business time | **Test:** with the demo clock set to 08:05 on Tue 16 June 2026, record a swap; Recorded at and Fitted from read 08:05 that day. A code search finds no other use of the system clock for business time |
| NFR-15 | Phones get the planner over HTTPS | **Test:** the CRP deployment's address starts `https://`; REQ-17's service worker registers on a phone |
| NFR-16 | Concurrent edits don't lose history | **Test:** two devices record a swap on the same bike within a minute; both fittings are saved and the bike shows the later one. Edits to bikes, batteries and battery types are last write wins, and the change stamp shows who saved last |
| NFR-17 | Stored text can't run as code; forms can't be posted from another site | **Test:** a fault description containing `<script>` is shown as text; a form post from another origin is rejected |
| NFR-18 | Every Must acceptance criterion has an automated test | **Test:** the test report lists a passing test named for each of AC-01.1 to AC-11.5; browser tests run S1 to S14 at the NFR-02 sizes, with an automated accessibility check of the day plan, an asset record and the swap screen (NFR-03) |
| NFR-19 | A failed save loses nothing the user typed | **Test:** with the database unreachable, submit a fault report; the form returns with the description kept and a message that nothing was saved |
| NFR-20 | Secrets stay on the server | **Test:** the files sent to the browser contain no database service key, no forecast job secret and no stand-in console key |

---

## 6. Screens and interactions

Layouts aren't designed here. Each screen lists the requirements it serves. The product is the "Charging planner", with screens "Day plan" and "Fleet" (DEC-35).

| ID | Screen | What it does | Requirements |
|----|--------|--------------|--------------|
| SCR-01 | Name picker | Pick your name once per device; show and change the current name | REQ-10, NFR-05 |
| SCR-02 | Day plan – phone timeline | Vertical list of the 19 slots with bands; under each slot, the bikes that change state; each bike's next booking and flags; handbook link; print button | REQ-01 to REQ-04, REQ-13, REQ-15 to REQ-17 |
| SCR-03 | Day plan – grid (tablet and print) | Bikes by half hours with bands in the header; print layout on A4 landscape | REQ-01 to REQ-03, REQ-12, REQ-13, REQ-15, REQ-19 |
| SCR-04 | Fleet list | Find a bike or battery; battery list with each battery's location; add a bike, battery or battery type | REQ-05, REQ-06, REQ-08, REQ-18 |
| SCR-05 | Bike record | Last service and current battery first, then history newest first; change stamp; actions: swap battery, remove battery, report fault, service check, dealer service, edit | REQ-05, REQ-07 to REQ-10 |
| SCR-06 | Battery record | Location first, then details, cycle count and history; actions: fit to a bike, remove, report fault, edit | REQ-05, REQ-07, REQ-08, REQ-09, REQ-11 |
| SCR-07 | Add or edit asset | Bike, battery or battery type details with validation; no status and no delete | REQ-06, REQ-10, REQ-18 |
| SCR-08 | Battery swap and removal | Started from a bike (pick a battery) or a battery (pick a bike, or remove); time defaults to now; quarantine warning | REQ-07, REQ-08, REQ-11, NFR-01 |
| SCR-09 | Fault report and clearance | Report a fault on a bike or battery; clear an open fault | REQ-09, REQ-10 |
| SCR-10 | Service check | Record a check on a bike or battery | REQ-09, REQ-10 |
| SCR-11 | Dealer service | Record a dealer service from the job sheet; mark the open faults it cleared; enter battery cycle counts | REQ-09, REQ-10, REQ-14 |

### 6.1 Components the design system must provide

All built from `brand/tokens.css` semantic tokens (brand identity §7, §9).

| Component | Notes | Used by |
|-----------|-------|---------|
| Band tag | Pill with band fill, band text colour and band name; optional icon; "No forecast" variant | REQ-01, REQ-04, REQ-12 |
| Bike state label | Text label for each of the four states, with an icon; "due HH:MM" for overdue | REQ-02, REQ-04, REQ-12 |
| Next booking label | "next out: 14:00", "next out: Wed 09:00", "No booking"; times in IBM Plex Mono | REQ-03 |
| Flag and warning badges | Open fault flag; rebooked-while-overdue; resource mismatch. Icon plus text (`triangle-alert`) | REQ-13, REQ-15, BR-12 |
| Timeline slot | Slot time, band tag, list of bike rows | REQ-04 |
| Plan grid | Sticky bike column and slot header; print stylesheet | REQ-12 |
| Asset summary card | Header block for a bike or battery: last service, current battery or location, change stamp | REQ-05, REQ-08 |
| History list item | Entry type, Entry date, description, Recorded by and at, fault status | REQ-05, REQ-09 |
| Asset picker | Choose a bike or battery quickly from a list, with location shown for batteries | REQ-07, REQ-08 |
| Form fields | Text, number, list, date and date-time (defaulting to now), with inline validation messages | REQ-06, REQ-09, REQ-14 |
| Confirm warning | Non-blocking warning with "Go back" and "Fit anyway" | REQ-11 |
| Name chip and picker | Current name, always visible; change it | REQ-10 |
| Buttons | Primary and secondary (brand identity §7), print button | All |
| Notices | Save confirmation; last-loaded-plan notice; source unavailable | REQ-17, section 7.3 |
| Empty and missing values | "No booking", "No forecast", "Not recorded", "Not yet read", "One size", "No battery fitted" | REQ-01, REQ-03, REQ-05 |
| Link out | Charging rules link, opens the handbook | REQ-16 |

---

## 7. Integrations

### 7.1 LibreBooking (read only)

**What's needed** (DF-01; ASM-02 confirmed by Lewis; endpoints to follow, A-05):

- Every bike resource: LibreBooking resource ID and resource status (available, unavailable or hidden).
- Reservations for today and the next staffed day, plus any reservation that started before today and is either still running or not checked in (DEC-24): resource ID, reservation start, reservation end, and checked-in time if any.
- Nothing about members.

**Refresh:** read live each time staff open the day plan (data dictionary §2.7). Nothing from LibreBooking is stored. **[OQ-08]**

**Stand-in for the demo** (CON-03). The stand-in replaces LibreBooking and must:

1. Answer the same two questions as the real API: list resources with their status, and list reservations with start, end and checked-in time, including earlier reservations still running or not checked in. The stand-in's data is synthesised and may include data the real API isn't yet known to supply (DEC-27). Field names follow the real API once A-05 confirms them; anything unconfirmed is listed for Lewis to check before go-live.
2. Be read only, and log every request (NFR-04).
3. Load the sample data in Appendix A, and let the tester change a resource's status or add a check-in during a scenario (AC-02.7, AC-15.3).
4. Provide a demo clock that sets today's date and the time "now" for the whole tool, so S1 to S14 can run on their fixed dates (DEC-26). The clock is part of the demo set-up, not a feature for staff.

### 7.2 Carbon Intensity API

**What's needed** (DF-02; research note): the regional forecast for the depot's postcode (Cowley, OX4, in the South England region, DEC-44), in half-hour periods with period start, period end, forecast intensity and index band, covering at least today's staffed hours.

**Refresh:** process 1 fetches every 30 minutes and overwrites stored periods (D1). The day plan reads D1, not the API.

**For the demo** (DEC-26): the forecasts in Appendix A.5 are recorded and loaded into D1 for the scenario dates, because the live API can't forecast them on the day of the demo. On any other date, process 1 uses the live API.

### 7.3 When a source is unavailable (DEC-21)

DEC-21 agreed the fallback for the depot losing its connection: a print button and the last loaded plan kept on the phone. Behaviour for each source (DEC-33) **[OQ-08]**:

| Situation | Behaviour |
|-----------|-----------|
| Depot Wi-Fi or the phone's connection drops | The phone shows the last loaded plan with its load time (REQ-17). Fleet records need a connection |
| LibreBooking can't be reached | The day plan says bookings can't be loaded and shows no bike states. If REQ-17 is built, the last loaded plan is offered. Fleet records still work |
| Carbon Intensity API can't be reached | The day plan is built from what's already in D1. Slots with nothing stored read "No forecast" (BR-10). Bike states are unaffected |

---

## 8. Success measures

From workshop notes §12. Targets are **(invented)** in the workshop notes.

| Measure | How | When | Target |
|---------|-----|------|--------|
| Charging starts in a low or very low band | Tally sheet on the rack: tick the band at plug-in | Two weeks before go-live (A-04) and two weeks at three months | Up by a third |
| Spreadsheets updated since go-live | Version history | At three months | None |
| Time to answer "when was M07 last serviced?" standing next to the bike | Timed | At the CRP (AC-05.7) and at three months | Under 30 seconds |
| Batteries whose recorded location matches the monthly stock check | Stock check against the battery list (AC-08.5) | Monthly from go-live | All 26 |
| Faults open more than 30 days | Asset records | At three months | Fewer than 3 |

The tool doesn't record charging (out of scope), which is why the first measure uses a tally sheet.

---

## 9. Pilot readiness

The conference room pilot runs on sample data (Appendix A), not imported data (DEC-22). The build is ready for the pilot when:

1. Every acceptance criterion for REQ-01 to REQ-11 passes. Criteria tagged with an open question are updated before scoring.
2. Scenarios S1 to S14 run cleanly against the sample data: every step that tests a Must passes. Steps that test a Should or Could requirement (REQ-12 to REQ-18) are scored separately and don't block the pilot (DEC-25).
3. NFR-01 to NFR-11 and NFR-13 to NFR-20 pass their tests (DEC-31, DEC-52). NFR-12 applies from go-live.
4. Every decision trap in the measurement plan (§6.2) is handled as "a correct build" describes.
5. The stand-in, demo clock and recorded forecasts (sections 7.1, 7.2) can reset to the starting data between scenarios.

When the three routes are compared, every build is run against the same stand-in, demo clock and recorded forecasts (DEC-29). S9 and S14 score Partial on any build that still can't be set to the scenario date (DEC-28).

| Scenario | Requirements it tests |
|----------|-----------------------|
| S1 | REQ-01, REQ-04 |
| S2 | REQ-02, REQ-03, REQ-16 |
| S3 | REQ-03 |
| S4 | REQ-07, REQ-08, REQ-10 |
| S5 | REQ-02, REQ-09, REQ-13 |
| S6 | REQ-09, REQ-14 |
| S7 | REQ-05 |
| S8 | REQ-12, REQ-17 |
| S9 | REQ-01 |
| S10 | REQ-06, REQ-18 |
| S11 | REQ-02, REQ-15 |
| S12 | REQ-08, REQ-09, REQ-11 |
| S13 | REQ-02 |
| S14 | NFR-06 (REQ-01) |

The CRP script (`docs/crp-script.md` v1.3, action A-08) turns these into steps, and places criteria that name no scenario in the nearest one.

---

## 10. Assumptions, risks and open questions

### 10.1 Assumptions

The single register is workshop notes §7. Those that affect this PRD:

| ID | Assumption | Status | Effect here |
|----|------------|--------|-------------|
| ASM-01 | 18 bikes (12 Motus, 6 GSD), 26 batteries, 16-slot rack | Confirmed | Sample data (Appendix A) |
| ASM-02 | LibreBooking's API supplies reservations with check-in times and resource status, up to the next staffed day, and (DEC-24) earlier reservations still running or not checked in | Confirmed, except earlier reservations, which are open again (workshop notes §7 update). The stand-in synthesises them (DEC-27) | Section 7.1 |
| ASM-03 | Forecast from the regional forecast for the depot's postcode; Cowley OX4, earlier OX3, same region | Confirmed by Priya: OX4 (DEC-44) | Section 7.2 |
| ASM-04 | Staffed 07:00–16:30 weekdays; no unattended charging; hours fixed | Open | BR-09, CON-07 |
| ASM-06 | The demo uses a spring or summer date | Open | Appendix A uses Tue 16 June 2026; S9 and S14 need other dates |
| ASM-07 | Batteries of the same type can be swapped; the tool doesn't check | Open | AC-07.5, OQ-05 |
| ASM-10 | Retiring an asset is an admin task outside the tool | Open | AC-06.5 |
| ASM-12 | Staff pick their own name honestly; no verification (invented) | Open | REQ-10 |

### 10.2 Risks

All **(invented)** unless a source is given.

| ID | Risk | Effect | Mitigation |
|----|------|--------|------------|
| RSK-01 | The real LibreBooking API can't supply something the stand-in synthesises, such as earlier reservations not checked in (DEC-27) | Rework before go-live; possibly a fallback such as fetching a fixed window and filtering | Keep the stand-in to the logical contract in 7.1; Lewis confirms each item under A-05 before go-live |
| RSK-02 | Late check-ins continue (about 1 in 5 over an hour, Lewis) | Bikes read overdue when they're by the wall | The "not checked in" wording points to the wall (DEC-16); handbook reminder (A-03) |
| RSK-03 | A wrong resource ID drops a bike off the day plan (OBS-2.2) | A bike is missed | Change stamps (REQ-10); mismatch warning (BR-12, if confirmed) |
| RSK-04 | Staff read the bands as an instruction | Charging decided by colour alone | Band names only; handbook link (REQ-16) |
| RSK-05 | The same person appears under two names on different devices (data dictionary OI-18) | Harder to know who to ask | Name picked once per device; Priya checks at three months |
| RSK-06 | An open fault doesn't stop a bike being booked unless someone sets it Unavailable (DEC-02) | A faulty bike goes out | Fault flag (REQ-13); reminder to staff (A-09) |
| RSK-07 | No login means anyone who can reach the tool can change records (NFR-05) | Accidental or malicious changes | NFR-13: deployment protection for the CRP and a public demo that saves nothing (DEC-49); change stamps |
| RSK-08 | Role-played workshop: real users may disagree | Requirements change at the CRP | CRP with real staff before go-live |

### 10.3 Open questions

Gaps and conflicts found while writing this PRD. Resolved questions are logged as agreed decisions (section 10.4). Questions marked **Assumed** are logged as assumed decisions: the build follows them, and the team confirms them at the CRP (CRP script §10.3). Priya answered OQ-12 and OQ-18. Criteria tagged with a resolved question no longer carry the tag.

| ID | Question | Where the documents disagree or are silent | Options | Working assumption | Affects |
|----|----------|-------------------------------------------|---------|--------------------|---------|
| OQ-01 | **Resolved (DEC-23).** **Should future slots show a bike as overdue?** | DEC-16 rule 4 (and DFDs §5) makes a bike "Overdue – not checked in" in every slot after its reservation ends without a check-in. Viewed at 07:00, every bike due back later today would read overdue from its due time. That contradicts S1 ("bikes back over lunch are visible at 07:00") and the purpose of S2 and S3 | (a) Overdue only once the due time has passed; until then, later slots read "In the workshop" (expected back). (b) Keep the rule as written | (a), agreed | BR-01, AC-02.6, AC-04.3 |
| OQ-02 | **Resolved (DEC-24).** **Which reservations does the tool read?** | DF-01 and DEC-17 read reservations for today and the next staffed day. A bike booked yesterday and never checked in (OBS-3.3: "a few never are"), or on a multi-day loan that started earlier, would have no reservation in that window, so BR-01 rule 5 shows it "In the workshop" | (a) Also read reservations that started before today and are either still running or not checked in. (b) Keep the window; accept the gap for the proof of concept | (a), agreed | BR-01, AC-02.9, AC-02.10, DF-01, section 7.1 |
| OQ-03 | **Resolved (DEC-25).** **What does "S1 to S14 run cleanly" mean when scenarios use Should and Could requirements?** | Workshop notes §1 pilot the 11 Musts; the measurement plan scores Musts plus S1–S14. But S2 (REQ-16), S5 (REQ-13), S6 (REQ-14), S8 (REQ-12, REQ-17), S10 (REQ-18) and S11 (REQ-15) depend partly on Should or Could requirements | (a) A scenario passes if its Must steps pass; Should and Could steps are scored separately and don't block. (b) All steps must pass, so those Should and Could requirements are built for the pilot. (c) Promote the Shoulds those scenarios use to Must | (a), agreed | Section 9, measurement plan §6.1 |
| OQ-04 | **Resolved (DEC-26).** **How does the demo run on fixed dates?** | DI-033 says the plan date is today from the system clock, but the scenarios need Tue 16 June 2026, Tue 8 December 2026 and the two clock-change Mondays. The live API can't forecast those dates when the demo runs, and the brief only replaces LibreBooking | (a) A demo clock in the stand-in, plus a recorded forecast fixture loaded into D1 for the scenario dates; the live API otherwise. (b) A second stand-in for the Carbon Intensity API. (c) Live API only; run scenarios on whatever today is | (a), agreed | Sections 7.1, 7.2, Appendix A, S1, S9, S14 |
| OQ-05 | S4 fits B-17 (PowerPack 500, a GSD spare) into M04 (a Motus with a PowerTube 500) | Normalisation NI-10; conflicts with ASM-07 | (a) Change S4 to a GSD: B-17 into G01. (b) Keep S4 to show what DEC-06 allows | **Assumed (DEC-36):** (a); AC-07.5 still shows DEC-06. Confirm at the CRP | AC-07.1, CRP script |
| OQ-06 | Where does the name picker's list of names come from? | DEC-19 and REQ-10 say "pick"; there's no staff store, and names are free text (DI-025, OI-18) | (a) Type your name once; the device remembers it. (b) A fixed list held with the installation (a new store) | **Assumed (DEC-37):** (a). Confirm at the CRP | AC-10.1, SCR-01 |
| OQ-07 | What is "the last service" on an asset record? | REQ-05 and S7 say "last service"; D3 has service checks (weekly) and dealer services | (a) The latest dealer service. (b) The latest entry of either type, labelled. (c) Both | **Assumed (DEC-38):** (b). Confirm at the CRP | AC-05.1 |
| OQ-08 | Does an open day plan refresh itself? | Data dictionary §2.7: read each time it's opened. The wall display (REQ-19) and a phone left open would go stale. DI-006 Retrieved at is stored "so a stale forecast can be spotted" but nothing shows it | (a) On opening and on a manual refresh only. (b) Also automatically every few minutes. Plus: show when the forecast was retrieved, or not | **Assumed (DEC-39):** (a); retrieval time not shown. Confirm at the CRP | Section 7, SCR-02 |
| OQ-09 | What does the day plan do when only LibreBooking, or only the Carbon Intensity API, is down? | DEC-21 covers the depot losing its connection, not one source failing | As section 7.3 | **Resolved (DEC-33):** section 7.3 as written | Section 7.3 |
| OQ-10 | Brand copy vs scope | Brand identity §2 and §4 describe the planner as telling volunteers when to charge, give band meanings such as "Best time to charge" and "Do not charge unless urgent", and show gCO₂/kWh values and "1pm". Workshop: bands only, no advice (OBS-1.3); DI-004: intensity not on the plan; brand §5: 24-hour times | (a) Band names only; update the brand identity. (b) Show the band meanings too | **Resolved (DEC-32):** (a). Brand identity updated (v0.2) | AC-01.5, brand identity |
| OQ-11 | How is the dark theme turned on? | `tokens.css` switches automatically when a device is in dark mode, which applies REQ-19 (Could) to every phone. The "depot wall display" isn't one of the NFR-02 devices | (a) Accept the automatic switch. (b) Dark only when chosen on the wall display | **Resolved (DEC-34):** (a); not tested at the pilot | REQ-19 |
| OQ-12 | Weekends and bank holidays | ASM-04 says weekdays; nothing says what the next staffed day is over a bank holiday, or what the plan shows on a Saturday | (a) Next weekday; bank holidays ignored; the pilot uses weekdays only. (b) Hold a list of closed days (a new store) | **Resolved (DEC-45):** (a), confirmed by Priya | BR-09, AC-03.6 |
| OQ-13 | Which bikes does the first slot on the phone timeline list? | REQ-04 lists "bikes changing state" under each half hour, which leaves the 07:00 slot undefined | (a) All bikes, with their starting state. (b) Only those that change during 07:00 | **Assumed (DEC-40):** (a). Confirm at the CRP | AC-04.2 |
| OQ-14 | Should a quarantined battery still fitted to a bike show on the bike? | DI-042: the day plan doesn't flag it; the bike record's composition (data dictionary §3.2) doesn't include Quarantined | (a) As documented: shown only on the battery. (b) Show "Quarantined" next to the fitted battery on the bike record | **Assumed (DEC-41):** (a). Confirm at the CRP | AC-13.3, BR-04 |
| OQ-15 | Keep the resource mismatch warning? | DI-032 (marked invented) says a bike with no matching resource shows out of service with a warning; no requirement covers it, but it addresses OBS-2.2 | (a) Keep it under REQ-02. (b) Drop it | **Assumed (DEC-42):** (a). Confirm at the CRP | AC-02.8, BR-12 |
| OQ-16 | Product and screen names | Brand identity calls the product "the charging planner"; the analysis calls it "day planner and fleet records" | Product "Charging planner"; screens "Day plan" and "Fleet" | **Resolved (DEC-35):** product "Charging planner"; screens "Day plan" and "Fleet" | Section 6 |
| OQ-17 | Do NFR-01 to NFR-07 need to pass for the pilot? | Your brief for section 9 names Musts and scenarios only | (a) Yes. (b) Score them, but don't block | **Resolved (DEC-31):** (a). Extended to NFR-08 to NFR-20 by DEC-52 | Section 9 |
| OQ-18 | Depot postcode | ASM-03 is open: OX4 (Cowley) now, OX3 earlier; same region | Use OX4 | **Resolved (DEC-44):** OX4, confirmed by Priya | Section 7.2 |
| OQ-19 | Is a list of all batteries with their locations part of REQ-08? | REQ-08 says "show each battery's location"; the stock check measure (section 8) needs all 26 at once | (a) Yes, on the fleet list. (b) Location on each battery's record only | **Assumed (DEC-43):** (a). Confirm at the CRP | AC-08.5, SCR-04 |

### 10.4 Decisions taken while drafting

Answered by Rob on 12 November 2026 while this PRD, the CRP script and the technical note were drafted, and logged in the decision log (v0.6 to v1.3). DEC-23, DEC-24 and DEC-30 are to be confirmed with Priya, Dave and Lewis at the CRP.

| ID | Open question | Decision | Carried into |
|----|----------|------------|---------------------------|
| DEC-23 | OQ-01 | A bike is overdue only once its due time has passed. Until then, slots after the reservation ends read "In the workshop", as if it comes back on time. Refines DEC-16 rule 4 | DFDs v0.8 §5; data dictionary v0.4 DI-035, DI-043, OI-19; measurement plan v0.3 §6.2 |
| DEC-24 | OQ-02 | The tool also reads reservations that started before today and are either still running or not checked in. Extends DEC-17's read window | DFDs v0.8 §2, §5, §7, §8; data dictionary v0.4 DF-01, DI-029, DI-030, OI-01; measurement plan v0.3 §6.2. Workshop notes v1.1 (§7 and §13 notes). The stand-in synthesises the data (DEC-27); Lewis confirms the real API before go-live (A-05) |
| DEC-25 | OQ-03 | A scenario runs cleanly when every step that tests a Must passes. Should and Could steps are scored separately and don't block | Measurement plan v0.3 §6.1; CRP script v1.0 |
| DEC-26 | OQ-04 | The demo uses a demo clock in the LibreBooking stand-in, and recorded forecasts loaded into D1 for the scenario dates; the live API otherwise. This is demo set-up, not a staff feature | DFDs v0.8 §5, §8; data dictionary v0.4 §1, DI-006, DI-033, DF-02; measurement plan v0.3 §6.1, §8; CRP script v1.0; technical note v0.3 §5 |
| DEC-27 | – | The LibreBooking stand-in synthesises its data, including data the real API isn't yet known to supply; Lewis confirms before go-live | Decision log v0.7; workshop notes v1.1; data dictionary v0.5 OI-01; DFDs v0.8 §8; this PRD §7.1, §10.1, §10.2 |
| DEC-28 | – | S9 and S14 score Partial on any build that can't be set to the scenario date | Measurement plan v0.4 §6.1, §8; this PRD §9 |
| DEC-29 | CRP script CRP-OQ-02 | Every route's build is run against the same stand-in, demo clock and recorded forecasts at the CRP, as test equipment rather than part of the build | Decision log v0.8; measurement plan v0.5 §5.1, §6.1, §8; CRP script v1.0; this PRD §9 |
| DEC-31 to DEC-35 | OQ-17, OQ-10, OQ-09, OQ-11, OQ-16 | Agreed: NFRs block readiness; bands only (brand identity v0.2 updated); §7.3 as written; dark theme follows the device; product "Charging planner" | Decision log v1.0; this PRD §5, §6, §7.3, §9, AC-01.5, AC-19.1 |
| DEC-44, DEC-45 | OQ-18, OQ-12 | Confirmed by Priya: depot postcode OX4 (South England); next staffed day is the next weekday, bank holidays not skipped | Decision log v1.1; this PRD §7.2, BR-09, AC-03.6, ASM-03 |
| DEC-36 to DEC-43 | OQ-05 to OQ-08, OQ-13, OQ-14, OQ-15, OQ-19 | Assumed: the working assumptions in §10.3, which the build follows. To confirm at the CRP | Decision log v1.0; CRP script §10.3 |
| DEC-30 | CRP script CRP-OQ-05 | BR-01 rules 3 and 4 judge "checked in" against each slot's end, so after a late check-in the slots between the due time and the check-in still read overdue | Decision log v0.9; DFDs v0.9 §5; data dictionary v0.6 DI-035, OI-19; this PRD BR-01; CRP script v1.0 S11.08 |
| DEC-47 to DEC-53 | Technical note TQ-01 to TQ-09 | Agreed: Astro inside the personal site on Vercel with hosted Supabase; pg_cron for process 1; deployment protection for the CRP and a public demo that saves nothing; AdminLTE 4 themed from the tokens; fonts through Astro's Fonts API; NFR-08 to NFR-20 confirmed (NFR-12 from go-live); Cowley fine on the public site | Decision log v1.3; technical note v0.3; this PRD CON-01, CON-05, §5.2, §5.3, §9, RSK-07; brand identity v0.3 |

Decisions DEC-54 to DEC-61 (decision log v1.5) are about how the build and the experiment are set up. They change no requirement here; they're carried into the technical note, measurement plan and CRP script.

---

## 11. Traceability matrix

| Requirement | MoSCoW | Process | Decisions | Data items and flows | Scenarios | Rules |
|-------------|--------|---------|-----------|----------------------|-----------|-------|
| REQ-01 | Must | 1, 2 | DEC-13, DEC-15, DEC-21 | DI-001, DI-003–006, DI-033, DI-034; DF-02, DF-11, DF-12, DF-03 | S1, S9, S14 | BR-08, BR-09, BR-10 |
| REQ-02 | Must | 2 | DEC-01, DEC-16, DEC-18, DEC-23, DEC-24, DEC-30 | DI-008, DI-029–032, DI-035; DF-01, DF-13, DF-03 | S2, S5, S11, S13 | BR-01, BR-08, BR-12 |
| REQ-03 | Must | 2 | DEC-17 | DI-029, DI-041; DF-01, DF-03 | S2, S3 | BR-03, BR-09 |
| REQ-04 | Must | 2 | DEC-15 | DI-034, DI-035; DF-03 | S1 | BR-01, BR-10 |
| REQ-05 | Must | 3.4 | DEC-07, DEC-09, DEC-14, DEC-19, DEC-20 | DI-007–028, DI-036–040; DF-10, DF-22, DF-23 | S7, S12 | BR-02, BR-07, BR-11 |
| REQ-06 | Must | 3.1 | DEC-01, DEC-08, DEC-09, DEC-11, DEC-19 | DI-007–019, DI-038, DI-039; DF-04, DF-18, DF-26 | S10 | BR-11 |
| REQ-07 | Must | 3.2 | DEC-06, DEC-18, DEC-19, DEC-20 | DI-007, DI-014, DI-020, DI-025, DI-037; DF-05, DF-19 | S4 | BR-02, BR-11 |
| REQ-08 | Must | 3.2, 3.4 | DEC-09, DEC-20 | DI-007, DI-036, DI-040; DF-05, DF-19, DF-22, DF-10 | S4, S12 | BR-02, BR-06 |
| REQ-09 | Must | 3.3 | DEC-02, DEC-03, DEC-09, DEC-14 | DI-021–028, DI-037; DF-06–09, DF-20, DF-21 | S5, S6, S12 | BR-07, BR-11 |
| REQ-10 | Must | 3.1–3.3 | DEC-11, DEC-19 | DI-025, DI-028, DI-037–039; DF-04–09 | S4, S5 | BR-11 |
| REQ-11 | Must | 3.2 | DEC-06, DEC-09, DEC-14 | DI-036; DF-25 | S12 | BR-06, BR-07 |
| REQ-12 | Should | 2 | DEC-15, DEC-21 | DF-03 | S8 | BR-01, BR-10 |
| REQ-13 | Should | 2 | DEC-02 | DI-042; DF-24 | S5 | BR-04 |
| REQ-14 | Should | 3.1, 3.3 | DEC-07 | DI-018; DF-04, DF-09 | S6 | BR-11 |
| REQ-15 | Should | 2 | DEC-16 | DI-043; DF-01 | S11 | BR-05 |
| REQ-16 | Should | – | – | – | S2 | – |
| REQ-17 | Could | 2 | DEC-21 | DF-03 | S8 | – |
| REQ-18 | Could | 3.1 | – | DI-007, DI-014; DF-26 | S10 | – |
| REQ-19 | Could | 2 | – | – | – | – |
| REQ-20 | Won't now; Must at go-live | 3.1, 3.3 | DEC-22 | Normalisation §10 | – | – |
| NFR-01 | – | 3.2 | DEC-18 | DF-05 | S4 | – |
| NFR-06 | – | 2 | – | DI-001, DI-034 | S14 | BR-08 |
| NFR-13 | – | – | DEC-49 | – | – | – |
| NFR-14 | – | 1, 2, 3.1–3.3 | DEC-26, DEC-52, DEC-59 | DI-020, DI-033, DI-037, DI-039 | S4, S9, S14 | BR-08 |

---

## Appendix A. Sample data for the acceptance criteria (invented)

All of this is **(invented)**. It extends the examples in the data dictionary and normalisation, and should become the stand-in's fixture data and the CRP script's starting state. Each criterion's Given overrides this where it says so. The CRP script's fixtures (`test-data/`) load this data and extend it only where a step needs it.

### A.1 Dates

| Date | Use |
|------|-----|
| Tue 16 June 2026 | Main demo day (S1–S8, S10–S13); next staffed day Wed 17 June |
| Fri 19 June 2026 | AC-03.6; next staffed day Mon 22 June |
| Tue 8 December 2026 | S9 |
| Mon 30 March 2026 (BST) and Mon 26 October 2026 (GMT) | S14 |

### A.2 Fleet

- **Bikes:** M01–M09 Raleigh Motus Grand Tour; M10–M12 Raleigh Motus; G01–G06 Tern GSD Gen 3 (no frame size). Each has a LibreBooking resource ID.
- **Battery types:** Bosch PowerTube 500 (500 Wh), Bosch PowerPack 400 (400 Wh), Bosch PowerPack 500 (500 Wh).
- **Batteries:** B-01 to B-26; 18 fitted, 8 on the shelf. Named fittings: B-01 in M01, B-05 in M05, B-07 in M07 (PowerTube 500, bought 2023-03-14, 301 cycles), B-09 in M04, B-14 in G01 (156 cycles). On the shelf: B-17 (PowerPack 500, bought 2025-02-03, 22 cycles) and seven others. B-10 has no Bosch serial; B-18 has no cycle count.

### A.3 Entries (D3)

| Entry ID | Type | Date | Asset | Description | Cleared |
|----------|------|------|-------|-------------|---------|
| 1031 | dealer service | 2026-04-21 | M07 | Interim: brake bleed, new chain | – |
| 1040 | service check | 2026-06-11 | M07 | Weekly check: OK | – |
| 1043 | fault | 2026-06-09 | M07 | Rear light flickers | Open |
| 1044 | fault | 2026-06-12 | B-09 | Swollen – do not charge or fit | Open |

M07 was last updated by Priya Shah at 2026-06-10 14:03.

### A.4 LibreBooking stand-in, Tue 16 June 2026

- **Resource status:** G02 unavailable (after S5's step in LibreBooking); G05 hidden; all others available.
- **Reservations:**

| Bike | Reservation | Checked in |
|------|-------------|-----------|
| M01 | 09:00–12:00; 14:00–16:30 | – |
| M02 | 09:00–11:00; 14:00–16:00 | – |
| M03 | 08:00–10:00; Wed 17 June 13:00–16:00 | 10:00 |
| M04 | 14:00–16:30 | – |
| M05 | 08:00–12:00 | 10:15 |
| M06 | 12:00–15:30; Wed 17 June 09:00–12:00 | 15:30 |
| M08 | Mon 15 June 14:00–16:30 | – |
| G04 | Mon 15 June 09:00 – Wed 17 June 16:30 | – |
| M09 | Thu 18 June 09:00–12:00 only | – |
| M10 | 07:30–12:30 | – |
| M11 | 07:30–12:00 | – |

Further reservations bring the bikes booked today to 12 (S1).

- **Fri 19 June 2026:** G03 has no reservation that day; next reservation Mon 22 June 09:00.

### A.5 Forecast (D1, South England region)

| Day | Local slots and bands |
|-----|-----------------------|
| Tue 16 June 2026 | 07:00–09:30 moderate; 10:00–11:30 low; 12:00–13:30 very low; 14:00–15:30 low; 16:00 moderate |
| Tue 8 December 2026 | 07:00–08:30 high; 09:00–14:30 moderate; 15:00–16:00 very high |
| Clock change (both Mondays) | Stored in UTC: periods starting 06:00Z and 06:30Z very low; from 07:00Z moderate. In BST (30 March) the 07:00 and 07:30 local slots are very low; in GMT (26 October) 07:00 local is moderate |

### A.6 Staff names

Priya Shah, Dave Morgan, Aisha Bello, Sam Patel, Lewis Chen.

---

## Change history

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 12 November 2026 | First draft from workshop notes v1.0, decision log v0.5, DFDs v0.7, data dictionary v0.3, normalisation v0.3, brand identity v0.1 and measurement plan v0.2. Open questions OQ-01 to OQ-19 raised |
| 0.2 | 12 November 2026 | OQ-01 to OQ-04 resolved by Rob (RES-01 to RES-04): overdue only once the due time passes; earlier unreturned and multi-day reservations read; pilot bar is Must steps; demo clock and recorded forecasts. AC-02.10 and G04 sample loan added |
| 0.3 | 12 November 2026 | Resolutions logged as DEC-23 to DEC-26 (decision log v0.6) and cited by those IDs; related documents updated to DFDs v0.8, data dictionary v0.4 and measurement plan v0.3 |
| 0.4 | 12 November 2026 | DEC-27 (synthetic stand-in data) and DEC-28 (S9 and S14 scored Partial where a build can't be set to the date) applied: §7.1, §9, ASM-02, RSK-01, §10.4. Related versions updated |
| 0.5 | 12 November 2026 | From the CRP script v1.0: BR-01 rules 3 and 4 refined by DEC-30 (late check-ins); AC-04.3 wording corrected (M11 from 12:00, M10 from 12:30); AC-04.4 notes how its Should parts are scored; NFR-04's test counts only the tool's requests; §9 adds DEC-29; §10.4 adds DEC-29 and DEC-30. Related versions updated |
| 0.6 | 12 November 2026 | OQ-09, OQ-10, OQ-11, OQ-16 and OQ-17 resolved (DEC-31 to DEC-35) and their tags removed; OQ-05 to OQ-08, OQ-13 to OQ-15 and OQ-19 logged as assumed decisions (DEC-36 to DEC-43), to confirm at the CRP; OQ-12 and OQ-18 wait for Priya |
| 0.7 | 12 November 2026 | OQ-18 and OQ-12 confirmed by Priya (DEC-44, DEC-45): OX4, and the next weekday with bank holidays not skipped. Tags removed from §7.2, BR-09 and AC-03.6; ASM-03 confirmed. Brand identity v0.2 referenced; handbook URL for the proof of concept added to AC-16.1 **(invented)** |
| 0.8 | 12 November 2026 | Technical note v0.3 applied (DEC-47 to DEC-53): CON-01 and CON-05 updated; NFR-08 to NFR-13 agreed (§5.2), with NFR-13's access control set and NFR-12 from go-live; NFR-14 to NFR-20 added (§5.3); §9 item 3 now covers NFR-01 to NFR-11 and NFR-13 to NFR-20; RSK-07 mitigation updated; §10.4 and traceability rows added. Related versions updated. Later the same day: references to other documents updated, a note on DEC-54 to DEC-61 added to §10.4, and DEC-59 added to NFR-14's trace; no requirement changed |
