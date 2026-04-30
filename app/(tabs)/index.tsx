import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { getCards } from '@/lib/storage';
import type { Card } from '@/lib/types';

export default function HomeScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);
  const greeting = useGreeting();

  // 홈 화면이 포커스될 때마다 카드 다시 읽음 (카드 추가 후 돌아왔을 때 자동 반영)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const data = await getCards();
        if (active) {
          setCards(data);
          setLoaded(true);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const totalMiles = cards.reduce((acc, c) => acc + c.miles, 0);

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
            {totalMiles.toLocaleString('ko-KR')}
            <Text style={styles.heroUnit}>  mi</Text>
          </Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>
              {cards.length === 0
                ? '아직 등록된 카드가 없어요'
                : `${cards.length}개 카드 합산`}
            </Text>
          </View>
        </View>

        {/* 카드 섹션 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>내 카드</Text>
          <Pressable hitSlop={10} onPress={() => router.push('/card-add')}>
            <Text style={styles.sectionAction}>+ 추가</Text>
          </Pressable>
        </View>

        {/* 카드 목록 또는 빈 상태 */}
        {!loaded ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>불러오는 중...</Text>
          </View>
        ) : cards.length === 0 ? (
          <Pressable
            style={styles.emptyCta}
            onPress={() => router.push('/card-add')}
            android_ripple={{ color: Palette.surface2 }}>
            <Text style={styles.emptyCtaEmoji}>✈</Text>
            <Text style={styles.emptyCtaTitle}>첫 카드를 추가해보세요</Text>
            <Text style={styles.emptyCtaBody}>
              항공사와 보유 마일만 입력하면 시작할 수 있어요.
            </Text>
          </Pressable>
        ) : (
          cards.map((card) => (
            <Pressable
              key={card.id}
              style={[styles.card, { borderLeftColor: card.color }]}
              android_ripple={{ color: Palette.surface2 }}>
              <View style={styles.cardRow}>
                <Text style={styles.cardAirline}>{card.airline}</Text>
                <Text style={styles.cardMiles}>
                  {card.miles.toLocaleString('ko-KR')}mi
                </Text>
              </View>
              {card.nextExpiry && (
                <Text style={styles.cardSub}>
                  다음 만료 {card.nextExpiry.date} ·{' '}
                  {card.nextExpiry.miles.toLocaleString('ko-KR')}mi
                </Text>
              )}
            </Pressable>
          ))
        )}

        {/* CTA */}
        {cards.length > 0 && (
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/explore')}
            android_ripple={{ color: Palette.accentWarm }}>
            <Text style={styles.ctaText}>여행 플래너 열기</Text>
          </Pressable>
        )}

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
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  bell: { fontSize: 18 },

  hero: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  heroLabel: { ...Type.caption, color: Palette.textDim, marginBottom: 8 },
  heroValue: { ...Type.numLarge, color: Palette.text },
  heroUnit: { fontSize: 18, color: Palette.textDim, fontWeight: '500' },
  heroFooter: { marginTop: Spacing.md },
  heroFooterText: { ...Type.caption, color: Palette.textDim },

  sectionTitle: { ...Type.h3, color: Palette.text, marginBottom: Spacing.md },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionAction: { ...Type.caption, color: Palette.accent, fontWeight: '600' },

  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    borderLeftWidth: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAirline: { ...Type.bodyBold, color: Palette.text },
  cardMiles: {
    fontSize: 18,
    color: Palette.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSub: { ...Type.captionSmall, color: Palette.textMute, marginTop: 4 },

  // 빈 상태 CTA
  emptyCta: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl + 4,
    borderWidth: 1,
    borderColor: Palette.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyCtaEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  emptyCtaTitle: { ...Type.h3, color: Palette.text, marginBottom: 4 },
  emptyCtaBody: { ...Type.caption, color: Palette.textDim, textAlign: 'center' },

  emptyCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyText: { ...Type.caption, color: Palette.textMute },

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
