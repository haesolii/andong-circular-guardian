'use client';
import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  Database,
  FileText,
  MapPin,
  Save,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import {
  apiUrl,
  byproduct,
  csvCell,
  DEMO_WORKER,
  downloadFile,
  predictTons,
  quantityLevel,
  summarize,
  villageName,
  type AnalysisReport,
  type Task,
  type Verification,
  type Village,
} from '@/lib/environment-data';
type Mutate = (payload: Record<string, unknown> | FormData) => Promise<any>;
export function PredictPanel({
  inputs,
  period,
  district,
  tasks,
  mutate,
}: {
  inputs: Village[];
  period: string;
  district: string;
  tasks: Task[];
  mutate: Mutate;
}) {
  const selected = inputs.filter(
    (v) =>
      v.month === Number(period.slice(5)) &&
      (district === '전체' || v.district === district),
  );
  const [editing, setEditing] = useState<Village[] | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const assign = async (v: Village) => {
    setBusy(true);
    try {
      await mutate({ action: 'assign', villageId: v.id, period });
      setMessage(villageName(v.id) + ' 현장확인 업무를 배정했습니다.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const template = () =>
    downloadFile(
      '예측입력자료.csv',
      [
        'id,area,coefficient',
        ...inputs.map((v) => [v.id, v.area, v.coefficient].join(',')),
      ].join('\n'),
      'text/csv;charset=utf-8',
    );
  const importCsv = async (file: File) => {
    try {
      const lines = (await file.text())
        .replace(/^\uFEFF/, '')
        .trim()
        .split(/\r?\n/);
      if (lines.shift() !== 'id,area,coefficient')
        throw new Error('양식의 열 이름 id,area,coefficient를 유지해 주세요.');
      const parsed = lines.map((l) => {
        const [id, area, coefficient] = l.split(',');
        return { id, area: Number(area), coefficient: Number(coefficient) };
      });
      if (
        parsed.length !== inputs.length ||
        new Set(parsed.map((p) => p.id)).size !== inputs.length ||
        parsed.some(
          (p) =>
            !inputs.some((v) => v.id === p.id) ||
            !Number.isFinite(p.area) ||
            p.area < 0 ||
            !Number.isFinite(p.coefficient) ||
            p.coefficient < 0,
        )
      )
        throw new Error('모든 마을의 고유 ID와 0 이상의 숫자를 확인해 주세요.');
      setEditing(
        inputs.map((v) => ({ ...v, ...parsed.find((p) => p.id === v.id) })),
      );
      setMessage('불러온 값을 확인한 뒤 저장하세요.');
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <div className="panel-stack">
      <div className="method-banner">
        <BookOpen size={20} />
        <div>
          <strong>재배면적 × 부산물 발생계수 ÷ 1,000</strong>
          <p>
            예상 발생량(t) · 마을 단위 시연 계산식입니다. 현재 계수와 마을
            자료는 예시이며, 검증된 농업자료로 교체할 수 있습니다.
          </p>
        </div>
      </div>
      <section className="surface">
        <div className="section-heading">
          <div>
            <h2>{Number(period.slice(5))}월 발생 예측</h2>
            <p>수확·정리 시기와 발생규모를 함께 확인하세요.</p>
          </div>
          <div className="button-row">
            <Button
              variant="outline"
              className="action-button"
              onClick={template}
            >
              <ArrowDownToLine />
              입력 양식
            </Button>
            <label className="file-button">
              <Upload size={16} />
              CSV 불러오기
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importCsv(f);
                  e.target.value = '';
                }}
              />
            </label>
            <Button
              className="action-button"
              onClick={() => setEditing(inputs)}
            >
              계수·면적 수정
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                '마을',
                '주요 작물',
                '재배면적',
                '발생 예상시기',
                '예상 발생량',
                '확인 권장',
                '현장 업무',
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...selected]
              .sort((a, b) => predictTons(b) - predictTons(a))
              .map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <strong>
                      {v.district} {v.name}
                    </strong>
                  </TableCell>
                  <TableCell>{v.crop}</TableCell>
                  <TableCell>{v.area} ha</TableCell>
                  <TableCell>{v.timing}</TableCell>
                  <TableCell>
                    <strong>{predictTons(v).toFixed(1)} t</strong>
                  </TableCell>
                  <TableCell>
                    <span className="tag">{quantityLevel(predictTons(v))}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      className="action-button"
                      variant="outline"
                      disabled={
                        busy ||
                        tasks.some(
                          (t) => t.villageId === v.id && t.period === period,
                        )
                      }
                      onClick={() => void assign(v)}
                    >
                      {tasks.some(
                        (t) => t.villageId === v.id && t.period === period,
                      ) ? (
                        <>
                          <Check />
                          배정됨
                        </>
                      ) : (
                        <>
                          현장확인 배정
                          <ArrowRight />
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {!selected.length && (
          <div className="empty-state">
            선택한 기간·지역에 예측자료가 없습니다.
          </div>
        )}
        <p className="data-footnote">
          발생규모 기준: 낮음 6t 미만 / 보통 6–12t 미만 / 높음 12t 이상. 관리
          수요 확인을 위한 시연 기준입니다.
        </p>
      </section>
      {message && (
        <p className="inline-message" role="status">
          {message}
        </p>
      )}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="wide-dialog">
          <DialogTitle>예측 입력자료 수정</DialogTitle>
          <DialogDescription>
            예시 마을별 면적과 계수입니다. 저장하면 모든 화면과 현장 앱에
            반영됩니다.
          </DialogDescription>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>마을·작물</TableHead>
                <TableHead>면적(ha)</TableHead>
                <TableHead>계수(kg/ha)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editing?.map((v, i) => (
                <TableRow key={v.id}>
                  <TableCell>
                    {v.district} {v.name}
                    <small className="block muted">{v.crop}</small>
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={villageName(v.id) + ' 면적'}
                      type="number"
                      min="0"
                      max="100000"
                      value={v.area}
                      onChange={(e) =>
                        setEditing((a) =>
                          a!.map((x, j) =>
                            j === i
                              ? { ...x, area: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={villageName(v.id) + ' 발생계수'}
                      type="number"
                      min="0"
                      max="1000000"
                      value={v.coefficient}
                      onChange={(e) =>
                        setEditing((a) =>
                          a!.map((x, j) =>
                            j === i
                              ? { ...x, coefficient: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            className="action-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await mutate({
                  action: 'inputs',
                  inputs: editing?.map(({ id, area, coefficient }) => ({
                    id,
                    area,
                    coefficient,
                  })),
                });
                setEditing(null);
                setMessage('입력자료를 저장하고 예측량을 다시 계산했습니다.');
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Save />
            저장하고 다시 계산
          </Button>
          {message && <p role="status">{message}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function RecordsPanel({ records }: { records: Verification[] }) {
  const [kind, setKind] = useState('all');
  const [detail, setDetail] = useState<Verification | null>(null);
  const filtered = records.filter(
    (r) => kind === 'all' || (kind === 'live' ? !r.demo : r.demo),
  );
  const exportCsv = () =>
    downloadFile(
      '현장검증자료.csv',
      [
        [
          '구분',
          '마을',
          '담당자',
          '대상기간',
          '작물',
          '발생상태',
          '예측비교',
          '처리상태',
          '위도',
          '경도',
          'GPS오차m',
          '기록일시',
          '메모',
        ],
        ...filtered.map((r) => [
          r.demo ? '예시' : '직접 입력',
          villageName(r.villageId),
          r.workerId,
          r.period,
          r.crop,
          r.occurrence,
          r.comparison,
          r.processing,
          r.lat,
          r.lng,
          r.accuracy,
          r.createdAt,
          r.note,
        ]),
      ]
        .map((row) => row.map(csvCell).join(','))
        .join('\n'),
      'text/csv;charset=utf-8',
    );
  return (
    <section className="surface">
      <div className="section-heading">
        <div>
          <h2>현장검증 데이터베이스</h2>
          <p>선택한 기간·지역의 기록 {filtered.length}건</p>
        </div>
        <div className="button-row">
          <NativeSelect
            aria-label="데이터 구분"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">전체 자료</option>
            <option value="live">직접 입력</option>
            <option value="demo">예시 자료</option>
          </NativeSelect>
          <Button
            variant="outline"
            className="action-button"
            onClick={exportCsv}
          >
            <ArrowDownToLine />
            CSV 내보내기
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {[
              '구분',
              '마을',
              '작물',
              '발생상태',
              '예측 비교',
              '처리현황',
              '상세',
            ].map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <span className={r.demo ? 'tag neutral' : 'tag'}>
                  {r.demo ? '예시' : '직접 입력'}
                </span>
              </TableCell>
              <TableCell>{villageName(r.villageId)}</TableCell>
              <TableCell>{r.crop}</TableCell>
              <TableCell>{r.occurrence}</TableCell>
              <TableCell>{r.comparison}</TableCell>
              <TableCell>{r.processing}</TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => setDetail(r)}>
                  기록 보기
                  <ArrowRight />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!filtered.length && (
        <div className="empty-state">아직 저장한 기록이 없습니다.</div>
      )}
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="wide-dialog">
          <DialogTitle>
            {detail && villageName(detail.villageId)} · 현장 기록
          </DialogTitle>
          <DialogDescription>
            {detail?.createdAt &&
              new Date(detail.createdAt).toLocaleString('ko-KR')}{' '}
            / {detail?.demo ? '예시 자료' : '직접 입력 자료'}
          </DialogDescription>
          {detail && (
            <>
              <div className="record-details">
                {[
                  detail.crop,
                  detail.occurrence,
                  detail.comparison,
                  detail.processing,
                ].map((v) => (
                  <span key={v} className="tag neutral">
                    {v}
                  </span>
                ))}
              </div>
              {detail.photo ? (
                <img
                  className="record-photo"
                  src={apiUrl(detail.photo)}
                  alt="첨부된 현장 사진"
                />
              ) : (
                <p className="empty-state">첨부 사진 없음</p>
              )}
              <p>
                <MapPin size={16} className="inline" /> {detail.lat.toFixed(6)},{' '}
                {detail.lng.toFixed(6)}
                {detail.accuracy !== null &&
                  ' · GPS 오차 약 ' + Math.round(detail.accuracy) + 'm'}
              </p>
              <p className="note-text">{detail.note || '특이사항 없음'}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
export function ReportPanel({
  inputs,
  records,
  reports,
  period,
  district,
  mutate,
}: {
  inputs: Village[];
  records: Verification[];
  reports: AnalysisReport[];
  period: string;
  district: string;
  mutate: Mutate;
}) {
  const saved = reports.find(
    (r) =>
      r.period === period &&
      r.district === district &&
      r.workerId === DEMO_WORKER,
  );
  const [title, setTitle] = useState(
    saved?.title ||
      period +
        ' ' +
        (district === '전체' ? '안동시' : district) +
        ' 농촌환경 현황',
  );
  const [analysis, setAnalysis] = useState(saved?.analysis || '');
  const [recommendation, setRecommendation] = useState(
    saved?.recommendation || '',
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const summary = summarize(inputs, records, period, district);
  const reportText = () =>
    [
      title,
      '대상: ' + period + ' / ' + district,
      '작성자: 청년 실무자(시연 계정)',
      '자료: 발표용 예시 농업자료 + 직접 입력 현장기록',
      '예상 발생량: ' + summary.tons.toFixed(1) + 't',
      '현장검증: ' +
        summary.filtered.length +
        '건 (직접 입력 ' +
        summary.filtered.filter((r) => !r.demo).length +
        '건)',
      '예측 일치율: ' +
        (summary.agreement ?? '산정 불가') +
        (summary.agreement === null ? '' : '%') +
        ' · 유사 응답 / 전체 검증',
      '집중확인 권장 마을: ' + summary.concentrated + '개',
      '',
      '1. 현장 및 데이터 분석',
      analysis,
      '',
      '2. 다음 기간 검토 제안',
      recommendation,
      '',
      '발생계수와 마을정보는 시연용입니다. 정량적 예측 정확도·정책 효과로 해석하지 않습니다.',
      '정책 검토를 위한 실무자의 분석이며 최종 정책판단은 담당 공무원이 합니다.',
    ].join('\n');
  return (
    <div className="report-layout">
      <section className="surface report-editor">
        <p className="eyebrow">REPORT · MY ANALYSIS</p>
        <h2>데이터에 나의 해석을 더하세요.</h2>
        <p className="subtext">
          현장과 자료를 비교해 분석하고 다음 기간의 관리 수요를 제안합니다.
        </p>
        <label className="form-label">
          보고서 제목
          <Input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="form-label">
          현장 및 데이터 분석
          <Textarea
            rows={8}
            maxLength={5000}
            placeholder="어느 마을의 어떤 작물에서 발생이 집중되었나요? 예측과 현장검증 결과를 비교해 작성하세요."
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
          />
        </label>
        <label className="form-label">
          다음 기간 검토 제안
          <Textarea
            rows={5}
            maxLength={3000}
            placeholder="발생 예상시기와 기존 처리현황을 바탕으로 검토가 필요한 내용을 작성하세요."
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
          />
        </label>
        <div className="button-row">
          <Button
            className="action-button"
            disabled={busy || !analysis.trim() || !title.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await mutate({
                  action: 'report',
                  period,
                  district,
                  title,
                  analysis,
                  recommendation,
                });
                setMessage(
                  '분석보고서를 저장했습니다. 나의 직무경력에 반영됩니다.',
                );
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Save />
            보고서 저장
          </Button>
          <Button
            variant="outline"
            className="action-button"
            disabled={!analysis.trim()}
            onClick={() => downloadFile(title + '.txt', reportText())}
          >
            <ArrowDownToLine />
            보고서 내려받기
          </Button>
        </div>
        {message && (
          <p role="status" className="inline-message">
            {message}
          </p>
        )}
      </section>
      <aside className="panel-stack">
        <section className="surface evidence-panel">
          <p className="eyebrow">EVIDENCE</p>
          <h2>이번 보고서의 근거</h2>
          <dl>
            <div>
              <dt>예상 발생량</dt>
              <dd>{summary.tons.toFixed(1)} t</dd>
            </div>
            <div>
              <dt>현장검증</dt>
              <dd>{summary.filtered.length}건</dd>
            </div>
            <div>
              <dt>예측 일치율</dt>
              <dd>
                {summary.agreement === null
                  ? '산정 전'
                  : summary.agreement + '%'}
              </dd>
            </div>
            <div>
              <dt>직접 입력 기록</dt>
              <dd>{summary.filtered.filter((r) => !r.demo).length}건</dd>
            </div>
          </dl>
          <p className="data-footnote">
            일치율 = ‘예상과 유사’ 응답 ÷ 현장검증 건수. 정량 예측 오차와는
            구분합니다.
          </p>
        </section>
        <section className="surface">
          <FileText size={22} color="#0c8c5e" />
          <h3 className="mt-4">
            분석은 실무자가,
            <br />
            정책판단은 공무원이.
          </h3>
          <p className="subtext">
            자동 집계한 자료를 근거로 직접 작성한 해석과 제안을 남깁니다.
          </p>
        </section>
        <section className="surface">
          <h2>저장한 보고서</h2>
          {reports.length ? (
            reports.map((r) => (
              <div key={r.id} className="saved-report">
                <strong>{r.title}</strong>
                <p>{new Date(r.updatedAt).toLocaleDateString('ko-KR')}</p>
              </div>
            ))
          ) : (
            <p className="subtext">첫 분석보고서를 작성해 보세요.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
export function CareerPanel({
  records,
  reports,
}: {
  records: Verification[];
  reports: AnalysisReport[];
}) {
  const mine = records.filter((r) => r.workerId === DEMO_WORKER && !r.demo);
  const ownReports = reports.filter((r) => r.workerId === DEMO_WORKER);
  const places = new Set(mine.map((r) => r.villageId));
  const exportCareer = () =>
    downloadFile(
      '들녘_직무포트폴리오.txt',
      [
        '농촌환경 데이터 실무 포트폴리오',
        '청년 실무자 · 시연 계정',
        '프로젝트: 안동시 영농부산물 발생 예측 및 현장검증',
        '직접 입력 현장검증: ' + mine.length + '건',
        '환경 DB 구축: ' + mine.length + '건',
        'GPS 기록 마을: ' + places.size + '개',
        '분석보고서: ' + ownReports.length + '건',
        '',
        '현장 산출물',
        ...mine.map(
          (r) => r.id + ' / ' + villageName(r.villageId) + ' / ' + r.createdAt,
        ),
        '',
        '보고서 산출물',
        ...ownReports.map((r) => r.title + ' / ' + r.id),
        '',
        '앱 내 작업기록에 근거한 실적이며, 전문자격 또는 고용경력 인증이 아닙니다.',
        '외부 도구(QGIS, Excel, Power BI) 활용 실적은 별도 산출물 확인이 필요합니다.',
      ].join('\n'),
    );
  return (
    <div className="panel-stack">
      <section className="career-intro surface">
        <div>
          <p className="eyebrow">MY CAREER</p>
          <h2>
            지역에 남긴 데이터,
            <br />
            나에게 쌓이는 경험.
          </h2>
          <p className="subtext">
            청년 실무자 · 안동시 농촌환경 데이터 프로젝트
          </p>
        </div>
        <Button className="action-button" onClick={exportCareer}>
          <ArrowDownToLine />
          직무 포트폴리오
        </Button>
      </section>
      <div className="career-metrics">
        {[
          { icon: MapPin, n: mine.length, l: '현장검증', u: '건' },
          { icon: Database, n: mine.length, l: '환경 DB 구축', u: '건' },
          { icon: MapPin, n: places.size, l: 'GPS 기록 마을', u: '개' },
          { icon: FileText, n: ownReports.length, l: '분석보고서', u: '건' },
        ].map(({ icon: Icon, n, l, u }) => (
          <section className="surface" key={l}>
            <Icon color="#0c8c5e" size={21} />
            <p>{l}</p>
            <strong>
              {n}
              <small>{u}</small>
            </strong>
          </section>
        ))}
      </div>
      <section className="surface">
        <div className="section-heading">
          <div>
            <h2>나의 업무 산출물</h2>
            <p>
              직접 저장한 기록만 집계합니다. 예시 데이터는 경력 실적에서
              제외합니다.
            </p>
          </div>
        </div>
        {mine.length ? (
          mine.slice(0, 10).map((r) => (
            <div className="activity-row" key={r.id}>
              <span className="icon-box">
                <Check size={18} />
              </span>
              <div>
                <strong>
                  {villageName(r.villageId)} · {r.crop} 현장검증
                </strong>
                <p>
                  {new Date(r.createdAt).toLocaleString('ko-KR')} · GPS{' '}
                  {r.photo ? '· 사진 첨부' : ''}
                </p>
              </div>
              <span className="tag">기록 완료</span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            현장검증을 저장하면 이곳에 업무 실적이 쌓입니다.
          </div>
        )}
      </section>
      <section className="surface">
        <p className="eyebrow">NEXT STEP</p>
        <h2>현장자료를 외부 분석 도구로 연결하기</h2>
        <p className="subtext">
          CSV 자료를 QGIS에서 지도화하거나 Excel·Power BI로 분석할 수 있습니다.
          외부 도구를 사용했다는 실적은 실제 산출물을 확인한 후 포트폴리오에
          추가하세요.
        </p>
        <p className="data-footnote">
          앱은 실제 업무와 산출물을 기록합니다. 전문자격이나 공인 경력을
          부여하지 않습니다.
        </p>
      </section>
    </div>
  );
}
