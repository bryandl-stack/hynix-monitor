import { NextResponse } from 'next/server';
import { cached } from '@/lib/server-cache';
import { mergeHistory } from '@/lib/history';
import { fetchKrxDaily } from '@/lib/sources/naver';
import { fetchAdrDaily } from '@/lib/sources/yahoo';
import { fetchFx } from '@/lib/sources/fx';
import { fetchBinanceDaily } from '@/lib/sources/binance';

export const dynamic = 'force-dynamic';

// 서버는 최대 기간(90일치)을 캐싱해두고, 클라이언트가 7D/30D/90D 토글로 잘라 쓴다.
const MAX_HISTORY_DAYS = 90;

export async function GET() {
  try {
    const r = await cached('history', 300_000, async () => {
      const [krx, adr, binance, fx] = await Promise.all([
        fetchKrxDaily(),
        fetchAdrDaily(),
        fetchBinanceDaily(),
        fetchFx(),
      ]);
      return mergeHistory(krx, adr, binance, fx.daily, MAX_HISTORY_DAYS);
    });
    return NextResponse.json(r);
  } catch (err) {
    console.error('[api/history] upstream fetch failed:', err);
    return NextResponse.json({ error: 'history unavailable' }, { status: 503 });
  }
}
