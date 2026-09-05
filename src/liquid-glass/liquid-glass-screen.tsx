/* eslint-disable react-hooks/immutability -- Reanimated shared values are mutable boxes; writing `.value` from worklets and effects is their API. */
import {
  BackdropFilter,
  Canvas,
  Group,
  Image as SkImage,
  Rect,
  RuntimeShader,
  Shader,
  Skia,
  useImage,
  useVideo,
} from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Soft, WipeLine } from './copy';
import { glassEffect, lensEffect } from './glass';
import { OrbField } from './orb-field';
import type { CookbookTheme, LiquidGlassScreenProps } from './types';

/**
 * The liquid-glass welcome screen. One gesture scrubs the whole page: a great
 * glass dome sits on the bottom edge; swiping up carries it toward the middle
 * of the screen, and it shrinks as it climbs until it is a "+" button. When
 * it lands, the cookbook's stickers surface through its glass and settle into
 * a plume above it, and the copy and the call to action come in. Dragging it
 * back down grows it again and takes the plume away.
 *
 * Everything is authored against a 402 × 874 pt reference and scaled.
 */

// third-line cycle
const HOLD_MS = 1950;
const OUT_MS = 400;
const GAP_MS = 460;
const IN_MS = 560;

type Props = LiquidGlassScreenProps & { theme: CookbookTheme };

