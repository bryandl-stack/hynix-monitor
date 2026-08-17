import { describe, expect, test } from 'vitest';
import { parseAdrQuote, parseDaily } from '@/lib/sources/yahoo';
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

  test('마지막 체결이 정규장 시각보다 뒤면 시외가 → 정규장 종가를 따로 남긴다', () => {
    const q = parseAdrQuote(intraday);
    expect(q.regularPrice).toBe(168.01);
    expect(q.regularChangePct).toBeCloseTo((168.01 / 149.0 - 1) * 100, 6);
    expect(q.regularTradedAt).toBe(new Date(1783713600 * 1000).toISOString());
  });

  test('정규장 중(마지막 체결 = 정규장 시각)에는 시외 필드가 없다', () => {
    const j = structuredClone(intraday);
    j.chart.result[0].meta.regularMarketTime = 1783946220;
    const q = parseAdrQuote(j);
    expect(q.price).toBe(154.4);
    expect(q.regularPrice).toBeUndefined();
    expect(q.regularChangePct).toBeUndefined();
  });

  test('유효 봉이 없으면 meta.regularMarketPrice로 폴백', () => {
    const j = structuredClone(intraday);
    j.chart.result[0].indicators.quote[0].close = [null, null, null] as (number | null)[];
    const q = parseAdrQuote(j);
    expect(q.price).toBe(168.01);
    expect(q.tradedAt).toBe(new Date(1783713600 * 1000).toISOString());
  });

  test('일봉: 날짜는 하드코딩이 아니라 거래소 타임존을 따른다 (2330.TW = 타이베이)', () => {
    // 1783733400 = 2026-07-11 01:30 UTC → 뉴욕 07-10 21:30 / 타이베이 07-11 09:30
    const at = (tz: string) => ({
      chart: { result: [{
        meta: { regularMarketPrice: 0, chartPreviousClose: 0, regularMarketTime: 0, exchangeTimezoneName: tz },
        timestamp: [1783733400],
        indicators: { quote: [{ close: [2400] }] },
      }] },
    });
    expect(parseDaily(at('America/New_York'))).toEqual([{ date: '2026-07-10', close: 2400 }]);
    expect(parseDaily(at('Asia/Taipei'))).toEqual([{ date: '2026-07-11', close: 2400 }]);
  });

  test('일봉: 뉴욕 날짜로 변환, null 제거', () => {
    // 1783690200 = 2026-07-10 09:30 EDT → 2026-07-10
    expect(parseDaily(daily)).toEqual([{ date: '2026-07-10', close: 168.01 }]);
  });
});
