# Cookbook 2 — Astro: prompts to replicate the artwork

Every asset in `assets/cookbooks/astro` came from these prompts. Run them with GPT Image 2 at `--quality high --resolution 1k` (or any comparable image model) and a background-removal pass for the die-cuts. The night backdrop is a still on purpose: every animated starfield tried read as a screensaver, and a Seedance loop from a very dark still "develops" faint haze into bright structure over the clip. The life in the page comes from the glow layer dissipating through the glass instead.

## Style system

The same three sticker families as Cookbook 1 (photo die-cut, holographic icon, speech bubble), the same chrome-balloon wordmark, and one restrained night: pure black, cool white stars, a single cyan accent. Warm gold appears only as a thread in the stars. Nothing else in frame.

## Wordmark

~~~text
The word ASTRA in inflated silver chrome foil helium balloon letters, mylar balloon typography, bold rounded letters, slightly overlapping and playfully tilted, mirror-like metallic surface reflecting a cool dark night sky with blue-white highlights and crisp foil seams, stacked on two lines: AS on the top line and TRA on the bottom line, centered, isolated on a transparent background, no other text, no watermark
~~~

## Sticker style sentences

~~~text
PHOTO: real photograph die-cut sticker, cut out with a thick even white keyline border following the silhouette, soft drop shadow, slightly tilted, centered, isolated on a transparent background, no other objects, no text, no watermark
~~~

~~~text
HOLO: 3D icon in glossy iridescent holographic chrome, pearlescent surface with soft rainbow reflections of cyan, lavender and gold, soft studio lighting, floating, centered, isolated on a transparent background, no text, no watermark
~~~

~~~text
BUBBLE: die-cut sticker of a hand-drawn speech bubble with white fill and a thick black marker outline, casual handwritten black marker lettering, slightly tilted, thick white keyline border around the sticker edge, soft drop shadow, isolated on a transparent background, no other text, no watermark, the lettering reads exactly: <your line>
~~~

## The 24 subjects

| File | Family | Subject |
| --- | --- | --- |
| `mac` | PHOTO | A vintage beige compact Macintosh computer with a tiny smiling face on its small screen |
| `bubble-build` | BUBBLE | Build me an app |
| `keyboard` | PHOTO | A compact white mechanical keyboard with pastel keycaps seen from a three-quarter angle |
| `phone` | PHOTO | A modern black smartphone held upright showing a colorful grid of app icons on its screen |
| `robot` | PHOTO | A cute vintage tin toy robot, silver with red accents |
| `cursor` | HOLO | A classic mouse cursor arrow pointer |
| `star` | HOLO | A five-point star |
| `code` | HOLO | The code brackets symbol with angle brackets and a slash between them |
| `rocket` | HOLO | A small cartoon rocket ship with fins |
| `planet` | HOLO | A planet with a single tilted ring around it |
| `bubble-reel` | BUBBLE | Saw it on a reel. |
| `bolt` | HOLO | A lightning bolt |
| `sparkle` | HOLO | A four-point sparkle star shape |
| `wand` | HOLO | A magic wand with a small star at its tip |
| `puzzle` | HOLO | A single jigsaw puzzle piece |
| `bubble-ship` | BUBBLE | Ship it. |
| `floppy` | PHOTO | A pale blue 3.5 inch floppy disk with a blank white label |
| `astronaut` | PHOTO | A small toy astronaut figurine in a white spacesuit waving |
| `mascot` | HOLO | A round sky-blue 3D clay ball character with two big white eyes |
| `paper-plane` | PHOTO | A folded white paper airplane |
| `bubble-dark-mode` | BUBBLE | Add dark mode |
| `bulb` | PHOTO | A glowing clear glass light bulb with a warm filament |
| `controller` | PHOTO | A white wireless video game controller |
| `bubble-vibe` | BUBBLE | Just vibe code it |

## Backdrop still

The base sentence used for every night candidate, then the subject of the one that shipped:

~~~text
Vertical 9:16 phone wallpaper, photoreal, extremely restrained and minimal, pure black background dominating the frame, no text, no watermark, no planets, no lens flare, cinematic, high-end, quiet. Deep space: a very faint cold cyan-white glow rises from the bottom edge like a horizon of light and fades to pure black by a third of the way up the frame; sparse tiny pinpoint stars scattered above. No galaxy. Subtle, elegant.
~~~

Nine other directions were rendered and rejected for this page — a dotted spiral galaxy, a spiral low in the void, a planet rim, a pure starfield, a Milky Way band, an eclipse ring, hairline constellations, a single bloomed star, and star trails. All of them either competed with the wordmark or tipped into screensaver.

## Splitting the still into stars and glow

The screen draws the still in two layers so the glow can go out on its own while the stars stay put. Both are drawn under the lens; the glow is added with `blendMode="plus"` and its opacity follows the sphere. Stacked, they reproduce the still to within 0.2/255.

~~~python
from PIL import Image, ImageFilter
import numpy as np

still = np.asarray(Image.open('night.png').convert('RGB')).astype(np.float32)
low = Image.fromarray(still.astype(np.uint8)).filter(ImageFilter.MedianFilter(21)).filter(ImageFilter.GaussianBlur(18))
glow = np.asarray(low).astype(np.float32)
stars = np.clip(still - glow, 0, 255)
Image.fromarray(stars.astype(np.uint8)).save('stars.png')
Image.fromarray(glow.astype(np.uint8)).save('glow.png')
~~~

## Post-processing the die-cuts

As in Cookbook 1: strip the baked checkerboard with a background-removal model, resize to 512 px, then `pngquant --quality 65-90 --speed 1 --strip` and `oxipng -o 2 --strip safe`. Reject any output with a halo at 400 % zoom, baked-in text, or a style that drifts from the set.

## Copy

- Hint: `Swipe up to enter`
- Headline: `Create and launch` · struck word `code` · kept word `apps`
- Third line rotation: `from one message` · `you saw on a reel` · `without a line of code` · `before your coffee cools`
- Pill: `Let's go`
