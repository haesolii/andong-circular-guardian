'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Camera, CheckCircle2, ChevronRight, Flame, Leaf, MapPin, Medal, Recycle, Sparkles, TrendingDown, Trophy, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KakaoMap, type MapReport } from '@/components/kakao-map';
import { IntroDialog } from '@/components/intro-dialog';
import { ReportDialog, type NewReport } from '@/components/report-dialog';

type Report = MapReport & { time: string; status: string; description?: string; image?: string };

const seedReports: Report[] = [
  { id: 1, category: '폐비닐', place: '풍산읍', time: '12분 전', status: '접수', lat: 36.579, lng: 128.575 },
  { id: 2, category: '과수 전정가지', place: '길안면', time: '34분 전', status: '배정', lat: 36.452, lng: 128.891 },
  { id: 3, category: '폐농약 용기', place: '와룡면', time: '1시간 전', status: '수거 중', lat: 36.621, lng: 128.763 },
  { id: 4, category: '불법소각', place: '임하면', time: '2시간 전', status: '처리 완료', lat: 36.516, lng: 128.832 },
  { id: 5, category: '고춧대', place: '녹전면', time: '3시간 전', status: '배정', lat: 36.741, lng: 128.772 },
  { id: 6, category: '폐비닐', place: '서후면', time: '4시간 전', status: '수거 중', lat: 36.617, lng: 128.659 },
  { id: 7, category: '볏짚', place: '남후면', time: '5시간 전', status: '접수', lat: 36.512, lng: 128.657 },
  { id: 8, category: '불법소각', place: '남선면', time: '6시간 전', status: '배정', lat: 36.523, lng: 128.768 },
  { id: 9, category: '폐농자재', place: '북후면', time: '어제', status: '수거 중', lat: 36.683, lng: 128.698 },
  { id: 10, category: '과수 전정가지', place: '일직면', time: '어제', status: '처리 완료', lat: 36.473, lng: 128.656 },
  { id: 11, category: '폐농약 용기', place: '예안면', time: '어제', status: '접수', lat: 36.661, lng: 128.887 },
  { id: 12, category: '불법소각', place: '도산면', time: '어제', status: '처리 완료', lat: 36.724, lng: 128.833 },
  { id: 13, category: '고춧대', place: '풍천면', time: '2일 전', status: '수거 중', lat: 36.556, lng: 128.506 },
  { id: 14, category: '폐비닐', place: '임동면', time: '2일 전', status: '배정', lat: 36.571, lng: 128.919 },
  { id: 15, category: '기타 농업부산물', place: '안기동', time: '2일 전', status: '접수', lat: 36.58, lng: 128.712 },
  { id: 16, category: '폐농자재', place: '송하동', time: '3일 전', status: '처리 완료', lat: 36.566, lng: 128.686 },
  { id: 17, category: '과수 전정가지', place: '강남동', time: '3일 전', status: '수거 중', lat: 36.548, lng: 128.731 },
  { id: 18, category: '불법소각', place: '옥동', time: '3일 전', status: '배정', lat: 36.562, lng: 128.699 },
  { id: 19, category: '볏짚', place: '풍산읍', time: '4일 전', status: '처리 완료', lat: 36.594, lng: 128.588 },
  { id: 20, category: '폐농약 용기', place: '길안면', time: '4일 전', status: '수거 중', lat: 36.438, lng: 128.903 },
];

const categoryData = [
  { name: '폐비닐', value: 31 }, { name: '전정가지', value: 26 }, { name: '폐농약용기', value: 19 }, { name: '고춧대', value: 15 }, { name: '불법소각', value: 11 }, { name: '기타', value: 18 },
];
const villageRanking = [
  { rank: 1, name: '길안면', score: 92, collected: '820kg', color: '#d9f260' },
  { rank: 2, name: '와룡면', score: 87, collected: '710kg', color: '#b7d7ca' },
  { rank: 3, name: '풍산읍', score: 81, collected: '640kg', color: '#e8c98a' },
];

