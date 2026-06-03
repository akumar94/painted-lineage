/**
 * Spatial audio for the worlds — a port of the Painted Time rig.
 *
 * Each source is a THREE.PositionalAudio (which wraps a Web Audio PannerNode,
 * default panningModel 'HRTF' → binaural) parented to an Object3D at a world
 * position, with one AudioListener on the camera. Two playback modes:
 *   - loop:        a continuous bed (e.g. the garden through the open door)
 *   - intermittent: fire a short random window of the clip at irregular gaps
 *                   (e.g. brush strokes at the easel — an irregular hand)
 *
 * Sources whose file 404s are skipped (so a not-yet-added sound — the jar —
 * is harmless until you drop it in). The sonic map intent lives in
 * soundmap.ts; this is the playable wiring.
 */

import * as THREE from "three";

export type AudioMode = "loop" | "intermittent";

export interface AudioSource {
  id: string;
  url: string;
  /** Position relative to the world origin (camera starts near [0,1.6,0]). */
  position: [number, number, number];
  volume: number;
  refDistance: number;
  rolloff: number;
  mode: AudioMode;
  /** intermittent: [min,max] seconds between triggers. */
  every?: [number, number];
  /** intermittent: [min,max] seconds of clip to play per trigger. */
  window?: [number, number];
  /** intermittent: [min,max] gain multiplier per trigger (variation). */
  gain?: [number, number];
}

export const WORLD_AUDIO: Record<string, AudioSource[]> = {
  "le-cannet-studio": [
    // The garden, seeping in through the open door — a low bed to the NE
    // (the window/door direction from spawn). +X = east, -Z = north (forward).
    {
      id: "garden",
      url: "/worlds/audio/le-cannet/garden.mp3",
      position: [3.5, 0.4, -3.5],
      volume: 0.5,
      refDistance: 4,
      rolloff: 0.7,
      mode: "loop",
    },
    // Wet brushwork at the easel — a tight bubble, irregular bursts.
    {
      id: "brush",
      url: "/worlds/audio/le-cannet/brush.mp3",
      position: [-0.7, 1.1, -0.6],
      volume: 0.42,
      refDistance: 1.1,
      rolloff: 2.4,
      mode: "intermittent",
      every: [5, 11],
      window: [0.8, 1.6],
      gain: [0.7, 1.0],
    },
    // Brush swirled in the turpentine jar — rarer counterpoint.
    // Drop /worlds/audio/le-cannet/jar.mp3 and it activates automatically.
    {
      id: "jar",
      url: "/worlds/audio/le-cannet/jar.mp3",
      position: [-0.5, 0.9, -0.5],
      volume: 0.55,
      refDistance: 1.1,
      rolloff: 2.4,
      mode: "intermittent",
      every: [11, 20],
      window: [1.4, 2.6],
      gain: [0.8, 1.0],
    },
  ],

  // Carnegie 1924 — the first PUBLIC show. "No people" is visual; the public is
  // sound, and it lives NEXT DOOR: the murmur comes from the galleries beyond the
  // far arches, never from this room. Positioned at the real splat scale — the
  // v2 grand hall: painting/wall at z≈-16.4 with arched doorways flanking it into
  // further galleries beyond. Spawn at the entrance end (z≈-5). The murmur lives
  // through those far arches; never in this room.
  "carnegie-1924": [
    // The hall's air — a wide, high bed that fills the whole room.
    {
      id: "room",
      url: "/worlds/audio/carnegie/bed.mp3",
      position: [0, 4, -9],
      volume: 0.6,
      refDistance: 13,
      rolloff: 0.3,
      mode: "loop",
    },
    // Distant gallery murmur — the populated galleries BEYOND the far arches,
    // deep down the room. Louder as you approach the far wall.
    {
      id: "murmur",
      url: "/worlds/audio/carnegie/murmur.mp3",
      position: [0, 1.6, -21],
      volume: 0.5,
      refDistance: 9,
      rolloff: 0.6,
      mode: "loop",
    },
    // One visitor crossing the hard floor near the far wall — echoing footfalls.
    {
      id: "footsteps",
      url: "/worlds/audio/carnegie/footsteps.mp3",
      position: [3.5, 0.1, -13],
      volume: 0.55,
      refDistance: 4,
      rolloff: 1.4,
      mode: "intermittent",
      every: [7, 16],
      window: [1.5, 3.5],
      gain: [0.6, 1.0],
    },
  ],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Wire a world's spatial audio into an existing Three scene + camera.
 * Returns a cleanup function. Safe to call with an unknown id (no-op).
 */
export function initWorldAudio(
  scene: THREE.Scene,
  camera: THREE.Camera,
  worldId: string | undefined,
): () => void {
  const sources = (worldId && WORLD_AUDIO[worldId]) || [];
  if (sources.length === 0) return () => {};

  const listener = new THREE.AudioListener();
  camera.add(listener);
  // The entering click is the user gesture; resume in case it's suspended.
  listener.context.resume?.();

  const loader = new THREE.AudioLoader();
  const active: THREE.PositionalAudio[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  let disposed = false;

  for (const src of sources) {
    loader.load(
      src.url,
      (buffer) => {
        if (disposed) return;
        const sound = new THREE.PositionalAudio(listener);
        sound.setBuffer(buffer);
        sound.setRefDistance(src.refDistance);
        sound.setRolloffFactor(src.rolloff);
        sound.setVolume(src.volume);

        const holder = new THREE.Object3D();
        holder.position.set(...src.position);
        holder.add(sound);
        scene.add(holder);
        active.push(sound);

        if (src.mode === "loop") {
          sound.setLoop(true);
          sound.play();
          return;
        }

        // Intermittent: fire a random window of the clip on an irregular timer.
        const dur = buffer.duration;
        const fire = () => {
          if (disposed) return;
          const win = src.window ? rand(...src.window) : Math.min(1.2, dur);
          const off = Math.max(0, rand(0, Math.max(0, dur - win)));
          const g = src.gain ? rand(...src.gain) : 1;
          try {
            sound.stop();
          } catch {}
          sound.setLoop(false);
          sound.offset = off;
          sound.duration = Math.min(win, dur - off);
          sound.setVolume(src.volume * g);
          sound.play();
          const next = src.every ? rand(...src.every) : 8;
          timers.push(setTimeout(fire, next * 1000));
        };
        // Stagger the first hit so sources don't all start together.
        timers.push(setTimeout(fire, rand(1.5, 4) * 1000));
      },
      undefined,
      () => {
        // 404 / decode fail — source not present yet (e.g. the jar). Skip quietly.
      },
    );
  }

  return () => {
    disposed = true;
    timers.forEach(clearTimeout);
    active.forEach((s) => {
      try {
        s.stop();
      } catch {}
      s.disconnect();
    });
    camera.remove(listener);
  };
}
