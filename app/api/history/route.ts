import { NextResponse } from 'next/server';
import { cached } from '@/lib/server-cache';
import { mergeHistory, type TsmcDaily } from '@/lib/history';
import { fetchKrxDaily } from '@/lib/sources/naver';
import { fetchDaily } from '@/lib/sources/yahoo';
import { fetchFx } from '@/lib/sources/fx';
import { fetchBinanceDaily } from '@/lib/sources/binance';

export const dynamic = 'force-dynamic';

// 서버는 최대 기간(90일치)을 캐싱해두고, 클라이언트가 7D/30D/90D 토글로 잘라 쓴다.
const MAX_HISTORY_DAYS = 90;

/** TSMC는 참고용 벤치마크라 실패해도 SK하이닉스 차트는 그대로 그린다 */
function fetchTsmc(): Promise<TsmcDaily | undefined> {
  return Promise.all([fetchDaily('2330.TW'), fetchDaily('TSM'), fetchDaily('TWD=X')])
    .then(([tw, adr, fx]) => ({ tw, adr, fx }))
    .catch((err) => {
      console.error('[api/history] TSMC 데이터 실패(무시하고 진행):', err);
      return undefined;
    });
}

export async function GET() {
  try {
    const r = await cached('history', 300_000, async () => {
      const [krx, adr, binance, fx, tsmc] = await Promise.all([
        fetchKrxDaily(),
        fetchDaily('SKHY'),
        fetchBinanceDaily(),
        fetchFx(),
        fetchTsmc(),
      ]);
      return mergeHistory(krx, adr, binance, fx.daily, MAX_HISTORY_DAYS, tsmc);
    });
    return NextResponse.json(r);
  } catch (err) {
    console.error('[api/history] upstream fetch failed:', err);
    return NextResponse.json({ error: 'history unavailable' }, { status: 503 });
  }
}
