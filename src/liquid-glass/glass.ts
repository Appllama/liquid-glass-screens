import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';

/**
 * The glass sphere. Two shaders make it:
 *
 * - `lensEffect` is a backdrop filter: a thick-glass refraction that magnifies
 *   toward the centre, shears hard at the bevelled rim, bends the three colour
 *   channels by slightly different amounts, and drags the picture inside with
 *   the motion so the "liquid" lags the glass.
 * - `glassEffect` is drawn over it: a milky lift inside, a halo outside, one
 *   hairline of rim light, a broad sheen at the upper left, and — while the
 *   sphere is being pushed — the chromatic caustic: a soft lavender-cyan bloom
 *   that focuses into a bowl of light (a clear oval hole, a cyan→azure→deep
 *   blue band, a thread of gold beyond it, a cyan trace along the rim).
 *
 * `night` blends the daylight tuning (a grey shade outside, a white body) into
 * the night tuning (a blue-white glow outside, a cooler and clearer body, a
 * caustic that stays luminous instead of reading as paint on black).
 *
 * Caustic geometry, in units of the sphere radius along the direction of
 * travel `dv`: ring ellipse centred 0.639 along dv with semi-axes 0.52 across
 * × 0.361 along; hole circle centred 0.750 along dv, radius 0.245 when fully
 * focused; gold thread just beyond the ring at ~1.15 of its radius.
 */
export const GLASS_SKSL = `
uniform float2 c;
uniform float r;
uniform float glow;    // 0..1, how hard the sphere is being thrown around
uniform float2 dv;     // unit vector toward the leading edge
uniform float small;   // 0 = the gate sphere, 1 = the + button
uniform float caus;    // 0..1, how much of the caustic this size of sphere shows
uniform float night;   // 0 = daylight tuning, 1 = night tuning

half4 main(float2 p) {
  float2 d = (p - c) / r;
  float rr = length(d);
  if (rr > 1.34) return half4(0.0);
  float aa = 1.4 / r;
  float inside = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, rr);
  float2 nd = d / max(rr, 1e-4);

  // ── halo outside the rim ────────────────────────────────────────────────
  // By day a soft grey falloff, heavier below, that makes the sphere sit in
  // front of the page; by night a blue-white glow breathing off the rim,
  // heavier at the crown, that lifts it off the black.
  float haloW = mix(mix(0.075, 0.20, small), mix(0.16, 0.30, small), night);
  float halo = (1.0 - smoothstep(1.0, 1.0 + haloW, rr)) * (1.0 - inside);
  float shDay = halo * (0.075 + 0.11 * smoothstep(-0.4, 1.0, d.y)) * mix(1.0, 1.5, small);
  float shNight = halo * halo * (0.10 + 0.08 * smoothstep(0.6, -1.0, d.y)) * mix(1.0, 1.4, small);
  float sh = mix(shDay, shNight, night);

  // ── the body ────────────────────────────────────────────────────────────
  float dome = 1.0 - smoothstep(0.0, 1.0, rr);
  float aDay = mix(0.06 + 0.06 * dome, 0.22 + 0.08 * dome, small);
  float aNight = mix(0.018 + 0.035 * dome, 0.20 + 0.08 * dome, small);
  float a = mix(aDay, aNight, night);
  half3 col = mix(half3(1.0), half3(0.93, 0.96, 1.0), half(night));

  // ── rim and sheen ───────────────────────────────────────────────────────
  float rim   = smoothstep(0.958, 0.990, rr) * (1.0 - smoothstep(0.990, 1.0, rr));
  float inner = smoothstep(0.90, 0.975, rr) * (1.0 - smoothstep(0.975, 1.0, rr));
  // a thick bright band hugging the upper rim, brightest toward one o'clock
  // and fading round toward ten
  float up    = clamp(dot(nd, normalize(float2(0.30, -0.95))), 0.0, 1.0);
  float sheen = smoothstep(0.86, 0.945, rr) * (1.0 - smoothstep(0.965, 0.995, rr)) * pow(up, 1.3)
              + smoothstep(0.62, 0.90, rr) * (1.0 - smoothstep(0.90, 0.97, rr)) * pow(up, 2.2) * 0.35;
  float lowRim = smoothstep(0.86, 0.975, rr) * (1.0 - smoothstep(0.975, 1.0, rr))
               * pow(clamp(dot(nd, normalize(float2(0.42, 0.90))), 0.0, 1.0), 2.4);
  a += rim * mix(0.62, 0.80, small) + sheen * mix(0.62, 0.50, small) + lowRim * mix(0.14, 0.40, small);
  col = mix(col, half3(0.70, 0.72, 0.76), inner * 0.34);

  // ── motion caustic ──────────────────────────────────────────────────────
  float g = glow * caus;
  if (g > 0.002) {
    // the whole interior brightens while it moves (on black a white lift
    // turns the glass into a grey plate, so at night it is kept to a breath)
    a += g * mix(0.12, 0.05, night) * (1.0 - smoothstep(0.80, 1.0, rr));

    float2 ax = dv;
    float2 px = float2(-ax.y, ax.x);
    float u = dot(d, px);
    float v = dot(d, ax);

    // focus: a soft bloom at a nudge, a crisp bowl at a throw
    float focus = smoothstep(0.10, 0.80, g);
    float holeR = mix(0.06, 0.245, focus);
    float soft  = mix(0.55, 0.0, focus);

    float eo = length(float2(u / 0.52, (v - 0.639) / 0.361));
    float eh = length(float2(u, v - 0.750)) / holeR;

    float band = (1.0 - smoothstep(0.86 - soft, 1.06 + soft * 0.5, eo))
               * smoothstep(0.80 - soft * 0.6, 1.18 + soft, eh);
    band *= 1.0 - smoothstep(0.955, 1.0, rr);        // never spill past the rim

    half3 cyan = half3(0.36, 0.86, 0.96);
    half3 azur = half3(0.06, 0.53, 0.98);
    // on black a dark blue reads as paint, so the deep edge stays luminous
    half3 deep = mix(half3(0.12, 0.31, 0.91), half3(0.22, 0.44, 1.0), half(night));
    half3 lav  = half3(0.66, 0.68, 0.92);
    half3 ring = mix(cyan, azur, half(smoothstep(0.46, 0.72, eo)));
    ring = mix(ring, deep, half(smoothstep(0.72, 0.86, eo)));
    ring = mix(lav, ring, half(0.35 + 0.65 * focus));   // washed lavender until it focuses

    // graded: barely there at the inner edge, densest where it goes deep
    // blue, gone again by the outer edge — never a flat disc
    float grade = 0.28 + 0.72 * smoothstep(0.42, 0.80, eo);
    float ba = band * grade * mix(mix(0.55, 0.92, focus), mix(0.30, 0.55, focus), night) * g;
    col = mix(col, ring, half(clamp(ba * mix(1.25, 1.6, night), 0.0, 1.0)));
    a += ba;

    // the light that gets through the hole
    a += (1.0 - smoothstep(0.10, 1.06, eh)) * g * mix(0.30, 0.16, night) * focus * (1.0 - smoothstep(0.94, 1.0, rr));

    // dispersion: a hairline of pale gold just outside the blue, mostly on the
    // trailing side — a thread, not a ring
    float trail = 0.35 + 0.65 * smoothstep(0.2, 0.9, -v);
    float gold = smoothstep(1.115, 1.145, eo) * (1.0 - smoothstep(1.155, 1.19, eo))
               * (1.0 - smoothstep(0.965, 1.0, rr)) * g * focus * trail;
    col = mix(col, half3(1.0, 0.85, 0.42), half(clamp(gold * 1.4, 0.0, 1.0)));
    a += gold * 0.32;

    // and the cyan trace along the rim, strongest where the ring meets it
    float lobe = 0.45 + 0.55 * (1.0 - smoothstep(0.55, 1.25, eo));
    float trace = rim * lobe * g;
    col = mix(col, half3(0.30, 0.86, 1.0), half(clamp(trace * 1.7, 0.0, 1.0)));
    a += trace * 0.35;
  }

  // ── the button's edge picks up colour from whatever floats past it ──────
  if (small > 0.01) {
    float ang = atan(d.y, d.x);
    float edge = smoothstep(0.955, 0.985, rr) * (1.0 - smoothstep(0.985, 1.0, rr));
    half3 iris = half3(0.5 + 0.5 * cos(6.2832 * (ang * 0.55 + 0.00)),
                       0.5 + 0.5 * cos(6.2832 * (ang * 0.55 + 0.33)),
                       0.5 + 0.5 * cos(6.2832 * (ang * 0.55 + 0.67)));
    col = mix(col, iris, half(clamp(edge * 0.28 * small, 0.0, 1.0)));
    // a fine dark line right on the edge
    float line = smoothstep(0.985, 0.995, rr) * (1.0 - smoothstep(0.995, 1.0, rr));
    col = mix(col, half3(0.55, 0.56, 0.60), half(line * 0.55 * small));
    a += line * 0.30 * small;
  }

  a = clamp(a, 0.0, 1.0) * inside + sh;
  half3 haloCol = mix(half3(0.0), half3(0.55, 0.72, 1.0), half(night));
  half3 outc = mix(haloCol, col, half(inside));
  return half4(outc * a, a);
}
`;

