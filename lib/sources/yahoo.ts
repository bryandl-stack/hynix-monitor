import type { DailyPoint, Quote } from '@/lib/types';
import { changePctOf } from '@/lib/convert';

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/SKHY';
const INTRADAY_URL = `${BASE}?interval=1m&range=1d&includePrePost=true`;
const DAILY_URL = `${BASE}?interval=1d&range=3mo`;
const HEADERS = { 'User-Agent': 'Mozilla/5.0' };

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
  return {
    source: 'adr',
    price,
    currency: 'USD',
    prevClose,
    changePct: changePctOf(price, prevClose),
    tradedAt: new Date(tradedAtSec * 1000).toISOString(),
  };
}

export async function fetchAdrQuote(): Promise<Quote> {
  const res = await fetch(INTRADAY_URL, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`yahoo intraday HTTP ${res.status}`);
  return parseAdrQuote(await res.json());
}

export function parseAdrDaily(json: unknown): DailyPoint[] {
  const r = (json as YahooChart).chart.result[0];
  const closes = r.indicators.quote[0].close ?? [];
  const ts = r.timestamp ?? [];
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
  const out: DailyPoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    out.push({ date: fmt.format(new Date(ts[i] * 1000)), close: c });
  }
  return out;
}

export async function fetchAdrDaily(): Promise<DailyPoint[]> {
  const res = await fetch(DAILY_URL, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`yahoo daily HTTP ${res.status}`);
  return parseAdrDaily(await res.json());
}
