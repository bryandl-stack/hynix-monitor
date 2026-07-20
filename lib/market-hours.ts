import type { SessionState, SourceId } from '@/lib/types';

export type MarketId = 'krx' | 'nxt' | 'us' | 'binance';

/** SourceId(krx/nxt/adr/binance) → 개장시간 판단에 쓰는 MarketId */
export const MARKET_OF: Record<SourceId, MarketId> = { krx: 'krx', nxt: 'nxt', adr: 'us', binance: 'binance' };

/** 해당 타임존의 요일(0=일)과 자정 이후 경과 분을 구한다 */
function localParts(tz: string, now: Date): { weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    weekday: weekdays.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

const hm = (h: number, m: number) => h * 60 + m;

export function sessionAt(market: MarketId, now: Date): SessionState {
  if (market === 'binance') return 'open';

  const tz = market === 'us' ? 'America/New_York' : 'Asia/Seoul';
  const { weekday, minutes: t } = localParts(tz, now);
  if (weekday === 0 || weekday === 6) return 'closed';

  if (market === 'krx') {
    return t >= hm(9, 0) && t < hm(15, 30) ? 'open' : 'closed';
  }
  if (market === 'nxt') {
    if (t >= hm(8, 0) && t < hm(8, 50)) return 'pre';
    if (t >= hm(9, 0) && t < hm(15, 20)) return 'open';
    if (t >= hm(15, 30) && t < hm(20, 0)) return 'after';
    return 'closed';
  }
  // us
  if (t >= hm(4, 0) && t < hm(9, 30)) return 'pre';
  if (t >= hm(9, 30) && t < hm(16, 0)) return 'open';
  if (t >= hm(16, 0) && t < hm(20, 0)) return 'after';
  return 'closed';
}

const LABELS: Record<SessionState, string> = {
  open: '장중', pre: '프리마켓', after: '애프터마켓', closed: '장 마감',
};

export function sessionLabel(market: MarketId, s: SessionState): string {
  if (market === 'binance') return '24시간';
  if (market === 'nxt' && s === 'after') return '애프터마켓';
  return LABELS[s];
}
