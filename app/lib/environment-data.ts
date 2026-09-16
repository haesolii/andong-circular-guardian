export const crops = ['고추', '콩', '참깨', '벼', '사과'] as const;
export const occurrenceStates = ['미발생', '발생 중', '발생 완료'] as const;
export const comparisons = [
  '예상보다 적음',
  '예상과 유사',
  '예상보다 많음',
] as const;
export const processingStates = [
  '현장 보관',
  '자체 처리 예정',
  '기존 지원사업 이용 예정',
  '확인 필요',
] as const;
export const DEMO_WORKER = 'demo-worker-01';
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || '';
export const apiUrl = (path: string) => API_ORIGIN + path;
export type Village = {
  id: string;
  name: string;
  district: string;
  crop: string;
  area: number;
  coefficient: number;
  month: number;
  timing: string;
  lat: number;
  lng: number;
  source: string;
};
export type Verification = {
  id: string;
  villageId: string;
  workerId: string;
  period: string;
  crop: string;
  occurrence: string;
  comparison: string;
  processing: string;
  note: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  photo?: string;
  createdAt: string;
  demo?: boolean;
  measurement?: {
    areaHa: number;
    tons: number;
    method: 'weighed' | 'estimated';
    coverage: 'complete' | 'partial';
  };
  prediction?: {
    crop: string;
    coefficient: number;
    month: number;
    source: string;
    capturedAt: string;
  };
};
export type AnalysisReport = {
  id: string;
  workerId: string;
  period: string;
  district: string;
  title: string;
  analysis: string;
  recommendation: string;
  updatedAt: string;
  evidence?: ReturnType<typeof reportEvidence>;
};
export type Task = {
  id: string;
  villageId: string;
  workerId: string;
  period: string;
  note: string;
  createdAt?: string;
  demo?: boolean;
};
// Example inputs, not official coefficients or village survey data.
export const villages: Village[] = [
  ['imha-a', 'A리', '임하면', '고추', 10, 1240, 10, '10월 하순', 36.52, 128.85],
  ['imha-b', 'B리', '임하면', '콩', 6.5, 1200, 10, '10월 말', 36.5, 128.83],
  ['imha-c', 'C리', '임하면', '고추', 8, 1240, 10, '10월 중순', 36.54, 128.86],
  ['seohu-a', 'A리', '서후면', '콩', 12, 1200, 10, '10월 하순', 36.62, 128.66],
  ['seohu-b', 'B리', '서후면', '참깨', 4, 800, 9, '9월 말', 36.6, 128.64],
  ['gilan-a', 'A리', '길안면', '사과', 9, 1800, 12, '12월 중순', 36.46, 128.89],
  ['gilan-b', 'B리', '길안면', '고추', 7, 1240, 10, '10월 하순', 36.44, 128.91],
  [
    'waryong-a',
    'A리',
    '와룡면',
    '벼',
    14,
    1500,
    10,
    '10월 중순',
    36.62,
    128.76,
  ],
  ['waryong-b', 'B리', '와룡면', '콩', 9, 1200, 11, '11월 초', 36.65, 128.78],
  [
    'pungsan-a',
    'A리',
    '풍산읍',
    '벼',
    18,
    1500,
    10,
    '10월 하순',
    36.58,
    128.57,
  ],
  ['pungsan-b', 'B리', '풍산읍', '고추', 5, 1240, 11, '11월 초', 36.6, 128.59],
  ['namhu-a', 'A리', '남후면', '참깨', 6, 800, 9, '9월 하순', 36.51, 128.65],
].map((v) => ({
  id: String(v[0]),
  name: String(v[1]),
  district: String(v[2]),
  crop: String(v[3]),
  area: Number(v[4]),
  coefficient: Number(v[5]),
  month: Number(v[6]),
  timing: String(v[7]),
  lat: Number(v[8]),
  lng: Number(v[9]),
  source: '발표용 예시 · 발생계수 검증 전',
}));
export const districts = [...new Set(villages.map((v) => v.district))];
export const byproduct: Record<string, string> = {
  고추: '고춧대',
  콩: '콩대',
  참깨: '참깨대',
  벼: '볏짚',
  사과: '과수 전정가지',
};
export const predictTons = (v: Pick<Village, 'area' | 'coefficient'>) =>
  (v.area * v.coefficient) / 1000;
