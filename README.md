# Painted Lineage

Painted Lineage is the third work in the Painted trilogy. It takes a single
painting, Pierre Bonnard's *The Green Blouse* (*La Blouse verte / La Tasse de
café*, 1919, the Metropolitan Museum of Art), and renders its provenance as
traversable space.

The work begins from a disagreement with how provenance is recorded. A
catalogue lists an artwork's exhibition history as a column of entries: venue,
city, date, catalogue number, repeated down the page. The column is accurate and
it is chronological, and those are the two things it gets right. What it cannot
carry is everything that made the history physical. It flattens geography, so a
crate shipped across the Atlantic and a painting moved between two rooms read as
the same kind of line. And it renders absence as blank space, so the single most
consequential fact in this painting's life, the thirty-five years it spent
outside the exhibition record entirely, appears as nothing more than a gap
between two dates.

Painted Lineage treats the list as a lossy compression and the spatial work as
the decompression. Provenance is chronological, but it was also traveled, and it
also stopped. The globe restores the two dimensions the column discards:
geography lives in where the pins sit, and weight lives in how the path moves
between them and where it refuses to move at all.

The painting traveled to thirty-one exhibitions across twelve countries between
1924 and 2025. Between 1939 and 1974 it appeared in none of them. It passed
quietly through the Bernheim de Villers collection and was sold to the
Metropolitan through the dealer Sam Salz in 1963, but for thirty-five years it
was never publicly shown. On the
globe this is the one stretch where the path stops moving: every other era hops
between cities every few years, and the silence is the segment where the line
holds at a single point in Paris and goes still. The stillness is rendered
larger and cooler than any exhibited context, because the thing it represents
took up more of the painting's life than any single show. The void does the work
the gap in a catalogue cannot. It makes the absence occupy space.

## What the visitor does

The work opens on the painting, held still on a black field, and a single
instruction: follow the painting. Clicking it does not open the painting. It
opens a globe.

The globe carries all thirty-one exhibitions as pins, set at the real
coordinates of the cities that held them, and a single line runs through them in
the order they happened. The line crosses the Atlantic to New York in 1934,
returns to Stockholm in 1939, holds in Paris through the war years and the two
decades after, jumps back to New York in 1974, reaches Yokohama in 1989, returns
to Paris in 2006, and ends in Stockholm and Lillehammer in 2025. Each leg is the
real distance between the two cities, drawn on the globe at the length it was.

Ten of the pins open. Clicking one leaves the globe and streams a world the
visitor can walk through: the studio at Le Cannet where the painting was made,
the rooms that first showed it, the private silence of the war years, the
galleries that brought it back. Each built room carries two or three sounds
fixed in space and true to its place and period, so the painting is heard
differently in a 1924 Pittsburgh hall than in a 1989 Yokohama museum. The
silence is the largest room and the only one that holds no sound. The visitor
walks into it from a world that was full a moment before.

The other twenty-one pins do not open. They carry the venue, the date, and the
title the painting traveled under, which changes as it moves: *The Cup of
Coffee* in English, *Le Corsage vert* and *La Blouse verte* in French, *Die
grüne Bluse* in German, the Nordic forms in 2025. The painting kept being
renamed by the rooms that showed it, and the globe keeps every name.

## Demo

A five-minute film, cut to stand on its own, records a single traversal of the
work. It opens on the painting and the instruction to follow it, then walks the
spine of the journey: the studio at Le Cannet, the rooms that first showed it,
the thirty-five-year silence where the color drains out of the space and the
sound falls away, and the return to a full room at the Met in 1974, which
arrives as a single cut out of the grey. It ends back on the globe, the whole
route drawn at once, and a last line — for a hundred years, strangers have
paused to look at her; you are only the latest.

The film carries the work's own spatial audio and is best heard on headphones.

<!-- Add the film here: open this file on github.com, click Edit (the pencil),
     and drag "painted lineage 5m FINAL.mp4" onto the empty line below. GitHub
     uploads it and inserts a https://github.com/user-attachments/assets/… link
     that renders as an inline, playable video. Then commit. -->



## How it is built

Two rendering modes share one Three.js application. The globe is a map and the
worlds are places, and the two are made of different materials. The globe is
ordinary geometry: a textured Earth, gold borders, the pins and the path
generated from a single data model of the thirty-one exhibitions. That model,
`app/lib/contexts.ts`, is the single source of truth for the whole work, the
globe and the walk both; editing a coordinate in it moves a pin on the globe.
The worlds are Gaussian-splat environments streamed one at a time through Spark,
reached only by clicking a pin that opens.

Painted Worlds is the architectural base: the application shell, the splat
viewer, and the Marble world-generation client come from it. Painted Time is
where the look and the sound come from: the silent opening on a still painting,
the gold-on-black palette, and the rule that every sound sits at a fixed point
in the space it belongs to rather than playing evenly across the room. Painted
Lineage adds what neither had, a navigable index of many worlds standing in
front of the worlds themselves.

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

World generation through the Marble API is optional and configured with a
`WORLDLABS_API_KEY` in `.env.local`.

Asset attributions live in [CREDITS.md](CREDITS.md).
