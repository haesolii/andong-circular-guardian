import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  villages,
  demoVerifications,
  predictTons,
  summarize,
  csvCell,
  dataQuality,
  compareMeasurement,
  recordsGeoJson,
  reportEvidence,
  analysisReportText,
  downloadFile,
} from '../lib/environment-data.ts';
test('prediction uses hectares and kg per hectare, reporting tonnes', () => {
  assert.equal(predictTons({ area: 10, coefficient: 1240 }), 12.4);
  assert.equal(predictTons({ area: 0, coefficient: 1240 }), 0);
});
test('period and district filters agree across metrics', () => {
  const s = summarize(villages, demoVerifications, '2027-10', '임하면');
  assert.equal(s.selected.length, 3);
  assert.equal(s.filtered.length, 9);
  assert.ok(Math.abs(s.tons - 30.12) < 1e-9);
  assert.equal(s.concentrated, 1);
  assert.equal(s.agreement, Math.round((s.matched / 9) * 100));
});
test('empty periods do not claim accuracy or generate NaN', () => {
  const s = summarize(villages, [], '2027-12', '임하면');
  assert.equal(s.tons, 0);
  assert.equal(s.agreement, null);
  assert.equal(s.filtered.length, 0);
});
test('a new verification increments metrics and agreement denominator', () => {
  const before = summarize(villages, demoVerifications, '2027-10', '임하면');
  const s = summarize(
    villages,
    [
      ...demoVerifications,
      {
        ...demoVerifications[0],
        id: 'live',
        demo: false,
        comparison: '예상과 유사',
      },
    ],
    '2027-10',
    '임하면',
  );
  assert.equal(s.filtered.length, before.filtered.length + 1);
  assert.equal(s.matched, before.matched + 1);
  assert.equal(s.tons, before.tons);
});
test('spreadsheet exports escape quotes, newlines and formula prefixes', () => {
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell('가\n나'), '"가\n나"');
});

const measured = {
  ...demoVerifications[0],
  id: 'live-measured',
  demo: false,
  occurrence: '발생 완료',
  measurement: {
    areaHa: 0.5,
    tons: 0,
    method: 'weighed',
    coverage: 'complete',
  },
  prediction: {
    crop: '고추',
    coefficient: 1240,
    month: 10,
    source: 'test assumption',
    capturedAt: '2026-09-15T00:00:00Z',
  },
};
test('example-only and empty quality denominators remain uncalculated', () => {
  const q = dataQuality(demoVerifications, ['imha-a']);
  assert.equal(q.total, 0);
  assert.equal(q.gpsRate, null);
  assert.equal(q.comparableRate, null);
  assert.equal(q.coverageRate, 0);
  assert.equal(dataQuality([]).coverageRate, null);
});
test('partial, unfinished, wrong-crop/month and historic records are not quantitatively comparable', () => {
  for (const record of [
    demoVerifications[0],
    { ...measured, occurrence: '발생 중' },
    { ...measured, crop: '콩' },
    { ...measured, period: '2027-11' },
    {
      ...measured,
      measurement: { ...measured.measurement, coverage: 'partial' },
    },
    { ...measured, prediction: { ...measured.prediction, coefficient: 0 } },
  ])
    assert.equal(compareMeasurement(record), null);
});
test('zero tonnes is an observation and comparison uses sample area, never village area', () => {
  const result = compareMeasurement(measured);
  assert.equal(result.expectedTons, 0.62);
  assert.equal(result.differenceTons, -0.62);
  assert.equal(result.observedKgPerHa, 0);
});
test('quality counts only live scoped records and deduplicates village coverage', () => {
  const s = summarize(
    villages,
    [
      ...demoVerifications,
      measured,
      { ...measured, id: 'two', photo: '/example.jpg' },
      { ...measured, id: 'other-month', period: '2027-12' },
    ],
    '2027-10',
    '임하면',
  );
  const q = dataQuality(
    s.filtered,
    s.selected.map((v) => v.id),
  );
  assert.equal(q.total, 2);
  assert.equal(q.gpsRate, 100);
  assert.equal(q.photoRate, 50);
  assert.equal(q.comparableRate, 100);
  assert.equal(q.coverageRate, 33);
  assert.equal(q.missingRate, 0);
});
test('GeoJSON excludes seeds and private notes, preserves missing GPS as null, uses longitude first', () => {
  const data = recordsGeoJson([
    ...demoVerifications,
    measured,
    { ...measured, id: 'no-gps', lat: NaN },
  ]);
  assert.equal(data.type, 'FeatureCollection');
  assert.equal(data.features.length, 2);
  assert.deepEqual(data.features[0].geometry.coordinates, [128.85, 36.52]);
  assert.equal(data.features[1].geometry, null);
  assert.equal(data.features[0].properties.observed_tons, 0);
  assert.equal(data.features[0].properties.expected_sample_tons, 0.62);
  assert.equal('note' in data.features[0].properties, false);
});
test('report snapshot and exports remain stable after changing inputs and records', () => {
  const inputs = structuredClone(villages);
  const records = [structuredClone(measured)];
  const evidence = reportEvidence(
    inputs,
    records,
    '2027-10',
    '임하면',
    '2026-09-15T00:00:00Z',
  );
  const report = {
    title: 'test',
    period: '2027-10',
    district: '임하면',
    analysis: 'analysis',
    recommendation: 'review',
    evidence,
  };
  const before = analysisReportText(report);
  inputs[0].coefficient = 9999;
  records.push({ ...measured, id: 'later' });
  assert.equal(evidence.inputs[0].coefficient, 1240);
  assert.deepEqual(evidence.recordIds, ['live-measured']);
  assert.equal(evidence.quality.total, 1);
  assert.equal(analysisReportText(report), before);
});
test('JSON download has no BOM while CSV keeps BOM', async () => {
  const oldDocument = globalThis.document,
    oldCreate = URL.createObjectURL,
    oldRevoke = URL.revokeObjectURL;
  const blobs = [];
  globalThis.document = { createElement: () => ({ click() {} }) };
  URL.createObjectURL = (b) => {
    blobs.push(b);
    return 'blob:test';
  };
  URL.revokeObjectURL = () => {};
  try {
    downloadFile(
      'map.geojson',
      '{"type":"FeatureCollection"}',
      'application/geo+json',
    );
    downloadFile('data.csv', 'id', 'text/csv');
    assert.equal(new Uint8Array(await blobs[0].arrayBuffer())[0], 123);
    assert.deepEqual(
      [...new Uint8Array(await blobs[1].arrayBuffer()).slice(0, 3)],
      [239, 187, 191],
    );
  } finally {
    globalThis.document = oldDocument;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});
