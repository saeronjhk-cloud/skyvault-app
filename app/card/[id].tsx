import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { parseExpiryDate } from '@/lib/expiry';
import { deleteCard, genId, getCards, updateCard } from '@/lib/storage';
import type { Card, Lot } from '@/lib/types';

type LotDraft = { id: string; date: string; milesInput: string };

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [airline, setAirline] = useState('');
  const [milesInput, setMilesInput] = useState('');
  const [lotDrafts, setLotDrafts] = useState<LotDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const cards = await getCards();
      const found = cards.find((c) => c.id === id);
      if (!active) return;
      if (found) {
        setCard(found);
        setAirline(found.airline);
        setMilesInput(found.miles.toString());
        setLotDrafts(
          (found.lots || []).map((l) => ({
            id: l.id,
            date: l.date,
            milesInput: l.miles.toString(),
          })),
        );
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  const milesFormatted = useMemo(() => {
    const num = parseInt(milesInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('ko-KR');
  }, [milesInput]);

  const updateLot = (lotId: string, patch: Partial<LotDraft>) => {
    setLotDrafts((prev) => prev.map((l) => (l.id === lotId ? { ...l, ...patch } : l)));
  };
  const removeLot = (lotId: string) => {
    setLotDrafts((prev) => prev.filter((l) => l.id !== lotId));
  };
  const addLot = () => {
    setLotDrafts((prev) => [...prev, { id: genId(), date: '', milesInput: '' }]);
  };

  const onSave = async () => {
    if (!card) return;
    const miles = parseInt(milesInput.replace(/[^0-9]/g, ''), 10);
    if (!airline.trim()) { Alert.alert('항공사 이름을 입력해주세요'); return; }
    if (isNaN(miles) || miles < 0) { Alert.alert('올바른 마일을 입력해주세요'); return; }

    const lots: Lot[] = [];
    for (const draft of lotDrafts) {
      const dateTrim = draft.date.trim();
      const milesNum = parseInt(draft.milesInput.replace(/[^0-9]/g, ''), 10);
      if (!dateTrim && (!draft.milesInput || isNaN(milesNum))) continue;
      if (!dateTrim) {
        Alert.alert('만료일을 입력해주세요'); return;
      }
      if (!parseExpiryDate(dateTrim)) {
        Alert.alert('만료일 형식이 올바르지 않습니다', `"${dateTrim}" — 2027-06 또는 2027-06-30 형식`);
        return;
      }
      if (isNaN(milesNum) || milesNum <= 0) {
        Alert.alert('만료 마일을 올바르게 입력해주세요'); return;
      }
      lots.push({ id: draft.id, date: dateTrim, miles: milesNum });
    }

    setSubmitting(true);
    try {
      await updateCard(card.id, {
        airline: airline.trim(),
        miles, color: card.color, lots,
      });
      router.back();
    } catch (err) {
      Alert.alert('저장 실패', String(err));
      setSubmitting(false);
    }
  };

  const onDelete = () => {
    if (!card) return;
    Alert.alert(
      '카드 삭제',
      `${card.airline}을(를) 삭제할까요?\n\n저장된 마일 정보가 사라지지만, 항공사 계정의 실제 마일은 영향받지 않습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            await deleteCard(card.id);
            router.back();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.loading}><Text style={styles.loadingText}>불러오는 중...</Text></View>
        </SafeAreaView>
      </>
    );
  }

  if (!card) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.loading}>
            <Text style={styles.loadingText}>카드를 찾을 수 없습니다.</Text>
            <Pressable
              style={[styles.cancelBtn, { marginTop: Spacing.md, paddingHorizontal: Spacing.xl }]}
              onPress={() => router.back()}>
              <Text style={styles.cancelText}>돌아가기</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '카드 편집', headerTitleAlign: 'center' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <View style={[styles.colorStripe, { backgroundColor: card.color }]} />

            <Text style={styles.label}>항공사</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 대한항공 SKYPASS"
              placeholderTextColor={Palette.textMute}
              value={airline}
              onChangeText={setAirline}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>보유 마일</Text>
            <View style={styles.milesRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="0"
                placeholderTextColor={Palette.textMute}
                value={milesFormatted}
                onChangeText={setMilesInput}
                keyboardType="numeric"
              />
              <Text style={styles.milesUnit}>mi</Text>
            </View>

            {/* Lots */}
            <View style={styles.optionalSection}>
              <Text style={styles.sectionTitle}>만료 일정 ({lotDrafts.length})</Text>
              <Text style={styles.helperLine}>
                lot별 만료일을 입력하면 D-30 이내는 홈 상단에 강조됩니다.
              </Text>

              {lotDrafts.map((lot, idx) => (
                <LotEditor
                  key={lot.id}
                  index={idx + 1}
                  lot={lot}
                  onChange={(patch) => updateLot(lot.id, patch)}
                  onRemove={() => removeLot(lot.id)}
                />
              ))}

              <Pressable style={styles.addLotBtn} onPress={addLot} android_ripple={{ color: Palette.surface2 }}>
                <Text style={styles.addLotText}>+ 만료 추가</Text>
              </Pressable>
            </View>

            <View style={styles.meta}>
              <Text style={styles.metaLabel}>등록일</Text>
              <Text style={styles.metaValue}>{new Date(card.createdAt).toLocaleDateString('ko-KR')}</Text>
            </View>

            <Pressable style={styles.deleteBtn} onPress={onDelete} android_ripple={{ color: 'rgba(239,68,68,0.2)' }}>
              <Text style={styles.deleteText}>이 카드 삭제</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()} android_ripple={{ color: Palette.surface2 }}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={submitting}
              android_ripple={{ color: Palette.accentWarm }}>
              <Text style={styles.submitText}>{submitting ? '저장 중...' : '저장'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function LotEditor({
  index, lot, onChange, onRemove,
}: {
  index: number;
  lot: LotDraft;
  onChange: (patch: Partial<LotDraft>) => void;
  onRemove: () => void;
}) {
  const milesFmt = useMemo(() => {
    const n = parseInt(lot.milesInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? '' : n.toLocaleString('ko-KR');
  }, [lot.milesInput]);

  return (
    <View style={styles.lotCard}>
      <View style={styles.lotHeader}>
        <Text style={styles.lotIndex}>Lot {index}</Text>
        <Pressable onPress={onRemove} hitSlop={10}>
          <Text style={styles.lotRemove}>삭제</Text>
        </Pressable>
      </View>
      <Text style={styles.lotLabel}>만료일</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 2027-06"
        placeholderTextColor={Palette.textMute}
        value={lot.date}
        onChangeText={(v) => onChange({ date: v })}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <Text style={[styles.lotLabel, { marginTop: 10 }]}>만료되는 마일</Text>
      <View style={styles.milesRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="0"
          placeholderTextColor={Palette.textMute}
          value={milesFmt}
          onChangeText={(v) => onChange({ milesInput: v })}
          keyboardType="numeric"
        />
        <Text style={styles.milesUnit}>mi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Type.body, color: Palette.textMute },

  colorStripe: {
    height: 4, borderRadius: 2,
    marginBottom: Spacing.xl, width: 60,
  },

  label: { ...Type.caption, color: Palette.textDim, fontWeight: '600', marginBottom: Spacing.sm },

  input: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    color: Palette.text,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  milesRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  milesUnit: { ...Type.body, color: Palette.textDim, fontWeight: '600' },

  optionalSection: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
  },
  sectionTitle: { ...Type.h3, color: Palette.text, marginBottom: 4 },
  helperLine: { ...Type.captionSmall, color: Palette.textDim, lineHeight: 18, marginBottom: Spacing.md },

  lotCard: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Palette.border,
  },
  lotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lotIndex: { ...Type.captionSmall, color: Palette.accent2, fontWeight: '700', letterSpacing: 0.5 },
  lotRemove: { ...Type.captionSmall, color: Palette.danger, fontWeight: '600' },
  lotLabel: { ...Type.captionSmall, color: Palette.textDim, marginBottom: 6, fontWeight: '600' },

  addLotBtn: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border, borderStyle: 'dashed',
    alignItems: 'center',
  },
  addLotText: { ...Type.bodyBold, color: Palette.accent },

  meta: {
    marginTop: Spacing.xl,
    padding: Spacing.md + 2,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  metaLabel: { ...Type.caption, color: Palette.textDim },
  metaValue: { ...Type.caption, color: Palette.text, fontWeight: '600' },

  deleteBtn: {
    marginTop: Spacing.xl,
    padding: Spacing.md + 2,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
  },
  deleteText: { ...Type.bodyBold, color: Palette.danger },

  footer: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Palette.border,
    backgroundColor: Palette.bg,
  },
  cancelBtn: {
    flex: 1, backgroundColor: Palette.surface,
    borderRadius: Radius.md, padding: Spacing.md + 4,
    alignItems: 'center',
    borderWidth: 1, borderColor: Palette.border,
  },
  cancelText: { ...Type.bodyBold, color: Palette.text },
  submitBtn: {
    flex: 2, backgroundColor: Palette.accent,
    borderRadius: Radius.md, padding: Spacing.md + 4,
    alignItems: 'center',
  },
  submitText: { color: '#1a1100', fontSize: 15, fontWeight: '700' },
});
