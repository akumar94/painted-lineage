# Painted Lineage

> *L'Œuvre d'art, un arrêt du temps.*

The third Painted work. A spatial provenance of one painting — Pierre Bonnard's
**The Green Blouse** (*La Blouse verte / La Tasse de café*), 1919–20, the
Metropolitan Museum of Art — built around the claim that provenance *is*
chronological, but the catalog list is a lossy compression: it throws away
**geography** (a painting crated across oceans for decades) and **weight** (the
most important thing that happened was 35 years of *nothing*). The globe is the
decompression. **The path is the structure.**

## Two rendering modes, one Three.js app

The globe is a MAP; the worlds are PLACES. A map is not made of the same
material as the territory — so the two modes use different materials:

- **Mode 1 — Atlas** (`app/components/AtlasGlobe.tsx`). A free-rotating Earth
  (`public/textures/earth.jpg`) with gold country borders
  (`public/geo/countries.geojson`, Natural Earth, public domain), a faint gold
  graticule, and an atmospheric rim. All 31 exhibition contexts render as pins
  (sized by tier), threaded by one continuous date-ordered path. The 1939–1974 silence is
  drawn as the **still segment** — an oversized, cool, withdrawn marker at Paris
  where the path stops moving. Nothing here is a splat: pins, path, graticule,
  and NYC fan-out are all procedural from `CONTEXTS`. Change a coordinate in the
  data model and the pin moves.
- **Mode 2 — World** (`app/components/WorldViewer.tsx`). Reached only by clicking
  an `enterable` pin. Streams a single splat world (Spark) with walk controls and
  a per-world, spatially-positioned sound map. Until the ten destination worlds
  are generated, every enterable pin streams `public/worlds/placeholder.spz`.

`app/components/Experience.tsx` is the state machine: **splash → atlas → world**,
with quiet fade transitions. Splash is silent; the globe is silent; sound begins
only inside worlds.

## Source of truth

- `app/lib/contexts.ts` — **locked.** The 31 contexts, tiers, coords, titles,
  catalogue notes, the void, and the NYC colocation cluster. Single source of
  truth for the globe and the walk.
- `app/lib/globe.ts` — procedural globe geometry (lat/lng → vector, great-circle
  arcs, tier sizing, colocation fan-out, graticule).
- `app/lib/soundmap.ts` — the 2–3 grounded sounds per enterable world (design
  intent; wired into worlds once they exist). The void stays silent of war/theft.
- `app/lib/worldlabs.ts` — Marble World API client (for Lane-2 void generation).

## Lineage / reuse

- **Painted Worlds** (Next.js + Three.js + Spark) is the architectural base —
  the App Router shell, the Spark `WorldViewer`, and the Marble client come from
  it. Mode 1 → Mode 2 mirrors its walk-into-the-painting teleport.
- **Painted Time** is the grammar: splash layout, gold `#d4bc8a` on near-black
  `#0a0a0f`, Palatino-lineage serif, and the spatial positional-audio discipline.

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

Optional, for Mode-2 world generation via the Marble API:

```
# .env.local
WORLDLABS_API_KEY=your_key_here
```

## Status (v1)

Splash, the full atlas (31 pins, path, the still void, fan-out, hover, cards,
free rotation), and the atlas → world → atlas flow all render and are verified
against placeholder worlds. **Next:** generate the ten destination worlds
(8 primary + 2 transition) and the 5-cube silence void, build `.RAD` LoD trees,
and wire the positioned audio per `soundmap.ts`.

### Deferred / open

- Faint full-path-through-atlas-pins always visible vs. on slow-down.
- Museum-level coordinate precision (current coords are city/institution level).
- Real splat worlds replace `public/worlds/placeholder.spz`; set each context's
  `worldId` in `contexts.ts` and drop `public/worlds/<worldId>.spz`.
- Drop the final splash image at `public/the-green-blouse.jpg` if you want to
  replace the current Wikimedia Commons open-access scan.

### Asset credits (colophon)

- Earth texture: **Solar System Scope**, CC BY 4.0 (8K daymap, green/snow-free).
  Swap for a public-domain NASA Blue Marble frame to drop the attribution
  requirement (the snow-free high-res NASA frames were not reachable at build
  time; the public-domain `land_shallow_topo_2048` is lower-res with polar ice).
- Country borders: **Natural Earth**, public domain (no attribution required).
- Splash painting: Wikimedia Commons open-access scan of Bonnard's *The Green
  Blouse* (public domain).
