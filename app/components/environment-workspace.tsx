'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  Layers,
  Leaf,
  Map,
  PanelLeftClose,
  Sprout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import {
  villages,
  districts,
  demoVerifications,
  predictTons,
  summarize,
  byproduct,
} from '@/lib/environment-data';
import { useEnvironment } from '@/hooks/use-environment';
import {
  PredictPanel,
  RecordsPanel,
  ReportPanel,
  CareerPanel,
} from '@/components/environment-panels';
import { EnvironmentMap } from '@/components/environment-map';
import { ProductTour } from '@/components/product-tour';
const navigation = [
  { id: 'overview', label: '대시보드', icon: BarChart3 },
  { id: 'predict', label: '발생 예측', icon: Sprout, tag: 'PREDICT' },
  { id: 'map', label: '환경 지도', icon: Map, tag: 'MAP' },
  { id: 'data', label: '현장검증 DB', icon: Database },
  { id: 'report', label: '분석 보고서', icon: FileText, tag: 'REPORT' },
  {
    id: 'career',
    label: '나의 직무경력',
    icon: BriefcaseBusiness,
    tag: 'CAREER',
  },
];
export function Brand({ field = false }: { field?: boolean }) {
  return (
    <div className="brand">
      <Leaf size={25} />
      <strong>
        들녘<span>{field ? 'field' : 'workspace'}</span>
      </strong>
    </div>
  );
}
export function EnvironmentWorkspace() {
  const [view, setView] = useState('overview');
  const [month, setMonth] = useState(10);
  const [district, setDistrict] = useState('전체');
  const cloud = useEnvironment();
  const [tour, setTour] = useState(0);
  const period = '2027-' + String(month).padStart(2, '0');
  const summary = summarize(cloud.inputs, cloud.records, period, district);
  const current = useRef({ cloud, summary, period, district });
  current.current = { cloud, summary, period, district };
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: 'get_environment_summary',
          title: '농촌환경 데이터 집계',
          description:
            '현재 기간과 지역의 예측량, 현장검증 및 유사 응답 비율을 조회합니다. 예시 자료 포함 여부도 반환합니다.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute() {
            const { summary, period, district } = current.current;
            return {
              period,
              district,
              predictedTons: summary.tons,
              verifications: summary.filtered.length,
              agreement: summary.agreement,
              liveRecords: summary.filtered.filter((r) => !r.demo).length,
              containsExampleData: true,
            };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: 'navigate_environment_workspace',
          title: '분석 화면 열기',
          description:
            '예측, 지도, DB, 보고서, 경력 화면 중 하나를 엽니다. 데이터 저장은 하지 않습니다.',
          inputSchema: {
            type: 'object',
            properties: {
              view: { type: 'string', enum: navigation.map((n) => n.id) },
            },
            required: ['view'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const v = (input as { view?: string }).view;
            if (!navigation.some((n) => n.id === v))
              throw new Error('지원하지 않는 화면입니다.');
            setView(v!);
            return { opened: v };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: 'assign_field_verification',
          title: '현장검증 업무 배정',
          description:
            '마을과 기간을 선택해 현장검증 업무를 시연 실무자에게 배정합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              villageId: { type: 'string', enum: villages.map((v) => v.id) },
              period: { type: 'string' },
            },
            required: ['villageId', 'period'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          async execute(input) {
            const v = input as { villageId: string; period: string };
            const result = await current.current.cloud.mutate({
              action: 'assign',
              ...v,
            });
            return { saved: result.saved, task: result.data };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  const monthlyTotals = [9, 10, 11, 12].map((m) =>
    cloud.inputs
      .filter(
        (v) =>
          v.month === m && (district === '전체' || v.district === district),
      )
      .reduce((s, v) => s + predictTons(v), 0),
  );
  const chartMaximum = Math.max(1, ...monthlyTotals);
  const heading =
    view === 'overview'
      ? '현장을 읽고, 다음을 준비합니다.'
      : view === 'predict'
        ? '발생을 예측하고, 방문을 준비합니다.'
        : view === 'map'
          ? '현장의 기록을 지도에 연결합니다.'
          : view === 'data'
            ? '쌓이는 기록, 지역의 데이터 자산.'
            : view === 'report'
              ? '데이터에 실무자의 해석을 더합니다.'
              : '나의 업무가 경력으로 남습니다.';

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-name">
          <span className="workspace-initial">A</span>
          <div>
            안동시 농촌환경관리<small>안동대학교 · 정책 시범 프로젝트</small>
          </div>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="분석 웹 메뉴">
          {navigation.map(({ id, label, icon: Icon, tag }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {tag && <small>{tag}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <BookOpen size={18} />
            <p>
              지역의 현장을
              <br />
              나의 경력으로.
            </p>
          </div>
          <button className="help-link" onClick={() => setTour((t) => t + 1)}>
            <CircleHelp size={17} />
            프로젝트 안내
            <ChevronRight size={15} />
          </button>
          <div className="profile">
            <span className="workspace-initial">청</span>
            <div>
              청년 실무자<small>시연 계정</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <div>
            <PanelLeftClose size={18} />
            <span>안동시</span>
            <ChevronRight size={14} />
            <strong>{navigation.find((n) => n.id === view)?.label}</strong>
          </div>
          <span className="status-label">
            <span className="status-dot" />
            {cloud.sync === 'online'
              ? '공유 자료 연결됨'
              : cloud.sync === 'offline'
                ? '연결 복구 대기'
                : '자료 연결 중'}
          </span>
        </header>
        <main className="workspace-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">RURAL ENVIRONMENT INTELLIGENCE</p>
              <h1>{heading}</h1>
              <p className="subtext">
                예측부터 현장검증까지, 안동의 농촌환경 데이터를 한곳에서.
              </p>
            </div>
            <Button className="action-button" onClick={() => setView('report')}>
              <FileText size={16} />
              보고서 작성
              <ArrowRight size={15} />
            </Button>
          </div>
          <div className="filter-bar">
            <div className="filter-controls">
              <NativeSelect aria-label="대상 연도">
                <option>2027년</option>
              </NativeSelect>
              <NativeSelect
                aria-label="대상 월"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {[9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label="대상 지역"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="전체">안동시 전체</option>
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </NativeSelect>
            </div>
            <span className="muted metadata">
              예시 농업자료 · {cloud.lastSync || '—'} 갱신
            </span>
          </div>
          {view === 'overview' && (
            <>
              <div className="metric-grid">
                {[
                  {
                    label: '예상 부산물 발생량',
                    value: summary.tons.toFixed(1),
                    unit: 't',
                    note: summary.selected.length + '개 마을 · 면적 × 발생계수',
                  },
                  {
                    label: '현장검증 지점',
                    value: summary.filtered.length,
                    unit: '곳',
                    note: '예측을 실제 현장과 연결',
                  },
                  {
                    label: '예측 일치율',
                    value: summary.agreement ?? '—',
                    unit: '%',
                    note: '예상과 유사 응답 / 전체 검증',
                  },
                  {
                    label: '집중확인 권장 마을',
                    value: summary.concentrated,
                    unit: '개',
                    note: '예상 발생량 12t 이상 · 시연 기준',
                  },
                ].map((m) => (
                  <article key={m.label} className="metric">
                    <span>{m.label}</span>
                    <div>
                      {m.value}
                      <small>{m.unit}</small>
                    </div>
                    <p>{m.note}</p>
                  </article>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="surface trend-panel">
                  <div className="section-heading">
                    <div>
                      <h2>월별 예상 발생량</h2>
                      <p>작물별 발생 시기를 바탕으로 한 관리 수요</p>
                    </div>
                    <span className="legend">
                      <i />
                      예상 발생량
                    </span>
                  </div>
                  <div className="bar-chart">
                    {[9, 10, 11, 12].map((m) => {
                      const total = cloud.inputs
                        .filter(
                          (v) =>
                            v.month === m &&
                            (district === '전체' || v.district === district),
                        )
                        .reduce((s, v) => s + predictTons(v), 0);
                      return (
                        <button
                          key={m}
                          className={month === m ? 'selected' : ''}
                          onClick={() => setMonth(m)}
                          aria-label={m + '월 ' + total.toFixed(1) + '톤'}
                        >
                          <span>
                            {total.toFixed(1)}
                            <small> t</small>
                          </span>
                          <div
                            style={{
                              height:
                                Math.max(3, (total / chartMaximum) * 170) +
                                'px',
                            }}
                          />
                          <strong>{m}월</strong>
                        </button>
                      );
                    })}
                  </div>
                  <div className="chart-foot">
                    <Leaf size={15} />
                    발생량과 시기를 함께 살펴보고 방문할 지역을 선택하세요.
                  </div>
                </section>
                <section className="surface">
                  <div className="section-heading">
                    <div>
                      <h2>주요 부산물</h2>
                      <p>{month}월 예상 발생량 구성</p>
                    </div>
                    <Layers size={18} />
                  </div>
                  <div className="composition-list">
                    {Object.entries(byproduct).map(([crop, name]) => {
                      const tons = summary.selected
                        .filter((v) => v.crop === crop)
                        .reduce((s, v) => s + predictTons(v), 0);
                      const percent = summary.tons
                        ? (tons / summary.tons) * 100
                        : 0;
                      return (
                        <div key={crop}>
                          <div>
                            <span>{name}</span>
                            <strong>
                              {percent.toFixed(0)}
                              <small>%</small>
                            </strong>
                          </div>
                          <div className="composition-track">
                            <i style={{ width: percent + '%' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
              <section className="surface">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">PREDICT → FIELD</p>
                    <h2>이번 달, 확인이 필요한 현장</h2>
                  </div>
                  <Button variant="ghost" onClick={() => setView('predict')}>
                    발생 예측 전체보기
                    <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="village-grid">
                  {[...summary.selected]
                    .sort((a, b) => predictTons(b) - predictTons(a))
                    .slice(0, 3)
                    .map((v) => (
                      <article className="village-card" key={v.id}>
                        <div className="village-card-top">
                          <span className="icon-box">
                            <Sprout size={19} />
                          </span>
                          <span className="tag">
                            {predictTons(v) >= 12 ? '집중 발생' : '확인 권장'}
                          </span>
                        </div>
                        <h3>
                          {v.district} {v.name}
                        </h3>
                        <p>
                          {v.crop} · {v.timing}
                        </p>
                        <div className="village-quantity">
                          {predictTons(v).toFixed(1)}
                          <small>t 예상</small>
                        </div>
                        <p className="metadata">
                          {v.area}ha × {v.coefficient.toLocaleString()}kg/ha
                        </p>
                        <Button
                          variant="outline"
                          className="action-button full-width"
                          onClick={() => setView('predict')}
                        >
                          예측자료 확인
                          <ArrowRight size={15} />
                        </Button>
                      </article>
                    ))}
                </div>
              </section>
            </>
          )}
          {view === 'predict' && (
            <PredictPanel
              inputs={cloud.inputs}
              period={period}
              district={district}
              tasks={cloud.tasks}
              mutate={cloud.mutate}
            />
          )}
          {view === 'map' && (
            <EnvironmentMap
              inputs={cloud.inputs}
              records={cloud.records}
              period={period}
              district={district}
            />
          )}
          {view === 'data' && <RecordsPanel records={summary.filtered} />}
          {view === 'report' && (
            <ReportPanel
              key={period + district}
              inputs={cloud.inputs}
              records={cloud.records}
              reports={cloud.reports}
              period={period}
              district={district}
              mutate={cloud.mutate}
            />
          )}
          {view === 'career' && (
            <CareerPanel records={cloud.records} reports={cloud.reports} />
          )}
          <ProductTour openRequest={tour} />
          <footer className="workspace-footer">
            <span>들녘 · 안동대학교</span>
            <span>
              예측한다 → 확인한다 → 축적한다 → 분석한다 → 경력으로 남긴다
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
