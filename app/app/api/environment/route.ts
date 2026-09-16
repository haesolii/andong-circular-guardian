import { bindings, extensionFor, validCoordinates } from '@/lib/report-store';
import { allowedOrigin, jsonResponse, preflight } from '@/lib/environment-http';
import {
  crops,
  occurrenceStates,
  comparisons,
  processingStates,
  villages,
  DEMO_WORKER,
  demoVerifications,
  reportEvidence,
  type Verification,
} from '@/lib/environment-data';
export const OPTIONS = preflight;
type Row = {
  id: string;
  payload: string;
  photo_key?: string;
  created_at?: number;
  kind?: string;
};
export async function GET(request: Request) {
  if (!allowedOrigin(request))
    return jsonResponse(request, { error: '허용되지 않은 요청입니다.' }, 403);
  try {
    const { DB } = bindings();
    const [records, docs] = await Promise.all([
      DB.prepare(
        'SELECT id,payload,photo_key,created_at FROM environment_records ORDER BY created_at DESC LIMIT 1000',
      ).all<Row>(),
      DB.prepare(
        'SELECT id,kind,payload FROM environment_documents ORDER BY updated_at DESC LIMIT 1000',
      ).all<Row>(),
    ]);
    const documents = docs.results ?? [];
    return jsonResponse(request, {
      records: (records.results ?? []).map((r) => ({
        ...JSON.parse(r.payload),
        id: r.id,
        photo: r.photo_key
          ? '/api/photo?key=' + encodeURIComponent(r.photo_key)
          : undefined,
        createdAt: new Date(r.created_at!).toISOString(),
      })),
      tasks: documents
        .filter((d) => d.kind === 'task')
        .map((d) => JSON.parse(d.payload)),
      reports: documents
        .filter((d) => d.kind === 'report')
        .map((d) => JSON.parse(d.payload)),
      inputs: documents.find((d) => d.kind === 'inputs')
        ? JSON.parse(documents.find((d) => d.kind === 'inputs')!.payload)
        : null,
    });
  } catch {
    return jsonResponse(
      request,
      { error: '공유 자료를 불러오지 못했습니다. 연결을 확인해 주세요.' },
      503,
    );
  }
}
function invalid(message: string) {
  throw new Error(message);
}
function text(v: unknown, max = 500) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function period(v: unknown) {
  return typeof v === 'string' && /^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(v);
}
export async function POST(request: Request) {
  if (!allowedOrigin(request))
    return jsonResponse(request, { error: '허용되지 않은 요청입니다.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 11 * 1024 * 1024)
    return jsonResponse(
      request,
      { error: '사진은 10MB 이하로 첨부해 주세요.' },
      413,
    );
  let uploadedKey: string | null = null;
  try {
    const { DB, REPORT_PHOTOS } = bindings();
    const isForm = request.headers
      .get('content-type')
      ?.includes('multipart/form-data');
    const form = isForm ? await request.formData() : null;
    const body = (
      form ? Object.fromEntries(form.entries()) : await request.json()
    ) as Record<string, unknown>;
    const now = Date.now();
    const action = body.action;
    const inputRow =
      action === 'verify' || action === 'report'
        ? await DB.prepare(
            'SELECT payload FROM environment_documents WHERE id=?',
          )
            .bind('prediction-inputs')
            .first<Row>()
        : null;
    const overrides: Array<{ id: string; area: number; coefficient: number }> =
      inputRow ? JSON.parse(inputRow.payload) : [];
    const currentInputs = villages.map((v) => {
      const override = overrides.find((i) => i.id === v.id);
      return {
        ...v,
        ...override,
        source: override ? '사용자 입력 · 발생계수 검증 전' : v.source,
      };
    });
    if (action === 'verify') {
      const id = text(body.id, 64);
      if (!/^[a-f0-9-]{36}$/.test(id))
        return jsonResponse(
          request,
          { error: '기록 식별자가 올바르지 않습니다.' },
          400,
        );
      const existing = await DB.prepare(
        'SELECT id FROM environment_records WHERE id=?',
      )
        .bind(id)
        .first();
      if (existing)
        return jsonResponse(request, { saved: true, id, duplicate: true });
      const villageId = text(body.villageId),
        crop = text(body.crop);
      const lat = Number(body.lat),
        lng = Number(body.lng),
        accuracy =
          body.accuracy == null || body.accuracy === ''
            ? null
            : Number(body.accuracy);
      if (
        !villages.some((v) => v.id === villageId) ||
        !crops.includes(crop as (typeof crops)[number]) ||
        !period(body.period) ||
        !validCoordinates(lat, lng) ||
        !occurrenceStates.includes(body.occurrence as never) ||
        !comparisons.includes(body.comparison as never) ||
        !processingStates.includes(body.processing as never) ||
        (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0))
      )
        return jsonResponse(
          request,
          { error: '작물, 현장 상태, 대상 기간과 GPS 좌표를 확인해 주세요.' },
          400,
        );
      const measurementFields = [
        body.areaHa,
        body.observedTons,
        body.measurementMethod,
        body.measurementCoverage,
      ];
      const present = (v: unknown) => v !== undefined && v !== null && v !== '';
      let measurement: Verification['measurement'];
      if (measurementFields.some(present)) {
        const numeric = (v: unknown) =>
          (typeof v === 'number' ||
            (typeof v === 'string' && v.trim() !== '')) &&
          Number.isFinite(Number(v));
        if (
          !measurementFields.every(present) ||
          !numeric(body.areaHa) ||
          !numeric(body.observedTons) ||
          Number(body.areaHa) <= 0 ||
          Number(body.areaHa) > 100000 ||
          Number(body.observedTons) < 0 ||
          Number(body.observedTons) > 100000 ||
          typeof body.measurementMethod !== 'string' ||
          !['weighed', 'estimated'].includes(body.measurementMethod) ||
          typeof body.measurementCoverage !== 'string' ||
          !['complete', 'partial'].includes(body.measurementCoverage)
        ) {
          return jsonResponse(
            request,
            {
              error:
                '표본량 기록은 조사면적(0 초과), 부산물량(0 이상), 확인방법, 조사범위를 모두 입력해 주세요. 최대값은 각각 100,000입니다.',
            },
            400,
          );
        }
        measurement = {
          areaHa: Number(body.areaHa),
          tons: Number(body.observedTons),
          method: body.measurementMethod as 'weighed' | 'estimated',
          coverage: body.measurementCoverage as 'complete' | 'partial',
        };
      }
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(
          request.headers.get('cf-connecting-ip') || 'local',
        ),
      );
      const clientHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const count = await DB.prepare(
        'SELECT COUNT(*) AS n FROM environment_records WHERE client_hash=? AND created_at>?',
      )
        .bind(clientHash, now - 3600000)
        .first<{ n: number }>();
      if ((count?.n ?? 0) >= 30)
        return jsonResponse(
          request,
          { error: '시간당 30건까지 저장할 수 있습니다.' },
          429,
        );
      const photo = form?.get('photo');
      if (photo instanceof File && photo.size) {
        if (
          photo.size > 10 * 1024 * 1024 ||
          ![
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
          ].includes(photo.type)
        )
          return jsonResponse(
            request,
            { error: '10MB 이하의 JPG, PNG, WEBP, HEIC 사진을 선택해 주세요.' },
            400,
          );
        uploadedKey = id + '.' + extensionFor(photo.type);
        await REPORT_PHOTOS.put(uploadedKey, await photo.arrayBuffer(), {
          httpMetadata: { contentType: photo.type },
        });
      }
      const record = {
        id,
        villageId,
        workerId: DEMO_WORKER,
        period: body.period,
        crop,
        occurrence: body.occurrence,
        comparison: body.comparison,
        processing: body.processing,
        note: text(body.note),
        lat,
        lng,
        accuracy,
        measurement,
        prediction: (() => {
          const v = currentInputs.find((v) => v.id === villageId)!;
          return {
            crop: v.crop,
            coefficient: v.coefficient,
            month: v.month,
            source: v.source,
            capturedAt: new Date(now).toISOString(),
          };
        })(),
        createdAt: new Date(now).toISOString(),
      };
      await DB.prepare(
        'INSERT INTO environment_records (id,worker_id,village_id,period,payload,photo_key,client_hash,created_at) VALUES (?,?,?,?,?,?,?,?)',
      )
        .bind(
          id,
          DEMO_WORKER,
          villageId,
          body.period,
          JSON.stringify(record),
          uploadedKey,
          clientHash,
          now,
        )
        .run();
      return jsonResponse(
        request,
        {
          saved: true,
          record: {
            ...record,
            photo: uploadedKey
              ? '/api/photo?key=' + encodeURIComponent(uploadedKey)
              : undefined,
          },
        },
        201,
      );
    }
    let id: string;
    let payload: unknown;
    let kind: string;
    if (action === 'assign') {
      if (
        !villages.some((v) => v.id === body.villageId) ||
        !period(body.period)
      )
        return jsonResponse(
          request,
          { error: '마을과 대상 기간을 선택해 주세요.' },
          400,
        );
      id = 'task-' + String(body.period) + '-' + String(body.villageId);
      kind = 'task';
      payload = {
        id,
        villageId: body.villageId,
        period: body.period,
        workerId: DEMO_WORKER,
        note:
          text(body.note) || '예측자료와 실제 현장 상태를 표본 확인해 주세요.',
        createdAt: new Date(now).toISOString(),
      };
    } else if (action === 'report') {
      if (
        !period(body.period) ||
        !text(body.analysis, 5000) ||
        !text(body.title, 120)
      )
        return jsonResponse(
          request,
          { error: '보고서 제목과 분석을 입력해 주세요.' },
          400,
        );
      if (
        body.district !== '전체' &&
        !villages.some((v) => v.district === body.district)
      )
        return jsonResponse(
          request,
          { error: '올바른 지역을 선택해 주세요.' },
          400,
        );
      id =
        'report-' +
        String(body.period) +
        '-' +
        String(body.district) +
        '-' +
        DEMO_WORKER;
      kind = 'report';
      const evidenceRows = await DB.prepare(
        'SELECT id,payload,photo_key FROM environment_records ORDER BY created_at DESC LIMIT 1000',
      ).all<Row>();
      const evidenceRecords: Verification[] = (evidenceRows.results ?? []).map(
        (r) => ({
          ...JSON.parse(r.payload),
          id: r.id,
          photo: r.photo_key || undefined,
        }),
      );
      payload = {
        id,
        workerId: DEMO_WORKER,
        period: body.period,
        district: body.district,
        title: text(body.title, 120),
        analysis: text(body.analysis, 5000),
        recommendation: text(body.recommendation, 3000),
        updatedAt: new Date(now).toISOString(),
        evidence: reportEvidence(
          currentInputs,
          [...evidenceRecords, ...demoVerifications],
          String(body.period),
          String(body.district),
          new Date(now).toISOString(),
        ),
      };
    } else if (action === 'inputs') {
      if (!Array.isArray(body.inputs) || body.inputs.length !== villages.length)
        return jsonResponse(
          request,
          { error: '12개 예시 마을의 입력자료가 필요합니다.' },
          400,
        );
      const unique = new Set<string>();
      for (const input of body.inputs) {
        if (
          !input ||
          !villages.some((v) => v.id === input.id) ||
          unique.has(input.id) ||
          typeof input.area !== 'number' ||
          !Number.isFinite(input.area) ||
          input.area < 0 ||
          input.area > 100000 ||
          typeof input.coefficient !== 'number' ||
          !Number.isFinite(input.coefficient) ||
          input.coefficient < 0 ||
          input.coefficient > 1000000
        )
          return jsonResponse(
            request,
            { error: '면적과 발생계수는 범위 내의 숫자로 입력해 주세요.' },
            400,
          );
        unique.add(input.id);
      }
      id = 'prediction-inputs';
      kind = 'inputs';
      payload = body.inputs.map(
        (v: { id: string; area: number; coefficient: number }) => ({
          id: v.id,
          area: v.area,
          coefficient: v.coefficient,
        }),
      );
    } else {
      return jsonResponse(request, { error: '지원하지 않는 작업입니다.' }, 400);
    }
    await DB.prepare(
      'INSERT INTO environment_documents (id,kind,payload,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at',
    )
      .bind(id, kind, JSON.stringify(payload), now)
      .run();
    return jsonResponse(request, { saved: true, data: payload }, 201);
  } catch (error) {
    if (uploadedKey)
      await bindings()
        .REPORT_PHOTOS.delete(uploadedKey)
        .catch(() => undefined);
    return jsonResponse(
      request,
      {
        error:
          error instanceof SyntaxError
            ? '입력 형식을 확인해 주세요.'
            : '저장에 실패했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.',
      },
      500,
    );
  }
}
