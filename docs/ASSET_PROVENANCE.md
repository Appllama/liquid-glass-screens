# Generated asset provenance

All raster artwork and the clip under `assets/cookbooks` were newly created for this project. Wordmarks, stickers, and stills were generated with GPT Image 2 at high quality and 1K through the Higgsfield CLI; the die-cuts were then passed through a background-removal model to strip the checkerboard the image model bakes in, resized to 512 px, and losslessly optimized. The cloud loop was generated with Seedance 2.0 from a generated still. No production app assets were copied into the repository. The prompts are published in [`prompts/`](../prompts).

## Cookbook 1 — Sky

| File | Provenance |
| --- | --- |
| `sky.mp4` | 720×1280, 24 fps, 16 s. Seedance 2.0 image-to-video from a generated cloud still (`sky-poster.png`), prompted as a locked-off shot with nothing entering or leaving frame, then made seamless as a forward+reverse ping-pong with ffmpeg (the duplicated endpoint frames dropped). |
| `sky-poster.png` | The generated cloud still, also the first frame of the loop. Drawn under the video so the first paint is never blank. |
| `wordmark.png` | Chrome-foil helium-balloon letters, generated, background removed, 768 px. |
| `stickers/` (22) | `pizza`, `dog`, `boots`, `polaroid`, `camcorder`, `disco`, `star`, `sushi`, `coffee`, `martini`, `bubble-reel`, `cake`, `bag`, `croissant`, `tennis`, `bubble-hype`, `reel`, `suitcase`, `mascot`, `frame`, `bubble-trap`, `pin`. Three families: photographic die-cuts with a white keyline, glossy holographic 3D icons, and hand-drawn marker speech bubbles. |

## Cookbook 2 — Astro

| File | Provenance |
| --- | --- |
| `stars.png` | The generated night still with its low-frequency glow removed: a median filter (radius 21) blurred with a Gaussian (radius 18) was subtracted from the still. |
| `glow.png` | That low-frequency part. Stacked with `stars.png` in additive blending it reproduces the still to within 0.2/255, which is what lets the glow dissipate on its own through the glass. |
| `wordmark.png` | Chrome-foil balloon letters stacked on two lines, generated, background removed, 768 px. |
| `stickers/` (24) | `mac`, `bubble-build`, `keyboard`, `phone`, `robot`, `cursor`, `code`, `rocket`, `planet`, `bolt`, `sparkle`, `wand`, `puzzle`, `bubble-ship`, `floppy`, `astronaut`, `paper-plane`, `bubble-dark-mode`, `bulb`, `controller`, `bubble-vibe`, plus `star`, `bubble-reel`, and `mascot` shared with Cookbook 1 so each cookbook is self-contained. |

## README and Appllama assets

| File | Provenance |
| --- | --- |
| `assets/images/liquid-glass-icon.png` | Neutral project icon: a glass sphere over a navy-black gradient, generated with GPT Image 2. It contains no referenced product branding. `liquid-glass-favicon.png` is its 48 px derivative. |
| `docs/images/appllama-logo-dark.png` | Official Appllama logo downloaded from `https://public.appllama.io/appllama-logo-dark.png` for dark GitHub surfaces. |
| `docs/images/appllama-logo-light.png` | Official Appllama light-surface logo variant downloaded from `https://public.appllama.io/appllama-logo-light.png`. |
| `docs/images/liquid-glass-showcase-01.png` | Composite of three exact simulator captures of this repository's Sky cookbook (gate, mid-swipe, open), uniformly scaled and clipped only by the device corner mask. |
| `docs/images/liquid-glass-showcase-02.png` | The same composite for the Astro cookbook. |

The showcase panels are rendered by [`scripts/render-showcase.py`](../scripts/render-showcase.py). No perspective deformation, independent scaling, or generative reconstruction of interface pixels is used.

## Reference inputs

The clip used to calibrate the interaction was recorded from a publicly visible app and lives outside this repository. It is not part of the distributable project. `MOTION_SPEC.md` records every number needed to audit the implementation, and every bitmap that is actually shipped is listed above.
