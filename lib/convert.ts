export const ADR_RATIO = 10; // ADR 10개 = 보통주 1주 (2026-07-10 NASDAQ 상장 조건)
// 주의: 두 ADR은 환산 방향이 반대다. SK하이닉스는 ADR 여러 주가 보통주 1주(→ 곱하기),
// TSMC는 ADR 1주가 보통주 여러 주(→ 나누기)다.
export const TSM_SHARES_PER_ADR = 5; // TSM ADR 1주 = 대만 보통주(2330.TW) 5주

/** ADR·선물 달러가격 → 보통주 1주 원화 환산 */
export function usdToKrwShare(usd: number, fxRate: number): number {
  return usd * ADR_RATIO * fxRate;
}

/** KRX 가격 대비 괴리율(%) */
export function premiumPct(sourceKrw: number, krxKrw: number): number {
  return (sourceKrw / krxKrw - 1) * 100;
}

/** 전일 종가 대비 등락률(%) */
export function changePctOf(price: number, prevClose: number): number {
  return (price / prevClose - 1) * 100;
}
