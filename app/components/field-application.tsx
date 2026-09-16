'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Cloud,
  HelpCircle,
  Leaf,
  LoaderCircle,
  Map,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEnvironment } from '@/hooks/use-environment';
import {
  apiUrl,
  API_ORIGIN,
  crops,
  DEMO_WORKER,
  occurrenceStates,
  comparisons,
  processingStates,
  predictTons,
  villageName,
  type Village,
  type Task,
} from '@/lib/environment-data';
import { CareerPanel, RecordsPanel } from '@/components/environment-panels';
import { ProductTour } from '@/components/product-tour';
function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <fieldset className="field-choice">
      <legend>{label}</legend>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(String(v))}
        aria-label={label}
      >
        {options.map((o) => (
          <label key={o} className={value === o ? 'checked' : ''}>
            <RadioGroupItem value={o} />
            <span>{o}</span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
function VerificationForm({
  initial,
  period,
  inputs,
  onCancel,
  onSaved,
  mutate,
}: {
  initial: Village;
  period: string;
  inputs: Village[];
  onCancel: () => void;
  onSaved: () => void;
  mutate: (p: FormData) => Promise<unknown>;
}) {
  const [village, setVillage] = useState(initial.id);
  const [crop, setCrop] = useState(initial.crop);
  const [targetPeriod, setTargetPeriod] = useState(period);
  const [occurrence, setOccurrence] = useState('');
  const [comparison, setComparison] = useState('');
  const [processing, setProcessing] = useState('');
  const [note, setNote] = useState('');
  const [areaHa, setAreaHa] = useState('');
  const [observedTons, setObservedTons] = useState('');
  const [measurementMethod, setMeasurementMethod] = useState('');
  const [measurementCoverage, setMeasurementCoverage] = useState('');
  const [gps, setGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsMessage, setGpsMessage] = useState('위치 확인 중');
  const [locating, setLocating] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const id = useRef('');
  const active = useRef(true);
  const locate = () => {
    if (!navigator.geolocation) {
      setGpsMessage('이 브라우저에서 위치 정보를 사용할 수 없습니다.');
      return;
    }
    setLocating(true);
    setGpsMessage('현재 GPS 위치를 확인하고 있습니다.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!active.current) return;
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsMessage('GPS 자동 기록 완료');
        setLocating(false);
      },
      (error) => {
        if (!active.current) return;
        setGpsMessage(
          error.code === 1
            ? '위치 권한이 꺼져 있습니다. 브라우저 설정에서 허용한 뒤 다시 확인하세요.'
            : '위치를 찾지 못했습니다. 야외에서 다시 확인해 주세요.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };
  useEffect(() => {
    active.current = true;
    id.current = crypto.randomUUID();
    locate();
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (!photo) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const classify = async () => {
    if (!photo) return;
    setAiBusy(true);
    setAiMessage('사진 속 작물을 확인하고 있습니다.');
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(photo);
      });
      const res = await fetch(apiUrl('/api/classify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = (await res.json()) as {
        category?: string;
        reason?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error);
      setAiMessage(
        'AI 제안: ' +
          data.category +
          ' · ' +
          data.reason +
          ' 작물 선택란에서 확인해 주세요.',
      );
    } catch (e) {
      setAiMessage(
        (e as Error).message ||
          '사진을 분석하지 못했습니다. 직접 작물을 선택해 주세요.',
      );
    } finally {
      setAiBusy(false);
    }
  };
  const submit = async () => {
    if (!gps) {
      setMessage('현재 GPS 위치를 먼저 확인해 주세요.');
      return;
    }
    if (!occurrence || !comparison || !processing) {
      setMessage('발생상태, 예측 비교, 처리상태를 선택해 주세요.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const form = new FormData();
      Object.entries({
        action: 'verify',
        id: id.current,
        villageId: village,
        period: targetPeriod,
        crop,
        occurrence,
        comparison,
        processing,
        note,
        areaHa,
        observedTons,
        measurementMethod,
        measurementCoverage,
        lat: String(gps.lat),
        lng: String(gps.lng),
        accuracy: String(gps.accuracy),
      }).forEach(([k, v]) => form.set(k, v));
      if (photo) form.set('photo', photo);
      await mutate(form);
      onSaved();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="field-form">
      <div className="field-form-heading">
        <Button variant="ghost" onClick={onCancel} aria-label="업무 목록으로">
          <ArrowLeft />
        </Button>
        <div>
          <p className="eyebrow">FIELD VERIFICATION</p>
          <h1>현장검증 기록</h1>
        </div>
      </div>
      <div className="panel-stack">
        <section className="surface">
          <label className="form-label first">
            확인 마을
            <NativeSelect
              value={village}
              onChange={(e) => {
                setVillage(e.target.value);
                const v = inputs.find((v) => v.id === e.target.value)!;
                setCrop(v.crop);
              }}
            >
              {inputs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.district} {v.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="form-label">
            대상 예측기간
            <NativeSelect
              value={targetPeriod}
              onChange={(e) => setTargetPeriod(e.target.value)}
            >
              {[9, 10, 11, 12].map((m) => (
                <option key={m} value={'2027-' + String(m).padStart(2, '0')}>
                  2027년 {m}월 · 시연 자료
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="form-label">
            확인 작물
            <NativeSelect
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              {crops.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </label>
        </section>
        <section className="surface">
          <Choice
            label="부산물 발생상태"
            options={occurrenceStates}
            value={occurrence}
            onChange={setOccurrence}
          />
          <Choice
            label="예측과 현장 비교"
            options={comparisons}
            value={comparison}
            onChange={setComparison}
          />
          <Choice
            label="현재 처리상태"
            options={processingStates}
            value={processing}
            onChange={setProcessing}
          />
        </section>
        <section className="surface">
          <details>
            <summary>
              표본량 기록 <span className="muted">선택 입력</span>
            </summary>
            <p className="subtext">
              확인한 구역의 면적과 부산물량을 함께 남깁니다. 마을 전체 발생량이
              아닙니다. 양을 모르면 비워 두세요.
            </p>
            <label className="form-label">
              조사면적 (ha)
              <Input
                type="number"
                inputMode="decimal"
                min="0.000001"
                max="100000"
                step="any"
                value={areaHa}
                onChange={(e) => setAreaHa(e.target.value)}
                placeholder="예: 0.5"
              />
            </label>
            <label className="form-label">
              확인한 부산물량 (t)
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                max="100000"
                step="any"
                value={observedTons}
                onChange={(e) => setObservedTons(e.target.value)}
                placeholder="예: 0.6 · 1t = 1,000kg"
              />
            </label>
            <label className="form-label">
              부산물량 확인방법
              <NativeSelect
                value={measurementMethod}
                onChange={(e) => setMeasurementMethod(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="weighed">계량 (저울 등)</option>
                <option value="estimated">현장 추정 (계량 아님)</option>
              </NativeSelect>
            </label>
            <label className="form-label">
              조사범위
              <NativeSelect
                value={measurementCoverage}
                onChange={(e) => setMeasurementCoverage(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="complete">입력한 면적의 부산물 전체 확인</option>
                <option value="partial">일부만 확인 (비교 제외)</option>
              </NativeSelect>
            </label>
            <p className="data-footnote">
              ‘발생 완료’이고 같은 작물·예측 월의 전체 표본량일 때만 면적
              기준으로 비교합니다. 추정값은 계량값과 구분하며, 계수는 자동
              보정하지 않습니다.
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setAreaHa('');
                setObservedTons('');
                setMeasurementMethod('');
                setMeasurementCoverage('');
              }}
            >
              표본량 입력 비우기
            </Button>
          </details>
        </section>
        <section className="surface">
          <h2>현장사진</h2>
          <p className="subtext">사진을 촬영하거나 앨범에서 첨부하세요.</p>
          {preview ? (
            <div className="photo-preview">
              <img src={preview} alt="저장할 현장 사진" />
              <Button
                variant="outline"
                size="icon"
                aria-label="첨부 사진 제거"
                onClick={() => setPhoto(null)}
              >
                <X />
              </Button>
            </div>
          ) : null}
          <label className="photo-picker">
            <Camera size={22} />
            {photo ? '사진 다시 선택' : '사진 촬영·첨부'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 10 * 1024 * 1024) {
                  setMessage('10MB 이하 사진을 선택해 주세요.');
                  return;
                }
                setPhoto(f);
                setAiMessage('');
                if (!gps && !locating) locate();
              }}
            />
          </label>
          {photo && (
            <Button
              variant="outline"
              className="action-button full-width"
              disabled={aiBusy}
              onClick={() => void classify()}
            >
              <Sparkles />
              {aiBusy ? '분석 중' : 'AI 작물 확인 보조'}
            </Button>
          )}
          {aiMessage && (
            <p className="inline-message" role="status">
              {aiMessage}
            </p>
          )}
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>GPS 위치</h2>
            <Button variant="ghost" disabled={locating} onClick={locate}>
              <RefreshCw size={16} />
              다시 확인
            </Button>
          </div>
          <div className="gps-state">
            {locating ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : (
              <MapPin size={19} />
            )}
            <p>{gpsMessage}</p>
          </div>
          {gps && (
            <p className="data-footnote">
              {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)} · 오차 약{' '}
              {Math.round(gps.accuracy)}m<br />
              기록할 마을과 실제 위치가 일치하는지 확인해 주세요.
            </p>
          )}
        </section>
        <section className="surface">
          <label className="form-label first">
            특이사항
            <Textarea
              rows={4}
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="현장에서 확인한 내용을 간단히 남겨주세요."
            />
          </label>
          <p className="data-footnote">
            기록 시각은 저장 시 자동으로 남습니다. 대상 예측기간과 구분됩니다.
          </p>
        </section>
        {message && (
          <p role="alert" className="inline-message">
            {message}
          </p>
        )}
        <Button
          className="action-button save-verification"
          disabled={busy || locating}
          onClick={() => void submit()}
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <Check />}
          {busy ? '기록 저장 중' : '현장검증 저장'}
        </Button>
      </div>
    </div>
  );
}
export function FieldApplication() {
  const cloud = useEnvironment();
  const [tab, setTab] = useState('tasks');
  const [period, setPeriod] = useState('2027-10');
  const [recordVillage, setRecordVillage] = useState<Village | null>(null);
  const [notice, setNotice] = useState('');
  const [tour, setTour] = useState(0);
  const samples: Task[] = cloud.inputs
    .filter((v) => v.month === Number(period.slice(5)))
    .slice(0, 3)
    .map((v) => ({
      id: 'example-task-' + v.id,
      villageId: v.id,
      period,
      workerId: DEMO_WORKER,
      note: '예상 발생량과 현장 상태 표본 확인',
      demo: true,
    }));
  const tasks = [
    ...cloud.tasks.filter((t) => t.period === period),
    ...samples.filter(
      (s) =>
        !cloud.tasks.some(
          (t) => t.villageId === s.villageId && t.period === period,
        ),
    ),
  ];
  const live = cloud.records.filter(
    (r) => !r.demo && r.workerId === DEMO_WORKER && r.period === period,
  );
  const ref = useRef({ tasks, live, inputs: cloud.inputs });
  ref.current = { tasks, live, inputs: cloud.inputs };
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: 'list_field_tasks',
          title: '현장확인 업무 조회',
          description:
            '현재 기간의 현장확인 업무를 조회합니다. 예시 업무와 배정된 업무를 구분합니다.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute() {
            return ref.current.tasks;
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: 'start_field_verification',
          title: '현장검증 작성 시작',
          description:
            '마을의 검증 양식을 엽니다. 사진과 GPS, 상태를 확인한 후 저장 버튼으로 완료합니다.',
          inputSchema: {
            type: 'object',
            properties: { villageId: { type: 'string' } },
            required: ['villageId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const v = ref.current.inputs.find(
              (v) => v.id === (input as { villageId?: string }).villageId,
            );
            if (!v) throw new Error('마을을 찾을 수 없습니다.');
            setRecordVillage(v);
            return { opened: true, villageId: v.id, saved: false };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: 'list_my_field_records',
          title: '나의 현장기록 조회',
          description: '직접 저장한 현장검증 기록을 조회합니다.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute() {
            return ref.current.live.map(
              ({ id, villageId, period, crop, comparison, createdAt }) => ({
                id,
                villageId,
                period,
                crop,
                comparison,
                createdAt,
              }),
            );
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return (
    <div className="field-app">
      <header className="field-header">
        <div className="brand">
          <Leaf size={25} />
          <strong>
            들녘<span>field</span>
          </strong>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="현장 앱 사용 안내"
          onClick={() => setTour((t) => t + 1)}
        >
          <HelpCircle size={20} />
        </Button>
      </header>
      {notice && (
        <output className="field-notice">
          <Check size={17} />
          {notice}
          <button aria-label="알림 닫기" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </output>
      )}
      <main className="field-content">
        {recordVillage ? (
          <VerificationForm
            key={recordVillage.id}
            initial={recordVillage}
            period={period}
            inputs={cloud.inputs}
            mutate={cloud.mutate}
            onCancel={() => setRecordVillage(null)}
            onSaved={() => {
              setRecordVillage(null);
              setTab('records');
              setNotice('저장 완료 · 분석 웹과 공유했습니다.');
            }}
          />
        ) : (
          <>
            <div className="field-welcome">
              <p className="eyebrow">FIELD WORKSPACE</p>
              <div>
                <h1>
                  {tab === 'tasks'
                    ? '오늘의 확인 업무'
                    : tab === 'map'
                      ? '현장 위치 확인'
                      : tab === 'records'
                        ? '나의 현장 기록'
                        : '나의 직무경력'}
                </h1>
                <span className="field-status">
                  <Cloud size={14} />
                  {cloud.sync === 'online'
                    ? '연결됨'
                    : cloud.sync === 'offline'
                      ? '연결 대기'
                      : '연결 중'}
                </span>
              </div>
              <p className="subtext">청년 실무자 · 안동시 · 시연 계정</p>
            </div>
            <div className="field-period">
              <NativeSelect
                aria-label="현장 업무 대상 기간"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {[9, 10, 11, 12].map((m) => (
                  <option key={m} value={'2027-' + String(m).padStart(2, '0')}>
                    2027년 {m}월
                  </option>
                ))}
              </NativeSelect>
              <span>예측자료 대상 기간</span>
            </div>
            {tab === 'tasks' && (
              <>
                <div className="field-summary">
                  <div>
                    <span>확인 예정</span>
                    <strong>
                      {
                        tasks.filter(
                          (t) => !live.some((r) => r.villageId === t.villageId),
                        ).length
                      }
                      <small>곳</small>
                    </strong>
                  </div>
                  <div>
                    <span>나의 검증</span>
                    <strong>
                      {live.length}
                      <small>건</small>
                    </strong>
                  </div>
                  <div>
                    <span>사진 기록</span>
                    <strong>
                      {live.filter((r) => r.photo).length}
                      <small>건</small>
                    </strong>
                  </div>
                </div>
                <Button
                  className="action-button field-new-record"
                  onClick={() => setRecordVillage(cloud.inputs[0])}
                >
                  <Plus size={19} />
                  현장검증 기록하기
                  <ArrowRight size={17} />
                </Button>
                <div className="section-heading field-section-title">
                  <div>
                    <h2>확인할 마을</h2>
                    <p>예측자료를 바탕으로 선택한 방문 지점</p>
                  </div>
                  <span className="tag">{tasks.length}곳</span>
                </div>
                <div className="task-list">
                  {tasks.map((t, i) => {
                    const v = cloud.inputs.find((v) => v.id === t.villageId);
                    if (!v) return null;
                    const done = live.some((r) => r.villageId === v.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setRecordVillage(v)}
                        className="task-card"
                      >
                        <div className="task-number">
                          {done ? (
                            <Check size={19} />
                          ) : (
                            String(i + 1).padStart(2, '0')
                          )}
                        </div>
                        <div className="task-copy">
                          <div>
                            <strong>
                              {v.district} {v.name}
                            </strong>
                            <span className={t.demo ? 'tag neutral' : 'tag'}>
                              {done
                                ? '검증 기록됨'
                                : t.demo
                                  ? '예시 업무'
                                  : '배정 업무'}
                            </span>
                          </div>
                          <p>
                            {v.crop} · {v.timing} · {predictTons(v).toFixed(1)}t
                            예상
                          </p>
                          <small>{t.note}</small>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                    );
                  })}
                </div>
                <div className="field-principle">
                  <MapPin size={22} />
                  <div>
                    <strong>예측과 실제 현장을 연결하세요.</strong>
                    <p>
                      표본 지점을 방문해 발생상태와 예측의 차이를 기록합니다.
                    </p>
                  </div>
                </div>
              </>
            )}
            {tab === 'map' && (
              <iframe
                className="field-map-frame"
                title="공유 농촌환경 지도"
                src={
                  (API_ORIGIN || '') +
                  '/map-embed?period=' +
                  encodeURIComponent(period)
                }
              />
            )}
            {tab === 'records' && <RecordsPanel records={live} />}
            {tab === 'career' && (
              <CareerPanel records={cloud.records} reports={cloud.reports} />
            )}
          </>
        )}
      </main>
      {!recordVillage && (
        <nav className="field-bottom-nav" aria-label="현장 앱 메뉴">
          {[
            { id: 'tasks', label: '업무', icon: ClipboardCheck },
            { id: 'map', label: '지도', icon: Map },
            { id: 'records', label: '기록', icon: Camera },
            { id: 'career', label: '경력', icon: BriefcaseBusiness },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
      <ProductTour field openRequest={tour} />
    </div>
  );
}
