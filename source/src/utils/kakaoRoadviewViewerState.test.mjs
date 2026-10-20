import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRoadviewViewerPresentation,
  getRoadviewViewerReviewState,
} from './kakaoRoadviewViewerState.js';

test('defaults every viewer review chip to unchecked when no ledger entry exists', () => {
  const state = getRoadviewViewerReviewState();

  assert.deepEqual(state, {
    placeMatchStatus: 'unchecked',
    placeMatchLabel: '확인 전',
    accessibilityStatus: 'unchecked',
    accessibilityLabel: '확인 전',
    studentReviewStatus: 'unchecked',
    studentReviewLabel: '확인 전',
  });
});

test('uses the saved ledger statuses for the viewer chips', () => {
  const state = getRoadviewViewerReviewState({
    placeMatchStatus: 'appears_match',
    accessibilityStatus: 'uncertain',
    studentReviewStatus: 'reviewed_by_taeyun',
  });

  assert.equal(state.placeMatchStatus, 'appears_match');
  assert.equal(state.placeMatchLabel, '사진상 일치로 보임');
  assert.equal(state.accessibilityStatus, 'uncertain');
  assert.equal(state.accessibilityLabel, '판단 보류');
  assert.equal(state.studentReviewStatus, 'reviewed_by_taeyun');
  assert.equal(state.studentReviewLabel, '태윤 직접 검수 기록');
});

test('does not trust unknown saved status values and keeps them unchecked', () => {
  const state = getRoadviewViewerReviewState({
    placeMatchStatus: 'verified',
    accessibilityStatus: 'accessible',
    studentReviewStatus: 'automatic',
  });

  assert.equal(state.placeMatchStatus, 'unchecked');
  assert.equal(state.accessibilityStatus, 'unchecked');
  assert.equal(state.studentReviewStatus, 'unchecked');
});

test('separates stored roadview image labels from LIVE 360 labels', () => {
  const stored = getRoadviewViewerPresentation({ showStoredFallback: true });
  const live = getRoadviewViewerPresentation({ isLive: true });
  const unavailable = getRoadviewViewerPresentation();

  assert.equal(stored.kind, 'stored');
  assert.equal(stored.headerLabel, '저장된 로드뷰 기록 이미지');
  assert.equal(stored.title, '저장된 로드뷰 기록 이미지');
  assert.equal(stored.imageCaption, '저장된 로드뷰 기록 이미지 · 360도 조작 불가');
  assert.equal(live.kind, 'live');
  assert.equal(live.headerLabel, 'LIVE 360°');
  assert.equal(live.title, 'LIVE 360°');
  assert.equal(live.badge, 'LIVE 360°');
  assert.equal(unavailable.kind, 'unavailable');
  assert.equal(unavailable.headerLabel, 'LIVE 360°');
  assert.equal(unavailable.title, 'LIVE 360° 연결 상태');
});
