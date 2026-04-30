import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';

// ───── 모의 데이터 (추후 Realm/Supabase에서 로드) ─────
const MOCK_CARDS = [
  { airline: '대한항공 SKYPASS', miles: 120000, nextExpiry: { date: '2027.06', miles: 5000 }, color: Palette.ke },
  { airline: '아시아나 클럽',    miles: 67500,  nextExpiry: { date: '2027.12', miles: 12000 }, color: Palette.oz },
];

const TOTAL_MILES = MOCK_CARDS.reduce((acc, c) => acc + c.miles, 0);
const RECENT_GAIN = 2300;

export default function HomeScreen() {
  const greeting = useGreeting();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.brand}>SkyVault</Text>
          </View>
          <Pressable style={styles.bellBtn} android_ripple={{ color: Palette.surface2 }}>
            <Text style={styles.bell}>🔔</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>총 보유 마일</Text>
          <Text style={styles.heroValue}>
            {TOTAL_MILES.toLocaleString('ko-KR')}
            <Text style={styles.heroUnit}>  mi</Text>
          </Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterIcon}>↑</Text>
            <Text style={styles.heroFooterText}>최근 7일간 +{RECENT_GAIN.toLocaleString('ko-KR')}mi 적립</Text>
          </View>
        </View>

        {/* Recommend */}
        <Text style={styles.sectionTitle}>이번 주 추천</Text>
        <Pressable style={styles.recommendCard} android_ripple={{ color: Palette.surface2 }}>
          <View style={styles.warnDot} />
          <View style={styles.recBody}>
            <Text style={styles.recTitle}>대한항공 5,000mi 만료 임박</Text>
            <Text style={styles.recSub}>D-23 · 비항공권 사용처로 살릴 수 있어요</Text>
          </View>
          <Text style={styles.recArrow}>›</Text>
        </Pressable>

        {/* Cards */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>내 카드</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.sectionAction}>+ 추가</Text>
          </Pressable>
        </View>

        {MOCK_CARDS.map((card) => (
          <Pressable
            key={card.airline}
            style={[styles.card, { borderLeftColor: card.color }]}
            android_ripple={{ color: Palette.surface2 }}>
            <View style={styles.cardRow}>
              <Text style={styles.cardAirline}>{card.airline}</Text>
              <Text style={styles.cardMiles}>{card.miles.toLocaleString('ko-KR')}mi</Text>
            </View>
            <Text style={styles.cardSub}>
              다음 만료 {card.nextExpiry.date} · {card.nextExpiry.miles.toLocaleString('ko-KR')}mi
            </Text>
          </Pressable>
        ))}

        {/* CTA */}
        <Pressable style={styles.ctaButton} android_ripple={{ color: Palette.accentWarm }}>
          <Text style={styles.ctaText}>여행 플래너 열기</Text>
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function useGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '늦은 밤이네요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오늘 하루도 화이팅';
  return '수고하셨어요';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: { ...Type.caption, color: Palette.textDim, marginBottom: 2 },
  brand: { ...Type.h2, color: Palette.text },
  bellBtn: {
    width: 42, height: 42, borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.border,
  },
  bell: { fontSize: 18 },

  hero: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Palette.border,
  },
  heroLabel: { ...Type.caption, color: Palette.textDim, marginBottom: 8 },
  heroValue: { ...Type.numLarge, color: Palette.text },
  heroUnit: { fontSize: 18, color: Palette.textDim, fontWeight: '500' },
  heroFooter: {
    marginTop: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroFooterIcon: { color: Palette.success, fontSize: 14, fontWeight: '700' },
  heroFooterText: { ...Type.caption, color: Palette.success },

  sectionTitle: { ...Type.h3, color: Palette.text, marginBottom: Spacing.md },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionAction: { ...Type.caption, color: Palette.accent, fontWeight: '600' },

  recommendCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warnDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.warn },
  recBody: { flex: 1 },
  recTitle: { ...Type.bodyBold, color: Palette.text },
  recSub: { ...Type.captionSmall, color: Palette.textDim, marginTop: 3 },
  recArrow: { fontSize: 24, color: Palette.textMute, fontWeight: '300' },

  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Palette.border,
    borderLeftWidth: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAirline: { ...Type.bodyBold, color: Palette.text },
  cardMiles: { fontSize: 18, color: Palette.text, fontWeight: '800', letterSpacing: -0.3 },
  cardSub: { ...Type.captionSmall, color: Palette.textMute, marginTop: 4 },

  ctaButton: {
    marginTop: Spacing.xl,
    backgroundColor: Palette.accent,
    borderRadius: Radius.md,
    padding: Spacing.md + 4,
    alignItems: 'center',
  },
  ctaText: {
    color: '#1a1100',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
