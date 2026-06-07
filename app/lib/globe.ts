/**
 * Globe geometry helpers for the Atlas (Mode 1).
 *
 * The globe is a MAP, not a splat. Everything here is procedural —
 * pin positions, the date-ordered path, and colocation fan-out are all
 * derived from CONTEXTS. Change a coordinate in the data model and the
 * pin moves. Nothing here loads an asset.
 */

import * as THREE from "three";
import type { Context, Tier } from "./contexts";
import { COLOCATION_CLUSTERS } from "./contexts";

/** Globe radius in world units. Pins sit just above this. */
export const GLOBE_RADIUS = 2;

/**
 * Lat/lng (degrees) → point on a sphere of `radius`.
 * Aligned so it matches a standard equirectangular earth texture if one is
 * ever swapped in: +lng rotates eastward, +lat moves toward the north pole.
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius = GLOBE_RADIUS,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180); // polar angle from +Y
  const theta = (lng + 180) * (Math.PI / 180); // azimuth
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Great-circle arc between two surface points, lifted slightly off the globe
 * so the path reads as threaded *over* the world rather than buried in it.
 * Returns `segments + 1` points. `lift` is the peak height added at the arc's
 * midpoint, as a fraction of the radius.
 */
export function greatCircleArc(
  a: THREE.Vector3,
  b: THREE.Vector3,
  segments = 48,
  lift = 0.06,
): THREE.Vector3[] {
  const radius = a.length();
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Spherical interpolation keeps the arc on the great circle.
    const p = new THREE.Vector3().copy(a).lerp(b, t);
    // Arc bows outward most at the middle (sin gives 0 at ends, 1 at center).
    const bow = Math.sin(t * Math.PI) * lift;
    p.normalize().multiplyScalar(radius * (1 + bow));
    points.push(p);
  }
  return points;
}

/** Marker size per tier — encodes the hierarchy in the brief. */
export const TIER_SIZE: Record<Tier, number> = {
  primary: 0.085,
  transition: 0.06,
  atlas: 0.038,
};

/**
 * Resolve each context's pin position, applying a tangential fan-out to any
 * pins that share a coordinate cluster (the NYC problem). Colocated pins are
 * spread along a small circle on the local tangent plane so all are visible
 * and individually clickable; a leader line can be drawn back to the true
 * surface point. Non-clustered pins map straight to their coordinate.
 */
export interface PlacedPin {
  context: Context;
  /** Final marker position (already lifted off the surface, fanned if clustered). */
  position: THREE.Vector3;
  /** The true, un-fanned surface point — anchor for a leader line. */
  anchor: THREE.Vector3;
  /** True if this pin was offset as part of a colocation cluster. */
  fanned: boolean;
}

const PIN_LIFT = 1.012; // markers float just above the surface
// Tangential spread of the satellite pins around a cluster anchor (world units).
// Tightened from 0.16 — at 0.16 a member could sit ~480km off (the Met landed in
// Canada); ~0.09 keeps the NYC satellites within NY state. Smallest-wins picking
// (AtlasGlobe) keeps them individually clickable even at this tighter spacing.
const FAN_RADIUS = 0.09;

