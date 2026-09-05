/* eslint-disable react-hooks/immutability -- Reanimated shared values are mutable boxes; writing `.value` from worklets and effects is their API. */
import { Group, Image, Points, useImage, type SkPoint } from '@shopify/react-native-skia';
import React from 'react';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { ReturnMode } from './types';

/**
 * What comes out of the sphere: the cookbook's stickers, loose — no bubble,
 * no enclosing circle. They surface through the button's own glass, tumble,
 * and settle into a plume that keeps breathing above it. When the sphere is
 * sent back down they leave one of two ways:
 *
 * - `fall`: they dip, then float back up while fading once the dome is home.
 * - `vortex`: everything is drawn into the bottom centre in a tightening
 *   spiral, faster and faster, shedding stardust as it goes, and vanishes into
 *   the dome — matter falling into a core.
 *
 * Physics runs on the UI thread every frame, and the finger pushes things
 * around.
 */

/** Big hero stickers read as the subject; the small ones are confetti around
 *  them. Deliberately uneven — a uniform size ramp looks generated. */
export const STICKER_SIZES = [
  104, 82, 76, 93, 87,
  68, 46, 58, 52, 55,
  98, 49, 43, 54, 36,
  91, 47, 41, 35, 62,
  85, 32, 50, 30,
  39, 27, 44, 24,
  71, 40, 33, 64,
  29, 57, 45, 26,
  79, 31, 22, 37,
] as const;
export const STICKER_SLOTS = STICKER_SIZES.length;
const N = STICKER_SLOTS;

// per-particle slots: x, y, vx, vy, scale, alive, phase, homeX, homeY, rot, vrot,
// heading, stretch, r0, th0, delay, dur, wind, leaving
const K = 19;

// the first sticker surfaces this long after the button has settled
const EMIT_DELAY = 350;

// ── the stardust shed on the way in (vortex only) ───────────────────────────
// a ring buffer of motes: x, y, vx, vy, life (s), life0
const M = 260;
const KM = 6;
const SINK_R = 20;       // the event horizon: inside this, a sticker is gone

type Props = {
  width: number;
  height: number;
  stickers: readonly number[];
  returnMode: ReturnMode;
  mode: SharedValue<number>;      // 0 idle, 1 emit, 2 leave
  originX: number;
  originY: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  touchOn: SharedValue<number>;
  windX: SharedValue<number>;
  windY: SharedValue<number>;
  /** 0..1, how much matter just fell into the drain (drives the glow flare). */
  feed: SharedValue<number>;
};

/** Where each sticker wants to sit: a plume rising off the button, narrow at
 *  the base and opening out as it climbs, with a few strays thrown wide. */
function seedHomes(a: number[]) {
  'worklet';
  for (let i = 0; i < N; i++) {
    const b = i * K;
    const big = STICKER_SIZES[i] / 104;
    const t = Math.random();
    const spread = 34 + t * 178;
    const stray = i % 7 === 3;
    a[b + 7] = (Math.random() * 2 - 1) * spread * (stray ? 1.8 : 1 - 0.3 * big);
    a[b + 8] = -40 - t * 545 - (stray ? 90 : 0);
    // a few of the small ones hang about the button itself, so there is always
    // something drifting through the glass for it to bend
    if (i % 6 === 4 && STICKER_SIZES[i] < 82) {
      a[b + 7] = (Math.random() * 2 - 1) * 40;
      a[b + 8] = -14 + (Math.random() * 2 - 1) * 30;
    }
  }
}

function makeState(): number[] {
  const a = new Array<number>(N * K).fill(0);
  for (let i = 0; i < N; i++) {
    a[i * K + 6] = Math.random() * Math.PI * 2;
    a[i * K + 9] = (Math.random() * 2 - 1) * 0.5;
  }
  seedHomes(a);
  return a;
}

