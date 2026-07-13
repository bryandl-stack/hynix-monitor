'use client';

import { useFx } from '@/hooks/use-quotes';

export function FxBar() {
  const { fx, stale } = useFx();
  const isWeekendRate = fx && new Date(fx.date + 'T00:00:00+09:00').getDay() === 5
    && [0, 6].includes(new Date().getDay());
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <span className="font-medium text-zinc-200">USD/KRW</span>
      <span className="tabular-nums text-zinc-100">{fx ? fx.rate.toLocaleString('ko-KR') : '—'}</span>
      <span className="text-xs">하나은행 고시 · {fx?.date ?? ''}</span>
      {isWeekendRate && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">주말 환율 동결</span>}
      {stale && <span className="text-xs text-amber-400">지연됨</span>}
    </div>
  );
}