export function placePins(contexts: Context[]): PlacedPin[] {
  // Build id → cluster-member-index lookup for fan-out.
  const clusterOf = new Map<string, { key: string; index: number; total: number }>();
  for (const [key, ids] of Object.entries(COLOCATION_CLUSTERS)) {
    ids.forEach((id, index) =>
      clusterOf.set(id, { key, index, total: ids.length }),
    );
  }

  return contexts.map((context) => {
    const surface = latLngToVector3(context.coords[0], context.coords[1]);
    const anchor = surface.clone().multiplyScalar(PIN_LIFT);
    const cluster = clusterOf.get(context.id);

    if (!cluster) {
      return { context, position: anchor, anchor, fanned: false };
    }

    // The cluster's FIRST member is the ANCHOR — it stays at its true coordinate
    // so the most important pin is geographically correct (met-1974 on NYC, not
    // fanned into Canada). The remaining members spiderfy in a ring around it.
    // (Reused for the Paris cluster at world 9: anchor the void, fan paris-mam.)
    if (cluster.index === 0) {
      return { context, position: anchor, anchor, fanned: false };
    }

    // Spiderfy: spread the N−1 satellites evenly around a small circle on the
    // tangent plane. Honest because each leader line still points home to its
    // true coordinate.
    const normal = surface.clone().normalize();
    const tangent = new THREE.Vector3(0, 1, 0)
      .cross(normal)
      .normalize();
    if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0); // pole guard
    const bitangent = normal.clone().cross(tangent).normalize();

    const sats = cluster.total - 1; // anchor excluded
    const angle = ((cluster.index - 1) / sats) * Math.PI * 2;
    const offset = tangent
      .clone()
      .multiplyScalar(Math.cos(angle) * FAN_RADIUS)
      .add(bitangent.clone().multiplyScalar(Math.sin(angle) * FAN_RADIUS));

    const position = anchor
      .clone()
      .add(offset)
      .normalize()
      .multiplyScalar(GLOBE_RADIUS * (PIN_LIFT + 0.02));

    return { context, position, anchor, fanned: true };
  });
}

/**
 * Build a circular sprite texture for a pin — a soft filled disc with a ring.
 * Drawn once per color and cached by the caller.
 */
export function makePinTexture(rgb: string): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Soft outer glow
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, rgb);
  grad.addColorStop(0.45, rgb);
  grad.addColorStop(0.75, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // Crisp inner dot
  ctx.fillStyle = rgb;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.16, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Build gold country borders from a Natural Earth admin_0 GeoJSON
 * (FeatureCollection of Polygon / MultiPolygon). Each ring becomes line
 * segments lifted just off the surface so borders sit over the Earth texture
 * without z-fighting. Coordinates are GeoJSON order: [lng, lat].
 */
// Minimal shape of the GeoJSON we consume.
interface GeoJSON {
  features: {
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    } | null;
  }[];
}

export function buildCountryBorders(
  geo: GeoJSON,
  radius = GLOBE_RADIUS * 1.002,
  color = 0xd4bc8a,
  opacity = 0.42,
): THREE.LineSegments {
  const positions: number[] = [];
  const addRing = (ring: number[][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = latLngToVector3(ring[i][1], ring[i][0], radius);
      const b = latLngToVector3(ring[i + 1][1], ring[i + 1][0], radius);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  };
  for (const f of geo.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      (g.coordinates as number[][][]).forEach(addRing);
    } else if (g.type === "MultiPolygon") {
      (g.coordinates as number[][][][]).forEach((poly) => poly.forEach(addRing));
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return new THREE.LineSegments(geom, mat);
}

/** Latitude/longitude graticule lines for the stylized (textureless) globe. */
export function buildGraticule(
  radius = GLOBE_RADIUS,
  color = 0xd4bc8a,
  opacity = 0.07,
): THREE.LineSegments {
  const positions: number[] = [];
  const pushArc = (pts: THREE.Vector3[]) => {
    for (let i = 0; i < pts.length - 1; i++) {
      positions.push(pts[i].x, pts[i].y, pts[i].z);
      positions.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
  };

  // Parallels every 30° of latitude.
  for (let lat = -60; lat <= 60; lat += 30) {
    const ring: THREE.Vector3[] = [];
    for (let lng = -180; lng <= 180; lng += 6) {
      ring.push(latLngToVector3(lat, lng, radius * 1.001));
    }
    pushArc(ring);
  }
  // Meridians every 30° of longitude.
  for (let lng = -180; lng < 180; lng += 30) {
    const meridian: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 6) {
      meridian.push(latLngToVector3(lat, lng, radius * 1.001));
    }
    pushArc(meridian);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  return new THREE.LineSegments(geom, mat);
}
