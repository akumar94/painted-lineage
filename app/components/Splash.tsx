"use client";

/**
 * The splash — an arrested image that leads into the atlas.
 * Inherits the Painted Time grammar exactly: the painting centered and framed
 * on near-black, gold serif title, small-caps dimmed-gold metadata, a single
 * thin-ruled CTA. Silent. Clicking the CTA does NOT load a splat — it enters
 * Mode 1 (the atlas globe). Stillness gives way to the object's whole travel.
 */

import { useState } from "react";

// Locked copy (see brief).
const TITLE = "The Green Blouse";
const META = "PIERRE BONNARD · 1919–20";
const SPLASH_CTA = "Follow the painting";
// Drop the Met open-access image here; a framed placeholder shows until then.
const PAINTING_SRC = "/the-green-blouse.jpg";

export default function Splash({ onEnter }: { onEnter: () => void }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="splash-root">
      <div className="splash-stack">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="splash-painting"
            src={PAINTING_SRC}
            alt="Pierre Bonnard, The Green Blouse (1919–20)"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="splash-painting splash-painting--placeholder">
            <span>The Green Blouse</span>
          </div>
        )}

        <div className="splash-text">
          <h1 className="splash-title">{TITLE}</h1>
          <div className="splash-meta">{META}</div>
        </div>

        <button className="splash-cta" onClick={onEnter}>
          {SPLASH_CTA}
        </button>
      </div>
    </div>
  );
}
