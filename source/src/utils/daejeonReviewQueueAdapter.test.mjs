import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createDaejeonReviewQueueData,
  DAEJEON_REVIEW_QUEUE_STATUS,
  filterDaejeonReviewQueue,
} from './daejeonReviewQueueAdapter.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

const queue = createDaejeonReviewQueueData(
  readJson('src/data/daejeonPlaceCandidates.generated.json'),
  {
    roadviewAuditInput: readJson('src/data/daejeonRoadviewAudit.generated.json'),
    regionBridgeInput: readJson('src/data/daejeonCandidateRegionBridge.generated.json'),
  },
);

test('keeps official Daejeon source coverage separate from review readiness', () => {
  assert.equal(queue.summary.sourceRows, 828);
  assert.equal(queue.summary.plottableCandidateCount, 827);
  assert.equal(queue.summary.uniqueCoordinateCount, 784);
  assert.equal(queue.summary.validUniqueCoordinateCount, 783);
  assert.equal(queue.summary.duplicateCoordinateExtraRowCount, 44);
  assert.equal(queue.summary.photoAvailableCount, 1);
  assert.deepEqual(queue.summary.sourceCategoryCounts, {
    park: 471,
    wheelchair_charger: 251,
    library: 106,
  });
  assert.deepEqual(queue.sourceBoundary.reviewReadiness, {
    one_frame_ready: 0,
    place_match_only: 1,
    roadview_capture_required: 826,
    source_excluded: 1,
  });
  assert.deepEqual(queue.sourceBoundary.guideState, {
    three_regions_ready: 0,
    guide_required: 828,
  });
  assert.equal(queue.summary.placeMatchVerifiedCount, 0);
  assert.equal(queue.summary.accessibilityVerifiedCount, 0);
  assert.equal(queue.summary.studentReviewedCount, 0);
  assert.equal(queue.summary.independentReviewedCount, 0);
  assert.equal(queue.summary.fieldConfirmedCount, 0);
  assert.equal(queue.summary.administrativeDongCoverageCount, 82);
  assert.equal(queue.summary.administrativeDongExactCandidateCoverageCount, 54);
  assert.equal(queue.summary.expectedAdministrativeDongCount, 82);
  assert.equal(queue.summary.legalDongCoverageCount, 118);
  assert.equal(queue.summary.expectedLegalDongCount, 177);
});

test('keeps Donggwang Park as place-match-only and never invents accessibility regions', () => {
  const item = queue.items.find((candidate) => candidate.photo.available);

  assert.equal(item.name, '동광공원');
  assert.equal(item.reviewReadiness, DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY);
  assert.equal(item.photo.imagePath, '/modu50m/review-photos/daejeon-roadview/15012890-01711-donggwangpark.png');
  assert.equal(item.canOpenPlaceMatchQuestion, true);
  assert.equal(item.canOpenPhotoReview, false);
  assert.equal(item.guideState, 'guide_required');
  assert.equal(item.accessibilityQuestionsEnabled, false);
  assert.equal(item.location.placeMatchVerified, false);
  assert.equal(item.location.accessibilityVerified, false);
  assert.match(item.links.kakaoRoadview, /^https:\/\/map\.kakao\.com\/link\/roadview\//);
});

test('filters the mutually exclusive readiness counts without upgrading source rows', () => {
  assert.equal(
    filterDaejeonReviewQueue(queue.items, {
      status: DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY,
    }).length,
    1,
  );
  assert.equal(
    filterDaejeonReviewQueue(queue.items, {
      status: DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED,
    }).length,
    826,
  );
  assert.equal(
    filterDaejeonReviewQueue(queue.items, {
      status: DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED,
    }).length,
    1,
  );
  assert.equal(
    filterDaejeonReviewQueue(queue.items, {
      status: DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_VERIFIED,
    }).length,
    0,
  );
});
