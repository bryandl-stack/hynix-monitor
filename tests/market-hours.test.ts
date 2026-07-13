import { describe, expect, test } from 'vitest';
import { sessionAt } from '@/lib/market-hours';

describe('sessionAt', () => {
  // 2026-07-13은 월요일
  test('KRX: 평일 장중/마감', () => {
    expect(sessionAt('krx', new Date('2026-07-13T10:00:00+09:00'))).toBe('open');
    expect(sessionAt('krx', new Date('2026-07-13T15:29:00+09:00'))).toBe('open');
    expect(sessionAt('krx', new Date('2026-07-13T15:31:00+09:00'))).toBe('closed');
    expect(sessionAt('krx', new Date('2026-07-12T10:00:00+09:00'))).toBe('closed'); // 일요일
  });

  test('NXT: 프리/메인/애프터', () => {
    expect(sessionAt('nxt', new Date('2026-07-13T08:10:00+09:00'))).toBe('pre');
    expect(sessionAt('nxt', new Date('2026-07-13T10:00:00+09:00'))).toBe('open');
    expect(sessionAt('nxt', new Date('2026-07-13T15:25:00+09:00'))).toBe('closed'); // 15:20~15:30 갭
    expect(sessionAt('nxt', new Date('2026-07-13T19:35:00+09:00'))).toBe('after');
    expect(sessionAt('nxt', new Date('2026-07-13T20:01:00+09:00'))).toBe('closed');
  });

  test('US: 서머타임 기준 프리/정규/애프터 (7월 EDT = UTC-4)', () => {
    // 19:35 KST = 06:35 EDT → pre
    expect(sessionAt('us', new Date('2026-07-13T19:35:00+09:00'))).toBe('pre');
    // 23:30 KST = 10:30 EDT → open
    expect(sessionAt('us', new Date('2026-07-13T23:30:00+09:00'))).toBe('open');
    // 06:00 KST(화) = 17:00 EDT(월) → after
    expect(sessionAt('us', new Date('2026-07-14T06:00:00+09:00'))).toBe('after');
    // 토요일 정오 ET → closed
    expect(sessionAt('us', new Date('2026-07-18T12:00:00-04:00'))).toBe('closed');
  });

  test('binance: 항상 open', () => {
    expect(sessionAt('binance', new Date('2026-07-12T03:00:00+09:00'))).toBe('open');
  });
});
