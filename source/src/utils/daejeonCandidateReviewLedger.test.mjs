import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA,
  createDaejeonCandidateReviewDraft,
  createEmptyDaejeonCandidateReviewLedger,
  exportDaejeonCandidateReviewLedger,
  importDaejeonCandidateReviewLedger,
  loadDaejeonCandidateReviewLedger,
  persistDaejeonCandidateReviewLedger,
  saveDaejeonCandidateReview,
  summarizeDaejeonCandidateReviewLedger,
} from './daejeonCandidateReviewLedger.js';

const candidate = {
  id: 'park-1',
  name: '샘플공원',
  sourceRecordId: 'parks:1',
  lat: 36.3504,
  lng: 127.3845,
};

function createMemoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
    value() {
      return value;
    },
  };
}

test('starts every candidate as unchecked and never derives verification from candidate or Roadview data', () => {
  const draft = createDaejeonCandidateReviewDraft({
    ...candidate,
    roadviewStatus: 'verified',
    placeMatchVerified: true,
    accessibilityVerified: true,
  });

  assert.equal(draft.placeMatchStatus, 'unchecked');
  assert.equal(draft.accessibilityStatus, 'unchecked');
  assert.equal(draft.studentReviewStatus, 'unchecked');
  assert.equal(draft.independentReviewStatus, 'unchecked');
  assert.equal(draft.fieldCheckStatus, 'unchecked');
});

test('changes status only through explicit save and appends a revision history event', () => {
  const empty = createEmptyDaejeonCandidateReviewLedger();
  const draft = {
    ...createDaejeonCandidateReviewDraft(candidate),
    recordedBy: '허태윤',
    placeMatchStatus: 'appears_match',
    placeMatchNote: '로드뷰 표지판과 공식 장소명을 함께 확인함',
    accessibilityStatus: 'uncertain',
    accessibilityNote: '입구 턱 높이는 화면만으로 판단하기 어려움',
    studentReviewStatus: 'reviewed_by_taeyun',
    studentReviewNote: '사진에서 보이는 표지판과 입구 방향을 직접 비교했다.',
  };

  assert.deepEqual(empty.entries, {});
  const saved = saveDaejeonCandidateReview(empty, candidate, draft, {
    now: '2026-09-06T05:00:00.000Z',
  });
  const entry = saved.entries[candidate.id];

  assert.equal(entry.revision, 1);
  assert.equal(entry.review.placeMatchStatus, 'appears_match');
  assert.equal(entry.review.accessibilityStatus, 'uncertain');
  assert.equal(entry.review.studentReviewStatus, 'reviewed_by_taeyun');
  assert.equal(entry.history.length, 1);
  assert.equal(entry.history[0].action, 'explicit_form_save');
  assert.equal(entry.history[0].savedAt, '2026-09-06T05:00:00.000Z');
  assert.equal(entry.evidenceBoundary.identityVerified, false);
  assert.equal(entry.evidenceBoundary.automaticVerification, false);
});

test('refuses claimed review states without the required human memo or independent reviewer', () => {
  const empty = createEmptyDaejeonCandidateReviewLedger();

  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, {
      ...createDaejeonCandidateReviewDraft(candidate),
      recordedBy: '허태윤',
      studentReviewStatus: 'reviewed_by_taeyun',
      studentReviewNote: '짧음',
    }),
    /태윤 직접 검수 메모/,
  );

  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, {
      ...createDaejeonCandidateReviewDraft(candidate),
      recordedBy: '교사',
      independentReviewStatus: 'reviewed_by_other',
      independentReviewNote: '다른 사람이 같은 화면을 다시 살펴본 기록입니다.',
    }),
    /독립 검수자 이름/,
  );

  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, {
      ...createDaejeonCandidateReviewDraft(candidate),
      recordedBy: '교사',
      studentReviewStatus: 'reviewed_by_taeyun',
      studentReviewNote: '태윤이가 직접 로드뷰와 좌표를 비교했다고 기록함',
    }),
    /저장자는 태윤 또는 허태윤/,
  );

  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, {
      ...createDaejeonCandidateReviewDraft(candidate),
      recordedBy: '허태윤',
      independentReviewStatus: 'reviewed_by_other',
      independentReviewerName: '태윤',
      independentReviewNote: '같은 후보를 별도로 다시 확인했다고 입력한 기록이다.',
    }),
    /태윤과 다른 사람/,
  );
});

