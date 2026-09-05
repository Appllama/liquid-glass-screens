import { Asset } from 'expo-asset';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LIQUID_GLASS_ASSET_MODULES } from '@/liquid-glass/assets';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 200, fade: true });

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const finish = () => {
      if (mounted) setAssetsReady(true);
    };
    void Asset.loadAsync([...LIQUID_GLASS_ASSET_MODULES]).then(finish, finish);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (assetsReady) void SplashScreen.hideAsync();
  }, [assetsReady]);

  if (!assetsReady) {
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: styles.content }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="[cookbook]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#04060C' },
  root: { flex: 1 },
  content: { backgroundColor: '#04060C' },
});
