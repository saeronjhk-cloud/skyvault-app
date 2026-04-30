/**
 * SkyVault 데이터 모델 — 다중 Lot 지원.
 */

export type Lot = {
  id: string;        // React key + 편집/삭제용
  date: string;      // 'YYYY-MM' 또는 'YYYY-MM-DD'
  miles: number;
};

export type Card = {
  id: string;
  airline: string;
  miles: number;     // 총 보유 잔액 (lots 합계와 다를 수 있음)
  color: string;
  lots: Lot[];       // 만료 일정 (비어있을 수 있음)
  createdAt: string;
};

export type CardInput = Omit<Card, 'id' | 'createdAt'>;

export type AirlinePreset = {
  name: string;
  color: string;
};

export const AIRLINE_PRESETS: AirlinePreset[] = [
  { name: '대한항공 SKYPASS', color: '#2f8fc4' },
  { name: '아시아나 클럽',    color: '#e63946' },
  { name: 'JAL Mileage Bank',  color: '#c8102e' },
  { name: 'ANA Mileage Club',  color: '#003876' },
  { name: '직접 입력',         color: '#f5b300' },
];
