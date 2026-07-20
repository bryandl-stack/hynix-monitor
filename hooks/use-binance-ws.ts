'use client';

import { useEffect, useRef, useState } from 'react';
import { BINANCE_WS_URL } from '@/lib/sources/binance';
import { nextBackoffMs } from '@/lib/backoff';

/** Binance aggTrade 구독. 1초 스로틀 렌더, 지수 백오프 재연결 */
export function useBinanceWs() {
  const [wsPrice, setWsPrice] = useState<number | null>(null);
  const [wsAt, setWsAt] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const latest = useRef<{ p: number; t: number } | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryMs = 1_000;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const flush = setInterval(() => {
      if (latest.current) {
        setWsPrice(latest.current.p);
        setWsAt(latest.current.t);
        latest.current = null;
      }
    }, 1_000);

    const connect = () => {
      ws = new WebSocket(BINANCE_WS_URL);
      ws.onopen = () => { setConnected(true); retryMs = 1_000; };
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data as string) as { p: string; T: number };
        latest.current = { p: Number(m.p), t: m.T };
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) {
          retryTimer = setTimeout(connect, retryMs);
          retryMs = nextBackoffMs(retryMs);
        }
      };
      ws.onerror = () => ws?.close();
    };
    connect();

    return () => {
      closed = true;
      clearInterval(flush);
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);

  return { wsPrice, wsAt, connected };
}
