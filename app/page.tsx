'use client';

import { FxBar } from '@/components/fx-bar';
import { QuoteCard } from '@/components/quote-card';
import { ComparisonChart } from '@/components/comparison-chart';
import { PremiumAlert } from '@/components/premium-alert';
import { useBinanceWs } from '@/hooks/use-binance-ws';
import { useHistory, useQuote, useFx } from '@/hooks/use-quotes';
import { premiumPct, usdToKrwShare } from '@/lib/convert';

export default function Home() {
  const krx = useQuote('krx');
  const nxt = useQuote('nxt');
  const adr = useQuote('adr');
  const binance = useQuote('binance');
  const { fx } = useFx();
  const { history } = useHistory();
  const ws = useBinanceWs();

  // WS가 살아있으면 Binance 카드는 WS 가격 우선
  const binanceQuote = binance.quote && ws.wsPrice !== null && ws.connected
    ? { ...binance.quote, price: ws.wsPrice, tradedAt: new Date(ws.wsAt!).toISOString() }
    : binance.quote;

  const krxKrw = krx.quote?.price ?? null;
  const fxRate = fx?.rate ?? null;

  const premiumOf = (usd: number | undefined) =>
    usd !== undefined && fxRate !== null && krxKrw ? premiumPct(usdToKrwShare(usd, fxRate), krxKrw) : null;
  const premiums = [
    { label: 'ADR', value: premiumOf(adr.quote?.price) },
    { label: 'Binance', value: premiumOf(binanceQuote?.price) },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">SK하이닉스 멀티마켓 시세</h1>
          <p className="mt-1 text-sm text-zinc-500">KRX · NXT · NASDAQ ADR · Binance 선물 — 원화 환산 비교</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FxBar />
          <PremiumAlert premiums={premiums} />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuoteCard title="KRX" subtitle="000660" quote={krx.quote} stale={krx.stale} error={krx.error}
          fxRate={fxRate} krxKrw={krxKrw} showPremium={false} fetchedAt={krx.fetchedAt} />
        <QuoteCard title="NXT" subtitle="넥스트레이드" quote={nxt.quote} stale={nxt.stale} error={nxt.error}
          fxRate={fxRate} krxKrw={krxKrw} showPremium={true} fetchedAt={nxt.fetchedAt} />
        <QuoteCard title="ADR 환산" subtitle="NASDAQ SKHY ×10" quote={adr.quote} stale={adr.stale} error={adr.error}
          fxRate={fxRate} krxKrw={krxKrw} showPremium={true} fetchedAt={adr.fetchedAt} />
        <QuoteCard title="Binance 환산" subtitle={`SKHYUSDT 선물 ×10${ws.connected ? ' · LIVE' : ''}`}
          quote={binanceQuote} stale={binance.stale} error={binance.error}
          fxRate={fxRate} krxKrw={krxKrw} showPremium={true} fetchedAt={binance.fetchedAt} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          최근 원화 환산 비교 · 괴리율 (TSMC ADR 괴리율 동시 표시)
        </h2>
        <ComparisonChart history={history} />
        <p className="mt-2 text-xs text-zinc-600">
          NXT는 일봉 데이터가 제공되지 않아 차트에서 제외됩니다. ADR·Binance는 2026-07-10 상장 이후 데이터만 표시됩니다.
          TSMC 괴리율은 TSM ADR(1주=본주 5주, USD/TWD 환산)과 대만 본주 2330.TW의 같은 날짜 종가를 비교한 값으로,
          ADR 괴리율이 통상 어느 정도 수준인지 가늠하는 벤치마크입니다.
        </p>
      </section>
    </main>
  );
}