const compiled = Skia.RuntimeEffect.Make(GLASS_SKSL);
if (!compiled) throw new Error('liquid-glass: glass shader failed to compile');
export const glassEffect: SkRuntimeEffect = compiled;

/**
 * The lens, applied as a backdrop filter so it bends whatever is drawn under
 * it: the scene and the stickers as they drift through the sphere.
 */
export const LENS_SKSL = `
uniform shader image;
uniform float2 c;
uniform float r;
uniform float amount;   // how thick the glass is
uniform float bezel;    // how much of the radius is the bevelled edge
uniform float disp;     // dispersion: how far apart the three channels land
uniform float2 slosh;   // px: how far the picture inside is dragged along with the motion

half4 main(float2 p) {
  float2 d = (p - c) / r;
  float rr = length(d);
  if (rr >= 1.0) return image.eval(p);
  // a thick lens: the whole interior magnifies, and the bevel at the rim pulls
  // hard — content crossing it stretches along the edge
  float bev = smoothstep(1.0 - bezel, 1.0, rr);
  float k = amount * (0.42 + 0.58 * bev * bev);
  // the liquid inside lags the glass: the picture is dragged along with the
  // motion, most at the centre and not at all at the rim, and settles back
  float2 back = (p - c) * k + slosh * (1.0 - rr * rr);
  half4 cr = image.eval(p - back * (1.0 + disp));
  half4 cg = image.eval(p - back);
  half4 cb = image.eval(p - back * (1.0 - disp));
  float aa = max(cg.a, max(cr.a, cb.a));
  return half4(cr.r, cg.g, cb.b, aa);
}
`;

const lens = Skia.RuntimeEffect.Make(LENS_SKSL);
if (!lens) throw new Error('liquid-glass: lens shader failed to compile');
export const lensEffect: SkRuntimeEffect = lens;
