/**
 * SkyVault 데이터 모델
 * 1차 구현은 단순 Card 구조. 추후 Lot[] 분리 가능.
 */

export type Card = {
  id: string;
  airline: string;
  miles: number;
  color: string;            // hex 값 (좌측 보더 색상)
  nextExpiry?: {
    date: string;           // YYYY-MM 또는 YYYY-MM-DD
    miles: number;
  };
  createdAt: string;        // ISO 8601
};

// 카드 추가 시 자동 채워지는 필드 제외한 입력 타입
export type CardInput = Omit<Card, 'id' | 'createdAt'>;

// 항공사 프리셋 (추가 폼에서 빠른 선택용)
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
