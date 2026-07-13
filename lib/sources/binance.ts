import type { DailyPoint, Quote } from '@/lib/types';

const TICKER_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=SKHYUSDT';
const KLINES_URL = 'https://fapi.binance.com/fapi/v1/klines?symbol=SKHYUSDT&interval=1d&limit=40';
export const BINANCE_WS_URL = 'wss://fstream.binance.com/ws/skhyusdt@aggTrade';

interface BinanceTicker {
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  closeTime: number;
  volume: string;
}

export function parseBinanceQuote(json: unknown): Quote {
  const t = json as BinanceTicker;
  const price = Number(t.lastPrice);
  return {
    source: 'binance',
    price,
    currency: 'USD',
    prevClose: price - Number(t.priceChange),
    changePct: Number(t.priceChangePercent),
    tradedAt: new Date(t.closeTime).toISOString(),
    volume: Number(t.volume),
  };
}

export async function fetchBinanceQuote(): Promise<Quote> {
  const res = await fetch(TICKER_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`binance ticker HTTP ${res.status}`);
  return parseBinanceQuote(await res.json());
}

type Kline = [number, string, string, string, string, ...unknown[]];

export function parseBinanceDaily(json: unknown): DailyPoint[] {
  return (json as Kline[]).map((k) => ({
    date: new Date(k[0]).toISOString().slice(0, 10),
    close: Number(k[4]),
  }));
}

export async function fetchBinanceDaily(): Promise<DailyPoint[]> {
  const res = await fetch(KLINES_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`binance klines HTTP ${res.status}`);
  return parseBinanceDaily(await res.json());
}
