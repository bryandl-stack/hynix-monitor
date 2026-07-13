import { describe, expect, test } from 'vitest';
import { fmtKrw, fmtPct, fmtUsd } from '@/lib/format';

describe('format', () => {
  test('원화', () => {
    expect(fmtKrw(1845000)).toBe('1,845,000원');
    expect(fmtKrw(2508893.33)).toBe('2,508,893원'); // 반올림, 소수 없음
  });
  test('달러', () => {
    expect(fmtUsd(154.37)).toBe('$154.37');
  });
  test('퍼센트: 부호 항상 표시', () => {
    expect(fmtPct(-15.37)).toBe('-15.37%');
    expect(fmtPct(1.5)).toBe('+1.50%');
    expect(fmtPct(0)).toBe('0.00%');
  });
});
