const krw = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtKrw(n: number): string {
  return `${krw.format(Math.round(n))}원`;
}

export function fmtUsd(n: number): string {
  return `$${usd.format(n)}`;
}

export function fmtPct(n: number): string {
  const s = n.toFixed(2);
  return n > 0 ? `+${s}%` : `${s}%`;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
