# Workshop 1 notes – Day planner and fleet records

**Project:** Community e-bike library – day planner and fleet records (proof of concept)
**Document:** `docs/analysis/workshop-1/notes.md`
**Status:** v1.1 (12 November 2026). v1.0 is the workshop record; v1.1 adds dated post-workshop notes on ASM-02 (§7) and A-05 (§13); nothing else changes
**Facilitator:** Rob
**Related:** `claude/workshop-plan.md` v0.5, `claude/decision-log.md` v0.7, `claude/data-dictionary.md` v0.4, `claude/dfds-day-planner.md` v0.8, `claude/prd.md` v0.4, `claude/measurement-plan.md` (step A9)

> **Fictional example.** Greener Miles and its people are invented. The workshop was role-played: Rob facilitated and Claude played the attendees. Detail the attendees added that isn't in earlier documents is marked **(invented)**. Facilitator time for step A9: about 70 minutes (17:12–18:21).

---

## 1. Playback

We agreed the tool does two things. First, a **half-hourly day plan** on the phone: each bike's state, its next booking (even if that's tomorrow) and the carbon intensity bands. Staff still decide when to charge. Second, **fleet records** that replace the four spreadsheets and always say where every battery is.

LibreBooking stays the only place for bookings, check-out, check-in and availability. The tool only reads from it. Nobody logs in: you pick your name once and the phone remembers it, so every change carries a name and a time.

The surprises:
- Late check-ins mean "overdue" needs to say "not checked in".
- A newer volunteer can't judge a charge without the next booking.
- Nobody will print a plan every morning.
- Our headline success measure needed a tally sheet because the tool doesn't record charging.

We'll pilot the 11 Musts with sample data and review the parking lot a few months after go-live.

---

## 2. Attendees

| Role | Person (invented) | Present |
|------|-------------------|---------|
| Coordinator | Priya Shah | In person |
| Experienced volunteer | Dave Morgan | In person |
| Newer volunteer | Aisha Bello | In person |
| Volunteer mechanic | Sam Patel | In person |
| Booking system admin | Lewis Chen | Remote, on the depot tablet |

The organisation is **Greener Miles**, a community e-bike library in Cowley. It has 18 bikes (12 Raleigh Motus, 6 Tern GSD), 26 batteries and a 16-slot charging rack. This replaces the earlier "Northfield, 16 bikes, 18 batteries" (ASM-01).

---

## 3. Observations

### Activity 1 – Welcome and scope

- OBS-1.1: Each attendee's wish. Priya: one place for bikes and batteries. Dave: the day's bookings and the greenest hours on one screen, without the tool deciding. Aisha: to know what to do with a returned battery, on her phone. Sam: a bike's history while standing next to it. Lewis: no double keying with LibreBooking.
- OBS-1.2: Battery charge can't be read. The Bosch batteries only have LEDs, and the Bluetooth reporting on newer bikes is tied to one rider's phone **(invented)**. Typing levels in would soon be wrong and still trusted (Sam). Charge levels go to the parking lot.
- OBS-1.3: Aisha asked whether the tool would tell her when to charge. Dave preferred it didn't, because he sometimes has to charge regardless. Agreed: show the bands, and link to the charging rules in the volunteer handbook (a Google Doc). Advice on what to charge goes to the parking lot, for review a few months after go-live.

### Activity 2 – Context diagram check

- OBS-2.1: One Library staff role confirmed (DEC-11, DEC-12). Permissions would mean more clicks and errors.
- OBS-2.2: Priya wants to see who changed a record and when **(invented)**. Last month M07's LibreBooking ID was changed and the bike dropped off the schedule.
- OBS-2.3: The dealer stays outside the boundary. Priya keys each job sheet from an emailed PDF, about twice a month, in about 10 minutes. Attaching job sheet photos or PDFs, and having Claude read the PDFs, both go to the parking lot.

### Activity 3 – A shift, as-is

- OBS-3.1: At handover, staff find the booking in LibreBooking, check the tyres and brakes, and press the battery button. If it shows fewer than four lights, they swap in a charged spare. Then they show the member the bike and press Check out in LibreBooking.
- OBS-3.2: Battery swaps are never written down, because there's nowhere to record them.
- OBS-3.3: On busy days, returns are leaned against the wall and checked in later. Lewis estimates about 1 in 5 returns are checked in more than an hour late, and a few never are **(invented)**. Bikes with a fault go to Sam's bench before check-in.
- OBS-3.4: The API supplies check-in times (ASM-02, part confirmed).
- OBS-3.5: Early returns are checked in and the bike is free again. For late returns, the volunteer rings the member, and the next booking may need a different bike.
- OBS-3.6: Rob proposed a check-out in the tool. Lewis and Priya rejected it: two check-outs would disagree. Recording a swap only when it happens is enough (DEC-18).
- OBS-3.7: Principle from the room: **less admin over more precision**. The day plan can be rough at the edges; asset records must be right.

