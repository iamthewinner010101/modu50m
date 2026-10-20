import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ROADVIEW_AUDIT_STATUSES,
  createRoadviewAuditIndex,
  getRenderableRoadviewImage,
  isLocalRoadviewImagePath,
  resolveRoadviewAuditStatus,
  summarizeRoadviewAudit,
} from './daejeonRoadviewAudit.js';

const candidates = [
  { id: 'inside-1', coordinateValid: true, roadviewStatus: 'unchecked' },
  { id: 'inside-2', coordinateValid: true, roadviewStatus: 'unchecked' },
  { id: 'inside-3', coordinateValid: true, roadviewStatus: 'unchecked' },
  { id: 'outside-1', coordinateValid: false, roadviewStatus: 'unchecked' },
];

test('keeps the six status taxonomy closed and uses an audit entry as the source of status', () => {
  assert.deepEqual(ROADVIEW_AUDIT_STATUSES, [
    'unchecked',
    'panorama_found',
    'no_panorama',
    'mismatch',
    'needs_human_review',
    'verified',
  ]);
  const audit = {
    entries: [{ candidateId: 'inside-1', status: 'needs_human_review' }],
  };
  assert.equal(createRoadviewAuditIndex(audit).size, 1);
  assert.equal(resolveRoadviewAuditStatus(candidates[0], audit.entries[0]), 'needs_human_review');
  assert.equal(resolveRoadviewAuditStatus(candidates[1], null), 'unchecked');
  assert.equal(resolveRoadviewAuditStatus(candidates[2], { status: 'unknown' }), 'unchecked');
});

test('counts processed and remaining eligible rows separately from the out-of-bounds row', () => {
  const rows = candidates.map((candidate) => ({
    ...candidate,
    roadviewEligible: candidate.coordinateValid,
    roadviewAudit: candidate.id === 'inside-1'
      ? { candidateId: candidate.id, status: 'needs_human_review' }
      : null,
  }));
  const summary = summarizeRoadviewAudit(rows);

  assert.equal(summary.eligibleCount, 3);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.remainingCount, 2);
  assert.equal(summary.verifiedCount, 0);
  assert.equal(summary.humanReviewCount, 1);
  assert.deepEqual(summary.statusCounts, {
    unchecked: 2,
    panorama_found: 0,
    no_panorama: 0,
    mismatch: 0,
    needs_human_review: 1,
    verified: 0,
  });
});

test('only exposes a hashed same-origin image as an inline Roadview asset', () => {
  const sha256 = 'a'.repeat(64);
  assert.equal(isLocalRoadviewImagePath('/modu50m/review-photos/daejeon/donggwangpark.jpg'), true);
  assert.equal(isLocalRoadviewImagePath('https://map.kakao.com/roadview.jpg'), false);
  assert.equal(isLocalRoadviewImagePath('//cdn.example.com/roadview.jpg'), false);
  assert.equal(getRenderableRoadviewImage({
    capture: {
      imageStored: true,
      imagePath: '/modu50m/review-photos/daejeon/donggwangpark.jpg',
      imageSha256: sha256,
    },
  }), '/modu50m/review-photos/daejeon/donggwangpark.jpg');
  assert.equal(getRenderableRoadviewImage({
    capture: {
      imageStored: true,
      imagePath: '/modu50m/review-photos/daejeon/donggwangpark.jpg',
      imageSha256: null,
    },
  }), null);
});
