import { NextResponse } from 'next/server';
import { cached } from '@/lib/server-cache';
import { mergeHistory } from '@/lib/history';
import { fetchKrxDaily } from '@/lib/sources/naver';
import { fetchAdrDaily } from '@/lib/sources/yahoo';
import { fetchFx } from '@/lib/sources/fx';
import { fetchBinanceDaily } from '@/lib/sources/binance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const r = await cached('history', 300_000, async () => {
      const [krx, adr, binance, fx] = await Promise.all([
        fetchKrxDaily(),
        fetchAdrDaily(),
        fetchBinanceDaily(),
        fetchFx(),
      ]);
      return mergeHistory(krx, adr, binance, fx.daily, 30);
    });
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