export const villageName = (id: string) => {
  const v = villages.find((v) => v.id === id);
  return v ? v.district + ' ' + v.name : id;
};
export const quantityLevel = (tons: number) =>
  tons >= 12 ? '높음' : tons >= 6 ? '보통' : '낮음';
export const demoVerifications: Verification[] = villages.flatMap((v, i) =>
  Array.from({ length: 3 }, (_, j) => ({
    id: 'example-' + i + '-' + j,
    villageId: v.id,
    workerId: j === 2 ? 'demo-worker-02' : DEMO_WORKER,
    period: '2027-' + String(v.month).padStart(2, '0'),
    crop: v.crop,
    occurrence: '발생 중',
    comparison:
      (i + j) % 5 === 0
        ? '예상보다 많음'
        : (i + j) % 7 === 0
          ? '예상보다 적음'
          : '예상과 유사',
    processing: processingStates[(i + j) % 4],
    note: '기능 시연을 위한 예시 현장검증 자료',
    lat: v.lat + j * 0.002,
    lng: v.lng + j * 0.002,
    accuracy: null,
    createdAt:
      '2027-' +
      String(v.month).padStart(2, '0') +
      '-' +
      String(10 + j).padStart(2, '0') +
      'T02:30:00.000Z',
    demo: true,
  })),
);
export function filterVillages(
  data: Village[],
  month: number,
  district: string,
) {
  return data.filter(
    (v) =>
      v.month === month && (district === '전체' || v.district === district),
  );
}
export function summarize(
  data: Village[],
  records: Verification[],
  period: string,
  district: string,
) {
  const selected = filterVillages(data, Number(period.slice(5)), district);
  const filtered = records.filter(
    (r) =>
      r.period === period &&
      (district === '전체' ||
        data.find((v) => v.id === r.villageId)?.district === district),
  );
  const matched = filtered.filter((r) => r.comparison === '예상과 유사').length;
  return {
    selected,
    filtered,
    tons: selected.reduce((s, v) => s + predictTons(v), 0),
    agreement: filtered.length
      ? Math.round((matched / filtered.length) * 100)
      : null,
    matched,
    concentrated: selected.filter((v) => predictTons(v) >= 12).length,
  };
}
export function csvCell(value: unknown) {
  const raw = String(value ?? '');
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(raw) ? "'" : '') +
    raw.replaceAll('"', '""') +
    '"'
  );
}
// Compare the surveyed area only. Never extrapolate a sample to village totals.
export function compareMeasurement(record: Verification) {
  const m = record.measurement;
  const p = record.prediction;
  if (
    !m ||
    !p ||
    m.coverage !== 'complete' ||
    record.occurrence !== '발생 완료' ||
    p.crop !== record.crop ||
    p.month !== Number(record.period.slice(5)) ||
    m.areaHa <= 0 ||
    p.coefficient <= 0
  )
    return null;
  const expectedTons = (m.areaHa * p.coefficient) / 1000;
  return {
    expectedTons,
    differenceTons: m.tons - expectedTons,
    observedKgPerHa: (m.tons * 1000) / m.areaHa,
    method: m.method,
  };
}
export function dataQuality(
  records: Verification[],
  expectedVillageIds: string[] = [],
) {
  const live = records.filter((r) => !r.demo);
  const gps = live.filter(
    (r) =>
      Number.isFinite(r.lat) &&
      Number.isFinite(r.lng) &&
      r.lat >= 33 &&
      r.lat <= 39 &&
      r.lng >= 124 &&
      r.lng <= 132,
  ).length;
  const photo = live.filter((r) => !!r.photo).length;
  const comparable = live.filter((r) => compareMeasurement(r) !== null).length;
  const complete = live.filter(
    (r) =>
      crops.includes(r.crop as (typeof crops)[number]) &&
      occurrenceStates.includes(
        r.occurrence as (typeof occurrenceStates)[number],
      ) &&
      comparisons.includes(r.comparison as (typeof comparisons)[number]) &&
      processingStates.includes(
        r.processing as (typeof processingStates)[number],
      ),
  ).length;
  const verifiedVillages = expectedVillageIds.filter((id) =>
    live.some((r) => r.villageId === id),
  ).length;
  const rate = (n: number) =>
    live.length ? Math.round((n / live.length) * 100) : null;
  return {
    total: live.length,
    gps,
    photo,
    comparable,
    complete,
    verifiedVillages,
    expectedVillages: expectedVillageIds.length,
    gpsRate: rate(gps),
    photoRate: rate(photo),
    comparableRate: rate(comparable),
    missingRate: rate(live.length - complete),
    coverageRate: expectedVillageIds.length
      ? Math.round((verifiedVillages / expectedVillageIds.length) * 100)
      : null,
  };
}
export function recordsGeoJson(records: Verification[]) {
  return {
    type: 'FeatureCollection',
    name: '들녘 직접 입력 현장검증',
    features: records
      .filter((r) => !r.demo)
      .map((r) => ({
        type: 'Feature',
        id: r.id,
        geometry: dataQuality([r]).gps
          ? { type: 'Point', coordinates: [r.lng, r.lat] }
          : null,
        properties: {
          record_id: r.id,
          village: villageName(r.villageId),
          period: r.period,
          crop: r.crop,
          occurrence: r.occurrence,
          processing: r.processing,
          comparison: r.comparison,
          recorded_at: r.createdAt,
          gps_accuracy_m: r.accuracy,
          survey_area_ha: r.measurement?.areaHa ?? null,
          observed_tons: r.measurement?.tons ?? null,
          method: r.measurement?.method ?? null,
          coverage: r.measurement?.coverage ?? null,
          coefficient_kg_ha: r.prediction?.coefficient ?? null,
          coefficient_source: r.prediction?.source ?? null,
          expected_sample_tons: compareMeasurement(r)?.expectedTons ?? null,
          sample_difference_tons: compareMeasurement(r)?.differenceTons ?? null,
          data_status: '공개 시연 입력 · 검증 전',
        },
      })),
  };
}
export function reportEvidence(
  inputs: Village[],
  records: Verification[],
  period: string,
  district: string,
  capturedAt: string,
) {
  const s = summarize(inputs, records, period, district);
  return {
    capturedAt,
    tons: s.tons,
    count: s.filtered.length,
    exampleCount: s.filtered.filter((r) => r.demo).length,
    agreement: s.agreement,
    concentrated: s.concentrated,
    recordIds: s.filtered.filter((r) => !r.demo).map((r) => r.id),
    inputs: s.selected.map((v) => ({
      id: v.id,
      crop: v.crop,
      area: v.area,
      coefficient: v.coefficient,
      source: v.source,
    })),
    quality: dataQuality(
      s.filtered,
      s.selected.map((v) => v.id),
    ),
  };
}
export function analysisReportText(report: AnalysisReport) {
  const e = report.evidence;
  const percent = (v: number | null) => (v === null ? '산정 전' : v + '%');
  return [
    report.title,
    '대상: ' + report.period + ' / ' + report.district,
    '청년 실무자 · 공개 시연 계정',
    ...(e
      ? [
          '근거 기준시각: ' + e.capturedAt,
          '예상 발생량: ' + e.tons.toFixed(1) + 't (예시 농업자료)',
          '직접 입력: ' +
            e.quality.total +
            '건 / 예시: ' +
            e.exampleCount +
            '건',
          'GPS 기록률: ' + percent(e.quality.gpsRate),
          '사진 첨부율: ' + percent(e.quality.photoRate),
          '표본량 비교 가능률: ' + percent(e.quality.comparableRate),
          '자료 범위: 최근 1,000건 중 선택 기간·지역. 직접 입력은 실증 검증 완료를 뜻하지 않습니다.',
          '근거 기록 ID: ' + (e.recordIds.join(', ') || '없음'),
          '예측 입력자료 (마을 ID / 작물 / ha / kg·ha⁻¹ / 출처)',
          ...e.inputs.map((v) =>
            [v.id, v.crop, v.area, v.coefficient, v.source].join(' / '),
          ),
        ]
      : [
          '이전 보고서: 저장 당시 근거가 없어 현재 자료로 복원하지 않았습니다.',
        ]),
    '',
    '1. 현장 및 데이터 분석',
    report.analysis,
    '',
    '2. 다음 기간 검토 제안',
    report.recommendation,
    '',
    '표본량 비교는 동일 조사면적 기준이며 마을 전체 발생량·예측 정확도가 아닙니다.',
    '발생계수는 검증 전 시연값입니다. 최종 정책판단은 담당 공무원이 합니다.',
    '작업 산출물이며 전문자격·공인 경력 인증이 아닙니다.',
  ].join('\n');
}
export function downloadFile(
  name: string,
  text: string,
  type = 'text/plain;charset=utf-8',
) {
  const url = URL.createObjectURL(
    new Blob([type.includes('json') ? '' : '\uFEFF', text], { type }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
