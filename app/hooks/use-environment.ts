'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiUrl,
  villages,
  demoVerifications,
  type Verification,
  type AnalysisReport,
  type Task,
  type Village,
} from '@/lib/environment-data';
export function useEnvironment() {
  const [records, setRecords] = useState<Verification[]>(demoVerifications);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [inputs, setInputs] = useState<Village[]>(villages);
  const [sync, setSync] = useState<'connecting' | 'online' | 'offline'>(
    'connecting',
  );
  const [lastSync, setLastSync] = useState('');
  const alive = useRef(true);
  const requestCounter = useRef(0);
  const refresh = useCallback(async () => {
    const sequence = ++requestCounter.current;
    try {
      const res = await fetch(apiUrl('/api/environment'), {
        cache: 'no-store',
      });
      const body = (await res.json()) as {
        records: Verification[];
        tasks: Task[];
        reports: AnalysisReport[];
        inputs: Array<{ id: string; area: number; coefficient: number }> | null;
        error?: string;
      };
      if (!res.ok || !Array.isArray(body.records)) throw new Error(body.error);
      if (!alive.current || sequence !== requestCounter.current) return;
      setRecords([...body.records, ...demoVerifications]);
      setTasks(body.tasks);
      setReports(body.reports);
      setInputs(
        villages.map((v) => ({
          ...v,
          ...body.inputs?.find((i: { id: string }) => i.id === v.id),
        })),
      );
      setSync('online');
      setLastSync(
        new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    } catch {
      if (alive.current && sequence === requestCounter.current)
        setSync('offline');
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      alive.current = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  const mutate = useCallback(
    async (payload: Record<string, unknown> | FormData) => {
      const form = payload instanceof FormData;
      const res = await fetch(apiUrl('/api/environment'), {
        method: 'POST',
        headers: form ? undefined : { 'Content-Type': 'application/json' },
        body: form ? payload : JSON.stringify(payload),
      });
      const result = (await res.json()) as {
        saved: boolean;
        data: unknown;
        record?: Verification;
        error?: string;
      };
      if (!res.ok) throw new Error(result.error || '저장하지 못했습니다.');
      await refresh();
      return result;
    },
    [refresh],
  );
  return { records, tasks, reports, inputs, sync, lastSync, refresh, mutate };
}
