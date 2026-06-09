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
  "canberra-1986": { spz: "/worlds/canberra-1986.spz", ready: true },
  "yokohama-1989": { spz: "/worlds/yokohama-1989.spz", ready: true },
  "paris-mam-2006": { spz: "/worlds/paris-mam-2006.spz", ready: false },
  "lillehammer-2025": { spz: "/worlds/lillehammer-2025.spz", ready: false },

  // ── the void (image→world from thesilence_clean.png ref) ────
  "the-silence": { spz: "/worlds/the-silence.spz", ready: true },

  // ── 2 transition rooms (placard must be legible) ───────────
  "wildenstein-1934": { spz: "/worlds/wildenstein-1934.spz", ready: true },
  // Flat-frame re-splat (replaced the v1 shadowbox-frame splat that floated; see
  // worldpainting.ts). Canonical filename now that v1 is retired.
  "bordeaux-1981": { spz: "/worlds/bordeaux-1981.spz", ready: true },
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
  // Bordeaux v2: looking straight down the long barrel-vaulted nave toward the
  // dark-framed Green Blouse at the far end (frame ~24.3m down −Z — v2's nave is
  // deeper than v1's), the 18th-c stone staircase off to the right. A "passing-
  // through" hero — the deep one-point recession does the work, the painting the
  // focal point at the end. Centered on the nave axis (x=0). z=−11.5 keeps the same
  // ~13.9m painting distance / framing the user liked on v1's −8.5, now measured to the
  // depth-re-fit frame plane (z−25.4), so the arrival reads the same despite the deep v2 room.
  "bordeaux-1981": { position: [0, 1.6, -11.5] },
  // Canberra: stand back ~6.7m down the room from the painting (pier frame at z≈−3.77),
  // looking straight down −Z. The pier is symmetric — dark-framed Green Blouse dead-center,
  // an arched passage receding on each side, warm timber floor running to it. A held hero
  // shot (unlike Wildenstein's lopsided hall): the international touring show, the Met's
  // painting arriving on the 4th continent. x=0.315 aligns the camera with the frame's
  // x-center so the painting projects dead-center. z pulled in 2.916→1.8 (2026-06-08):
  // the back-of-room spawn put the whole 1.92M-gaussian cloud (incl. the deep side
  // galleries seen through both arches) on screen — heavy overdraw on a fill-rate-bound
  // splat. 1.8 keeps BOTH arches (the symmetric hero holds — any closer drops the left
  // one) while the painting reads bigger and less deep cloud is on screen. (FPS
  // unverified here — the headless preview RAF-throttles; tune against a real machine.)
  "canberra-1986": { position: [0.315, 1.6, 1.8] },
  // Yokohama: stand at the room origin looking straight down −Z — the full establishing
  // hero of the vast skylit Minato Mirai hall: deep one-point recession down the pale
  // travertine, clerestory glazing converging overhead, symmetric side galleries of
  // small works flanking, the Green Blouse glowing dead-center on the end wall (frame
  // ~13m down −Z). The spaciousness IS the subject (like met-74/stockholm establishing
  // shots), so a wide axial arrival, not nose-to-canvas. x=−0.018 aligns the camera
  // with the frame's x so the painting projects dead-center. z pulled in 0→−4
  // (2026-06-08): the room-origin spawn buried the painting at the end of the deep
  // hall AND put the entire glazed hall on screen (gaussian splats are fill-rate
  // bound — overdraw scales with how much of the cloud is on screen). −4 is the
  // midpoint toward a close view: the painting reads as a clear presence, the skylit
  // hall still reads grand, and less of the deep cloud is on screen. (FPS unverified
  // here — the headless preview RAF-throttles; tune against a real machine.)
  "yokohama-1989": { position: [-0.018, 1.6, -4] },
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
