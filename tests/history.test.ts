import { describe, expect, test } from 'vitest';
import { mergeHistory } from '@/lib/history';

const fx = [
  { date: '2026-07-09', close: 1498.5 },
  { date: '2026-07-10', close: 1502.0 },
  { date: '2026-07-13', close: 1493.3 },
];

describe('mergeHistory', () => {
  test('날짜 합집합 + 소스별 환산, 없는 날은 null', () => {
    const out = mergeHistory(
      [{ date: '2026-07-10', close: 2180000 }, { date: '2026-07-13', close: 1845000 }],
      [{ date: '2026-07-10', close: 168.01 }],
      [{ date: '2026-07-10', close: 170.66 }, { date: '2026-07-11', close: 169.0 }],
      fx,
    );
    expect(out.map((p) => p.date)).toEqual(['2026-07-10', '2026-07-11', '2026-07-13']);

    const d10 = out[0];
    expect(d10.krxKrw).toBe(2180000);
    expect(d10.adrKrw).toBeCloseTo(168.01 * 10 * 1502.0, 4);
    expect(d10.binanceKrw).toBeCloseTo(170.66 * 10 * 1502.0, 4);

    const d11 = out[1]; // 토요일: 금요일(07-10) 환율로 환산
    expect(d11.krxKrw).toBeNull();
    expect(d11.adrKrw).toBeNull();
    expect(d11.binanceKrw).toBeCloseTo(169.0 * 10 * 1502.0, 4);
  });

  test('환율 이전 데이터가 없으면 환산값 null', () => {
    const out = mergeHistory(
      [],
      [],
      [{ date: '2026-07-01', close: 100 }],
      [{ date: '2026-07-09', close: 1498.5 }],
    );
    expect(out[0].binanceKrw).toBeNull();
  });

  test('days 제한: 마지막 N개만', () => {
    const krx = Array.from({ length: 40 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, '0')}`,
      close: 1000000 + i,
    })).slice(0, 30); // 2026-06-01..30
    const out = mergeHistory(krx, [], [], fx, 7);
    expect(out).toHaveLength(7);
    expect(out[0].date).toBe('2026-06-24');
  });
});
