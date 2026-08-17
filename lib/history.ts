import type { DailyPoint } from '@/lib/types';
import { premiumPct, TSM_SHARES_PER_ADR, usdToKrwShare } from '@/lib/convert';

export interface HistoryPoint {
  date: string;
  krxKrw: number | null;
  adrKrw: number | null;
  binanceKrw: number | null;
  adrPremiumPct: number | null;
  binancePremiumPct: number | null;
  /** TSM ADR(÷5, TWD 환산) vs 대만 본주 2330.TW 괴리율 — 비교 벤치마크 */
  tsmcPremiumPct: number | null;
}

/** TSMC 본주/ADR/USD-TWD 일봉 묶음 */
export interface TsmcDaily {
  tw: DailyPoint[];
  adr: DailyPoint[];
  fx: DailyPoint[];
}

/** date 이하에서 가장 가까운 환율. 없으면 null */
function fxOn(sortedFx: DailyPoint[], date: string): number | null {
  let best: number | null = null;
  for (const f of sortedFx) {
    if (f.date > date) break;
    best = f.close;
  }
  return best;
}

const byDate = (arr: DailyPoint[]) => new Map(arr.map((p) => [p.date, p.close]));
const sortByDate = (arr: DailyPoint[]) => [...arr].sort((a, b) => a.date.localeCompare(b.date));

export function mergeHistory(
  krx: DailyPoint[],
  adr: DailyPoint[],
  binance: DailyPoint[],
  fxDaily: DailyPoint[],
  days = 30,
  tsmc?: TsmcDaily,
): HistoryPoint[] {
  const fx = sortByDate(fxDaily);
  const krxMap = byDate(krx);
  const adrMap = byDate(adr);
  const bnMap = byDate(binance);

  const twMap = byDate(tsmc?.tw ?? []);
  const tsmMap = byDate(tsmc?.adr ?? []);
  const twFx = sortByDate(tsmc?.fx ?? []);

  const dates = [
    ...new Set([...krxMap.keys(), ...adrMap.keys(), ...bnMap.keys(), ...twMap.keys()]),
  ].sort();

  const toKrw = (usd: number | undefined, date: string): number | null => {
    if (usd === undefined) return null;
    const rate = fxOn(fx, date);
    return rate === null ? null : usdToKrwShare(usd, rate);
  };

  // 같은 날짜의 대만 종가(현지 13:30)와 미국 종가(현지 16:00)를 짝지어 비교한다 — 두 종가
  // 사이에 약 14시간 시차가 있는 건 ADR 괴리율의 통상적인 계산 방식이다.
  const tsmcPremium = (date: string): number | null => {
    const tw = twMap.get(date);
    const usd = tsmMap.get(date);
    if (tw === undefined || usd === undefined) return null;
    const rate = fxOn(twFx, date);
    return rate === null ? null : premiumPct((usd * rate) / TSM_SHARES_PER_ADR, tw);
  };

  return dates.slice(-days).map((date) => {
    const krxKrw = krxMap.get(date) ?? null;
    const adrKrw = toKrw(adrMap.get(date), date);
    const binanceKrw = toKrw(bnMap.get(date), date);
    return {
      date,
      krxKrw,
      adrKrw,
      binanceKrw,
      adrPremiumPct: krxKrw !== null && adrKrw !== null ? premiumPct(adrKrw, krxKrw) : null,
      binancePremiumPct: krxKrw !== null && binanceKrw !== null ? premiumPct(binanceKrw, krxKrw) : null,
      tsmcPremiumPct: tsmcPremium(date),
    };
  });
}
