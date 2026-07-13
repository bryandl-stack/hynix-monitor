import { describe, expect, test } from 'vitest';
import { parseFx } from '@/lib/sources/fx';
import fixture from './fixtures/naver-fx.json';

describe('fx source', () => {
  test('현재 고시환율은 최신 항목', () => {
    const { current } = parseFx(fixture);
    expect(current.rate).toBe(1493.3);
    expect(current.date).toBe('2026-07-13');
  });

  test('일별 환율은 날짜 오름차순', () => {
    const { daily } = parseFx(fixture);
    expect(daily).toEqual([
      { date: '2026-07-09', close: 1498.5 },
      { date: '2026-07-10', close: 1502.0 },
      { date: '2026-07-13', close: 1493.3 },
    ]);
  });
});