### Activity 4 – Pain points

See section 4.

### Activity 5 – Data walk (new items only)

- OBS-5.1: Recorded by already exists for entries. Priya wants the same for battery swaps and asset edits, but only the latest change. Aisha doesn't want to type her name each time; Sam suggested picking it once on the phone.
- OBS-5.2: A battery replaced in a bike goes on the shelf. A battery removed and not replaced is usually quarantined.
- OBS-5.3: Two GSDs take a second battery for long cargo hires, about once a month **(invented)**. This goes to the parking lot.
- OBS-5.4: The dealer job sheet has the date, job number, bike, service type, work, parts and prices, labour, and a battery diagnostic with serial, cycle count and health percentage **(invented)**. Needed: the date, the bike, the work done, and a cycle count per battery.
- OBS-5.5: A bike that's checked in should show as in the workshop, even before its booking ends. Dave: "that's exactly the bike I'd want to spot" (closes OI-11).
- OBS-5.6: The handbook link is one fixed URL. The page must be shared as "anyone with the link" (Lewis).

### Activity 6 – Scenario walkthrough

See section 10. Key observations:

- OBS-6.1: Aisha found that S2 and S3 can't be decided without each bike's **next booking**, which may be tomorrow (DEC-17).
- OBS-6.2: Q3 settled as half-hourly, laid out to suit the screen (DEC-15). Rob suggested standard and advanced modes. Priya and Aisha rejected them because of training and discoverability.
- OBS-6.3: Nobody will print a plan every morning. The depot Wi-Fi drops more often than the internet does (DEC-21).

---

## 4. Pain points

Five people, five dots each.

| ID | Pain point | Dots | Status |
|----|------------|------|--------|
| PP-01 | Can't see the day at a glance: LibreBooking shows bike by bike, the carbon app is on a phone, so on a busy day everything goes straight on charge | 6 | Confirmed |
| PP-03a | Battery whereabouts unknown: swaps are never recorded, and Priya rings round when the dealer asks | 5 | Confirmed (part of PP-03) |
| PP-03b | Four spreadsheets, different names for the same bike, unusable on a phone | 5 | Confirmed (part of PP-03) |
| PP-04 | Faults never closed; split between the notebook and the log | 4 | New |
| PP-05 | Late check-ins leave returned bikes looking as if they're still out | 3 | New |
| PP-06 | New volunteers unsure what's safe to charge, and don't know the handbook page exists | 2 | New |
| PP-02 | Greenest hours coincide with the busiest loans | 0 | Confirmed, but seen as a fact of life. Dave: the bands next to the bookings let him spot the bike that's back over lunch |
| – | Retyping dealer job sheets | 0 | Parking lot |

---

## 5. Requirements (MoSCoW)

Must is kept to what the conference room pilot needs. Process numbers refer to the level 1 and level 2 DFDs.

