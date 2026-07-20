import { describe, expect, test } from 'vitest';
import { nextBackoffMs } from '@/lib/backoff';

describe('nextBackoffMs', () => {
  test('매번 두 배로 증가', () => {
    expect(nextBackoffMs(1_000)).toBe(2_000);
    expect(nextBackoffMs(2_000)).toBe(4_000);
  });

  test('상한(cap)을 넘지 않는다', () => {
    expect(nextBackoffMs(20_000, 30_000)).toBe(30_000);
    expect(nextBackoffMs(30_000, 30_000)).toBe(30_000);
  });
});
