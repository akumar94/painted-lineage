# Painted Lineage — World & Sound build sheet

The single source for generating the 11 enterable worlds and scoring them.
Front end is **done**; this is the asset phase. **Worlds #1 (`le-cannet-studio`)
and #2 (`carnegie-1924`) are fully built.** 9 worlds + the void remain.

## Hard-won learnings (build these into every world)

**Pipeline: Gemini image → Marble splat.** Text→Marble gives cottage-cheese; the
Gemini still is your control + cheap approval gate. Generate **wide/landscape with
deep one-point perspective** (receding doorways/floor) — that recession is what makes
the splat *walkable*; if it looks flat, re-roll the image BEFORE splatting. Strip
Gemini's ✦ watermark (bottom-right) first — patch it with floor texture (PIL, sample
from the left at the same rows, feather).

**THE FRAME IS THE TRAP. Marble reshapes the frame to fit whatever painting it
hallucinates inside it** — it squared a portrait frame to fit a landscape abstract,
and a portrait painting can't fill a square frame without an ugly compromise (mat
whitespace / a crop that kills the signature / a flat wall-patch). So:
- Prompt Gemini for a **tall PORTRAIT empty frame** matching the Green Blouse aspect
  **0.685 (428×625)**. Empty frame, no baked painting (Marble mangles baked paintings
  AND a baked landscape pulls the frame wide).
- **The instant a splat lands, sanity-check the frame's aspect BEFORE any calibration.**
  A wrong-aspect frame cannot be fixed in post — re-roll the image. This one check
  would have saved the entire Carnegie-v2 detour.

**The painting overlay (works great):** overlay the real `/the-green-blouse.jpg` as a
flat plane (`WORLD_PAINTING`, keyed by id) covering Marble's junk canvas. Plane rides
~0.5m IN FRONT of the frame surface — closer and the splat's canvas gaussians wash it
out; the 0.5m float is invisible head-on (accept it). Calibrate the frame DEPTH by
**translate-only two-point triangulation** (move camera straight on −Z at two z's,
measure frame px-height, solve) — do NOT trust oblique views: SparkControls clobbers
`camera.rotation`, so after any `lookAt` the "straight-on" is secretly yawed. Reload
for a clean −Z camera; only translate during calibration. **Load-gate** the plane on
`splat.initialized` so it doesn't float in blur before the room streams in.

**The placard (BUILT — same trick as the painting).** Small composited plaque overlaid
below the painting — the venue's title rendered in code so it's crisp (image models
garble text). This is the renaming motif (per-world title) and the load-bearing labels
(Wildenstein "THE CUP OF COFFEE", Bordeaux "LE CORSAGE VERT", Met-74 = missing).
- `scripts/make_placard.py` (PIL/Palatino, the project serif) → `public/placards/<id>.png`.
  Museum wall-label card: ivory ground, gilt keyline, title prominent + artist/dates
  beneath. Data-driven `PLACARDS` dict already holds all 3 label worlds; `blank:True`
  renders Met-74's empty card. **`wildenstein-1934.png` is rendered.**
- `app/lib/worldplacard.ts` (`WORLD_PLACARD`, keyed by id) mirrors `worldpainting.ts`:
  flat transparent plane, load-gated on `splat.initialized`, wired into `WorldViewer`.
  `WORLD_PLACARD` is empty — fill the per-world placement during calibration (template
  in-file), sitting the card just below + in front of the frame.

**Carve+overlay a frame ourselves: DON'T** (tried, abandoned). SplatEdit BOX
`opacity:0` does delete splats, but carving the frame reveals behind-wall garbage, a
flat wall-color patch can't match the wall's lit gradient, and PIL-drawn frames look
amateur next to real ones. Rely on the splat's own (correctly-shaped) frame.

**Spawn + controls:** per-world `WORLD_SPAWN` (set BEFORE SparkControls, which inherits
the pose). Don't spawn nose-to-canvas — start back so the hall reads, painting as the
focal point. **Walk speed 3.2** (`fpsMovement.moveSpeed`), global default. Dev tools:
`#world=<id>` deep-link + `window.__pl` {camera,scene,THREE} handle, both gated to the
hash.

