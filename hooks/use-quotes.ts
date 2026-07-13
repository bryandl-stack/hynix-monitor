'use client';

import useSWR from 'swr';
import { sessionAt, type MarketId } from '@/lib/market-hours';
import type { Quote } from '@/lib/types';
import type { FxRate } from '@/lib/sources/fx';
import type { HistoryPoint } from '@/lib/history';

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

const MARKET_OF: Record<string, MarketId> = {
  krx: 'krx', nxt: 'nxt', adr: 'us', binance: 'binance',
};

export function useQuote(source: 'krx' | 'nxt' | 'adr' | 'binance') {
  const session = sessionAt(MARKET_OF[source], new Date());
  const interval = session === 'closed' ? 30_000 : 5_000;
  const { data, error } = useSWR(`/api/quote/${source}`, fetcher, {
    refreshInterval: interval,
    revalidateOnFocus: true,
  });
  return {
    quote: (data?.data ?? null) as Quote | null,
    stale: Boolean(data?.stale),
    error: Boolean(error),
  };
}

export function useFx() {
  const { data } = useSWR('/api/quote/fx', fetcher, { refreshInterval: 60_000 });
  return { fx: (data?.data ?? null) as FxRate | null, stale: Boolean(data?.stale) };
}

export function useHistory() {
  const { data } = useSWR('/api/history', fetcher, { refreshInterval: 300_000 });
  return { history: (data?.data ?? null) as HistoryPoint[] | null };
}
