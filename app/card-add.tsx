import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { addCard } from '@/lib/storage';
import { AIRLINE_PRESETS } from '@/lib/types';

export default function CardAddScreen() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [customAirline, setCustomAirline] = useState('');
  const [milesInput, setMilesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const preset = AIRLINE_PRESETS[presetIdx];
  const isCustom = preset.name === '직접 입력';
  const airlineName = isCustom ? customAirline.trim() : preset.name;

  // 천 단위 콤마로 보여주기 위한 정규화
  const milesFormatted = useMemo(() => {
    const num = parseInt(milesInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('ko-KR');
  }, [milesInput]);

  const onSubmit = async () => {
    const miles = parseInt(milesInput.replace(/[^0-9]/g, ''), 10);
    if (!airlineName) {
      Alert.alert('항공사 이름을 입력해주세요');
      return;
    }
    if (isNaN(miles) || miles < 0) {
      Alert.alert('올바른 마일을 입력해주세요');
      return;
    }
    setSubmitting(true);
    try {
      await addCard({
        airline: airlineName,
        miles,
        color: preset.color,
      });
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
            {/* 항공사 선택 */}
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

            {/* 직접 입력 모드 */}
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

            {/* 마일 입력 */}
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

            <Text style={styles.helper}>
              💡 항공사 앱이나 웹사이트에서 현재 잔액을 확인하고 입력하세요. 추후 OCR / 메일 자동 입력이 추가됩니다.
            </Text>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => router.back()}
              android_ripple={{ color: Palette.surface2 }}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  label: {
    ...Type.caption,
    color: Palette.textDim,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  presetGrid: { gap: Spacing.sm },
  presetBtn: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Palette.border,
    borderLeftWidth: 1,
  },
  presetBtnActive: {
    borderColor: Palette.accent,
  },
  presetText: { ...Type.body, color: Palette.textDim, fontWeight: '500' },
  presetTextActive: { color: Palette.text, fontWeight: '700' },

  input: {
    backgroundColor: Palette.bg2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    color: Palette.text,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  milesRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  milesUnit: { ...Type.body, color: Palette.textDim, fontWeight: '600' },

  helper: {
    ...Type.captionSmall,
    color: Palette.textMute,
    marginTop: Spacing.md,
    lineHeight: 18,
  },

  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.bg,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  cancelText: { ...Type.bodyBold, color: Palette.text },
  submitBtn: {
    flex: 2,
    backgroundColor: Palette.accent,
    borderRadius: Radius.md,
    padding: Spacing.md + 4,
    alignItems: 'center',
  },
  submitText: { color: '#1a1100', fontSize: 15, fontWeight: '700' },
});
