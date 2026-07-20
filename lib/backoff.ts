/** 재연결 지수 백오프: 1s → 2s → 4s ... capMs에서 정지 */
export function nextBackoffMs(currentMs: number, capMs = 30_000): number {
  return Math.min(currentMs * 2, capMs);
}