| ID | Requirement | MoSCoW | Source | Process | Scenarios |
|----|-------------|--------|--------|---------|-----------|
| REQ-01 | Show a half-hourly day plan for 07:00–16:30, with each slot's carbon intensity band as colour and text | Must | Dave (A1), DEC-15 | 1, 2 | S1, S9 |
| REQ-02 | Show each bike's state per slot using the DEC-16 rule, including "Overdue – not checked in" with the due time | Must | DEC-16 | 2 | S2, S5, S11 |
| REQ-03 | Show each bike's next booking, even if it's on the next staffed day | Must | Aisha, Dave (A6), DEC-17 | 2 | S2, S3 |
| REQ-04 | On a phone held upright, show the plan as a vertical timeline, with the bikes changing state listed under each half hour | Must | Dave, Aisha (A6), DEC-15 | 2 | S1 |
| REQ-05 | Show a bike's or battery's record with the last service and the fitted battery (or battery location) first, then the history newest first | Must | Sam (A1), Dave (S7) | 3.4 | S7, S12 |
| REQ-06 | Add and edit bikes, batteries and battery types | Must | Priya | 3.1 | S10 |
| REQ-07 | Record a battery swap, starting from either the bike or the battery | Must | Dave, Aisha (A3, S4), DEC-18 | 3.2 | S4 |
| REQ-08 | Remove a battery from a bike without fitting another. Show each battery's location as fitted to a bike, on the shelf, or quarantined | Must | Dave, Sam (A5), DEC-20 | 3.2, 3.4 | S4, S12 |
| REQ-09 | Log faults, service checks and dealer services against a bike or battery; clear faults | Must | Sam (A1) | 3.3 | S5, S6, S12 |
| REQ-10 | Let staff pick their name once and remember it on the device. Stamp Recorded by and Recorded at on swaps and entries, and Last updated by and Last updated at on bikes and batteries | Must | Priya (A2, A5), DEC-19 | 3.1–3.3 | S4, S5 |
| REQ-11 | Warn, without blocking, when someone fits a quarantined battery | Must | Sam (S12), DEC-06 refined | 3.2 | S12 |
| REQ-12 | On a tablet and in print, show the plan as a grid of bikes by half hours, with a print button | Should | Sam, Priya (S8), DEC-15 | 2 | S8 |
| REQ-13 | Flag bikes with an open fault on the day plan without changing their state | Should | Sam (S5), DEC-02 refined | 2 | S5 |
| REQ-14 | Let staff enter battery cycle counts on the dealer service screen | Should | Priya (S6) | 3.1, 3.3 | S6 |
| REQ-15 | Warn when an overdue bike has another booking later today | Should | Priya (S11) | 2 | S11 |
| REQ-16 | Link to the charging rules page in the volunteer handbook | Should | Priya, Aisha (A1) | – | S2 |
| REQ-17 | Keep the last loaded day plan available on the phone when offline | Could | Dave, Priya (S8), DEC-21 | 2 | S8 |
| REQ-18 | Suggest the next free asset tag when adding a bike or battery | Could | Priya (S10) | 3.1 | S10 |
| REQ-19 | Dark theme for the depot wall display | Could | Brand identity §4 | 2 | – |
| REQ-20 | Import current assets and the last year of service and fault entries | Won't (this phase); Must at go-live | DEC-22 | 3.1, 3.3 | – |

### Candidate non-functional requirements

| ID | Requirement | Source |
|----|-------------|--------|
| NFR-01 | Record a battery swap in two taps after opening the bike or battery, usable one-handed at the counter mid-handover | Dave, Aisha (A3, S4) |
| NFR-02 | Work on a phone held upright, a tablet in landscape, and in print | DEC-15 |
| NFR-03 | Never show a band by colour alone (WCAG 2.1 AA; brand identity §4) | Brand identity |
| NFR-04 | Read from LibreBooking only; never write to it | DEC-01, DEC-18 |
| NFR-05 | No login or permissions; the name is picked, not authenticated | DEC-11, DEC-19 |
| NFR-06 | Show all times in UK local time, correct either side of the GMT/BST change | Data dictionary OI-03 |
| NFR-07 | Plain UK English in sentence case; aim for a reading age of about 12 | Brand identity §2 |

---

## 6. Decisions

Recorded in full in `claude/decision-log.md` (v0.5 at the workshop; later decisions DEC-23 onwards are in later versions).

- **Confirmed:** DEC-01, DEC-03, DEC-07 to DEC-09, DEC-11 to DEC-14
- **Refined:** DEC-02 (open fault warning), DEC-06 (quarantine warning)
- **Superseded:** DEC-10, by DEC-16
- **New:** DEC-15 to DEC-22

---

## 7. Assumptions register

**This replaces section 10 of the workshop plan as the single register for the project.**

| ID | Assumption | To confirm with | Status |
|----|------------|-----------------|--------|
| ASM-01 | Greener Miles, Cowley: 18 bikes (12 Motus, 6 GSD), 26 batteries, 16-slot rack | Priya | **Confirmed**, with corrected figures |
| ASM-02 | LibreBooking's API lists reservations with check-in times, and each resource's status (available, unavailable or hidden). It must cover reservations up to the next staffed day (DEC-17). The demo uses a stand-in | Lewis | **Confirmed** (endpoint details to follow, A-05). See the update below |
| ASM-03 | Carbon intensity comes from the regional forecast for the depot's postcode. The depot is in Cowley (OX4); earlier documents used OX3, and both fall in the same region | Priya | Open; not discussed |
| ASM-04 | Staffed 07:00–16:30 on weekdays; batteries never charged unattended; hours fixed for the proof of concept | Priya | Open; not challenged |
| ASM-05 | Fleet records hold bike status | – | Superseded by DEC-01 |
| ASM-06 | The demo uses a spring or summer date | Rob | Open |
| ASM-07 | Batteries of the same type can be swapped between bikes; the tool doesn't check | Volunteers | Open; not challenged |
| ASM-08 | Charge times held as reference data | – | Superseded by DEC-08 |
| ASM-09 | A printed plan covers outages | – | **Superseded by DEC-21** |
| ASM-10 | Retiring an asset is an admin task outside the tool | Priya | Open; not discussed |
| ASM-11 | Import current assets and the last year of entries | – | **Confirmed as DEC-22** |
| ASM-12 | Staff pick their own name honestly; there's no verification **(invented)** | Priya | New, Open |

