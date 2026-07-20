'use client';

import useSWR from 'swr';
import { sessionAt, MARKET_OF } from '@/lib/market-hours';
import type { Quote, SourceId } from '@/lib/types';
import type { FxRate } from '@/lib/sources/fx';
import type { HistoryPoint } from '@/lib/history';

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

// krx/nxt는 같은 API 엔드포인트(같은 SWR 키)를 공유해서 요청이 자동으로 중복 제거된다.
const ENDPOINT_OF: Record<SourceId, string> = {
  krx: '/api/quote/korean', nxt: '/api/quote/korean', adr: '/api/quote/adr', binance: '/api/quote/binance',
};

export function useQuote(source: SourceId) {
  const session = sessionAt(MARKET_OF[source], new Date());
  const interval = session === 'closed' ? 30_000 : 5_000;
  const { data, error } = useSWR(ENDPOINT_OF[source], fetcher, {
    refreshInterval: interval,
    revalidateOnFocus: true,
  });
  const quote = source === 'krx' || source === 'nxt'
    ? ((data?.data?.[source] ?? null) as Quote | null)
    : ((data?.data ?? null) as Quote | null);
  return {
    quote,
    stale: Boolean(data?.stale),
    error: Boolean(error),
    fetchedAt: (data?.fetchedAt ?? null) as number | null,
  };
}

export function useFx() {
  const { data } = useSWR('/api/quote/fx', fetcher, { refreshInterval: 60_000 });
  return {
    fx: (data?.data ?? null) as FxRate | null,
    stale: Boolean(data?.stale),
    fetchedAt: (data?.fetchedAt ?? null) as number | null,
  };
}

export function useHistory() {
  const { data } = useSWR('/api/history', fetcher, { refreshInterval: 300_000 });
  return { history: (data?.data ?? null) as HistoryPoint[] | null };
}
