import type { DailyPoint, Quote } from '@/lib/types';
import { changePctOf } from '@/lib/convert';
import { BROWSER_HEADERS, fetchJson } from '@/lib/sources/http';

const chartUrl = (symbol: string, query: string) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${query}`;

const INTRADAY_QUERY = 'interval=1m&range=1d&includePrePost=true';
const DAILY_QUERY = 'interval=1d&range=3mo';

interface YahooChart {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
        regularMarketTime: number;
        exchangeTimezoneName: string;
      };
      timestamp?: number[];
      indicators: { quote: Array<{ close: Array<number | null> }> };
    }>;
  };
}

export function parseAdrQuote(json: unknown): Quote {
  const r = (json as YahooChart).chart.result[0];
  const closes = r.indicators.quote[0].close ?? [];
  const ts = r.timestamp ?? [];

  // meta는 정규장 값만 들고 있고, 시계열은 includePrePost=true라 프리/애프터 체결까지 담긴다.
  // 마지막 체결이 정규장 시각보다 뒤면 그게 시외가 → 정규장 종가를 따로 남겨둔다.
  let price = r.meta.regularMarketPrice;
  let tradedAtSec = r.meta.regularMarketTime;
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] != null) {
      price = closes[i] as number;
      tradedAtSec = ts[i];
      break;
    }
  }

  const prevClose = r.meta.chartPreviousClose;
  const extended = tradedAtSec > r.meta.regularMarketTime;
  return {
    source: 'adr',
    price,
    currency: 'USD',
    prevClose,
    changePct: changePctOf(price, prevClose),
    tradedAt: new Date(tradedAtSec * 1000).toISOString(),
    ...(extended && {
      regularPrice: r.meta.regularMarketPrice,
      regularChangePct: changePctOf(r.meta.regularMarketPrice, prevClose),
      regularTradedAt: new Date(r.meta.regularMarketTime * 1000).toISOString(),
    }),
  };
}

export async function fetchAdrQuote(): Promise<Quote> {
  const json = await fetchJson(chartUrl('SKHY', INTRADAY_QUERY), {
    headers: BROWSER_HEADERS,
    label: 'yahoo intraday',
  });
  return parseAdrQuote(json);
}

/** 일봉 종가. 날짜는 해당 거래소 현지 날짜(meta.exchangeTimezoneName) 기준 */
export function parseDaily(json: unknown): DailyPoint[] {
  const r = (json as YahooChart).chart.result[0];
  const closes = r.indicators.quote[0].close ?? [];
  const ts = r.timestamp ?? [];
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: r.meta.exchangeTimezoneName }); // YYYY-MM-DD
  const out: DailyPoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    out.push({ date: fmt.format(new Date(ts[i] * 1000)), close: c });
  }
  return out;
}

export async function fetchDaily(symbol: string): Promise<DailyPoint[]> {
  const json = await fetchJson(chartUrl(symbol, DAILY_QUERY), {
    headers: BROWSER_HEADERS,
    label: `yahoo daily ${symbol}`,
  });
  return parseDaily(json);
}
