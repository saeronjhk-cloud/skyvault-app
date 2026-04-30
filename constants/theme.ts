/**
 * SkyVault 디자인 시스템
 * 다크 네이비 + 골드 액센트 (시뮬레이터 동일)
 */

import { Platform } from 'react-native';

// ───── 팔레트 ─────
export const Palette = {
  bg: '#0a1628',
  bg2: '#07101e',
  surface: '#142844',
  surface2: '#1d3759',
  border: '#25405f',
  borderStrong: '#37547a',
  text: '#f5f7fa',
  textDim: '#93a4b8',
  textMute: '#6b7d92',
  accent: '#f5b300',
  accent2: '#ffc940',
  accentWarm: '#ff8a3d',
  ke: '#2f8fc4',
  oz: '#e63946',
  success: '#4ade80',
  warn: '#fbbf24',
  danger: '#ef4444',
  info: '#60a5fa',
} as const;

// ───── 간격 / 모서리 ─────
export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 22, full: 9999,
} as const;

// ───── 타이포그래피 ─────
export const Type = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  captionSmall: { fontSize: 12, fontWeight: '500' as const },
  num: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.8 },
  numLarge: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1 },
} as const;

// ───── 기존 Expo 템플릿 호환 (Colors export) ─────
export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.bg,
    tint: Palette.accent,
    icon: Palette.textDim,
    tabIconDefault: Palette.textMute,
    tabIconSelected: Palette.accent,
  },
  dark: {
    text: Palette.text,
    background: Palette.bg,
    tint: Palette.accent,
    icon: Palette.textDim,
    tabIconDefault: Palette.textMute,
    tabIconSelected: Palette.accent,
  },
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "Pretendard, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', Pretendard, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",
  },
});
