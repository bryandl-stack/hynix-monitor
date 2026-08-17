'use client';

import { premiumPct, usdToKrwShare } from '@/lib/convert';
import { fmtKrw, fmtPct, fmtTime, fmtUsd, fmtVolume } from '@/lib/format';
import { sessionAt, sessionLabel, MARKET_OF } from '@/lib/market-hours';
import type { Quote } from '@/lib/types';

/** 등락/괴리율 부호를 색상만이 아니라 화살표로도 표시(색맹 접근성) */
function ChangeArrow({ value }: { value: number }) {
  if (value > 0) return <span aria-hidden>▲</span>;
  if (value < 0) return <span aria-hidden>▼</span>;
  return null;
}

interface Props {
  title: string;
  subtitle: string;
  quote: Quote | null;
  stale: boolean;
  error: boolean;
  fxRate: number | null;
  krxKrw: number | null;     // 괴리율 기준 (KRX 카드에는 자기 자신 → 괴리율 미표시)
  showPremium: boolean;
  fetchedAt: number | null;
}

export function QuoteCard({ title, subtitle, quote, stale, error, fxRate, krxKrw, showPremium, fetchedAt }: Props) {
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
  // regularPrice가 있으면 위에 표시 중인 price는 정규장 밖(프리/애프터) 체결가다.
  const tradeSession = quote.regularPrice !== undefined
    ? sessionAt(MARKET_OF[quote.source], new Date(quote.tradedAt))
    : null;
  const extendedLabel = tradeSession === 'pre' ? '프리마켓'
    : tradeSession === 'after' ? '애프터마켓'
    : tradeSession ? '시외' : null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#151a24] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-sm font-semibold text-zinc-100">{title}</span>
          <span className="ml-2 text-xs text-zinc-500">{subtitle}</span>
        </div>
        <span className="whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
          {sessionLabel(MARKET_OF[quote.source], session)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="whitespace-nowrap text-3xl font-bold tabular-nums text-zinc-50">
          {krwPrice !== null ? fmtKrw(krwPrice) : '—'}
        </span>
        {extendedLabel && (
          <span className="whitespace-nowrap rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            {extendedLabel} 체결가
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-3 text-sm tabular-nums">
        <span className={`flex items-center gap-0.5 ${changeColor}`}>
          <ChangeArrow value={quote.changePct} />
          {fmtPct(quote.changePct)}
        </span>
        {quote.currency === 'USD' && <span className="text-zinc-400">{fmtUsd(quote.price)}</span>}
        {premium !== null && (
          <span className="text-zinc-400">
            KRX 대비{' '}
            <span className={`inline-flex items-center gap-0.5 ${premium >= 0 ? 'text-[#f04452]' : 'text-[#3182f6]'}`}>
              <ChangeArrow value={premium} />
              {fmtPct(premium)}
            </span>
          </span>
        )}
      </div>

      {quote.regularPrice !== undefined && (
        <div className="mt-1 text-xs tabular-nums text-zinc-500">
          정규장 종가 {fmtUsd(quote.regularPrice)}
          {quote.regularChangePct !== undefined && ` (${fmtPct(quote.regularChangePct)})`}
          {fxRate !== null && ` · ${fmtKrw(usdToKrwShare(quote.regularPrice, fxRate))}`}
        </div>
      )}

      {quote.volume !== undefined && (
        <div className="mt-1 text-xs text-zinc-500">거래량 {fmtVolume(quote.volume)}</div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <span>{fmtTime(quote.tradedAt)} 기준</span>
        {fetchedAt !== null && <span>· {fmtTime(new Date(fetchedAt).toISOString())} 갱신</span>}
        {stale && <span className="text-amber-400">지연됨</span>}
      </div>
    </div>
  );
}
