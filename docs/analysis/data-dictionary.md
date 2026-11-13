# Data dictionary – Day planner and fleet records

**Project:** Community e-bike library – day planner and fleet records (proof of concept)
**Document:** `docs/analysis/data-dictionary.md`
**Status:** v0.6 (12 November 2026: DI-035 rules 3 and 4 read "not checked in" against the slot's end, DEC-30. v0.5: OI-01 updated for DEC-27, synthetic stand-in data. v0.4 applied DEC-23, DEC-24 and DEC-26). References to other documents, DI-008's example and the "Now" convention (DEC-59) updated 12 November 2026; no change to elements, structures or flows
**Method:** SSADM data dictionary for the required system: data elements, data structures, data flows and data stores
**Related:** `docs/analysis/dfds.md` v0.9 and `diagrams/dfd/*.mmd` (DFDs), `docs/analysis/decision-log.md` v1.5 (DEC-01 to DEC-61), `docs/analysis/workshop-1/notes.md` (assumptions register §7, scenarios S1–S14), `docs/analysis/normalisation.md` v0.3, `docs/prd.md` v0.8, `docs/crp-script.md` v1.3, `docs/technical-note.md` v0.8. The workshop plan (data item card §8) and the discovery session are kept in the project, not the repository

> **Fictional example.** The organisation, its people and its data are invented for an article and demo. Anything marked **(invented)** is illustrative detail, such as asset tag formats, field lengths and volumes.

**Changes from v0.5 (CRP script):**

- **DI-035 Bike state:** rules 3 and 4 read "not checked in" against the slot's end. After a late check-in, the slots between the due time and the check-in still read overdue (DEC-30)
- **OI-19:** note added on late check-ins
- No new elements, structures or flows

**Changes from v0.3 (PRD drafting):**

- **DI-035 Bike state:** rule 4 applies only once the due time has passed; until then, later slots read "in the workshop" (DEC-23)
- **DF-01 Bookings and resource status:** also carries reservations that started before today and are still running or not checked in (DEC-24). Same composition
- **DI-030 Reservation end:** shown with its day when the due time is on an earlier day (DEC-24)
- **DI-033 Plan date** and **DI-043 Rebooked while overdue:** notes on the demo clock (DEC-26) and on "overdue now" (DEC-23)
- **Open items:** OI-01 updated; OI-19 new
- No new elements, structures or flows

**Changes in v0.3 (workshop 1):**

- **New elements:**
  - DI-037 Recorded at, DI-038 Last updated by and DI-039 Last updated at (DEC-19)
  - DI-040 Battery location, derived (DEC-20)
  - DI-041 Next booking, derived (DEC-17)
  - DI-042 Open fault flag, derived (DEC-02 refined)
  - DI-043 Rebooked while overdue, derived (REQ-15)
- **Changed elements:**
  - Recorded by (DI-025) is now also held on Fitting
  - Bike asset tag (DI-007) is optional on Fitting, where blank means removed (DEC-20)
  - DI-032 confirms "hidden"
  - DI-034 is now 19 half-hourly slots (DEC-15)
  - DI-035 uses the revised rule and values (DEC-16)
- **New flows:**
  - DF-24 Open bike faults (D3 → 2)
  - DF-25 Open battery faults (D3 → 3.2)
  - DF-26 Existing assets (D2 → 3.1)
- **Renamed flows (MM-03 resolved):**
  - DF-14 is now Asset and fitting updates
  - DF-16 and DF-22 are now Asset and fitting details
- **Other changes:**
  - DF-01 covers reservations up to the next staffed day (DEC-17)
  - DF-03 Day plan has a new composition
  - Volumes are re-based on 18 bikes and 26 batteries (ASM-01)
  - All mismatches MM-01 to MM-08 are resolved in DFDs v0.7
  - OI-02, OI-05 and OI-11 are closed; OI-06 is moved to the parking lot; OI-16 to OI-18 are new

---

## 1. Conventions

| Item | Convention |
|------|------------|
| Element IDs | DI-001 to DI-043. DI-001 to DI-036 match the data item cards in the workshop plan (§8) |
| Flow IDs | DF-01 to DF-26, used only in this dictionary to tell flows apart **(invented)** |
| Formats | Text, number, date, date-time, time, yes/no, list |
| Dates | `YYYY-MM-DD` |
| Date-times in D1 | `YYYY-MM-DDTHH:MMZ` in UTC, as supplied by the Carbon Intensity API. Process 2 converts them to UK local time for the day plan |
| Other date-times | `YYYY-MM-DD HH:MM` in UK local time (Europe/London) |
| Mandatory or optional | Mandatory: the record can't be saved without it. Optional: it may be blank, and the entry says what happens then. Conditional: mandatory only in the stated case |
| LibreBooking elements | Supplied by LibreBooking's API (ASM-02, confirmed by Lewis). Exact endpoints to follow (action A-05) |
| Derived | Worked out by a process from other elements; never entered or stored |
| Names | Recorded by, Cleared by and Last updated by come from the name picked once on the device (DEC-19). Free text; there's no staff store |
| "Now" | The system clock. In the demo, the stand-in's demo clock (DEC-26). Wherever this dictionary says a time is stamped "from the system clock", it means this "now". The one exception is process 1, which always uses the real system clock to choose which forecast periods to fetch and to stamp Retrieved at (DEC-59) |

**Composition notation (SSADM):**

| Symbol | Meaning |
|--------|---------|
| `=` | is composed of |
| `+` | and |
| `[ a \| b ]` | either a or b |
| `{ }` | repeats; zero or more times unless stated |
| `( )` | optional |

---

## 2. Data elements

### 2.1 Element index

| ID | Name | Format | Structure or flow group |
|----|------|--------|-------------------------|
| DI-001 | Period start | Date-time | Forecast period |
| DI-002 | Period end | Date-time | Carbon intensity forecast (flow only; derived for D1, DEC-13) |
| DI-003 | Region | Text | Forecast period |
| DI-004 | Forecast intensity | Number | Forecast period |
| DI-005 | Index band | List | Forecast period; Day plan slot |
| DI-006 | Retrieved at | Date-time | Forecast period |
| DI-007 | Bike asset tag | Text | Bike; Fitting (optional); Service or fault entry |
| DI-008 | LibreBooking resource ID | Number | Bike; Reservation; LibreBooking resource |
| DI-009 | Make | Text | Bike |
| DI-010 | Model | Text | Bike |
| DI-011 | Frame size | Text | Bike |
| DI-012 | Bike serial number | Text | Bike |
| DI-013 | Bike purchase date | Date | Bike |
| DI-014 | Battery asset tag | Text | Battery; Fitting; Service or fault entry |
| DI-015 | Bosch serial | Text | Battery |
| DI-016 | Battery type | List | Battery; Battery type |
| DI-017 | Battery purchase date | Date | Battery |
| DI-018 | Cycle count | Number | Battery |
| DI-019 | Capacity | Number | Battery type |
| DI-020 | Fitted from | Date-time | Fitting |
| DI-021 | Entry ID | Number | Service or fault entry |
| DI-022 | Entry type | List | Service or fault entry |
| DI-023 | Entry date | Date | Service or fault entry |
| DI-024 | Description | Text | Service or fault entry |
| DI-025 | Recorded by | Text | Service or fault entry; Fitting |
| DI-026 | Fault status | List | Asset record (flow only, derived, DEC-14) |
| DI-027 | Cleared date | Date | Service or fault entry |
| DI-028 | Cleared by | Text | Service or fault entry |
| DI-029 | Reservation start | Date-time | Reservation (flow only) |
| DI-030 | Reservation end | Date-time | Reservation (flow only) |
| DI-031 | Checked in at | Date-time | Reservation (flow only) |
| DI-032 | Resource status | List | LibreBooking resource (flow only) |
| DI-033 | Plan date | Date | Day plan (flow only) |
| DI-034 | Slot start | Time | Day plan slot (flow only) |
| DI-035 | Bike state | List | Day plan slot (flow only, derived) |
| DI-036 | Quarantined | Yes/no | Battery record (flow only, derived) |
| DI-037 | Recorded at | Date-time | Service or fault entry; Fitting |
| DI-038 | Last updated by | Text | Bike; Battery |
| DI-039 | Last updated at | Date-time | Bike; Battery |
| DI-040 | Battery location | Text | Battery record; Bike record (flow only, derived) |
| DI-041 | Next booking | Date-time | Day plan bike (flow only, derived) |
| DI-042 | Open fault flag | Yes/no | Day plan bike (flow only, derived) |
| DI-043 | Rebooked while overdue | Yes/no | Day plan bike (flow only, derived) |

### 2.2 Forecast (D1)

**DI-001 Period start**

| Field | Value |
|-------|-------|
| Description | Start of a half-hour forecast period |
| Format | Date-time |
| Length or units | UTC, to the minute |
| Allowed values | On the hour or half hour |
| Mandatory or optional | Mandatory. A period without a start isn't stored |
| Source | Carbon Intensity API, through process 1 |
| Owner | Carbon Intensity API (external) |
| Example | 2026-06-16T11:30Z (12:30 BST) |
| Stores and flows | D1; DF-02 Carbon intensity forecast; DF-11, DF-12 Forecast periods |

**DI-002 Period end**

| Field | Value |
|-------|-------|
| Description | End of a half-hour forecast period |
| Format | Date-time |
| Length or units | UTC, to the minute |
| Allowed values | Period start plus 30 minutes |
| Mandatory or optional | Mandatory in the API flow. Not stored (DEC-13) |
| Source | Carbon Intensity API |
| Owner | Carbon Intensity API (external) |
| Example | 2026-06-16T12:00Z |
| Stores and flows | DF-02 Carbon intensity forecast only |
| Notes | Always Period start plus 30 minutes, so it depends on part of D1's key. Process 1 doesn't store it; process 2 works out each period's end from Period start (DEC-13, normalisation P-01) |

**DI-003 Region**

| Field | Value |
|-------|-------|
| Description | The Carbon Intensity API region that covers the depot's postcode (ASM-03) |
| Format | Text |
| Length or units | Up to 30 characters |
| Allowed values | A region name as published by the API |
| Mandatory or optional | Mandatory |
| Source | Carbon Intensity API, through process 1 |
| Owner | Carbon Intensity API (external) |
| Example | South England (the depot is in Cowley, OX4; earlier documents used OX3, in the same region) |
| Stores and flows | D1; DF-02 Carbon intensity forecast; DF-11 Forecast periods (1 → D1) |
| Notes | The depot's postcode, which selects the region, sits in process 1's logic and isn't an element |

**DI-004 Forecast intensity**

| Field | Value |
|-------|-------|
| Description | Forecast carbon intensity of electricity for the period |
| Format | Number (whole) |
| Length or units | gCO2/kWh; 0 to 999 **(invented upper limit)** |
| Allowed values | Whole number, 0 or more |
| Mandatory or optional | Mandatory. If the API returns no forecast for a period, the period isn't stored and the day plan shows "No forecast" for that slot **(invented)** |
| Source | Carbon Intensity API, through process 1 |
| Owner | Carbon Intensity API (external) |
| Example | 118 |
| Stores and flows | D1; DF-02 Carbon intensity forecast; DF-11, DF-12 Forecast periods |
| Notes | Not shown on the day plan, which shows the band only |

**DI-005 Index band**

| Field | Value |
|-------|-------|
| Description | Forecast carbon intensity band for the period, as published by the Carbon Intensity API. Shown on the day plan as a text label and a colour, never colour alone |
| Format | List |
| Length or units | Up to 9 characters |
| Allowed values | very low, low, moderate, high, very high |
| Mandatory or optional | Mandatory in D1. If the API returns no band for a period, the period isn't stored and the day plan shows "No forecast" for that slot **(invented)** |
| Source | Carbon Intensity API, through process 1 |
| Owner | Carbon Intensity API (external); library staff don't edit it |
| Example | low |
| Stores and flows | D1; DF-02 Carbon intensity forecast; DF-11, DF-12 Forecast periods; DF-03 Day plan |
| Notes | Day plan slots are half-hourly (DEC-15), so each slot has exactly one band. Colours are in the brand identity, §4 |

**DI-006 Retrieved at**

| Field | Value |
|-------|-------|
| Description | When process 1 last fetched the forecast for this period |
| Format | Date-time |
| Length or units | UTC, to the minute |
| Allowed values | Not in the future |
| Mandatory or optional | Mandatory; set by process 1 from the system clock |
| Source | Process 1 |
| Owner | Process 1 (system) |
| Example | 2026-06-16T06:30Z |
| Stores and flows | D1; DF-11 Forecast periods (1 → D1) |
| Notes | Written but not read by any process on the DFDs. Kept so a stale forecast can be spotted. For the demo's recorded forecasts (DEC-26), it holds the time the recording was loaded. Always the real system clock, never the demo clock (DEC-59) |

### 2.3 Bike (D2)

**DI-007 Bike asset tag**

| Field | Value |
|-------|-------|
| Description | The library's unique identifier for a bike, on a label on the frame. It replaces the different names used in the spreadsheets ("M07", "Motus 7", "Grand Tour 7") |
| Format | Text |
| Length or units | 3 characters **(invented)** |
| Allowed values | One capital letter for the bike family (M = Raleigh Motus, G = Tern GSD, D = donated) followed by two digits; must be unique **(invented)**. See OI-16 for the donated bike |
| Mandatory or optional | Mandatory on Bike and on service or fault entries about a bike. Optional on Fitting: blank means the battery was removed and not replaced (DEC-20) |
| Source | Library staff, through Asset details (3.1) and Battery fitted (3.2) |
| Owner | Coordinator |
| Example | M07 |
| Stores and flows | D2 (Bike, Fitting), D3; most flows except DF-01, DF-02, DF-11, DF-12 and DF-25 |

**DI-008 LibreBooking resource ID**

| Field | Value |
|-------|-------|
| Description | The ID LibreBooking gives the bike as a resource. It links fleet records to bookings and availability (DEC-01) |
| Format | Number (whole) |
| Length or units | Positive whole number |
| Allowed values | Must be unique across bikes and match a resource in LibreBooking |
| Mandatory or optional | Mandatory. A bike without it can't appear on the day plan |
| Source | LibreBooking (Lewis sets up resources); entered by Library staff through Asset details (3.1) |
| Owner | Lewis (LibreBooking admin) |
| Example | 107 (M07 in the sample data) **(invented)** |
| Stores and flows | D2 (Bike); DF-01 Bookings and resource status; DF-04, DF-18 Asset details; DF-14 Asset and fitting updates; DF-16, DF-22 Asset and fitting details; DF-26 Existing assets; DF-10 Asset record; DF-13 Bike list |
| Notes | A wrong value drops the bike off the day plan, as happened to M07 (workshop OBS-2.2). Last updated by and Last updated at show who changed it |

**DI-009 Make**

| Field | Value |
|-------|-------|
| Description | The bike's manufacturer |
| Format | Text |
| Length or units | Up to 30 characters **(invented)** |
| Allowed values | Any text |
| Mandatory or optional | Mandatory. For a donated bike, use the brand on the frame, or "Unknown" |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | Raleigh |
| Stores and flows | D2 (Bike); Bike details in DF-04, DF-14, DF-16, DF-18, DF-22, DF-26; DF-10 Asset record |

**DI-010 Model**

| Field | Value |
|-------|-------|
| Description | The bike's model name |
| Format | Text |
| Length or units | Up to 40 characters **(invented)** |
| Allowed values | Any text |
| Mandatory or optional | Mandatory |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | Motus Grand Tour |
| Stores and flows | As DI-009 |

**DI-011 Frame size**

| Field | Value |
|-------|-------|
| Description | The bike's frame size as given by the manufacturer |
| Format | Text |
| Length or units | Up to 10 characters **(invented)** |
| Allowed values | Any text, for example S, M, L or 50 cm |
| Mandatory or optional | Optional. Blank for one-size bikes such as the Tern GSD; the asset record shows "One size" |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | M |
| Stores and flows | As DI-009 |

**DI-012 Bike serial number**

| Field | Value |
|-------|-------|
| Description | The manufacturer's frame serial number |
| Format | Text |
| Length or units | Up to 30 characters **(invented)** |
| Allowed values | Any text; unique when present |
| Mandatory or optional | Optional. May be missing for a donated bike; the asset record shows "Not recorded" |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | RL22-0047316 **(invented)** |
| Stores and flows | As DI-009 |

**DI-013 Bike purchase date**

| Field | Value |
|-------|-------|
| Description | Date the library bought the bike, or received it if donated |
| Format | Date |
| Length or units | – |
| Allowed values | Not in the future |
| Mandatory or optional | Optional. Blank if unknown; the asset record shows "Not recorded" |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | 2023-03-14 |
| Stores and flows | As DI-009 |

### 2.4 Battery and battery type (D2)

**DI-014 Battery asset tag**

| Field | Value |
|-------|-------|
| Description | The library's unique identifier for a battery, on a label on the battery |
| Format | Text |
| Length or units | 4 characters **(invented)** |
| Allowed values | "B-" followed by two digits; must be unique **(invented)**. Process 3.1 suggests the next free number (REQ-18) |
| Mandatory or optional | Mandatory; a battery can't be saved without it |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | B-17 |
| Stores and flows | D2 (Battery, Fitting), D3; most flows except DF-01 to DF-03, DF-11 to DF-13 and DF-24 |

**DI-015 Bosch serial**

| Field | Value |
|-------|-------|
| Description | The serial number on the battery's Bosch label |
| Format | Text |
| Length or units | Up to 20 characters **(invented)** |
| Allowed values | Any text; unique when present |
| Mandatory or optional | Optional. Missing for some older batteries and for a non-Bosch battery; the asset record shows "Not recorded" |
| Source | Battery label, entered by Library staff through Asset details (3.1) |
| Owner | Coordinator |
| Example | 4471932088 **(invented)** |
| Stores and flows | D2 (Battery); Battery details in DF-04, DF-14, DF-16, DF-18, DF-22, DF-26; DF-10 Asset record |
| Notes | The name doesn't fit a non-Bosch battery; see N-15 |

**DI-016 Battery type**

| Field | Value |
|-------|-------|
| Description | The battery's model. Identifies a Battery type record and is held on each Battery |
| Format | List (values held in the Battery type structure) |
| Length or units | Up to 40 characters **(invented)** |
| Allowed values | At the start: Bosch PowerTube 500, Bosch PowerPack 400, Bosch PowerPack 500, Donated bike 36 V battery **(invented name)**. New types are added through Asset details (3.1) |
| Mandatory or optional | Mandatory on Battery and Battery type |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | Bosch PowerPack 500 |
| Stores and flows | D2 (Battery, Battery type); DF-04, DF-14, DF-16, DF-18, DF-22, DF-26; DF-10 Asset record |

**DI-017 Battery purchase date**

| Field | Value |
|-------|-------|
| Description | Date the library bought the battery. Answers "how old is this battery?" (S7) |
| Format | Date |
| Length or units | – |
| Allowed values | Not in the future |
| Mandatory or optional | Optional. Missing for some older batteries; the asset record shows "Not recorded" |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | 2025-02-03 |
| Stores and flows | D2 (Battery); Battery details flows as DI-015; DF-10 Asset record |

**DI-018 Cycle count**

| Field | Value |
|-------|-------|
| Description | Number of full charge cycles the battery has done, as read by the Bosch dealer's diagnostic tool. One latest value, overwritten each time, with no history (DEC-07) |
| Format | Number (whole) |
| Length or units | Cycles; 0 to 9,999 **(invented)** |
| Allowed values | Whole number, 0 or more |
| Mandatory or optional | Optional. Blank until the battery's first dealer diagnostic, and always blank for a non-Bosch battery. The asset record shows "Not yet read" |
| Source | Dealer job sheet, entered by Library staff through Asset details (3.1). The dealer service screen can capture it alongside the service (REQ-14), sending it to 3.1 |
| Owner | Coordinator |
| Example | 312 |
| Stores and flows | D2 (Battery); Battery details flows as DI-015; DF-10 Asset record |

**DI-019 Capacity**

| Field | Value |
|-------|-------|
| Description | The battery type's rated energy capacity |
| Format | Number (whole) |
| Length or units | Wh; 1 to 2,000 **(invented upper limit)** |
| Allowed values | Whole number above 0 |
| Mandatory or optional | Optional. Blank if unknown; the asset record shows "Not recorded" |
| Source | Manufacturer's specification, entered by Library staff through Asset details (3.1) |
| Owner | Coordinator |
| Example | 500 |
| Stores and flows | D2 (Battery type); Battery type details in DF-04, DF-14, DF-16, DF-18, DF-22, DF-26; DF-10 Asset record |
| Notes | Held per type, not per battery as in today's battery register (N-05) |

### 2.5 Fitting (D2)

**DI-020 Fitted from**

| Field | Value |
|-------|-------|
| Description | When a battery was fitted to a bike, or removed from one without a replacement |
| Format | Date-time |
| Length or units | UK local time, to the minute |
| Allowed values | Not in the future. There's no check against other fittings (DEC-06) |
| Mandatory or optional | Mandatory; defaults to now |
| Source | Library staff, through Battery fitted (3.2) |
| Owner | Coordinator |
| Example | 2026-06-16 08:05 |
| Stores and flows | D2 (Fitting); DF-05 Battery fitted; DF-19 Battery fitting; DF-14 Asset and fitting updates; DF-16, DF-22 Asset and fitting details; DF-10 Asset record |
| Notes | The battery location rule (DI-040) and a bike's current battery both use the latest fitting |

### 2.6 Service and fault entries (D3), and change stamps

**DI-021 Entry ID**

| Field | Value |
|-------|-------|
| Description | System-assigned number that identifies one service or fault entry. Lets staff say which fault they are clearing |
| Format | Number (whole) |
| Length or units | Sequential from 1 **(invented)** |
| Allowed values | Unique; never reused |
| Mandatory or optional | Mandatory; assigned by process 3.3 |
| Source | Process 3.3 |
| Owner | Process 3.3 (system) |
| Example | 1042 **(invented)** |
| Stores and flows | D3; DF-07 Fault cleared; DF-09 Dealer service; DF-10 Asset record; DF-15, DF-21 Service and fault entries; DF-17, DF-23 Service and fault history; DF-20 Open faults; DF-24 Open bike faults; DF-25 Open battery faults |

**DI-022 Entry type**

| Field | Value |
|-------|-------|
| Description | What kind of entry this is |
| Format | List |
| Length or units | Up to 14 characters |
| Allowed values | service check, dealer service, fault |
| Mandatory or optional | Mandatory; set by process 3.3 from the flow that brought the entry in |
| Source | Process 3.3 |
| Owner | Coordinator |
| Example | fault |
| Stores and flows | D3; DF-10 Asset record; DF-15, DF-21 Service and fault entries; DF-17, DF-23 Service and fault history |

**DI-023 Entry date**

| Field | Value |
|-------|-------|
| Description | The date of the check or service, or the date a fault was reported |
| Format | Date |
| Length or units | – |
| Allowed values | Not in the future |
| Mandatory or optional | Mandatory; defaults to today |
| Source | Library staff, through Fault report, Service check or Dealer service (3.3) |
| Owner | Coordinator |
| Example | 2026-06-18 |
| Stores and flows | D3; DF-06, DF-08, DF-09; DF-10 Asset record; DF-15, DF-21; DF-17, DF-23; DF-20 Open faults; DF-25 Open battery faults |
| Notes | For a dealer service, the date on the job sheet, which may be earlier than Recorded at |

**DI-024 Description**

| Field | Value |
|-------|-------|
| Description | What was checked, done or found, in the words of the person recording it |
| Format | Text |
| Length or units | Up to 500 characters **(invented)** |
| Allowed values | Any text |
| Mandatory or optional | Mandatory; an entry can't be saved without it |
| Source | Library staff, through Fault report, Service check or Dealer service (3.3) |
| Owner | Coordinator |
| Example | Front brake pads worn below 1.5 mm |
| Stores and flows | D3; DF-06, DF-08, DF-09; DF-10 Asset record; DF-15, DF-21; DF-17, DF-23; DF-20 Open faults; DF-25 Open battery faults |
| Notes | For a dealer service, start with the service type ("Interim: …"). Service type as its own element is on the parking lot (OI-15) |

**DI-025 Recorded by**

| Field | Value |
|-------|-------|
| Description | Name of the person who made the entry or recorded the fitting |
| Format | Text |
| Length or units | Up to 50 characters **(invented)** |
| Allowed values | Any text; not checked against a list. Filled from the name picked on the device (DEC-19) |
| Mandatory or optional | Mandatory. Imported entries with no name get "Imported" (OI-09) |
| Source | Library staff, through Fault report, Service check, Dealer service (3.3) and Battery fitted (3.2) |
| Owner | Coordinator |
| Example | Dave Morgan |
| Stores and flows | D3; D2 (Fitting); DF-05, DF-06, DF-08, DF-09; DF-19 Battery fitting; DF-10 Asset record; DF-15, DF-21; DF-17, DF-23 |

**DI-026 Fault status** (derived)

| Field | Value |
|-------|-------|
| Description | Whether a fault is still open. An open fault against a battery means the battery is quarantined (DEC-09) |
| Format | List |
| Length or units | Up to 6 characters |
| Allowed values | open (Cleared date blank), closed (Cleared date filled) |
| Mandatory or optional | Shown for every fault on an asset record; not shown for service entries |
| Source | Process 3.4, from Entry type and Cleared date in D3 |
| Owner | Coordinator |
| Example | open |
| Stores and flows | DF-10 Asset record only. Not stored (DEC-14) |
| Notes | Processes 2, 3.2 and 3.3 find open faults the same way, as faults with no Cleared date (DF-24, DF-25, DF-20) |

**DI-027 Cleared date**

| Field | Value |
|-------|-------|
| Description | Date a fault was fixed and closed |
| Format | Date |
| Length or units | – |
| Allowed values | On or after the fault's Entry date; not in the future |
| Mandatory or optional | Conditional: only on faults. Blank while the fault is open; filling it closes the fault (DEC-14). Always blank on service entries. When a dealer service clears a fault, 3.3 uses the dealer service's Entry date |
| Source | Library staff, through Fault cleared; or process 3.3 from a Dealer service |
| Owner | Coordinator |
| Example | 2026-06-19 |
| Stores and flows | D3; DF-07 Fault cleared; DF-10 Asset record; DF-15, DF-21; DF-17, DF-23 |

**DI-028 Cleared by**

| Field | Value |
|-------|-------|
| Description | Name of the person who fixed and closed a fault (DEC-03) |
| Format | Text |
| Length or units | Up to 50 characters **(invented)** |
| Allowed values | Any text; not checked against a list. Filled from the name picked on the device (DEC-19) |
| Mandatory or optional | Conditional: only on faults, and filled exactly when Cleared date is filled. When a dealer service clears a fault, 3.3 uses the dealer service's Recorded by (OI-04) |
| Source | Library staff, through Fault cleared; or process 3.3 from a Dealer service |
| Owner | Coordinator |
| Example | Sam Patel |
| Stores and flows | D3; DF-07 Fault cleared; DF-10 Asset record; DF-15, DF-21; DF-17, DF-23 |

**DI-037 Recorded at**

| Field | Value |
|-------|-------|
| Description | When an entry or fitting was saved in the tool. It differs from Entry date or Fitted from when someone records something after the event |
| Format | Date-time |
| Length or units | UK local time, to the minute |
| Allowed values | Not in the future |
| Mandatory or optional | Mandatory; stamped by 3.2 or 3.3 from the system clock. Imported entries get the import date and time |
| Source | Processes 3.2 and 3.3 |
| Owner | System |
| Example | 2026-06-18 16:12 |
| Stores and flows | D3; D2 (Fitting); DF-19 Battery fitting; DF-15, DF-21 Service and fault entries; DF-17, DF-23 Service and fault history; DF-10 Asset record |
| Notes | Not on the staff input flows: the process adds it (DEC-19) |

**DI-038 Last updated by**

| Field | Value |
|-------|-------|
| Description | Name of the person who last changed a bike's or battery's details. Only the latest change is kept (DEC-19) |
| Format | Text |
| Length or units | Up to 50 characters **(invented)** |
| Allowed values | Any text; from the name picked on the device |
| Mandatory or optional | Mandatory on Bike and Battery. Imported records get "Imported" |
| Source | Library staff, through Asset details (3.1) |
| Owner | Coordinator |
| Example | Priya Shah |
| Stores and flows | D2 (Bike, Battery); DF-04 Asset details; DF-18 Asset details; DF-14; DF-16, DF-22; DF-26; DF-10 Asset record |
| Notes | Battery type has no change stamp; Priya didn't need one |

**DI-039 Last updated at**

| Field | Value |
|-------|-------|
| Description | When a bike's or battery's details were last changed |
| Format | Date-time |
| Length or units | UK local time, to the minute |
| Allowed values | Not in the future |
| Mandatory or optional | Mandatory on Bike and Battery; stamped by 3.1 from the system clock |
| Source | Process 3.1 |
| Owner | System |
| Example | 2026-06-10 14:03 |
| Stores and flows | D2 (Bike, Battery); DF-18 Asset details; DF-14; DF-16, DF-22; DF-26; DF-10 Asset record |
| Notes | Not on DF-04 from staff: the process adds it |

### 2.7 LibreBooking (flow only)

None of these elements is stored. Process 2 reads them live each time a member of staff opens the day plan.

**DI-029 Reservation start**

| Field | Value |
|-------|-------|
| Description | When a reservation of a bike begins |
| Format | Date-time |
| Length or units | UK local time, to the minute (the API's own format to be confirmed, A-05) |
| Allowed values | Any date-time |
| Mandatory or optional | Mandatory for each reservation |
| Source | LibreBooking |
| Owner | LibreBooking (Lewis as admin) |
| Example | 2026-06-16 09:00 |
| Stores and flows | DF-01 Bookings and resource status only |
| Notes | Process 2 uses it for the bike state and for Next booking (DI-041). It may be before today for a reservation that is still running or not checked in (DEC-24) |

**DI-030 Reservation end**

| Field | Value |
|-------|-------|
| Description | When a reservation of a bike ends, which is when the bike is due back |
| Format | Date-time |
| Length or units | UK local time, to the minute |
| Allowed values | After Reservation start |
| Mandatory or optional | Mandatory for each reservation |
| Source | LibreBooking |
| Owner | LibreBooking (Lewis as admin) |
| Example | 2026-06-16 11:00 |
| Stores and flows | DF-01 Bookings and resource status; DF-03 Day plan (as the due time of an overdue bike) |
| Notes | Shown as "due 11:00" when it's today, or with the day, "due Mon 16:30", when it's earlier (DEC-24) |

**DI-031 Checked in at**

| Field | Value |
|-------|-------|
| Description | Date and time a bike was checked in against its reservation in LibreBooking |
| Format | Date-time |
| Length or units | UK local time, to the minute |
| Allowed values | On or after the reservation start |
| Mandatory or optional | Optional. Blank until the bike is checked in. Used by the bike state rule (DEC-16) |
| Source | LibreBooking (staff check bikes in there) |
| Owner | LibreBooking (Lewis as admin) |
| Example | 2026-06-16 10:15 |
| Stores and flows | DF-01 Bookings and resource status only |
| Notes | About 1 in 5 returns is checked in more than an hour late **(invented, Lewis)**, which is why the state reads "Overdue – not checked in" |

**DI-032 Resource status**

| Field | Value |
|-------|-------|
| Description | Whether a bike can be booked in LibreBooking. The coordinator, or whoever is on shift with a login, sets Unavailable to take a bike out of service (DEC-01, DEC-02) |
| Format | List |
| Length or units | Up to 11 characters |
| Allowed values | available, unavailable, hidden (long-term storage, confirmed by Lewis). Both unavailable and hidden mean out of service |
| Mandatory or optional | Mandatory for each resource. If a bike in the bike list has no matching resource, process 2 shows it as out of service and flags the mismatch **(invented)** |
| Source | LibreBooking |
| Owner | Coordinator |
| Example | unavailable |
| Stores and flows | DF-01 Bookings and resource status only |

### 2.8 Day plan and asset record (flow only, derived)

**DI-033 Plan date**

| Field | Value |
|-------|-------|
| Description | The day the plan covers |
| Format | Date |
| Length or units | – |
| Allowed values | Today. Staffed weekdays only (ASM-04) |
| Mandatory or optional | Mandatory |
| Source | Process 2, from the system clock |
| Owner | Process 2 (system) |
| Example | 2026-06-16 |
| Stores and flows | DF-03 Day plan only |
| Notes | In the demo, today comes from the stand-in's demo clock, so the scenarios can run on their fixed dates (DEC-26). This is demo set-up; staff can't choose another date |

**DI-034 Slot start**

| Field | Value |
|-------|-------|
| Description | Start of a half-hour slot on the day plan, within staffed hours (07:00–16:30, ASM-04) |
| Format | Time |
| Length or units | HH:MM, UK local time |
| Allowed values | 07:00, 07:30 … 16:00: 19 slots (DEC-15) |
| Mandatory or optional | Mandatory |
| Source | Process 2, from the staffed hours in its logic |
| Owner | Coordinator, with Dave (DEC-15) |
| Example | 12:30 |
| Stores and flows | DF-03 Day plan only |
| Notes | On the clock-change days, slots are in local time; process 2 converts each forecast period from UTC (NFR-06, scenario S14) |

**DI-035 Bike state** (derived)

| Field | Value |
|-------|-------|
| Description | What a bike is doing in a slot. Process 2 applies the first rule that matches (DEC-16, rule 4 refined by DEC-23, rules 3 and 4 read against the slot's end by DEC-30): (1) out of service if the resource is unavailable or hidden; (2) in the workshop if a reservation covers the slot or has ended and the bike was checked in against it by the slot's end; (3) out on loan if a reservation covers the slot and the bike wasn't checked in against it by the slot's end; (4) overdue – not checked in if the latest reservation ended before now and the bike wasn't checked in against it by the slot's end; (5) otherwise in the workshop, including slots after a reservation whose due time hasn't passed yet |
| Format | List |
| Length or units | Up to 25 characters |
| Allowed values | out of service, in the workshop, out on loan, overdue – not checked in |
| Mandatory or optional | Mandatory for every bike in every slot |
| Source | Process 2, from Resource status, Reservation start and end, and Checked in at |
| Owner | Priya, with Dave (DEC-16) |
| Example | overdue – not checked in |
| Stores and flows | DF-03 Day plan only |
| Notes | Not stored; there's no bike status in D2 (DEC-01). When overdue, the day plan also shows Reservation end as "due 11:00" (DI-030). "The latest reservation" includes reservations that started before today (DEC-24). A bike not yet due is assumed back on time (DEC-23, OI-19). After a late check-in, the slots between the due time and the check-in still read overdue: M02, due 11:00 and checked in at 11:45, reads overdue in the 11:00 slot and in the workshop from 11:30 (DEC-30). See OI-17 |

**DI-036 Quarantined** (derived)

| Field | Value |
|-------|-------|
| Description | Shows that a battery must not be charged or fitted. Yes if the battery has at least one open fault (DEC-09) |
| Format | Yes/no |
| Length or units | – |
| Allowed values | yes, no |
| Mandatory or optional | Mandatory on a battery's asset record |
| Source | Process 3.4 from D3 (a fault with no Cleared date is open, DEC-14). Process 3.2 uses the same test to warn when fitting (DF-25, DEC-06) |
| Owner | Coordinator |
| Example | yes |
| Stores and flows | DF-10 Asset record only |
| Notes | Not stored. Any open fault quarantines the battery, including a minor one (OI-07) |

**DI-040 Battery location** (derived)

| Field | Value |
|-------|-------|
| Description | Where a battery is now. Process 3.4 applies the first rule that matches (DEC-20): (1) Quarantined if the battery has an open fault; (2) Fitted to <bike> if the battery's latest fitting names a bike and that bike has no later fitting; (3) On the shelf otherwise |
| Format | Text |
| Length or units | Up to 20 characters |
| Allowed values | Quarantined; Fitted to <Bike asset tag>; On the shelf |
| Mandatory or optional | Mandatory on a battery's asset record. On a bike's record, the current battery is shown instead (the battery of the bike's latest fitting, if that is also the battery's latest fitting; otherwise "No battery fitted") |
| Source | Process 3.4, from Fitting in D2 and open faults in D3 |
| Owner | Dave, with Sam (DEC-20) |
| Example | On the shelf |
| Stores and flows | DF-10 Asset record only |
| Notes | Not stored. A battery that's never been fitted is on the shelf. This closes OI-05 without a new flow |

**DI-041 Next booking** (derived)

| Field | Value |
|-------|-------|
| Description | When a bike next goes out: the start of its earliest reservation that hasn't started yet, today or on the next staffed day |
| Format | Date-time |
| Length or units | Shown as "next out: 14:00" for today or "next out: Wed 09:00" for the next staffed day |
| Allowed values | After now |
| Mandatory or optional | Optional. Blank if there's no reservation before the end of the next staffed day; shown as "No booking" |
| Source | Process 2, from Reservation start (DF-01) |
| Owner | Dave, with Aisha (DEC-17) |
| Example | 2026-06-17 09:00 |
| Stores and flows | DF-03 Day plan only |

**DI-042 Open fault flag** (derived)

| Field | Value |
|-------|-------|
| Description | Shows that a bike has at least one open fault. It doesn't change the bike's state (DEC-02 refined) |
| Format | Yes/no |
| Length or units | Shown as a warning icon with text |
| Allowed values | yes, no |
| Mandatory or optional | Mandatory per bike on the day plan |
| Source | Process 2, from DF-24 Open bike faults |
| Owner | Priya, with Sam |
| Example | yes |
| Stores and flows | DF-03 Day plan only |
| Notes | Bike faults only. A quarantined battery fitted to the bike isn't flagged here, because process 2 doesn't read fittings |

**DI-043 Rebooked while overdue** (derived)

| Field | Value |
|-------|-------|
| Description | Shows that an overdue bike has another reservation later today, so the next member may need a different bike (REQ-15) |
| Format | Yes/no |
| Length or units | Shown as a warning with the next reservation's start time |
| Allowed values | yes, no |
| Mandatory or optional | Mandatory per bike on the day plan |
| Source | Process 2, from DF-01 |
| Owner | Priya |
| Example | yes |
| Stores and flows | DF-03 Day plan only |
| Notes | "Overdue" means overdue now: the due time has passed and the bike isn't checked in (DEC-23) |

---

## 3. Data structures

### 3.1 Stored structures

| Store | Structure | Identifier | Elements (identifier first; optional in brackets) | Notes |
|-------|-----------|------------|---------------------------------------------------|-------|
| D1 | Forecast period | Region + Period start | Region, Period start, Forecast intensity, Index band, Retrieved at | A re-fetched period overwrites the stored one. Period end isn't stored (DEC-13) |
| D2 | Bike | Bike asset tag | Bike asset tag, LibreBooking resource ID, Make, Model, (Frame size), (Bike serial number), (Bike purchase date), Last updated by, Last updated at | LibreBooking resource ID is also unique. No status (DEC-01) |
| D2 | Battery | Battery asset tag | Battery asset tag, Battery type, (Bosch serial), (Battery purchase date), (Cycle count), Last updated by, Last updated at | No status (DEC-09) |
| D2 | Battery type | Battery type | Battery type, (Capacity) | No charge times (DEC-08) |
| D2 | Fitting | Battery asset tag + Fitted from | Battery asset tag, Fitted from, (Bike asset tag), Recorded by, Recorded at | Kept as history. A blank bike means removed (DEC-20). No checks (DEC-06) |
| D3 | Service or fault entry | Entry ID **(invented)** | Entry ID, Entry type, Entry date, [Bike asset tag \| Battery asset tag], Description, Recorded by, Recorded at, (Cleared date), (Cleared by) | Cleared date and Cleared by apply to faults only, both or neither. Fault status is derived (DEC-14) |

### 3.2 Flow-only groups

| Group | Composition |
|-------|-------------|
| Reservation | LibreBooking resource ID + Reservation start + Reservation end + (Checked in at) |
| LibreBooking resource | LibreBooking resource ID + Resource status |
| Half-hour forecast | Period start + Forecast intensity + Index band |
| Change stamp | Last updated by + Last updated at |
| Bike details | Bike asset tag + LibreBooking resource ID + Make + Model + (Frame size) + (Bike serial number) + (Bike purchase date) |
| Battery details | Battery asset tag + Battery type + (Bosch serial) + (Battery purchase date) + (Cycle count) |
| Battery type details | Battery type + (Capacity) |
| Fitting details | Battery asset tag + (Bike asset tag) + Fitted from + Recorded by |
| Fitting record | Fitting details + Recorded at |
| Asset reference | [Bike asset tag \| Battery asset tag] |
| New entry | Entry ID + Entry type + Entry date + Asset reference + Description + Recorded by + Recorded at |
| Fault clearance | Entry ID + Cleared date + Cleared by |
| History entry | Entry ID + Entry type + Entry date + Asset reference + Description + Recorded by + Recorded at + (Cleared date + Cleared by) |
| Day plan slot | Slot start + (Index band) + {Bike asset tag + Bike state + (Reservation end)} |
| Day plan bike | Bike asset tag + (Next booking) + Open fault flag + Rebooked while overdue |
| Bike record | Bike details + Change stamp + (Fitting record + Battery type + (Battery purchase date) + (Cycle count)) + {History entry + (Fault status)} |
| Battery record | Battery details + Change stamp + (Capacity) + Quarantined + Battery location + (Fitting record) + {History entry + (Fault status)} |

---

## 4. Data flows

Boundary flows have the same composition at every level they appear at, which keeps the levels balanced. Each flow name now has one composition (MM-03 resolved). The exception is Asset details, which is the same group of details in DF-04, DF-18 and DF-26; the differences are noted.

### 4.1 Boundary flows (levels 0, 1 and 2)

| ID | Flow | From → to (level 0 / level 1 / level 2) | Composition | Notes |
|----|------|------------------------------------------|-------------|-------|
| DF-01 | Bookings and resource status | LibreBooking → 0 / 2 / – | Bookings and resource status = {Reservation} + {LibreBooking resource} | Reservations for today and the next staffed day (DEC-17), plus any reservation that started before today and is still running or not checked in (DEC-24); and every bike resource |
| DF-02 | Carbon intensity forecast | Carbon Intensity API → 0 / 1 / – | Carbon intensity forecast = Region + {Half-hour forecast + Period end} | Period end is supplied but not stored (DEC-13). For the demo's scenario dates, recorded forecasts are loaded into D1 instead (DEC-26) |
| DF-03 | Day plan | 0 / 2 / – → Library staff | Day plan = Plan date + {Day plan slot} + {Day plan bike} | 19 half-hour slots (DEC-15). Reservation end appears in a slot only when the bike is overdue. Phone, tablet and print layouts, and the offline copy, are physical design (DEC-15, DEC-21) |
| DF-04 | Asset details | Library staff → 0 / 3 / 3.1 | Asset details = [Bike details \| Battery details \| Battery type details] + (Last updated by) | Last updated by is mandatory for a bike or battery. 3.1 adds Last updated at. Cycle counts arrive here after a dealer service (DEC-07, REQ-14) |
| DF-05 | Battery fitted | Library staff → 0 / 3 / 3.2 | Battery fitted = Fitting details | Bike asset tag blank = Remove battery (DEC-20). 3.2 adds Recorded at |
| DF-06 | Fault report | Library staff → 0 / 3 / 3.3 | Fault report = Entry date + Asset reference + Description + Recorded by | 3.3 sets Entry type to fault and leaves Cleared date blank (DEC-14) |
| DF-07 | Fault cleared | Library staff → 0 / 3 / 3.3 | Fault cleared = Entry ID + Cleared date + Cleared by | Entry ID chosen from Open faults (DEC-03) |
| DF-08 | Service check | Library staff → 0 / 3 / 3.3 | Service check = Entry date + Asset reference + Description + Recorded by | One entry per bike or battery checked (OI-08) |
| DF-09 | Dealer service | Library staff → 0 / 3 / 3.3 | Dealer service = Entry date + Asset reference + Description + Recorded by + {Entry ID} | The repeating Entry ID lists the faults the service cleared (DEC-03) |
| DF-10 | Asset record | 0 / 3 / 3.4 → Library staff | Asset record = [Bike record \| Battery record] | 3.4 derives Fault status, Quarantined and Battery location |

### 4.2 Internal flows, level 1

| ID | Flow | From → to | Composition | Balances at level 2 with |
|----|------|-----------|-------------|--------------------------|
| DF-11 | Forecast periods | 1 → D1 | Forecast periods = {Region + Half-hour forecast + Retrieved at} | Not decomposed |
| DF-12 | Forecast periods | D1 → 2 | Forecast periods = {Half-hour forecast} | Not decomposed. Today's periods in staffed hours only |
| DF-13 | Bike list | D2 → 2 | Bike list = {Bike asset tag + LibreBooking resource ID} | Not decomposed |
| DF-24 | Open bike faults | D3 → 2 | Open bike faults = {Bike asset tag + Entry ID} | Not decomposed. Faults against bikes with no Cleared date (DEC-02 refined) |
| DF-14 | Asset and fitting updates | 3 → D2 | Asset and fitting updates = [Bike details + Change stamp \| Battery details + Change stamp \| Battery type details \| Fitting record] | DF-18 Asset details + DF-19 Battery fitting |
| DF-15 | Service and fault entries | 3 → D3 | Service and fault entries = {[New entry \| Fault clearance]} | DF-21 |
| DF-16 | Asset and fitting details | D2 → 3 | Asset and fitting details = {[Bike details + Change stamp \| Battery details + Change stamp \| Battery type details \| Fitting record]} | DF-22 Asset and fitting details + DF-26 Existing assets |
| DF-17 | Service and fault history | D3 → 3 | Service and fault history = {History entry} | DF-20 Open faults + DF-25 Open battery faults + DF-23 Service and fault history |

### 4.3 Internal flows, level 2 (process 3)

| ID | Flow | From → to | Composition | Notes |
|----|------|-----------|-------------|-------|
| DF-26 | Existing assets | D2 → 3.1 | Existing assets = {[Bike details + Change stamp \| Battery details + Change stamp \| Battery type details]} | Fills the edit screen, and gives the tags in use so 3.1 can suggest the next free one (REQ-18) |
| DF-18 | Asset details | 3.1 → D2 | Asset details = [Bike details + Change stamp \| Battery details + Change stamp \| Battery type details] | Adds or updates; no delete (ASM-10). The change stamp is set by 3.1 |
| DF-25 | Open battery faults | D3 → 3.2 | Open battery faults = {Battery asset tag + Entry ID + Entry date + Description} | 3.2 warns if the battery being fitted has one (DEC-06 refined) |
| DF-19 | Battery fitting | 3.2 → D2 | Battery fitting = Fitting record | Adds a Fitting; never changes an earlier one |
| DF-20 | Open faults | D3 → 3.3 | Open faults = {Entry ID + Entry date + Asset reference + Description} | Faults with no Cleared date (DEC-03, DEC-14) |
| DF-21 | Service and fault entries | 3.3 → D3 | Service and fault entries = {[New entry \| Fault clearance]} | A dealer service can write one New entry and several Fault clearances |
| DF-22 | Asset and fitting details | D2 → 3.4 | Asset and fitting details = {[Bike details + Change stamp \| Battery details + Change stamp \| Battery type details \| Fitting record]} | The fittings for the bike or battery shown, for the current battery and the battery location |
| DF-23 | Service and fault history | D3 → 3.4 | Service and fault history = {History entry} | All entries for one bike or battery, newest first |

DF-16 has the same composition as DF-22; DF-26 is a subset of it, without fittings. This is the split recorded in DFD v0.7, §6.

---

## 5. Data stores

Volumes are for Greener Miles: 18 bikes and 26 batteries (ASM-01, confirmed at workshop 1).

| Store | Structures | Written by | Read by | Rough volume |
|-------|------------|------------|---------|--------------|
| D1 Forecasts | Forecast period | 1 (DF-11) | 2 (DF-12) | 48 periods a day, each overwritten as it's re-fetched. About 1,500 rows if 30 days are kept **(invented retention; OI-12)** |
| D2 Bikes and batteries | Bike, Battery, Battery type, Fitting | 3.1 (DF-18), 3.2 (DF-19) | 2 (DF-13), 3.1 (DF-26), 3.4 (DF-22) | 18 bikes; 26 batteries (18 fitted, 8 spares); 4 battery types; 18 fittings at go-live plus about 2 swaps or removals a week, about 100 a year **(invented)** |
| D3 Service and fault log | Service or fault entry | 3.3 (DF-21) | 2 (DF-24), 3.2 (DF-25), 3.3 (DF-20), 3.4 (DF-23) | About 1,150 entries a year: 936 weekly checks (18 bikes × 52), 60 dealer services, 150 faults **(invented)**. About 1,100 rows imported at go-live (DEC-22). Fewer than 10 open faults at any time **(invented)** |

---

## 6. Issues for normalisation

These come from the four spreadsheets described in the discovery session (kept in the project, not the repository). They are resolved in `docs/analysis/normalisation.md`. Items marked "to check" need the real extracts.

### 6.1 Fleet register

| ID | Type | Issue |
|----|------|-------|
| N-01 | Repeating group (to check) | The discovery extract has one row per model with a quantity. Taken as a summary; the register is one row per bike |
| N-02 | Transitive dependency | Type, motor, battery and typical use depend on the model, not on the bike |
| N-03 | Attribute removed | The status column duplicates LibreBooking's resource status. Not carried into D2 (DEC-01) |
| N-04 | Wrong dependency | The battery column assumes each bike has a fixed battery, but batteries move between bikes. Replaced by Fitting |

### 6.2 Battery register

| ID | Type | Issue |
|----|------|-------|
| N-05 | Transitive dependency | Capacity is held on each battery but depends on its type |
| N-06 | Attribute removed | The charge times tab isn't carried over (DEC-08) |
| N-07 | Multi-valued field (to check) | The notes column holds several kinds of fact (which bike, quarantine, condition) |
| N-08 | Missing values | Older batteries have gaps, for example no Bosch serial |
| N-09 | Dependency kept by choice | The cycle count is really a reading taken at a service. Kept as one value on the battery (DEC-07) |

### 6.3 Service log

| ID | Type | Issue |
|----|------|-------|
| N-10 | Repeating group | One tab per year |
| N-11 | Mixed record types | Dealer services, weekly checks and repairs share one sheet |
| N-12 | Repeating group (to check) | A weekly check row may cover many bikes; a dealer row may list several cycle counts |

### 6.4 Fault log

| ID | Type | Issue |
|----|------|-------|
| N-13 | Missing attributes | Only date, bike and description; faults are never closed |
| N-14 | Repeating group (to check) | "Fault 1, fault 2" style columns |

### 6.5 Across the spreadsheets

| ID | Type | Issue |
|----|------|-------|
| N-15 | Naming inconsistency | The same bike under different names; "Bosch serial" doesn't fit a non-Bosch battery |
| N-16 | Homonym | "Status" and "Date" mean different things in each sheet |
| N-17 | Redundancy in the new design | Fault status, Period end, Battery location, Bike state, Next booking and the day plan flags are all derivable. **Resolved:** none is stored (DEC-13, DEC-14, DEC-16, DEC-17, DEC-20) |
| N-18 | Optional attribute groups | Cleared date and Cleared by are blank on service entries. A candidate for splitting the entry structure |
| N-19 | Duplicated values | A fault cleared by a dealer service copies the service's date and recorder |
| N-20 | Meaningful key | The first letter of the bike asset tag repeats the model family **(invented format)** |

---

## 7. Mismatches with the DFDs

All resolved in DFDs v0.7. DFDs v0.8 (DEC-23, DEC-24) and v0.9 (DEC-30) change no flow names or compositions, so no new mismatches arise.

| ID | Mismatch | Resolution |
|----|----------|------------|
| MM-01 | Entry ID wasn't in DFD §7 | **Resolved:** listed in D3 |
| MM-02 | No process said how a new battery type is added | **Resolved:** the 3.1 description includes battery types |
| MM-03 | "Asset details" named four compositions | **Resolved:** level 1 flows renamed Asset and fitting updates (DF-14) and Asset and fitting details (DF-16); D2 → 3.4 renamed Asset and fitting details (DF-22); D2 → 3.1 named Existing assets (DF-26). Asset details remains for DF-04 and DF-18, which differ only by the change stamp the process adds |
| MM-04 | 3.1 edited records but had no read from D2 | **Resolved:** DF-26 Existing assets |
| MM-05 | The depot's postcode and the staffed hours aren't on any flow or store | None needed while ASM-03 and ASM-04 hold |
| MM-06 | DFD §7 used "model", "status" and "date" | **Resolved:** DFD §7 uses dictionary names |
| MM-07 | DFD §7 didn't list the contents of Day plan or Asset record | **Resolved:** listed in DFD §7 |
| MM-08 | Period end and fault status in DFD §7 | **Resolved** in v0.6 |

---

## 8. Open items

| ID | Item | Depends on | Working assumption in this version |
|----|------|------------|------------------------------------|
| OI-01 | The LibreBooking API's exact endpoints and date format, including how to fetch reservations that started before today and are still running or not checked in (DEC-24) | Lewis (A-05) | Content confirmed (ASM-02), except earlier reservations, which are open again (workshop notes §7 update). The demo's stand-in synthesises all LibreBooking data, including earlier reservations (DEC-27). Lewis confirms the real API before go-live |
| OI-02 | Day plan granularity | – | **Closed:** half-hourly (DEC-15) |
| OI-03 | Time zones | – | D1 holds UTC as supplied; everything else is UK local time; process 2 converts (scenario S14) |
| OI-04 | Who is "Cleared by" when a dealer service clears a fault | DEC-03 | The dealer service's Recorded by, with its Entry date as Cleared date |
| OI-05 | A battery taken out of a bike had no flow | – | **Closed:** Remove battery and Battery location (DEC-20) |
| OI-06 | The Tern GSD's second battery bay | – | **Moved to the parking lot** (workshop 1). One battery per bike |
| OI-07 | Any open fault on a battery quarantines it, including a minor one | DEC-09 (Sam) | Accepted for the proof of concept |
| OI-08 | Whether a weekly check is one entry per bike or one for the fleet | Sam | One entry per bike checked |
| OI-09 | Importing the last year of entries | DEC-22 | Recorded by "Imported" where there's no name; mapping done by hand **(invented)**. Not needed for the pilot |
| OI-10 | A non-Bosch battery has no Bosch serial, cycle count or known capacity | – | All three optional |
| OI-11 | A bike returned early still showed as out on loan | – | **Closed:** checked-in rule (DEC-16) |
| OI-12 | How long D1 keeps past forecasts | – | 30 days **(invented)** |
| OI-13 | Invented formats and lengths | Coordinator | As stated in each entry |
| OI-14 | Entry date is a date, so two entries on one day are ordered by Entry ID | – | Accepted; Recorded at now gives the time too |
| OI-15 | Parking lot: dealer service type, odometer readings, battery health percentage, prices, cycle count history | Parking lot | Out of scope |
| OI-16 | ASM-01 gives 12 Motus and 6 GSD, so there's no donated bike, but the invented extracts include D01 and a donated battery type | Priya | D family and the donated battery type are kept in the formats; the pilot's sample data uses only M and G bikes **(invented)** |
| OI-17 | An overdue bike whose next reservation has already started shows as out on loan for that reservation | DEC-16 | Accepted; Rebooked while overdue (DI-043) warns earlier in the day |
| OI-18 | Names are free text, so "Dave" and "Dave Morgan" could both appear across devices | DEC-19 | Accepted; the name is picked once per device, which keeps it consistent per person |
| OI-19 | Before its due time, a bike is assumed back on time, so a later slot can read "in the workshop" for a bike that turns out to be late | DEC-23 | Accepted. Once the due time passes, the bike reads overdue in every slot until it's checked in or its next reservation starts. After a late check-in, the slots before the check-in stay overdue (DEC-30). To confirm with Priya and Dave at the CRP |