test('keeps field visit separate and requires visit date plus evidence memo', () => {
  const empty = createEmptyDaejeonCandidateReviewLedger();
  const base = {
    ...createDaejeonCandidateReviewDraft(candidate),
    recordedBy: '허태윤',
    fieldCheckStatus: 'visited',
  };

  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, base),
    /현장 방문일/,
  );
  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, {
      ...base,
      fieldVisitedOn: '2026-09-05',
    }),
    /현장 확인 메모/,
  );
  assert.throws(
    () => saveDaejeonCandidateReview(empty, candidate, {
      ...base,
      fieldVisitedOn: '2026-09-07',
      fieldCheckNote: '미래 날짜를 현장 방문 기록으로 저장하면 안 된다.',
    }, { now: '2026-09-06T05:00:00.000Z' }),
    /미래일 수 없습니다/,
  );

  const saved = saveDaejeonCandidateReview(empty, candidate, {
    ...base,
    fieldVisitedOn: '2026-09-05',
    fieldCheckNote: '현장에서 입구 위치와 턱 유무를 사진 파일 IMG_1001과 함께 기록함',
  }, { now: '2026-09-06T05:00:00.000Z' });

  assert.equal(saved.entries[candidate.id].review.fieldCheckStatus, 'visited');
});

test('persists, reloads, exports, and imports one validated ledger without promoting claims', () => {
  const saved = saveDaejeonCandidateReview(
    createEmptyDaejeonCandidateReviewLedger(),
    candidate,
    {
      ...createDaejeonCandidateReviewDraft(candidate),
      recordedBy: '허태윤',
      accessibilityStatus: 'barrier_observed',
      accessibilityNote: '출입구 앞에 계단으로 보이는 구조가 있어 현장 확인이 필요함',
      fieldCheckStatus: 'visit_needed',
    },
    { now: '2026-09-06T05:00:00.000Z' },
  );
  const storage = createMemoryStorage();

  persistDaejeonCandidateReviewLedger(storage, saved);
  const loaded = loadDaejeonCandidateReviewLedger(storage);
  assert.equal(loaded.error, '');
  assert.equal(loaded.ledger.entries[candidate.id].review.accessibilityStatus, 'barrier_observed');

  const exported = exportDaejeonCandidateReviewLedger(saved, {
    now: '2026-09-06T05:10:00.000Z',
  });
  const packet = JSON.parse(exported);
  assert.equal(packet.schema, DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA);
  assert.equal(packet.exportedAt, '2026-09-06T05:10:00.000Z');
  assert.equal(packet.evidenceBoundary.claim, 'human_entered_observation_not_verified_fact');

  const imported = importDaejeonCandidateReviewLedger(exported, new Set([candidate.id]));
  assert.equal(imported.entries[candidate.id].review.accessibilityStatus, 'barrier_observed');
  assert.equal(imported.entries[candidate.id].evidenceBoundary.automaticVerification, false);
});

test('rejects an import atomically when it contains an unknown candidate or invalid status', () => {
  const saved = saveDaejeonCandidateReview(
    createEmptyDaejeonCandidateReviewLedger(),
    candidate,
    { ...createDaejeonCandidateReviewDraft(candidate), recordedBy: '허태윤' },
    { now: '2026-09-06T05:00:00.000Z' },
  );
  const packet = JSON.parse(exportDaejeonCandidateReviewLedger(saved));
  packet.entries['unknown-candidate'] = {
    ...packet.entries[candidate.id],
    candidateId: 'unknown-candidate',
  };

  assert.throws(
    () => importDaejeonCandidateReviewLedger(JSON.stringify(packet), new Set([candidate.id])),
    /현재 후보 목록에 없는 ID/,
  );

  delete packet.entries['unknown-candidate'];
  packet.entries[candidate.id].review.placeMatchStatus = 'verified';
  assert.throws(
    () => importDaejeonCandidateReviewLedger(JSON.stringify(packet), new Set([candidate.id])),
    /장소 일치 상태/,
  );
});

test('summarizes explicit records while keeping observation and verification vocabulary separate', () => {
  const first = saveDaejeonCandidateReview(
    createEmptyDaejeonCandidateReviewLedger(),
    candidate,
    {
      ...createDaejeonCandidateReviewDraft(candidate),
      recordedBy: '허태윤',
      placeMatchStatus: 'uncertain',
      placeMatchNote: '간판이 가려져 있어 같은 장소인지 판단을 보류함',
      studentReviewStatus: 'reviewed_by_taeyun',
      studentReviewNote: '로드뷰 방향과 공식 좌표를 직접 비교하고 판단 보류로 기록했다.',
      independentReviewStatus: 'reviewed_by_other',
      independentReviewerName: '김검수',
      independentReviewNote: '태윤의 결과를 보지 않고 먼저 같은 후보를 확인했다.',
    },
    { now: '2026-09-06T05:00:00.000Z' },
  );
  const summary = summarizeDaejeonCandidateReviewLedger(first);

  assert.deepEqual(summary, {
    savedCandidateCount: 1,
    placeMatchObservedCount: 1,
    accessibilityObservedCount: 0,
    studentReviewedCount: 1,
    independentReviewedCount: 1,
    fieldVisitNeededCount: 0,
    fieldVisitedCount: 0,
  });
});
