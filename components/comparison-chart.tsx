'use client';

import type { HistoryPoint } from '@/lib/history';

export function ComparisonChart({ history }: { history: HistoryPoint[] | null }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-[#151a24] text-zinc-600">
      {history ? `${history.length}일 데이터 로드됨 (차트는 다음 태스크)` : '로딩 중…'}
    </div>
  );
}
