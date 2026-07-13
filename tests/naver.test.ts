import { describe, expect, test } from 'vitest';
import { num, parseKoreanQuotes, parseKrxDaily } from '@/lib/sources/naver';
import quoteFixture from './fixtures/naver-quote.json';
import dailyFixture from './fixtures/naver-daily.json';

describe('naver source', () => {
  test('num: 콤마 문자열 → 숫자', () => {
    expect(num('1,828,000')).toBe(1828000);
    expect(num('-352,000')).toBe(-352000);
    expect(num(1845000)).toBe(1845000);
  });

  test('KRX 시세 파싱', () => {
    const { krx } = parseKoreanQuotes(quoteFixture);
    expect(krx.source).toBe('krx');
    expect(krx.price).toBe(1845000);
    expect(krx.prevClose).toBe(2180000); // 1845000 - (-335000)
    expect(krx.changePct).toBe(-15.37);
    expect(krx.currency).toBe('KRW');
    expect(krx.volume).toBe(7951404);
  });

  test('NXT(overMarketPriceInfo) 시세 파싱', () => {
    const { nxt } = parseKoreanQuotes(quoteFixture);
    expect(nxt).not.toBeNull();
    expect(nxt!.source).toBe('nxt');
    expect(nxt!.price).toBe(1828000);
    expect(nxt!.prevClose).toBe(2180000);
    expect(nxt!.changePct).toBe(-16.15);
  });

  test('overMarketPriceInfo 없으면 nxt는 null', () => {
    const j = structuredClone(quoteFixture) as unknown as { result: { datas: Record<string, unknown>[] } };
    delete j.result.datas[0].overMarketPriceInfo;
    expect(parseKoreanQuotes(j).nxt).toBeNull();
  });

  test('KRX 일봉 파싱: YYYY-MM-DD 변환', () => {
    const days = parseKrxDaily(dailyFixture);
    expect(days).toEqual([
      { date: '2026-07-10', close: 2180000 },
      { date: '2026-07-13', close: 1845000 },
    ]);
  });
});