**Audio:** 2–3 mono HRTF point sources, ffmpeg-cleaned. **Don't over-muffle** (low
lowpass = mud) — keep highs, let HRTF + distance spatialize. Position at the REAL splat
scale (halls are ~16–18m deep). "Crowds are sound": the murmur lives NEXT DOOR (deep at
the far arches), never in-room. CC0 preferred (Freesound preview mp3s are scrapable from
the page CDN, no API key); CC-BY needs a CREDITS.md line. Can't audition headless — tune
by ear in a real browser.

**Process:** image gen is cheap, splatting costs credits — iterate the 2D image first.
Back up the current splat before swapping. And don't tunnel on "can we technically do
it" — keep asking if the RESULT actually looks good (the carve "worked" and looked bad).

## Wiring a finished world (drop-in, no code)

1. Generate in Marble → export `.spz`.
2. Drop it at **`public/worlds/<context-id>.spz`** (filename = the context id).
3. In **`app/lib/worlds.ts`**, flip `ready: true` for that id.
   → the atlas pin streams it instead of the placeholder. `contexts.ts` stays locked.

## Model choice

- **Marble 1.1** for all 10 room/gallery worlds (human-scale; keeps **Expand**).
- **Marble 1.1 Plus** ONLY for `the-silence` (boundless, dynamic cubes; terminal,
  Expand disabled — fine, you never grow the void). Steer prompt for a 5-cube result.

## Strategy (settled)

**Pipeline (settled): Gemini image → Marble splat**, not text→Marble. Pure
text→Marble gave Carnegie a cramped "cottage-cheese" vault; world #1 (the good one)
used a reference image. So **Gemini paints the still image first** — you control
scale, light, and deep perspective, and approve the cheap artifact before spending a
splat — then upload *that image* to Marble (image→world). Gemini paints the room with
an **EMPTY framed canvas** on the wall (no painting reference fed in) — the real scan
is superimposed at runtime by the `WORLD_PAINTING` plane. Baking the painting via a
Gemini reference was tried and rejected: it turned the picture into a giant
freestanding centerpiece, and Marble re-Gaussian-izes baked pixels soft anyway. Empty
frame keeps the room honest and the painting crisp.

**Don't feed real install photos raw** (they drag in other art/visitors). **Marble
takes no negative prompt** via our API client — exclusions fold into each positive
("no people, no modern objects"). The prompts below now read as **Gemini image
prompts**; for image→Marble the deep one-point recession is what keeps the splat
walkable.

**Shared spine (in every prompt):** eye-level · a clear floor receding to a
door/window at the far end (this is what makes it walkable) · one coherent space ·
**no people** (crowds are *sound*) · no anachronistic objects · through-line
painting = **an empty framed canvas** (a blank, primed canvas in a plain gilt
frame, placard beneath) on a wall — EXCEPT the studio (the *unfinished* canvas on
the easel) and the void (the same empty frame, dim and unlabeled, on the private
apartment wall).

**Painting = empty frame + composite (SETTLED).** Do NOT have Marble paint the
picture. A rich painting descriptor makes Marble *zoom into the canvas* and shrink
the whole room — Carnegie's first try spawned us nose-to-canvas inside a cramped
vault, the painting itself a hilarious photoreal fake. Instead prompt only for an
**empty framed canvas** on the wall, then composite the real scan
`public/the-green-blouse.jpg` (Met open-access, 428×625) over it: a textured plane
in the Three.js scene via `app/lib/worldpainting.ts` (`WORLD_PAINTING`, keyed by
id), hand-calibrated per world once its splat exists. Galleries get the scan as-is;
the void gets a darkened version. NEVER feed the painting to Marble as a *world*
reference — it drags the whole room toward the painting's palette.

**Spawn (per world): never nose-to-canvas.** Place each world's spawn back from the
painting wall, facing *down the room* (the recession / the enfilade), so you arrive
looking into the space — not point-blank at the picture. Hand-set per world during
calibration (alongside the painting plane).

**Color arc — the void is the ONLY desaturated space.** Every world is full color;
the institutional past is *not* grey (it never was — only the film was). The sole
chromatic event is the silence: **color drains as you enter `the-silence` and floods
back the instant you leave it** (void → `met-1974`). The "return of color" *is* the
resurrection, landing at the void's exit — the one place that was a genuine absence.
No room is ever colorless where color simply looks better. The painting, too, is
color everywhere except inside the void (composited darkened/desaturated there).

**Placards (load-bearing, 3 worlds):** image models garble text — render the
placard prominent/high-contrast, and **composite the text in cleanly afterward**:
Wildenstein "THE CUP OF COFFEE", Bordeaux "LE CORSAGE vert", Met-74 = a
*conspicuously blank/missing* label.

