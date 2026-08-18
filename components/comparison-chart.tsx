'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart,
  LineSeries,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
  type BusinessDay,
} from 'lightweight-charts';
import type { HistoryPoint } from '@/lib/history';

type SeriesKey =
  | 'krxKrw'
  | 'adrKrw'
  | 'binanceKrw'
  | 'adrPremiumPct'
  | 'binancePremiumPct'
  | 'tsmcPremiumPct';

function formatWon(v: number): string {
  return `${Math.round(v / 10000).toLocaleString('ko-KR')}만`;
}

function formatPct(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/** BusinessDay 객체 → "YYYY-MM-DD" 문자열 */
function formatChartDate(t: Time): string {
  if (typeof t === 'string') return t;
  if (typeof t === 'number') return new Date(t * 1000).toISOString().slice(0, 10);
  // BusinessDay: { year, month, day }
  return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
}

interface SeriesConfig {
  key: SeriesKey;
  label: string;
  color: string;
  pane: number;
  format: (v: number) => string;
}

const PRICE_SERIES: SeriesConfig[] = [
  { key: 'krxKrw', label: 'KRX', color: '#e8eaed', pane: 0, format: formatWon },
  { key: 'adrKrw', label: 'ADR 환산', color: '#f0a44b', pane: 0, format: formatWon },
  { key: 'binanceKrw', label: 'Binance 환산', color: '#7c6cf0', pane: 0, format: formatWon },
];

// 하단 패널: 모두 "본국 정규시장 대비 %"라 서로 다른 종목이어도 같은 축에서 비교된다.
const PREMIUM_SERIES: SeriesConfig[] = [
  { key: 'adrPremiumPct', label: 'ADR (vs KRX)', color: '#f0a44b', pane: 1, format: formatPct },
  { key: 'binancePremiumPct', label: 'Binance (vs KRX)', color: '#7c6cf0', pane: 1, format: formatPct },
  { key: 'tsmcPremiumPct', label: 'TSMC ADR (vs 대만 본주)', color: '#4bbf8f', pane: 1, format: formatPct },
];

const ALL_SERIES = [...PRICE_SERIES, ...PREMIUM_SERIES];

const PERIODS = [
  { key: '7', label: '7D', days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: '90', label: '90D', days: 90 },
] as const;

function toLine(history: HistoryPoint[], key: SeriesKey): LineData[] {
  return history
    .filter((p) => p[key] !== null)
    .map((p) => {
      const [year, month, day] = p.date.split('-').map(Number);
      return {
        time: { year, month, day } as BusinessDay,
        value: p[key] as number,
      };
    });
}

export function ComparisonChart({ history }: { history: HistoryPoint[] | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesApisRef = useRef<(SeriesConfig & { api: ISeriesApi<'Line'> })[]>([]);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('30');

  const visibleHistory = useMemo(() => {
    if (!history) return null;
    const days = PERIODS.find((p) => p.key === period)!.days;
    return history.slice(-days);
  }, [history, period]);

  // 차트/시리즈는 마운트 시 한 번만 생성 (history 폴링마다 재생성하지 않는다)
  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    const tooltip = tooltipRef.current;

    const chart = createChart(container, {
      height: 420,
      layout: { background: { color: 'transparent' }, textColor: '#8b93a7' },
      grid: {
        vertLines: { color: 'rgba(139,147,167,0.08)' },
        horzLines: { color: 'rgba(139,147,167,0.08)' },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: 'rgba(139,147,167,0.35)', width: 1, labelBackgroundColor: '#2a3140' },
        horzLine: { visible: false, labelVisible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;

    const seriesApis: (SeriesConfig & { api: ISeriesApi<'Line'> })[] = [];
    for (const s of ALL_SERIES) {
      const series = chart.addSeries(
        LineSeries,
        {
          color: s.color,
          lineWidth: 2,
          title: s.label,
          priceLineVisible: false,
          lastValueVisible: true,
          priceFormat: { type: 'custom', minMove: 0.01, formatter: s.format },
        },
        s.pane,
      );
      if (s.key === 'adrPremiumPct') {
        series.createPriceLine({
          price: 0,
          color: 'rgba(139,147,167,0.3)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: '',
        });
      }
      seriesApis.push({ ...s, api: series });
    }
    seriesApisRef.current = seriesApis;
    chart.panes()[1]?.setHeight(160);

    // Custom tooltip: one readout listing every series at the hovered X (dataviz: "one
    // tooltip, every series" — the pointer doesn't have to land on a specific line).
    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!tooltip) return;
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.opacity = '0';
        return;
      }

      const rows = seriesApisRef.current
        .map(({ label, color, format, api }) => {
          const point = param.seriesData.get(api) as LineData | undefined;
          if (!point || typeof point.value !== 'number') return null;
          return { label, color, value: point.value, format };
        })
        .filter((r): r is { label: string; color: string; value: number; format: (v: number) => string } => r !== null);

      if (rows.length === 0) {
        tooltip.style.opacity = '0';
        return;
      }

      tooltip.replaceChildren();
      const dateLabel = document.createElement('div');
      dateLabel.className = 'mb-1 text-[10px] text-zinc-500';
      dateLabel.textContent = formatChartDate(param.time);
      tooltip.appendChild(dateLabel);

      for (const row of rows) {
        const line = document.createElement('div');
        line.className = 'flex items-center gap-1.5 whitespace-nowrap text-xs';

        const key = document.createElement('span');
        key.className = 'inline-block h-0.5 w-3';
        key.style.backgroundColor = row.color;
        line.appendChild(key);

        const value = document.createElement('span');
        value.className = 'font-medium text-zinc-100 tabular-nums';
        value.textContent = row.format(row.value);
        line.appendChild(value);

        const name = document.createElement('span');
        name.className = 'text-zinc-500';
        name.textContent = row.label;
        line.appendChild(name);

        tooltip.appendChild(line);
      }

      tooltip.style.opacity = '1';
      const containerWidth = container.clientWidth;
      const tooltipWidth = tooltip.offsetWidth || 140;
      const margin = 12;
      let left = param.point.x + margin;
      if (left + tooltipWidth > containerWidth) {
        left = param.point.x - tooltipWidth - margin;
      }
      tooltip.style.left = `${Math.max(0, left)}px`;
      tooltip.style.top = '8px';
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesApisRef.current = [];
    };
  }, []);

  // history/기간이 바뀔 때는 기존 시리즈의 데이터만 갱신 (차트 재생성 없음)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !visibleHistory) return;
    for (const s of seriesApisRef.current) {
      s.api.setData(toLine(visibleHistory, s.key));
    }
    chart.timeScale().fitContent();
  }, [visibleHistory]);

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#151a24] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="text-zinc-600">원화 환산</span>
          {PRICE_SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-zinc-400">
              <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-600">괴리율</span>
          {PREMIUM_SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-zinc-400">
              <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded px-2 py-0.5 text-xs ${
                period === p.key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <div ref={ref} className="h-[420px] w-full" />
        {!history && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#151a24] text-zinc-600">
            로딩 중…
          </div>
        )}
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-10 rounded-md border border-zinc-700 bg-[#1c2230] px-2.5 py-2 opacity-0 shadow-lg transition-opacity duration-75"
        />
      </div>
    </div>
  );
}
