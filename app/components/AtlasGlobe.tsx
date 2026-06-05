"use client";

/**
 * Mode 1 — the Atlas.
 *
 * A free-rotating globe (a MAP, not a splat) that renders all 31 exhibition
 * contexts as pins, threaded by one continuous date-ordered path. Pin size
 * encodes tier; the 1939–1974 silence is drawn as the still segment where the
 * path stops moving. Clicking an `enterable` pin transitions toward its world;
 * clicking an `atlas` pin opens a metadata card. Everything is procedural from
 * CONTEXTS — nothing here is a splat or a loaded asset.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CONTEXTS, PATH, type Context } from "../lib/contexts";
import {
  GLOBE_RADIUS,
  TIER_SIZE,
  buildCountryBorders,
  buildGraticule,
  greatCircleArc,
  latLngToVector3,
  makePinTexture,
  placePins,
} from "../lib/globe";

const GOLD = 0xd4bc8a;
// Borders are deliberately NOT gold — gold means the painting's journey.
// A dark, warm "ink" line reads like an antique engraved globe and recedes.
const BORDER_COLOR = 0x1a1206;
const BORDER_OPACITY = 0.5;

// ── Path legibility (see docs/GLOBE_POLISH.md) ──────────────────
// The whole journey stays drawn as a faint ghost; only the legs touching the
// hovered/selected node brighten — "where it came from, where it goes next."
const GHOST_OPACITY = 0.16;
const ACTIVE_OPACITY = 0.92;
// Each leg carries a dim→bright gradient in date order, so the eye follows
// the chronology (directionality). Warm gold for travel; cool for the silence.
const GOLD_DIM = new THREE.Color(0x6e5d38);
const GOLD_BRIGHT = new THREE.Color(0xf3ddad);
const STILL_DIM = new THREE.Color(0x39424f);
const STILL_BRIGHT = new THREE.Color(0x8295ad);
// Arc altitude scales with hop distance: short hops hug the surface, long
// ocean crossings bow high, so crossings separate by altitude, not overlap.
const ARC_LIFT_MIN = 0.03;
const ARC_LIFT_SPAN = 0.32;
const VOID_ARC_LIFT = 0.02;

// Pin colors as canvas-fillable strings, keyed by tier (+ void).
const PIN_COLOR: Record<string, string> = {
  primary: "rgba(232,210,158,1)",
  transition: "rgba(201,168,106,1)",
  atlas: "rgba(150,134,92,1)",
  void: "rgba(122,140,166,1)", // cool, withdrawn — the silence
};

type Hover = { context: Context; x: number; y: number } | null;

export default function AtlasGlobe({
  onEnterWorld,
}: {
  onEnterWorld: (context: Context) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Context | null>(null);
  const [hover, setHover] = useState<Hover>(null);

  // Latest values surfaced to the long-lived render loop without re-running it.
  const onEnterRef = useRef(onEnterWorld);
  onEnterRef.current = onEnterWorld;
  const selectedRef = useRef<Context | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── Renderer / scene / camera ──────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent — page near-black shows
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6.2);

    // Mostly even illumination (a classroom-globe read), with a gentle key for
    // a little form and a soft terminator on the far limb.
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    const key = new THREE.DirectionalLight(0xfff3e0, 0.85);
    key.position.set(-3, 2.5, 5);
    scene.add(key);

    // ── The globe: real Earth (NASA Blue Marble), toned to the register ──
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x8c8c8c, // slightly deepened until the texture lands
      roughness: 1.0,
      metalness: 0.0,
    });
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96),
      globeMat,
    );
    scene.add(globe);
    new THREE.TextureLoader().load("/textures/earth.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      globeMat.map = tex;
      globeMat.color.set(0xb9b9b9); // let the texture read, a touch deepened
      globeMat.needsUpdate = true;
    });
    // Faint graticule keeps the "atlas / globe" read over the Earth.
    scene.add(buildGraticule(GLOBE_RADIUS, GOLD, 0.06));
    // A soft atmospheric rim so the planet sits in the near-black space.
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x5b7fb0,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);

    // Gold country borders, fetched and laid over the Earth.
    let disposed = false;
    let borders: THREE.LineSegments | null = null;
    fetch("/geo/countries.geojson")
      .then((r) => r.json())
      .then((geo) => {
        if (disposed) return;
        borders = buildCountryBorders(
          geo,
          GLOBE_RADIUS * 1.002,
          BORDER_COLOR,
          BORDER_OPACITY,
        );
        scene.add(borders);
      })
      .catch(() => {});

    // ── The path: one continuous date-ordered line ────────────
    // ONE object, one unbroken life — so it stays a single path. Legibility
    // comes from three moves (docs/GLOBE_POLISH.md): arcs whose altitude scales
    // with distance (crossings separate vertically), a dim→bright gradient per
    // leg (the eye follows time), and active-leg emphasis driven in the render
    // loop (the whole journey ghosts; the hovered node's in/out legs light up).
    // Void-adjacent legs read "still" — cool and low, the 35-year pause.
    const pathVec = (c: Context) =>
      latLngToVector3(c.coords[0], c.coords[1], GLOBE_RADIUS * 1.005);
    const pathIndexById = new Map<string, number>();
    PATH.forEach((c, i) => pathIndexById.set(c.id, i));

    // Per-leg handle so the render loop can light just the active legs.
    const legs: {
      mat: THREE.LineBasicMaterial;
      geom: THREE.BufferGeometry;
      a: number; // PATH index of the leg's start node
      b: number; // PATH index of the leg's end node
    }[] = [];
    const maxChord = 2 * GLOBE_RADIUS; // antipodal chord = diameter
    const tmpColor = new THREE.Color();
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i];
      const b = PATH[i + 1];
      const va = pathVec(a);
      const vb = pathVec(b);
      const chord = va.distanceTo(vb);
      if (chord < 1e-4) continue; // colocated venues, no arc
      const isStill = a.isVoid || b.isVoid;
      const lift = isStill
        ? VOID_ARC_LIFT
        : ARC_LIFT_MIN + ARC_LIFT_SPAN * (chord / maxChord);
      const pts = greatCircleArc(va, vb, 72, lift);
      const geom = new THREE.BufferGeometry().setFromPoints(pts);

      // Dim→bright gradient along the arc encodes the direction of time.
      const dim = isStill ? STILL_DIM : GOLD_DIM;
      const bright = isStill ? STILL_BRIGHT : GOLD_BRIGHT;
      const colors = new Float32Array(pts.length * 3);
      for (let s = 0; s < pts.length; s++) {
        tmpColor.copy(dim).lerp(bright, s / (pts.length - 1));
        colors[s * 3] = tmpColor.r;
        colors[s * 3 + 1] = tmpColor.g;
        colors[s * 3 + 2] = tmpColor.b;
      }
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: GHOST_OPACITY,
        depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      line.renderOrder = 1;
      scene.add(line);
      legs.push({ mat, geom, a: i, b: i + 1 });
    }

    // ── Pins ───────────────────────────────────────────────────
    const placed = placePins(CONTEXTS);
    const texCache = new Map<string, THREE.Texture>();
    const getTex = (col: string) => {
      let t = texCache.get(col);
      if (!t) {
        t = makePinTexture(col);
        texCache.set(col, t);
      }
      return t;
    };

    const pinGroup = new THREE.Group();
    const sprites: THREE.Sprite[] = [];
    const baseScale: number[] = [];

    placed.forEach((p, i) => {
      const isVoid = !!p.context.isVoid;
      const colorKey = isVoid ? "void" : p.context.tier;
      const mat = new THREE.SpriteMaterial({
        map: getTex(PIN_COLOR[colorKey]),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        opacity: isVoid ? 0.85 : 1,
      });
      const sprite = new THREE.Sprite(mat);
      // The void is the largest, heaviest marker — the most important thing
      // that happened was 35 years of nothing.
      const size = isVoid ? TIER_SIZE.primary * 2.1 : TIER_SIZE[p.context.tier];
      sprite.scale.setScalar(size);
      sprite.position.copy(p.position);
      sprite.userData.index = i;
      sprite.renderOrder = 2;
      pinGroup.add(sprite);
      sprites.push(sprite);
      baseScale.push(size);

      // Leader line home to the true coordinate for fanned (NYC) pins.
      if (p.fanned) {
        const leader = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([p.anchor, p.position]),
          new THREE.LineBasicMaterial({
            color: GOLD,
            transparent: true,
            opacity: 0.25,
          }),
        );
        leader.renderOrder = 1;
        pinGroup.add(leader);
      }
    });
    scene.add(pinGroup);

    // ── Controls: free rotation, gentle auto-spin ──────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 9;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.rotateSpeed = 0.5;

    // ── Picking ────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredIndex = -1;
    let downPos: { x: number; y: number } | null = null;

    const setPointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickIndex = (): number => {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(sprites, false);
      return hits.length ? (hits[0].object.userData.index as number) : -1;
    };

    const onMove = (e: PointerEvent) => {
      setPointer(e);
      const idx = pickIndex();
      if (idx !== hoveredIndex) {
        hoveredIndex = idx;
        renderer.domElement.style.cursor = idx >= 0 ? "pointer" : "grab";
      }
      if (idx >= 0) {
        setHover({ context: placed[idx].context, x: e.clientX, y: e.clientY });
      } else {
        setHover(null);
      }
    };

    const onDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onUp = (e: PointerEvent) => {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 5) return; // a drag, not a click
      setPointer(e);
      const idx = pickIndex();
      if (idx < 0) {
        setSelected(null);
        return;
      }
      const ctx = placed[idx].context;
      if (ctx.enterable) {
        onEnterRef.current(ctx);
      } else {
        setSelected(ctx);
      }
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    // ── Render loop ────────────────────────────────────────────
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      // Pause the spin while reading a pin or a card.
      controls.autoRotate = hoveredIndex < 0 && !selectedRef.current;
      controls.update();
      sprites.forEach((s, i) => {
        const target = i === hoveredIndex ? baseScale[i] * 1.55 : baseScale[i];
        s.scale.setScalar(s.scale.x + (target - s.scale.x) * 0.25);
      });
      // Active-leg emphasis: light only the legs touching the focused node
      // (hovered pin, else the open card). Everything else holds at ghost.
      const activeCtx =
        hoveredIndex >= 0 ? placed[hoveredIndex].context : selectedRef.current;
      const activeIdx = activeCtx
        ? pathIndexById.get(activeCtx.id) ?? -1
        : -1;
      legs.forEach((leg) => {
        const lit =
          activeIdx >= 0 && (leg.a === activeIdx || leg.b === activeIdx);
        const target = lit ? ACTIVE_OPACITY : GHOST_OPACITY;
        leg.mat.opacity += (target - leg.mat.opacity) * 0.18;
      });
      renderer.render(scene, camera);
    };
    tick();

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (borders) {
        borders.geometry.dispose();
        (borders.material as THREE.Material).dispose();
      }
      legs.forEach((leg) => {
        leg.geom.dispose();
        leg.mat.dispose();
      });
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      renderer.dispose();
      texCache.forEach((t) => t.dispose());
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="atlas-root">
      <div ref={containerRef} className="atlas-canvas" />

      {/* Hover label */}
      {hover && (
        <div
          className="atlas-tip"
          style={{ left: hover.x + 16, top: hover.y + 14 }}
        >
          <div className="atlas-tip-venue">{hover.context.venue}</div>
          <div className="atlas-tip-meta">
            {hover.context.city} &middot; {hover.context.dateLabel}
          </div>
          <div className="atlas-tip-cta">
            {hover.context.enterable ? "Enter →" : "Details"}
          </div>
        </div>
      )}

      {/* Metadata card for atlas pins */}
      {selected && (
        <MetadataCard context={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function MetadataCard({
  context,
  onClose,
}: {
  context: Context;
  onClose: () => void;
}) {
  return (
    <div className="atlas-card">
      <button className="atlas-card-close" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <div className="atlas-card-date">{context.dateLabel}</div>
      <div className="atlas-card-venue">{context.venue}</div>
      <div className="atlas-card-place">
        {context.city}, {context.country}
      </div>
      <div className="atlas-card-rule" />
      {context.titleAtVenue && context.titleAtVenue !== "—" && (
        <div className="atlas-card-title">
          <span className="atlas-card-label">as</span> {context.titleAtVenue}
        </div>
      )}
      <div className="atlas-card-cat">{context.catalogueNote}</div>
      {context.note && <div className="atlas-card-note">{context.note}</div>}
    </div>
  );
}