---

## The 11 prompts (walk order)

### 1. `le-cannet-studio` — ✅ DONE (warm color; the making)
Splat = "Sunlit Room, Intimist Garden View". Reference = a real Ma Roulotte
interior photo (modern intrusions edited out). The green blouse is *on the easel,
unfinished* — every later world hangs it finished.
> Interior of Pierre Bonnard's home around 1920 — a small, intimate, sunlit room with a tiled floor of worn patterned cement tiles. Eye-level. Foreground: a round pedestal table draped in an embroidered white cutwork cloth, and a smaller white-draped side table. Thick old walls with deep window reveals. At left, a French door and a tall many-paned window stand open behind long sheer cream linen curtains, onto a luminous green garden — lawn, a fruit tree, a rose arbor and a path beyond the threshold, a clipped hedge, a faint hint of distant hills. Strong warm backlight floods in; the room interior sits in soft shade. At left, an unframed canvas on a wooden easel — wet and unfinished, the beginnings of a woman in a green blouse seated at a coffee table, loosely blocked in — with a palette and brushes on a stool beside it. On the right wall, a different framed Bonnard interior (a nude or a garden still life), warm-toned. Warm patterned wallpaper in faded ochre, rose and gold. Intimate, lived-in, Intimist. No people, no modern objects. One deep, coherent, walkable space — the eye drawn outward through the open door to the garden.

### 2. `carnegie-1924` — color; first public show — 🔄 regenerating (Gemini→Marble)
**Status:** first text→Marble splat scrapped (cottage-cheese vault). Gemini's first
color try gave *excellent* architecture (deep recession, skylit vault, salon hang) but
came back sepia with a vintage photo border, and the painting as a giant freestanding
centerpiece. Fix = **empty frame, full color, hung flat on the far wall**, real scan
superimposed at runtime (`WORLD_PAINTING` plane). **No painting reference fed to
Gemini.** Color Gemini prompt below.
> A grand Beaux-Arts museum painting gallery — a contemporary color photograph in vivid, natural color. NOT black-and-white, not sepia, not a vintage or antique photograph; no photographic border, no vignette, no watermark — the image fills the frame edge to edge. A cavernous, formal exhibition hall: a high coffered ceiling with a large glass skylight overhead flooding the hall with soft, even daylight. Tall pale plaster walls hung salon-style with rows of gilt-framed paintings. A wide, polished stone floor. The view looks straight down the room at eye level, with a long enfilade of tall arched doorways receding through several further galleries into the distance — strong, deep one-point perspective. The hall is empty and silent, monumental and dignified. On the far end wall ahead, centered at eye level, a single prominent EMPTY framed canvas — a blank, primed off-white canvas in a simple gilt frame, hung flat against the wall (not freestanding, not on a stand or easel), slightly larger than the surrounding paintings, with a small engraved placard beneath it. The canvas is blank — no picture or image on it. Warm, natural color, soft daylight, sharp deep focus, fine photographic detail. No people, no modern objects, no electric fixtures, no signage. Wide landscape format.

