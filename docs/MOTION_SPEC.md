# Motion specification

Every number below is what the code uses. Geometry is authored at 402 × 874 points; `sx = width / 402` and `sy = height / 874` scale it to the device. Both cookbooks share the sphere, the caustic, the copy, and the plume; the last section lists what each theme changes.

## The sphere

| Quantity | Value |
| --- | --- |
| Gate: dome radius, centre | `R0 = 245 sx`, centred on the bottom edge (`CY0 = height`) |
| Button: radius, centre | `R1 = 44 sx`, `CY1 = 0.469 height` |
| Floor when thrown past the button | `RF = 32 sx`, approached as `RF + (R1 − RF) · e^(−overshoot / 40 sy)` |
| Travel | `p ∈ [0, 1]` maps the centre linearly from `CY0` to `CY1`; the finger moves it 1:1 (`Δp = −Δy / (CY0 − CY1)`) |
| Radius | a straight function of `p`: `R0 + (R1 − R0) · p` — no beat of its own, so shrinking up and growing back read identically |
| Rubber band | past either end the finger's travel counts at 25 % |
| Sideways | follows the finger on a soft leash: `150 sx · tanh(Δx / 150 sx)` |
| Release | target is `1` when `p + 0.18 · v̂` exceeds `0.5`, else `0`, where `v̂` is the release velocity in travel units |
| Landing spring | `{ damping: 15, stiffness: 120, mass: 1.05 }` with the release velocity handed in; under Reduce Motion `{ damping: 30, stiffness: 160, mass: 1 }` |
| Landed | decided from position, not from the spring's callback: `p > 0.97` with the finger lifted |
| Un-landed | `p < 0.80` |
| "+" glyph | fades in over the last stretch of the shrink, between radii `1.7 R1` and `1.2 R1` |

## The lens (backdrop filter)

| Uniform | At the button | At the dome |
| --- | --- | --- |
| `amount` (thickness) | 0.62 | 0.42 |
| `bezel` (share of the radius that is bevel) | 0.42 | 0.25 |
| `disp` (per-channel spread) | 0.12 | Sky 0.05 · Astro 0 (reached at 0.6 R0) |
| `slosh` | `0.10 R` × the smoothed motion, applied most at the centre and not at the rim |

Magnification is `amount · (0.42 + 0.58 · bevel²)`, so the interior magnifies and the rim shears.

## The caustic

The light answers force, not speed.

- While the finger is down, the target is `min(1, |force| / 430)` where force is the finger's velocity plus (when not touching) the sphere's own velocity.
- In free flight the target is `min(1, |deceleration| / 12000)` and only while the sphere is slowing, so a landing floods the crown and a throw is dark.
- The glow eases toward the target at 22 % per frame rising and 12 % falling.
- Direction: the light gathers at the crown; a sideways shove tilts it up to about 25° (`tx = 0.42 · x̂`); it drops to the bottom only when pulled straight down (`ŷ > 0.55`).
- Focus: a soft bloom below `g = 0.10`, a crisp bowl by `g = 0.80`; the hole radius grows from 0.06 R to 0.245 R.
- The caustic belongs to the big glass: it is faded out between radii `190 sx` and `100 sx`.

## The copy

| Element | Motion |
| --- | --- |
| Wordmark | fades between `p = 0.08` and `0.62`, defocus 0 → 13 between `0.05` and `0.60` |
| Hint | fades between `p = 0.06` and `0.30`, defocus 0 → 12, carried `0.04 R` with the slosh |
| Headline and pill | 520 ms `bezier(0.23, 1, 0.32, 1)` in after landing; 240 ms `easeOutQuad` out; defocus 14 → 0 |
| Third line, in | a positional blur wipe, left to right, 560 ms `bezier(0.16, 0.42, 0.40, 1)`; front ramp 34 % of the line, 26 intensity ahead of it |
| Third line, hold | 1950 ms |
| Third line, out | 400 ms: blur to 19 with `easeOutQuad`, opacity to 0 with `easeInQuad`, no travel |
| Gap before the next line | 460 ms |
| Reduce Motion | the wipe is skipped; the line appears in place |

## The plume

| Quantity | Value |
| --- | --- |
| Slots | 40, sizes `104 82 76 93 87 · 68 46 58 52 55 · 98 49 43 54 36 · 91 47 41 35 62 · 85 32 50 30 · 39 27 44 24 · 71 40 33 64 · 29 57 45 26 · 79 31 22 37` pt |
| Emission | starts 350 ms after landing, one sticker every 30 ms |
| Birth | four in five rise through the button's own glass at scale 0.34 within 26 pt of its centre; one in five surfaces as a speck above it at scale 0.16; scale grows at 3.6 / s |
| Launch | speed 90–290 pt/s within ±34° of straight up |
| Home | a plume narrowing at the base and opening as it climbs: `x ∈ ±(34 + 178 t)`, `y ∈ −40 − 545 t`, strays 1.8× wider and 90 pt higher; a few small ones stay within 40 pt of the button |
| Forces | buoyancy 16, wander 11 (x) and 7 (y), a spring to home at 2.0 /s², neighbour repulsion at 0.86 of the summed radii, finger repulsion within 170 pt at up to 2600, wind at 9 % of the finger's velocity |
| Drag | `0.07 ^ dt` |
| Tumble | spin decays at `0.25 ^ dt` and settles into a 0.09 rad/s rock |

## Leaving

### Sky — fall

Released when the sphere is back below `p = 0.35`. Each sticker gets a shove of ±45 pt/s sideways and 40–200 pt/s down and a tumble of ±1.5 rad/s, then gravity at 1500 pt/s² with a 30 pt/s² sway, drag `0.55 ^ dt`, and is retired once it is a sticker-and-a-half below the bottom edge.

### Astro — vortex

Released the moment the open state is let go, `p = 0.78`. Each sticker rides a log spiral into the drain at the bottom centre:

| Quantity | Value |
| --- | --- |
| Delay | `0.02 + 0.12 · far + 0–0.05` s, where `far = min(1, r0 / 900)` — the nearest go first |
| Duration | `0.30 + 0.28 · far + 0–0.08` s |
| Radius | `r = r0 · (1 − u²)` — a lean, then a jet |
| Winding | `θ = θ0 + w · ln(r0 / r)` with `w ∈ [0.42, 0.72]`, the same sign for all, so the plume sweeps down one side as a single stream |
| Shrink | to 12 % over the last 260 pt |
| Spin-up | `26 · u²` rad/s² |
| Smear | above 450 pt/s the sticker leans into its heading and stretches along it up to 1.9× (thinning to 0.58× across) |
| Dust | 2–4 motes per frame per sticker above 200 pt/s, 0.45–0.85 s of life, pulled by the same drain; a 5-mote splash at the point of entry |
| Glow flare | each entry adds `0.16 · (0.6 + 0.4 · size / 104)` to `feed`, which decays at `0.08 ^ dt` and is drawn as a second additive pass of the glow layer at up to 85 % |
| Interrupted | a sticker mid-fall keeps falling when the sphere springs back, and is born again through the button once it is gone |

## What each theme changes

| | Sky | Astro |
| --- | --- | --- |
| Backdrop | looping cloud video, poster under it | star layer, glow layer added as light: opacity `1 → 0` between `p = 0.04` and `0.70` |
| Glass tuning (`night`) | 0: grey halo, white body | 1: blue-white halo, cool clear body, luminous caustic |
| Lens dispersion at the dome | 0.05 | 0 (stars would split into three coloured dots) |
| Release | `p < 0.35` | `p < 0.78` |
| Blur tint | light | dark |
| Status bar | dark | light |
