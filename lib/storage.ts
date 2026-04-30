/**
 * AsyncStorage 기반 카드 저장소.
 * 전체 카드를 단일 키에 JSON으로 저장 (1차 구현).
 * 추후 카드별 키로 분리 + lot 컬렉션 추가 가능.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Card, CardInput } from './types';

const KEY_CARDS = '@skyvault:cards';

// 단순 ID 생성기 (uuid 패키지 안 쓰고 즉석 충분)
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 모든 카드 조회
export async function getCards(): Promise<Card[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_CARDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[storage] getCards 실패:', err);
    return [];
  }
}

// 모든 카드 저장 (덮어쓰기)
export async function saveCards(cards: Card[]): Promise<void> {
  await AsyncStorage.setItem(KEY_CARDS, JSON.stringify(cards));
}

// 카드 1개 추가
export async function addCard(input: CardInput): Promise<Card> {
  const cards = await getCards();
  const card: Card = {
    ...input,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  cards.push(card);
  await saveCards(cards);
  return card;
}

// 카드 1개 삭제
export async function deleteCard(id: string): Promise<void> {
  const cards = await getCards();
  await saveCards(cards.filter((c) => c.id !== id));
}

// 카드 1개 수정 (id 매칭)
export async function updateCard(id: string, patch: Partial<CardInput>): Promise<Card | null> {
  const cards = await getCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...patch };
  await saveCards(cards);
  return cards[idx];
}

// 전체 초기화 (개발용)
export async function clearAllCards(): Promise<void> {
  await AsyncStorage.removeItem(KEY_CARDS);
}
