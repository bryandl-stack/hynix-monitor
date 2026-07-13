'use client';

import { premiumPct, usdToKrwShare } from '@/lib/convert';
import { fmtKrw, fmtPct, fmtTime, fmtUsd } from '@/lib/format';
import { sessionAt, sessionLabel, type MarketId } from '@/lib/market-hours';
import type { Quote, SourceId } from '@/lib/types';

const MARKET_OF: Record<SourceId, MarketId> = { krx: 'krx', nxt: 'nxt', adr: 'us', binance: 'binance' };

interface Props {
  title: string;
  subtitle: string;
  quote: Quote | null;
  stale: boolean;
  error: boolean;
  fxRate: number | null;
  krxKrw: number | null;     // 괴리율 기준 (KRX 카드에는 자기 자신 → 괴리율 미표시)
  showPremium: boolean;
}

export function QuoteCard({ title, subtitle, quote, stale, error, fxRate, krxKrw, showPremium }: Props) {
  if (!quote) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-[#151a24] p-5">
        <div className="text-sm text-zinc-400">{title}</div>
        <div className="mt-4 text-zinc-500">{error ? '데이터를 가져올 수 없음' : '세션 없음 / 로딩 중'}</div>
      </div>
    );
  }

  const krwPrice = quote.currency === 'KRW'
    ? quote.price
    : fxRate !== null ? usdToKrwShare(quote.price, fxRate) : null;

  const up = quote.changePct > 0;
  const changeColor = up ? 'text-[#f04452]' : quote.changePct < 0 ? 'text-[#3182f6]' : 'text-zinc-400';
  const session = sessionAt(MARKET_OF[quote.source], new Date());
  const premium = showPremium && krwPrice !== null && krxKrw ? premiumPct(krwPrice, krxKrw) : null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#151a24] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-sm font-semibold text-zinc-100">{title}</span>
          <span className="ml-2 text-xs text-zinc-500">{subtitle}</span>
        </div>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
          {sessionLabel(MARKET_OF[quote.source], session)}
        </span>
      </div>

      <div className="mt-3 text-3xl font-bold tabular-nums text-zinc-50">
        {krwPrice !== null ? fmtKrw(krwPrice) : '—'}
      </div>

      <div className="mt-1 flex items-center gap-3 text-sm tabular-nums">
        <span className={changeColor}>{fmtPct(quote.changePct)}</span>
        {quote.currency === 'USD' && <span className="text-zinc-400">{fmtUsd(quote.price)}</span>}
        {premium !== null && (
          <span className="text-zinc-400">
            KRX 대비 <span className={premium >= 0 ? 'text-[#f04452]' : 'text-[#3182f6]'}>{fmtPct(premium)}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <span>{fmtTime(quote.tradedAt)} 기준</span>
        {stale && <span className="text-amber-400">지연됨</span>}
      </div>
    </div>
  );
}