**Update, 12 November 2026 (after the workshop, while writing the PRD).** DEC-24 extends ASM-02. The tool also reads reservations that started before today and are still running or not checked in, so that a bike never checked in, or out on a multi-day loan, doesn't show as back. Lewis hasn't confirmed the API can return these, so **ASM-02 is open again for that part**. For the proof of concept the stand-in synthesises this data (DEC-27), so it doesn't block the build. Lewis is to confirm it under A-05 before go-live, along with anything else the stand-in supplies that the API isn't known to. The rest of this record is unchanged.

---

## 8. Data dictionary changes (for v0.3)

| Item | Change | Reason |
|------|--------|--------|
| DI-025 Recorded by | Also held on Fitting. Filled from the remembered name | DEC-19 |
| DI-037 Recorded at | New. A date-time stamped by the system on Fitting and on service or fault entries | DEC-19 |
| DI-038 Last updated by | New. Text on Bike and Battery, overwritten on each edit | DEC-19 |
| DI-039 Last updated at | New. A date-time on Bike and Battery, overwritten on each edit | DEC-19 |
| Fitting, Bike asset tag | Becomes optional. Blank means the battery was removed and not replaced | DEC-20 |
| DI-040 Battery location | New, derived: "Fitted to <bike>", "On the shelf" or "Quarantined". Quarantined takes precedence (open fault) | DEC-20 |
| DI-041 Next booking | New, derived for the day plan: the start of the bike's next reservation, today or on the next staffed day | DEC-17 |
| DI-042 Open fault flag | New, derived yes/no per bike on the day plan | DEC-02 refined |
| DI-032 Resource status | "hidden" confirmed, and treated as out of service | Lewis (A7) |
| DI-034 Slot start | 19 half-hourly slots, 07:00 to 16:00 | DEC-15 |
| DI-035 Bike state | Values: out of service, in the workshop, out on loan, overdue – not checked in. Rule order per DEC-16 | DEC-16 |
| Volumes (§5) | Re-base on 18 bikes and 26 batteries | ASM-01 |
| Open items | OI-02 closed (DEC-15); OI-05 closed (DEC-20); OI-11 closed (DEC-16); OI-06 to the parking lot; OI-15 confirmed on the parking lot, adding battery health percentage | Workshop |

---

## 9. DFD changes (for v0.7)

| ID | Change | Levels | Reason |
|----|--------|--------|--------|
| DFD-01 | New read: **D3 → 2 Open faults** (for the warning flag) | 1 | DEC-02 refined |
| DFD-02 | Bookings and resource status now covers reservations up to the next staffed day; same name and composition | 0, 1 | DEC-17 |
| DFD-03 | Battery fitted: Bike asset tag optional (remove battery) | 0, 1, 2 | DEC-20 |
| DFD-04 | Battery fitted, Asset details and entry flows carry Recorded by. Processes stamp Recorded at and Last updated at | 0, 1, 2 | DEC-19 |
| DFD-05 | Day plan adds Next booking and the Open fault flag | 0, 1 | DEC-17, DEC-02 refined |
| – | No change for REQ-14. The dealer service screen sends Dealer service to 3.3 and Asset details (cycle counts) to 3.1. This is a screen design choice, not a new flow | – | DEC-07 kept |

Recheck the balancing after these changes. The boundary flows keep their names, so level 0 stays balanced. DFD-01 is internal to level 1.

---

## 10. Scenario outcomes (input to the CRP script)

