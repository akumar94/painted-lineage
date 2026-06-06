/**
 * Registry of generated splat worlds, keyed by context id.
 *
 * The atlas → world flow reads this; until a world is `ready` it streams the
 * shared placeholder. This keeps the locked `contexts.ts` untouched — assets
 * are wired here.
 *
 * To wire a generated world:
 *   1. Drop the file at  public/worlds/<id>.spz   (filename = the context id)
 *   2. Flip `ready: true` for that id below.
 * (Override `spz` if you name the file differently or stream a `.RAD` LoD tree.)
 *
 * The 11 enterable worlds, in walk order. The void (`the-silence`) is generated
 * differently — Marble 1.1 Plus, dynamic cubes, no source image — but still
 * drops a file here like the rest.
 */

export interface WorldAsset {
  spz: string;
  ready: boolean;
}

export const WORLDS: Record<string, WorldAsset> = {
  // ── 8 primary walk worlds ──────────────────────────────────
  "le-cannet-studio": { spz: "/worlds/le-cannet-studio.spz", ready: true },
  "carnegie-1924": { spz: "/worlds/carnegie-1924.spz", ready: true },
  "stockholm-1939": { spz: "/worlds/stockholm-1939.spz", ready: true },
  "met-impressionist-epoch-1974": {
    spz: "/worlds/met-impressionist-epoch-1974.spz",
    ready: true,
  },
  "canberra-1986": { spz: "/worlds/canberra-1986.spz", ready: false },
  "yokohama-1989": { spz: "/worlds/yokohama-1989.spz", ready: false },
  "paris-mam-2006": { spz: "/worlds/paris-mam-2006.spz", ready: false },
  "lillehammer-2025": { spz: "/worlds/lillehammer-2025.spz", ready: false },

  // ── the void (image→world from thesilence_clean.png ref) ────
  "the-silence": { spz: "/worlds/the-silence.spz", ready: true },

  // ── 2 transition rooms (placard must be legible) ───────────
  "wildenstein-1934": { spz: "/worlds/wildenstein-1934.spz", ready: true },
  "bordeaux-1981": { spz: "/worlds/bordeaux-1981.spz", ready: false },
};

/** The streamable source for a context's world, or null if not generated yet. */
export function worldSrc(id: string): string | null {
  const w = WORLDS[id];
  return w && w.ready ? w.spz : null;
}

/**
 * Per-world spawn: where the camera starts (and optional yaw, radians, 0 = look
 * down −Z). Set per world so we arrive at a good vantage — not stuck at the room
 * origin. Independent of the painting placement (that's absolute world space).
 * A world with no entry spawns at the default below.
 */
export interface WorldSpawn {
  position: [number, number, number];
  yaw?: number;
}

export const DEFAULT_SPAWN: WorldSpawn = { position: [0, 1.6, 0] };

export const WORLD_SPAWN: Record<string, WorldSpawn> = {
  // Start halfway down the hall toward the painting (pier at z≈-17.5), looking
  // down the enfilade at the Green Blouse.
  "carnegie-1924": { position: [0, 1.6, -8.5] },
  // Tightened to a hero shot (2026-06-05): the wide z=-3 establishing view read
  // off-center because the splat's hall is inherently lopsided (recessing passage
  // left, window-lit doorway hard against the pier right) — the pier itself was
  // already centered to ~4px, so no x/yaw nudge fixed it at wide distance. Pulling
  // in to z=-6.3 makes the gold frame dominant and crops both flanks to balanced
  // slivers; x matches the painting (-0.05) for pixel-perfect horizontal centering;
  // eye dropped to 1.45 to lift the low-hung canvas (frame center y≈1.3) toward
  // the middle of the shot. Painting projects dead-center horizontally.
  "wildenstein-1934": { position: [-0.05, 1.45, -6.3] },
  // Near the room's entrance, looking down the deep hall (frame ≈10.2m down −Z):
  // an establishing view of the spare, emptying gallery — windows + small works
  // left, doorway + bench right, the Green Blouse glowing alone at the far end.
  // The "last show before the silence" reads best from back here.
  "stockholm-1939": { position: [0, 1.6, -0.5] },
  // The void: stand back in the private apartment, looking down −Z. The Green
  // Blouse hangs quietly on the left wall (dim, unlabeled), the clock + console
  // dissolve into fog on the right — arrival into 35 years of stillness, the
  // painting present but lived-with, not shown.
  "the-silence": { position: [0, 1.6, 0.6] },
  // Met-74: arrive at the room origin looking straight down the axial hall — the
  // Green Blouse centered on the pier (frame ~7.9m down −Z), both side walls of
  // densely hung Impressionists receding symmetrically. A held hero shot: the
  // painting back in public light, the resurrection. Not nose-to-canvas; the full
  // living gallery reads on arrival.
  "met-impressionist-epoch-1974": { position: [0, 1.6, -1] },
};

export function worldSpawn(id: string | undefined): WorldSpawn {
  return (id && WORLD_SPAWN[id]) || DEFAULT_SPAWN;
}

/**
 * The chromatic arc (docs/WORLD_GEN.md). The void is the ONLY desaturated space:
 * color DRAINS as you enter `the-silence`, and every other room is full color
 * from the first frame — so "the return of color" is delivered *structurally*
 * (one grey room in a world of color), not as an effect. Applied as an animated
 * CSS filter on the canvas so it grades the whole scene (splat AND the
 * composited painting) with no coupling to the Spark pipeline.
 *
 * NB: a "flood" direction (extreme→full on enter) was considered for met-1974's
 * resurrection but cut — you reach met-1974 from the color atlas, not straight
 * from the void, so it would make met-1974 briefly read as a *second* desaturated
 * room, diluting the void's singularity. The direction union keeps "flood" so the
 * mechanism is available if we ever tie a color-return to the void's EXIT fade.
 */
export interface WorldGrade {
  /** Desaturated extreme: CSS saturation multiplier (1 = full color, 0 = grey). */
  saturation: number;
  /** Desaturated extreme: CSS brightness multiplier (1 = unchanged). */
  brightness: number;
  /** Seconds to ease between full color and the extreme. */
  seconds: number;
  /** "drain" eases full→extreme on enter (the void); "flood" eases extreme→full
   *  on enter (currently unused — see note above). */
  direction: "drain" | "flood";
}

export const WORLD_GRADE: Record<string, WorldGrade> = {
  // The silence: color bleeds out as the apartment settles around you. The ONLY
  // graded world — every other room renders full color.
  "the-silence": {
    saturation: 0.12,
    brightness: 0.78,
    seconds: 3.0,
    direction: "drain",
  },
};

export function worldGrade(id: string | undefined): WorldGrade | undefined {
  return id ? WORLD_GRADE[id] : undefined;
}
