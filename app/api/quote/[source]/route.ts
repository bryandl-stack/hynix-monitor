import { NextResponse } from 'next/server';
import { cached } from '@/lib/server-cache';
import { fetchKoreanQuotes } from '@/lib/sources/naver';
import { fetchAdrQuote } from '@/lib/sources/yahoo';
import { fetchFx } from '@/lib/sources/fx';
import { fetchBinanceQuote } from '@/lib/sources/binance';

export const dynamic = 'force-dynamic';

const TTL = { korean: 3_000, adr: 3_000, fx: 60_000, binance: 3_000 } as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ source: string }> },
) {
  const { source } = await params;
  try {
    switch (source) {
      case 'krx': {
        const r = await cached('korean', TTL.korean, fetchKoreanQuotes);
        return NextResponse.json({ data: r.data.krx, stale: r.stale, fetchedAt: r.fetchedAt });
      }
      case 'nxt': {
        const r = await cached('korean', TTL.korean, fetchKoreanQuotes);
        return NextResponse.json({ data: r.data.nxt, stale: r.stale, fetchedAt: r.fetchedAt });
      }
      case 'adr': {
        const r = await cached('adr', TTL.adr, fetchAdrQuote);
        return NextResponse.json(r);
      }
      case 'fx': {
        const r = await cached('fx', TTL.fx, fetchFx);
        return NextResponse.json({ data: r.data.current, stale: r.stale, fetchedAt: r.fetchedAt });
      }
      case 'binance': {
        const r = await cached('binance', TTL.binance, fetchBinanceQuote);
        return NextResponse.json(r);
      }
      default:
        return NextResponse.json({ error: `unknown source: ${source}` }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