### 3. `wildenstein-1934` — ✅ DONE (visual); color; transition; placard "THE CUP OF COFFEE"
**Status:** Gemini→Marble (re-roll for depth — central pier + flanking doorways, dark
walnut). Splat dropped, `ready:true`. Massive townhouse hall — frame ~9.5m down −Z.
Calibrated: `WORLD_PAINTING` [−0.045,1.088,−11.4] h1.47 · `WORLD_PLACARD`
[−0.045,0.18,−11.35] h0.13 · `WORLD_SPAWN` [0,1.6,−3]. **Audio still TODO** (batch).
**Aspect-mismatch lesson:** the splat opening is 0.649 (1.0×1.55m) but the scan is
0.685 — even gilt reveal on all 4 sides is IMPOSSIBLE without distorting the artwork
(never do that). Fix = size the plane to **fill/slightly over-cover** the opening (no
white gaps; canvas edge rides the gilt lip uniformly) and center on both axes, rather
than fit-to-width (which leaves a white band top/bottom). Bias toward over-cover.
Source still: `Splats/Refs/wildenstein_clean.png`. Original Gemini prompt below.
**Two calibration lessons (re-fixed this session):** (1) the frame was ~12m down,
not ~9.5 — a spawn-only depth guess put the plane 2.4m in FRONT of the frame, so it
looked oversized/overflowing. **Triangulate depth from two straight-on −Z views
(measure opening px-height at two camera z's, solve) — don't eyeball depth from one
view.** (2) Placard restyled from a stark ivory CARD to an **engraved brass nameplate**
(`make_placard.py` rewritten, now 660×220 ~3:1, `PLACARD_ASPECT` updated) so it blends
with the walnut/gilt instead of fighting the splat's own baked brass plate.
> Color photograph of a refined 1930s Manhattan private-gallery room in a limestone townhouse. Paneled walls, parquet floor, a doorway at the far end opening to the next room (eye-level, clear recession through the passage). On the end wall, spotlit, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright, beneath a large, prominent engraved wall placard. Hushed, elegant. No people, no modern objects. One coherent walkable space.

### 4. `stockholm-1939` — color; last show before the silence
**Re-roll lesson (2026-06-05):** the original prompt (below, struck) put the empty
frame on a *side* wall with the recession aimed at a far doorway. The still came back
with the hero frame oblique on the left wall (breaks the face-down-the-room composite
pattern) and the opening too square (~0.84 vs our 0.685 scan). Decision w/ user:
**switch to the proven axial end-wall pattern** (Carnegie/Wildenstein) — empty frame
centered on the wall we walk straight toward, square to camera, room tunnels via
one-point recession. Pushed the portrait spec harder ("emphatically taller than wide,
narrow upright rectangle") since 5:7 came back as 0.84. Use this prompt:
> Color photograph of a spare 1939 Stockholm modern-art gallery, restrained Nordic-functionalist interior — plain pale walls, a plank wood floor, soft northern daylight from tall windows along the left wall. The view looks straight down the length of the room, the side walls receding symmetrically toward a single end wall (eye-level, strong one-point perspective, deep recession). Centered on that far end wall, square to the camera, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame, emphatically taller than wide (about 5:7, a narrow upright rectangle), the frame upright. A few small French paintings hang sparsely on the side walls. Quiet, sparse, emptying, hushed. No people, no modern objects. One coherent walkable space, the empty portrait frame the clear focal point at the end.

~~Original (rejected): Color photograph of a spare 1939 Stockholm modern-art gallery, restrained Nordic-functionalist interior. Plain pale walls, only a few framed French paintings, a wood floor, soft northern daylight from tall windows. The room empties toward a single far doorway/threshold at the end, which the view faces and recedes toward (eye-level, strong depth). On a side wall, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright. Quiet, sparse, emptying. No people, no modern objects. One coherent walkable space.~~

### 5. `the-silence` — THE VOID; no ref image; Marble 1.1 **Plus** (5 cubes); never war
The painting is **present but unshown** here — the reframe: in 1939–1974 it wasn't gone,
it hung on a private apartment wall, lived with, never publicly exhibited. Every public
world shows it lit + labeled; the void shows the same painting dim + unlabeled.
> A vast, dissolving, fog-filled grey void; within it the faint, receding suggestion of a shuttered private Paris apartment — closed shutters, a single clock, dust suspended in still air. On one dim interior wall, barely lit and half-lost in the grey, a small empty framed canvas — a blank canvas in a plain frame — no placard, no label, hung as if simply lived with, not shown (the real scan, darkened, is composited in). The apartment dissolves into boundless formless emptiness. Silent, elegiac, domestic, withdrawn; no people, no windows to the outside world.

### 6. `met-impressionist-epoch-1974` — the resurrection (color floods back out of the void); missing label
> Color photograph of a 1970s Metropolitan Museum painting gallery — warm walls, period track lighting, gilt-framed Impressionist paintings, parquet floor, the gallery receding into the next room (eye-level, deep recession). On the main wall, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright — with a conspicuously BLANK, empty stretch of wall beside it where a label would be (no placard, no text). Color floods back here — the room you step into straight out of the void's grey; the resurrection. No people, no modern objects. One coherent walkable space.

### 7. `bordeaux-1981` — color; transition; placard "LE CORSAGE VERT"
> Color photograph of a 1980s French municipal exhibition hall (Bordeaux): a long barrel-vaulted nave, tall plain walls hung with paintings, an 18th-century stone staircase with a wrought-iron rail to one side, stone floor, daylight, the view running down the long room (eye-level, strong recession). On the main wall, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright, beneath a clear wall placard. Light, airy, passing-through. No people, no modern objects beyond the room itself. One coherent walkable space.

### 8. `yokohama-1989` — color; the Pacific, furthest from home
> Color photograph of a late-1980s Japanese museum — a monumental skylit hall of pale stone and glass, clean symmetrical modern geometric architecture, polished stone floor receding into depth (eye-level). On a wall, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright. At the far end, a large window gives a distant glimpse of harbor water under grey light. Spacious, hushed, modern, faintly maritime. No people, no modern clutter. One coherent walkable space.

### 9. `paris-mam-2006` — color; full homecoming, the fullest room
> Color photograph of a grand Paris modern-art museum gallery — high ceilings, warm walls densely hung with many Bonnard paintings, golden light, an enfilade of rooms receding through wide openings (eye-level, deep recession). Among the works on the main wall, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright. Full, rich, celebratory, alive — the densest, warmest room. No people, no modern clutter. One coherent walkable space.

### 10. `canberra-1986` — color; on tour from the Met, the furthest south (4th continent)
**Swapped in for `stockholm-nationalmuseum-2025` (2026-06-05):** Stockholm-2025 was demoted
to an atlas card pin (the 1939↔2025 loop rhyme lives on the globe + its card; as a walkable
room it nearly duplicated Lillehammer's cool-Nordic box). Canberra is REAL provenance —
Australian National Gallery, "20th Century Masters from the Met," Mar 1986 — and adds a 4th
walkable continent + the missing "the Met sends it out into the world" beat. Chronologically
mid-journey (1986, between bordeaux-81 and yokohama-89), not at the tail. Prompt bakes in the
Stockholm lessons (axial end-wall frame, emphatic portrait):
> Color photograph of a mid-1980s Australian National Gallery exhibition room — board-formed concrete walls (the gallery's brutalist architecture), diffused daylight from above through a skylight or clerestory, a warm timber or pale-stone floor receding toward an opening to the next gallery (eye-level, strong one-point recession). Centered on the far end wall, square to the camera, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame, emphatically taller than wide (about 5:7, a narrow upright rectangle), the frame upright. Cool, spacious, modern, hushed — an international touring show. No people, no modern clutter. One coherent walkable space, the empty portrait frame the clear focal point at the end.

### 11. `lillehammer-2025` — color; the present, final pin
> Color photograph of a contemporary Norwegian art museum interior — light wood and pale concrete, soft northern daylight, a spacious still gallery, the floor receding toward a quiet far opening (eye-level, gentle depth). On the main wall, a single empty framed canvas — a blank primed canvas in a TALL PORTRAIT-format gilt frame (distinctly taller than wide, about 5:7), the frame upright. Quiet, settled, contemporary, final. No people, no clutter. One coherent walkable space.

---

## Real photo references (styling only; openly licensed)

| World | URL | License / credit |
|---|---|---|
| yokohama-1989 | https://upload.wikimedia.org/wikipedia/commons/7/73/Yokohama_Museum_interior.jpg | CC BY-SA 3.0 — Takuro1202 |
| paris-mam-2006 | https://upload.wikimedia.org/wikipedia/commons/0/03/Jean_Metzinger%2C_L%27Oiseau_Bleu_%28left%29%2C_Andr%C3%A9_Lhote%2C_two_works_%28center%29%2C_Albert_Gleizes%2C_Baigneuse_%28right%29%2C_Mus%C3%A9e_d%27Art_Moderne_de_la_Ville_de_Paris.jpg | CC BY 3.0 — Coldcreation |
| canberra-1986 | _TBD — source a CC image of an Australian National Gallery interior (board-formed concrete + skylit galleries); else generate per the §10 prompt_ | — |
| lillehammer-2025 | https://upload.wikimedia.org/wikipedia/commons/a/ac/LillehammerArtmuseum6554.JPG | CC BY-SA 4.0 — Yaakov |

Carnegie/Wildenstein/Stockholm-39/Met-74/Bordeaux: no clean open interior — generate per prompts. Met-74 has real B&W install plates in the free MetPublications PDF (`Impressionism_A_Centenary_Exhibition.pdf`) if authenticity wanted.

---

## Audio (per world, after the splat exists)

Engine: `app/lib/worldaudio.ts` — `THREE.PositionalAudio` (default panningModel
'HRTF' = binaural), one listener on the camera. Config keyed by world id in
`WORLD_AUDIO`. Modes: `loop` (bed) | `intermittent` (random window of clip on a
random timer — irregular gestures). Sources that 404 are skipped (drop the file
later → auto-activates). `WorldViewer` calls `initWorldAudio(scene, camera, id)`.

Design intent per world: `app/lib/soundmap.ts`. 2–3 sounds, non-intrusive. Crawl
**Wikimedia Commons** (PD/CC, direct URLs) for nature/ambience and **Freesound**
(filter `license:"Creative Commons 0"`) for foley. Clean every sample with ffmpeg.

**ffmpeg recipes that worked (le-cannet):**
- Ambient bed denoise: `highpass=f=85,afftdn=nr=20:nf=-40:tn=1,lowpass=f=12000,volume=-2dB`
- Foley with hissy gaps (noise GATE kills inter-event hiss): `highpass=f=130,afftdn=nr=22:nf=-45:tn=1,agate=threshold=0.02:range=0.02:ratio=8:attack=3:release=200,lowpass=f=8000` → mono mp3
- Wet/liquid foley + subtle room: `highpass=f=120,afftdn=nr=18:nf=-42:tn=1,lowpass=f=7500,aecho=0.9:0.85:18|30|45:0.28|0.2|0.13,volume=-3dB` → mono mp3
- Always output `-ac 1` (mono) for a clean HRTF point source. Verify with
  `astats` (noise floor / SNR) — can't audition in the headless preview.

**le-cannet sources used:** garden = Commons PD "Gentle breeze and birds singing.ogg";
dry brush = Freesound "normal paint strokes"; wet jar = Freesound 657552 (CC0,
Tom_Kaszuba). Positions: garden bed to the window direction (low/wide), brush +
jar a tight bubble at the easel. Tune positions/levels by ear — preview is visual-only.

## Resume in a new chat

**Worlds #1 (`le-cannet-studio`) and #2 (`carnegie-1924`) are DONE. Next: #3
`wildenstein-1934`** (first load-bearing placard — "THE CUP OF COFFEE").

Opener: *"Continue Painted Lineage, world #3 `wildenstein-1934`. Read
docs/WORLD_GEN.md (esp. the Hard-won learnings up top) and memory first."* Then,
in order: (1) get the Gemini image — prompt §3 below, **specify a TALL PORTRAIT
empty frame**; (2) **before splatting**, confirm the still has deep perspective +
a portrait frame; (3) strip the ✦ watermark; (4) splat in Marble; (5) drop
`public/worlds/wildenstein-1934.spz`, flip `ready:true`; (6) **first check the
splat's frame aspect is portrait** — re-roll if not; (7) calibrate `WORLD_PAINTING`
+ `WORLD_SPAWN` + `WORLD_PLACARD` + `WORLD_AUDIO`.

**Placard system is BUILT** — `scripts/make_placard.py`, `app/lib/worldplacard.ts`, wired
into `WorldViewer`; `public/placards/wildenstein-1934.png` ("THE CUP OF COFFEE") rendered.

**Worlds #1 #2 #3 #4 #5 are visually DONE.** #1 #2 also have audio; #3 #4 #5 audio is
TODO (the void's audio waits for the spine batch — see DECISIONS below).

**STRATEGY (settled w/ user 2026-06-03): splat + calibrate ALL remaining worlds first,
THEN do audio as one arc-aware batch** (the sonic arc full→thinning→void→return→fullest
is only tunable by A/B-ing adjacent rooms; audio is downstream of splats anyway since
positions need real splat scale; and it batches the crawl/ffmpeg/by-ear-tune toolchain).
Pipeline the Marble jobs (calibrate landed ones while others generate). Do the audio batch
across 2–3 sittings by arc segment, not one marathon.

**World #4 `stockholm-1939` — DONE (visual; audio TODO).** Re-rolled once (first still
had an oblique side-wall frame + 0.84 opening → switched to axial end-wall pattern, §4).
Calibrated: `WORLD_PAINTING` [0.15,1.8,−10.16] h2.05 (deep room — frame ~10.2m down −Z;
opening ≈1.31×2.02m, aspect 0.649, over-covered with 0.685 scan) · `WORLD_SPAWN`
[0,1.6,−0.5] (near the entrance — establishing view down the emptying hall) · no
placard. Source `Splats/Refs/stockholm-1939_clean.png`.

**DECISIONS (locked w/ user 2026-06-06):** (1) **build the void NOW**, not last —
it's the one unproven pipeline (1.1 Plus / no-ref / 5-cube), so de-risk it while
fresh; the 6 image-worlds share the proven recipe and batch after. (2) **Audio
batch starts after the SPINE is splatted** (void + met-1974) — the drop→return is
the most adjacency-dependent moment and needs both rooms to A/B. Back-half audio
follows once those worlds land.

**Code-side void treatment — DONE ahead of the splat (2026-06-06).** The chromatic
arc is wired and verified against the placeholder: `WORLD_GRADE` in `worlds.ts` +
an animated CSS filter on the canvas in `WorldViewer` (grades the WHOLE scene —
splat AND composited painting — with no Spark-pipeline coupling). `the-silence`
DRAINS to `saturate(0.12) brightness(0.78)` over 3s once the splat is ready;
`met-impressionist-epoch-1974` FLOODS back to full color over 2.2s (starts
desaturated, as if just out of the grey). Tune the exact values/curve against the
REAL void splat when it lands. The darkened painting composite is then just a
`WORLD_PAINTING["the-silence"]` entry (the global grade already dims+desaturates
it; no separate darkened asset needed) — no placard entry = unlabeled, as required.

**World #5 `the-silence` — THE VOID — DONE (visual; audio TODO in the spine batch).**
Pivoted from the no-image text→Marble plan to **image→Marble**: Gemini painted the
ref from the §5 prompt (a frontal TALL-PORTRAIT empty frame in a shuttered Paris
apartment dissolving into grey), watermark stripped → `Splats/Refs/thesilence_clean.png`,
splatted plain **1.1**. Calibrated: `WORLD_PAINTING["the-silence"]` [−0.55,1.38,−6.9]
h1.66 (deep room — frame ≈6.9m down −Z, triangulated from 220px@z0 / 345px@z−2.5,
parallax-nulled; opening aspect ≈0.64 so height over-covers per the W/S rule) ·
`WORLD_SPAWN` [0,1.6,0.6] (stand back, painting quiet on the left wall, clock+console
dissolving right) · **no placard** (unlabeled, by design). The Green Blouse is PRESENT
but unshown — the `WORLD_GRADE` drain desaturates+dims the plane along with the room,
so the plain scan reads "hung as if lived with, not shown" with no separate dark asset.
NEVER war/theft (honored — pure quiet withdrawal).

**DECISION (2026-06-06): the color FLOOD at met-1974 was CUT.** The void's drain
stays; met-1974 (and every other room) renders full color from frame one. Rationale:
you reach met-1974 from the color atlas, not straight from the void, so a flood would
make met-1974 briefly read as a *second* desaturated room — diluting the void's
singularity ("the void is the ONLY desaturated space"). The resurrection is delivered
structurally (one grey room in a world of color) + the conspicuously MISSING label,
not by an animated effect. `WORLD_GRADE` now has only `the-silence`. (If we ever want
a literal color-return, the right home is the void's EXIT fade, not met-1974's entry.)

**Resume next: world #6 `met-impressionist-epoch-1974`** — the resurrection
(conspicuously MISSING label; the painting back in public light). §6 prompt,
image→Marble 1.1, TALL PORTRAIT frame. It's a normal full-color world now — no grade
entry. Resurrection reads through subject + the blank wall where the label should be.
After #5, continue down the walk order (#6 met-1974, #7 bordeaux-1981 w/ placard "LE
CORSAGE VERT", #8 yokohama, #9 paris-mam, #10 canberra-1986 — swapped in for stockholm-2025,
see §10, #11 lillehammer), THEN the audio batch. **Calibration recipe (worked #3 #4):** deep-link `#world=<id>`, add a live
magenta test plane via `window.__pl` {camera,scene,THREE} (keep it `transparent:true`
even at opacity 1 — an opaque plane renders before the Spark splat pass and gets occluded;
`depthTest:false`, `renderOrder:999`), drive `camera.position` directly (set spawn first;
SparkControls only clobbers rotation, not position, so translate-only works). **Triangulate
depth from two straight-on −Z views via the opening's pixel height** (height is immune to
slight frame yaw): `Zf = (h1·z1 − h2·z2)/(h1 − h2)`. Confirm the plane stays locked to the
opening at both distances (parallax null), swap in `/the-green-blouse.jpg` to judge the real
composite, write values to config, reload via real code path to verify.
