import type { DailyPoint, Quote } from '@/lib/types';
import { BROWSER_HEADERS, fetchJson } from '@/lib/sources/http';

const QUOTE_URL =
  'https://m.stock.naver.com/front-api/realTime/marketPrice?itemCodes=000660&endType=stock&stockType=domestic';
const DAILY_URL =
  'https://m.stock.naver.com/front-api/chart/domestic/stock/end?code=000660&chartInfoType=item&scriptChartType=candleDay';

/** "1,845,000" | "-352,000" | 1845000 → number */
export function num(s: unknown): number {
  if (typeof s === 'number') return s;
  return Number(String(s).replace(/,/g, ''));
}

interface NaverQuoteData {
  marketStatus: string;
  localTradedAt: string;
  closePriceRaw: string;
  compareToPreviousClosePriceRaw: string;
  fluctuationsRatioRaw: string;
  accumulatedTradingVolumeRaw: string;
  overMarketPriceInfo?: {
    overMarketStatus: string;
    overPrice?: string;
    fluctuationsRatio: string;
    localTradedAt: string;
    accumulatedTradingVolumeRaw?: string;
  } | null;
}

export function parseKoreanQuotes(json: unknown): { krx: Quote; nxt: Quote | null } {
  const data = (json as { result: { datas: NaverQuoteData[] } }).result.datas[0];
  const price = num(data.closePriceRaw);
  const prevClose = price - num(data.compareToPreviousClosePriceRaw);

  const krx: Quote = {
    source: 'krx',
    price,
    currency: 'KRW',
    prevClose,
    changePct: num(data.fluctuationsRatioRaw),
    tradedAt: data.localTradedAt,
    volume: num(data.accumulatedTradingVolumeRaw),
  };

  const over = data.overMarketPriceInfo;
  const nxt: Quote | null = over?.overPrice
    ? {
        source: 'nxt',
        price: num(over.overPrice),
        currency: 'KRW',
        prevClose,
        changePct: num(over.fluctuationsRatio),
        tradedAt: over.localTradedAt,
        volume: over.accumulatedTradingVolumeRaw ? num(over.accumulatedTradingVolumeRaw) : undefined,
      }
    : null;

  return { krx, nxt };
}

export async function fetchKoreanQuotes(): Promise<{ krx: Quote; nxt: Quote | null }> {
  const json = await fetchJson(QUOTE_URL, { headers: BROWSER_HEADERS, label: 'naver quote' });
  return parseKoreanQuotes(json);
}

interface NaverDailyInfo { localDate: string; closePrice: number }

export function parseKrxDaily(json: unknown): DailyPoint[] {
  const infos = (json as { result: { priceInfos: NaverDailyInfo[] } }).result.priceInfos;
  return infos.map((p) => ({
    date: `${p.localDate.slice(0, 4)}-${p.localDate.slice(4, 6)}-${p.localDate.slice(6, 8)}`,
    close: p.closePrice,
  }));
}

export async function fetchKrxDaily(): Promise<DailyPoint[]> {
  const json = await fetchJson(DAILY_URL, { headers: BROWSER_HEADERS, label: 'naver daily' });
  return parseKrxDaily(json);
}
