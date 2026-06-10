/**
 * Spatial audio for the worlds — a port of the Painted Time rig.
 *
 * Each source is a THREE.PositionalAudio (which wraps a Web Audio PannerNode,
 * default panningModel 'HRTF' → binaural) parented to an Object3D at a world
 * position, with one AudioListener on the camera. Two playback modes:
 *   - loop:        a continuous bed (e.g. the garden through the open door)
 *   - intermittent: fire a short random window of the clip at irregular gaps
 *                   (e.g. brush strokes at the easel — an irregular hand)
 *
 * Sources whose file 404s are skipped (so a not-yet-added sound — the jar —
 * is harmless until you drop it in). The sonic map intent lives in
 * soundmap.ts; this is the playable wiring.
 */

import * as THREE from "three";

export type AudioMode = "loop" | "intermittent";

export interface AudioSource {
  id: string;
  url: string;
  /** Position relative to the world origin (camera starts near [0,1.6,0]). */
  position: [number, number, number];
  volume: number;
  refDistance: number;
  rolloff: number;
  mode: AudioMode;
  /**
   * Default true → a mono HRTF point source (THREE.PositionalAudio) placed at
   * `position` and spatialized against the camera. Set false for a STEREO,
   * non-positional bed (THREE.Audio) played straight to the listener — used when
   * the clip carries its own baked movement (e.g. the void clock's L→R auto-pan +
   * phaser), so it reads as a disembodied presence rather than a fixed point.
   * When false, `position`/`refDistance`/`rolloff` are ignored.
   */
  spatial?: boolean;
  /** intermittent: [min,max] seconds between triggers. */
  every?: [number, number];
  /** intermittent: [min,max] seconds of clip to play per trigger. */
  window?: [number, number];
  /** intermittent: [min,max] gain multiplier per trigger (variation). */
  gain?: [number, number];
}

