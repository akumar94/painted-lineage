"use client";

/**
 * Top-level state machine for the piece: splash → atlas → world.
 *
 * The transitions are quiet by design (fade/dissolve), matching the held,
 * elegiac register. Splash is silent; the globe is silent; sound begins only
 * inside worlds. Entering Mode 2 (a streamed splat world) is reached ONLY by
 * clicking an enterable pin in the atlas; exiting returns to Mode 1.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Context } from "../lib/contexts";
import { worldSrc } from "../lib/worlds";
import Splash from "./Splash";
import AtlasGlobe from "./AtlasGlobe";
import WorldViewer from "./WorldViewer";

type Phase = "splash" | "atlas" | "world";

// Worlds aren't generated yet — every enterable pin streams this placeholder
// splat so the atlas → world → atlas flow can be proven before any .RAD exists.
const PLACEHOLDER_WORLD = "/worlds/placeholder.spz";

export default function Experience() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [entered, setEntered] = useState(false); // atlas has been mounted once
  const [activeWorld, setActiveWorld] = useState<Context | null>(null);

  const enterAtlas = useCallback(() => {
    setEntered(true);
    setPhase("atlas");
  }, []);

  const enterWorld = useCallback((context: Context) => {
    setActiveWorld(context);
    setPhase("world");
  }, []);

  const exitWorld = useCallback(() => {
    setPhase("atlas");
    // Let the fade run before tearing the splat down.
    window.setTimeout(() => setActiveWorld(null), 700);
  }, []);

  // ESC leaves a world.
  const exitRef = useRef(exitWorld);
  exitRef.current = exitWorld;
  useEffect(() => {
    if (phase !== "world") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const worldUrl =
    (activeWorld && worldSrc(activeWorld.id)) || PLACEHOLDER_WORLD;

  return (
    <div className="experience-root">
      {/* Splash layer */}
      <div
        className={`layer splash-layer ${phase === "splash" ? "is-visible" : "is-hidden"}`}
      >
        <Splash onEnter={enterAtlas} />
      </div>

      {/* Atlas layer — mounted on first entry, then persistent behind worlds */}
      {entered && (
        <div
          className={`layer atlas-layer ${phase === "splash" ? "is-hidden" : "is-visible"}`}
        >
          <AtlasGlobe onEnterWorld={enterWorld} />
        </div>
      )}

      {/* World layer — only while inside a world */}
      {phase === "world" && activeWorld && (
        <div className="layer world-layer is-visible">
          <WorldViewer
            spzUrl={worldUrl}
            audioId={activeWorld.id}
            worldId={activeWorld.id}
            onExit={exitWorld}
          />
          <WorldChrome context={activeWorld} onExit={exitWorld} />
        </div>
      )}
    </div>
  );
}

/** Overlay UI for a world: return affordance, title, and its sound intent. */
function WorldChrome({
  context,
  onExit,
}: {
  context: Context;
  onExit: () => void;
}) {
  return (
    <>
      <button className="world-back" onClick={onExit}>
        ← The atlas
      </button>

      <div className="world-title">
        <div className="world-title-venue">{context.venue}</div>
        <div className="world-title-meta">
          {context.city} · {context.dateLabel}
        </div>
        {!worldSrc(context.id) && (
          <div className="world-title-stub">placeholder world</div>
        )}
      </div>
    </>
  );
}
