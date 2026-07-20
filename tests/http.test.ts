import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchJson } from '@/lib/sources/http';

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('정상 응답이면 JSON을 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: 1 }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchJson('https://example.com', { label: 'x' })).resolves.toEqual({ ok: 1 });
  });

  test('HTTP 에러 상태면 라벨을 포함해 throw', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchJson('https://example.com', { label: 'my source' })).rejects.toThrow('my source HTTP 500');
  });

  test('타임아웃 signal을 fetch에 전달한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal('fetch', fetchMock);
    await fetchJson('https://example.com', { label: 'x', timeoutMs: 1234 });
    const call = fetchMock.mock.calls[0][1] as { signal?: AbortSignal };
    expect(call.signal).toBeInstanceOf(AbortSignal);
  });
});