export const WORLD_AUDIO: Record<string, AudioSource[]> = {
  "le-cannet-studio": [
    // The garden, seeping in through the open door — a low bed to the NE
    // (the window/door direction from spawn). +X = east, -Z = north (forward).
    {
      id: "garden",
      url: "/worlds/audio/le-cannet/garden.mp3",
      position: [3.5, 0.4, -3.5],
      volume: 0.5,
      refDistance: 4,
      rolloff: 0.7,
      mode: "loop",
    },
    // Wet brushwork at the easel — a tight bubble, irregular bursts.
    {
      id: "brush",
      url: "/worlds/audio/le-cannet/brush.mp3",
      position: [-0.7, 1.1, -0.6],
      volume: 0.42,
      refDistance: 1.1,
      rolloff: 2.4,
      mode: "intermittent",
      every: [5, 11],
      window: [0.8, 1.6],
      gain: [0.7, 1.0],
    },
    // Brush swirled in the turpentine jar — rarer counterpoint.
    // Drop /worlds/audio/le-cannet/jar.mp3 and it activates automatically.
    {
      id: "jar",
      url: "/worlds/audio/le-cannet/jar.mp3",
      position: [-0.5, 0.9, -0.5],
      volume: 0.55,
      refDistance: 1.1,
      rolloff: 2.4,
      mode: "intermittent",
      every: [11, 20],
      window: [1.4, 2.6],
      gain: [0.8, 1.0],
    },
  ],

  // Carnegie 1924 — the first PUBLIC show. "No people" is visual; the public is
  // sound, and it lives NEXT DOOR: the murmur comes from the galleries beyond the
  // far arches, never from this room. Positioned at the real splat scale — the
  // hall runs ~18m down −Z, the painting/pier at z≈-17, the far arches beyond it.
  // Spawn is mid-hall (z≈-8.5) looking down the enfilade.
  "carnegie-1924": [
    // The hall's air — a wide, high bed that fills the whole room.
    {
      id: "room",
      url: "/worlds/audio/carnegie/bed.mp3?v=2",
      position: [0, 4, -11],
      volume: 0.6,
      refDistance: 12,
      rolloff: 0.35,
      mode: "loop",
    },
    // Distant gallery murmur — the populated galleries BEYOND the pier, heard
    // down the enfilade through the far arches. Localized deep ahead so it reads
    // as "next door," and gets louder as you walk toward the far end.
    {
      id: "murmur",
      url: "/worlds/audio/carnegie/murmur.mp3?v=2",
      position: [0, 1.6, -21],
      volume: 0.5,
      refDistance: 8,
      rolloff: 0.7,
      mode: "loop",
    },
    // One visitor crossing the hard floor near the pier — echoing footfalls.
    {
      id: "footsteps",
      url: "/worlds/audio/carnegie/footsteps.mp3",
      position: [3.5, 0.1, -14],
      volume: 0.55,
      refDistance: 4,
      rolloff: 1.4,
      mode: "intermittent",
      every: [7, 16],
      window: [1.5, 3.5],
      gain: [0.6, 1.0],
    },
  ],

  // Wildenstein 1934 — NOT a public crowd. The register is the EXCLUSIVE HUSH of
  // a private dealer's uptown townhouse. Interior soundmark carries the place: a
  // period-exact 1934 steam radiator (knock + hiss). Spawn is the hero shot at
  // z≈-6.3 looking down −Z to the gold frame at z≈-11.4; the hall is lopsided
  // (recessing passage left −X, window-lit doorway right +X). NO steamer's horn /
  // ocean — you hear none of that sealed inside a Manhattan townhouse (realism rule).
  "wildenstein-1934": [
    // THE soundmark — a genuine NYC steam radiator (period-exact 1934), but kept as a
    // FAINT, steady background hiss under the right window. A dealer's townhouse, not a
    // boiler room: present enough to place the era, never loud enough to notice.
    {
      id: "radiator",
      url: "/worlds/audio/wildenstein/radiator.mp3",
      position: [2.6, 0.25, -8.5],
      volume: 0.4,
      refDistance: 2.5,
      rolloff: 1.8,
      mode: "loop",
    },
    // A vintage car driving past on the street below — an occasional period pass (clean CC0
    // antique-car drive-by). Replaced the laughter-y murmur AND the siren-cursed 1930s street
    // bed, both cut. window = full clip so the Doppler pass plays whole, never cut mid. Outside.
    {
      id: "car",
      url: "/worlds/audio/wildenstein/car.mp3?v=2",
      position: [4.5, 0.6, -9],
      volume: 0.3,
      refDistance: 5,
      rolloff: 1.6,
      mode: "intermittent",
      every: [58, 110],
      window: [7.1, 7.1],
      gain: [0.6, 1.0],
    },
    // A single period car horn poking through — the 1930s Harlem cab honk. Rare, from the
    // street. (File pending: YouTube grab, 0:29–0:31 — 404-skips until dropped.)
    {
      id: "horn",
      url: "/worlds/audio/wildenstein/horn.mp3",
      position: [5, 1.0, -8.5],
      volume: 0.2,
      refDistance: 5,
      rolloff: 1.6,
      mode: "intermittent",
      every: [80, 150],
      window: [1.5, 2.8],
      gain: [0.5, 0.9],
    },
    // A horse-cart clopping past down on the street — faint, occasional period texture
    // (1934 NYC still had carts). Ground level, outside.
    {
      id: "horse",
      url: "/worlds/audio/wildenstein/horse.mp3",
      position: [4.8, 0.15, -9],
      volume: 0.25,
      refDistance: 5,
      rolloff: 1.7,
      mode: "intermittent",
      every: [28, 56],
      window: [2, 2.6],
      gain: [0.5, 0.9],
    },
    // A telephone ringing in the next room — a 1930s brassy mechanical bell, the gap-filler.
    // The BUSINESS of art: deals made by phone in the hush. Muffled (down the hall), occasional;
    // window = full ring-pause-ring so it never cuts mid-ring.
    {
      id: "phone",
      url: "/worlds/audio/wildenstein/phone.mp3",
      position: [-3, 1.2, -7],
      volume: 0.6,
      refDistance: 4,
      rolloff: 1.2,
      mode: "intermittent",
      every: [26, 50],
      window: [7.1, 7.1],
      gain: [0.6, 1.0],
    },
  ],

  // Stockholm 1939 — cold, emptying, PRE-SILENCE. The room thins toward the void.
  // Spawn near the entrance (z≈-0.5) looking down the long hall to the painting at
  // z≈-10.16; tall windows line the walls. Sparse to near-none human presence —
  // the emptiness IS the content. NO radio war-news (void constraint: never war).
  "stockholm-1939": [
    // THE soundmark — wind pressing the tall windows: a cold, low bed that fills
    // the emptying hall.
    {
      id: "wind",
      url: "/worlds/audio/stockholm/wind.mp3",
      position: [0, 1.9, -5],
      volume: 0.21,
      refDistance: 9,
      rolloff: 0.5,
      mode: "loop",
    },
    // A SINGLE set of footsteps echoing on the plank floor — emptiness rendered as
    // reverb. Rare, one visitor crossing; echo baked into the clip (ffmpeg aecho).
    {
      id: "footsteps",
      url: "/worlds/audio/stockholm/footsteps.mp3",
      position: [-2.5, 0.1, -5.5],
      volume: 0.6,
      refDistance: 4,
      rolloff: 1.4,
      mode: "intermittent",
      every: [14, 30],
      window: [2, 4],
      gain: [0.6, 1.0],
    },
    // A slow, distant Gamla stan church bell, heard from INSIDE (muffled + room reverb).
    // The clip is ONE full toll bracketed by fades; window = full clip so it never cuts
    // mid-decay (the abrupt-stop fix). Quieter (you're indoors), very rare.
    {
      id: "bell",
      url: "/worlds/audio/stockholm/bell.mp3",
      position: [3, 4, -13],
      volume: 0.22,
      refDistance: 10,
      rolloff: 0.8,
      mode: "intermittent",
      every: [40, 80],
      window: [6.6, 6.6],
      gain: [0.7, 1.0],
    },
    // A distant tram rounding a curve — iron wheels squealing on rails, the uniquely
    // 1939-Stockholm period exterior stamp. Rare and faint, from the street below.
    // (Kept sparse so the room stays cold/emptying — see the void-arc note.)
    {
      id: "tram",
      url: "/worlds/audio/stockholm/tram.mp3",
      position: [-4.5, 1.2, -7],
      volume: 0.42,
      refDistance: 6,
      rolloff: 1.2,
      mode: "intermittent",
      every: [24, 36],
      window: [4, 7],
      gain: [0.6, 1.0],
    },
  ],

  // THE VOID — DEAD SILENCE, but near-silence, not zero. The painting waits in a
  // shuttered Paris apartment. Spawn z≈0.6, painting quiet on the LEFT wall (z≈-6.9),
  // clock + console dissolving to the right. Tune the TOTAL loudness FAR below
  // met-1974 — this room is the trough; met-74 is the peak; the jump between them
  // IS the resurrection. NEVER war/theft — pure private withdrawal.
  "the-silence": [
    // THE void's heartbeat — a real grandfather/pendulum clock (the §5 prompt's clock), pitched
    // down for a slow, hollow, ominous tock. Haunting: dampened reverb + slow phaser + a slow
    // L→R auto-pan baked in, wrap-crossfaded for a seamless loop (no seam stutter). spatial:false
    // → a STEREO disembodied presence drifting across the field. The only prominent sound; carries the room.
    {
      id: "clock",
      url: "/worlds/audio/void/clock.mp3",
      position: [1.6, 1.0, -1.5], // ignored (spatial:false) — kept for reference
      volume: 0.4,
      refDistance: 3,
      rolloff: 1.2,
      mode: "loop",
      spatial: false,
    },
    // The shuttered apartment settling — dust, a rare timber creak. Faint, irregular.
    {
      id: "creak",
      url: "/worlds/audio/void/creak.mp3",
      position: [-2, 1.6, -3],
      volume: 0.3,
      refDistance: 3,
      rolloff: 1.8,
      mode: "intermittent",
      every: [20, 30],
      window: [1, 2.5],
      gain: [0.5, 0.9],
    },
    // A distant, INDIFFERENT Paris far outside the closed shutters — life goes on;
    // the painting waits. Sub-threshold, muffled. Never war/theft, just the city.
    {
      id: "paris",
      url: "/worlds/audio/void/paris.mp3",
      position: [3.2, 1.3, -5],
      volume: 0.18,
      refDistance: 5,
      rolloff: 1.4,
      mode: "loop",
    },
    // (An accordion drifted here once, but the void's power is silence — cut on purpose.
    // The `paris` drone alone carries the indifferent world outside.)
  ],

  // MET 1974 — THE RESURRECTION. The fullest, warmest, LOUDEST room in the piece;
  // the one you fall into out of the grey. Spawn z≈-1, painting at z≈-7.4. Needs zero
  // stylization — a dense warm American crowd is both realist AND distinctive. This is
  // the ONLY room allowed four sources: it must out-mass the void so the jump lands in
  // the body. A/B these levels DIRECTLY against the-silence (the spine).
  "met-impressionist-epoch-1974": [
    // The dense, warm American crowd — a wide prominent bed that fills the room.
    // People came back to the painting. English voices, a different timbre than Paris.
    {
      id: "crowd",
      url: "/worlds/audio/met-1974/crowd.mp3",
      position: [0, 1.8, -4.5],
      volume: 0.7,
      refDistance: 12,
      rolloff: 0.3,
      mode: "loop",
    },
    // A single squeak of a rubber sole on parquet — period-Met, distinctive, softened.
    // VERY sporadic by design: one rare squeak reads "museum floor," a steady stream
    // reads "basketball court." If even the rare one feels like a gym, cut it entirely.
    {
      id: "squeak",
      url: "/worlds/audio/met-1974/squeak.mp3",
      position: [2.5, 0.1, -3.5],
      volume: 0.4,
      refDistance: 3,
      rolloff: 1.6,
      mode: "intermittent",
      every: [16, 34],
      window: [0.3, 0.7],
      gain: [0.5, 0.9],
    },
    // A school group's children + a distant docent — a warmer second layer of life,
    // localized deeper (the next gallery).
    {
      id: "children",
      url: "/worlds/audio/met-1974/children.mp3",
      position: [-1.5, 1.5, -9],
      volume: 0.42,
      refDistance: 7,
      rolloff: 0.6,
      mode: "loop",
    },
    // Low '70s institutional HVAC hum — hard-lowpassed to a FELT background hum (not a
    // jet engine): sits under everything, never front-and-center. Low and high/far.
    {
      id: "hvac",
      url: "/worlds/audio/met-1974/hvac.mp3",
      position: [0, 3.8, -5],
      volume: 0.24,
      refDistance: 14,
      rolloff: 0.25,
      mode: "loop",
    },
    // The ONE exterior stamp, and the uniquely-NY signature — distant Fifth-Ave /
    // Central Park traffic with the occasional yellow-cab horn poking through. An ACTUAL
    // Manhattan hotel-window recording, muffled as if through the museum wall. NYC is
    // alive again, 1974. Distinct from carnegie's generic interior murmur; threshold level.
    {
      id: "nyc",
      url: "/worlds/audio/met-1974/nyc.mp3",
      position: [4, 2.2, 2.5],
      volume: 0.24,
      refDistance: 6,
      rolloff: 1.3,
      mode: "loop",
    },
  ],

  // ── BACK HALF (post-resurrection arc) ────────────────────────────────────
  // Tuned as a SET against the void↔met-74 spine: met-74 stays the single loudest
  // room; paris-mam is the only thing that RIVALS it (densest/warmest); lillehammer
  // settles to a LIVING hush (alive, not the void's death). Total-mass order:
  // void(trough) ≪ lillehammer(living-quiet) < bordeaux < canberra < yokohama <
  // paris-mam(≈met) ; met-74 = peak.

  // BORDEAUX 1981 — the first FRENCH room since the void; the mother tongue returns.
  // DELIBERATELY NOT stockholm's twin: stockholm = echoing-footsteps + church-bell, so
  // bordeaux drops both (no third footstep clone, no second bell world) and instead leans
  // its warmth on the returning French voices. Deep 18th-c barrel-vault nave: spawn z−11.5
  // looking down −Z to the frame at z−25.4 (~14m of stone ahead). The interior soundmark is
  // the cool stone vault tone; the exterior stamp is pétanque in a square (provincial-French,
  // warm — NOT bells, NOT a tram which is anachronistic for 1981 Bordeaux).
  "bordeaux-1981": [
    // THE soundmark — the cool, faintly reverberant air of a big 18th-c stone nave. A wide
    // high bed with a long natural tail, deep in the vault. Distinct from stockholm's wind
    // and carnegie's wood-hall air: this is STONE — cooler, with a longer decay.
    {
      id: "stone",
      url: "/worlds/audio/bordeaux/stone.mp3?v=3", // hard-lowpassed off the white-noise hiss → a warm low vault presence
      position: [0, 3.2, -16],
      volume: 0.38,
      refDistance: 11,
      rolloff: 0.34,
      mode: "loop",
    },
    // Provincial French voices, low and warm — the mother tongue back since 1939 (tender). Source
    // SWAPPED off the Paris-restaurant clip (cutlery clatter + a babbling baby read wrong for a
    // museum) to a Paris café-night ambiance; brought CLOSER + offset LEFT so the French is
    // audible and pans L/R. Warmer than stockholm's silence, still below paris-mam's homecoming.
    {
      id: "murmur",
      url: "/worlds/audio/bordeaux/murmur.mp3?v=3", // re-cut: denoise-FIRST kills the intro/loop hiss; starts on a voice-dense section
      position: [-3, 1.6, -16],
      volume: 0.3,
      refDistance: 8,
      rolloff: 0.7,
      mode: "intermittent", // bursts on the bus w/ petanque → they fire at different times (no overlap); stone is the constant vault bed
      every: [7, 14],
      window: [4, 7],
      gain: [0.7, 1.0],
    },
    // The one exterior stamp — pétanque in a nearby square: the soft metallic clack of boules
    // (+ faint daytime chatter) drifting in at threshold from off to the side. Provincial,
    // sunlit, unmistakably French. Rare, faint; window = full clip so a clack-and-settle never
    // cuts mid. (Fallback if clean clacks can't be sourced: a low square-ambience loop instead.)
    {
      id: "petanque",
      url: "/worlds/audio/bordeaux/petanque.mp3?v=2", // re-cut to ONE clean clack (tail hiss killed); each firing = a single clack, not a flurry
      position: [5, 0.8, -19], // RIGHT — L/R spread vs the left murmur
      volume: 0.14,
      refDistance: 6,
      rolloff: 1.3,
      mode: "intermittent",
      every: [24, 44], // rarer than the voices (every [7,14]) — the voices are the ~3× more frequent layer, by design
      window: [2, 3],
      gain: [0.6, 1.0],
    },
  ],

  // CANBERRA 1986 — the furthest-south, coolest-modern room: the ANG's brutalist concrete
  // hall. Symmetric two-arch pier — spawn z+2.9 looking −Z to the pier at z−3.77, arches
  // opening off either side to the parkland. Interior soundmark = a COOL climate hum (timbre
  // distinct from met's warm '70s hum); place-stamp = the omnipresent Canberra-parkland magpie
  // carol (NOT kookaburra — that's bushland dawn, not the constant).
  "canberra-1986": [
    // THE soundmark — re-cut to a FAINT, CLEAN quiet hum (brighter/fainter, wildenstein-radiator
    // register); the old version was a muddy low drone that fought the murmur. Barely noticed.
    {
      id: "hvac",
      url: "/worlds/audio/canberra/hvac.mp3?v=3", // cache-bust to the warm de-mudded cut + up for room FULLNESS (low-band body; mid chatter stays clear)
      position: [0, 3.5, -3],
      volume: 0.2,
      refDistance: 14,
      rolloff: 0.26,
      mode: "loop",
    },
    // The Met-masters-on-tour crowd, faint English in Aussie accents. Back to a LOW CONTINUOUS bed:
    // the intermittent version cut in/out weirdly over the hum and left long lags. A steady quiet
    // murmur fills the gaps and the magpie rides clearly over it — it's a BIRD vs low human voices,
    // so no mud (the earlier no-overlap worry was two voice-like sources, which no longer applies).
    {
      id: "murmur",
      url: "/worlds/audio/canberra/murmur.mp3?v=2",
      position: [1.5, 1.6, -4],
      volume: 0.15, // down to polite museum level + so it no longer drowns the magpie
      refDistance: 9,
      rolloff: 0.7,
      mode: "loop",
    },
    // The place-stamp — an Australian magpie's carolling warble. Re-cut MUFFLED and pushed
    // OUTSIDE: far out the LEFT arch, quieter, faster rolloff so it reads as parkland BEYOND the
    // room (it was sitting in-gallery before). Intermittent — on the bus with murmur (no overlap).
    {
      id: "magpie",
      url: "/worlds/audio/canberra/magpie.mp3?v=2",
      position: [-9, 3.0, 2],
      volume: 0.24, // up — now clearly rides ABOVE the lowered murmur (was being drowned)
      refDistance: 5,
      rolloff: 2.2,
      mode: "intermittent",
      every: [8, 16], // a touch more frequent — the murmur is now a continuous bed, so gaps don't read as "lag"
      window: [2.5, 5],
      gain: [0.5, 0.9],
    },
  ],

  // YOKOHAMA 1989 — gleaming brand-new Minato Mirai waterfront. Deep skylit hall: spawn z0
  // looking −Z down ~13m to the frame at z−13, symmetric side galleries. Interior soundmark =
  // the soft institutional CHIME/announcement tone (very Japanese public-space) over clean
  // late-80s HVAC; place-stamp = a distant, occasional ship's HORN carrying across the bay
  // (a real active port — NOT a gritty foghorn; 1989 Minato Mirai was gleaming, not a dock).
  "yokohama-1989": [
    // A faint, clean room hum — the continuous low FLOOR so the hall reads as a GALLERY, not an empty
    // airport concourse (a chime over silence was the airport tell). Felt, not heard. Reuses the clean
    // canberra hum (the original yokohama hvac was muddy; this is the de-mudded version, kept very low).
    {
      id: "hum",
      url: "/worlds/audio/yokohama/hum.mp3",
      position: [0, 4.0, -7],
      volume: 0.1,
      refDistance: 14,
      rolloff: 0.26,
      mode: "loop",
    },
    // THE soundmark — a soft two-tone institutional chime/announcement tone, the unmistakable
    // texture of a Japanese public space. Intentionally reads as INSIDE the hall — it's the
    // building's own PA. Gentle, rare, from a side gallery. window = full chime so it never cuts.
    {
      id: "chime",
      url: "/worlds/audio/yokohama/chime.mp3?v=2", // re-cut w/ light reverb to sit it BACK in the BG
      position: [3, 2.2, -8],
      volume: 0.32, // nudged up to punch over the walla floor
      refDistance: 6,
      rolloff: 1.1,
      mode: "intermittent",
      every: [74, 86], // ~every 80s (slight jitter so it's not metronomic) — a rare "ah, Japan" punctuation
      window: [3.5, 3.5],
      gain: [0.7, 1.0],
    },
    // Next-door murmur — ElevenLabs-generated polite museum walla (calm, indistinct, no shouting by
    // design — replaced the user-sourced crowd that ran hot). Measured dead-even + gap-free (ideal loop).
    // Muffled to next-room + a LOW CONTINUOUS loop (paris-style fullness); chime + full horn ride over it.
    {
      id: "murmur",
      url: "/worlds/audio/yokohama/murmur.mp3?v=6",
      position: [4.5, 1.6, -10],
      volume: 0.15, // pulled back down — at 0.22 the full walla bed masked the chime + horn; it's a floor, not the lead
      refDistance: 8,
      rolloff: 0.7,
      mode: "loop",
    },
    // The exterior stamp — a distant ship's horn across the bay. LOUDER + far more frequent so it
    // actually registers (was sub-threshold/too rare to ever hear). Still NOT a foggy foghorn;
    // window = full clip so the horn's long decay plays whole.
    {
      id: "ship",
      url: "/worlds/audio/yokohama/ship.mp3?v=3", // REVERTED to the full natural horn (lead-in swell + decay) — the one-shot lost the "real horn" feel
      position: [0, 2.5, -15],
      volume: 0.45, // cranked per review — punches clearly over the walla floor
      refDistance: 8,
      rolloff: 1.0,
      mode: "intermittent",
      every: [26, 52],
      window: [4, 7],
      gain: [0.7, 1.0],
    },
  ],

  // PARIS-MAM 2006 — THE HOMECOMING. Visually empty, sonically the FULLEST/WARMEST room of the
  // whole journey: a celebratory French retrospective buzz that RIVALS met-74 (densest, warmest)
  // without out-massing it — met stays the single loudest room. Spawn z0, pier at z−5.4. No
  // exterior stamp and no cold layer (no HVAC) on purpose — pure warm crowd is what makes it
  // rival met. A/B these levels DIRECTLY against met-74 (the warmth ceiling).
  "paris-mam-2006": [
    // The dense, warm buzz — REPLACED: was a restaurant (cutlery/baby, contextually wrong), now a
    // warm MUSEUM cocktail/opening crowd. Offset center-LEFT (pans L/R). Just under met's crowd so
    // met edges it on raw loudness, but with no cold layers it reads as the warmest, fullest room.
    {
      id: "crowd",
      url: "/worlds/audio/paris-mam/crowd.mp3?v=2",
      position: [-1, 1.8, -3.5],
      volume: 0.66,
      refDistance: 12,
      rolloff: 0.3,
      mode: "loop",
    },
    // A second layer — gallery-preview chatter (same restaurant clip swapped out). Offset RIGHT &
    // deeper (next room) so it pans L/R against the crowd as you walk.
    {
      id: "voices",
      url: "/worlds/audio/paris-mam/voices.mp3?v=2",
      position: [3, 1.5, -7],
      volume: 0.44,
      refDistance: 7,
      rolloff: 0.6,
      mode: "loop",
    },
    // The movement of a packed opening — soft shuffles/steps and the press of a crowd on the
    // gallery floor (NOT echoing solo footsteps — this is the warm churn of many). Offset LEFT
    // (vs right voices) for the L/R field. Frequent, gentle.
    {
      id: "movement",
      url: "/worlds/audio/paris-mam/movement.mp3?v=2", // footsteps re-cut −5dB + lower vol (user: only nit)
      position: [-2.5, 0.3, -4],
      volume: 0.2,
      refDistance: 4,
      rolloff: 1.2,
      mode: "intermittent",
      every: [9, 20],
      window: [1.5, 3],
      gain: [0.6, 1.0],
    },
  ],

  // LILLEHAMMER 2025 — THE FINAL REST: a LIVING quiet, NOT the void's death. Snow-muffled
  // stillness, soft Norwegian, the gentle breath of a modern Nordic gallery. Sparest of the
  // five (closest to silence) but unmistakably WARM/ALIVE — the journey coming to rest, not
  // the silence-of-death. Spawn z−3.5, frame at z−8.9. Total mass just above the void; A/B the
  // void DIRECTLY to keep this on the LIVING side of the line. Full color, no placard, no grade.
  "lillehammer-2025": [
    // THE soundmark — the soft, warm tone of a sealed contemporary gallery: gentle modern-HVAC
    // breath + a faint living room-tone. Low and present (alive), never the void's dead air.
    {
      id: "room",
      url: "/worlds/audio/lillehammer/room.mp3",
      position: [0, 3.0, -5],
      volume: 0.12, // down — the HVAC was "screaming"; it's now the FLOOR, below the café + whispers
      refDistance: 12,
      rolloff: 0.3,
      mode: "loop",
    },
    // The "alive" signal — REPLACES the murmur (the piece already leans hard on murmurs): a lone
    // SWEDISH blackbird singing through the window. Warm, melodic, unmistakably ALIVE (not the
    // void's death) and Nordic-true. Intermittent, off to the RIGHT (outside), for the L/R field.
    {
      id: "bird",
      url: "/worlds/audio/lillehammer/bird.mp3",
      position: [5, 2.5, -7],
      volume: 0.18,
      refDistance: 6,
      rolloff: 1.2,
      mode: "intermittent",
      every: [12, 24], // a touch more frequent — stays the star now that the café shares the bus
      window: [3, 6],
      gain: [0.5, 0.9],
    },
    // THE BOOKEND — a visitor SKETCHING the Green Blouse: the soft scratch of pencil on paper, a
    // couple of metres off to the left. The piece opened on Bonnard's BRUSH at le-cannet; it closes
    // on a new hand drawing the same painting — the lineage of making continues. Kept near-silent +
    // intimate (a sketch barely sounds); intermittent, on the bus with the bird so the two alternate
    // rather than overlap — the whole point of lillehammer is a sparse, LIVING quiet.
    {
      id: "sketch",
      url: "/worlds/audio/lillehammer/sketch.mp3?v=2", // re-cut −5dB + lower vol/refDist → quieter than le-cannet's brush (was WAY too loud)
      position: [-1.5, 1.0, -2.5],
      volume: 0.22, // nudged ~2.5dB down in the final mix (per review) — sat a touch loud
      refDistance: 1.2,
      rolloff: 2.4,
      mode: "intermittent",
      every: [9, 18],
      window: [3, 6],
      gain: [0.5, 0.9],
    },
    // The museum café in the next room — a soft, warm burble (espresso hiss, cups, low chatter) at
    // a distance. Added per review: lillehammer's meaning is SETTLED + alive, NOT low-headcount — a
    // gentle café keeps it a peaceful living room, not an empty one. Kept low/distant so the room
    // stays unhurried (well below paris-mam). Center-back, a warm bed under the sparse foreground.
    {
      id: "cafe",
      url: "/worlds/audio/lillehammer/cafe.mp3?v=5", // trimmed the "Bye!" off the tail; harder slam-taming; INTERMITTENT (~40% duty)
      position: [0, 1.3, -9],
      volume: 0.17,
      refDistance: 8,
      rolloff: 0.5,
      mode: "intermittent",
      every: [18, 28],
      window: [7, 11],
      gain: [0.8, 1.0],
    },
  ],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Wire a world's spatial audio into an existing Three scene + camera.
 * Returns a cleanup function. Safe to call with an unknown id (no-op).
 */
export function initWorldAudio(
  scene: THREE.Scene,
  camera: THREE.Camera,
  worldId: string | undefined,
): () => void {
  const sources = (worldId && WORLD_AUDIO[worldId]) || [];
  if (sources.length === 0) return () => {};

  const listener = new THREE.AudioListener();
  camera.add(listener);
  // The entering click is the user gesture; resume in case it's suspended.
  listener.context.resume?.();

  const loader = new THREE.AudioLoader();
  const active: Array<THREE.Audio | THREE.PositionalAudio> = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  let disposed = false;
  // Shared scheduler bus so a world's intermittent events never fire on top of one
  // another: each hit reserves the timeline for its own length + MIN_GAP, and any other
  // source that wants to fire during that window waits until the bus is free. (Loops are
  // not on the bus.) Keeps horn/horse/car/phone spaced instead of colliding.
  const MIN_GAP = 6.5; // seconds of clearance between any two intermittent hits
  const sched = { nextFreeAt: 0 };

  for (const src of sources) {
    loader.load(
      src.url,
      (buffer) => {
        if (disposed) return;
        const spatial = src.spatial !== false;
        const sound = spatial
          ? new THREE.PositionalAudio(listener)
          : new THREE.Audio(listener);
        sound.setBuffer(buffer);
        if (spatial) {
          const ps = sound as THREE.PositionalAudio;
          ps.setRefDistance(src.refDistance);
          ps.setRolloffFactor(src.rolloff);
          const holder = new THREE.Object3D();
          holder.position.set(...src.position);
          holder.add(ps);
          scene.add(holder);
        } else {
          // Non-positional stereo bed — straight to the listener, no panner.
          scene.add(sound);
        }
        sound.setVolume(src.volume);
        active.push(sound);

        if (src.mode === "loop") {
          sound.setLoop(true);
          sound.play();
          return;
        }

        // Intermittent: fire a random window of the clip on an irregular timer.
        const dur = buffer.duration;
        const fire = () => {
          if (disposed) return;
          // If the shared bus is still reserved by another (or this) event, wait for it
          // to clear rather than firing on top — this is what keeps events from colliding.
          const now = performance.now() / 1000;
          if (now < sched.nextFreeAt) {
            timers.push(setTimeout(fire, (sched.nextFreeAt - now + 0.05) * 1000));
            return;
          }
          const win = src.window ? rand(...src.window) : Math.min(1.2, dur);
          const off = Math.max(0, rand(0, Math.max(0, dur - win)));
          const g = src.gain ? rand(...src.gain) : 1;
          const playDur = Math.min(win, dur - off);
          // Reserve the bus for this event's length plus the clearance gap.
          sched.nextFreeAt = now + playDur + MIN_GAP;
          try {
            sound.stop();
          } catch {}
          sound.setLoop(false);
          sound.offset = off;
          sound.duration = playDur;
          sound.setVolume(src.volume * g);
          sound.play();
          const next = src.every ? rand(...src.every) : 8;
          timers.push(setTimeout(fire, next * 1000));
        };
        // Stagger the first hit so sources don't all start together.
        timers.push(setTimeout(fire, rand(1.5, 4) * 1000));
      },
      undefined,
      () => {
        // 404 / decode fail — source not present yet (e.g. the jar). Skip quietly.
      },
    );
  }

  return () => {
    disposed = true;
    timers.forEach(clearTimeout);
    active.forEach((s) => {
      try {
        s.stop();
      } catch {}
      s.disconnect();
    });
    camera.remove(listener);
  };
}
