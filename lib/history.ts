import type { DailyPoint } from '@/lib/types';
import { usdToKrwShare } from '@/lib/convert';

export interface HistoryPoint {
  date: string;
  krxKrw: number | null;
  adrKrw: number | null;
  binanceKrw: number | null;
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

export function mergeHistory(
  krx: DailyPoint[],
  adr: DailyPoint[],
  binance: DailyPoint[],
  fxDaily: DailyPoint[],
  days = 30,
): HistoryPoint[] {
  const fx = [...fxDaily].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = <T,>(arr: DailyPoint[]) => new Map(arr.map((p) => [p.date, p.close]));
  const krxMap = byDate(krx);
  const adrMap = byDate(adr);
  const bnMap = byDate(binance);

  const dates = [...new Set([...krxMap.keys(), ...adrMap.keys(), ...bnMap.keys()])].sort();

  const toKrw = (usd: number | undefined, date: string): number | null => {
    if (usd === undefined) return null;
    const rate = fxOn(fx, date);
    return rate === null ? null : usdToKrwShare(usd, rate);
  };

  return dates.slice(-days).map((date) => ({
    date,
    krxKrw: krxMap.get(date) ?? null,
    adrKrw: toKrw(adrMap.get(date), date),
    binanceKrw: toKrw(bnMap.get(date), date),
  }));
}
