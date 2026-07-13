import type { DailyPoint } from '@/lib/types';
import { NAVER_HEADERS, num } from '@/lib/sources/naver';

const FX_URL =
  'https://m.stock.naver.com/front-api/marketIndex/prices?category=exchange&reutersCode=FX_USDKRW&page=1';

export interface FxRate {
  rate: number;
  date: string; // YYYY-MM-DD 고시일 (주말엔 금요일)
}

interface FxRow { localTradedAt: string; closePrice: string }

export function parseFx(json: unknown): { current: FxRate; daily: DailyPoint[] } {
  const rows = (json as { result: FxRow[] }).result;
  const daily = rows
    .map((r) => ({ date: r.localTradedAt, close: num(r.closePrice) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = daily[daily.length - 1];
  return { current: { rate: last.close, date: last.date }, daily };
}

export async function fetchFx(): Promise<{ current: FxRate; daily: DailyPoint[] }> {
  const res = await fetch(FX_URL, { headers: NAVER_HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`naver fx HTTP ${res.status}`);
  return parseFx(await res.json());
}
