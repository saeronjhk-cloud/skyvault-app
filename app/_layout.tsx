import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Palette } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const SkyVaultTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.bg,
    card: Palette.surface,
    text: Palette.text,
    border: Palette.border,
    primary: Palette.accent,
    notification: Palette.accent,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={SkyVaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Palette.bg },
          headerTintColor: Palette.text,
          contentStyle: { backgroundColor: Palette.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: '' }} />
      </Stack>
      <StatusBar style="light" backgroundColor={Palette.bg} />
    </ThemeProvider>
  );
}