| Card | Outcome | Requirements tested |
|------|---------|---------------------|
| S1 | Validated. The greenest bands and the bikes back over lunch are visible at 07:00. Q3 discussed here | REQ-01, REQ-04 |
| S2 | Changed. Needs the next booking to decide whether to wait; the bike shows as in the workshop from check-in | REQ-02, REQ-03, REQ-16 |
| S3 | Changed. Needs "next out: tomorrow 09:00" | REQ-03 |
| S4 | Validated. Swap from either end; the old battery shows on the shelf | REQ-07, REQ-08, REQ-10 |
| S5 | Validated, with an addition: an open fault flag on the day plan. Process rule: whoever is on shift with a LibreBooking login sets Unavailable when Priya is out | REQ-02, REQ-09, REQ-13 |
| S6 | Validated, with an addition: cycle counts on the same screen | REQ-09, REQ-14 |
| S7 | Validated. Last service and battery shown first | REQ-05 |
| S8 | Changed. A print button, plus the last plan kept on the phone | REQ-12, REQ-17 |
| S9 | Validated. Bands only; amber versus red is enough. "Least bad" highlight goes to the parking lot | REQ-01 |
| S10 | Validated, with an addition: suggest the next free tag | REQ-06, REQ-18 |
| S11 | Validated with the revised label and due time, plus a warning if the bike is booked again today | REQ-02, REQ-15 |
| S12 | Validated. Remove the battery; it shows as quarantined; a warning if someone picks it to fit | REQ-08, REQ-09, REQ-11 |

New scenarios for the CRP:
- **S13:** A bike returned early and checked in at 10:15 shows as in the workshop, not out on loan (DEC-16).
- **S14:** A day plan on the last Sunday in March or October shows the correct local times (NFR-06). Because the depot is staffed on weekdays, test this on the Monday after the change.

---

## 11. Parking lot

| Item | Raised by | Note |
|------|-----------|------|
| Advice on which battery to charge, and when | Aisha, Rob | Review a few months after go-live |
| Highlighting the least bad time on days without a green band | Aisha (S9) | |
| Battery charge levels | Dave | No data source |
| Smart plugs on the rack | Sam, Priya | Cost |
| Attaching job sheet photos or PDFs | Sam | Storage and backups (Lewis) |
| Claude reading dealer PDFs into the form | Rob | Priya: typing twice a month is fine |
| Dealer service type, odometer, battery health percentage, prices | Priya, Sam | OI-15 |
| Second battery on GSDs | Sam | About once a month |
| Scanning battery or bike labels | – | S4 |
| Standard and advanced view modes | Rob | Rejected for now (DEC-15) |
| Charge times, recording charge sessions, carbon saved reporting, member-facing slot suggestions, electricity prices, compatibility and duplicate-fitting checks, asset retirement, role-based permissions | Earlier | Carried over from the workshop plan |

---

## 12. Objective and success measures

**Objective (revised):**

> Give staff one screen on their phone that shows today's bikes, their next bookings and the low-carbon half hours, so they can choose greener charging times without extra effort. Give them one place to keep bike and battery records, including where every battery is.

| Measure | How | Target **(invented)** |
|---------|-----|-----------------------|
| Charging starts in a low or very low band | A tally sheet on the rack for two weeks before go-live, and for two weeks at three months; tick the band at plug-in | Up by a third |
| Spreadsheets updated since go-live | Version history | None |
| Time to answer "when was M07 last serviced?" standing next to the bike | Timed at the CRP and at three months | Under 30 seconds |
| Batteries whose recorded location matches the monthly stock check | Stock check | All 26 |
| Faults open more than 30 days | Asset records | Fewer than 3 |

Dave pointed out that the obvious measure depended on charging data the scope excludes, hence the tally sheet.

---

## 13. Actions

| ID | Action | Owner | Due **(invented)** |
|----|--------|-------|--------------------|
| A-01 | Tidy the handbook's charging page; share it as "anyone with the link"; send Rob the URL | Priya | Before the CRP |
| A-02 | Email three sample dealer job sheets | Priya | 13 Nov 2026 |
| A-03 | Add "check it in before you lean it on the wall" to the handbook | Priya | Before go-live |
| A-04 | Run the charging tally sheet for two weeks before go-live | Priya, Dave | Before go-live |
| A-05 | Confirm the API endpoints for reservations up to the next staffed day, check-in times and resource status, including "hidden"; set up a read-only API key | Lewis | Before the build |
| A-06 | Redraw the DFDs (v0.7) and recheck the balancing; update the data dictionary (v0.3) | Rob | Days 3–5 |
| A-07 | Write the PRD from sections 5 to 7 | Rob | Week 2 |
| A-08 | Write the CRP script from section 10, including S13 and S14 | Rob | Week 2 |
| A-09 | Remind staff with LibreBooking logins to set Unavailable when logging a fault that stops a bike | Priya | Ongoing |

A-05 now also covers earlier reservations (see the update in §7) and is needed before go-live rather than before the build (DEC-27).
