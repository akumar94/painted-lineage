/**
 * The wall placard, composited into each world.
 *
 * The painting carries a *different name* in each room it hangs — the renaming
 * motif (Wildenstein "THE CUP OF COFFEE", Bordeaux "LE CORSAGE VERT", the Met in
 * 1974 a conspicuously *missing* label). Image models garble small text, so the
 * label is rendered crisply offline (scripts/make_placard.py, PIL/Palatino) and
 * composited over the splat as a flat plane — the same trick as the painting
 * (app/lib/worldpainting.ts), one notch below and in front of the frame.
 *
 * Marble decides where the wall lands, so each world's placement is hand-tuned
 * AFTER its splat exists — walk it in the preview, nudge position/rotation/size,
 * screenshot to confirm the card sits flush beneath the painting. Mirrors the
 * per-world calibration of WORLD_PAINTING and WORLD_AUDIO.
 *
 * A world with no entry here renders no placard (the studio has none — its
 * canvas is unfinished and unnamed; the void's painting is unlabeled by design).
 */

import * as THREE from "three";

export interface PlacardPlacement {
  /** World-space center of the card. */
  position: [number, number, number];
  /** Euler rotation (radians) — align flat against the wall, matching the frame. */
  rotation: [number, number, number];
  /** Card height in meters; width is derived from the PNG's aspect (5:3). */
  height: number;
  /** Placard PNG (defaults to /placards/<id>.png). */
  url?: string;
}

/** Rendered nameplates are 660×220 (see scripts/make_placard.py). */
export const PLACARD_ASPECT = 660 / 220;

/**
 * Per-world placard placements. Empty until each splat exists and is calibrated.
 * Template (copy, dial in once the splat streams, just under the painting):
 *
 *   "wildenstein-1934": { position: [0, 1.05, -8.4], rotation: [0, 0, 0], height: 0.22 },
 */
export const WORLD_PLACARD: Record<string, PlacardPlacement> = {
  // "THE CUP OF COFFEE" — the painting's English name at Wildenstein NY, 1934.
  // Brass nameplate on the pier just below the frame, over the splat's baked
  // plate, a hair in front of the painting plane (same −0.065 x as the frame).
  "wildenstein-1934": {
    position: [-0.045, 0.18, -11.35],
    rotation: [0, 0, 0],
    height: 0.13,
  },
};

/**
 * Composite a world's placard into an existing Three scene.
 * Returns a cleanup function. Safe to call with an unknown id (no-op).
 */
export function initWorldPlacard(
  scene: THREE.Scene,
  worldId: string | undefined,
  ready?: Promise<unknown>,
): () => void {
  const placement = worldId ? WORLD_PLACARD[worldId] : undefined;
  if (!placement) return () => {};

  const url = placement.url ?? `/placards/${worldId}.png`;
  const width = placement.height * PLACARD_ASPECT;

  const geometry = new THREE.PlaneGeometry(width, placement.height);
  const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    toneMapped: false, // a splat scene is unlit — show the card at true value
    transparent: true, // the PNG has transparent margins around the card
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...placement.position);
  mesh.rotation.set(...placement.rotation);
  scene.add(mesh);

  let disposed = false;

  // Hold the card hidden until the splat streams in, like the painting — so it
  // appears mounted on the wall, not floating in blur first.
  if (ready) {
    mesh.visible = false;
    ready.then(() => {
      if (!disposed) mesh.visible = true;
    });
  }
  const loader = new THREE.TextureLoader();
  loader.load(
    url,
    (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    () => {
      // Placard PNG missing — leave the bare plane rather than throw.
    },
  );

  return () => {
    disposed = true;
    scene.remove(mesh);
    geometry.dispose();
    material.map?.dispose();
    material.dispose();
  };
}
