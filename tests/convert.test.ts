import { describe, expect, test } from 'vitest';
import { ADR_RATIO, changePctOf, premiumPct, usdToKrwShare } from '@/lib/convert';

describe('convert', () => {
  test('ADR 1주 → 보통주 원화 환산 (ADR 10 : 보통주 1)', () => {
    expect(ADR_RATIO).toBe(10);
    // 168.01달러 × 10 × 1493.3원 = 2,508,893.3원
    expect(usdToKrwShare(168.01, 1493.3)).toBeCloseTo(2508893.33, 1);
  });

  test('괴리율: KRX 대비 %', () => {
    // NXT 1,828,000 vs KRX 1,845,000 → -0.9214...%
    expect(premiumPct(1828000, 1845000)).toBeCloseTo(-0.9214, 3);
    expect(premiumPct(1845000, 1845000)).toBe(0);
  });

  test('등락률: 전일 종가 대비 %', () => {
    // 1,845,000 vs 전일 2,180,000 → -15.37%
    expect(changePctOf(1845000, 2180000)).toBeCloseTo(-15.3669, 3);
  });
});
