import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const origin = 'http://localhost:3000';
const field = 'http://localhost:3001';
const id = crypto.randomUUID();
const period = '2099-10';
const taskId = 'task-' + period + '-imha-a';
const reportId = 'report-' + period + '-전체-demo-worker-01';
const measuredId = crypto.randomUUID();
const blankId = crypto.randomUUID();
const call = (body, headers = { Origin: field }) =>
  fetch(origin + '/api/environment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
const multipart = (body) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) form.set(key, String(value));
  return fetch(origin + '/api/environment', {
    method: 'POST',
    headers: { Origin: field },
    body: form,
  });
};
const snapshot = await fetch(origin + '/api/environment').then((r) => r.json());
assert.ok(
  !snapshot.tasks.some((t) => t.id === taskId) &&
    !snapshot.reports.some((t) => t.id === reportId),
  'Test target must be unused',
);
try {
  const preflight = await fetch(origin + '/api/environment', {
    method: 'OPTIONS',
    headers: {
      Origin: field,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), field);
  const forbidden = await call(
    { action: 'assign', villageId: 'imha-a', period },
    { Origin: 'https://not-allowed.example' },
  );
  assert.equal(forbidden.status, 403);
  const invalid = await call({
    action: 'verify',
    id,
    villageId: 'imha-a',
    period,
    crop: '고추',
    lat: 0,
    lng: 0,
  });
  assert.equal(invalid.status, 400);
  const payload = {
    action: 'verify',
    id,
    villageId: 'imha-a',
    period,
    crop: '고추',
    occurrence: '발생 중',
    comparison: '예상과 유사',
    processing: '현장 보관',
    note: '자동 검증용 임시 기록',
    lat: 36.52,
    lng: 128.85,
    accuracy: 8,
  };
  const saved = await call(payload);
  assert.equal(saved.status, 201);
  assert.equal(saved.headers.get('access-control-allow-origin'), field);
  const duplicate = await call(payload).then((r) => r.json());
  assert.equal(duplicate.duplicate, true);
  const measurement = {
    areaHa: 0.5,
    observedTons: 0,
    measurementMethod: 'weighed',
    measurementCoverage: 'complete',
  };
  for (const override of [
    { observedTons: null },
    { areaHa: 0 },
    { areaHa: true },
    { observedTons: -1 },
    { observedTons: 'NaN' },
    { measurementMethod: 'unknown' },
    { measurementMethod: ['weighed'] },
    { measurementCoverage: 'unknown' },
  ]) {
    const rejected = await call({
      ...payload,
      id: measuredId,
      ...measurement,
      ...override,
    });
    assert.equal(rejected.status, 400, JSON.stringify(override));
  }
  const blankMeasurement = {
    areaHa: '',
    observedTons: '',
    measurementMethod: '',
    measurementCoverage: '',
  };
  const blank = await multipart({
    ...payload,
    id: blankId,
    ...blankMeasurement,
  });
  assert.equal(blank.status, 201);
  assert.equal((await blank.json()).record.measurement, undefined);
  const partial = await multipart({
    ...payload,
    id: measuredId,
    ...blankMeasurement,
    areaHa: '0.5',
  });
  assert.equal(partial.status, 400);
  const quantified = await multipart({
    ...payload,
    id: measuredId,
    occurrence: '발생 완료',
    ...measurement,
    note: 'x'.repeat(2 * 1024 * 1024),
    prediction: JSON.stringify({ coefficient: 9999 }),
  });
  assert.equal(quantified.status, 201);
  const quantifiedRecord = (await quantified.json()).record;
  assert.equal(
    quantifiedRecord.note.length,
    500,
    'Multipart above 1MB reaches the bounded API parser',
  );
  assert.equal(quantifiedRecord.measurement.tons, 0);
  assert.equal(quantifiedRecord.measurement.areaHa, 0.5);
  const expectedCoefficient =
    snapshot.inputs?.find((v) => v.id === 'imha-a')?.coefficient ?? 1240;
  assert.equal(
    quantifiedRecord.prediction.coefficient,
    expectedCoefficient,
    'Prediction is server-owned',
  );
  const assigned = await call({
    action: 'assign',
    villageId: 'imha-a',
    period,
    note: '자동 검증용 임시 업무',
  });
  assert.equal(assigned.status, 201);
  const report = await call({
    action: 'report',
    period,
    district: '전체',
    title: '자동 검증용 임시 보고서',
    analysis: '사용자가 작성한 분석 내용을 그대로 저장합니다.',
    recommendation: '검토 제안',
  });
  assert.equal(report.status, 201);
  const read = await fetch(origin + '/api/environment', {
    headers: { Origin: field },
  }).then((r) => r.json());
  assert.equal(read.records.filter((r) => r.id === id).length, 1);
  assert.equal(read.records.find((r) => r.id === id).lat, 36.52);
  assert.ok(read.tasks.some((t) => t.id === taskId));
  assert.equal(
    read.reports.find((t) => t.id === reportId).analysis,
    '사용자가 작성한 분석 내용을 그대로 저장합니다.',
  );
  assert.deepEqual(read.records.find((r) => r.id === measuredId).measurement, {
    areaHa: 0.5,
    tons: 0,
    method: 'weighed',
    coverage: 'complete',
  });
  assert.equal(
    read.records.find((r) => r.id === id).measurement,
    undefined,
    'Older clients can omit measurements',
  );
  const evidence = read.reports.find((r) => r.id === reportId).evidence;
  assert.equal(evidence.quality.total, 3);
  assert.ok(evidence.recordIds.includes(measuredId));
  assert.equal(
    evidence.inputs.find((v) => v.id === 'imha-a').coefficient,
    expectedCoefficient,
  );
  console.log(
    'PASS: origin checks, JSON/multipart validation, optional/blank/partial measurements, persistence, idempotency, task sharing and report read-back',
  );
} finally {
  const folder = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  const dbfile = readdirSync(folder).find(
    (f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite',
  );
  const db = new DatabaseSync(resolve(folder, dbfile));
  db.exec('PRAGMA busy_timeout=5000');
  db.prepare('DELETE FROM environment_records WHERE id=?').run(id);
  db.prepare('DELETE FROM environment_records WHERE id=?').run(measuredId);
  db.prepare('DELETE FROM environment_records WHERE id=?').run(blankId);
  db.prepare('DELETE FROM environment_documents WHERE id IN (?,?)').run(
    taskId,
    reportId,
  );
  db.close();
  console.log('Temporary test records removed; existing data retained.');
}
