import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import {
  daysUntil,
  formatExpiryDisplay,
  getEarliestLot,
  getExpiringSoon,
  getUrgency,
} from '@/lib/expiry';
import { getCards } from '@/lib/storage';
import type { Card } from '@/lib/types';

export default function HomeScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);
  const greeting = useGreeting();

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
      return () => { active = false; };
    }, []),
  );

  const totalMiles = cards.reduce((acc, c) => acc + c.miles, 0);
  const expiringSoon = getExpiringSoon(cards, 30);

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
              {cards.length === 0 ? '아직 등록된 카드가 없어요' : `${cards.length}개 카드 합산`}
            </Text>
          </View>
        </View>

        {/* 만료 임박 */}
        {expiringSoon.length > 0 && (
          <>
            <View style={styles.alertHeader}>
              <View style={styles.warnDot} />
              <Text style={styles.alertTitle}>이번 달 만료 임박</Text>
              <Text style={styles.alertCount}>{expiringSoon.length}건</Text>
            </View>
            {expiringSoon.map((entry, i) => (
              <Pressable
                key={`expire-${entry.card.id}-${entry.lot.id}-${i}`}
                style={styles.expireCard}
                onPress={() => router.push(`/card/${entry.card.id}`)}
                android_ripple={{ color: Palette.surface2 }}>
                <View style={[styles.expireBar, { backgroundColor: entry.card.color }]} />
                <View style={styles.expireBody}>
                  <Text style={styles.expireAirline}>
                    {entry.card.airline} · {entry.lot.miles.toLocaleString('ko-KR')}mi
                  </Text>
                  <Text style={styles.expireSub}>
                    D-{entry.days} · {formatExpiryDisplay(entry.lot.date)} 만료
                  </Text>
                </View>
                <Text style={styles.expireArrow}>›</Text>
              </Pressable>
            ))}
          </>
        )}

        {/* 카드 섹션 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>내 카드</Text>
          <Pressable hitSlop={10} onPress={() => router.push('/card-add')}>
            <Text style={styles.sectionAction}>+ 추가</Text>
          </Pressable>
        </View>

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
            <Text style={styles.emptyCtaBody}>항공사와 보유 마일만 입력하면 시작할 수 있어요.</Text>
          </Pressable>
        ) : (
          cards.map((card) => {
            const earliest = getEarliestLot(card);
            const urgency = getUrgency(earliest?.date);
            const urgencyDays = earliest ? daysUntil(earliest.date) : null;
            const lotCount = card.lots?.length ?? 0;
            return (
              <Pressable
                key={card.id}
                style={[styles.card, { borderLeftColor: card.color }]}
                onPress={() => router.push(`/card/${card.id}`)}
                android_ripple={{ color: Palette.surface2 }}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardAirline}>{card.airline}</Text>
                  <Text style={styles.cardMiles}>{card.miles.toLocaleString('ko-KR')}mi</Text>
                </View>
                {earliest && (
                  <View style={styles.cardExpiryRow}>
                    {urgency === 'critical' && <View style={styles.urgentDot} />}
                    {urgency === 'soon' && <View style={[styles.urgentDot, { backgroundColor: Palette.info }]} />}
                    <Text
                      style={[
                        styles.cardSub,
                        urgency === 'critical' && { color: Palette.warn },
                      ]}>
                      {urgencyDays !== null && urgencyDays >= 0
                        ? `D-${urgencyDays}`
                        : '이미 만료'}
                      {' · '}
                      {formatExpiryDisplay(earliest.date)} ·{' '}
                      {earliest.miles.toLocaleString('ko-KR')}mi
                      {lotCount > 1 && ` (외 ${lotCount - 1}건)`}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}

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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: { ...Type.caption, color: Palette.textDim, marginBottom: 2 },
  brand: { ...Type.h2, color: Palette.text },
  bellBtn: {
    width: 42, height: 42,
    borderRadius: Radius.full,
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
  heroFooter: { marginTop: Spacing.md },
  heroFooterText: { ...Type.caption, color: Palette.textDim },

  alertHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warnDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.warn },
  alertTitle: { ...Type.h3, color: Palette.text, flex: 1 },
  alertCount: {
    ...Type.captionSmall, color: Palette.warn, fontWeight: '700',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12,
  },
  expireCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  expireBar: { width: 4, alignSelf: 'stretch' },
  expireBody: { flex: 1, padding: Spacing.md + 2 },
  expireAirline: { ...Type.bodyBold, color: Palette.text },
  expireSub: { ...Type.captionSmall, color: Palette.warn, marginTop: 3, fontWeight: '600' },
  expireArrow: { fontSize: 24, color: Palette.textMute, fontWeight: '300', paddingRight: Spacing.md },

  sectionTitle: { ...Type.h3, color: Palette.text, marginBottom: Spacing.md },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionAction: { ...Type.caption, color: Palette.accent, fontWeight: '600' },

  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Palette.border,
    borderLeftWidth: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAirline: { ...Type.bodyBold, color: Palette.text },
  cardMiles: {
    fontSize: 18, color: Palette.text, fontWeight: '800', letterSpacing: -0.3,
  },
  cardExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.warn },
  cardSub: { ...Type.captionSmall, color: Palette.textMute },

  emptyCta: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl + 4,
    borderWidth: 1, borderColor: Palette.border, borderStyle: 'dashed',
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
    borderWidth: 1, borderColor: Palette.border,
  },
  emptyText: { ...Type.caption, color: Palette.textMute },

  ctaButton: {
    marginTop: Spacing.xl,
    backgroundColor: Palette.accent,
    borderRadius: Radius.md,
    padding: Spacing.md + 4,
    alignItems: 'center',
  },
  ctaText: { color: '#1a1100', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
});
