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
    { label: "Steam radiator", note: "period-1934 NYC knock/hiss — the interior soundmark; exclusive townhouse hush, not a public crowd" },
    { label: "Two collectors", note: "low, moneyed English, off through the left passage — never in-room" },
    { label: "Muffled uptown street", note: "the one exterior stamp, at threshold — distant Manhattan traffic, not the El" },
  ],
  "stockholm-1939": [
    { label: "Wind on tall windows", note: "the interior soundmark — cold, low, filling the emptying hall" },
    { label: "A single set of footsteps", note: "echoing on the plank floor — emptiness rendered as reverb; one visitor, rare" },
    { label: "Distant Gamla stan bell", note: "Storkyrkan carillon far outside, threshold — the city beyond the cold glass. Never war." },
  ],
  "the-silence": [
    { label: "A single clock", note: "the void's heartbeat — the §5 prompt's clock, the only prominent sound" },
    { label: "Shuttered apartment creak", note: "dust, a rare timber settle — faint, irregular" },
    { label: "Indifferent distant Paris", note: "sub-threshold beyond the closed shutters — life goes on, the painting waits. NEVER war/theft" },
  ],
  "met-impressionist-epoch-1974": [
    { label: "Dense warm American crowd", note: "the RESURRECTION — fullest/loudest room; English voices, different timbre. People came back to it" },
    { label: "Squeak of rubber soles", note: "period-Met parquet foley — distinctive, close" },
    { label: "Children + distant docent", note: "a school group, a warmer second layer of life next door" },
    { label: "Low '70s HVAC hum", note: "institutional, almost-felt low bed — sound returns before the label" },
  ],
  "bordeaux-1981": [
    { label: "Cool stone barrel-vault tone", note: "the interior soundmark — deep, faintly reverberant air of the 18th-c stone nave, long natural tail. Distinct from stockholm's wind & carnegie's wood-hall air" },
    { label: "Provincial French voices", note: "the mother tongue back since 1939, tender — warmer/more present than stockholm's silence (the audible thaw after the void), still well below paris-mam" },
    { label: "Pétanque in a nearby square", note: "the one exterior stamp, at threshold — soft clack of boules + low daytime chatter from an outside square; provincial-French, warm. NOT church bells (stockholm already owns the bell) and NOT a tram (anachronistic — Bordeaux had none in 1981)" },
  ],
  "canberra-1986": [
    { label: "Touring-crowd murmur", note: "the Met's masters on tour — visitors at the far edge of the world" },
    { label: "Brutalist hall acoustics", note: "the ANG's concrete-and-skylight resonance, cool and modern (1986)" },
    { label: "Furthest-south hush", note: "the Southern Hemisphere — the longest the painting ever travelled from home" },
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
  "lillehammer-2025": [
    { label: "Northern gallery quiet", note: "contemporary, spacious, settled" },
    { label: "Final stillness", note: "a short northern hop closes a life of crossings" },
  ],
};
