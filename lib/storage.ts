/**
 * AsyncStorage 기반 카드 저장소 (multi-Lot 버전).
 * 기존 단일 nextExpiry 저장 데이터를 자동 마이그레이션.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Card, CardInput, Lot } from './types';

const KEY_CARDS = '@skyvault:cards';

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 옛 구조(nextExpiry) → 새 구조(lots) 마이그레이션
function migrateCard(raw: any): Card {
  if (Array.isArray(raw.lots)) {
    return raw as Card;
  }
  const lots: Lot[] = [];
  if (raw.nextExpiry?.date && typeof raw.nextExpiry?.miles === 'number') {
    lots.push({
      id: 'm_' + raw.id,
      date: raw.nextExpiry.date,
      miles: raw.nextExpiry.miles,
    });
  }
  return {
    id: raw.id,
    airline: raw.airline,
    miles: raw.miles ?? 0,
    color: raw.color,
    lots,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export async function getCards(): Promise<Card[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_CARDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateCard);
  } catch (err) {
    console.warn('[storage] getCards 실패:', err);
    return [];
  }
}

export async function saveCards(cards: Card[]): Promise<void> {
  await AsyncStorage.setItem(KEY_CARDS, JSON.stringify(cards));
}

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

export async function deleteCard(id: string): Promise<void> {
  const cards = await getCards();
  await saveCards(cards.filter((c) => c.id !== id));
}

export async function updateCard(
  id: string,
  patch: Partial<CardInput>,
): Promise<Card | null> {
  const cards = await getCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...patch };
  await saveCards(cards);
  return cards[idx];
}

export async function clearAllCards(): Promise<void> {
  await AsyncStorage.removeItem(KEY_CARDS);
}
