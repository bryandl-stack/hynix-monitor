'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { crossedThreshold } from '@/lib/alerts';

const STORAGE_KEY = 'hynix-monitor:premium-alert-threshold';
const DEFAULT_THRESHOLD = 3;

interface PremiumInput {
  label: string;
  value: number | null;
}

function noopSubscribe() {
  return () => {};
}
function getPermissionSnapshot(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}
function getServerPermissionSnapshot(): NotificationPermission | 'unsupported' {
  return 'unsupported';
}

export function PremiumAlert({ premiums }: { premiums: PremiumInput[] }) {
  // Notification.permission은 서버에 존재하지 않는 브라우저 API라 useSyncExternalStore로
  // 하이드레이션 불일치 없이 마운트 후 실제 값을 읽는다.
  const permission = useSyncExternalStore(noopSubscribe, getPermissionSnapshot, getServerPermissionSnapshot);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [enabled, setEnabled] = useState(false);
  const prevValues = useRef<Record<string, number | null>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 서버에 없어 마운트 후 1회 하이드레이션이 필요
      setThreshold(Number(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(threshold));
  }, [threshold]);

  useEffect(() => {
    if (!enabled || permission !== 'granted') {
      for (const { label, value } of premiums) prevValues.current[label] = value;
      return;
    }
    for (const { label, value } of premiums) {
      const prev = prevValues.current[label] ?? null;
      if (crossedThreshold(prev, value, threshold)) {
        new Notification('SK하이닉스 괴리율 알림', {
          body: `${label} 괴리율이 ${value!.toFixed(2)}%로 임계치(±${threshold}%)를 넘었습니다.`,
        });
      }
      prevValues.current[label] = value;
    }
  }, [premiums, enabled, permission, threshold]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setEnabled(p === 'granted');
  };

  if (permission === 'unsupported') return null;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <label className="flex items-center gap-1">
        괴리율 알림 임계치
        <input
          id="premium-alert-threshold"
          name="premium-alert-threshold"
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          min={0.1}
          step={0.1}
          className="w-14 rounded border border-zinc-700 bg-[#0b0e14] px-1 py-0.5 text-zinc-200"
        />
        %
      </label>
      {permission === 'granted' ? (
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`rounded px-2 py-0.5 ${enabled ? 'bg-emerald-700 text-emerald-100' : 'bg-zinc-800 text-zinc-300'}`}
        >
          알림 {enabled ? 'ON' : 'OFF'}
        </button>
      ) : (
        <button type="button" onClick={requestPermission} className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
          알림 권한 요청
        </button>
      )}
    </div>
  );
}
