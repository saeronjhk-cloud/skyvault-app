import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { callOcr, matchAirlinePreset } from '@/lib/ocr';
import { addCard, genId } from '@/lib/storage';
import { AIRLINE_PRESETS, type Lot } from '@/lib/types';

type LotDraft = { id: string; date: string; milesInput: string };

const newLotDraft = (): LotDraft => ({ id: genId(), date: '', milesInput: '' });

export default function CardAddScreen() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [customAirline, setCustomAirline] = useState('');
  const [milesInput, setMilesInput] = useState('');
  const [lotDrafts, setLotDrafts] = useState<LotDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrInfo, setOcrInfo] = useState<string | null>(null);

  const preset = AIRLINE_PRESETS[presetIdx];
  const isCustom = preset.name === '직접 입력';
  const airlineName = isCustom ? customAirline.trim() : preset.name;

  const milesFormatted = useMemo(() => {
    const num = parseInt(milesInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('ko-KR');
  }, [milesInput]);

  const onPickAndOcr = async () => {
    setOcrInfo(null);
    setImageUri(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '갤러리 접근을 허용해주세요.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      base64: true,
      quality: 0.7,
    });
    if (picked.canceled) return;

    const asset = picked.assets[0];
    if (!asset.base64) {
      Alert.alert('오류', '이미지를 읽지 못했습니다.');
      return;
    }
    setImageUri(asset.uri);
    setOcrLoading(true);

    try {
      const result = await callOcr(asset.base64, asset.mimeType || 'image/jpeg');

      const matched = matchAirlinePreset(result.airline);
      const directIdx = AIRLINE_PRESETS.length - 1;
      if (matched.idx !== directIdx) {
        // 명확히 매칭된 항공사 → 자동 선택
        setPresetIdx(matched.idx);
      } else if (matched.customName) {
        // Claude가 이름은 줬지만 프리셋엔 없음 → 직접 입력으로 전환
        setPresetIdx(directIdx);
        setCustomAirline(matched.customName);
      }
      // 둘 다 아니면(인식 실패) 사용자가 이전에 선택한 항공사 유지

      if (result.total_miles) setMilesInput(result.total_miles.toString());

      if (result.lots.length > 0) {
        setLotDrafts(
          result.lots.map((l) => ({
            id: genId(),
            date: l.date,
            milesInput: l.miles.toString(),
          })),
        );
      }

      const conf = result.confidence;
      const lotMsg = result.lots.length > 0 ? ` · 만료 ${result.lots.length}건 추가` : '';
      setOcrInfo(
        conf === 'high'
          ? `✅ 자동 입력 완료${lotMsg}. 값 확인 후 저장하세요.`
          : conf === 'medium'
            ? `⚠️ 자동 입력했지만 일부 값을 확인해주세요${lotMsg}.`
            : `⚠️ 인식 정확도가 낮습니다. 직접 확인 권장${lotMsg}.`,
      );
    } catch (err) {
      setOcrInfo(`❌ 인식 실패: ${(err as Error).message}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const updateLot = (id: string, patch: Partial<LotDraft>) => {
    setLotDrafts((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLot = (id: string) => {
    setLotDrafts((prev) => prev.filter((l) => l.id !== id));
  };

  const addLot = () => {
    setLotDrafts((prev) => [...prev, newLotDraft()]);
  };

  const onSubmit = async () => {
    const miles = parseInt(milesInput.replace(/[^0-9]/g, ''), 10);
    if (!airlineName) { Alert.alert('항공사 이름을 입력해주세요'); return; }
    if (isNaN(miles) || miles < 0) { Alert.alert('올바른 마일을 입력해주세요'); return; }

    // lot 검증 + 변환
    const lots: Lot[] = [];
    for (const draft of lotDrafts) {
      const dateTrim = draft.date.trim();
      const milesNum = parseInt(draft.milesInput.replace(/[^0-9]/g, ''), 10);
      // 둘 다 비어있으면 그냥 무시 (스킵)
      if (!dateTrim && (!draft.milesInput || isNaN(milesNum))) continue;
      if (!dateTrim) {
        Alert.alert('만료일을 입력해주세요', '만료 마일이 있는 lot에 만료일이 비어있습니다.');
        return;
      }
      if (!parseExpiryDate(dateTrim)) {
        Alert.alert('만료일 형식이 올바르지 않습니다', `"${dateTrim}" — 2027-06 또는 2027-06-30 형식으로 입력해주세요.`);
        return;
      }
      if (isNaN(milesNum) || milesNum <= 0) {
        Alert.alert('만료 마일을 올바르게 입력해주세요');
        return;
      }
      lots.push({ id: draft.id, date: dateTrim, miles: milesNum });
    }

    setSubmitting(true);
    try {
      await addCard({ airline: airlineName, miles, color: preset.color, lots });
      router.back();
    } catch (err) {
      Alert.alert('저장 실패', String(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '카드 추가', headerTitleAlign: 'center' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            {/* 항공사 */}
            <Text style={styles.label}>항공사</Text>
            <View style={styles.presetGrid}>
              {AIRLINE_PRESETS.map((p, i) => {
                const active = presetIdx === i;
                return (
                  <Pressable
                    key={p.name}
                    onPress={() => setPresetIdx(i)}
                    style={[
                      styles.presetBtn,
                      active && styles.presetBtnActive,
                      active && { borderLeftColor: p.color, borderLeftWidth: 4 },
                    ]}
                    android_ripple={{ color: Palette.surface2 }}>
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isCustom && (
              <>
                <Text style={[styles.label, { marginTop: Spacing.lg }]}>항공사 이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="예: 싱가포르항공 KrisFlyer"
                  placeholderTextColor={Palette.textMute}
                  value={customAirline}
                  onChangeText={setCustomAirline}
                  autoCapitalize="none"
                />
              </>
            )}

            {/* OCR */}
            <View style={styles.ocrCard}>
              <Pressable
                onPress={onPickAndOcr}
                disabled={ocrLoading}
                style={styles.ocrBtn}
                android_ripple={{ color: Palette.accentWarm }}>
                <Text style={styles.ocrBtnEmoji}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ocrBtnTitle}>스크린샷에서 자동 입력</Text>
                  <Text style={styles.ocrBtnSub}>
                    위에서 항공사를 먼저 선택한 후 캡처하면 인식 못 해도 선택은 유지됩니다
                  </Text>
                </View>
              </Pressable>

              {imageUri && (
                <View style={styles.ocrPreview}>
                  <Image source={{ uri: imageUri }} style={styles.previewImg} />
                  {ocrLoading && (
                    <View style={styles.previewOverlay}>
                      <ActivityIndicator size="large" color={Palette.accent} />
                      <Text style={styles.previewOverlayText}>AI가 화면 분석 중...</Text>
                    </View>
                  )}
                </View>
              )}
              {ocrInfo && !ocrLoading && <Text style={styles.ocrInfo}>{ocrInfo}</Text>}
            </View>

            {/* 보유 마일 */}
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

            {/* 만료 lots */}
            <View style={styles.optionalSection}>
              <Text style={styles.sectionTitle}>만료 일정 ({lotDrafts.length})</Text>
              <Text style={styles.helperLine}>
                lot별 만료일을 입력하면 D-30 이내는 홈 상단에 강조됩니다. 비워두면 만료 정보 없이 저장됩니다.
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

              <Pressable
                style={styles.addLotBtn}
                onPress={addLot}
                android_ripple={{ color: Palette.surface2 }}>
                <Text style={styles.addLotText}>+ 만료 추가</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()} android_ripple={{ color: Palette.surface2 }}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={onSubmit}
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

  ocrCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(245, 179, 0, 0.3)',
    overflow: 'hidden',
  },
  ocrBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  ocrBtnEmoji: { fontSize: 32 },
  ocrBtnTitle: { ...Type.bodyBold, color: Palette.text },
  ocrBtnSub: { ...Type.captionSmall, color: Palette.textDim, marginTop: 3, lineHeight: 16 },
  ocrPreview: {
    margin: Spacing.md, marginTop: 0,
    borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Palette.bg2,
  },
  previewImg: { width: '100%', height: 200, resizeMode: 'cover' },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 22, 40, 0.7)',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  previewOverlayText: { ...Type.caption, color: Palette.accent2, fontWeight: '600' },
  ocrInfo: {
    ...Type.captionSmall, color: Palette.textDim,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, lineHeight: 18,
  },

  label: { ...Type.caption, color: Palette.textDim, fontWeight: '600', marginBottom: Spacing.sm },

  presetGrid: { gap: Spacing.sm },
  presetBtn: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    borderWidth: 1, borderColor: Palette.border,
    borderLeftWidth: 1,
  },
  presetBtnActive: { borderColor: Palette.accent },
  presetText: { ...Type.body, color: Palette.textDim, fontWeight: '500' },
  presetTextActive: { color: Palette.text, fontWeight: '700' },

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
  lotHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  lotIndex: { ...Type.captionSmall, color: Palette.accent2, fontWeight: '700', letterSpacing: 0.5 },
  lotRemove: { ...Type.captionSmall, color: Palette.danger, fontWeight: '600' },
  lotLabel: { ...Type.captionSmall, color: Palette.textDim, marginBottom: 6, fontWeight: '600' },

  addLotBtn: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addLotText: { ...Type.bodyBold, color: Palette.accent },

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
