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
export function downloadFile(
  name: string,
  text: string,
  type = 'text/plain;charset=utf-8',
) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
