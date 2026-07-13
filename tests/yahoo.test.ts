import { describe, expect, test } from 'vitest';
import { parseAdrDaily, parseAdrQuote } from '@/lib/sources/yahoo';
import intraday from './fixtures/yahoo-intraday.json';
import daily from './fixtures/yahoo-daily.json';

describe('yahoo source', () => {
  test('현재가: 마지막 유효 1분봉 종가 (null 건너뜀)', () => {
    const q = parseAdrQuote(intraday);
    expect(q.source).toBe('adr');
    expect(q.currency).toBe('USD');
    expect(q.price).toBe(154.4);
    expect(q.prevClose).toBe(149.0);
    expect(q.changePct).toBeCloseTo((154.4 / 149.0 - 1) * 100, 6);
    expect(q.tradedAt).toBe(new Date(1783946220 * 1000).toISOString());
  });

  test('유효 봉이 없으면 meta.regularMarketPrice로 폴백', () => {
    const j = structuredClone(intraday);
    j.chart.result[0].indicators.quote[0].close = [null, null, null] as (number | null)[];
    const q = parseAdrQuote(j);
    expect(q.price).toBe(168.01);
    expect(q.tradedAt).toBe(new Date(1783713600 * 1000).toISOString());
  });

  test('일봉: 뉴욕 날짜로 변환, null 제거', () => {
    // 1783690200 = 2026-07-10 09:30 EDT → 2026-07-10
    expect(parseAdrDaily(daily)).toEqual([{ date: '2026-07-10', close: 168.01 }]);
  });
});
