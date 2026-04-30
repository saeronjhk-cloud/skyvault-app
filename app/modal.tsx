import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <Text style={styles.eyebrow}>모달 자리</Text>
      <Text style={styles.title}>준비 중입니다</Text>
      <Text style={styles.body}>
        다음 스프린트에서 카드 추가, OCR 결과 검토, 알림 상세 같은 모달 화면들이 이 위치에 채워질 예정입니다.
      </Text>

      <Pressable
        style={styles.btn}
        onPress={() => router.back()}
        android_ripple={{ color: Palette.surface2 }}>
        <Text style={styles.btnText}>닫기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: Palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    ...Type.captionSmall,
    color: Palette.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { ...Type.h2, color: Palette.text, marginBottom: Spacing.sm },
  body: { ...Type.body, color: Palette.textDim, lineHeight: 22, marginBottom: Spacing.xxl },
  btn: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  btnText: { ...Type.bodyBold, color: Palette.text },
});
