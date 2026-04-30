/**
 * 만료일 유틸 (multi-Lot 버전).
 */

import type { Card, Lot } from './types';

export function parseExpiryDate(s: string): Date | null {
  if (!s) return null;
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m1) {
    const d = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const m2 = s.match(/^(\d{4})-(\d{2})$/);
  if (m2) {
    const d = new Date(Number(m2[1]), Number(m2[2]), 0);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function daysUntil(dateStr: string): number {
  const d = parseExpiryDate(dateStr);
  if (!d) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export type UrgencyLevel = 'critical' | 'soon' | 'later' | 'none';

export function getUrgency(dateStr?: string): UrgencyLevel {
  if (!dateStr) return 'none';
  const days = daysUntil(dateStr);
  if (days < 0) return 'critical';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'soon';
  return 'later';
}

export function formatExpiryDisplay(s: string): string {
  return s.replace(/-/g, '.');
}

// 카드의 가장 빠른 만료 lot
export function getEarliestLot(card: Card): Lot | null {
  if (!card.lots || card.lots.length === 0) return null;
  const sorted = [...card.lots].sort(
    (a, b) => daysUntil(a.date) - daysUntil(b.date),
  );
  return sorted[0];
}

// 카드별 가장 임박한 lot 중 D-N 이내 추림
export type ExpiringEntry = {
  card: Card;
  lot: Lot;
  days: number;
};

export function getExpiringSoon(
  cards: Card[],
  withinDays = 30,
): ExpiringEntry[] {
  const entries: ExpiringEntry[] = [];
  for (const card of cards) {
    if (!card.lots) continue;
    for (const lot of card.lots) {
      const days = daysUntil(lot.date);
      if (days >= 0 && days <= withinDays) {
        entries.push({ card, lot, days });
      }
    }
  }
  return entries.sort((a, b) => a.days - b.days);
}