export function OrbField({
  width, height, stickers, returnMode, mode, originX, originY,
  touchX, touchY, touchOn, windX, windY, feed,
}: Props) {
  const state = useSharedValue<number[]>(makeState());
  const dust = useSharedValue<number[]>(new Array<number>(M * KM).fill(0));
  const dustHead = useSharedValue(0);
  const emitT = useSharedValue(-1);
  const leaveT = useSharedValue(0);
  const leaving = useSharedValue(0);
  const lastMode = useSharedValue(0);
  const clock = useSharedValue(0);
  const vortex = returnMode === 'vortex';

  // the drain: the centre of the gate dome, on the bottom edge of the page
  const sinkX = originX;
  const sinkY = height;

  useFrameCallback((info) => {
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    clock.value += dt;
    const m = mode.value;
    // a hot reload can hand this frame an array laid out for an older slot
    // count; start over rather than read past its end
    if (state.value.length !== N * K) state.value = makeState();
    const s = state.value;
    const d = dust.value;
    const ox = originX;
    const oy = originY.value;

    if (m !== lastMode.value) {
      if (m === 1) {
        emitT.value = 0;
        // leaving pushed every sticker off the page; a fresh plume needs fresh
        // homes or the second run hides above the top edge
        seedHomes(s);
        for (let i = 0; i < N; i++) {
          const b = i * K;
          // one still on its way out finishes first; it is born again through
          // the button once it has gone
          if (s[b + 5] > 0 && s[b + 18] > 0) continue;
          s[b] = ox; s[b + 1] = oy; s[b + 2] = 0; s[b + 3] = 0; s[b + 4] = 0; s[b + 5] = 0;
          s[b + 11] = 0; s[b + 12] = 0; s[b + 18] = 0;
        }
      } else if (m === 2) {
        leaveT.value = 0;
        for (let i = 0; i < N; i++) {
          const b = i * K;
          if (s[b + 5] <= 0) continue;
          // Only the vortex must finish its exit after the sphere reaches home.
          // Sky returns to its floating forces and fades when mode becomes idle.
          s[b + 18] = vortex ? 1 : 0;
          if (!vortex) {
            // let go: a shove apart and a first tumble, then gravity does the rest
            s[b + 2] += (Math.random() - 0.5) * 90;
            s[b + 3] += 40 + Math.random() * 160;
            s[b + 10] += (Math.random() - 0.5) * 3.0;
            continue;
          }
          // every sticker is given its own way down — where it starts from,
          // when it is taken (the ones nearest the drain go first), how long
          // it takes (the far ones a little longer), and how tightly it winds
          // on the way in. All of them are gone within the second.
          const dx = s[b] - sinkX, dy = s[b + 1] - sinkY;
          const r0 = Math.max(1, Math.hypot(dx, dy));
          const far = Math.min(1, r0 / 900);
          s[b + 13] = r0;
          s[b + 14] = Math.atan2(dy, dx);
          s[b + 15] = 0.02 + 0.12 * far + Math.random() * 0.05;
          s[b + 16] = 0.30 + 0.28 * far + Math.random() * 0.08;
          // one arm: everything winds the same way, so the plume sweeps down
          // one side of the page and pours into the drain as a single stream
          s[b + 17] = 0.42 + Math.random() * 0.30;
          s[b + 10] = 0.6 + Math.random() * 1.2;
        }
      }
      lastMode.value = m;
    }

    if (emitT.value >= 0) emitT.value += dt * 1000;
    if (m === 2 || leaving.value > 0) leaveT.value += dt;
    const t = clock.value;
    // the drain's grip on the dust builds over the first beat
    const ramp = Math.min(1, leaveT.value / 0.30);
    const pull = 0.25 + 0.75 * ramp * ramp;
    let swallowed = 0;
    let stillLeaving = 0;

    for (let i = 0; i < N; i++) {
      const b = i * K;
      const r = STICKER_SIZES[i] * 0.5;

      if (m === 1 && emitT.value >= 0 && s[b + 5] === 0 && emitT.value > EMIT_DELAY + i * 30) {
        // Most of them rise up through the button's own glass, already big
        // enough to see, so the lens magnifies and splits them on the way out.
        // The rest surface as specks just above it and grow as they climb.
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const sp = 90 + Math.random() * 200;
        if (i % 5 !== 2) {
          const a2 = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 26;
          s[b] = ox + Math.cos(a2) * rr; s[b + 1] = oy + 8 + Math.sin(a2) * rr * 0.6;
          s[b + 4] = 0.34;
        } else {
          s[b] = ox + (Math.random() - 0.5) * 120; s[b + 1] = oy - 50 - Math.random() * 70;
          s[b + 4] = 0.16;
        }
        s[b + 2] = Math.cos(ang) * sp; s[b + 3] = Math.sin(ang) * sp;
        s[b + 5] = 1;
        s[b + 10] = (Math.random() - 0.5) * 3.2;
        s[b + 11] = 0; s[b + 12] = 0; s[b + 18] = 0;
      }
      if (s[b + 5] <= 0) continue;

      let vx = s[b + 2], vy = s[b + 3];
      const out = m === 2 || (vortex && s[b + 18] > 0);

      if (out && vortex) {
        stillLeaving += 1;
        // ── the fall in ─────────────────────────────────────────────────────
        // A log spiral into the drain: the radius closes on an ease-in, so
        // the first beat is a lean and the last is a jet, and the winding is
        // tied to how far in it is, so the paths only whip round near the
        // core, the way matter does. Everything the smear, the spin and the
        // dust need is read off the real velocity that produces.
        const tau = leaveT.value - s[b + 15];
        const r0 = s[b + 13];
        let rad = r0;
        if (tau > 0) {
          const u = Math.min(1, tau / s[b + 16]);
          const e = Math.pow(u, 2.0);
          rad = r0 * (1 - e);
          const th = s[b + 14] + s[b + 17] * Math.log(r0 / Math.max(rad, 6));
          const nx = sinkX + Math.cos(th) * rad, ny = sinkY + Math.sin(th) * rad;
          vx = (nx - s[b]) / dt; vy = (ny - s[b + 1]) / dt;
          s[b] = nx; s[b + 1] = ny;
          // it shrinks into the drain and spins up as it goes
          s[b + 4] = 0.12 + 0.88 * Math.pow(Math.min(1, rad / 260), 0.8);
          s[b + 10] += (Math.sign(s[b + 10]) || 1) * 26 * e * dt;
          if (u >= 1 || rad < SINK_R) {
            s[b + 5] = 0; s[b + 18] = 0;
            swallowed += 0.6 + 0.4 * (STICKER_SIZES[i] / 104);
            // a splash of dust where it went in
            for (let k = 0; k < 5; k++) {
              const h = dustHead.value; const c = h * KM;
              dustHead.value = (h + 1) % M;
              const a2 = Math.random() * Math.PI * 2, spd = 120 + Math.random() * 260;
              d[c] = sinkX; d[c + 1] = sinkY - 6;
              d[c + 2] = Math.cos(a2) * spd; d[c + 3] = Math.sin(a2) * spd - 120;
              d[c + 4] = 0.30 + Math.random() * 0.25; d[c + 5] = d[c + 4];
            }
            continue;
          }
        } else {
          // not taken yet: it hangs where it is, with the lightest drift
          vx *= Math.pow(0.05, dt); vy *= Math.pow(0.05, dt);
          s[b] += vx * dt; s[b + 1] += vy * dt;
        }
        s[b + 2] = vx; s[b + 3] = vy;
        s[b + 9] += s[b + 10] * dt;
        const sp = Math.hypot(vx, vy);

        // motion smear: rotate into the heading and stretch along it
        if (sp > 40) s[b + 11] = Math.atan2(vy, vx);
        const st = Math.min(0.9, Math.max(0, (sp - 450) / 2400));
        s[b + 12] += (st - s[b + 12]) * Math.min(1, dt * 16);

        // stardust shed along the way — more the faster it goes
        if (sp > 200) {
          const n = sp > 1400 ? 4 : sp > 600 ? 3 : 2;
          const ux = vx / Math.max(1, sp), uy = vy / Math.max(1, sp);
          for (let k = 0; k < n; k++) {
            const h = dustHead.value; const c = h * KM;
            dustHead.value = (h + 1) % M;
            const off = (Math.random() - 0.5) * STICKER_SIZES[i] * 0.45;
            const back = Math.random() * STICKER_SIZES[i] * 0.3;
            d[c] = s[b] - ux * back - uy * off;
            d[c + 1] = s[b + 1] - uy * back + ux * off;
            d[c + 2] = vx * (0.25 + 0.30 * Math.random()) + (Math.random() - 0.5) * 80;
            d[c + 3] = vy * (0.25 + 0.30 * Math.random()) + (Math.random() - 0.5) * 80;
            d[c + 4] = 0.45 + Math.random() * 0.40;
            d[c + 5] = d[c + 4];
          }
        }
        continue;
      }

      if (s[b + 4] < 1) s[b + 4] = Math.min(1, s[b + 4] + dt * 3.6);
      s[b + 12] *= Math.pow(0.02, dt);

      if (out) {
        stillLeaving += 1;
        // falling: gravity and a little sway, nothing holds them any more
        vy += 1500 * dt;
        vx += Math.sin(t * 1.3 + s[b + 6]) * 30 * dt;
      } else {
        vy -= 16 * dt;                                                  // buoyancy
        vx += Math.sin(t * 0.85 + s[b + 6]) * 11 * dt;                  // wander
        vy += Math.cos(t * 0.65 + s[b + 6] * 1.3) * 7 * dt;
        const hx = ox + s[b + 7], hy = oy + s[b + 8];
        vx += (hx - s[b]) * 2.0 * dt;
        vy += (hy - s[b + 1]) * 2.0 * dt;
      }

      if (touchOn.value > 0) {
        const dx = s[b] - touchX.value, dy = s[b + 1] - touchY.value;
        const dd = Math.hypot(dx, dy);
        const reach = 170;
        if (dd < reach && dd > 0.5) {
          const f = (1 - dd / reach) * 2600 * dt;
          vx += (dx / dd) * f; vy += (dy / dd) * f;
          s[b + 10] += (dx / dd) * 0.9 * dt * 12;
        }
        vx += windX.value * 0.09; vy += windY.value * 0.09;
      }

      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const c = j * K;
        if (s[c + 5] <= 0) continue;
        const dx = s[b] - s[c], dy = s[b + 1] - s[c + 1];
        const dd = Math.hypot(dx, dy);
        const minD = (r + STICKER_SIZES[j] * 0.5) * 0.86;
        if (dd < minD && dd > 0.1) {
          const f = (minD - dd) * 13 * dt;
          vx += (dx / dd) * f; vy += (dy / dd) * f;
        }
      }

      const pad = -r * 0.5;
      if (s[b] < pad) vx += (pad - s[b]) * 6 * dt;
      if (s[b] > width - pad) vx -= (s[b] - (width - pad)) * 6 * dt;
      if (!out) {
        if (s[b + 1] < -r * 1.3) vy += (-r * 1.3 - s[b + 1]) * 8 * dt;
        const floor = (i % 6 === 4 && STICKER_SIZES[i] < 82) ? oy + r : oy - r * 0.8;
        if (s[b + 1] > floor) vy -= (s[b + 1] - floor) * 10 * dt;
      }

      const drag = Math.pow(out ? 0.55 : 0.07, dt);
      vx *= drag; vy *= drag;
      s[b + 2] = vx; s[b + 3] = vy;
      s[b] += vx * dt; s[b + 1] += vy * dt;

      // tumble: spin bleeds off, then settles into a slow rock
      s[b + 10] *= Math.pow(out ? 0.6 : 0.25, dt);
      s[b + 9] += s[b + 10] * dt + Math.sin(t * 0.7 + s[b + 6]) * 0.09 * dt;

      if (out && s[b + 1] > height + r * 1.5) { s[b + 5] = 0; s[b + 18] = 0; }
      if (m === 0 && !out) s[b + 5] = Math.max(0, s[b + 5] - dt * 0.65);
    }

    // ── the dust ─────────────────────────────────────────────────────────────
    // Every mote feels the same drain, so the trails bend into the spiral too,
    // and each one burns out in well under a second.
    if (vortex) {
      for (let q = 0; q < M; q++) {
        const c = q * KM;
        if (d[c + 4] <= 0) continue;
        d[c + 4] -= dt;
        const dx = sinkX - d[c], dy = sinkY - d[c + 1];
        const dist = Math.max(1, Math.hypot(dx, dy));
        const g = (700 + 7e5 / Math.max(dist, 60)) * (m === 2 ? pull : 0.3);
        const nx = dx / dist, ny = dy / dist;
        d[c + 2] += (nx * g - ny * g * 0.30) * dt;
        d[c + 3] += (ny * g + nx * g * 0.30) * dt;
        const dr = Math.pow(0.25, dt);
        d[c + 2] *= dr; d[c + 3] *= dr;
        d[c] += d[c + 2] * dt; d[c + 1] += d[c + 3] * dt;
        if (dist < SINK_R * 0.6) d[c + 4] = 0;
      }
    }

    leaving.value = stillLeaving;
    if (swallowed > 0) feed.value = Math.min(1, feed.value + swallowed * 0.16);
    feed.value *= Math.pow(0.08, dt);

    state.modify((v) => v, true);
    if (vortex) dust.modify((v) => v, true);
  });

  // the dust in two depths: the young motes bright and close, the old ones
  // fading out behind them
  const brightDust = useDerivedValue<SkPoint[]>(() => {
    const d = dust.value; const out: SkPoint[] = [];
    for (let q = 0; q < M; q++) {
      const c = q * KM;
      if (d[c + 4] > d[c + 5] * 0.55) out.push({ x: d[c], y: d[c + 1] });
    }
    return out;
  });
  const dimDust = useDerivedValue<SkPoint[]>(() => {
    const d = dust.value; const out: SkPoint[] = [];
    for (let q = 0; q < M; q++) {
      const c = q * KM;
      if (d[c + 4] > 0 && d[c + 4] <= d[c + 5] * 0.55) out.push({ x: d[c], y: d[c + 1] });
    }
    return out;
  });

  // Rendered into the page's one canvas, under the lens, so the glass can bend
  // them as they pass through it.
  return (
    <Group>
      {vortex ? (
        <>
          <Points color="rgba(150, 200, 255, 0.38)" mode="points" points={dimDust}
            strokeCap="round" strokeWidth={1.6} />
          <Points color="rgba(225, 242, 255, 0.92)" mode="points" points={brightDust}
            strokeCap="round" strokeWidth={2.4} />
        </>
      ) : null}
      {stickers.map((source, i) => (
        <Sticker key={i} index={i} source={source} state={state} />
      ))}
    </Group>
  );
}

