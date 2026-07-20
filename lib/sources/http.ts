const DEFAULT_TIMEOUT_MS = 5_000;

export const BROWSER_HEADERS = { 'User-Agent': 'Mozilla/5.0' };

/** 업스트림 JSON API 공용 fetch. 타임아웃/no-store/HTTP 상태 체크를 한 곳에서 처리 */
export async function fetchJson(
  url: string,
  opts: { headers?: Record<string, string>; label: string; timeoutMs?: number } = { label: url },
): Promise<unknown> {
  const res = await fetch(url, {
    headers: opts.headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${opts.label} HTTP ${res.status}`);
  return res.json();
}
