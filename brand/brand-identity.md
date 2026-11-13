# Greener Miles: brand identity

| | |
|---|---|
| **Status** | Draft v0.4 |
| **Date** | 12 November 2026 (v0.3 and v0.2: 12 November 2026; v0.1: 30 October 2026) |
| **Owner** | Rob Cockerell |
| **Applies to** | Charging planner proof of concept, article figures, conference room pilot materials |

> **Fictional example.** Greener Miles is an invented organisation created for an article and demo. Its name, logo, colours, history and figures are all made up. Any resemblance to a real organisation is unintended.

**Changes in v0.4.** §9's note on fonts made clear: `tokens.css` already reads the Fonts API's CSS variables, so Claude Code configures Astro with those names and doesn't change `tokens.css`.

**Changes in v0.3.** Fonts are served from the planner's own site through Astro's Fonts API, with Google Fonts as the source (DEC-51). The interface is built on AdminLTE 4 and Bootstrap 5.3, themed with these values, and uses Lucide icons rather than Bootstrap Icons (DEC-50).

**Changes in v0.2.** Brought into line with the PRD and decision log: the planner shows the bands and leaves the decision to staff, so band meanings such as "Best time to charge" and gCO₂/kWh figures are removed from the planner (DEC-32). Screen names added (DEC-35). The dark theme follows each device's setting (DEC-34). Times are in 24-hour format throughout.

## 1. The organisation

Greener Miles is a community interest company (CIC) that lends e-bikes and spare batteries to people and small groups across Oxfordshire. Its purpose is to replace car journeys with e-bike journeys and to run its fleet with as little carbon as possible.

*Invented detail for the worked example:*

- One depot on an industrial estate in Cowley, Oxford, with a 16-slot battery charging rack.
- 18 e-bikes (12 commuter bikes, 6 cargo bikes) and 26 batteries.
- One part-time coordinator and around 25 volunteers who run handovers, maintenance and charging shifts.
- Members, payments and bookings are handled by the existing booking system. The charging planner does not touch them.

## 2. Brand idea

**Every mile, a little greener.**

The brand links two things the organisation cares about: the miles members ride, and the energy that powers them. The charging planner is where these meet. It shows volunteers the day's bikes and bookings next to the forecast carbon bands, so they can choose greener times to charge. The volunteers decide; the planner doesn't tell them what to do.

### Personality

| We are | We are not |
|---|---|
| Practical and plain-spoken | Preachy or guilt-inducing |
| Neighbourly and welcoming | Cliquey or "for cyclists only" |
| Careful with facts and numbers | Vague about impact |
| Quietly optimistic | Hyped or gimmicky |

### Voice and tone

- Write in UK English and plain language. Aim for a reading age of about 12.
- Use "we" for Greener Miles and "you" for the reader.
- Lead with what's happening, then what it means: "M03 is back. Next out: Wed 13:00."
- In the planner, state facts and leave the decision to staff. Don't tell people what to charge or when.
- Give numbers with units, and times in 24-hour format: "26 batteries", "13:30". In the planner, show carbon intensity as the band name ("very low"), not as gCO₂/kWh figures. Figures with units ("142 gCO₂/kWh") are fine in article charts.
- Avoid jargon such as "decarbonise", "leverage" and "solutions". Say what happens.
- Use sentence case for headings, buttons and labels.

### Naming

- Write the name as **Greener Miles**, two words, both capitalised.
- Do not abbreviate to "GM" in anything the public or volunteers see. "GM" is fine in code prefixes.
- The product is **the charging planner** in running text and **Charging planner** as a screen title (DEC-35).
- Its two main screens are **Day plan** and **Fleet** (DEC-35).
- Descriptor line: **Community e-bike library**.

## 3. Logo

### Concept

The mark is a leaf inside a wheel. The leaf's midrib is drawn as a dashed road centre line, so the leaf also reads as a stretch of road. Together they say "green miles" without words.

### Files

All logo files live in `logo/` as SVG.

| File | Use |
|---|---|
| `greener-miles-logo.svg` | Primary lockup: mark, name and descriptor, on light backgrounds |
| `greener-miles-logo-reversed.svg` | Lockup for dark backgrounds (transparent background) |
| `greener-miles-logo-mono.svg` | Single-colour version for print, stamps and stickers |
| `greener-miles-mark.svg` | Mark on its own: favicon, app icon, social avatar |

The SVG lockups use live text set in Lexend and Atkinson Hyperlegible, with fallbacks. For print or any use outside the app, convert the text to outlines first so the letterforms do not change.

### Construction

- The mark sits on a 64 × 64 unit grid. The wheel is a circle with radius 28 units.
- The leaf is symmetrical about the diagonal from bottom left to top right.
- The road line is a 2.6 unit stroke with round caps, dashed 4.5 on, 3.5 off.
- In the lockup, the mark is 64 units high and the name is set at 30 units, weight 600.

