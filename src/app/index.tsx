import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COOKBOOK_METADATA } from '@/liquid-glass';

const BLURB: Record<string, string> = {
  sky: 'Daylight. A looping cloud sky, travel stickers, a grey-shaded glass. The plume falls away.',
  astro: 'Night. A still starfield with a horizon glow, app stickers, a blue-white glass. The plume is drawn into a vortex.',
};

/** The gallery home: one screen, two cookbooks. */
export default function IndexRoute() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LIQUID GLASS SCREENS</Text>
        <Text style={styles.title}>Two skies, one sphere.</Text>
        <Text style={styles.lede}>
          A swipe-up glass dome that shrinks into a button, refracts the scene behind it, and lets a plume of stickers out. Pick a cookbook.
        </Text>
      </View>
      <View style={styles.list}>
        {COOKBOOK_METADATA.map((cookbook) => (
          <Link asChild href={`/${cookbook.id}`} key={cookbook.id}>
            <Pressable
              accessibilityLabel={`Open cookbook ${cookbook.number}, ${cookbook.displayName}`}
              accessibilityRole="button"
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              testID={`cookbook-${cookbook.id}`}
            >
              <View style={styles.cardHead}>
                <Text style={styles.cardIndex}>Cookbook {cookbook.number}</Text>
                <Text style={styles.cardTitle}>{cookbook.displayName}</Text>
              </View>
              <Text style={styles.cardBlurb}>{BLURB[cookbook.id]}</Text>
              <Text style={styles.cardMeta}>
                {cookbook.background === 'video' ? 'video backdrop' : 'two-layer still'} · {cookbook.returnMode} return
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
      <Text style={styles.footer}>An open-source creation by Appllama</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#04060C', paddingHorizontal: 24 },
  header: { gap: 10 },
  eyebrow: { color: 'rgba(226,232,246,0.55)', fontSize: 12, fontWeight: '600', letterSpacing: 1.6 },
  title: { color: '#F4F6FC', fontSize: 34, fontWeight: '600', letterSpacing: -0.8, lineHeight: 40 },
  lede: { color: 'rgba(226,232,246,0.72)', fontSize: 16, lineHeight: 23, marginTop: 2 },
  list: { gap: 14, marginTop: 40 },
  card: {
    backgroundColor: '#0D1119',
    borderColor: 'rgba(226,232,246,0.10)',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 20,
  },
  cardPressed: { transform: [{ scale: 0.97 }] },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  cardIndex: { color: '#62D3FF', fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  cardTitle: { color: '#F4F6FC', fontSize: 22, fontWeight: '600', letterSpacing: -0.4 },
  cardBlurb: { color: 'rgba(226,232,246,0.72)', fontSize: 15, lineHeight: 21 },
  cardMeta: { color: 'rgba(226,232,246,0.45)', fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 2 },
  footer: { color: 'rgba(226,232,246,0.35)', fontSize: 12, marginTop: 'auto', textAlign: 'center' },
});
