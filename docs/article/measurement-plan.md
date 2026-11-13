# Measurement plan – comparing three routes to a working tool

**Project:** Community e-bike library – day planner and fleet records (proof of concept)
**Document:** `docs/article/measurement-plan.md`
**Status:** Draft v0.9 (12 November 2026: all routes are branches of Rob's site repository from one starting commit; Astro upgrade (6 or later) as shared step S0; T1 on its own branch, with route A starting from it; auto memory off; a database per route (DEC-54 to DEC-58). v0.8: test equipment built first as shared step T1, outside the route totals (DEC-46). v0.7: yardstick fixed before scoring; decisions changed at the pilot are findings, not rescored (§6.1). v0.6: scoring rules for Pass, Partial, Fail and Not run added (§6.1, from CRP script CRP-OQ-07). v0.5: all routes run against shared test equipment at the pilot (DEC-29). v0.4: S9 and S14 scoring rule agreed (DEC-28). v0.3: A10 done; DEC-23 to DEC-26 applied)
**Related:** `claude/prd.md` v0.8, `claude/decision-log.md` v1.5, `claude/technical-note.md` v0.8, `claude/crp-script.md` v1.3 and `test-data/`, `claude/CLAUDE.md` and `claude/CLAUDE-planner.md`, `claude/workshop-1-notes.md`, `claude/workshop-plan.md`, `claude/data-dictionary.md` v0.6, `claude/normalisation.md` v0.3, `claude/dfds-day-planner.md` v0.9

> **Fictional example.** The organisation and its people are invented. The experiment is real: it measures the effort that different routes take to produce the same tool.

---

## 1. Purpose

The article argues that structured analysis produces systems that work. This plan gives that claim some numbers by comparing three routes to the same proof of concept:

| Route | Who | Input to Claude Code |
|-------|-----|----------------------|
| **A. Structured analysis** (this project) | Analyst using SSADM | PRD, levelled DFDs, data dictionary, normalisation, decision log, technical note, UI spec and design files, and the planner CLAUDE.md (DEC-54) |
| **B. BA-written PRD** | Skilled business analyst, no SSADM models | PRD only |
| **C. Vibe coding** | Business stakeholder | A one-paragraph prompt, then conversation |

All three routes also have the site's root CLAUDE.md, which holds only the rules that protect Rob's blog (DEC-54).

Questions to answer:

1. How much effort does each route take, in tokens and human time?
2. Where is the effort spent: before the build, during the build, or fixing things afterwards?
3. How much of what the pilot needs does each build get right?

The likely result is that route C is cheapest at the start and most expensive in rework, and route A is the reverse. The point of measuring is to find out whether that holds and by how much.

---

## 2. Measures

Record these for every step of every route.

| Measure | Unit | How to capture |
|---------|------|----------------|
| Input tokens | tokens | Claude Code: `/cost` where your plan shows it, otherwise the usage figures in the session transcript (check which your plan offers before starting). claude.ai chats: estimate (section 4) |
| Output tokens | tokens | As above |
| Model | name | The model used for the step. Keep it the same across routes |
| Human time | minutes | Stopwatch or calendar; include thinking and reviewing, not just typing |
| Correction turns | count | Prompts that ask Claude to change something it has already built ("that's wrong", "it should…") |
| Acceptance criteria met | count of total | Scored against the common yardstick (section 6) |
| Decision traps caught | count of total | Section 6.2 |
| Defects found at the pilot | count | Logged during the conference room pilot |

**Note on tokens and cost.** Cached input is charged differently from fresh input, so tokens and cost won't track each other exactly. Report tokens as the main measure and cost alongside it, if available.

---

## 3. Step log

Keep one row per step. A CSV file in the repository (`docs/article/effort-log.csv`) is easiest to total later.

```csv
route,step,date,tool,model,input_tokens,output_tokens,estimated,human_minutes,correction_turns,notes
A,Discovery role briefing,2026-11-11,claude.ai,,,,yes,,,
A,Workshop plan,2026-11-11,claude.ai,,,,yes,,,
A,Requirements workshop (role-played),2026-11-12,claude.ai,,,,yes,70,,Rob facilitated; Claude played attendees
A,PRD,2026-11-12,claude.ai,,,,yes,,,PRD v0.2; four open questions answered by Rob
```

Steps for route A:

| # | Step | Done |
|---|------|------|
| A1 | Discovery role briefing | Yes |
| A2 | Charging window research | Yes |
| A3 | Workshop plan | Yes |
| A4 | Strawman DFDs (levels 0, 1, 2) | Yes |
| A5 | Pre-workshop grill and decision log | Yes |
| A6 | Data dictionary | Yes |
| A7 | Normalisation to 3NF and logical data structure | Yes |
| A8 | Brand identity and design tokens | Yes (log separately; route B and C builds get no brand, so exclude it from the comparison totals) |
| A9 | Requirements workshop (role-played) | Yes: about 70 minutes of facilitator time, 12 Nov 2026. Tokens estimated (claude.ai) |
| A9a | Post-workshop updates: decision log v0.5, DFDs v0.7, data dictionary v0.3, normalisation v0.3 | Yes. Claude did the writing; log the review time |
| A10 | PRD | Yes: PRD v0.2, 12 Nov 2026, with four open questions answered (DEC-23 to DEC-26). The session didn't show token counts, so estimate them as in section 4 and flag them. Log Rob's review time |
| A10a | Updates from the PRD: decision log v0.6–v0.7, DFDs v0.8, data dictionary v0.4–v0.5, measurement plan v0.3–v0.4, workshop notes v1.1, PRD v0.3–v0.4 | Yes. Claude did the writing; log the review time |
| A10b | Technical note, UI spec, design files and CLAUDE.md files | Yes. Claude did the writing; log the review time |
| A11 | Claude Code build, on the `route-a` branch from the tip of T1 (DEC-55). Includes loading D1 to D3 from `test-data/`, which needs route A's schema | |
| A12 | Conference room pilot and fixes | |

Shared steps, done before any route is built or scored:

| # | Step | Done |
|---|------|------|
| S0 | Upgrade the site to Astro 6 or later on `main` and check the blog (DEC-51, DEC-56). Then make the starting commit (§5.1) | |
| T1 | Test equipment, on the branch `t1-test-equipment` from the starting commit (DEC-46, DEC-55): the LibreBooking stand-in, request log, demo clock, tester console, and loading and resetting the stand-in's data and the recorded forecasts file, built from PRD §7.1 and §7.2 and `test-data/`. Run the stand-in parts of the CRP script's set-up steps (SU.01 to SU.09) and resets before route C starts | |

Log S0 and T1 separately, like A8. They serve all three routes, so leave them out of every route's totals in §7, and report T1 in the article as the cost of the yardstick.

---

## 4. Estimating the steps already done

Steps A1 to A10b weren't measured in tokens at the time. Estimate them and flag every figure as an estimate in the article.

1. For each step, gather the chat transcript(s) and the documents produced.
2. Count characters. As a rough guide, English text is about 4 characters per token. Mermaid and tables come out a little higher in tokens per character, so treat the result as a range of plus or minus 25%.
3. Output tokens ≈ the length of Claude's replies, including documents written.
4. Input tokens are larger than the visible text, because each turn re-sends the conversation and the project documents. Estimate it as the sum, over turns, of the conversation length so far plus the attached documents. If that's too fiddly, report output tokens only for A1 to A10b and say so.
5. Estimate human time from calendar entries and memory, rounded to the nearest 15 minutes. A9 was timed.

From S0 onwards, measure directly.

---

## 5. Experiment protocol for routes B and C

### 5.1 Fair conditions

- Same model, same Claude Code version, same machine.
- **One repository, one starting commit (DEC-47, DEC-54).** Every route is built in Rob's site repository. The starting commit on `main` holds the blog on Astro 6 or later (S0), the root CLAUDE.md with the site rules only, and `.claude/settings.json` with auto memory off (DEC-57). Nothing else from this project is in it: no analysis documents, no planner CLAUDE.md, no design files and no test data.
- **Branches.** Routes C and B each build on their own branch from the starting commit. Route A builds on `route-a`, branched from the tip of `t1-test-equipment` (DEC-55), which adds the documents, the planner CLAUDE.md and the test equipment.
- **Fresh sessions, no carried memory.** Each route starts a new Claude Code session. Auto memory is off, and Rob's user-level `~/.claude/CLAUDE.md` is empty or the same for every route (DEC-57).
- **A database per route.** Route A uses the development Supabase project it shares with the stand-in. If a B or C build asks for a hosted database, it gets a new project of its own (DEC-58).
- The same build instruction for all three routes, so that only the input differs (section 5.4).
- Run route C first, then B, then A's build. Each later run is likely to be informed by the earlier ones. Going from least to most structured limits how much the analysis leaks into the weaker routes.
- The same test equipment for every route at the pilot: the LibreBooking stand-in, the demo clock and the recorded forecasts (DEC-29). It's built first, as step T1, before route C (DEC-46). Routes B and C don't see it during their builds; it's used only to score them. Route A starts from it (DEC-55), which is a known advantage (§8).

### 5.2 Who plays the stakeholder

Rob knows the answers to every question the analysis raised, which would flatter routes B and C. Ideally a colleague who hasn't seen the decision log plays the stakeholder. If Rob plays the part:

- Answer only from the stakeholder brief in section 5.5, as Priya, the coordinator (invented).
- If Claude asks something the brief doesn't cover, answer the way a busy coordinator would on the spot, and note the question in the log. Don't draw on the decision log or the workshop notes.
- Report problems in stakeholder language ("the bike that's still out shows as available"), not as fixes ("derive the state from the reservation end time").

### 5.3 Stop rule

Stop a route when the first of these happens:

- every Must criterion in the yardstick passes,
- 3 hours of human time,
- 40 prompts.

Record which one stopped it.

### 5.4 Build instruction (identical for all routes)

> Build a working web application from the material below. It must run locally and work on a phone screen. Ask me if anything is unclear before you start.

### 5.5 Route C: the vibe-coding prompt

The stakeholder types this, with no other material:

> We're a small community e-bike library with about 20 bikes. Our volunteers want to charge the batteries when the electricity is greenest, and we want to stop using our four spreadsheets for tracking bikes, batteries, services and faults. We use LibreBooking for members and bookings. Can you build us an app that does this?

Stakeholder brief for answering follow-up questions (what Priya knows without any analysis):

- The workshop is staffed 07:00 to 16:30. Volunteers use a tablet and their phones.
- Members book and pay in LibreBooking; the library doesn't want that changed.
- The spreadsheets cover bikes, batteries, services and faults. Batteries move between bikes.
- They've heard of the National Grid carbon intensity forecast but haven't used it.

### 5.6 Route B: the BA-written PRD

1. Timebox 2 hours of human time to write a PRD as a skilled BA would: a one-hour conversation with the stakeholder (using the same brief), then the PRD. User stories with acceptance criteria are fine; no DFDs, data dictionary or normalisation.
2. Claude may help write it, in a fresh chat. Log its tokens as step B1.
3. Give the PRD to Claude Code with the build instruction. Log the build as B2 and the fixes after scoring as B3.

---

## 6. Common yardstick

### 6.1 Acceptance criteria

Score all three builds against the Must requirements and their acceptance criteria in route A's PRD (`docs/prd.md`, REQ-01 to REQ-11), the non-functional requirements that pilot readiness needs (NFR-01 to NFR-11 and NFR-13 to NFR-20, DEC-52), and the conference room pilot scenarios (S1 to S14), using the PRD's sample data (Appendix A). The steps, test data and score sheet are in the CRP script (`docs/crp-script.md`) and `test-data/`. Each criterion is Pass, Partial or Fail. Score each build before any fixes, and again at the stop point.

**Scoring rules** **(invented)** for this project, agreed with the CRP script (§8.1):

- **Pass:** the result matches the expected result.
- **Partial:** the core of the result is right but a detail is missing or different (for example wording, or one element of several), and it wouldn't lead staff to a wrong decision. Also the DEC-28 case below.
- **Fail:** the result is wrong, missing, or would mislead staff.
- **Not run:** the step couldn't be run. Counts as Fail for readiness; report it separately.
- A criterion's score is the lowest score of the steps that test it (Fail below Partial below Pass).
- Where a Must criterion includes a part that needs a Should requirement (for example AC-04.4's fault flag and warning), the Must part is scored with the criterion and the Should part with its own requirement.

**A fixed yardstick.** Score every route against the PRD and the decision log as they stand before the first route is scored, including the assumed decisions DEC-36 to DEC-43. The team confirms those at the end of the pilot (CRP script §10.3). If the team changes one, log the change as a pilot finding and a change for after the pilot; don't rescore any route, so the three routes stay comparable.

**Scenarios (DEC-25).** A scenario runs cleanly when every step that tests a Must passes. Steps that test a Should or Could requirement (REQ-12 to REQ-18) are scored and reported separately, and don't count towards a scenario passing. This affects S2, S5, S6, S8, S10 and S11.

**Scenario dates and test equipment (DEC-26, DEC-28, DEC-29).** The scenarios run on fixed dates: Tue 16 June 2026, Tue 8 December 2026, and the clock-change Mondays (30 March and 26 October 2026). At the pilot, every route's build is pointed at the same LibreBooking stand-in, demo clock and recorded forecasts. These are test equipment, not part of the build being scored, so all three routes are tested on the same data and dates. Record any configuration a build needs to connect to them, and anything it can't connect to. On any build that still can't be made to run on the scenario date, score S9 and S14 as Partial, and say so in the article (DEC-28). Apply this the same way to every route.

This favours route A because it wrote the yardstick. Say so in the article; the counterweight is that the PRD reflects what the users agreed they need, which is the test any route has to meet.

### 6.2 Decision traps

These are things the analysis and the workshop surfaced that a build can easily get wrong. They test whether each route finds them, and when.

| Trap | Source | A correct build… |
|------|--------|------------------|
| Bike status mastered in two places | DEC-01 | reads availability from LibreBooking and holds no status of its own |
| Writing to LibreBooking, or a second check-out | Scope, DEC-02, DEC-18 | only reads from LibreBooking and has no check-out or check-in of its own |
| Overdue bikes shown as available | DEC-16 | shows "Overdue – not checked in" with the due time once a reservation's due time has passed without a check-in |
| Bikes due back later shown as already overdue | DEC-23 | shows a bike whose due time hasn't passed yet as in the workshop in the slots after its booking, not as overdue |
| Bikes still out from an earlier day shown as back | DEC-24 | reads earlier reservations that are still running or not checked in, and shows those bikes as out on loan or overdue |
| Early returns shown as still out | DEC-16 | shows a bike checked in before its reservation ends as in the workshop |
| Day plan limited to today | DEC-17 | shows each bike's next booking, including the next staffed day |
| The tool deciding when to charge | Scope | shows the forecast bands and leaves the decision to staff |
| Stored fault status disagreeing with the cleared date | DEC-14 | derives open or closed from Cleared date |
| Forecast period end stored separately | DEC-13 | derives the end from Period start plus 30 minutes |
| Batteries treated as part of the bike | Data dictionary, DEC-20 | records which battery is fitted to which bike, lets it change, and shows a replaced battery as on the shelf |
| Quarantined battery fitted silently | DEC-06 refined | warns, without blocking, when someone fits a battery with an open fault |
| Logins and permissions | DEC-11, DEC-19 | has no login; staff pick a name once and changes are stamped with it |
| Clock change | NFR-06, S14 | shows the right half hours either side of the change between GMT and BST |

For each trap, record whether it was caught before building, caught by Claude asking, found in testing, or missed.

---

## 7. Reporting in the article

One summary table, with estimates flagged:

| Route | Tokens before build | Tokens in build and fixes | Human hours | Correction turns | Must criteria met (first build / final) | Traps caught |
|-------|--------------------|---------------------------|-------------|------------------|----------------------------------------|--------------|
| A | | | | | | |
| B | | | | | | |
| C | | | | | | |

A stacked bar of tokens by phase (analysis, build, rework) for each route will show the main point at a glance. Report S0 and T1 under the table, as shared costs.

---

## 8. Limits

- One run per route. Model output varies between runs, so treat differences of less than about 20% as noise.
- Rob's knowledge may leak into routes B and C, even with the protocol above.
- Steps A1 to A10b are estimated in tokens; A9's human time was measured. The rest are measured.
- The yardstick comes from route A.
- The workshop was role-played, with Claude as the attendees. Some of its findings may be ones Claude would also raise when asked questions in routes B and C, which could narrow the gap between routes.
- Tokens in claude.ai and in Claude Code are counted differently, and claude.ai doesn't show them. Comparisons between routes are fairer for the build phase, which happens in Claude Code for all three.
- The test equipment (stand-in, demo clock, recorded forecasts) was designed alongside route A's analysis, and route A's build starts from it (DEC-55), so route A's build is likely to connect to it more easily than B's or C's (DEC-29). Report the configuration each build needed, and say so in the article.
- Every route has the site's root CLAUDE.md (DEC-54). It holds only the rules that protect the blog, but it does tell routes B and C to keep new work in its own folders and route, which a fresh repository wouldn't. Say so in the article.
- S9 and S14 are scored Partial on any build that can't be set to the scenario date (DEC-28). This may understate a build that would handle the date correctly if it could be set; say so in the article.
