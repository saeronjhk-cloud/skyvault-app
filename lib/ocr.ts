/**
 * Supabase Edge Function (ocr-mileage) 호출 래퍼 (multi-Lot).
 */

import { AIRLINE_PRESETS } from './types';

const SUPABASE_URL = 'https://zofxppqifsvxknkdhtol.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZnhwcHFpZnN2eGtua2RodG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzMyNjUsImV4cCI6MjA5MzEwOTI2NX0.g8Yt8sXMGl_CHWISPhemNVMPFYRBfF_M3ZpW7iazpAk';
const OCR_ENDPOINT = `${SUPABASE_URL}/functions/v1/ocr-mileage`;

export type OcrLot = { date: string; miles: number };

export type OcrResult = {
  airline: string | null;
  total_miles: number | null;
  lots: OcrLot[];
  confidence: 'high' | 'medium' | 'low';
  notes: string;
};

export async function callOcr(
  imageBase64: string,
  mediaType: string = 'image/jpeg',
): Promise<OcrResult> {
  const res = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      media_type: mediaType,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`OCR 호출 실패 (HTTP ${res.status}) ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return {
    airline: data.airline ?? null,
    total_miles: data.total_miles ?? null,
    lots: Array.isArray(data.lots) ? data.lots : [],
    confidence: data.confidence ?? 'low',
    notes: data.notes ?? '',
  };
}

export function matchAirlinePreset(name: string | null): {
  idx: number;
  customName: string;
} {
  const directInputIdx = AIRLINE_PRESETS.length - 1;
  if (!name) return { idx: directInputIdx, customName: '' };
  const lower = name.toLowerCase().trim();

  // Claude가 잘못 잡을 가능성 있는 섹션 제목 키워드 — 직접 입력으로 처리
  const wrongTitles = [
    '소멸 예정', '소멸예정', '유효기간별', '마일리지 적립', '마일리지 사용',
    '적립 내역', '사용 내역', '잔액 조회',
  ];
  if (wrongTitles.some((w) => lower.includes(w))) {
    return { idx: AIRLINE_PRESETS.length - 1, customName: '' };
  }

  const keywords = [
    { idx: 0, words: ['대한항공', 'skypass', 'korean air'] },
    { idx: 1, words: ['아시아나', 'asiana'] },
    { idx: 2, words: ['jal', '일본항공', 'mileage bank'] },
    { idx: 3, words: ['ana', '전일본', 'mileage club'] },
  ];

  for (const { idx, words } of keywords) {
    if (words.some((w) => lower.includes(w))) {
      return { idx, customName: '' };
    }
  }

  return { idx: AIRLINE_PRESETS.length - 1, customName: name };
}