export function LiquidGlassScreen({ theme, initialState = 'gate', onActionPress, onPrimaryPress }: Props) {
  const { width, height } = useWindowDimensions();
  const sx = width / 402, sy = height / 874;
  const reduceMotion = useReducedMotion();
  const { colors, copy } = theme;

  // ── the sphere, measured off the reference ────────────────────────────────
  // Its size is a straight function of where it is: it shrinks as it climbs,
  // grows again as it comes back, and follows the finger both ways, in both
  // axes — no beat of its own. Thrown past the button's rest point it only
  // tightens a little further, down to a floor.
  const R0 = 245 * sx, CY0 = height;            // the gate: a dome centred on the bottom edge
  const R1 = 44 * sx,  CY1 = 0.469 * height;     // the + button
  const RF = 32 * sx;                            // the floor above the rest point
  const CX = width / 2;
  const TRAVEL = CY0 - CY1;                      // 1:1 with the finger
  // a small bounce on landing; none when the system asks for less motion
  const SPRING = reduceMotion
    ? { damping: 30, stiffness: 160, mass: 1 }
    : { damping: 15, stiffness: 120, mass: 1.05 };

  // ── the scene, drawn inside the canvas so the lens bends it ──────────────
  const background = theme.background;
  // The clip is played from a local file: AVPlayer needs byte-range requests,
  // which the Metro asset server does not serve, so in development the module
  // is downloaded to the asset cache first (the root layout's preload already
  // did this); in a release build it is the bundled file.
  const [videoUri, setVideoUri] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (background.kind !== 'video') return;
    let live = true;
    const asset = Asset.fromModule(background.source);
    void asset.downloadAsync().then(
      () => { if (live) setVideoUri(asset.localUri ?? asset.uri); },
      () => { if (live) setVideoUri(asset.uri); },
    );
    return () => { live = false; };
  }, [background]);
  const { currentFrame: videoFrame } = useVideo(videoUri, { looping: true, volume: 0 });
  const poster = useImage(background.kind === 'video' ? background.poster : null);
  const base = useImage(background.kind === 'layers' ? background.base : null);
  const glowImg = useImage(background.kind === 'layers' ? background.glow : null);

  const p = useSharedValue(initialState === 'open' ? 1 : 0);   // 0 = gate, 1 = open (past 1: thrown above it)
  const p0 = useSharedValue(0);
  const cxOff = useSharedValue(0);      // sideways, with the finger
  const cx0 = useSharedValue(0);
  const settled = useSharedValue(0);
  const shown = useSharedValue(0);      // open-state copy + pill
  const mode = useSharedValue(0);       // stickers: 0 idle, 1 emit, 2 leave
  const feed = useSharedValue(0);       // matter falling into the drain, for the glow

  // motion → light
  const glow = useSharedValue(0);
  const dirX = useSharedValue(0), dirY = useSharedValue(-1);
  const sloshX = useSharedValue(0), sloshY = useSharedValue(0);
  const prevCy = useSharedValue(CY0), prevCx = useSharedValue(0), prevV = useSharedValue(0);
  const fvx = useSharedValue(0), fvy = useSharedValue(0);
  const touchX = useSharedValue(0), touchY = useSharedValue(0), touchOn = useSharedValue(0);
  const windX = useSharedValue(0), windY = useSharedValue(0);

  const cy = useDerivedValue(() => interpolate(p.value, [0, 1], [CY0, CY1]));
  const cx = useDerivedValue(() => CX + cxOff.value);
  const radius = useDerivedValue(() => {
    const t = p.value;
    if (t <= 1) return R0 + (R1 - R0) * t;
    const up = (t - 1) * TRAVEL;
    return RF + (R1 - RF) * Math.exp(-up / (40 * sy));
  });
  const originY = useDerivedValue(() => CY1);
  // the glow lives in the glass: fully there at the gate and gone well before
  // the sphere has become the button, following the finger both ways
  const glowAlpha = useDerivedValue(() => interpolate(p.value, [0.04, 0.70], [1, 0], Extrapolation.CLAMP));
  // and it flares as the stickers fall into it
  const feedAlpha = useDerivedValue(() => Math.min(0.85, feed.value * 0.85));

  const releaseAt = theme.releaseAt;
  const warm = useSharedValue(0);
  useFrameCallback((info) => {
    const dt = Math.max(1, info.timeSincePreviousFrame ?? 16) / 1000;
    // the first frames land while the screen is still settling its geometry,
    // and a jump in cy there would read as a shove
    if (warm.value < 4) {
      warm.value += 1; prevCy.value = cy.value; prevCx.value = cxOff.value; return;
    }
    const orbVy = (cy.value - prevCy.value) / dt;
    const orbVx = (cxOff.value - prevCx.value) / dt;
    prevCy.value = cy.value; prevCx.value = cxOff.value;
    const orbA = (orbVy - prevV.value) / dt;
    prevV.value = orbVy;

    // ── where the sphere is decides the page ────────────────────────────────
    // Landing is decided by where it actually is, not by a spring's completion
    // callback — and it waits for the finger to lift, so a hold at the top
    // does not flash the copy in.
    const cur = p.value;
    if (cur > 0.97 && settled.value === 0 && touchOn.value === 0) {
      settled.value = 1;
      if (mode.value !== 1) mode.value = 1;
      shown.value = withTiming(1, { duration: 520, easing: Easing.bezier(0.23, 1, 0.32, 1) });
    } else if (cur < 0.80 && settled.value === 1) {
      settled.value = 0;
      shown.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
    }
    if (cur < releaseAt && mode.value === 1) mode.value = 2;
    if (cur <= 0.02 && mode.value === 2) mode.value = 0;

    // ── motion → the caustic ─────────────────────────────────────────────────
    // The light answers force, not speed: it pours in while the finger is
    // pushing the glass and floods the crown when a spring lands; in free
    // flight the sphere is dark, and it drains within a few frames.
    const mx = fvx.value + (touchOn.value > 0 ? 0 : orbVx);
    const my = orbVy + fvy.value * 0.7;
    const sp = Math.hypot(mx, my);
    let target = 0;
    if (touchOn.value > 0) {
      target = Math.min(1, sp / 430);
      if (sp > 45) {
        // The light gathers at the top of the glass. A sideways shove only
        // tilts it (~25°); it only drops to the bottom when pulled straight down.
        const tx = (mx / sp) * 0.42;
        const ty = (my / sp > 0.55 ? 1 : -1) * Math.sqrt(1 - tx * tx);
        dirX.value += (tx - dirX.value) * 0.16;
        dirY.value += (ty - dirY.value) * 0.16;
      }
    } else {
      const slowing = orbVy * orbA < 0 ? Math.abs(orbA) : 0;
      target = Math.min(1, slowing / 12000);
      if (target > 0.05) {
        dirX.value += (0 - dirX.value) * 0.2;
        dirY.value += (-1 - dirY.value) * 0.2;
      }
    }
    glow.value += (target - glow.value) * (target > glow.value ? 0.22 : 0.12);

    // the liquid inside follows the actual motion, a beat behind
    sloshX.value += (Math.max(-1, Math.min(1, mx / 430)) - sloshX.value) * 0.12;
    sloshY.value += (Math.max(-1, Math.min(1, my / 430)) - sloshY.value) * 0.12;

    const decay = Math.pow(0.02, dt);
    fvx.value *= decay; fvy.value *= decay;
    windX.value *= 0.85; windY.value *= 0.85;
  });

  const orbBox = useDerivedValue(() => {
    const R = radius.value * 1.36;
    return { x: cx.value - R, y: cy.value - R, width: R * 2, height: R * 2 };
  });
  const orbClip = useDerivedValue(() => {
    const R = radius.value;
    return Skia.RRectXY(Skia.XYWHRect(cx.value - R, cy.value - R, R * 2, R * 2), R, R);
  });
  const lens = theme.lens;
  const lensUniforms = useDerivedValue(() => {
    const R = radius.value;
    return {
      c: [cx.value, cy.value],
      r: R,
      // the small button is a thicker lens than the great dome, but a sticker
      // is only a few points across right as it's born there — too little
      // dispersion and the button looks flat, too much and the R/G/B samples
      // land on three unrelated bits of scene and the sticker disintegrates
      // into colour noise instead of reading as glass
      amount: interpolate(R, [R1, R0], [0.62, 0.42], Extrapolation.CLAMP),
      bezel: interpolate(R, [R1, R0], [0.42, 0.25], Extrapolation.CLAMP),
      disp: interpolate(R, [R1, R0 * lens.domeAt], [lens.buttonDispersion, lens.domeDispersion], Extrapolation.CLAMP),
      slosh: [sloshX.value * R * 0.10, sloshY.value * R * 0.10],
    };
  });

  const night = theme.night;
  const uniforms = useDerivedValue(() => {
    const n = Math.max(1e-4, Math.hypot(dirX.value, dirY.value));
    const R = radius.value;
    return {
      c: [cx.value, cy.value],
      r: R,
      glow: glow.value,
      dv: [dirX.value / n, dirY.value / n],
      small: interpolate(R, [R1 * 1.05, R1 * 1.7], [1, 0], Extrapolation.CLAMP),
      // the caustic belongs to the big glass; none once it is down to half size
      caus: interpolate(R, [100 * sx, 190 * sx], [0, 1], Extrapolation.CLAMP),
      night,
    };
  });

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onBegin((e) => { touchOn.value = 1; touchX.value = e.x; touchY.value = e.y; })
    .onStart(() => { p0.value = p.value; cx0.value = cxOff.value; })
    .onUpdate((e) => {
      touchX.value = e.x; touchY.value = e.y;
      fvx.value = e.velocityX; fvy.value = e.velocityY;
      windX.value = e.velocityX / 60; windY.value = e.velocityY / 60;
      const raw = p0.value - e.translationY / TRAVEL;
      p.value = raw < 0 ? raw * 0.25 : raw > 1 ? 1 + (raw - 1) * 0.25 : raw;
      // sideways it follows the finger too, on a soft leash
      const lim = 150 * sx;
      cxOff.value = lim * Math.tanh((cx0.value + e.translationX) / lim);
    })
    .onEnd((e) => {
      const vy = -e.velocityY / TRAVEL;
      const target = (p.value + vy * 0.18) > 0.5 ? 1 : 0;
      p.value = withSpring(target, { ...SPRING, velocity: vy });
      cxOff.value = withSpring(0, { ...SPRING, velocity: e.velocityX });
    })
    .onFinalize(() => { touchOn.value = 0; });

  // ── copy: fade + defocus, driven by where the drag is ────────────────────
  const gateFade = useSharedValue(1), gateSoft = useSharedValue(0);
  const bodyFade = useSharedValue(0), bodySoft = useSharedValue(14);
  const thirdFade = useSharedValue(0), thirdSoft = useSharedValue(14);
  const wipe = useSharedValue(1);
  // the hint goes soft and out within the first push, and while the glass is
  // being shoved it is carried a little with the liquid
  const hintFade = useDerivedValue(() => interpolate(p.value, [0.06, 0.30], [1, 0], Extrapolation.CLAMP));
  const hintSoft = useDerivedValue(() => interpolate(p.value, [0.04, 0.28], [0, 12], Extrapolation.CLAMP));
  const hintShift = useAnimatedStyle(() => ({
    transform: [
      { translateX: sloshX.value * radius.value * 0.04 },
      { translateY: sloshY.value * radius.value * 0.04 },
    ],
  }));

  useAnimatedReaction(() => p.value, (cur) => {
    gateFade.value = interpolate(cur, [0.08, 0.62], [1, 0], Extrapolation.CLAMP);
    gateSoft.value = interpolate(cur, [0.05, 0.60], [0, 13], Extrapolation.CLAMP);
  });
  useAnimatedReaction(() => shown.value, (cur) => {
    bodyFade.value = cur;
    bodySoft.value = (1 - cur) * 14;
  });

  // ── the rotating third line ───────────────────────────────────────────────
  const phrases = copy.phrases;
  const [phrase, setPhrase] = React.useState(0);
  const nextPhrase = React.useCallback(() => setPhrase((i) => (i + 1) % phrases.length), [phrases.length]);

  // it only runs while the open state is up
  const [live, setLive] = React.useState(false);
  useAnimatedReaction(() => shown.value > 0.5, (v, prev) => {
    if (v !== prev) scheduleOnRN(setLive, v);
  });

  React.useEffect(() => {
    if (!live) { thirdFade.value = 0; return; }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const reveal = () => {
      thirdSoft.value = 0;
      thirdFade.value = 1;
      if (reduceMotion) {
        wipe.value = 1;
      } else {
        wipe.value = 0;
        // near-linear: the front travels at a steady rate, and an eased curve
        // dumps the whole sweep into a couple of frames
        wipe.value = withTiming(1, { duration: IN_MS, easing: Easing.bezier(0.16, 0.42, 0.40, 1) });
      }
      timer = setTimeout(cycle, HOLD_MS + IN_MS);
    };
    const cycle = () => {
      if (!alive) return;
      // out: it goes soft where it stands, no travel — the blur leads, the
      // opacity follows
      thirdSoft.value = withTiming(19, { duration: OUT_MS, easing: Easing.out(Easing.quad) });
      thirdFade.value = withTiming(0, { duration: OUT_MS, easing: Easing.in(Easing.quad) });
      timer = setTimeout(() => {
        if (!alive) return;
        nextPhrase();
        timer = setTimeout(() => { if (alive) reveal(); }, GAP_MS);
      }, OUT_MS);
    };

    reveal();
    return () => { alive = false; clearTimeout(timer); };
  }, [live, nextPhrase, reduceMotion, thirdFade, thirdSoft, wipe]);

  // ── styles ────────────────────────────────────────────────────────────────
  const plusStyle = useAnimatedStyle(() => ({
    position: 'absolute', left: CX - 30, top: -30, width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateX: cxOff.value }, { translateY: cy.value }],
    // the + surfaces over the last stretch of the shrink
    opacity: interpolate(radius.value, [R1 * 1.2, R1 * 1.7], [1, 0], Extrapolation.CLAMP),
  }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    backgroundColor: interpolateColor(shown.value, [0, 1], [colors.pillFrom, colors.pillTo]),
    transform: [{ translateY: (1 - shown.value) * 10 * sy }],
  }));
  // the pill is inert and out of the accessibility tree until it has appeared
  const [pillLive, setPillLive] = React.useState(initialState === 'open');
  useAnimatedReaction(() => shown.value > 0.9, (v, prev) => {
    if (v !== prev) scheduleOnRN(setPillLive, v);
  });

  const onPress = React.useCallback(() => {
    if (onActionPress) onActionPress(`${theme.id}.lets-go`);
    else onPrimaryPress?.();
  }, [onActionPress, onPrimaryPress, theme.id]);

  const bodyText = [st.body, { color: colors.ink, fontSize: 32 * sx, lineHeight: 38 * sx, letterSpacing: -0.7 * sx }];

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityHint="Swipe up to open the screen, swipe down to close it"
        accessibilityLabel={copy.hint}
        style={{ flex: 1, backgroundColor: colors.page }}
      >
        <StatusBar style={theme.statusBar} />
        {/* one canvas: the scene, the stickers, the lens that bends them both, the glass */}
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          {background.kind === 'video' && poster ? (
            <SkImage fit="cover" height={height} image={poster} width={width} x={0} y={0} />
          ) : null}
          {background.kind === 'video' ? (
            <SkImage fit="cover" height={height} image={videoFrame} width={width} x={0} y={0} />
          ) : null}
          {background.kind === 'layers' && base ? (
            <SkImage fit="cover" height={height} image={base} width={width} x={0} y={0} />
          ) : null}
          {background.kind === 'layers' && glowImg ? (
            <>
              <SkImage blendMode="plus" fit="cover" height={height} image={glowImg} opacity={glowAlpha}
                width={width} x={0} y={0} />
              <SkImage blendMode="plus" fit="cover" height={height} image={glowImg} opacity={feedAlpha}
                width={width} x={0} y={0} />
            </>
          ) : null}
          <OrbField feed={feed} height={height} mode={mode} originX={CX} originY={originY}
            returnMode={theme.returnMode} stickers={theme.stickers} touchOn={touchOn}
            touchX={touchX} touchY={touchY} width={width} windX={windX} windY={windY} />
          <Group clip={orbClip}>
            <BackdropFilter filter={<RuntimeShader source={lensEffect} uniforms={lensUniforms} />} />
          </Group>
          <Rect rect={orbBox}>
            <Shader source={glassEffect} uniforms={uniforms} />
          </Rect>
        </Canvas>
        <Animated.View pointerEvents="none" style={plusStyle}>
          <Text style={[st.plus, { color: colors.plus }]}>+</Text>
        </Animated.View>

        {/* gate copy */}
        <Soft line={{ fade: gateFade, soften: gateSoft }}
          style={[st.block, { top: height * 0.4368 - 115 * sx, height: 230 * sx }]} tint={theme.blurTint}>
          <Image contentFit="contain" source={theme.wordmark} style={{ width: 230 * sx, height: 230 * sx }} />
        </Soft>

        <Soft line={{ fade: hintFade, soften: hintSoft }}
          style={[st.block, { top: height * 0.8853, height: 22 * sx }, hintShift as unknown as ViewStyle]}
          tint={theme.blurTint}>
          <Text style={[st.hint, { color: colors.hint, fontSize: 15 * sx, lineHeight: 20 * sx }]}>{copy.hint}</Text>
        </Soft>

        {/* open-state copy */}
        <Soft line={{ fade: bodyFade, soften: bodySoft }}
          style={[st.block, { top: height * 0.6163, height: 76 * sx }]} tint={theme.blurTint}>
          <Text style={bodyText}>{copy.headline}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View>
              <Text style={bodyText}>{copy.struck}</Text>
              <View style={[st.strike, {
                backgroundColor: colors.ink,
                top: 38 * sx * 0.5 + 32 * sx * 0.36 - 32 * sx * 0.234 - 32 * sx * 0.052,
                height: 32 * sx * 0.104,
              }]} />
            </View>
            <Text style={bodyText}>{' '}{copy.kept}</Text>
          </View>
        </Soft>
        <WipeLine height={38 * sx} line={{ fade: thirdFade, soften: thirdSoft }}
          style={{ position: 'absolute', left: 0, top: height * 0.7032 }}
          text={phrases[phrase]} textStyle={bodyText} tint={theme.blurTint} width={width} wipe={wipe} />

        <Animated.View
          pointerEvents={pillLive ? 'auto' : 'none'}
          style={[st.pillWrap, { top: height * 0.8848, left: 50 * sx, right: 50 * sx, height: 58.7 * sy }, pillStyle]}
        >
          <Pressable
            accessibilityLabel={copy.cta}
            accessibilityRole="button"
            accessible={pillLive}
            onPress={onPress}
            style={st.pill}
          >
            <Text style={[st.pillText, { color: colors.pillText }]}>{copy.cta}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const st = StyleSheet.create({
  block: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hint: { fontWeight: '500', textAlign: 'center', letterSpacing: -0.1 },
  body: { fontWeight: '500', textAlign: 'center' },
  strike: { position: 'absolute', left: 0, right: 0 },
  plus: { fontSize: 38, fontWeight: '400', marginTop: -3 },
  pillWrap: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  pill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
});
