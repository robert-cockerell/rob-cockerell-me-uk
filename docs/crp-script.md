# Conference room pilot script – Charging planner

**Project:** Community e-bike library – day planner and fleet records (proof of concept)
**Document:** `docs/crp-script.md` (project copy `claude/crp-script.md`)
**Status:** v1.3, baselined (12 November 2026). Written for action A-08. All script questions (CRP-OQ-01 to CRP-OQ-09) answered by Rob. PRD open questions are now logged decisions (DEC-31 to DEC-43); the eight assumed ones are confirmed with the team at the end of the pilot (§10.3). OQ-12 and OQ-18 confirmed by Priya (DEC-45, DEC-44). v1.3: NFR-08 to NFR-11 and NFR-13 to NFR-20 added to the pass bar and the checks (DEC-52); the CRP runs on a protected Vercel preview deployment (CON-01, DEC-49)
**Owner:** Rob (facilitator)
**Inputs:** `docs/prd.md` v0.8, `docs/analysis/workshop-1/notes.md` v1.1, `docs/analysis/01-workshop-plan.md` v0.5 (Activity 6), `docs/analysis/decision-log.md` v1.5, `docs/analysis/data-dictionary.md` v0.6, `docs/analysis/dfds.md` v0.9, `docs/technical-note.md` v0.8, `docs/article/measurement-plan.md` v0.9
**Test data:** `test-data/*.csv` (§3.2)

> **Fictional example.** Greener Miles, its people, fleet and data are invented for an article and demo. Detail first added in this script or its test data is marked **(invented)**.

---

## How to read this script

