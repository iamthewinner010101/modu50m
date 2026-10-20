import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAEJEON_DONG_STATUS_ORDER,
  groupDaejeonDongsByDistrict,
  getStatusDefinition,
  normalizeDaejeonDongCoverage,
  normalizeDaejeonLegalDongCoverage,
  summarizeDaejeonRegionRelations,
  summarizeDaejeonDongCoverage,
} from './daejeonDongCoverage.js';

test('keeps the supplied administrative-dong records and normalizes status aliases', () => {
  const result = normalizeDaejeonDongCoverage({
    expectedCount: 82,
    dongs: [
      { id: 'dong-a', name: '제공된 행정동', status: 'photo draft' },
      { id: 'dong-b', dongName: '상태 미지정 행정동', status: 'unknown-stage' },
    ],
  });

  assert.equal(result.expectedCount, 82);
  assert.equal(result.dongs.length, 2);
  assert.equal(result.dongs[0].status, 'photo_draft');
  assert.equal(result.dongs[0].name, '제공된 행정동');
  assert.equal(result.dongs[1].status, 'needs_recheck');
  assert.equal(result.dongs[1].name, '상태 미지정 행정동');
});

test('does not invent 82 names when the authoritative dataset is absent', () => {
  const result = normalizeDaejeonDongCoverage({ expectedCount: 82, dongs: [] });

  assert.equal(result.dongs.length, 0);
  assert.equal(result.expectedCount, 82);
  assert.equal(result.hasAuthoritativeRecords, false);
});

test('preserves official source dates and links for visible attribution', () => {
  const result = normalizeDaejeonDongCoverage({
    source: {
      title: '행정구역현황',
      url: 'https://example.test/city',
      retrievedAt: '2026-09-04',
      codeSource: {
        articleUrl: 'https://example.test/code',
        effectiveDate: '2026-07-20',
      },
    },
    dongs: [],
  });

  assert.equal(result.sourceLabel, '행정구역현황');
  assert.equal(result.sourceUrl, 'https://example.test/city');
  assert.equal(result.sourceRetrievedAt, '2026-09-04');
  assert.equal(result.codeSourceUrl, 'https://example.test/code');
  assert.equal(result.sourceEffectiveDate, '2026-07-20');
});

test('summarizes every required workflow status without collapsing human evidence stages', () => {
  const dongs = normalizeDaejeonDongCoverage([
    { id: 'a', name: '출처', status: 'source-frame' },
    { id: 'b', name: '후보', status: 'candidate' },
    { id: 'c', name: '사진', status: 'photo_draft' },
    { id: 'd', name: '학생', status: 'student_review' },
    { id: 'e', name: '독립', status: 'independent_review' },
    { id: 'f', name: '현장', status: 'field_confirmation' },
    { id: 'g', name: '재확인', status: 'needs_recheck' },
  ]).dongs;
  const summary = summarizeDaejeonDongCoverage(dongs, 82);

  assert.deepEqual(Object.keys(summary.counts), DAEJEON_DONG_STATUS_ORDER);
  assert.deepEqual(summary.counts, {
    source_frame: 1,
    candidate: 1,
    photo_draft: 1,
    student_review: 1,
    independent_review: 1,
    field_confirmation: 1,
    needs_recheck: 1,
  });
  assert.equal(summary.loadedCount, 7);
  assert.equal(summary.remainingCount, 75);
  assert.equal(summary.namedCount, 7);
});

test('exposes a visible definition for each status', () => {
  for (const status of DAEJEON_DONG_STATUS_ORDER) {
    const definition = getStatusDefinition(status);
    assert.equal(definition.key, status);
    assert.ok(definition.label);
    assert.ok(definition.description);
  }
});

test('groups supplied records by their provided district without inventing district names', () => {
  const dongs = normalizeDaejeonDongCoverage([
    { id: 'a', name: '첫 번째', district: '제공 구' },
    { id: 'b', name: '두 번째', district: '제공 구' },
    { id: 'c', name: '구 정보 없음' },
  ]).dongs;
  const groups = groupDaejeonDongsByDistrict(dongs);

  assert.deepEqual(groups.map((group) => group.label), ['제공 구', '자치구 정보 대기']);
  assert.deepEqual(groups.map((group) => group.dongs.map((dong) => dong.id)), [['a', 'b'], ['c']]);
});

test('normalizes legal dongs without collapsing their linked administrative dongs', () => {
  const result = normalizeDaejeonLegalDongCoverage({
    expectedLegalDongCount: 177,
    expectedRelationCount: 202,
    legalDongs: [
      {
        code: '3017011200',
        district: '서구',
        name: '둔산동',
        status: 'source_frame',
        administrativeDongs: [
          { code: '3017063000', name: '둔산1동' },
          { code: '3017064000', name: '둔산2동' },
          { code: '3017066000', name: '둔산3동' },
        ],
      },
    ],
  });

  assert.equal(result.expectedCount, 177);
  assert.equal(result.expectedRelationCount, 202);
  assert.equal(result.dongs[0].unitType, 'legal_dong');
  assert.equal(result.dongs[0].administrativeDongs.length, 3);
  assert.equal(result.dongs[0].spansMultipleAdministrativeDongs, true);
});

test('summarizes unique administrative-to-legal relations and multi-administrative legal dongs', () => {
  const legalDongs = normalizeDaejeonLegalDongCoverage({
    legalDongs: [
      {
        code: '3017011200',
        district: '서구',
        name: '둔산동',
        administrativeDongs: [
          { code: '3017063000', name: '둔산1동' },
          { code: '3017064000', name: '둔산2동' },
          { code: '3017066000', name: '둔산3동' },
        ],
      },
      {
        code: '3017010100',
        district: '서구',
        name: '복수동',
        administrativeDongs: [{ code: '3017051000', name: '복수동' }],
      },
    ],
  }).dongs;

  assert.deepEqual(summarizeDaejeonRegionRelations(legalDongs), {
    legalDongCount: 2,
    relationCount: 4,
    linkedAdministrativeDongCount: 4,
    multiAdministrativeLegalDongCount: 1,
  });
});
