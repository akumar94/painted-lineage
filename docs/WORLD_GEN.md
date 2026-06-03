# Painted Lineage — World & Sound build sheet

The single source for generating the 11 enterable worlds and scoring them.
Front end is **done**; this is the asset phase. **World #1 (`le-cannet-studio`)
is fully built (splat + 3 spatial sounds).** 10 worlds + the void remain.

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

**Prompt all 10 ourselves** (don't feed the real photos raw — they drag in other
art/visitors). Real photos are *styling reference only*. Feed the prompt straight
to Marble (text→world) or alongside a reference image. **Marble does NOT take a
negative prompt via our API client** — exclusions are folded into each positive
("no people, no modern objects").

**Shared spine (in every prompt):** eye-level · a clear floor receding to a
door/window at the far end (this is what makes it walkable) · one coherent space ·
**no people** (crowds are *sound*) · no anachronistic objects · through-line
painting = *"a framed painting of a woman in a green blouse seated at a small table
with a coffee cup"* on a wall — EXCEPT the studio (on the easel, unfinished) and
the void (absent).

**Grey → color arc:** B&W for the institutional past (`carnegie-1924`,
`wildenstein-1934`, `stockholm-1939`); the void its own grey; **color returns at
`met-1974`** (the resurrection pivot) and stays color through the present.

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

### 2. `carnegie-1924` — B&W; first public show
> Black-and-white 1920s period photograph of a grand American museum painting gallery, skylit Beaux-Arts hall. Salon-style walls densely hung with gilt-framed paintings; polished floor; an enfilade of tall arched doorways receding into further rooms (eye-level, deep recession). On the main wall, a framed painting of a woman in a green blouse at a coffee table, with a small placard. Cavernous, formal, empty. Soft silver-gelatin grain. No people, no modern objects. One coherent walkable space.

### 3. `wildenstein-1934` — B&W; transition; placard "THE CUP OF COFFEE"
> Black-and-white 1930s photograph of a refined Manhattan private-gallery room in a limestone townhouse. Paneled walls, parquet floor, a doorway at the far end opening to the next room (eye-level, clear recession through the passage). On the end wall, spotlit, a framed painting of a woman in a green blouse at a coffee table, beneath a large, prominent engraved wall placard. Hushed, elegant. No people, no modern objects. One coherent walkable space.

### 4. `stockholm-1939` — B&W; last show before the silence
> Black-and-white 1939 photograph of a spare Stockholm modern-art gallery, restrained Nordic-functionalist interior. Plain pale walls, only a few framed French paintings, a wood floor, soft northern daylight from tall windows. The room empties toward a single far doorway/threshold at the end, which the view faces and recedes toward (eye-level, strong depth). On a side wall, a framed painting of a woman in a green blouse at a coffee table. Quiet, sparse, emptying. No people, no modern objects. One coherent walkable space.

### 5. `the-silence` — THE VOID; no image; Marble 1.1 **Plus** (5 cubes); never war
> A vast, dissolving, fog-filled void; the faint, receding suggestion of a shuttered private Paris apartment — closed shutters, a single clock, dust in still air — fading into boundless grey emptiness; silent, elegiac, domestic, withdrawn; endless formless space; no people, no windows to the outside world.

### 6. `met-impressionist-epoch-1974` — COLOR pivot; the resurrection; missing label
> Color photograph of a 1970s Metropolitan Museum painting gallery — warm walls, period track lighting, gilt-framed Impressionist paintings, parquet floor, the gallery receding into the next room (eye-level, deep recession). On the main wall, a framed painting of a woman in a green blouse at a coffee table — with a conspicuously BLANK, empty stretch of wall beside it where a label would be (no placard, no text). The first warm color after a grey passage. No people, no modern objects. One coherent walkable space.

### 7. `bordeaux-1981` — color; transition; placard "LE CORSAGE VERT"
> Color photograph of a 1980s French municipal exhibition hall (Bordeaux): a long barrel-vaulted nave, tall plain walls hung with paintings, an 18th-century stone staircase with a wrought-iron rail to one side, stone floor, daylight, the view running down the long room (eye-level, strong recession). On the main wall, a framed painting of a woman in a green blouse at a coffee table, beneath a clear wall placard. Light, airy, passing-through. No people, no modern objects beyond the room itself. One coherent walkable space.

### 8. `yokohama-1989` — color; the Pacific, furthest from home
> Color photograph of a late-1980s Japanese museum — a monumental skylit hall of pale stone and glass, clean symmetrical modern geometric architecture, polished stone floor receding into depth (eye-level). On a wall, a framed painting of a woman in a green blouse at a coffee table. At the far end, a large window gives a distant glimpse of harbor water under grey light. Spacious, hushed, modern, faintly maritime. No people, no modern clutter. One coherent walkable space.

### 9. `paris-mam-2006` — color; full homecoming, the fullest room
> Color photograph of a grand Paris modern-art museum gallery — high ceilings, warm walls densely hung with many Bonnard paintings, golden light, an enfilade of rooms receding through wide openings (eye-level, deep recession). Among the works on the main wall, a framed painting of a woman in a green blouse at a coffee table. Full, rich, celebratory, alive — the densest, warmest room. No people, no modern clutter. One coherent walkable space.

### 10. `stockholm-nationalmuseum-2025` — color, cool; the loop closes
> Color photograph of a contemporary Nordic national art museum gallery — pale spacious walls, elegant restrained architecture, cool even daylight, a wood or pale-stone floor receding toward an arched opening to the next gallery (eye-level, clear depth). On the main wall, a framed painting of a woman in a green blouse at a coffee table. Calm, contemporary, spacious, cool — an echo of an older Stockholm room, but warm now. No people, no clutter. One coherent walkable space.

### 11. `lillehammer-2025` — color; the present, final pin
> Color photograph of a contemporary Norwegian art museum interior — light wood and pale concrete, soft northern daylight, a spacious still gallery, the floor receding toward a quiet far opening (eye-level, gentle depth). On the main wall, a framed painting of a woman in a green blouse at a coffee table. Quiet, settled, contemporary, final. No people, no clutter. One coherent walkable space.

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
