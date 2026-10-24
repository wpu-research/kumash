import { Italiana_400Regular, useFonts } from '@expo-google-fonts/italiana';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { SessionProvider, useSession } from '@/lib/session';
import { useColors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  );
}

function Root() {
  const scheme = useColorScheme();
  const c = useColors();
  const { ready, token } = useSession();
  const [fontsLoaded] = useFonts({ Italiana_400Regular });

  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync();
  }, [ready, fontsLoaded]);
  if (!ready || !fontsLoaded) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: c.paper, card: c.paper, text: c.ink, primary: c.accent, border: c.line } };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
        <Stack.Protected guard={!token}>
          <Stack.Screen name="giris" />
        </Stack.Protected>
        <Stack.Protected guard={!!token} redirectTo="/giris">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cekim/yeni" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="cekim/[id]" />
          <Stack.Screen name="urun/[id]" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
