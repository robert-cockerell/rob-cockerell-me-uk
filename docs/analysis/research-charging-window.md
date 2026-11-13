# Research note: low-carbon periods within staffed hours

**Question:** Batteries can only be charged while the hub is staffed, 07:00–16:30 on weekdays. Do low-carbon periods typically fall inside that window?

**Decision (11 Nov 2026):** Good enough for the proof of concept. The PoC focuses on spring and summer, when the greenest hours fall inside staffed time. Rob's working assumption (to validate at the workshop): demand for bikes is also higher in good weather, so the seasons with the most loans are the ones where the planner helps most. Demo data and screenshots should use a spring or summer date.

## Findings

GB grid carbon intensity by hour of day, 2025 (Electricity Maps, flow-traced, national):

| Season | Lowest hour | Highest hour |
|---|---|---|
| Winter (Dec–Feb) | 03:00, 149 g | 17:00, 234 g |
| Spring (Mar–May) | 13:00, 124 g | 19:00, 223 g |
| Summer (Jun–Aug) | 13:00, 113 g | 20:00, 210 g |
| Autumn (Sep–Nov) | 02:00, 142 g | 18:00, 215 g |

Typical shape (AgileAlert guide): overnight lowest, morning ramp 06:00–09:00 around 150–250 g, midday lull around 100–180 g in summer, evening peak 17:00–20:00, worst on winter weekdays.

## What this means for the charging planner

- **Spring and summer:** the day's greenest period (around 13:00, driven by solar) falls inside the staffed window. Shifting charging from the morning to midday gives a real saving.
- **Autumn and winter:** the greenest period is overnight, outside the window. Within the window, midday is still usually better than the morning ramp, but the spread is smaller. Wind matters more than time of day, so some days are much greener than others.
- **The window closes before the evening peak.** Today's practice of charging on return in the late afternoon runs into the peak if the window were longer; the 16:30 cut-off already avoids the worst hours.
- **Shifting across days may beat shifting within a day.** If a bike's next booking is two or more days away, choosing the windiest day can save more than choosing the best hour.

## Implications for the analysis

- Add staffed hours as a constraint (new data elements: opening day, opening time, closing time). Process 3.2 should only score windows inside staffed hours.
- Charge duration matters: a several-hour charge in a 9.5-hour window leaves limited room to move. Consider partial charging (charge enough for the next loan in the greenest hours).
- Revisit open question 3 (charging outside opening hours): smart plugs or timers would unlock overnight periods in winter. This becomes a trade-off to present at the workshop.
- The carbon-saved baseline should be "charge immediately on return, within staffed hours", not a whole-day average.
- Workshop question: how do loans vary by season? Ask for a year of booking counts by month if the library has them.

## Caveats

- Figures are national averages; the API's South England region (Oxford) has its own profile. Solar is stronger in the south, which favours midday.
- Electricity Maps uses flow-traced intensity including imports, so its numbers differ from the Carbon Intensity API's. The shape of the day is the useful part.
- Optional later step: pull a year of regional half-hourly data from the Carbon Intensity API (postcode OX3) and compare 07:00–16:30 weekdays against the full day by month.

## Sources

- [Electricity Grid Review 2025: Great Britain – Electricity Maps](https://www.electricitymaps.com/grid-in-review-2025/great-britain)
- [Carbon Intensity Guide – AgileAlert](https://agilealert.co.uk/blog/carbon-intensity-electricity-guide-uk.html)
- [When is the UK grid cleanest? – Fabrick Pulse](https://pulse.fabrick.agency/dashboard/carbon-intensity)
