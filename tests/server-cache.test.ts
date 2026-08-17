import { describe, expect, test, vi } from 'vitest';
import { cached } from '@/lib/server-cache';

describe('cached', () => {
  test('TTL 내에는 fn을 다시 부르지 않는다', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const a = await cached('k1', 1000, fn);
    const b = await cached('k1', 1000, fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a.data).toBe(42);
    expect(b.stale).toBe(false);
  });

  test('fn 실패 시 만료 캐시를 stale로 반환', async () => {
    const fn = vi.fn().mockResolvedValueOnce(1).mockRejectedValueOnce(new Error('down'));
    await cached('k2', 0, fn); // ttl 0 → 즉시 만료
    const r = await cached('k2', 0, fn);
    expect(r.data).toBe(1);
    expect(r.stale).toBe(true);
  });

  test('캐시 없이 실패하면 throw', async () => {
    await expect(cached('k3', 0, () => Promise.reject(new Error('down')))).rejects.toThrow('down');
  });

  test('동시 캐시 미스는 업스트림을 한 번만 호출한다', async () => {
    let resolve!: (v: number) => void;
    const fn = vi.fn(() => new Promise<number>((r) => { resolve = r; }));
    const both = Promise.all([cached('k4', 1000, fn), cached('k4', 1000, fn)]);
    resolve(7);
    const [a, b] = await both;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a.data).toBe(7);
    expect(b.data).toBe(7);
  });

  test('동시 요청이 실패해도 다음 요청은 새로 시도한다 (실패한 promise가 남지 않음)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(9);
    await expect(cached('k5', 1000, fn)).rejects.toThrow('down');
    const r = await cached('k5', 1000, fn);
    expect(r.data).toBe(9);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});