- Requirements, criteria, rules and data items are referenced by ID (REQ-nn, AC-nn.n, BR-nn, NFR-nn, DEC-nn, DI-nnn). Their wording is in the PRD and data dictionary and isn't repeated here.
- Steps are numbered by scenario: S4.03 is step 3 of scenario 4. Set-up steps are SU.nn and cross-cutting checks X-nn.
- **MoSCoW** on each step is the priority of the requirement it tests. Must steps decide whether a scenario runs cleanly; Should and Could steps are scored separately (DEC-25). A dash (–) means a set-up action that isn't scored. "Obs." is an observation for the notes, not scored.
- **Result** takes Pass, Partial, Fail or Not run (§8.1).
- **Where** is one of: Tool (on the named device), Stand-in (the LibreBooking stand-in's controls), Clock (the demo clock), Fixtures (loading or resetting data), Paper.
- Expected results are the same for all three routes. Routes B and C are run against the same stand-in, demo clock and recorded forecasts as route A, lent as test equipment (DEC-29).
- Where a step depends on a PRD open question that still has only a working assumption (OQ-05 to OQ-19), the step names it, and the expected result uses the working assumption. PRD §9 says these criteria are updated before scoring.

---

## 1. Purpose and scope

### 1.1 What the pilot proves

That the build does what the users agreed at workshop 1, on the sample data, before it goes near real data:

1. Staff can read the day at a glance on a phone: each bike's state and next booking, beside the forecast bands, without the tool telling them what to charge (REQ-01 to REQ-04).
2. Fleet records replace the four spreadsheets and always say where every battery is, who changed what and when (REQ-05 to REQ-11).
3. The decision traps found by the analysis are handled (measurement plan §6.2).
4. The same script scores all three routes in the measurement plan.

It also gives staff a first go with the tool, and confirms DEC-23 and DEC-24 with Priya, Dave and Lewis (decision log, status note).

### 1.2 Pass bar

The build is ready for the pilot when all of PRD §9 holds:

| # | Condition | Where it's checked |
|---|-----------|--------------------|
| 1 | Every Must criterion (AC-01.1 to AC-11.5) passes | §7, §8.3 |
| 2 | S1 to S14 run cleanly: every **Must** step passes. Should and Could steps (REQ-12 to REQ-18) are scored separately and don't block (DEC-25) | §5, §8.1 |
| 3 | NFR-01 to NFR-11 and NFR-13 to NFR-20 pass their tests (DEC-31, DEC-52). NFR-12 applies from go-live | §6.1, §8.4 |
| 4 | Every decision trap is handled as "a correct build" describes | §6.2, §8.5 |
| 5 | The stand-in, demo clock and recorded forecasts reset to the starting data between scenarios | §3.4, every reset |

S8 has only Should and Could steps, so it runs cleanly by definition; its steps are still scored. On any build that can't be set to the scenario date, S9 and S14 score Partial (DEC-28), so they can't run cleanly on that build.

### 1.3 Out of scope

- Members, bookings, payments, check-out, check-in and availability. Testers change these only in the stand-in, never in the tool (DEC-01, DEC-18).
- REQ-19 (dark theme): not tested at the pilot (DEC-34). REQ-20 (import): not built for the pilot (DEC-22).
- NFR-12 (backup): applies from go-live, so it isn't tested here (DEC-52).
- The live Carbon Intensity API and the real LibreBooking API. Scenario dates use recorded forecasts and the stand-in (DEC-26, DEC-27). Whether the real API can supply what the stand-in synthesises is for Lewis under A-05, before go-live.
- How routes B and C were built; the script only scores the result. For the pilot, B and C are pointed at the same stand-in, demo clock and recorded forecasts as route A. These are test equipment, not part of their build (DEC-29). A build that can't take the demo date still scores S9 and S14 Partial (DEC-28).
- Tech stack. The fixtures are CSV files any build can load.

---

## 2. Roles

| Role | Played by | Does |
|------|-----------|------|
| Facilitator | Rob | Runs the script and keeps time. Operates the demo clock, loads fixtures, applies overrides and resets (§3.4). Reads each story aloud. Inspects stored data for the traps that can't be seen on screen (SU.04). Calls Pass, Partial or Fail with the scribe |
| Scribe | To be named | Records results and notes on the score sheet, logs defects (§9), times AC-05.7 with a stopwatch, counts taps for NFR-01, collects interface text for NFR-07, times screens for NFR-08 |
| Priya Shah, coordinator | A tester (to be named) | Fleet records, dealer services, printing; sets resource status in the stand-in |
| Dave Morgan, experienced volunteer | A tester (to be named) | Day plan, battery swaps; checks bikes in in the stand-in |
| Aisha Bello, newer volunteer | A tester (to be named) | First-time use, adding batteries, a one-handed swap |
| Sam Patel, volunteer mechanic | A tester (to be named) | Faults, service checks, battery removal; uses the depot tablet |
| Lewis Chen, booking system admin (optional observer) | Lewis, or a tester | Confirms the stand-in behaves like LibreBooking (DEC-24, DEC-27) |

**Who operates what**

- **Demo clock:** the facilitator only. It's demo set-up, not a staff feature (DEC-26).
- **Stand-in:** testers make the LibreBooking actions their persona would make (check-ins, resource status), on the stand-in console. The facilitator loads, resets and overrides its data and reads its request log.
- **Tool:** testers only, on their own device. Names in the PRD's criteria show the situation, not a permission (PRD §1.3); where a different tester does a step, the step says so, and only criteria that check Recorded by depend on who does it.

---

## 3. Set-up and reset

### 3.1 Devices and screen sizes

Sizes are NFR-02's **(invented sizes)**. If a real phone isn't the listed size, use a desktop browser's responsive mode at that size.

| ID | Device | Size (CSS px) | Used by | Name remembered at start |
|----|--------|---------------|---------|--------------------------|
| DEV-1 | Dave's phone, held upright | 390 × 844 | Dave | Dave Morgan |
| DEV-2 | Aisha's phone, held upright | 360 × 740 | Aisha | None (AC-10.1) |
| DEV-3 | Priya's phone, held upright | 430 × 932 | Priya | Priya Shah |
| DEV-4 | Depot tablet, landscape | 1024 × 768 | Sam | Dave Morgan (AC-10.3) |
| DEV-5 | Desk laptop, browser window, with an A4 printer **(invented)** | 1366 × 1024 | Priya (printing); facilitator (§6) | None |
| DEV-6 | Stand-in console: stand-in controls, request log and demo clock **(invented)** | Any | Testers (stand-in actions); facilitator (clock, fixtures) | Not used for the tool |

The tool runs on the CRP's Vercel preview deployment, over HTTPS and behind Vercel's deployment protection (CON-01, DEC-49, NFR-15). Every device's access is set up before the session. DEV-6 isn't used to open the tool. For routes B and C, the stand-in runs from the test equipment's own deployment (technical note §7).

### 3.2 Test data

Every file is in `test-data/`, UTF-8 CSV with a header row. Column names are data dictionary names in snake case. Formats follow the data dictionary §1: dates `YYYY-MM-DD`; local date-times `YYYY-MM-DD HH:MM` (Europe/London); forecast period starts `YYYY-MM-DDTHH:MMZ` in UTC as the API supplies them. All values are **(invented)**; the `source` column, where there is one, says whether a row comes from PRD Appendix A or was added for a named criterion.

| File | Loads into | Contents | Beyond PRD Appendix A |
|------|-----------|----------|-----------------------|
| `battery-types.csv` | D2 Battery type | The three types in A.2 | Capacities as A.2 |
| `bikes.csv` | D2 Bike | M01–M12, G01–G06 (A.2) with resource IDs 101–118 | Serials, purchase dates, frame sizes and change stamps. M07's stamp is A.3's |
| `batteries.csv` | D2 Battery | B-01 to B-26 (A.2) | Types, serials, dates and cycle counts for the batteries A.2 doesn't name. B-10 has no Bosch serial and B-18 no cycle count, as A.2 |
| `fittings.csv` | D2 Fitting | The 18 current fittings (A.2's named ones plus 13 more); 8 batteries on the shelf | Which battery is in which unnamed bike. No earlier fitting history |
| `entries.csv` | D3 | A.3's four entries | **1039** (M07 fault, cleared) for AC-05.2 (same-date order) and AC-05.4 (a closed fault). Recorded at times for all |
| `forecasts.csv` | D1 | A.5 for the four scenario dates, South England (PRD OQ-18), in UTC. No period end (DEC-13). Retrieved at is stamped by the loader (DI-006) | Intensity figures (stored, never shown, AC-01.5). Clock-change days run 06:00Z to 16:00Z so both local days are covered |
| `lb-resources.csv` | Stand-in resources | Every bike resource and its status: G05 hidden, the rest available (A.4). G02 starts available; S5 makes it unavailable | **Resource 119** for G07, added in S10 (AC-06.1) |
| `lb-reservations.csv` | Stand-in reservations | Set `main`: A.4 for Mon 15 to Thu 18 June. Set `fri-19`: G03's Mon 22 June booking (AC-03.6). `checked_in_at` is blank: check-ins are added as events (below) | **R-16 to R-18** (G01, G03, G06 today) bring the bikes booked today to 12 (S1). **R-19** (M07, Wed) for AC-06.4. **R-20** (M08, Wed) for AC-15.2. R-21's end time |
| `stand-in-events.csv` | Stand-in, during scenarios | Check-ins and status changes testers make, with the demo time | E-03 (M02's 11:45 check-in, AC-15.3), E-05 and E-06 (AC-02.7), E-08 (S12) |
| `demo-clock.csv` | Clock | Every clock setting, in run order | Times for steps the PRD doesn't time |
| `resets-and-overrides.csv` | Fixtures | Each reset and fixture change, and the step it comes before | All |
| `tester-inputs.csv` | – | What testers type, by step | Values the PRD doesn't give |
| `validation-cases.csv` | – | Invalid inputs and expected refusals for AC-06.2, AC-07.3, AC-09.3, AC-09.6 and AC-14.3 | All |

**Why check-ins are events, not preloaded.** A.4 lists check-ins at 10:00, 10:15 and 15:30. The demo day starts at 07:00, when none of them has happened. Preloading them would show M03, M05 and M06 as back hours early. So the reservations load with no check-ins, and testers check each bike in on the stand-in at the time A.4 gives, as PRD §7.1 item 3 allows.

**Who's in the 12 bikes booked today (S1).** M01–M06, M10, M11, G01, G03 and G06 have reservations starting today; G04 is on a multi-day loan running through today. M08 (overdue from Monday), M07 (Wed only) and M09 (Thu only) aren't counted.

### 3.3 Set-up steps

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| SU.01 | Facilitator | Open the build's CRP deployment and the stand-in. For routes B and C, point the build at the stand-in, the demo clock and the recorded forecasts (DEC-29) | – | Both running; the build reads bookings from the stand-in and today from the demo clock; the tool's address starts `https://` | CON-01, NFR-15 | – | | Record anything a B or C build can't connect to |
| SU.02 | Facilitator | Connect DEV-1 to DEV-5; set sizes as §3.1 | – | Each device opens the tool's address | NFR-02 | – | | |
| SU.03 | Each tester | Open the tool on your device | Tool, DEV-1 to DEV-5 | No password or login screen on any device | AC-10.6, NFR-05 | Must | | The deployment protection isn't a login in the tool (NFR-13) |
| SU.04 | Facilitator | Inspect the build's stored data or data model | Tool's data | No bike status held (DEC-01); no stored fault status (DEC-14); no stored period end in D1 (DEC-13) | Traps T-01, T-09, T-10 | – (trap) | | Recorded in §8.5 |
| SU.05 | Facilitator | Load the baseline, R0: battery types, bikes, batteries, fittings, entries, forecasts, then stand-in resources and reservation set `main`. No events | Fixtures | Loads without errors. Stand-in request log starts empty | §1.2 item 5 | – | | |
| SU.06 | Facilitator | Set the demo clock to Tue 16 June 2026 07:00 | Clock | Every device shows today as Tue 16 June 2026 | DEC-26 | – | | |
| SU.07 | Dave, Priya, facilitator | Pick names: DEV-1 "Dave Morgan", DEV-3 "Priya Shah", DEV-4 "Dave Morgan". Leave DEV-2 and DEV-5 with no name | Tool | Each device shows the picked name | REQ-10 (PRD OQ-06: name typed once) | – | | |
| SU.08 | Scribe | Prepare one copy of §5's step tables per route and round; stopwatch; tally for taps; a file for interface text (X-07) | Paper | Ready | – | – | | |
| SU.09 | Facilitator | Read the scope (§1) aloud | – | – | – | – | | |

### 3.4 Resetting

A **reset** returns everything to the baseline, with any override named in `resets-and-overrides.csv`:

1. Reload D2 and D3 from the fixtures, and D1 from `forecasts.csv`.
2. Reload the stand-in's resources and the named reservation set, and clear its events. **Keep the stand-in's request log**: NFR-04 reviews the whole run (X-04).
3. Set the demo clock as the reset says.
4. Leave device names alone (they're on the devices, not in the data, DEC-19).
5. Testers close and reopen the day plan (PRD OQ-08: the plan refreshes on opening).

Resets in this run: R1 (inside S4), R2 (before S12), R3 (before the other dates) and R3a (stand-in reservations only). Override O-01 changes one forecast period inside S1 and is undone at once.

**Demo clock.** If the build's demo clock runs on from the time set, stamps in expected results can be up to a few minutes later than the time given. That's a Pass.

---

## 4. Run order

| Order | Scenario | Demo date and time | Before it |
|-------|----------|--------------------|-----------|
| 1 | Set-up | Tue 16 June 07:00 | R0 |
| 2 | S1 Day at 07:00 | 07:00 | – (O-01 inside) |
| 3 | S8 Print and offline | 07:05–08:00 | – |
| 4 | S4 Battery swap | 08:05 | – (R1 inside) |
| 5 | S7 Standing next to M07 | 09:15 | – |
| 6 | S10 New batteries and a new bike | 09:30 | – |
| 7 | S2 Back at 10:00, booked tomorrow | 10:00 | – |
| 8 | S13 Early return | 10:15–10:45 | – |
| 9 | S11 Overdue at 11:30 | 11:30–11:45 | – |
| 10 | S5 Brake fault, Tuesday part | 12:00–12:25 | – |
| 11 | S3 Back at 15:30, booked tomorrow | 15:30 | – |
| 12 | S6 Dealer service | 16:12 | – |
| 13 | S5 Brake fault, Wednesday part | Wed 17 June 09:00 | – |
| 14 | S12 Swollen battery | Tue 16 June 16:20 | R2 |
| 15 | S3 continued (AC-03.6) | Fri 19 June 09:00 | R3 |
| 16 | S14 Clock change | Mon 30 March 09:00, then Mon 26 October 09:00 | R3a |
| 17 | S9 December day | Tue 8 December 07:00 | – |
| 18 | Cross-cutting checks (§6) | Any | – |
| 19 | Confirm decisions with the team (§10.3) | – | – |

**Why this order**

- **One day, in clock order.** S1 to S6 run on 16 June in the order of their times, so the stand-in builds up like a real day: M03 is checked in at 10:00 (S2), M05 at 10:15 (S13), M02 at 11:45 (S11), G02 goes unavailable at 12:10 (S5), M06 is checked in at 15:30 (S3). Each scenario starts where the last left off, with no reset.
- **Fleet changes don't collide.** Each scenario changes different records, so they can accumulate. The exceptions are ordered: S7 reads M07's change stamp (AC-05.6) before S10 overwrites it (AC-06.4); S7 reads M07's last service before S6 adds a dealer service; S4 checks the battery list of 26 (AC-08.5) before S10 adds two; Aisha's first change is in S10 (AC-10.1), before her swap in S13 (NFR-01 needs a name already picked); M07's open fault is flagged (S5) before S6 clears it (AC-13.2).
- **Later dates go after the day.** S5's Wednesday step writes records dated 17 June, so nothing on 16 June runs after it until a reset.
- **S4 needs one reset inside it.** AC-07.1 and AC-07.2 need the same starting data. Part A runs AC-07.1 and two record-only tests (AC-07.5, AC-08.2) that would otherwise break later scenarios; R1 then restores the baseline for Part B (AC-07.2).
- **S12 needs its own start.** It starts from a baseline without fault 1044 (CRP-OQ-01, agreed), which can't be reached without a reset because the tool deletes nothing (ASM-10). So it goes after the day's other scenarios, with one reset.
- **Other dates last.** AC-03.6, S14 and S9 need different stand-in data, and S9 and S14 are scored the same way on every route (DEC-28). They run in date order after the March date, so records made in S14 are never dated after the clock.
- **Cross-cutting checks after the scenarios.** X-16 to X-20 change data or the build's settings, so they run last.

Total: three full resets (R1, R2, R3), one stand-in reload (R3a) and one forecast override (O-01). Timing about 3 hours 30 minutes including a break after S10, plus about 30 minutes for the cross-cutting checks X-08 to X-20 and 20 minutes to confirm decisions at the end **(invented)**.

---

## 5. Scenarios

Each table is one sheet for the scribe. Copy it for each route and round.

### S1 – The day at 07:00

**Story (workshop plan, Activity 6):** 07:00 on a Tuesday in June. Dave opens the day planner: 12 bikes booked, the greenest band 12:00–14:00. Workshop outcome: validated; the bands and the bikes back over lunch are visible at 07:00.
**Played by:** Dave (DEV-1). **Date and time:** Tue 16 June 2026, 07:00.
**Starting state:** R0 (SU.05). No check-ins. G02 available, G05 hidden.
**Tests:** REQ-01, REQ-02, REQ-03, REQ-04 (PRD §9 lists REQ-01 and REQ-04; the other criteria are checked here because they're about the 07:00 plan).

**Expected day plan at 07:00** (BR-01, BR-03; "In the workshop" abbreviated to W, "Out on loan" to L)

| Bike | 07:00 slot | Changes in later slots | Next booking |
|------|------------|------------------------|--------------|
| M01 | W | 09:00 L, 12:00 W, 14:00 L | next out: 09:00 |
| M02 | W | 09:00 L, 11:00 W, 14:00 L, 16:00 W | next out: 09:00 |
| M03 | W | 08:00 L, 10:00 W | next out: 08:00 |
| M04 | W | 14:00 L | next out: 14:00 |
| M05 | W | 08:00 L, 12:00 W | next out: 08:00 |
| M06 | W | 12:00 L, 15:30 W | next out: 12:00 |
| M07 | W | – | next out: Wed 10:00 |
| M08 | Overdue – not checked in, due Mon 16:30 | – | next out: Wed 14:00 |
| M09 | W | – | No booking |
| M10 | W | 07:30 L, 12:30 W | next out: 07:30 |
| M11 | W | 07:30 L, 12:00 W | next out: 07:30 |
| M12 | W | – | No booking |
| G01 | W | 08:00 L, 13:00 W | next out: 08:00 |
| G02 | W | – | No booking |
| G03 | W | 09:30 L, 15:30 W | next out: 09:30 |
| G04 | L | – | No booking |
| G05 | Out of service | – | No booking |
| G06 | W | 10:00 L, 14:00 W | next out: 10:00 |

**Expected change list on the phone timeline** (AC-04.2, PRD OQ-13 working assumption): 07:30 M10, M11 · 08:00 M03, M05, G01 · 08:30 none · 09:00 M01, M02 · 09:30 G03 · 10:00 M03, G06 · 10:30 none · 11:00 M02 · 11:30 none · 12:00 M01, M05, M06, M11 · 12:30 M10 · 13:00 G01 · 13:30 none · 14:00 M01, M02, M04, G06 · 14:30 none · 15:00 none · 15:30 M06, G03 · 16:00 M02.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S1.01 | Dave | Open the day plan | Tool, DEV-1 | 19 slots, 07:00 to 16:00, and no others | AC-01.1 | Must | | |
| S1.02 | Dave | Read each slot's band | Tool, DEV-1 | Every slot shows its band as a coloured fill and the band name in text (brand identity §4): 07:00–09:30 moderate, 10:00–11:30 low, 12:00–13:30 very low, 14:00–15:30 low, 16:00 moderate | AC-01.2, AC-04.5, NFR-03 | Must | | |
| S1.03 | Dave | Scroll through the day, phone upright | Tool, DEV-1 | Slots run top to bottom 07:00 to 16:00; no sideways scrolling | AC-04.1, NFR-02 | Must | | |
| S1.04 | Dave | Read the 07:00 slot | Tool, DEV-1 | Lists all 18 bikes with the 07:00 states in the table above, including M08 "Overdue – not checked in" with "due Mon 16:30", M09 "In the workshop", G04 "Out on loan", G05 "Out of service" | AC-04.2, AC-02.5, AC-02.9, AC-02.10 | Must | | |
| S1.05 | Dave | Read each later slot | Tool, DEV-1 | Each lists only the bikes whose state changes, with the new state, as the change list above. Slots with no change list none | AC-04.2 (PRD OQ-13) | Must | | |
| S1.06 | Dave | Without leaving the screen, find the greenest slots and the bikes back over lunch | Tool, DEV-1 | 12:00–13:30 very low; M11 "In the workshop" from 12:00 and M10 from 12:30, not overdue | AC-04.3, AC-02.6 | Must | | See CRP-OQ-04 on AC-04.3's wording |
| S1.07 | Dave | Find M01 | Tool, DEV-1 | "Out on loan" in 09:00 to 11:30 | AC-02.2 | Must | | |
| S1.08 | Dave | Pick any bike on the timeline, and M09 | Tool, DEV-1 | Each bike's next booking is visible without leaving the day plan, as the table above; M09 "No booking" | AC-04.4 (next booking part), AC-03.4 | Must | | CRP-OQ-03 |
| S1.09 | Dave | Find M07 | Tool, DEV-1 | M07 carries an open fault flag (icon and text) without leaving the day plan; its state is unchanged | AC-04.4 (flag part), AC-13.1 | Should | | CRP-OQ-03 |
| S1.10 | Dave | Look for figures and advice | Tool, DEV-1 | Bands only: no gCO₂/kWh figures, and nothing says which battery to charge or when | AC-01.5 (PRD OQ-10), trap T-08 | Must | | |
| S1.11 | Dave | Say aloud what you'd charge and when | – | – | – | Obs. | | |
| S1.12 | Facilitator, then Dave | Apply O-01 (delete the 14:30Z period), then reopen the day plan | Fixtures, then Tool, DEV-1 | 15:30 reads "No forecast"; every other slot is unchanged | AC-01.3 | Must | | Do this before process 1 next runs, or pause it |
| S1.13 | Facilitator, then Dave | Apply O-01r (reload 16 June forecasts), reopen | Fixtures, then Tool | 15:30 reads "low" again | – | – | | |

### S8 – Print and offline

**Story (workshop plan):** At 07:00 the internet is down. The volunteer uses the plan printed that morning. **Workshop outcome:** changed: a print button, plus the last plan kept on the phone (DEC-21).
**Played by:** Dave (DEV-1), Sam (DEV-4), Priya (DEV-5). **Date and time:** Tue 16 June 2026, 07:05 to 08:00.
**Starting state:** as S1 ends.
**Tests:** REQ-12 (Should), REQ-17 (Could). No Must steps.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S8.01 | Facilitator, then Dave | Set the clock to 07:05. Dave opens the day plan | Clock, Tool DEV-1 | Plan loads | – | – | | |
| S8.02 | Sam | Open the day plan on the tablet | Tool, DEV-4 | A grid: one row per bike, one column per slot, each column headed by its time and band (name and colour), each cell the bike's state in text | AC-12.1 | Should | | |
| S8.03 | Priya | Press the print button; print in greyscale | Tool, DEV-5, Paper | One A4 landscape page **(invented)** with the plan date, every band name and every bike state in text; reads correctly in black and white | AC-12.2, NFR-03 (greyscale), NFR-02 (print) | Should | | Keep the print for X-03 |
| S8.04 | Priya | Read the print | Paper | Each bike's next booking and M07's open fault flag are on it | AC-12.3 (warning part is S11.04) | Should | | |
| S8.05 | Facilitator, then Dave | Set the clock to 08:00. Turn off DEV-1's network. Dave opens the day plan | Clock, Tool DEV-1 | The 07:05 plan, with a notice that it's the last loaded plan and loaded at 07:05 | AC-17.1 | Could | | |
| S8.06 | Facilitator, then Dave | Turn DEV-1's network back on. Dave opens the day plan | Tool, DEV-1 | A fresh plan replaces the stored one; the notice has gone | AC-17.2 | Could | | |
| S8.07 | Dave, Priya | Would you print on a normal day? | – | – | – | Obs. | | OBS-6.3 |

### S4 – Battery swap at the counter

**Story (workshop plan, changed by PRD OQ-05 working assumption):** Dave fits a charged spare battery, B-17, into a bike and records it on his phone. The card says M04; the working assumption is G01, because B-17 is a GSD battery. **Workshop outcome:** validated; swap from either end; the old battery shows on the shelf.
**Played by:** Dave (DEV-1), Priya (DEV-3). **Date and time:** Tue 16 June 2026, 08:05. G01's loan starts at 08:00, so this is the handover.
**Starting state:** as S8 ends (baseline fleet). G01 has B-14; B-17 on the shelf; B-09 fitted to M04 with open fault 1044.
**Tests:** REQ-07, REQ-08, REQ-10, REQ-05 (AC-05.3), REQ-11 (AC-11.4), NFR-01.

**Part A** tests the swap from the bike, then two record-only tests that are undone by R1. They aren't meant to be physically sensible (G01 is with its member).

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S4.00 | Facilitator | Set the clock to 08:05 | Clock | – | – | – | | |
| S4.01 | Dave | Open B-17's record, then B-09's | Tool, DEV-1 | B-17 shows "On the shelf" first, then its details and history. B-09 shows "Quarantined" first, although it's still fitted to M04 | AC-05.3, AC-08.3 | Must | | |
| S4.02 | Dave | Open G01 (B-14 fitted). Start a swap and pick B-17. Set the time to 08:10 (V-18) | Tool, DEV-1 | 08:10 isn't accepted: later than now | AC-07.3 | Must | | |
| S4.03 | Dave | Holding the phone in one hand, put the time back to the default and save. Scribe counts taps from G01's open record | Tool, DEV-1 | No warning. A fitting of B-17 to G01 with Fitted from 08:05, Recorded by "Dave Morgan", Recorded at 08:05. G01 shows B-17 fitted; B-14 shows "On the shelf". No more than 2 taps; controls at least 44 × 44 CSS px | AC-07.1 (PRD OQ-05), AC-07.3, AC-10.4, AC-11.4, NFR-01, NFR-14 | Must | | Taps: |
| S4.04 | Facilitator; Dave | Read the stand-in's request log since 08:05. Dave looks for check-out or check-in on G01 and the swap screen | Stand-in, Tool | No request from the tool creates, changes or deletes anything. The tool offers no check-out or check-in | AC-07.6, NFR-04, trap T-02 | Must | | |
| S4.05 | Dave | Open M04 and fit B-17 (record-only test) | Tool, DEV-1 | Saved with no compatibility or duplicate-fitting check or message. M04 shows B-17; G01 now reads "No battery fitted" (BR-02); B-09 still "Quarantined" | AC-07.5, AC-05.5 (no battery fitted) | Must | | |
| S4.06 | Dave | Open B-01, remove it from M01, set the time to 08:00 (V-19) (record-only test) | Tool, DEV-1 | 08:00 is accepted. A fitting of B-01 with no bike, Dave's name and the time. B-01 "On the shelf"; M01 "No battery fitted" | AC-08.2, AC-07.3 | Must | | |
| S4.07 | Facilitator | Reset R1. Clock stays 08:05 | Fixtures | Baseline restored: G01 has B-14, B-17 on the shelf, M01 has B-01 | §1.2 item 5 | – | | |

**Part B** tests the swap from the battery. Its result carries forward.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S4.08 | Dave | Holding the phone in one hand, open B-17 and fit it to G01. Scribe counts taps | Tool, DEV-1 | As S4.03: no warning; fitting of B-17 to G01, 08:05, "Dave Morgan"; G01 shows B-17; B-14 "On the shelf". No more than 2 taps | AC-07.2, AC-11.4, NFR-01 | Must | | Taps: |
| S4.09 | Priya | Open the battery list | Tool, DEV-3 | All 26 batteries, each with a location: B-17 "Fitted to G01"; B-09 "Quarantined"; B-14, B-18, B-21 to B-26 "On the shelf"; the other 16 "Fitted to" their bike as `fittings.csv` | AC-08.5 (PRD OQ-19), trap T-11 | Must | | |

### S7 – Standing next to M07

**Story (workshop plan):** Dave stands next to M07: "When was it last serviced, and how old is its battery?" **Workshop outcome:** validated; last service and battery shown first.
**Played by:** Dave (DEV-1). **Date and time:** Tue 16 June 2026, 09:15 **(invented)**.
**Starting state:** as S4 ends. M07 entries as `entries.csv`: 1031, 1039 (closed), 1040, 1043 (open). B-07 fitted.
**Tests:** REQ-05.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S7.00 | Facilitator | Set the clock to 09:15. Dave has the day plan open | Clock | – | – | – | | |
| S7.01 | Dave | Scribe asks "When was M07 last serviced?" and starts the stopwatch | Tool, DEV-1 | Dave answers correctly in under 30 seconds | AC-05.7 | Must | | Time: |
| S7.02 | Dave | Read the top of M07's record | Tool, DEV-1 | First: the last service, "Service check, 11 Jun 2026", labelled with its type (PRD OQ-07 working assumption b); and the fitted battery: B-07, Bosch PowerTube 500, bought 14 Mar 2023, 301 cycles | AC-05.1 | Must | | |
| S7.03 | Dave | Read the history | Tool, DEV-1 | Newest first by Entry date, then Entry ID: 1040 (11 Jun), 1039 (11 Jun), 1043 (9 Jun), 1031 (21 Apr) | AC-05.2 | Must | | Not in Entry ID order |
| S7.04 | Dave | Read the two faults | Tool, DEV-1 | 1043 reads "open". 1039 reads "closed", with Cleared date 11 Jun 2026 and Cleared by Sam Patel | AC-05.4, trap T-09 | Must | | |
| S7.05 | Dave | Find the change stamp | Tool, DEV-1 | "Last updated by Priya Shah, 10 Jun 2026 14:03" or equivalent | AC-05.6 | Must | | |
| S7.06 | Dave | Open G01, B-10 and B-18 | Tool, DEV-1 | G01 frame size "One size"; B-10 Bosch serial "Not recorded"; B-18 cycle count "Not yet read" | AC-05.5 | Must | | |

### S10 – New batteries, a new bike and a wrong resource ID

**Story (workshop plan):** Two new batteries arrive. Aisha adds them. **Workshop outcome:** validated, with an addition: suggest the next free tag. Priya's asset checks (AC-06.1 to AC-06.5, AC-02.8) are added here because S10 is the scenario for REQ-06.
**Played by:** Priya (DEV-3), Aisha (DEV-2). **Date and time:** Tue 16 June 2026, 09:30 **(invented)**.
**Starting state:** as S7 ends. DEV-2 has no name.
**Tests:** REQ-06, REQ-10, REQ-18 (Could), REQ-08 (AC-08.4), REQ-02 (AC-02.8).

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S10.00 | Facilitator | Set the clock to 09:30 | Clock | – | – | – | | |
| S10.01 | Priya | Add bike G07 (I-01 to I-07) | Tool, DEV-3 | Saved with Last updated by "Priya Shah" and Last updated at now; G07 is in the bike list | AC-06.1, AC-10.4 | Must | | |
| S10.02 | Priya | Try V-01 to V-11 in turn | Tool, DEV-3 | Each time nothing is saved and a message names the item to fix | AC-06.2 | Must | | |
| S10.03 | Priya | Start adding a Motus; note the tag offered; cancel | Tool, DEV-3 | M13 is suggested **(invented rule)** and can be changed | AC-18.2 | Could | | |
| S10.04 | Priya | Open the add and edit screens for a bike, a battery and a battery type | Tool, DEV-3 | No availability or status field and no delete action on any of them | AC-06.5, trap T-01 | Must | | |
| S10.05 | Priya | Add battery type "Bosch PowerPack 545" with no capacity (I-08, I-09) | Tool, DEV-3 | Saved | AC-06.3 | Must | | |
| S10.06 | Aisha | Start adding a battery; note the tag offered | Tool, DEV-2 | B-27 is suggested and can be changed | AC-18.1 | Could | | |
| S10.07 | Aisha | Open the battery type list, then add B-27 (I-11 to I-15) and save | Tool, DEV-2 | The list offers Bosch PowerPack 545. On saving, Aisha is asked to pick her name first (types "Aisha Bello", PRD OQ-06); B-27 is saved with Last updated by "Aisha Bello" | AC-06.3, AC-10.1, AC-06.6 | Must | | |
| S10.08 | Aisha | Add B-28 (I-16 to I-19) | Tool, DEV-2 | Not asked for a name again. Saved with "Aisha Bello". B-27 and B-28 both show "On the shelf" | AC-06.6 | Must | | |
| S10.09 | Aisha | Open B-28's record | Tool, DEV-2 | "On the shelf" (never fitted) | AC-08.4 | Must | | |
| S10.10 | Priya | Open Bosch PowerPack 545 | Tool, DEV-3 | Capacity "Not recorded" | AC-06.3 | Must | | |
| S10.11 | Priya | Change M12's resource ID to 199 (I-20); open the day plan; then change it back to 112 | Tool, DEV-3 | With 199: M12 reads "Out of service" in every slot with a warning that its resource ID doesn't match LibreBooking. With 112: M12 back to "In the workshop" | AC-02.8 (PRD OQ-15), BR-12 | Must | | Uses the tool to create the mismatch; see CRP-OQ-08 |
| S10.12 | Priya | Change M07's resource ID to 170 (I-21), as happened last month (OBS-2.2). Open the day plan. Correct it to 107. Open M07's record and the day plan | Tool, DEV-3 | M07's record shows 107, "Last updated by Priya Shah" and now. M07 is back on the day plan: "In the workshop", "next out: Wed 10:00" | AC-06.4, AC-10.4 | Must | | With 170, M07 should show as S10.11 |

Break **(invented)**.

### S2 – Back at 10:00, booked tomorrow

**Story (workshop plan):** A Motus comes back at 10:00 with two bars and isn't booked until tomorrow. The planner shows a green band at 13:00, so Dave waits. **Workshop outcome:** changed; needs the next booking; the bike shows as in the workshop from check-in.
**Played by:** Dave (DEV-1); Aisha (DEV-2) for the handbook link. **Date and time:** Tue 16 June 2026, 10:00.
**Starting state:** as S10 ends.
**Tests:** REQ-02, REQ-03, REQ-16 (Should).

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S2.01 | Facilitator, then Dave | Set the clock to 10:00. Dave checks M03 in on the stand-in (E-01) | Clock, Stand-in | Check-in recorded at 10:00 | – | – | | |
| S2.02 | Dave | Open the day plan; find M03 | Tool, DEV-1 | M03 "In the workshop" from the 09:30 slot onwards (BR-01 rule 2: checked in by the slot's end) and "next out: Wed 13:00" | AC-03.1, trap T-07 | Must | | CRP-OQ-05 (09:30) |
| S2.03 | Dave | Find M04 and M01 | Tool, DEV-1 | M04 "next out: 14:00". M01 "next out: 14:00", not 09:00 (that loan has started) | AC-03.2, AC-03.5 | Must | | |
| S2.04 | Dave | Decide whether to charge M03's battery now | Tool, DEV-1 | 12:00–13:30 "very low" is visible beside M03's next booking. The tool gives no advice | AC-01.5, trap T-08 | Must | | |
| S2.05 | Aisha | Follow the "Charging rules" link from the day plan | Tool, DEV-2 | The handbook page opens at the URL in PRD AC-16.1 **(invented)** | AC-16.1 | Should | | If the stand-in Google Doc doesn't exist, check the link goes to that address |
| S2.06 | Aisha | Look for a way to change the link | Tool, DEV-2 | None: one fixed URL held with the installation | AC-16.2 | Should | | |
| S2.07 | Dave, Aisha | Would you wait? Did you need the handbook? | – | – | – | Obs. | | OBS-6.1 |

### S13 – Early return, checked in at 10:15

**Story (workshop notes §10, new):** A bike returned early and checked in at 10:15 shows as in the workshop, not out on loan (DEC-16).
**Played by:** Dave (DEV-1); Aisha (DEV-2) for the swap. **Date and time:** Tue 16 June 2026, 10:15 to 10:45.
**Starting state:** as S2 ends.
**Tests:** REQ-02; also AC-07.4 and NFR-01 for Aisha, added here because M05 is back and M06 goes out at 12:00.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S13.01 | Facilitator, then Dave | Set the clock to 10:15. Dave checks M05 in on the stand-in (E-02) | Clock, Stand-in | Check-in recorded at 10:15 | – | – | | |
| S13.02 | Facilitator, then Dave | Set the clock to 10:30. Dave opens the day plan | Clock, Tool DEV-1 | M05 "Out on loan" 08:00 to 09:30 and "In the workshop" from 10:00, not "Out on loan" | AC-02.4, trap T-06 | Must | | |
| S13.03 | Facilitator, then Aisha | Set the clock to 10:45. Holding the phone in one hand, Aisha moves B-05 from M05 to M06, starting from either. Scribe counts taps | Clock, Tool DEV-2 | M06 shows B-05 fitted; M05 "No battery fitted"; B-06 "On the shelf". Recorded by "Aisha Bello". No more than 2 taps | AC-07.4, NFR-01 | Must | | Taps: . AC-07.4 names Dave; the result doesn't depend on who |

### S11 – Overdue at 11:30

**Story (workshop plan):** M02 was due back at 11:00. At 11:30 it hasn't been checked in, and the day plan shows it as overdue. **Workshop outcome:** validated with the revised label and due time, plus a warning if the bike is booked again today.
**Played by:** Priya (DEV-3, DEV-5); Dave checks M02 in. **Date and time:** Tue 16 June 2026, 11:30 to 11:45.
**Starting state:** as S13 ends.
**Tests:** REQ-02, REQ-15 (Should), REQ-12 (AC-12.3, Should).

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S11.00 | Facilitator | Set the clock to 11:30 | Clock | – | – | – | | |
| S11.01 | Priya | Open the day plan; find M02 | Tool, DEV-3 | "Overdue – not checked in" with "due 11:00" in the 11:00 and 11:30 slots (and through 13:30, OI-19); "Out on loan" 14:00 to 15:30 | AC-02.3, trap T-03 | Must | | |
| S11.02 | Priya | Look for a warning on M02 | Tool, DEV-3 | M02 carries a warning that it's booked again at 14:00 | AC-15.1 | Should | | |
| S11.03 | Priya | Is the warning visible from the timeline? | Tool, DEV-3 | Yes, beside M02, without leaving the day plan | AC-04.4 (warning part) | Should | | CRP-OQ-03 |
| S11.04 | Priya | Print the day plan | Tool DEV-5, Paper | M02's warning is on the print, with next bookings and M07's flag | AC-12.3 | Should | | |
| S11.05 | Priya | Find M08 | Tool, DEV-3 | M08 overdue (due Mon 16:30), "next out: Wed 14:00", and no booked-again warning | AC-15.2 | Should | | |
| S11.06 | Facilitator, then Dave | Set the clock to 11:45. Dave checks M02 in on the stand-in (E-03) | Clock, Stand-in | Check-in recorded at 11:45 | – | – | | |
| S11.07 | Priya | Reopen the day plan | Tool, DEV-3 | M02's warning has gone | AC-15.3 | Should | | |
| S11.08 | Priya | Read M02's states | Tool, DEV-3 | The 11:00 slot still reads "Overdue – not checked in", "due 11:00": M02 wasn't checked in by that slot's end (DEC-30). "In the workshop" from the 11:30 slot (BR-01 rule 2); "Out on loan" 14:00 to 15:30 | REQ-02, BR-01, DEC-30 | Must | | |

### S5 – Brake fault on a GSD

**Story (workshop plan):** Sam's return check finds a worn brake pad on a GSD. He logs the fault; Priya sets the bike to Unavailable in LibreBooking, and it shows as out of service on the day plan. Next day Sam fits new pads and clears the fault. **Workshop outcome:** validated, with an open fault flag on the day plan.
**Played by:** Sam (DEV-4), Priya (stand-in), Aisha (DEV-2, Wednesday). **Date and time:** Tue 16 June 2026, 12:00 to 12:25 **(invented)**; Wed 17 June 2026, 09:00 **(invented)**.
**Starting state:** as S11 ends. DEV-4 remembers "Dave Morgan". G02 available, no faults. M07 fault 1043 open; B-09 fault 1044 open and fitted to M04.
**Tests:** REQ-02, REQ-09, REQ-10, REQ-13 (Should).

From 12:01, M01 and M11 read overdue (due 12:00) and M01 carries a booked-again warning. That's expected from the data and not under test here.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S5.00 | Facilitator | Set the clock to 12:00 | Clock | – | – | – | | |
| S5.01 | Sam | The tablet shows "Dave Morgan". Change the name to "Sam Patel" (I-22) | Tool, DEV-4 | Tablet now shows "Sam Patel" | AC-10.3 | Must | | |
| S5.02 | Sam | Open G02; report the fault (I-23, I-24) | Tool, DEV-4 | Fault saved with Entry date 2026-06-16, no Cleared date, Recorded by "Sam Patel", Recorded at now. G02's record shows it as open | AC-09.1, AC-10.3, AC-10.4 | Must | | |
| S5.03 | Sam | Try V-12 to V-15 | Tool, DEV-4 | Each time nothing is saved and a message names the item. Entry date defaults to today | AC-09.6 | Must | | |
| S5.04 | Sam | Open the day plan; find G02 | Tool, DEV-4 | G02 isn't "Out of service" (its resource is still available) | AC-09.7, trap T-01 | Must | | |
| S5.05 | Sam | Find G02 and M07 | Tool, DEV-4 | Both carry an open fault flag with an icon and text; their states are unchanged | AC-13.1 | Should | | |
| S5.06 | Sam | Find M04 | Tool, DEV-4 | No fault flag, although its fitted battery B-09 is quarantined | AC-13.3 (PRD OQ-14) | Should | | |
| S5.07 | Priya, then Sam | Priya sets G02 Unavailable on the stand-in (E-04). Sam reopens the day plan | Stand-in, Tool DEV-4 | G02 and G05 read "Out of service" in every slot | AC-02.1 | Must | | |
| S5.08 | Sam | Open M03; record a service check (I-25) | Tool, DEV-4 | Service check saved with no Cleared date or Cleared by | AC-09.4 | Must | | AC-09.4 says "Thursday check"; the demo day is a Tuesday |
| S5.09 | Priya, then Sam | Priya sets M07 Unavailable (E-05). Sam reopens the day plan and looks for a way to change availability in the tool. Priya sets M07 available again (E-06) | Stand-in, Tool DEV-4 | M07 reads "Out of service" while unavailable, then "In the workshop" again. The tool has no way to set availability | AC-02.7, trap T-01 | Must | | Added check, CRP-OQ-08 |

**Pause S5 here.** Run S3.01 to S3.03 and S6 (run order §4), then come back for the Wednesday part.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S5.10 | Aisha, facilitator | Aisha closes her browser completely. Facilitator sets the clock to Wed 17 June 2026 09:00 | Tool DEV-2, Clock | – | – | – | | |
| S5.11 | Aisha | Reopen the tool. Report a fault on G06 (I-26) | Tool, DEV-2 | Not asked for a name. Saved with Recorded by "Aisha Bello" | AC-10.2 | Must | | Added check, CRP-OQ-08 |
| S5.12 | Sam | Clear G02's fault: try V-16, then V-17, then 2026-06-17 (I-27) | Tool, DEV-4 | V-16 and V-17 refused. With 2026-06-17: saved with Cleared date 2026-06-17 and Cleared by "Sam Patel"; reads "closed"; no longer offered as an open fault to clear | AC-09.3, AC-10.4, trap T-09 | Must | | |

G02 stays Unavailable on the stand-in: putting it back isn't on the card. The forecast for Wednesday isn't recorded, so the day plan's bands on 17 June aren't under test.

### S3 – Back at 15:30, booked tomorrow

**Story (workshop plan):** A bike comes back at 15:30 and goes out at 09:00 tomorrow. The depot closes at 16:30. Dave charges now and finishes in the morning. **Workshop outcome:** changed; needs "next out: tomorrow 09:00".
**Played by:** Dave (DEV-1). **Date and time:** Tue 16 June 2026, 15:30 (S3.01–S3.03). S3.04 runs later, on Fri 19 June 2026 09:00 **(invented time)**, after R3.
**Starting state:** as S5's Tuesday part ends. **Run S3.01 to S3.03 before S5.10**, so the clock is still on Tuesday (run order §4). For S3.04: R3.
**Tests:** REQ-03.

Several bikes not checked in in A.4 (M01, M10, M11, G01, G06) read overdue by 15:30. That's expected from the data and not under test here.

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S3.01 | Facilitator, then Dave | Set the clock to 15:30. Dave checks M06 in on the stand-in (E-07) | Clock, Stand-in | Check-in recorded at 15:30 | – | – | | |
| S3.02 | Dave | Open the day plan; find M06 | Tool, DEV-1 | "next out: Wed 09:00". "In the workshop" from the 15:00 slot (BR-01 rule 2) | AC-03.3, trap T-07 | Must | | CRP-OQ-05 (15:00) |
| S3.03 | Dave | Decide whether to charge M06's battery now | Tool, DEV-1 | 16:00 reads "moderate"; the tool gives no advice | AC-01.5 | Obs. | | Already scored at S1.10 and S2.04 |
| S3.04 | Facilitator, then Dave | Reset R3 (reservation set `fri-19`), clock Fri 19 June 2026 09:00. Dave opens the day plan; finds G03 | Fixtures, Clock, Tool DEV-1 | G03 "next out: Mon 09:00" | AC-03.6 (PRD OQ-12) | Must | | Bands on 19 June not under test |

### S6 – Dealer service

**Story (workshop plan):** The dealer finishes an interim service. Priya records it from the invoice, clears the fault it fixed and updates the battery's cycle count. **Workshop outcome:** validated, with cycle counts on the same screen. The criteria use two job sheets: M07's (AC-09.5, AC-10.5) and G01's (AC-14.1), both dated 15 June.
**Played by:** Priya (DEV-3). **Date and time:** Tue 16 June 2026, 16:12.
**Starting state:** as S3.02 ends. M07 fault 1043 open; B-07 301 cycles; B-14 156; B-17 22.
**Tests:** REQ-09, REQ-10, REQ-13 (Should), REQ-14 (Should).

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S6.00 | Facilitator | Set the clock to 16:12 | Clock | – | – | – | | |
| S6.01 | Priya | Open M07; record a dealer service (I-28 to I-30) marking fault 1043 cleared | Tool, DEV-3 | Dealer service saved. It shows Entry date 15 Jun 2026 and Recorded at 16 Jun 2026 16:12. Fault 1043 reads "closed", Cleared date 2026-06-15, Cleared by "Priya Shah" | AC-09.5, AC-10.5, trap T-09 | Must | | |
| S6.02 | Priya | In the same entry, B-07's cycle count was left blank (I-31). Open B-07 | Tool, DEV-3 | Cycle count still 301 | AC-14.2 | Should | | Only if the screen offers B-07 |
| S6.03 | Priya | Open the day plan; find M07 | Tool, DEV-3 | The fault flag has gone | AC-13.2 | Should | | |
| S6.04 | Priya | Open G01; start a dealer service (I-32, I-33); enter B-14's cycle count as V-20, then V-21, then V-22 | Tool, DEV-3 | Each time nothing is saved and a message says why | AC-14.3 | Should | | |
| S6.05 | Priya | Enter B-14 170 and B-17 31 (I-34, I-35); save. Open B-14 and B-17 | Tool, DEV-3 | Dealer service saved. B-14 cycle count 170, B-17 31; both "Last updated by Priya Shah" and now | AC-14.1 | Should | | |
| S6.06 | Priya | Open M07's record | Tool, DEV-3 | Last service is now the dealer service of 15 Jun 2026 | AC-05.1 rule (PRD OQ-07) | Obs. | | |

### S12 – Swollen battery

**Story (workshop plan):** Dave finds a swollen battery, B-09, on return. He quarantines it and logs a fault against the battery; its record shows it as quarantined. **Workshop outcome:** validated; remove the battery; it shows as quarantined; a warning if someone picks it to fit.
**Played by:** Dave (DEV-1), Sam (DEV-4). **Date and time:** Tue 16 June 2026, 16:20 **(invented)**: M04 is checked in early, so B-09 is found "on return".
**Starting state:** R2: baseline **without fault 1044** (CRP-OQ-01, agreed), so the fault is logged in this scenario as the card says. B-09 fitted to M04, no open fault. DEV-4 remembers "Sam Patel".
**Tests:** REQ-08, REQ-09, REQ-11, REQ-05 (AC-05.5).

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S12.00 | Facilitator | Reset R2; set the clock to 16:20 | Fixtures, Clock | – | – | – | | |
| S12.01 | Dave | Check M04 in on the stand-in (E-08) | Stand-in | Check-in recorded at 16:20 | – | – | | |
| S12.02 | Dave | Open B-09 | Tool, DEV-1 | "Fitted to M04" (starting state) | – | – | | |
| S12.03 | Dave | Report a fault on B-09 (I-36) | Tool, DEV-1 | Saved. B-09 now reads "Quarantined" | AC-09.2 | Must | | AC-09.2 names Sam; the result doesn't depend on who |
| S12.04 | Dave | Reopen B-09 | Tool, DEV-1 | Still fitted to M04, but reads "Quarantined" | AC-08.3 | Must | | Also checked at S4.01 |
| S12.05 | Sam | Open B-09; remove it from M04 | Tool, DEV-4 | A fitting of B-09 with no bike, Recorded by "Sam Patel" and the time. M04 "No battery fitted"; B-09 "Quarantined" | AC-08.1, AC-05.5 (no battery fitted), trap T-11 | Must | | |
| S12.06 | Dave | Open M04; start fitting a battery; pick B-09. Then go back | Tool, DEV-1 | Before anything is saved: a warning that B-09 is quarantined, with the fault's date (16 Jun 2026) and description, and a choice to go back or fit anyway. After going back, nothing is saved: M04 still "No battery fitted", no new fitting | AC-11.1, AC-11.2, trap T-12 | Must | | |
| S12.07 | Dave | Open B-09; fit it to M04. Then go back | Tool, DEV-1 | Same warning from this end. After going back, nothing is saved | AC-11.1, AC-11.2 | Must | | |
| S12.08 | Sam | Fit B-09 to M04; at the warning, fit anyway | Tool, DEV-4 | Fitting saved with "Sam Patel" and the time. B-09 still "Quarantined" | AC-11.3 | Must | | The confirm doesn't count towards NFR-01's taps |
| S12.09 | Sam | Clear B-09's fault, date today (test step only) | Tool, DEV-4 | Fault closed; B-09 "Fitted to M04" | – | – | | |
| S12.10 | Dave | Open M05; fit B-09 | Tool, DEV-1 | No warning. M05 shows B-09; B-05 "On the shelf"; M04 "No battery fitted" | AC-11.5 | Must | | |

### S14 – Clock change

**Story (workshop notes §10, new):** A day plan after the last Sunday in March or October shows the correct local times (NFR-06). Tested on the Monday after each change, because the depot is staffed on weekdays.
**Played by:** Dave (DEV-1), Priya (DEV-3). **Date and time:** Mon 30 March 2026 09:00 (BST); Mon 26 October 2026 09:00 (GMT).
**Starting state:** after S3.04, R3a: the stand-in serves no reservations. D1 holds the A.5 clock-change periods (06:00Z and 06:30Z very low; moderate from 07:00Z).
**Tests:** NFR-06 (REQ-01). **On any build that can't be set to these dates, score every step Partial (DEC-28).**

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S14.00 | Facilitator | Apply R3a; set the clock to Mon 30 March 2026 09:00 | Fixtures, Clock | – | – | – | | |
| S14.01 | Dave | Open the day plan | Tool, DEV-1 | 07:00 and 07:30 "very low"; 08:00 "moderate". Bands in colour and text | NFR-06, AC-01.2, trap T-14 | Must | | |
| S14.02 | Priya | Record a service check on M09 (I-37). Edit M09's frame size (I-38) | Tool, DEV-3 | Recorded at reads 30 Mar 2026 09:0x and Last updated at 30 Mar 2026 09:0x: local time, not an hour earlier | NFR-06, BR-08, NFR-14 | Must | | |
| S14.03 | Facilitator, then Dave | Set the clock to Mon 26 October 2026 09:00. Dave opens the day plan | Clock, Tool DEV-1 | 07:00 "moderate" (not "very low") | NFR-06, trap T-14 | Must | | |
| S14.04 | Priya | Record a service check on M09 (I-39). Edit M09's frame size back (I-40) | Tool, DEV-3 | Recorded at and Last updated at read 26 Oct 2026 09:0x | NFR-06, BR-08 | Must | | |

### S9 – A December day

**Story (workshop plan):** A cloudy Tuesday in December. No green band falls in staffed hours. **Workshop outcome:** validated; bands only; amber versus red is enough. The "least bad" highlight is on the parking lot.
**Played by:** Dave (DEV-1). **Date and time:** Tue 8 December 2026, 07:00 (GMT).
**Starting state:** as S14 ends (no reservations on the stand-in).
**Tests:** REQ-01. **On any build that can't be set to this date, score every step Partial (DEC-28).**

| # | Actor | Action | Where | Expected | Checks | MoSCoW | Result | Notes |
|---|-------|--------|-------|----------|--------|--------|--------|-------|
| S9.00 | Facilitator | Set the clock to Tue 8 December 2026 07:00 | Clock | – | – | – | | |
| S9.01 | Dave | Open the day plan | Tool, DEV-1 | Every slot shows its band in colour and text: 07:00–08:30 high, 09:00–14:30 moderate, 15:00–16:00 very high. No slot is singled out as the least bad | AC-01.4, AC-01.2 | Must | | |
| S9.02 | Dave | Look for figures and advice | Tool, DEV-1 | No gCO₂/kWh figures; no advice on what or when to charge | AC-01.5, trap T-08 | Must | | |
| S9.03 | Dave | Is amber versus red enough? | – | – | – | Obs. | | Parking lot |

---

## 6. Cross-cutting checks

### 6.1 Non-functional requirements (PRD §5)

Every NFR below is a Must for pilot readiness (DEC-31, DEC-52); NFR-12 applies from go-live and isn't checked. Each X-nn is scored once, from the steps listed and the extra action at the end. Methods marked **(invented)** are this script's; the measures are the PRD's.

| # | NFR | Test (PRD §5) | Steps that exercise it | Extra action at the end | Result | Notes |
|---|-----|-----------------|------------------------|-------------------------|--------|-------|
| X-01 | NFR-01 | Two taps or fewer for a swap, one-handed; controls at least 44 × 44 CSS px; quarantine confirm excluded | S4.03, S4.08 (Dave), S13.03 (Aisha), S12.08 (confirm) | Facilitator measures the swap screen's controls on DEV-5 | | |
| X-02 | NFR-02 | No sideways scrolling on the day plan, an asset record and every entry screen at the five sizes; A4 landscape print; touch targets | See the matrix below | Facilitator opens each uncovered screen at its size on DEV-5 (responsive mode) | | |
| X-03 | NFR-03 | Band names always in text; contrast AA (brand identity §4 pairings); focus visible; automated AA check of the day plan, an asset record and the swap screen; greyscale print reads correctly | S1.02, S8.02, S8.03, S9.01, S14.01 | On DEV-5: run an automated WCAG 2.1 AA checker on the three screens; tab through them to check focus | | |
| X-04 | NFR-04 | After S1 to S14 the stand-in has received no request that creates, changes or deletes anything | S4.04 | Facilitator reviews the whole request log, counting only requests from the tool | | CRP-OQ-06 |
| X-05 | NFR-05 | No password screen; every function available on every device | SU.03; functions used across DEV-1 to DEV-4 in S4, S5, S6, S10, S12, S13 | Facilitator spot-checks on DEV-5 that the swap, fault, dealer service and add screens open | | Also AC-10.6, trap T-13 |
| X-06 | NFR-06 | S14 | S14.01 to S14.04 | – | | Partial on undated builds (DEC-28) |
| X-07 | NFR-07 | UK spelling, sentence case, 24-hour times, units with values; reading age 12 or below **(invented test)** | All | Scribe collects interface text seen (labels, messages, warnings) and runs a readability check | | |
| X-08 | NFR-08 | Day plan for 18 bikes shown within 3 seconds of opening; an asset record within 2 seconds; a save confirmed within 1 second | S1.01, S7.02, S4.03 | Scribe times each three times on DEV-1 with a stopwatch and records the slowest **(invented method)** | | Over the CRP network, not depot Wi-Fi; note it |
| X-09 | NFR-09 | Current and previous major versions of Safari on iOS and Chrome on Android, and the depot tablet's browser | SU.03 | Facilitator records each device's browser and version; at least one iOS Safari and one Android Chrome take part | | |
| X-10 | NFR-10 | D1 keeps 30 days of forecasts; D2 and D3 have no delete; the phone keeps only the last loaded plan | SU.04, S10.04, S8.05 | Facilitator inspects how the build removes D1 periods older than 30 days | | |
| X-11 | NFR-11 | Staff names are the only personal data; never sent to LibreBooking or the Carbon Intensity API; no member data requested or stored | SU.04, X-04 | Facilitator checks the request log and the forecast job's requests carry no names, and the data model holds no member data | | |
| X-13 | NFR-13 | The CRP deployment is behind deployment protection; the public demo saves nothing | SU.01 | Facilitator opens the CRP address in a private window without access: refused. On the public demo, saves a fault report: the demo notice shows and the record is unchanged | | Public demo part: route A only, unless a B or C build has one |
| X-14 | NFR-14 | One clock for all business time | S4.03 (Recorded at and Fitted from 08:05), S14.02 | Facilitator runs, or reviews the result of, a code search for system clock use outside the clock module | | DEC-59 allows process 1's `systemNow()` |
| X-15 | NFR-15 | Phones get the planner over HTTPS; the service worker registers on a phone | SU.01, S8.05 | – | | Service worker part scored with REQ-17 if it isn't built |
| X-16 | NFR-16 | Concurrent edits don't lose history | – | Dave (DEV-1) and Aisha (DEV-2) each record a swap on M09 within a minute of each other. Both fittings are saved and M09 shows the later one | | |
| X-17 | NFR-17 | Stored text can't run as code; forms can't be posted from another site | – | Facilitator reports a fault on M09 with the description `<script>alert(1)</script>` **(invented input)**: it shows as text. Then posts a form to the tool from a page on another origin: rejected | | |
| X-18 | NFR-18 | Every Must acceptance criterion has a passing automated test; browser tests run S1 to S14 at the NFR-02 sizes with an automated accessibility check | – | Facilitator reads the build's test report and checks a passing test is named for each of AC-01.1 to AC-11.5 | | A build with no tests scores Fail |
| X-19 | NFR-19 | A failed save loses nothing the user typed | – | Facilitator makes the database unreachable for the build (for example, a deployment with a wrong database address) **(invented method)**; Sam submits a fault report: the form returns with the description kept and a message that nothing was saved | | |
| X-20 | NFR-20 | The files sent to the browser contain no database service key, forecast job secret or stand-in console key | – | Facilitator searches the files the browser downloads (browser developer tools, or the build output) for each secret | | |

**NFR-02 coverage** (step where each screen is used at each size; X-02 fills the gaps)

| Screen | 360 × 740 (DEV-2) | 390 × 844 (DEV-1) | 430 × 932 (DEV-3) | 1024 × 768 (DEV-4) | 1366 × 1024 (DEV-5) |
|--------|-------------------|-------------------|-------------------|--------------------|---------------------|
| Day plan (SCR-02, SCR-03) | S2.05 | S1.01 | S11.01 | S8.02 | S8.03 |
| Asset record (SCR-05, SCR-06) | S10.09 | S7.02 | S6.01 | S5.02 | X-02 |
| Name picker (SCR-01) | S10.07 | X-02 | X-02 | S5.01 | X-02 |
| Add or edit asset (SCR-07) | S10.07 | X-02 | S10.01 | X-02 | X-02 |
| Swap and removal (SCR-08) | S13.03 | S4.03 | X-02 | S12.05 | X-02 |
| Fault report and clearance (SCR-09) | S5.11 | S12.03 | X-02 | S5.02 | X-02 |
| Service check (SCR-10) | X-02 | X-02 | S14.02 | S5.08 | X-02 |
| Dealer service (SCR-11) | X-02 | X-02 | S6.01 | X-02 | X-02 |
| Print (A4 landscape) | – | – | – | – | S8.03 |

### 6.2 Decision traps (measurement plan §6.2)

| # | Trap | Source | Step(s) that exercise it |
|---|------|--------|--------------------------|
| T-01 | Bike status mastered in two places | DEC-01 | SU.04, S10.04, S5.04, S5.09 |
| T-02 | Writing to LibreBooking, or a second check-out | Scope, DEC-02, DEC-18 | S4.04, X-04 |
| T-03 | Overdue bikes shown as available | DEC-16 | S11.01, S1.04 (M08) |
| T-04 | Bikes due back later shown as already overdue | DEC-23 | S1.06 (M10, M11) |
| T-05 | Bikes still out from an earlier day shown as back | DEC-24 | S1.04 (M08, G04) |
| T-06 | Early returns shown as still out | DEC-16 | S13.02, S2.02 |
| T-07 | Day plan limited to today | DEC-17 | S2.02, S3.02, S1.08 (M07, M08) |
| T-08 | The tool deciding when to charge | Scope | S1.10, S2.04, S9.02 |
| T-09 | Stored fault status disagreeing with the cleared date | DEC-14 | SU.04, S7.04, S5.12, S6.01 |
| T-10 | Forecast period end stored separately | DEC-13 | SU.04 |
| T-11 | Batteries treated as part of the bike | Data dictionary, DEC-20 | S4.03, S4.09, S12.05 |
| T-12 | Quarantined battery fitted silently | DEC-06 refined | S12.06 to S12.08 |
| T-13 | Logins and permissions | DEC-11, DEC-19 | SU.03, S5.01, S10.07, X-05 |
| T-14 | Clock change | NFR-06, S14 | S14.01, S14.03 |

---

## 7. Coverage matrix: Must criteria

"Added" means the step isn't on the scenario card: it was placed in the nearest scenario because the criterion names no scenario, or names one whose story doesn't include it (CRP-OQ-08).

| Criterion | Step(s) | Added | Depends on |
|-----------|---------|-------|------------|
| AC-01.1 | S1.01 |  |  |
| AC-01.2 | S1.02; S9.01, S14.01 |  |  |
| AC-01.3 | S1.12 | Added | O-01 |
| AC-01.4 | S9.01 |  | DEC-28 |
| AC-01.5 | S1.10; S2.04, S9.02 |  | PRD OQ-10 |
| AC-02.1 | S5.07 |  |  |
| AC-02.2 | S1.07 | Added |  |
| AC-02.3 | S11.01 |  |  |
| AC-02.4 | S13.02 |  |  |
| AC-02.5 | S1.04 | Added |  |
| AC-02.6 | S1.06 |  |  |
| AC-02.7 | S5.09 | Added |  |
| AC-02.8 | S10.11 | Added | PRD OQ-15 |
| AC-02.9 | S1.04 | Added |  |
| AC-02.10 | S1.04 | Added |  |
| AC-03.1 | S2.02 |  |  |
| AC-03.2 | S2.03 |  |  |
| AC-03.3 | S3.02 |  |  |
| AC-03.4 | S1.08 | Added |  |
| AC-03.5 | S2.03 |  |  |
| AC-03.6 | S3.04 | Added | PRD OQ-12 |
| AC-04.1 | S1.03 |  |  |
| AC-04.2 | S1.04, S1.05 |  | PRD OQ-13 |
| AC-04.3 | S1.06 |  | CRP-OQ-04 |
| AC-04.4 | S1.08 (S1.09, S11.03 for the Should parts) |  | CRP-OQ-03 |
| AC-04.5 | S1.02 |  |  |
| AC-05.1 | S7.02 |  | PRD OQ-07 |
| AC-05.2 | S7.03 |  |  |
| AC-05.3 | S4.01 | Added |  |
| AC-05.4 | S7.04 |  |  |
| AC-05.5 | S7.06; S4.05, S12.05 | Added |  |
| AC-05.6 | S7.05 |  |  |
| AC-05.7 | S7.01 |  |  |
| AC-06.1 | S10.01 | Added |  |
| AC-06.2 | S10.02 | Added |  |
| AC-06.3 | S10.05, S10.07, S10.10 | Added |  |
| AC-06.4 | S10.12 | Added |  |
| AC-06.5 | S10.04 | Added |  |
| AC-06.6 | S10.07, S10.08 |  |  |
| AC-07.1 | S4.03 |  | PRD OQ-05 |
| AC-07.2 | S4.08 |  |  |
| AC-07.3 | S4.02, S4.03, S4.06 |  |  |
| AC-07.4 | S13.03 | Added |  |
| AC-07.5 | S4.05 | Added |  |
| AC-07.6 | S4.04 |  |  |
| AC-08.1 | S12.05 |  |  |
| AC-08.2 | S4.06 | Added |  |
| AC-08.3 | S4.01; S12.04 |  |  |
| AC-08.4 | S10.09 |  |  |
| AC-08.5 | S4.09 | Added | PRD OQ-19 |
| AC-09.1 | S5.02 |  |  |
| AC-09.2 | S12.03 |  | CRP-OQ-01 |
| AC-09.3 | S5.12 |  |  |
| AC-09.4 | S5.08 | Added |  |
| AC-09.5 | S6.01 |  |  |
| AC-09.6 | S5.03 | Added |  |
| AC-09.7 | S5.04 |  |  |
| AC-10.1 | S10.07 |  | PRD OQ-06 |
| AC-10.2 | S5.11 | Added |  |
| AC-10.3 | S5.01, S5.02 |  |  |
| AC-10.4 | S4.03, S5.02, S5.12, S10.01, S10.12 |  |  |
| AC-10.5 | S6.01 |  |  |
| AC-10.6 | SU.03 | Added |  |
| AC-11.1 | S12.06, S12.07 |  |  |
| AC-11.2 | S12.06, S12.07 |  |  |
| AC-11.3 | S12.08 |  |  |
| AC-11.4 | S4.03, S4.08 |  |  |
| AC-11.5 | S12.10 |  |  |

**Every Must criterion (68) has at least one step. None is flagged as untested.** 24 are tested only by added steps.

Should and Could criteria, scored separately: AC-12.1 S8.02; AC-12.2 S8.03; AC-12.3 S8.04, S11.04; AC-13.1 S5.05 (S1.09); AC-13.2 S6.03; AC-13.3 S5.06; AC-14.1 S6.05; AC-14.2 S6.02; AC-14.3 S6.04; AC-15.1 S11.02; AC-15.2 S11.05; AC-15.3 S11.07; AC-16.1 S2.05; AC-16.2 S2.06; AC-17.1 S8.05; AC-17.2 S8.06; AC-18.1 S10.06; AC-18.2 S10.03. AC-19.1 isn't tested (DEC-34).

---

## 8. Score sheet

### 8.1 Scoring rules

From the measurement plan §6.1 and DEC-25, DEC-28:

- Score each build **twice**: before any fixes ("first") and at the stop point ("final").
- A scenario **runs cleanly** when every Must step passes. Should and Could steps are reported separately.
- On a build that can't be set to the scenario date, S9 and S14 score Partial.

Agreed by Rob (CRP-OQ-07) and copied into the measurement plan §6.1. **(invented)** for this project:

- **Pass:** the result matches the expected result.
- **Partial:** the core of the result is right but a detail is missing or different (for example wording, or one element of several), and it wouldn't lead staff to a wrong decision. Also DEC-28.
- **Fail:** the result is wrong, missing, or would mislead staff.
- **Not run:** the step couldn't be run (for example, an earlier step failed or the feature is absent). Counts as Fail for readiness; report it separately.
- **A criterion's score** is the lowest score of the steps that test it (Fail below Partial below Pass).

### 8.2 By scenario

Write "passed/total" and C (runs cleanly) or N (doesn't).

**Must steps**

| Scenario | Must steps | A first | A final | B first | B final | C first | C final |
|----------|-----------|---------|---------|---------|---------|---------|---------|
| S1 | 10 | | | | | | |
| S2 | 3 | | | | | | |
| S3 | 2 | | | | | | |
| S4 | 8 | | | | | | |
| S5 | 9 | | | | | | |
| S6 | 1 | | | | | | |
| S7 | 6 | | | | | | |
| S8 | 0 | C | C | C | C | C | C |
| S9 | 2 | | | | | | |
| S10 | 10 | | | | | | |
| S11 | 2 | | | | | | |
| S12 | 7 | | | | | | |
| S13 | 2 | | | | | | |
| S14 | 4 | | | | | | |
| **Total** | **66** | | | | | | |
| Scenarios running cleanly | 14 | | | | | | |

**Should and Could steps** (don't block)

| Scenario | Steps | A first | A final | B first | B final | C first | C final |
|----------|-------|---------|---------|---------|---------|---------|---------|
| S1 | 1 | | | | | | |
| S2 | 2 | | | | | | |
| S5 | 2 | | | | | | |
| S6 | 4 | | | | | | |
| S8 | 5 | | | | | | |
| S10 | 2 | | | | | | |
| S11 | 5 | | | | | | |
| **Total** | **21** | | | | | | |

### 8.3 By requirement

Write Pass / Partial / Fail counts, for example "5/0/0".

| Requirement | MoSCoW | Criteria | A first | A final | B first | B final | C first | C final |
|-------------|--------|----------|---------|---------|---------|---------|---------|---------|
| REQ-01 | Must | 5 | | | | | | |
| REQ-02 | Must | 10 | | | | | | |
| REQ-03 | Must | 6 | | | | | | |
| REQ-04 | Must | 5 | | | | | | |
| REQ-05 | Must | 7 | | | | | | |
| REQ-06 | Must | 6 | | | | | | |
| REQ-07 | Must | 6 | | | | | | |
| REQ-08 | Must | 5 | | | | | | |
| REQ-09 | Must | 7 | | | | | | |
| REQ-10 | Must | 6 | | | | | | |
| REQ-11 | Must | 5 | | | | | | |
| **Must total** | | **68** | | | | | | |
| REQ-12 | Should | 3 | | | | | | |
| REQ-13 | Should | 3 | | | | | | |
| REQ-14 | Should | 3 | | | | | | |
| REQ-15 | Should | 3 | | | | | | |
| REQ-16 | Should | 2 | | | | | | |
| REQ-17 | Could | 2 | | | | | | |
| REQ-18 | Could | 2 | | | | | | |

**Must criteria, one by one** (feeds "Must criteria met" in the measurement plan §7)

| Criterion | A first | A final | B first | B final | C first | C final |
|-----------|---------|---------|---------|---------|---------|---------|
| AC-01.1 | | | | | | |
| AC-01.2 | | | | | | |
| AC-01.3 | | | | | | |
| AC-01.4 | | | | | | |
| AC-01.5 | | | | | | |
| AC-02.1 | | | | | | |
| AC-02.2 | | | | | | |
| AC-02.3 | | | | | | |
| AC-02.4 | | | | | | |
| AC-02.5 | | | | | | |
| AC-02.6 | | | | | | |
| AC-02.7 | | | | | | |
| AC-02.8 | | | | | | |
| AC-02.9 | | | | | | |
| AC-02.10 | | | | | | |
| AC-03.1 | | | | | | |
| AC-03.2 | | | | | | |
| AC-03.3 | | | | | | |
| AC-03.4 | | | | | | |
| AC-03.5 | | | | | | |
| AC-03.6 | | | | | | |
| AC-04.1 | | | | | | |
| AC-04.2 | | | | | | |
| AC-04.3 | | | | | | |
| AC-04.4 | | | | | | |
| AC-04.5 | | | | | | |
| AC-05.1 | | | | | | |
| AC-05.2 | | | | | | |
| AC-05.3 | | | | | | |
| AC-05.4 | | | | | | |
| AC-05.5 | | | | | | |
| AC-05.6 | | | | | | |
| AC-05.7 | | | | | | |
| AC-06.1 | | | | | | |
| AC-06.2 | | | | | | |
| AC-06.3 | | | | | | |
| AC-06.4 | | | | | | |
| AC-06.5 | | | | | | |
| AC-06.6 | | | | | | |
| AC-07.1 | | | | | | |
| AC-07.2 | | | | | | |
| AC-07.3 | | | | | | |
| AC-07.4 | | | | | | |
| AC-07.5 | | | | | | |
| AC-07.6 | | | | | | |
| AC-08.1 | | | | | | |
| AC-08.2 | | | | | | |
| AC-08.3 | | | | | | |
| AC-08.4 | | | | | | |
| AC-08.5 | | | | | | |
| AC-09.1 | | | | | | |
| AC-09.2 | | | | | | |
| AC-09.3 | | | | | | |
| AC-09.4 | | | | | | |
| AC-09.5 | | | | | | |
| AC-09.6 | | | | | | |
| AC-09.7 | | | | | | |
| AC-10.1 | | | | | | |
| AC-10.2 | | | | | | |
| AC-10.3 | | | | | | |
| AC-10.4 | | | | | | |
| AC-10.5 | | | | | | |
| AC-10.6 | | | | | | |
| AC-11.1 | | | | | | |
| AC-11.2 | | | | | | |
| AC-11.3 | | | | | | |
| AC-11.4 | | | | | | |
| AC-11.5 | | | | | | |
| **Passed (of 68)** | | | | | | |

### 8.4 Non-functional requirements

| NFR | Check | A first | A final | B first | B final | C first | C final |
|-----|-------|---------|---------|---------|---------|---------|---------|
| NFR-01 | X-01 | | | | | | |
| NFR-02 | X-02 | | | | | | |
| NFR-03 | X-03 | | | | | | |
| NFR-04 | X-04 | | | | | | |
| NFR-05 | X-05 | | | | | | |
| NFR-06 | X-06 (S14) | | | | | | |
| NFR-07 | X-07 | | | | | | |
| NFR-08 | X-08 | | | | | | |
| NFR-09 | X-09 | | | | | | |
| NFR-10 | X-10 | | | | | | |
| NFR-11 | X-11 | | | | | | |
| NFR-13 | X-13 | | | | | | |
| NFR-14 | X-14 | | | | | | |
| NFR-15 | X-15 | | | | | | |
| NFR-16 | X-16 | | | | | | |
| NFR-17 | X-17 | | | | | | |
| NFR-18 | X-18 | | | | | | |
| NFR-19 | X-19 | | | | | | |
| NFR-20 | X-20 | | | | | | |
| **Passed (of 19)** | | | | | | | |

### 8.5 Decision traps

For each route, write when the trap was caught (measurement plan §6.2): **B** before building, **Q** by Claude asking, **T** in testing (this pilot), **M** missed. For route A most are B; record what the pilot shows regardless.

| Trap | Step(s) | A | B | C |
|------|---------|---|---|---|
| T-01 Bike status in two places | SU.04, S10.04, S5.04, S5.09 | | | |
| T-02 Writing to LibreBooking | S4.04, X-04 | | | |
| T-03 Overdue shown as available | S11.01 | | | |
| T-04 Due later shown as overdue | S1.06 | | | |
| T-05 Out from an earlier day shown as back | S1.04 | | | |
| T-06 Early returns shown as out | S13.02 | | | |
| T-07 Day plan limited to today | S2.02, S3.02 | | | |
| T-08 Tool deciding when to charge | S1.10, S2.04, S9.02 | | | |
| T-09 Stored fault status | SU.04, S7.04, S5.12, S6.01 | | | |
| T-10 Period end stored | SU.04 | | | |
| T-11 Batteries as part of the bike | S4.03, S4.09, S12.05 | | | |
| T-12 Quarantined battery fitted silently | S12.06–S12.08 | | | |
| T-13 Logins and permissions | SU.03, X-05 | | | |
| T-14 Clock change | S14.01, S14.03 | | | |
| **Caught (of 14)** | | | | |

### 8.6 Summary for the measurement plan (§7)

| Route | Must criteria met (first / final, of 68) | Scenarios running cleanly (first / final, of 14) | NFRs passed (final, of 19) | Traps caught (of 14) | Defects found at the pilot |
|-------|------------------------------------------|---------------------------------------------------|---------------------------|----------------------|----------------------------|
| A | | | | | |
| B | | | | | |
| C | | | | | |

---

## 9. Defect log template

One row per defect. IDs run DEF-A-001, DEF-B-001, DEF-C-001 by route.

| ID | Scenario and step | Expected | Actual | Severity | Requirement | Route | Round (first / final) | Raised by |
|----|-------------------|----------|--------|----------|-------------|-------|-----------------------|-----------|
| DEF-A-001 | | | | | | A | | |

**Severity** **(invented)**:

| Severity | Meaning |
|----------|---------|
| Blocker | A scenario can't continue, or a Must step can't be run |
| Major | A Must step fails |
| Minor | A Should or Could step fails, or a Must step is Partial |
| Cosmetic | Wording, layout or style only, with no effect on the result |

---

## 10. Open questions

### 10.1 Raised while writing this script

All answered by Rob on 12 November 2026.

| ID | Question | Where the documents disagree or are silent | Options | Answer | Affects |
|----|----------|-------------------------------------------|---------|--------|---------|
| CRP-OQ-01 | Is B-09's fault logged during S12, or before it? | The S12 card says Dave logs the fault on return. PRD A.3 preloads it as fault 1044 (12 June), and AC-08.1 and AC-08.3 assume it's open. With 1044 loaded, AC-09.2 ("when he reports the fault, B-09 shows Quarantined") can't show a change, because B-09 is quarantined already | (a) S12 starts from a baseline without 1044 and logs the fault, as the card says; other scenarios keep 1044. Costs one reset. (b) Keep 1044; S12 starts at the removal; AC-09.2 is tested on another battery or scored on the existing fault | **Resolved:** (a) | S12, R2, AC-09.2 |
| CRP-OQ-02 | How do routes B and C run the date-bound scenarios? | DEC-28 covers S9 and S14 only. But every scenario assumes the demo date (16 June 2026) and the stand-in. The measurement plan says not to give B and C "a demo clock or test data it didn't produce", yet also to score them on Appendix A's sample data | (a) Load Appendix A into whatever each build uses, re-dated to the pilot day, and use the live forecast; score steps that need the recorded bands Partial. (b) Score every date-bound step Partial, as DEC-28. (c) Give B and C the stand-in and clock as test equipment, not as part of the build | **Resolved:** (c), logged as DEC-29; measurement plan v0.5 §6.1 updated. DEC-28 still applies to a build that can't take the demo date | Routes B and C, SU.01, §8 |
| CRP-OQ-03 | How is a Must criterion scored when part of it tests a Should? | AC-04.4 (Must) requires the open fault flag (REQ-13, Should) and the booked-again warning (REQ-15, Should). NFR-02 and NFR-03 rely on the print (REQ-12, Should) | (a) Score the Must part only (next booking, AC-04.4; screens, NFR-02); score the Should parts with their requirement. (b) The whole criterion is Must, so those Should features must be built | **Resolved:** (a) | S1.08, S1.09, S11.03, S8.03, X-02, X-03 |
| CRP-OQ-04 | AC-04.3's wording | AC-04.3 says M10 and M11 show "In the workshop" from 12:00 and 12:30. The data (A.4) and AC-02.6 give M11 from 12:00 and M10 from 12:30 | Follow the data; correct AC-04.3's order | **Resolved:** follow the data. AC-04.3's wording corrected in PRD v0.5 | S1.06 |
| CRP-OQ-05 | BR-01 at the edges of a slot | (a) Rule 2 counts a check-in at the slot's end, so M03 (checked in 10:00) reads "In the workshop" in the 09:30 slot and M06 (15:30) in the 15:00 slot; the workshop said "from check-in". (b) After M02's 11:45 check-in, is the 11:00 slot overdue (the bike wasn't back by then) or in the workshop? AC-02.4 reads rule 3's "isn't checked in" relative to the slot; rule 4 doesn't say | (a) Keep BR-01 as written. (b) Rule 4 relative to now ("in the workshop"), or to the slot ("overdue") | **Resolved:** (a) as written. (b) Relative to the slot: the 11:00 slot reads overdue (DEC-30) | S2.02, S3.02, S11.08 |
| CRP-OQ-06 | What NFR-04's log check counts | Testers' check-ins and status changes on the stand-in are themselves changes, so "no request that creates, changes or deletes anything" can't hold for the whole log | Count only requests from the tool | **Resolved:** requests from the tool only | X-04, S4.04 |
| CRP-OQ-07 | Partial and the criterion roll-up | The measurement plan lists Pass, Partial and Fail but doesn't define Partial, or how step results make a criterion's score | As §8.1 | **Resolved:** §8.1 as proposed; copied into measurement plan §6.1 | §8 |
| CRP-OQ-08 | Added steps | 24 Must criteria name no scenario, or a scenario whose card doesn't include them. This draft adds them as steps in the nearest scenario (§7, "Added"). AC-02.8 and AC-06.4 use edits in the tool to make the wrong resource ID, since the stand-in contract (§7.1) only changes status and check-ins | Keep them in scenarios, or move them to a separate block of checks | **Resolved:** keep in scenarios | §7 |
| CRP-OQ-09 | Who does what | Some criteria name a different person from the card or from the step: AC-07.4 (Dave) is done by Aisha for NFR-01's one-handed swap; AC-09.2 (Sam) by Dave, as the S12 card says. AC-09.4 says "Thursday check" on the Tuesday demo day. Results don't depend on who | Accept | **Resolved:** accept | S13.03, S12.03, S5.08 |

### 10.2 PRD open questions

The PRD questions that affect this script are now logged decisions (decision log v1.0). Agreed ones are fixed. Assumed ones are what the build follows and what every route is scored against; the team confirms them in §10.3.

| PRD OQ | Decision | Status | Steps |
|--------|----------|--------|-------|
| OQ-05 | DEC-36: S4 uses G01, not M04; AC-07.5 still fits B-17 to M04 | Assumed | S4.03, S4.05, S4.08 |
| OQ-06 | DEC-37: names are typed once and remembered | Assumed | SU.07, S5.01, S10.07 |
| OQ-07 | DEC-38: "last service" is the latest service check or dealer service, labelled | Assumed | S7.02, S6.06 |
| OQ-08 | DEC-39: the day plan refreshes on opening only, so testers reopen it after each stand-in change | Assumed | §3.4, all stand-in steps |
| OQ-09 | DEC-33: PRD §7.3 as written | Agreed | Not tested |
| OQ-10 | DEC-32: bands only; no band meanings or figures | Agreed | S1.10, S2.04, S9.02 |
| OQ-11 | DEC-34: dark theme follows the device; REQ-19 not tested | Agreed | §1.3 |
| OQ-12 | DEC-45: next staffed day is the next weekday; bank holidays not skipped | Agreed (Priya) | S3.04 |
| OQ-13 | DEC-40: the 07:00 slot lists all bikes | Assumed | S1.04, S1.05 |
| OQ-14 | DEC-41: a quarantined fitted battery doesn't flag the bike | Assumed | S5.06 |
| OQ-15 | DEC-42: the mismatch warning is kept | Assumed | S10.11, S10.12 |
| OQ-16 | DEC-35: "Charging planner"; screens "Day plan" and "Fleet" | Agreed | X-07 (interface text) |
| OQ-17 | DEC-31: NFR-01 to NFR-07 block readiness; extended by DEC-52 to NFR-08 to NFR-11 and NFR-13 to NFR-20 | Agreed | §1.2, §6.1 |
| OQ-18 | DEC-44: postcode OX4, South England region | Agreed (Priya) | `forecasts.csv` |
| OQ-19 | DEC-43: a list of all batteries with locations | Assumed | S4.09 |

### 10.3 Decisions to confirm with the team

Run after the cross-cutting checks, with everyone present (about 20 minutes **(invented)**). For each decision, the facilitator recalls the step where the team saw it, asks the owners whether it's right, and the scribe records the answer. Confirmed decisions change from Assumed to Agreed in the decision log. A decision the team changes is logged as a pilot finding and a change for after the pilot. **Scores aren't revised:** every route is scored against the decisions as they stood (measurement plan §6.1).

| Decision | Question for the team | Owners | Seen at | Confirmed / changed | Notes |
|----------|----------------------|--------|---------|---------------------|-------|
| DEC-23 | Should a bike due back later today read "In the workshop" until its due time passes? | Priya, Dave | S1.06 | | |
| DEC-24 | Should bikes still out from an earlier day show as out or overdue? | Priya, Lewis | S1.04 (M08, G04) | | Lewis also confirms the real API can supply them (A-05) |
| DEC-30 | After a late check-in, should the earlier slots stay overdue? | Priya, Dave | S11.08 | | |
| DEC-36 | Is a GSD battery swapped into a GSD the right S4 case? | Dave, Sam | S4.03 | | |
| DEC-37 | Is typing your name once enough, or do you want a list to pick from? | Aisha, Priya | S10.07 | | |
| DEC-38 | Should "last service" include weekly checks, labelled? | Sam, Dave | S7.02 | | |
| DEC-39 | Is refreshing on opening enough, or should the plan update itself? | Dave | S2, S11 | | |
| DEC-40 | Should the 07:00 slot list every bike? | Dave, Aisha | S1.04 | | |
| DEC-41 | Should a bike show when its fitted battery is quarantined? | Sam | S5.06 | | |
| DEC-42 | Is the resource mismatch warning useful? | Priya, Lewis | S10.11 | | |
| DEC-43 | Does the battery list work for the monthly stock check? | Priya | S4.09 | | |

---

## Change history

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 12 November 2026 | First draft from PRD v0.4, workshop notes v1.1, workshop plan v0.5, decision log v0.7, data dictionary v0.5, DFDs v0.8 and measurement plan v0.4. Test data in `test-data/`. CRP-OQ-01 to CRP-OQ-03 and CRP-OQ-05(a) answered by Rob; CRP-OQ-02 logged as DEC-29 |
| 1.0 | 12 November 2026 | Baselined. CRP-OQ-04 to CRP-OQ-09 answered by Rob. S11.08 expects M02's 11:00 slot to stay overdue after its late check-in (DEC-30). Scoring rules in §8.1 agreed |
| 1.1 | 12 November 2026 | PRD open questions logged as DEC-31 to DEC-43; §10.2 shows each decision and its status. New §10.3: decisions to confirm with the team at the end of the pilot, including DEC-23, DEC-24 and DEC-30. Run order step 19 added |
| 1.2 | 12 November 2026 | OQ-12 and OQ-18 confirmed by Priya (DEC-45, DEC-44). No change to steps or test data. S2.05 uses the handbook URL now in PRD AC-16.1 **(invented)** |
| 1.3 | 12 November 2026 | DEC-52 applied: pass bar §1.2 item 3 now NFR-01 to NFR-11 and NFR-13 to NFR-20; §1.3 no longer excludes NFR-08 to NFR-13; checks X-08 to X-20 added to §6.1 and §8.4; summary §8.6 out of 19. The CRP runs on a protected Vercel preview deployment, not the depot network (§3.1, SU.01, CON-01, DEC-49). NFR-14 noted at S4.03 and S14.02. Timing for the extra checks added (§4). Inputs updated to PRD v0.8, decision log v1.4, technical note v0.5 and measurement plan v0.9 |
