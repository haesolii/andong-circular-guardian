import { env } from 'cloudflare:workers';

export const reportCategories = [
  '폐비닐',
  '폐농약 용기',
  '폐농자재',
  '과수 전정가지',
  '볏짚',
  '고춧대',
  '불법소각',
  '불법투기',
  '기타 농업부산물',
] as const;

export const reportStatuses = ['접수', '배정', '수거 중', '처리 완료'] as const;

type RuntimeBindings = {
  DB: D1Database;
  REPORT_PHOTOS: R2Bucket;
};

export function bindings() {
  return env as unknown as RuntimeBindings;
}

export function isCategory(value: unknown): value is typeof reportCategories[number] {
  return typeof value === 'string' && reportCategories.includes(value as typeof reportCategories[number]);
}

export function isStatus(value: unknown): value is typeof reportStatuses[number] {
  return typeof value === 'string' && reportStatuses.includes(value as typeof reportStatuses[number]);
}

export function validCoordinates(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 33 && latitude <= 39
    && longitude >= 124 && longitude <= 132;
}

export function extensionFor(contentType: string) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/heic') return 'heic';
  if (contentType === 'image/heif') return 'heif';
  return 'jpg';
}