function Sticker({ index, source, state }: {
  index: number; source: number; state: SharedValue<number[]>;
}) {
  const img = useImage(source);
  const b = index * K;
  const size = STICKER_SIZES[index];
  const half = size / 2;

  const transform = useDerivedValue(() => {
    const s = state.value;
    const st = s[b + 12] || 0;
    const h = s[b + 11] || 0;
    // the smear: lean into the heading, stretch along it and thin across it,
    // then the sticker's own spin
    return [
      { translateX: s[b] || 0 },
      { translateY: s[b + 1] || 0 },
      { rotate: h },
      { scaleX: 1 + st * 0.9 },
      { scaleY: 1 - st * 0.42 },
      { rotate: -h },
      { scale: Math.max(0.001, s[b + 4] || 0) },
      { rotate: s[b + 9] || 0 },
    ];
  });
  const opacity = useDerivedValue(() => state.value[b + 5]);

  if (!img) return null;
  // No drop-shadow layer: a Skia <Shadow> inside a layer paint is a saveLayer
  // plus a Gaussian per sticker, and forty of those pin the whole page at a
  // couple of frames a second. The stickers are die-cut with a white keyline
  // anyway, which is what lifts them off the scene.
  return (
    <Group opacity={opacity} transform={transform}>
      <Image fit="contain" height={size} image={img} width={size} x={-half} y={-half} />
    </Group>
  );
}
