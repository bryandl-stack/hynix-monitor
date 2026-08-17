interface Entry {
  data: unknown;
  fetchedAt: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<{ data: T; stale: boolean; fetchedAt: number }> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && now - hit.fetchedAt < ttlMs) {
    return { data: hit.data as T, stale: false, fetchedAt: hit.fetchedAt };
  }
  try {
    // 동시에 들어온 캐시 미스는 업스트림 호출 하나를 같이 기다린다 (탭 여러 개 = 요청 폭주 방지)
    let pending = inflight.get(key) as Promise<T> | undefined;
    if (!pending) {
      pending = fn();
      inflight.set(key, pending);
      pending.catch(() => {}).finally(() => inflight.delete(key));
    }
    const data = await pending;
    store.set(key, { data, fetchedAt: now });
    return { data, stale: false, fetchedAt: now };
  } catch (err) {
    if (hit) return { data: hit.data as T, stale: true, fetchedAt: hit.fetchedAt };
    throw err;
  }
}
