import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>여행 플래너</Text>
          <Text style={styles.title}>어디로 가시나요?</Text>
          <Text style={styles.sub}>
            출발지·도착지·날짜만 입력하면 자사·동맹·다구간 발권 시나리오를{'\n'}한 번에 비교해드릴게요.
          </Text>
        </View>

        {/* Placeholder card */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🛠</Text>
          <Text style={styles.placeholderTitle}>준비 중입니다</Text>
          <Text style={styles.placeholderBody}>
            권역 기반 차감표 데이터 + 시나리오 엔진 작업 중. 다음 스프린트에서 만나요.
          </Text>
        </View>

        {/* 곧 추가될 기능 */}
        <Text style={styles.sectionTitle}>곧 추가될 기능</Text>
        <View style={styles.featureList}>
          <FeatureRow icon="✈" title="자사 발권 시나리오" desc="대한항공 / 아시아나 권역 기반 추천" />
          <FeatureRow icon="🤝" title="동맹사 발권" desc="스카이팀 / 스타얼라이언스 / 원월드" />
          <FeatureRow icon="🌍" title="다구간 발권" desc="2~3개 도시 묶어 최적 경로 탐색" />
          <FeatureRow icon="👨‍👩‍👧" title="가족 마일 합산" desc="가족 구성원 마일을 한 번에 묶어 계산" />
          <FeatureRow icon="💸" title="유류할증료 반영" desc="실제 결제액 기준 비교" />
          <FeatureRow icon="📅" title="평수기 / 성수기 토글" desc="시기별 차감 마일 차이 즉시 반영" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIconBox}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  header: { marginBottom: Spacing.xl },
  eyebrow: {
    ...Type.captionSmall,
    color: Palette.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { ...Type.h1, color: Palette.text, marginBottom: Spacing.sm + 2 },
  sub: { ...Type.body, color: Palette.textDim, lineHeight: 22 },

  placeholder: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  placeholderEmoji: { fontSize: 32, marginBottom: 8 },
  placeholderTitle: { ...Type.h3, color: Palette.text, marginBottom: 6 },
  placeholderBody: { ...Type.caption, color: Palette.textDim, lineHeight: 20 },

  sectionTitle: { ...Type.h3, color: Palette.text, marginBottom: Spacing.md },
  featureList: { gap: Spacing.sm },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md + 2,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Palette.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 18 },
  featureTitle: { ...Type.bodyBold, color: Palette.text },
  featureDesc: { ...Type.captionSmall, color: Palette.textMute, marginTop: 2 },
});
