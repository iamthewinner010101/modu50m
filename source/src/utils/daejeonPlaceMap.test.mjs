import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAEJEON_PLACE_PLOT_BOUNDS,
  filterDaejeonPlaceCandidates,
  normalizeDaejeonPlaceCandidates,
  projectDaejeonCoordinates,
  summarizeDaejeonPlaceCandidates,
} from './daejeonPlaceMap.js';
import { getCandidateReviewLinks } from './mapLinks.js';

const fixture = {
  candidates: [
    {
      id: 'park-1',
      sourceId: 'daejeon-parks',
      category: 'park',
      categoryLabel: '공원',
      name: '샘플공원',
      district: '서구',
      roadAddress: '대전광역시 서구 샘플로 1',
      lat: 36.3504,
      lng: 127.3845,
      basisDate: '2026-07-20',
      candidateStatus: 'candidate_only',
      roadviewStatus: 'unchecked',
      placeMatchVerified: false,
      accessibilityVerified: false,
    },
    {
      id: 'library-1',
      sourceId: 'daejeon-libraries',
      category: 'library',
      categoryLabel: '도서관',
      name: '샘플도서관',
      district: '유성구',
      lotAddress: '대전광역시 유성구 예시동 10',
      lat: 36.3621,
      lng: 127.3567,
      basisDate: '2021-10-27',
      candidateStatus: 'candidate_only',
      roadviewStatus: 'unchecked',
      placeMatchVerified: false,
      accessibilityVerified: false,
    },
    {
      id: 'invalid-1',
      sourceId: 'daejeon-parks',
      category: 'park',
      categoryLabel: '공원',
      name: '좌표누락',
      district: '동구',
      roadAddress: '대전광역시 동구 예시로 2',
      lat: null,
      lng: null,
      candidateStatus: 'candidate_only',
      roadviewStatus: 'unchecked',
      placeMatchVerified: false,
      accessibilityVerified: false,
    },
    {
      id: 'outside-1',
      sourceId: 'daejeon-parks',
      category: 'park',
      categoryLabel: '공원',
      name: '범위밖좌표',
      district: '중구',
      roadAddress: '서울특별시 마포구 예시로 3',
      lat: 37.5494,
      lng: 126.9431,
      candidateStatus: 'candidate_only',
      roadviewStatus: 'unchecked',
      placeMatchVerified: false,
      accessibilityVerified: false,
    },
  ],
};

test('normalizes official place rows without upgrading them to verified evidence', () => {
  const rows = normalizeDaejeonPlaceCandidates(fixture);

  assert.equal(rows.length, 4);
  assert.equal(rows[0].coordinateValid, true);
  assert.equal(rows[0].candidateStatus, 'candidate_only');
  assert.equal(rows[0].roadviewStatus, 'unchecked');
  assert.equal(rows[0].placeMatchVerified, false);
  assert.equal(rows[0].accessibilityVerified, false);
  assert.equal(rows[2].coordinateValid, false);
  assert.equal(rows[2].coordinateStatus, 'missing');
  assert.equal(rows[3].coordinateValid, false);
  assert.equal(rows[3].coordinateStatus, 'out_of_bounds');
});

test('filters candidates by category, district, and student-friendly text search', () => {
  const rows = normalizeDaejeonPlaceCandidates(fixture);

  assert.deepEqual(
    filterDaejeonPlaceCandidates(rows, { category: 'park' }).map((row) => row.id),
    ['park-1', 'invalid-1', 'outside-1'],
  );
  assert.deepEqual(
    filterDaejeonPlaceCandidates(rows, { district: '유성구', query: '예시동' }).map((row) => row.id),
    ['library-1'],
  );
});

test('filters one administrative dong while preserving exact and ambiguous relation status', () => {
  const rows = [
    {
      id: 'exact',
      administrativeDongCodes: ['3017063000'],
      administrativeDongMatches: [{ code: '3017063000', name: '둔산1동' }],
      regionMatchStatus: 'matched',
    },
    {
      id: 'ambiguous',
      administrativeDongCodes: ['3017063000', '3017064000', '3017066000'],
      administrativeDongMatches: [
        { code: '3017063000', name: '둔산1동' },
        { code: '3017064000', name: '둔산2동' },
        { code: '3017066000', name: '둔산3동' },
      ],
      regionMatchStatus: 'ambiguous',
    },
    {
      id: 'other',
      administrativeDongCodes: ['3017051000'],
      administrativeDongMatches: [{ code: '3017051000', name: '복수동' }],
      regionMatchStatus: 'matched',
    },
  ];

  assert.deepEqual(
    filterDaejeonPlaceCandidates(rows, { administrativeDongCode: '3017063000' })
      .map((row) => row.id),
    ['exact', 'ambiguous'],
  );
  assert.deepEqual(
    filterDaejeonPlaceCandidates(rows, {
      administrativeDongCode: '3017063000',
      regionMatchStatus: 'matched',
    }).map((row) => row.id),
    ['exact'],
  );
  assert.deepEqual(
    filterDaejeonPlaceCandidates(rows, { query: '둔산2동' }).map((row) => row.id),
    ['ambiguous'],
  );
});

