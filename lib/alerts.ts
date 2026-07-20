/**
 * 이전/현재 괴리율을 비교해 임계치를 "새로 넘어선" 순간만 true를 반환한다.
 * 이미 임계치 위에 있던 상태를 계속 유지 중이면 매 폴링마다 알림이 반복되는 걸 막기 위한 edge 감지.
 */
export function crossedThreshold(prev: number | null, curr: number | null, thresholdPct: number): boolean {
  if (curr === null) return false;
  const wasAbove = prev !== null && Math.abs(prev) >= thresholdPct;
  const isAbove = Math.abs(curr) >= thresholdPct;
  return isAbove && !wasAbove;
}
