# Globe / atlas polish — DONE (items 1–3), item 4 covered

The atlas works (31 pins, date-ordered gold path, green Earth, etched borders,
NYC fan-out, cards, rotation). This was **legibility polish**, not a fix — and
the path being slightly hard to fully trace mirrors the theme (provenance is a
tangle you piece together).

## Status

- [x] **1. Distance-scaled arcs.** Each leg's altitude now scales with the
  hop's chord length (`ARC_LIFT_MIN + ARC_LIFT_SPAN * chord/diameter`); the void
  leg stays low (`VOID_ARC_LIFT`). Long ocean crossings bow high, short hops
  hug — crossings separate by altitude.
- [x] **2. Active-leg emphasis.** Whole path holds at `GHOST_OPACITY`; the
  render loop lights only the legs touching the hovered pin / open card to
  `ACTIVE_OPACITY` (smoothly lerped). Driven by `pathIndexById` + per-leg
  handles in `legs[]`.
- [x] **3. Directionality.** Each leg carries a per-vertex dim→bright gradient
  (`GOLD_DIM`→`GOLD_BRIGHT`, `STILL_*` for the void) in date order, so the eye
  follows the chronology.
- [~] **4. Cluster de-knotting.** Already handled by the NYC fan-out; arcs +
  active-leg highlight now help further. No further work unless Paris re-knots.

All three live in `app/components/AtlasGlobe.tsx` (path build + tick loop) and
`greatCircleArc` in `app/lib/globe.ts`.

---

## Original notes (for reference)

## The problem

Keep it **ONE gold path** — it's one object living one unbroken chronological
life; splitting it would read as multiple journeys. The issue isn't the count,
it's that a single date-ordered line across 31 global venues over a century
**tangles**, and tangle ≠ traceable.

## The four improvements (priority order)

1. **Arc the legs above the surface (do first — biggest win, and beautiful).**
   Surface-hugging lines criss-cross the Atlantic/Pacific into a web. Lift each
   leg into a great-circle arc, height scaled to distance — long hops bow high,
   short hops stay low — so crossings separate by *altitude*, not just overlap.
   Reads as travel (the flight-map vocabulary everyone knows).

2. **Active-leg emphasis (do second).** All 31 legs lit equally guides nothing.
   Dim the full path to a faint ghost-gold (whole journey stays as context), and
   brighten only the incoming + outgoing legs of the hovered/selected node —
   "where it came from, where it goes next" becomes instantly legible.

3. **Directionality (do third).** A plain line is ambiguous about which way time
   flows. Add a dim→bright gradient along each leg, or an animated flowing dash /
   traveling pulse in date order, so the eye *follows* the chronology.

4. **Cluster de-knotting (NYC, Paris).** Co-located venues pile the line into a
   scribble (the NYC fan-out already addresses this). Arcs + active-leg highlight
   help here too.

**Resist** numbered pins — feels like a diagram, not an object's life.
