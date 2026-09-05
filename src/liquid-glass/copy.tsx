import { BlurView } from 'expo-blur';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * The page's copy. Two motions:
 *
 * - out: the line goes soft where it stands — a rising blur and a fade, no
 *   travel, ~400 ms.
 * - in: a reveal front sweeps left → right over ~500 ms. Ahead of the front
 *   the glyphs are already laid out but out of focus; behind it they are
 *   sharp.
 *
 * The blur has to be positional for the second one. A masked sharp/blurred
 * pair does not work (the mask never sees Reanimated's transform) and per-word
 * `onLayout` arrives after the sweep has run, so each word's place in the line
 * is worked out from its character span — stable, needs no layout pass, and
 * in a single font at a single size tracks the real widths closely enough that
 * the ramp covers the error.
 */

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

const RAMP = 0.34;   // width of the out-of-focus front, as a fraction of the line
const SOFT = 26;     // how far out of focus a word is before the front reaches it

export type Line = { fade: SharedValue<number>; soften: SharedValue<number> };
export type CopyTint = 'light' | 'dark';

/** A blur that is genuinely gone at zero: expo-blur still tints its backdrop
 *  at intensity 0, which over the scene reads as a pale slab behind the words. */
function Defocus({ amount, tint }: { amount: SharedValue<number>; tint: CopyTint }) {
  const props = useAnimatedProps(() => ({ intensity: amount.value }));
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, amount.value / 2.5) }));
  return <AnimatedBlur animatedProps={props} style={[StyleSheet.absoluteFill, style]} tint={tint} />;
}

/** A block that fades and goes out of focus without moving. */
export function Soft({
  line,
  style,
  tint,
  children,
}: {
  line: Line;
  style?: StyleProp<ViewStyle>;
  tint: CopyTint;
  children: React.ReactNode;
}) {
  const a = useAnimatedStyle(() => ({ opacity: line.fade.value }));
  return (
    <Animated.View pointerEvents="none" style={[style, a]}>
      {children}
      <Defocus amount={line.soften} tint={tint} />
    </Animated.View>
  );
}

export function WipeLine({
  text,
  textStyle,
  width,
  height,
  line,
  wipe,
  style,
  tint,
}: {
  text: string;
  textStyle: StyleProp<TextStyle>;
  width: number;
  height: number;
  line: Line;
  wipe: SharedValue<number>;    // 0 → 1
  style?: StyleProp<ViewStyle>;
  tint: CopyTint;
}) {
  // Each word gets the midpoint of its own character span, 0 at the start of
  // the line and 1 at the end.
  const parts = React.useMemo(() => {
    const words = text.split(' ');
    const total = text.length;
    const out: { word: string; at: number }[] = [];
    for (let i = 0, start = 0; i < words.length; i++) {
      const w = words[i];
      out.push({ word: i ? ` ${w}` : w, at: (start + w.length * 0.5) / total });
      start += w.length + 1;           // the space that follows it
    }
    return out;
  }, [text]);

  const fade = useAnimatedStyle(() => ({ opacity: line.fade.value }));

  return (
    <Animated.View pointerEvents="none" style={[{ width, height }, style, fade]}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', width }}>
        {parts.map((p, i) => (
          <Word
            key={`${text}:${i}`}
            at={p.at}
            line={line}
            text={p.word}
            textStyle={textStyle}
            tint={tint}
            wipe={wipe}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function Word({
  text,
  at,
  textStyle,
  line,
  wipe,
  tint,
}: {
  text: string;
  at: number;
  textStyle: StyleProp<TextStyle>;
  line: Line;
  wipe: SharedValue<number>;
  tint: CopyTint;
}) {
  // 0 while the front is still short of this word, 1 once it has gone past
  const focus = useAnimatedStyle(() => {
    const front = -RAMP + wipe.value * (1 + RAMP * 2);
    const t = Math.min(1, Math.max(0, (front - at) / RAMP + 0.5));
    return { opacity: t };
  });
  const amount = useAnimatedProps(() => {
    const front = -RAMP + wipe.value * (1 + RAMP * 2);
    const t = Math.min(1, Math.max(0, (front - at) / RAMP + 0.5));
    return { intensity: (1 - t) * SOFT + line.soften.value };
  });
  const veil = useAnimatedStyle(() => {
    const front = -RAMP + wipe.value * (1 + RAMP * 2);
    const t = Math.min(1, Math.max(0, (front - at) / RAMP + 0.5));
    return { opacity: Math.min(1, ((1 - t) * SOFT + line.soften.value) / 2.5) };
  });

  return (
    <Animated.View style={focus}>
      <Text style={textStyle}>{text}</Text>
      <AnimatedBlur animatedProps={amount} style={[StyleSheet.absoluteFill, veil]} tint={tint} />
    </Animated.View>
  );
}
