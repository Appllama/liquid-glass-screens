# Cookbook 1 — Sky: prompts to replicate the artwork

Every asset in `assets/cookbooks/sky` came from these prompts. Run them with GPT Image 2 at `--quality high --resolution 1k` (or any comparable image model), Seedance 2.0 for the clip, and a background-removal pass for the die-cuts. Keep the style sentences and the "no text, no watermark" tail; change the subjects to your own.

## Style system

- **Wordmark:** inflated silver chrome foil helium-balloon letters, mirror-like, with crisp seams.
- **Stickers, three families in one set:**
  - *photo die-cut* — a real photograph cut out with a thick, even white keyline and a soft drop shadow;
  - *holographic icon* — a glossy iridescent chrome 3D icon with cyan, lavender, and gold reflections;
  - *speech bubble* — a hand-drawn bubble, white fill, thick black marker outline, casual handwritten lettering, white keyline.
- **Backdrop:** a calm daylight sky with soft clouds, nothing else in frame.

## Wordmark

~~~text
The word UNREEL in inflated silver chrome foil helium balloon letters, mylar balloon typography, bold rounded letters, slightly overlapping and playfully tilted, mirror-like metallic surface reflecting a pale blue sky with white highlights and crisp foil seams, stacked on two lines: UN on the top line and REEL on the bottom line, centered, isolated on a transparent background, no other text, no watermark
~~~

Replace `UNREEL`, `UN`, and `REEL` with your own name and line break.

## Sticker style sentences

Append the subject in front of the matching sentence.

~~~text
PHOTO: real photograph die-cut sticker, cut out with a thick even white keyline border following the silhouette, soft drop shadow, slightly tilted, centered, isolated on a transparent background, no other objects, no text, no watermark
~~~

~~~text
HOLO: 3D icon in glossy iridescent holographic chrome, pearlescent surface with soft rainbow reflections of cyan, lavender and gold, soft studio lighting, floating, centered, isolated on a transparent background, no text, no watermark
~~~

~~~text
BUBBLE: die-cut sticker of a hand-drawn speech bubble with white fill and a thick black marker outline, casual handwritten black marker lettering, slightly tilted, thick white keyline border around the sticker edge, soft drop shadow, isolated on a transparent background, no other text, no watermark, the lettering reads exactly: <your line>
~~~

## The 22 subjects

| File | Family | Subject |
| --- | --- | --- |
| `pizza` | PHOTO | A hand holding up a slice of New York pizza with stretching cheese |
| `dog` | PHOTO | A small happy dog sitting and looking up |
| `boots` | PHOTO | A pair of worn brown leather hiking boots |
| `polaroid` | PHOTO | An instant photo print of a sunny beach |
| `camcorder` | PHOTO | A silver 2000s handheld camcorder with its screen flipped open showing a landscape |
| `disco` | HOLO | A mirrored disco ball |
| `star` | HOLO | A five-point star |
| `sushi` | HOLO | A piece of salmon nigiri sushi |
| `coffee` | HOLO | A takeaway coffee cup with a lid |
| `martini` | HOLO | A martini glass with an olive |
| `bubble-reel` | BUBBLE | Saw it on a reel. |
| `cake` | HOLO | A slice of layered cake |
| `bag` | HOLO | A small shopping bag |
| `croissant` | HOLO | A croissant |
| `tennis` | HOLO | A tennis ball |
| `bubble-hype` | BUBBLE | Hype. |
| `reel` | HOLO | A film reel |
| `suitcase` | HOLO | A small rolling suitcase |
| `mascot` | HOLO | A round sky-blue 3D clay ball character with two big white eyes |
| `frame` | HOLO | An empty picture frame |
| `bubble-trap` | BUBBLE | It's a trap. |
| `pin` | HOLO | A map pin |

## Backdrop still

~~~text
Vertical 9:16 phone wallpaper, photoreal: a calm pale blue daytime sky with soft white cumulus clouds gathered along the bottom third and thinning to clear sky at the top, gentle even daylight, no horizon, no ground, no birds, no sun, no text, no watermark
~~~

## Backdrop loop

Image-to-video with Seedance 2.0 from the still, 9:16, 720p, 8 seconds, audio off:

~~~text
Static locked-off shot of this sky. The clouds drift very slowly and softly change shape. Nothing enters or exits the frame, no camera movement, no zoom, no birds, no objects, photoreal, seamless
~~~

Then make it seamless. A generated clip's last frame never matches its first closely enough, and the mean pixel difference is the wrong metric — count the pixels that jump. A forward+reverse ping-pong, dropping the duplicated endpoint frames, is what ships:

~~~bash
N=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 in.mp4)
ffmpeg -i in.mp4 -filter_complex "[0:v]split[a][b];[b]reverse,trim=start_frame=1:end_frame=$((N-1)),setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[out]" -map "[out]" -an -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart sky.mp4
ffmpeg -i sky.mp4 -frames:v 1 sky-poster.png
~~~

Check the seam: extract the first and last frames and count pixels that differ by more than 8 levels; a few hundred is invisible, tens of thousands is a jump.

## Post-processing the die-cuts

The image model bakes a fake checkerboard where it was asked for transparency. Strip it with a background-removal model (the white keyline survives), then:

~~~bash
# 512 px is plenty: the largest sticker renders at 104 pt, so 312 px at 3×
pngquant --quality 65-90 --speed 1 --strip --force --output out.png in.png
oxipng -o 2 --strip safe out.png
~~~

Reject any output with a halo or fringe at 400 % zoom, baked-in text, or a style that drifts from the set; regenerate rather than retouch.

## Copy

- Hint: `Swipe up to enter`
- Headline: `Create and discover` · struck word `screenshots` · kept word `spots`
- Third line rotation: `to save your memories` · `to plan your next trip` · `to relive your travels` · `to come back to later`
- Pill: `Let's go`
