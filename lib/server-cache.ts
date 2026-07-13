interface Entry {
  data: unknown;
  fetchedAt: number;
}

const store = new Map<string, Entry>();

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
    const data = await fn();
    store.set(key, { data, fetchedAt: now });
    return { data, stale: false, fetchedAt: now };
  } catch (err) {
    if (hit) return { data: hit.data as T, stale: true, fetchedAt: hit.fetchedAt };
    throw err;
  }
}
