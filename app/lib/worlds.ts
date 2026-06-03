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
  "stockholm-1939": { spz: "/worlds/stockholm-1939.spz", ready: false },
  "met-impressionist-epoch-1974": {
    spz: "/worlds/met-impressionist-epoch-1974.spz",
    ready: false,
  },
  "yokohama-1989": { spz: "/worlds/yokohama-1989.spz", ready: false },
  "paris-mam-2006": { spz: "/worlds/paris-mam-2006.spz", ready: false },
  "stockholm-nationalmuseum-2025": {
    spz: "/worlds/stockholm-nationalmuseum-2025.spz",
    ready: false,
  },
  "lillehammer-2025": { spz: "/worlds/lillehammer-2025.spz", ready: false },

  // ── the void (Lane 2: API, no source image) ────────────────
  "the-silence": { spz: "/worlds/the-silence.spz", ready: false },

  // ── 2 transition rooms (placard must be legible) ───────────
  "wildenstein-1934": { spz: "/worlds/wildenstein-1934.spz", ready: false },
  "bordeaux-1981": { spz: "/worlds/bordeaux-1981.spz", ready: false },
};

/** The streamable source for a context's world, or null if not generated yet. */
export function worldSrc(id: string): string | null {
  const w = WORLDS[id];
  return w && w.ready ? w.spz : null;
}