test('summarizes coordinate coverage separately from roadview and accessibility checks', () => {
  const summary = summarizeDaejeonPlaceCandidates(normalizeDaejeonPlaceCandidates(fixture));

  assert.equal(summary.sourceRowCount, 4);
  assert.equal(summary.coordinateValidCount, 2);
  assert.equal(summary.coordinateMissingCount, 1);
  assert.equal(summary.coordinateOutOfBoundsCount, 1);
  assert.equal(summary.coordinateExcludedCount, 2);
  assert.equal(summary.roadviewCheckedCount, 0);
  assert.equal(summary.placeMatchVerifiedCount, 0);
  assert.equal(summary.accessibilityVerifiedCount, 0);
  assert.equal(summary.oldestBasisDate, '2021-10-27');
  assert.equal(summary.newestBasisDate, '2026-07-20');
  assert.deepEqual(summary.categoryCounts, { park: 3, library: 1 });
});

test('builds official Kakao map and Roadview deep links from the selected real coordinate', () => {
  const [candidate] = normalizeDaejeonPlaceCandidates(fixture);
  const links = getCandidateReviewLinks(candidate);

  assert.match(links.kakaoMap, /^https:\/\/map\.kakao\.com\/link\/map\//);
  assert.match(links.kakaoMap, /36\.35040,127\.38450$/);
  assert.equal(links.kakaoRoadview, 'https://map.kakao.com/link/roadview/36.35040,127.38450');
});

test('projects longitude eastward and latitude northward against one fixed offline map extent', () => {
  const rows = normalizeDaejeonPlaceCandidates({
    candidates: [
      { id: 'south-west', name: '남서', lat: 36.25, lng: 127.32 },
      { id: 'north-east', name: '북동', lat: 36.43, lng: 127.47 },
    ],
  });
  const projected = projectDaejeonCoordinates(rows);

  assert.equal(projected.length, 2);
  assert.ok(projected[1].plotX > projected[0].plotX);
  assert.ok(projected[1].plotY < projected[0].plotY);
  assert.deepEqual(projected[0].plotBounds, DAEJEON_PLACE_PLOT_BOUNDS);
  assert.deepEqual(projected[1].plotBounds, DAEJEON_PLACE_PLOT_BOUNDS);
});

test('keeps offline plot positions stable when filters reduce the visible candidates', () => {
  const rows = normalizeDaejeonPlaceCandidates(fixture);
  const allProjected = projectDaejeonCoordinates(rows);
  const filteredProjected = projectDaejeonCoordinates(
    filterDaejeonPlaceCandidates(rows, { category: 'park' }),
  );

  const allPark = allProjected.find((row) => row.id === 'park-1');
  const filteredPark = filteredProjected.find((row) => row.id === 'park-1');
  assert.equal(filteredPark.plotX, allPark.plotX);
  assert.equal(filteredPark.plotY, allPark.plotY);
});

test('merges the resumable Roadview audit without turning a pano into place verification', () => {
  const rows = normalizeDaejeonPlaceCandidates(fixture, {
    entries: [{
      candidateId: 'park-1',
      status: 'needs_human_review',
      panoramaAvailable: true,
      panoId: 'pano-1',
      placeMatch: { verified: false },
    }],
  });
  const selected = rows.find((row) => row.id === 'park-1');
  assert.equal(selected.roadviewStatus, 'needs_human_review');
  assert.equal(selected.roadviewAudit.panoId, 'pano-1');
  assert.equal(selected.placeMatchVerified, false);
  assert.deepEqual(
    filterDaejeonPlaceCandidates(rows, { roadviewStatus: 'needs_human_review' }).map((row) => row.id),
    ['park-1'],
  );
  const summary = summarizeDaejeonPlaceCandidates(rows);
  assert.equal(summary.roadviewEligibleCount, 2);
  assert.equal(summary.roadviewCompletedCount, 1);
  assert.equal(summary.roadviewRemainingCount, 1);
  assert.equal(summary.roadviewHumanReviewCount, 1);
});
