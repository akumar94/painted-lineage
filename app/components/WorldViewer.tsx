"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { initWorldAudio } from "../lib/worldaudio";
import { initWorldPainting } from "../lib/worldpainting";
import { initWorldPlacard } from "../lib/worldplacard";
import { worldGrade, worldSpawn } from "../lib/worlds";

export default function WorldViewer({
  spzUrl,
  audioId,
  worldId,
  onExit,
}: {
  spzUrl: string;
  audioId?: string;
  worldId?: string;
  onExit?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animationId: number | undefined;

    async function init() {
      const { SplatMesh, SparkControls, SparkRenderer } = await import(
        "@sparkjsdev/spark"
      );

      if (disposed) return;

      const width = container!.clientWidth;
      const height = container!.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      // Per-world spawn (eye level, a good vantage) — set BEFORE controls so
      // SparkControls inherits it as the starting pose.
      const spawn = worldSpawn(worldId);
      camera.position.set(...spawn.position);
      if (spawn.yaw) camera.rotation.y = spawn.yaw;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      // Splats are fragment-heavy (every gaussian blends per pixel), so cost
      // scales with pixel count. On Retina/4K an uncapped devicePixelRatio (2–3)
      // renders 4–9× the pixels and tanks fps; cap at 1.5 — the gaussians are
      // already soft, so the visual cost is negligible. (AtlasGlobe caps at 2.)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container!.appendChild(renderer.domElement);

      const controls = new SparkControls({ canvas: renderer.domElement });
      // Default moveSpeed (1) crawls at this world scale — quicken the walk.
      controls.fpsMovement.moveSpeed = 3.2;

      // `splat.initialized` resolves on DECODE (the .spz is downloaded + parsed),
      // but Spark still needs a GPU upload + the first async depth-sort before any
      // gaussian actually paints — ~1–2s more on a cold load. Gating the painting /
      // placard / grade on `initialized` pops the instant-loading .jpg into empty
      // blur a beat before the room arrives. So we gate on `displayReady` instead:
      // it resolves only once the splat has truly RENDERED (the default viewpoint's
      // sorted geometry has a non-zero instance count — see the animation loop).
      let resolveDisplay: (() => void) | null = null;
      const displayReady = new Promise<void>((r) => {
        resolveDisplay = r;
      });
      let probeStartedAt = 0;
      let spark: InstanceType<typeof SparkRenderer> | undefined;

      let splatReady: Promise<unknown> | undefined;
      let splat: InstanceType<typeof SplatMesh> | undefined;
      try {
        splat = new SplatMesh({ url: spzUrl });
        scene.add(splat);
        splatReady = splat.initialized;
        // Start the first-paint probe only once decode is done (before that the
        // sorted geometry is necessarily empty); this also starts the fallback clock.
        splatReady.then(() => {
          if (!disposed) probeStartedAt = performance.now();
        });
        setLoading(false);
      } catch (e) {
        setError("Failed to load 3D world");
        setLoading(false);
        return;
      }

      // Spatial audio (HRTF) for this world — bed + intermittent gestures.
      const cleanupAudio = initWorldAudio(scene, camera, audioId);

      // The real painting, composited onto the wall (no-op until calibrated).
      // Held hidden until the splat has PAINTED (displayReady, not mere decode) so
      // it doesn't float in blur ahead of the room.
      const cleanupPainting = initWorldPainting(scene, worldId, displayReady);

      // The wall placard — the renaming label, composited just below the
      // painting (no-op until calibrated). Same load-gating as the painting.
      const cleanupPlacard = initWorldPlacard(scene, worldId, displayReady);

      // Chromatic arc: the void drains color in, met-1974 floods it back. An
      // animated CSS filter on the canvas grades the whole scene — splat AND the
      // composited painting — with zero coupling to the Spark render pipeline.
      // The drain begins only once the splat is ready, so color bleeds out of
      // the actual room (not the loading blur); flood worlds start desaturated
      // (as if just out of the grey) and rush to full color on the same cue.
      const grade = worldGrade(worldId);
      let gradeStart = 0;
      if (grade) {
        renderer.domElement.style.filter =
          grade.direction === "flood"
            ? `saturate(${grade.saturation}) brightness(${grade.brightness})`
            : "saturate(1) brightness(1)";
        displayReady.then(() => {
          if (!disposed) gradeStart = performance.now();
        });
      }

      // Dev calibration handle — only when entered via the #world= deep-link.
      // Exposes camera/scene/THREE so painting/spawn placement can be measured
      // and previewed live from the console. Never set in the normal flow.
      if (window.location.hash.startsWith("#world=")) {
        (window as unknown as { __pl?: unknown }).__pl = {
          camera,
          scene,
          THREE,
        };
      }

      renderer.setAnimationLoop(() => {
        if (disposed) return;
        controls.update(camera);

        // Resolve displayReady on the first frame the splat has actually painted.
        // Spark auto-injects a SparkRenderer into the scene on first render; its
        // default viewpoint's sorted geometry gains a non-zero instanceCount only
        // when the first depth-sort completes (i.e. the room is on screen). A
        // generous fallback resolves anyway, so a future Spark internal rename can
        // never strand the painting hidden forever.
        if (resolveDisplay && probeStartedAt) {
          if (!spark) {
            scene.traverse((o) => {
              if (o instanceof SparkRenderer)
                spark = o as InstanceType<typeof SparkRenderer>;
            });
          }
          const display = (
            spark as unknown as {
              viewpoint?: { display?: { geometry?: { instanceCount?: number } } };
            }
          )?.viewpoint?.display;
          const painted = (display?.geometry?.instanceCount ?? 0) > 0;
          if (painted || performance.now() - probeStartedAt > 10000) {
            resolveDisplay();
            resolveDisplay = null;
          }
        }

        if (grade && gradeStart) {
          const p = Math.min(
            1,
            (performance.now() - gradeStart) / (grade.seconds * 1000),
          );
          // easeInOutQuad — the drain/flood settles rather than snapping.
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const lerp = (a: number, b: number) => a + (b - a) * e;
          const [s, b] =
            grade.direction === "drain"
              ? [lerp(1, grade.saturation), lerp(1, grade.brightness)]
              : [lerp(grade.saturation, 1), lerp(grade.brightness, 1)];
          renderer.domElement.style.filter = `saturate(${s}) brightness(${b})`;
        }
        renderer.render(scene, camera);
      });

      const handleResize = () => {
        const w = container!.clientWidth;
        const h = container!.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        disposed = true;
        cleanupAudio();
        cleanupPainting();
        cleanupPlacard();
        window.removeEventListener("resize", handleResize);
        renderer.setAnimationLoop(null);
        // Free the splat's GPU buffers (gaussian data-textures = the bulk of the
        // VRAM). renderer.dispose() does NOT traverse the scene, so without this
        // every world we leave leaks its splat — VRAM climbs across navigations
        // and frames progressively drop. (The sort worker lives on the shared
        // SparkRenderer singleton, so it's not a per-world leak.)
        if (splat) {
          scene.remove(splat);
          splat.dispose?.();
        }
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (container && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    const cleanupPromise = init();

    return () => {
      disposed = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [spzUrl, audioId, worldId]);

  return (
    <div ref={containerRef} className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-900 border-t-amber-400" />
            <p className="text-amber-200/70">Loading 3D world...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
