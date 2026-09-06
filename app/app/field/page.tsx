'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Camera, CheckCircle2, ChevronRight, ClipboardCheck, Cloud, Flame, Home, Leaf, LoaderCircle, MapPin, Recycle, Route, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportDialog, type NewReport } from '@/components/report-dialog';

type FieldReport = {
  id: string;
  category: string;
  description?: string;
  lat: number;
  lng: number;
  place: string;
  status: string;
  image?: string;
  createdAt?: string;
};

const sampleTasks = [
  { id: 'task-1', title: '파쇄 신청 현장 확인', place: '풍산읍 괴정리', time: '오전 10:30', icon: Recycle, tone: 'bg-[#e8f3ee] text-[#2f705a]' },
  { id: 'task-2', title: '산림 인접 농가 위험 점검', place: '길안면 천지리', time: '오후 1:20', icon: Flame, tone: 'bg-[#fff0e8] text-[#c65c2c]' },
  { id: 'task-3', title: '영농부산물 발생량 조사', place: '와룡면 가구리', time: '오후 3:00', icon: Leaf, tone: 'bg-[#eff4dc] text-[#70852c]' },
];

function timeAgo(createdAt?: string) {
  if (!createdAt) return '방금 전';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / 1_440)}일 전`;
}

export default function FieldApp() {
  const [reportOpen, setReportOpen] = useState(false);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [syncState, setSyncState] = useState<'loading' | 'online' | 'offline'>('loading');
  const [notice, setNotice] = useState('');
  const reportsRef = useRef(reports);

  useEffect(() => { reportsRef.current = reports; }, [reports]);

  const loadReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports', { cache: 'no-store' });
      const result = await response.json() as { reports?: FieldReport[] };
      if (!response.ok || !result.reports) throw new Error('sync failed');
      setReports(result.reports);
      setSyncState('online');
    } catch {
      setSyncState('offline');
    }
  }, []);

  useEffect(() => {
    void loadReports();
    const interval = window.setInterval(() => void loadReports(), 5_000);
    return () => window.clearInterval(interval);
  }, [loadReports]);

  const saveReport = useCallback(async (report: NewReport) => {
    const form = new FormData();
    form.set('category', report.category);
    form.set('description', report.description);
    form.set('lat', String(report.lat));
    form.set('lng', String(report.lng));
    form.set('place', report.place);
    if (report.photo) form.set('photo', report.photo);
    const response = await fetch('/api/reports', { method: 'POST', body: form });
    const result = await response.json() as { report?: FieldReport; error?: string };
    if (!response.ok || !result.report) throw new Error(result.error || '현장 기록을 저장하지 못했습니다.');
    setReports((current) => [result.report!, ...current.filter((item) => item.id !== result.report!.id)]);
    setNotice('현장 기록이 관리자 상황판에 공유됐습니다.');
    window.setTimeout(() => setNotice(''), 3500);
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: 'create_field_record', title: '현장 기록 저장', description: '청년 농촌환경관리자의 현장 기록을 위치와 함께 클라우드에 저장합니다.',
        inputSchema: { type: 'object', properties: { category: { type: 'string' }, description: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, place: { type: 'string' } }, required: ['category', 'lat', 'lng', 'place'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const value = input as Partial<NewReport>;
          if (!value.category || typeof value.lat !== 'number' || typeof value.lng !== 'number' || !value.place) throw new Error('category, lat, lng, place가 필요합니다.');
          await saveReport({ category: value.category, description: value.description ?? '', lat: value.lat, lng: value.lng, place: value.place });
          return { saved: true, category: value.category, place: value.place, sharedWithAdmin: true };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'list_recent_field_records', title: '최근 현장 기록 조회', description: '클라우드에 공유된 최근 농촌환경관리 현장 기록을 조회합니다.',
        inputSchema: { type: 'object', properties: { limit: { type: 'number', minimum: 1, maximum: 10 } }, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
          const limit = Math.min(10, Math.max(1, Number((input as { limit?: number }).limit) || 5));
          return reportsRef.current.slice(0, limit).map(({ id, category, place, status, lat, lng }) => ({ id, category, place, status, lat, lng }));
        },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [saveReport]);

  return (
    <main className="min-h-dvh bg-[#dfe9e4] text-[#173f34]">
      <div className="mx-auto min-h-dvh w-full max-w-[520px] bg-[#f7faf8] shadow-[0_0_60px_rgba(20,60,49,.14)]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#123c31] px-5 text-white">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#d9f260] text-[#123c31]"><Leaf className="size-5" /></span><div><p className="font-extrabold">현장관리 앱</p><p className="text-xs text-white/55">청년 농촌환경관리자</p></div></div>
          <Link href="/admin" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/75">관리자 웹</Link>
        </header>

        {notice && <output className="fixed left-1/2 top-20 z-50 flex w-[calc(100%-2rem)] max-w-[488px] -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#173f34] px-4 py-3 text-sm font-bold text-white shadow-xl"><CheckCircle2 className="size-5 text-[#d9f260]" />{notice}</output>}

        <div className="space-y-5 px-4 pb-24 pt-5">
          <section className="flex items-start justify-between px-1"><div><p className="text-sm font-semibold text-[#648077]">2026년 9월 6일 일요일</p><h1 className="mt-1 text-[26px] font-black tracking-[-.04em]">오늘의 현장 업무</h1></div><span className={`mt-1 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${syncState === 'online' ? 'bg-[#e3f2ea] text-[#2e7059]' : 'bg-[#fff0e7] text-[#a95b35]'}`}>{syncState === 'loading' ? <LoaderCircle className="size-3.5 animate-spin" /> : <Cloud className="size-3.5" />}{syncState === 'online' ? '동기화됨' : syncState === 'offline' ? '연결 복구 중' : '연결 중'}</span></section>

          <section className="overflow-hidden rounded-[26px] bg-[#173f34] p-5 text-white shadow-[0_18px_38px_rgba(23,63,52,.18)]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#d9f260]"><Sparkles className="size-4" />현장 방문 즉시 기록</div>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-.035em]">사진과 위치를 한 번에<br />관리 데이터로 남기세요.</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">AI가 유형을 분류하고 관리자 상황판에 바로 공유합니다.</p>
            <Button className="mt-5 h-13 w-full rounded-2xl bg-[#d9f260] text-base font-extrabold text-[#173f34] hover:bg-[#e6fa86]" onClick={() => setReportOpen(true)}><Camera className="size-5" />사진으로 현장 기록</Button>
          </section>

          <section className="grid grid-cols-3 gap-2">
            {[{ label: '방문 예정', value: '4', unit: '곳' }, { label: '파쇄 접수', value: '3', unit: '건' }, { label: '위험 점검', value: '2', unit: '건' }].map((item) => <article key={item.label} className="rounded-2xl border border-[#dfe8e3] bg-white p-3 text-center"><p className="text-xs font-bold text-[#71877f]">{item.label}</p><p className="mt-2 text-2xl font-black">{item.value}<span className="ml-0.5 text-xs text-[#6f857d]">{item.unit}</span></p></article>)}
          </section>

          <section className="rounded-[24px] border border-[#dfe8e3] bg-white p-4 shadow-[0_10px_30px_rgba(23,63,52,.05)]">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="font-extrabold">오늘의 우선 업무</h2><p className="mt-0.5 text-xs text-[#789088]">위험도와 이동경로를 반영한 순서</p></div><Route className="size-5 text-[#4c7b6b]" /></div>
            <div className="space-y-1">{sampleTasks.map(({ id, title, place, time, icon: Icon, tone }) => <button key={id} className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-[#f5f8f6]"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{title}</strong><small className="mt-1 block text-xs text-[#778b84]"><MapPin className="mr-1 inline size-3" />{place} · {time}</small></span><ChevronRight className="size-4 text-[#9aaba5]" /></button>)}</div>
          </section>

          <section className="rounded-[24px] border border-[#dfe8e3] bg-white p-4 shadow-[0_10px_30px_rgba(23,63,52,.05)]">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="font-extrabold">최근 공유 기록</h2><p className="mt-0.5 text-xs text-[#789088]">관리자 웹과 동일한 클라우드 데이터</p></div><ClipboardCheck className="size-5 text-[#4c7b6b]" /></div>
            {reports.length ? <div className="space-y-1">{reports.slice(0, 4).map((report) => <div key={report.id} className="flex items-center gap-3 rounded-2xl p-2.5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#36715d]"><Leaf className="size-4" /></span><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{report.category}</strong><p className="mt-0.5 truncate text-xs text-[#7a8e87]">{report.place} · {timeAgo(report.createdAt)}</p></div><span className="rounded-full bg-[#eef4f1] px-2 py-1 text-xs font-bold text-[#55736a]">{report.status}</span></div>)}</div> : <div className="grid min-h-28 place-items-center rounded-2xl bg-[#f4f7f5] text-center text-sm text-[#71877f]">첫 현장 기록을 남겨보세요.</div>}
          </section>

          <section className="rounded-[22px] border border-[#dbe7e1] bg-[#edf4f1] p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-[#36715d]"><BriefcaseBusiness className="size-5" /></span><div><strong className="text-sm">오늘의 직무경력</strong><p className="mt-0.5 text-xs text-[#678078]">현장 데이터 {reports.length}건이 업무 실적으로 누적됐습니다.</p></div></div></section>
        </div>

        <nav aria-label="현장 앱 메뉴" className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-18 max-w-[520px] items-center justify-around border-t border-[#dbe5e0] bg-white/95 px-5 backdrop-blur">
          <button className="flex flex-col items-center gap-1 text-xs font-extrabold text-[#245b49]"><Home className="size-5" />업무</button>
          <button onClick={() => setReportOpen(true)} className="-mt-7 grid size-14 place-items-center rounded-2xl bg-[#d9f260] text-[#173f34] shadow-[0_8px_22px_rgba(23,63,52,.24)]"><Camera className="size-6" /><span className="sr-only">현장 기록</span></button>
          <Link href="/admin" className="flex flex-col items-center gap-1 text-xs font-bold text-[#71847d]"><ClipboardCheck className="size-5" />성과</Link>
        </nav>

        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} onSubmit={saveReport} />
      </div>
    </main>
  );
}
