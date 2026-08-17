export type SourceId = 'krx' | 'nxt' | 'adr' | 'binance';
export type SessionState = 'open' | 'pre' | 'after' | 'closed';

export interface Quote {
  source: SourceId;
  price: number;            // 원통화 가격 (krx/nxt: KRW, adr/binance: USD)
  currency: 'KRW' | 'USD';
  prevClose: number;        // 원통화 기준 전일 종가
  changePct: number;        // 전일 대비 %
  tradedAt: string;         // ISO 8601
  volume?: number;
  // 아래 3개는 미국 시외(프리/애프터) 체결이 최신일 때만 채워진다. 이때 price는 시외가다.
  regularPrice?: number;
  regularChangePct?: number;
  regularTradedAt?: string;
}

export interface DailyPoint {
  date: string;             // YYYY-MM-DD
  close: number;
}