export default function Home() {
  const [reports, setReports] = useState<Report[]>(seedReports);
  const [reportOpen, setReportOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [filter, setFilter] = useState('전체');
  const [mobileNav, setMobileNav] = useState('dashboard');
  const [notice, setNotice] = useState('');
  const reportsRef = useRef(reports);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('andong-environment-reports-v2');
      if (stored) setReports(JSON.parse(stored) as Report[]);
      if (sessionStorage.getItem('andong-tour-seen')) setIntroOpen(false);
    } catch { /* 발표 환경에서 저장소가 막혀도 시연 데이터로 계속 동작 */ }
  }, []);

  useEffect(() => {
    reportsRef.current = reports;
    try { localStorage.setItem('andong-environment-reports-v2', JSON.stringify(reports)); } catch { /* noop */ }
  }, [reports]);

  const addReport = useCallback((newReport: NewReport) => {
    const report: Report = { ...newReport, id: Date.now(), time: '방금 전', status: '접수' };
    setReports((current) => [report, ...current]);
    setFilter('전체');
    setNotice(`${newReport.category} 신고가 환경관리단에 접수되었습니다.`);
    window.setTimeout(() => setNotice(''), 3500);
    return report;
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: 'create_environment_report', title: '환경 신고 접수', description: '안동 환경순환관리단에 새 현장 신고를 접수하고 지도와 현황판을 갱신합니다.',
        inputSchema: { type: 'object', properties: { category: { type: 'string' }, description: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, place: { type: 'string' } }, required: ['category', 'lat', 'lng', 'place'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const value = input as Partial<NewReport>;
          if (!value.category || typeof value.lat !== 'number' || typeof value.lng !== 'number' || !value.place) throw new Error('category, lat, lng, place가 필요합니다.');
          const created = addReport({ category: value.category, description: value.description ?? '', lat: value.lat, lng: value.lng, place: value.place });
          return { id: created.id, status: created.status, category: created.category, place: created.place };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'get_environment_summary', title: '환경 현황 조회', description: '현재 화면의 신고 건수와 주요 순환 성과를 읽습니다.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() { return { reports: 120 + Math.max(0, reportsRef.current.length - seedReports.length), recycledTons: 2.8, carbonReductionTco2e: 1.36, jobs: 32 }; },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [addReport]);

  const filteredReports = useMemo(() => {
    if (filter === '전체') return reports;
    if (filter === '폐농자재') return reports.filter((report) => ['폐비닐', '폐농약 용기', '폐농자재'].includes(report.category));
    if (filter === '농업부산물') return reports.filter((report) => ['농업부산물', '과수 전정가지', '볏짚', '고춧대', '기타 농업부산물'].includes(report.category));
    return reports.filter((report) => report.category === '불법소각');
  }, [filter, reports]);

  const reportCount = 120 + Math.max(0, reports.length - seedReports.length);
  const navigateMobile = (target: 'dashboard' | 'reports' | 'collection' | 'performance') => {
    setMobileNav(target);
    if (target === 'dashboard') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const reportKind = (category: string) => {
    if (category === '불법소각') return 'burning';
    if (['농업부산물', '과수 전정가지', '볏짚', '고춧대', '기타 농업부산물'].includes(category)) return 'byproduct';
    return 'material';
  };
  const closeIntro = (open: boolean) => {
    setIntroOpen(open);
    if (!open) {
      try { window.sessionStorage?.setItem('andong-tour-seen', '1'); } catch { /* 저장소가 없어도 안내창은 정상적으로 닫는다 */ }
    }
  };

  return (
    <main className="min-h-screen bg-background pb-8 text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#123c31]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#d9f260] text-[#123c31] shadow-[0_7px_18px_rgba(217,242,96,.18)]"><Leaf className="size-5" strokeWidth={2.4} /></span><div><p className="text-[17px] font-bold tracking-[-0.02em]">안동 순환지킴이</p><p className="text-xs text-white/60">1마을 2세대 환경관리 플랫폼</p></div></div>
          <Tabs defaultValue="dashboard" className="hidden md:flex"><TabsList className="h-10 bg-white/8 p-1"><TabsTrigger value="dashboard" className="px-4 text-white/65 data-active:bg-white data-active:text-[#123c31]">현황판</TabsTrigger><TabsTrigger value="reports" className="px-4 text-white/65 data-active:bg-white data-active:text-[#123c31]" onClick={() => document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' })}>신고 관리</TabsTrigger><TabsTrigger value="performance" className="px-4 text-white/65 data-active:bg-white data-active:text-[#123c31]" onClick={() => document.getElementById('performance')?.scrollIntoView({ behavior: 'smooth' })}>성과</TabsTrigger></TabsList></Tabs>
          <Button className="h-10 rounded-xl bg-[#d9f260] px-4 font-bold text-[#123c31] hover:bg-[#e6fa86]" onClick={() => setReportOpen(true)}><Camera /><span className="hidden sm:inline">사진으로 신고</span><span className="sm:hidden">신고</span></Button>
        </div>
      </header>

      {notice && <div role="status" className="fixed right-4 top-20 z-50 flex max-w-sm items-center gap-3 rounded-2xl bg-[#173f34] px-4 py-3 text-sm font-bold text-white shadow-2xl"><CheckCircle2 className="size-5 text-[#d9f260]" />{notice}</div>}

      <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 sm:py-7">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><h1 className="text-2xl font-extrabold tracking-[-0.04em] text-[#173f34] sm:text-[32px]">오늘의 안동 환경 현황</h1><div className="flex items-center gap-3"><Button variant="outline" className="rounded-xl" onClick={() => setIntroOpen(true)}><Sparkles />자동 시연 보기</Button><p className="hidden text-sm text-muted-foreground lg:block">2026년 9월 4일 · 최근 업데이트 2분 전</p></div></div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: '누적 환경 신고', value: String(reportCount), unit: '건', change: '+12%', icon: Camera },
            { label: '자원화 완료', value: '2.8', unit: '톤', change: '74%', icon: Recycle },
            { label: '소각 위험 차단', value: '11', unit: '건', change: '이번 달', icon: Flame },
            { label: '참여 일자리', value: '32', unit: '명', change: '2세대', icon: Users },
          ].map(({ label, value, unit, change, icon: Icon }) => <article key={label} className="group rounded-2xl border bg-card p-4 shadow-[0_10px_30px_rgba(14,55,43,.04)] sm:p-5"><div className="mb-5 flex items-start justify-between"><span className="grid size-9 place-items-center rounded-xl bg-[#eaf3ef] text-[#36715d] group-hover:bg-[#d9f260] group-hover:text-[#123c31]"><Icon className="size-[18px]" /></span><span className="rounded-full bg-[#f2f6f4] px-2 py-1 text-xs font-semibold text-[#5b766d]">{change}</span></div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-1 text-[28px] font-extrabold tracking-[-0.04em] text-[#173f34]">{value}<span className="ml-1 text-sm font-semibold text-[#658077]">{unit}</span></p></article>)}
        </div>

        <div id="reports" className="grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,.8fr)]">
          <article className="overflow-hidden rounded-[22px] border bg-card shadow-[0_14px_45px_rgba(14,55,43,.07)]">
            <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div><div className="flex items-center gap-2"><MapPin className="size-5 text-[#e7723c]" /><h2 className="text-lg font-bold tracking-tight text-[#173f34]">실시간 환경 신고 지도</h2></div><p className="mt-1 text-sm text-muted-foreground">신고가 집중된 지역을 한눈에 확인합니다.</p></div><div className="flex gap-2 overflow-x-auto">{['전체', '폐농자재', '농업부산물', '불법소각'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? 'bg-[#173f34] text-white' : 'bg-[#f1f5f3] text-[#557068]'}`}>{item}</button>)}</div></div>
            <KakaoMap reports={filteredReports} />
          </article>

          <div className="flex flex-col gap-5">
            <article className="rounded-[22px] border bg-[#173f34] p-5 text-white shadow-[0_14px_40px_rgba(14,55,43,.16)] sm:p-6"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="size-5 text-[#d9f260]" /><h2 className="text-lg font-bold">이번 달 순환 성과</h2></div><BarChart3 className="size-5 text-white/45" /></div><div className="rounded-2xl bg-white/7 p-4"><div className="mb-3 flex items-end justify-between"><p className="text-sm text-white/65">탄소감축 추정량</p><p className="text-2xl font-extrabold text-[#d9f260]">1.36 <span className="text-sm">tCO₂e</span></p></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-[#d9f260]" /></div><p className="mt-2 text-xs text-white/45">월간 목표 2.0 tCO₂e의 68% · 시뮬레이션 추정치</p></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/55">재활용 전환율</p><p className="mt-1 text-xl font-bold">74%</p></div><div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-white/55">소각 ZERO 마을</p><p className="mt-1 text-xl font-bold">2곳</p></div></div></article>
            <article id="collection" className="flex-1 scroll-mt-24 rounded-[22px] border bg-card p-5 shadow-[0_10px_35px_rgba(14,55,43,.05)] sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#173f34]">최근 신고·수거</h2><p className="text-sm text-muted-foreground">현장 접수와 수거 진행 상황</p></div><button aria-label="신고 전체 보기" className="grid size-9 place-items-center rounded-xl bg-[#eef4f1] text-[#36715d]"><ChevronRight className="size-4" /></button></div><div className="space-y-1">{reports.slice(0, 6).map((report) => { const kind = reportKind(report.category); return <div key={report.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-[#f5f8f6]"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${kind === 'burning' ? 'bg-[#fff0e8] text-[#d35c28]' : kind === 'byproduct' ? 'bg-[#eef4dc] text-[#698026]' : 'bg-[#e7f3ed] text-[#36715d]'}`}>{kind === 'burning' ? <Flame className="size-5" /> : kind === 'byproduct' ? <Leaf className="size-5" /> : <Recycle className="size-5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#244a3f]">{report.category}</p><p className="text-xs text-muted-foreground">{report.place} · {report.time}</p></div><span className="rounded-full bg-[#eef4f1] px-2.5 py-1 text-xs font-bold text-[#4f6d63]">{report.status}</span></div>; })}</div></article>
          </div>
        </div>

        <section id="performance" className="mt-5 grid scroll-mt-24 gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <article className="rounded-[22px] border bg-card p-5 shadow-[0_10px_35px_rgba(14,55,43,.05)] sm:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#173f34]">무엇이 가장 많이 신고됐을까요?</h2><p className="mt-1 text-sm text-muted-foreground">최근 6개월 품목별 신고 120건</p></div><span className="rounded-xl bg-[#eef4f1] p-2 text-[#36715d]"><BarChart3 className="size-5" /></span></div><div className="flex h-[285px] items-end gap-2 border-b border-[#dfe8e3] px-1 pt-8 sm:gap-4">{categoryData.map((entry, index) => <div key={entry.name} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><span className="mb-2 text-xs font-extrabold text-[#4d6a60]">{entry.value}</span><div className={`mx-auto w-full max-w-16 rounded-t-xl ${index === 0 ? 'bg-[#e7723c]' : index === 1 ? 'bg-[#36715d]' : 'bg-[#8eb2a3]'}`} style={{ height: `${(entry.value / 34) * 100}%` }} /><span className="mt-2 truncate text-[11px] font-semibold text-[#60786f] sm:text-xs">{entry.name}</span></div>)}</div></article>
          <article className="rounded-[22px] border bg-card p-5 shadow-[0_10px_35px_rgba(14,55,43,.05)] sm:p-6"><div className="mb-5 flex items-center gap-2"><Trophy className="size-5 text-[#ba8c20]" /><div><h2 className="text-lg font-bold text-[#173f34]">소각 ZERO 마을</h2><p className="text-sm text-muted-foreground">수거·참여·소각감소 종합점수</p></div></div><div className="space-y-3">{villageRanking.map((village) => <div key={village.name} className="flex items-center gap-3 rounded-2xl border bg-[#f8faf8] p-4"><span className="grid size-10 place-items-center rounded-xl font-extrabold text-[#173f34]" style={{ background: village.color }}>{village.rank}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><strong>{village.name}</strong><span className="text-sm font-extrabold text-[#36715d]">{village.score}점</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe8e3]"><div className="h-full rounded-full bg-[#36715d]" style={{ width: `${village.score}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">자원화 {village.collected}</p></div></div>)}</div></article>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border bg-[#e9f3ee] p-5"><Users className="mb-5 size-6 text-[#36715d]" /><p className="text-sm font-bold text-[#5b766d]">노인 환경지킴이</p><p className="mt-1 text-3xl font-extrabold text-[#173f34]">26명</p><p className="mt-3 text-sm text-[#617a71]">마을 현장 발견·수거·안전 확인</p></article>
          <article className="rounded-2xl border bg-[#eaf2f8] p-5"><Medal className="mb-5 size-6 text-[#3a7294]" /><p className="text-sm font-bold text-[#5c7483]">청년 코디네이터</p><p className="mt-1 text-3xl font-extrabold text-[#173f34]">6명</p><p className="mt-3 text-sm text-[#617681]">3~5개 마을 데이터·배정 관리</p></article>
          <article className="rounded-2xl border bg-[#fff1e8] p-5"><TrendingDown className="mb-5 size-6 text-[#d16432]" /><p className="text-sm font-bold text-[#92634d]">불법소각 감소 추정</p><p className="mt-1 text-3xl font-extrabold text-[#173f34]">31%</p><p className="mt-3 text-sm text-[#806b61]">시범사업 전후 시뮬레이션 기준</p></article>
        </section>
      </section>

      <nav aria-label="모바일 주요 메뉴" className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-white/60 bg-white/95 p-2 shadow-[0_15px_45px_rgba(14,55,43,.18)] backdrop-blur md:hidden">
        {[
          { id: 'dashboard' as const, label: '현황', icon: BarChart3 },
          { id: 'reports' as const, label: '지도', icon: MapPin },
        ].map(({ id, label, icon: Icon }) => <button key={id} aria-current={mobileNav === id ? 'page' : undefined} onClick={() => navigateMobile(id)} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition ${mobileNav === id ? 'bg-[#e8ecea] font-bold text-[#205344]' : 'font-semibold text-[#71847d]'}`}><Icon className="size-5" />{label}</button>)}
        <button onClick={() => setReportOpen(true)} className="-mt-7 grid size-14 place-items-center rounded-2xl bg-[#d9f260] text-[#173f34] shadow-[0_8px_20px_rgba(23,63,52,.25)]"><Camera className="size-6" /><span className="sr-only">신고하기</span></button>
        {[
          { id: 'collection' as const, label: '수거', icon: Recycle },
          { id: 'performance' as const, label: '성과', icon: Users },
        ].map(({ id, label, icon: Icon }) => <button key={id} aria-current={mobileNav === id ? 'page' : undefined} onClick={() => navigateMobile(id)} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition ${mobileNav === id ? 'bg-[#e8ecea] font-bold text-[#205344]' : 'font-semibold text-[#71847d]'}`}><Icon className="size-5" />{label}</button>)}
      </nav>

      {introOpen && <IntroDialog open onOpenChange={closeIntro} onStartReport={() => setReportOpen(true)} />}
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} onSubmit={addReport} />
    </main>
  );
}
