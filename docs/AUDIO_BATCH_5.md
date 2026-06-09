# Audio Batch — the final 5 worlds (the LAST build step)

All 11 worlds are splatted + visually calibrated. This is the only remaining work:
**one dedicated session** that scores the five back-half worlds together —
**bordeaux-1981 · canberra-1986 · yokohama-1989 · paris-mam-2006 · lillehammer-2025** —
tuned as a SET against the already-locked **void ↔ met-1974 spine**.

> Why one session, not piecemeal: the liveness arc only tunes by A/B-ing neighbours.
> Do all five in one go so the 80s segment + the homecoming + the final rest can be
> balanced against each other and against the fixed spine. (Audio generation is FREE —
> no Marble credits — so iterate freely.)

---

## The liveness arc — where these 5 sit

The piece breathes; these five carry the back half of the curve (spine in **bold**, locked):

intimate (le-cannet) → grand-public (carnegie) → exclusive hush (wildenstein) →
cold/emptying (stockholm) → **DEAD SILENCE (void)** → **ALIVE AGAIN (met-74, loudest/warmest)** →
bordeaux → canberra → yokohama → **paris-mam = FULLEST/WARMEST (homecoming)** →
lillehammer = **LIVING quiet** (NOT the void's death — the journey resting).

Tune so: met-74 stays the loudest room; paris-mam is the only thing that rivals it
(densest, warmest); lillehammer settles to a living hush that is unmistakably *alive*
(snow-muffled, gentle) — never the void's silence-of-death.

## The design rule (every room)

1. a **realist INTERIOR soundmark** — one sound both realistic AND unmistakable inside a
   sealed, climate-controlled museum (the load-bearing element);
2. **murmur flavored by language/accent** (a faint bed — accent is a bonus, the soundmark
   carries the place);
3. at most **ONE faint, accurate EXTERIOR place-stamp**, kept at threshold level so it reads
   as "the world outside this room," never "we're standing in it."

Honest reckoning (settled w/ user): inside a sealed art museum you hear almost nothing from
outside, so interior soundmarks = realism; the exterior leaks are deliberate, ACCURATE
stylization (consistent with the piece's other non-realism). **Never imply war/theft anywhere**
(void constraint — applies to the whole piece).

---

## Per-world soundmarks + grounding (real splat scale from calibration)

Positions are world-space; camera spawns at the listed spawn, looking down −Z. Frame depths
let you place "next-door" / "outside" sources behind the end wall and beds at room scale.
Mirror the existing worlds' positioning discipline (crowds/voices live NEXT DOOR, not in-room).

### bordeaux-1981 🇫🇷 — frame z≈−25.4 (deep barrel-vault nave) · spawn z−11.5
- **INTERIOR soundmark:** footsteps echoing up a **stone stairwell** (barrel-vault reverb —
  the 18th-c staircase is off to the right of the nave).
- **Murmur:** provincial French, low.
- **EXTERIOR stamp (threshold):** distant **Bordeaux cathedral (Saint-André) bells**.

### canberra-1986 🇦🇺 — frame z≈−3.77 (symmetric two-arch pier) · spawn z2.916
- **INTERIOR soundmark:** climate-control hum + hushed feet on timber/concrete.
- **Murmur:** faint English in **Aussie accents**.
- **EXTERIOR stamp (threshold/faint):** **Australian MAGPIE carol** (omnipresent in Canberra
  parkland); optional cockatoo screech / currawong. **NOT kookaburra** (that's bushland
  dawn/dusk, not the constant).

### yokohama-1989 🇯🇵 — frame z≈−13 (deep skylit Minato Mirai hall) · spawn z0
- **INTERIOR soundmark:** soft institutional **chime/announcement tone** (very Japanese
  public-space) + HVAC.
- **Murmur:** faint, polite Japanese.
- **EXTERIOR stamp (threshold/faint):** a **distant, occasional ship's horn** (real active
  port, horns carry across the bay). **NOT a foggy-dock foghorn** — 1989 Minato Mirai was
  gleaming brand-new waterfront, not a gritty working dock.

### paris-mam-2006 🇫🇷 — frame z≈−5.4 · spawn z0 — THE HOMECOMING (fullest/warmest)
- **The densest, warmest gallery buzz of the whole journey** — celebratory French crowd bed
  (already slated for a crowd bed; the room is visually empty but sonically the most alive).
  Should rival met-74 for fullness. Warm murmur, movement, the buzz of a major show.

### lillehammer-2025 🇳🇴 — frame z≈−8.9 · spawn z−3.5 — THE FINAL REST (living quiet)
- A **LIVING quiet**, NOT the void's death: snow-muffled stillness, soft Norwegian, gentle
  modern-HVAC breath. The journey comes to rest. Sparse — closest to silence of the five, but
  warm/alive, with a faint contemporary-room tone. (No placard, no grade — full color.)

---

## Engine — `app/lib/worldaudio.ts` (already built, just add entries)

`WORLD_AUDIO: Record<id, AudioSource[]>`. The five worlds have **no entries yet** — that's the
work. `WorldViewer` already calls `initWorldAudio` for every world; `soundmap.ts` already holds
the human-readable design intent for all five (keep it in sync if intent shifts).

`AudioSource` fields:
```ts
{ id, url,
  position: [x,y,z],     // relative to world origin; ignored if spatial:false
  volume, refDistance, rolloff,
  mode: "loop" | "intermittent",
  spatial?: boolean,     // default true = mono HRTF point (THREE.PositionalAudio).
                         // false = STEREO non-positional bed (THREE.Audio) — use when the
                         // clip carries its OWN baked movement (cf. void clock L→R pan).
  every?:  [min,max],    // intermittent: seconds between triggers
  window?: [min,max],    // intermittent: seconds of clip per trigger
  gain?:   [min,max] }   // intermittent: per-trigger gain variation
```

**Working templates to copy from (already user-approved):**
- **le-cannet-studio** — clean loop + two intermittent point sources (garden bed + brush/jar).
- **wildenstein-1934** — the **rarity hierarchy** pattern (one steady interior loop = radiator,
  + 4 intermittent events spaced by frequency) and the **shared scheduler bus**: intermittent
  hits reserve the timeline for their length + `MIN_GAP` (6.5s) so no two ever collide. Use this
  for any world with several intermittent events (canberra magpie + murmur, yokohama chime +
  horn, bordeaux footsteps + bells).
- **the-silence (void)** — `spatial:false` stereo bed with baked L→R pan; the model for a
  disembodied bed (paris-mam crowd could go either way — try point-source "next door" first).
- **met-1974** — the loudness/warmth ceiling to A/B paris-mam and lillehammer against.

**Engine cache gotcha (bites during by-ear iteration):** browsers cache mp3s by URL. After
re-processing a file, **append `?v=N`** to its `url` in WORLD_AUDIO (bump N each re-cut) or the
old audio is masked on reload. Several entries already use `?v=2`.

---

## Sourcing — CC0 / PD only

- **Freesound** filtered `license:"Creative Commons 0"` for foley (chimes, magpie/cockatoo,
  ship horns, church bells, footsteps/stairwell reverb, HVAC, crowd beds).
- **Wikimedia Commons** (PD/CC).
- **Period footage** → PD-by-age via `yt-dlp --download-sections` (used for wildenstein's 1930s
  NYC street/horn). For these five it's mostly contemporary foley, so Freesound CC0 covers it.
- Easy finds: church bells, magpie/cockatoo, ship horns, Japanese chime, stairwell footsteps,
  crowd murmur. **Language-specific murmur is the one hard piece** — but accent in a faint bed
  is subtle, so the soundmark carries the place; murmur accent is a bonus, not a requirement.

## Cleaning + verifying

- ffmpeg recipes live in **`docs/WORLD_GEN.md` § Audio** (denoise, gate, reverb, lowpass — the
  le-cannet/spine recipes that worked). **Don't over-muffle.**
  - bed denoise: `highpass=f=85,afftdn=nr=20:nf=-40:tn=1,lowpass=f=12000,volume=-2dB`
  - zsh gotcha: unquoted `$VARS` don't word-split — inline ffmpeg flags, don't stash in a var.
- **The headless preview is VISUAL-ONLY — you cannot audition.** Verify objectively with
  `astats` (noise floor / SNR) + confirm each file serves **200** over the network. Then do the
  real tuning **by ear in a normal browser** (levels start from-spec, then trust the ears).
- 2–3 mono HRTF sources/world at real splat scale (halls are ~16–25m deep — see frame depths
  above); crowds/voices = "next door," positioned behind the end wall or through side openings.

## Wiring checklist (per world)

1. Drop cleaned clips at `public/worlds/audio/<id>/<name>.mp3` (dir is gitignored like the spz —
   the existing 6 worlds' audio dirs are there; push audio to the deploy host separately).
2. Add the world's `AudioSource[]` to `WORLD_AUDIO` in `app/lib/worldaudio.ts`.
3. Keep `soundmap.ts` intent in sync if anything changed.
4. Deep-link `#world=<id>`, walk it in a real browser, tune levels/positions/gaps by ear.
5. A/B the whole back half against met-74 (warmth ceiling) and the void (silence floor).

When these five are done + auditioned, **the entire piece is finished.**