### Clear space and minimum size

- Keep clear space around the logo equal to half the height of the mark on all sides.
- Minimum size for the full lockup: 160 px wide on screen, 40 mm wide in print.
- Minimum size for the mark on its own: 24 px on screen, 8 mm in print. Below 24 px, for example a 16 px favicon, drop the dashed road line and use the solid leaf.

### Do not

- Stretch, rotate or skew the logo.
- Recolour it outside the three approved versions.
- Place the primary logo on photographs or on mid-tone backgrounds. Use the reversed version on a dark panel instead.
- Add effects such as shadows, outlines or gradients.
- Rearrange the mark and the name, or set the name in a different typeface.

## 4. Colour

### Core palette

| Name | Hex | RGB | Role |
|---|---|---|---|
| Hedgerow | `#1E6B47` | 30, 107, 71 | Primary brand colour. Buttons, links, headings accents, logo |
| Leaf | `#7BC043` | 123, 192, 67 | Accent. Logo leaf, illustrations, decorative fills only |
| Grid Amber | `#E8A317` | 232, 163, 23 | Accent. Focus rings, highlights, "moderate" band |
| Ink | `#16262B` | 22, 38, 43 | Body text and the mono logo |
| Slate | `#52646A` | 82, 100, 106 | Secondary text, captions, axis labels |
| Mist | `#DCE6DF` | 220, 230, 223 | Borders, dividers, subtle fills |
| Chalk | `#F5F3EC` | 245, 243, 236 | Page background |
| White | `#FFFFFF` | 255, 255, 255 | Cards and surfaces |

As a guide, use roughly 60% Chalk and White, 25% Ink and Slate, 10% Hedgerow and 5% accents.

### Carbon intensity bands

The charging planner shows the forecast carbon intensity of electricity as a band for each half hour. These five colours map to the index values returned by the National Grid Carbon Intensity API (`very low`, `low`, `moderate`, `high`, `very high`).

| Band | Fill | Text on fill | Contrast |
|---|---|---|---|
| Very low | `#1E6B47` | White | 6.5:1 |
| Low | `#5FA83B` | Ink | 5.3:1 |
| Moderate | `#E8A317` | Ink | 7.2:1 |
| High | `#E3772A` | Ink | 5.2:1 |
| Very high | `#A8322D` | White | 6.7:1 |

**Rules:**

- Never show a band by colour alone. Always pair the colour with the band name in text, and use an icon where space is tight. This keeps the planner usable for people with colour vision deficiency and on monochrome printouts.
- Show the band name only: "very low", "moderate". Don't add a meaning or instruction such as "Best time to charge" or "Avoid charging", and don't show gCO₂/kWh figures in the planner. Staff decide when to charge, using the bands, the bookings and the charging rules in the volunteer handbook (DEC-32).
- When a half hour has no forecast, show "No forecast" in text on a Mist fill.

### Accessibility pairings

All ratios were calculated against WCAG 2.1. AA needs 4.5:1 for normal text and 3:1 for large text and interface parts.

| Foreground | Background | Ratio | Use |
|---|---|---|---|
| Ink | Chalk | 14.1:1 | Body text ✅ |
| Ink | White | 15.6:1 | Body text on cards ✅ |
| Slate | Chalk | 5.6:1 | Secondary text ✅ |
| Hedgerow | Chalk | 5.8:1 | Links, headings ✅ |
| White | Hedgerow | 6.5:1 | Primary button text ✅ |
| Leaf | Chalk | 2.0:1 | ❌ Not for text or essential icons |
| Grid Amber | Chalk | 2.0:1 | ❌ Not for text. Focus ring only, next to a dark edge |

### Dark theme

The dark theme follows each device's own dark mode setting, as `tokens.css` already does (DEC-34). It suits the depot's wall display. There's no theme switch in the planner.

| Role | Hex |
|---|---|
| Background | `#0F1A1D` |
| Surface | `#18282C` |
| Text | `#F5F3EC` (16.0:1) |
| Action and link | `#8FD65A` (10.1:1) |
| Border | `#2C3F44` |

Band colours stay the same in both themes.

## 5. Typography

All three typefaces are free under the SIL Open Font Licence. Their source is Google Fonts, but the planner serves them from its own site through Astro's Fonts API, which downloads them when the site is built (DEC-51). Browsers never request them from Google, and the last loaded day plan keeps its fonts when the phone is offline. The logo files and article figures may still load them from Google Fonts or use outlined text.

| Role | Typeface | Weights | Why |
|---|---|---|---|
| Headings and logo | **Lexend** | 500, 600 | Designed to improve reading fluency. Rounded and friendly without being childish |
| Body and interface | **Atkinson Hyperlegible** | 400, 400 italic, 700 | Created by the Braille Institute for low-vision readers. Clear letterforms that are hard to confuse |
| Data and times | **IBM Plex Mono** | 400, 500 | Tabular figures so times line up on the day plan, and figures line up in tables and article charts |

