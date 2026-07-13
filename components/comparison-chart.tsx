'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  LineSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { HistoryPoint } from '@/lib/history';

const SERIES = [
  { key: 'krxKrw', label: 'KRX', color: '#e8eaed' },
  { key: 'adrKrw', label: 'ADR 환산', color: '#f0a44b' },
  { key: 'binanceKrw', label: 'Binance 환산', color: '#7c6cf0' },
] as const;

function formatWon(v: number): string {
  return `${Math.round(v / 10000).toLocaleString('ko-KR')}만`;
}

function toLine(history: HistoryPoint[], key: (typeof SERIES)[number]['key']): LineData[] {
  return history
    .filter((p) => p[key] !== null)
    .map((p) => ({
      time: (Date.parse(p.date + 'T00:00:00Z') / 1000) as UTCTimestamp,
      value: p[key] as number,
    }));
}

export function ComparisonChart({ history }: { history: HistoryPoint[] | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current || !history) return;
    const container = ref.current;
    const tooltip = tooltipRef.current;

    const chart = createChart(container, {
      height: 320,
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
      localization: {
        priceFormatter: (v: number) => formatWon(v),
      },
      autoSize: true,
    });
    chartRef.current = chart;

    const seriesApis: { key: (typeof SERIES)[number]['key']; label: string; color: string; api: ISeriesApi<'Line'> }[] = [];
    for (const s of SERIES) {
      const series = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        title: s.label,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      series.setData(toLine(history, s.key));
      seriesApis.push({ ...s, api: series });
    }
    chart.timeScale().fitContent();

    // Custom tooltip: one readout listing every series at the hovered X (dataviz: "one
    // tooltip, every series" — the pointer doesn't have to land on a specific line).
    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!tooltip) return;
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.opacity = '0';
        return;
      }

      const rows = seriesApis
        .map(({ label, color, api }) => {
          const point = param.seriesData.get(api) as LineData | undefined;
          if (!point || typeof point.value !== 'number') return null;
          return { label, color, value: point.value };
        })
        .filter((r): r is { label: string; color: string; value: number } => r !== null);

      if (rows.length === 0) {
        tooltip.style.opacity = '0';
        return;
      }

      tooltip.replaceChildren();
      const dateLabel = document.createElement('div');
      dateLabel.className = 'mb-1 text-[10px] text-zinc-500';
      dateLabel.textContent = String(param.time);
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
        value.textContent = formatWon(row.value);
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
    };
  }, [history]);

  if (!history) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-zinc-800 bg-[#151a24] text-zinc-600">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#151a24] p-3">
      <div className="mb-2 flex gap-4 text-xs">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-zinc-400">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <div ref={ref} className="h-80 w-full" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-10 rounded-md border border-zinc-700 bg-[#1c2230] px-2.5 py-2 opacity-0 shadow-lg transition-opacity duration-75"
        />
      </div>
    </div>
  );
}
