/**
 * Sound map — 2–3 historically grounded, spatially positioned sounds per
 * enterable world (the Painted Time discipline: real, locatable, period-true,
 * never generic ambience). The sonic arc IS the provenance arc: full → thinning
 * → drop → return → fullest → settled quiet. Keyed by context `id`.
 *
 * Copy is the design intent; actual positioned audio is wired into each world
 * once the worlds exist (the void must always stay silent of war/theft).
 */

export interface WorldSound {
  /** Short label for the sound source. */
  label: string;
  /** What it is and roughly where it sits, for the eventual spatial mix. */
  note: string;
}

export const SOUND_MAP: Record<string, WorldSound[]> = {
  "le-cannet-studio": [
    { label: "Hillside birdsong & cicada", note: "Côte d'Azur, through an open window" },
    { label: "Wet brushwork", note: "a brush turning in a turpentine jar, close" },
    { label: "Marthe, another room", note: "domestic presence, never quite seen" },
  ],
  "carnegie-1924": [
    { label: "Gallery murmur", note: "low crowd, the painting suddenly among people" },
    { label: "Footsteps", note: "hard institutional floor" },
    { label: "Hung-room acoustic", note: "the dead air of a large gallery" },
  ],
  "wildenstein-1934": [
    { label: "Steamer's horn", note: "distant — the first Atlantic crossing" },
    { label: "Crate creak", note: "timber working in the swell" },
    { label: "Ship's hold", note: "muffled, mid-ocean" },
  ],
  "stockholm-1939": [
    { label: "Formal European gallery", note: "quieter, low Swedish voices" },
    { label: "Thinning room tone", note: "emptying as the void threshold nears" },
  ],
  "the-silence": [
    { label: "Faint private apartment", note: "a clock, shutters closed" },
    { label: "Held breath", note: "near-nothing — the drop, located, never war" },
  ],
  "met-impressionist-epoch-1974": [
    { label: "American crowd", note: "English voices, different timbre" },
    { label: "Period HVAC hum", note: "1970s blockbuster bustle — sound returns before the label" },
  ],
  "bordeaux-1981": [
    { label: "French voices", note: "the mother tongue back since 1939, tender" },
    { label: "Passing footsteps", note: "brief, light" },
  ],
  "yokohama-1989": [
    { label: "Japanese gallery voices", note: "a different register of hush" },
    { label: "Museum acoustics", note: "crowd behavior differs audibly" },
    { label: "Faint harbor note", note: "far underneath — the ocean it crossed" },
  ],
  "paris-mam-2006": [
    { label: "Retrospective density", note: "French voices, celebratory — the fullest room" },
    { label: "Homecoming bustle", note: "the most alive the painting ever sounds" },
  ],
  "stockholm-nationalmuseum-2025": [
    { label: "Cold open acoustics", note: "spacious, quiet Scandinavian gallery tone" },
    { label: "Echo of 1939", note: "the loop closes where it went dark — warm now" },
  ],
  "lillehammer-2025": [
    { label: "Northern gallery quiet", note: "contemporary, spacious, settled" },
    { label: "Final stillness", note: "a short northern hop closes a life of crossings" },
  ],
};
