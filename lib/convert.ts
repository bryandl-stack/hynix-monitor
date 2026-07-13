export const ADR_RATIO = 10; // ADR 10개 = 보통주 1주 (2026-07-10 NASDAQ 상장 조건)

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
