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

**The placard (works great, same trick):** small composited plaque overlaid below the
painting — render the venue's title in code (PIL) so it's crisp (image models garble
text). This is the renaming motif (per-world title) and the load-bearing labels
(Wildenstein "THE CUP OF COFFEE", Bordeaux "LE CORSAGE VERT", Met-74 = missing).

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

### 3. `wildenstein-1934` — color; transition; placard "THE CUP OF COFFEE"
> Color photograph of a refined 1930s Manhattan private-gallery room in a limestone townhouse. Paneled walls, parquet floor, a doorway at the far end opening to the next room (eye-level, clear recession through the passage). On the end wall, spotlit, a single empty framed canvas — a blank primed canvas in a plain gilt frame, beneath a large, prominent engraved wall placard. Hushed, elegant. No people, no modern objects. One coherent walkable space.

### 4. `stockholm-1939` — color; last show before the silence
> Color photograph of a spare 1939 Stockholm modern-art gallery, restrained Nordic-functionalist interior. Plain pale walls, only a few framed French paintings, a wood floor, soft northern daylight from tall windows. The room empties toward a single far doorway/threshold at the end, which the view faces and recedes toward (eye-level, strong depth). On a side wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame. Quiet, sparse, emptying. No people, no modern objects. One coherent walkable space.

### 5. `the-silence` — THE VOID; no ref image; Marble 1.1 **Plus** (5 cubes); never war
The painting is **present but unshown** here — the reframe: in 1939–1974 it wasn't gone,
it hung on a private apartment wall, lived with, never publicly exhibited. Every public
world shows it lit + labeled; the void shows the same painting dim + unlabeled.
> A vast, dissolving, fog-filled grey void; within it the faint, receding suggestion of a shuttered private Paris apartment — closed shutters, a single clock, dust suspended in still air. On one dim interior wall, barely lit and half-lost in the grey, a small empty framed canvas — a blank canvas in a plain frame — no placard, no label, hung as if simply lived with, not shown (the real scan, darkened, is composited in). The apartment dissolves into boundless formless emptiness. Silent, elegiac, domestic, withdrawn; no people, no windows to the outside world.

### 6. `met-impressionist-epoch-1974` — the resurrection (color floods back out of the void); missing label
> Color photograph of a 1970s Metropolitan Museum painting gallery — warm walls, period track lighting, gilt-framed Impressionist paintings, parquet floor, the gallery receding into the next room (eye-level, deep recession). On the main wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame — with a conspicuously BLANK, empty stretch of wall beside it where a label would be (no placard, no text). Color floods back here — the room you step into straight out of the void's grey; the resurrection. No people, no modern objects. One coherent walkable space.

### 7. `bordeaux-1981` — color; transition; placard "LE CORSAGE VERT"
> Color photograph of a 1980s French municipal exhibition hall (Bordeaux): a long barrel-vaulted nave, tall plain walls hung with paintings, an 18th-century stone staircase with a wrought-iron rail to one side, stone floor, daylight, the view running down the long room (eye-level, strong recession). On the main wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame, beneath a clear wall placard. Light, airy, passing-through. No people, no modern objects beyond the room itself. One coherent walkable space.

### 8. `yokohama-1989` — color; the Pacific, furthest from home
> Color photograph of a late-1980s Japanese museum — a monumental skylit hall of pale stone and glass, clean symmetrical modern geometric architecture, polished stone floor receding into depth (eye-level). On a wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame. At the far end, a large window gives a distant glimpse of harbor water under grey light. Spacious, hushed, modern, faintly maritime. No people, no modern clutter. One coherent walkable space.

### 9. `paris-mam-2006` — color; full homecoming, the fullest room
> Color photograph of a grand Paris modern-art museum gallery — high ceilings, warm walls densely hung with many Bonnard paintings, golden light, an enfilade of rooms receding through wide openings (eye-level, deep recession). Among the works on the main wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame. Full, rich, celebratory, alive — the densest, warmest room. No people, no modern clutter. One coherent walkable space.

### 10. `stockholm-nationalmuseum-2025` — color, cool; the loop closes
> Color photograph of a contemporary Nordic national art museum gallery — pale spacious walls, elegant restrained architecture, cool even daylight, a wood or pale-stone floor receding toward an arched opening to the next gallery (eye-level, clear depth). On the main wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame. Calm, contemporary, spacious, cool — an echo of an older Stockholm room, but warm now. No people, no clutter. One coherent walkable space.

### 11. `lillehammer-2025` — color; the present, final pin
> Color photograph of a contemporary Norwegian art museum interior — light wood and pale concrete, soft northern daylight, a spacious still gallery, the floor receding toward a quiet far opening (eye-level, gentle depth). On the main wall, a single empty framed canvas — a blank primed canvas in a plain gilt frame. Quiet, settled, contemporary, final. No people, no clutter. One coherent walkable space.

---

## Real photo references (styling only; openly licensed)

| World | URL | License / credit |
|---|---|---|
| yokohama-1989 | https://upload.wikimedia.org/wikipedia/commons/7/73/Yokohama_Museum_interior.jpg | CC BY-SA 3.0 — Takuro1202 |
| paris-mam-2006 | https://upload.wikimedia.org/wikipedia/commons/0/03/Jean_Metzinger%2C_L%27Oiseau_Bleu_%28left%29%2C_Andr%C3%A9_Lhote%2C_two_works_%28center%29%2C_Albert_Gleizes%2C_Baigneuse_%28right%29%2C_Mus%C3%A9e_d%27Art_Moderne_de_la_Ville_de_Paris.jpg | CC BY 3.0 — Coldcreation |
| stockholm-2025 | https://upload.wikimedia.org/wikipedia/commons/c/c1/One_of_the_galleries_at_the_Nationalmuseum%2C_Stockholm%2C_Sweden.jpg | CC BY-SA 4.0 — O.S.M. Amin |
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

"Continue Painted Lineage. World #1 (le-cannet-studio) is done. Next is `<id>` —
here's the splat at Splats/<file>. Read docs/WORLD_GEN.md and memory." The new
session auto-loads the project memory; this doc has the rest.
