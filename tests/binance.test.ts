import { describe, expect, test } from 'vitest';
import { BINANCE_WS_URL, parseBinanceDaily, parseBinanceQuote } from '@/lib/sources/binance';
import ticker from './fixtures/binance-ticker.json';
import klines from './fixtures/binance-klines.json';

describe('binance source', () => {
  test('24hr 티커 파싱', () => {
    const q = parseBinanceQuote(ticker);
    expect(q.source).toBe('binance');
    expect(q.currency).toBe('USD');
    expect(q.price).toBe(154.37);
    expect(q.prevClose).toBeCloseTo(154.37 + 16.54, 6);
    expect(q.changePct).toBe(-9.678);
    expect(q.tradedAt).toBe(new Date(1783938983216).toISOString());
    expect(q.volume).toBe(1433342.9);
  });

  test('일봉 파싱: openTime의 UTC 날짜 + close(idx 4)', () => {
    // 1783641600000 = 2026-07-09T16:00:00Z → UTC 날짜 2026-07-09
    expect(parseBinanceDaily(klines)).toEqual([
      { date: '2026-07-09', close: 171.49 },
      { date: '2026-07-10', close: 170.66 },
    ]);
  });

  test('WS URL 상수', () => {
    expect(BINANCE_WS_URL).toBe('wss://fstream.binance.com/ws/skhyusdt@aggTrade');
  });
});