### Type scale

Base size 16 px, line height 1.55 for body text and 1.2 for headings.

| Token | Size | Use |
|---|---|---|
| `--gm-text-3xl` | 40 px | H1, page titles |
| `--gm-text-2xl` | 32 px | H2 |
| `--gm-text-xl` | 24 px | H3 |
| `--gm-text-lg` | 20 px | H4, lead text |
| `--gm-text-base` | 16 px | Body |
| `--gm-text-sm` | 14 px | Table cells, helper text |
| `--gm-text-xs` | 13 px | Captions, tags. Never smaller |

### Rules

- Use sentence case. Avoid all caps except the logo descriptor and short labels of three words or fewer, with 1px letter spacing.
- Set times in 24-hour format (`13:30`) in IBM Plex Mono. Where carbon values appear (article charts, not the planner), give them with units (`142 gCO₂/kWh`), also in IBM Plex Mono.
- Keep line length between 45 and 75 characters for body text.

## 6. Iconography and imagery

### Icons

- Use [Lucide](https://lucide.dev) icons (ISC licence) at 1.75 px stroke, in Ink or Hedgerow.
- Don't use Bootstrap Icons, which AdminLTE's demo pages use, so the planner keeps one icon style (DEC-50).
- Sizes: 16, 20 or 24 px. Match the icon to the size of the text next to it.
- Suggested icons for the planner: `battery-charging`, `plug-zap`, `leaf`, `clock`, `calendar`, `bike`, `triangle-alert`.

### Photography

*Not needed for the proof of concept. Guidance for completeness.*

- Show real-looking people of all ages using the bikes for everyday trips: shopping, school runs, deliveries.
- Natural light, Oxfordshire streets and towpaths, no staged racing or lycra.
- Avoid stock images of plugs, light bulbs or globes.

### Illustration

Flat shapes in Hedgerow, Leaf and Mist with Ink outlines kept to a minimum. Reuse the dashed road line as a motif, for example as a divider or progress track.

## 7. Interface basics

These are starting points for the charging planner. The full component list is in the PRD (§6.1). The interface is built on AdminLTE 4 and Bootstrap 5.3, with these values replacing Bootstrap's defaults (DEC-50). The UI spec says how.

| Element | Specification |
|---|---|
| Spacing | 4 px base unit. Use 8, 16, 24 and 32 px for most gaps |
| Corner radius | 4 px for inputs and tags, 8 px for buttons and cards, 16 px for large panels |
| Primary button | Hedgerow fill, White text, 8 px radius, 44 px minimum height |
| Secondary button | White fill, Hedgerow 1.5 px border and text |
| Focus | 3 px Grid Amber ring outside the element. Never remove focus styles |
| Cards | White surface, Mist 1 px border, soft shadow, 16–24 px padding |
| Band tag | Pill shape, band fill, band text colour, band name in text, optional leaf or alert icon. No meaning or figure |
| Touch targets | At least 44 × 44 px. Volunteers often use the planner on a phone in the depot |

All tokens are defined in `tokens.css` with the `--gm-` prefix. Use the semantic tokens (`--gm-text`, `--gm-action`) in components rather than raw palette tokens, so the dark theme works without extra code.

## 8. Files in this pack

```text
brand/
├── brand-identity.md               This document
├── tokens.css                      CSS custom properties for colour, type, spacing and shape
└── logo/
    ├── greener-miles-logo.svg
    ├── greener-miles-logo-reversed.svg
    ├── greener-miles-logo-mono.svg
    └── greener-miles-mark.svg
```

## 9. Notes for Claude Code

- Import `tokens.css` once in the planner's layout and style components with the `--gm-` semantic tokens. Map Bootstrap's and AdminLTE's theme values to these tokens rather than adding new colours.
- Use the band table in section 4 as the single mapping from the API's `index` value to colour, text colour and label. The label is the band name only.
- Never convey a carbon band by colour alone (see section 4).
- Don't show gCO₂/kWh figures, band meanings or charging advice anywhere in the planner (DEC-32).
- Let the dark theme follow the device's setting; don't add a theme switch (DEC-34).
- Load the three typefaces through Astro's Fonts API with Google as the provider. In `astro.config`, give them the CSS variable names listed at the top of `tokens.css` (`--font-lexend`, `--font-atkinson`, `--font-plex-mono`), with the weights and styles it lists. `tokens.css` already uses those variables in its font stacks, so it doesn't need changing. Don't add a Google Fonts `<link>` (DEC-51).
- Use Lucide icons only (DEC-50).
- Use "Charging planner" as the product name, and "Day plan" and "Fleet" for the two main screens (DEC-35).
- Use `greener-miles-mark.svg` as the favicon and `greener-miles-logo.svg` in the header.
- Keep all interface copy in UK English and sentence case, with times in 24-hour format, following section 2.
