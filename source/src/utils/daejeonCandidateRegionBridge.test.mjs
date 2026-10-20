import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildDaejeonCandidateRegionBridge,
  createDaejeonCandidateRegionBridgeIndex,
  findDaejeonCandidateLegalDongs,
} from './daejeonCandidateRegionBridge.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

test('uses official address fields and preserves multi-region legal-dong links', () => {
  const legalDongs = [
    {
      code: '3017010400',
      district: '서구',
      name: '정림동',
      administrativeDongs: [{ code: '3017053500', name: '정림동' }],
    },
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
  ];
  const administrativeDongs = [
    { code: '3017053500', district: '서구', name: '정림동' },
    { code: '3017063000', district: '서구', name: '둔산1동' },
    { code: '3017064000', district: '서구', name: '둔산2동' },
    { code: '3017066000', district: '서구', name: '둔산3동' },
  ];
  const bridge = buildDaejeonCandidateRegionBridge(
    {
      candidates: [
        {
          id: 'lot-only',
          district: '서구',
          address: '대전광역시 서구 계백로 1',
          lotAddress: '대전광역시 서구 정림동 10',
          coordinateValid: true,
        },
        {
          id: 'multi',
          district: '서구',
          roadAddress: '대전광역시 서구 둔산동 1',
          lotAddress: '대전광역시 서구 정림동 2',
          coordinateValid: true,
        },
        {
          id: 'one-legal-three-admin',
          district: '서구',
          lotAddress: '대전광역시 서구 둔산동 3',
          coordinateValid: true,
        },
      ],
    },
    { legalDongs },
    { dongs: administrativeDongs },
  );

  assert.equal(bridge.summary.candidateRegionMatchedCount, 1);
  assert.equal(bridge.summary.candidateRegionRelatedCount, 3);
  assert.equal(bridge.summary.candidateRegionAmbiguousCount, 2);
  assert.deepEqual(bridge.candidateRegions[0].legalDongCodes, ['3017010400']);
  assert.deepEqual(bridge.candidateRegions[1].legalDongCodes, ['3017010400', '3017011200']);
  assert.deepEqual(bridge.candidateRegions[1].administrativeDongCodes, [
    '3017053500',
    '3017063000',
    '3017064000',
    '3017066000',
  ]);
  assert.equal(bridge.candidateRegions[2].legalDongs.length, 1);
  assert.equal(bridge.candidateRegions[2].administrativeDongs.length, 3);
  assert.equal(bridge.candidateRegions[2].status, 'ambiguous');
});

test('does not mistake road-name text for a legal-dong address token', () => {
  const legalDongs = [{ code: 'legal-1', district: '유성구', name: '도안동' }];
  const matches = findDaejeonCandidateLegalDongs({
    district: '유성구',
    roadAddress: '대전광역시 유성구 도안대로 35',
  }, legalDongs);

  assert.deepEqual(matches, []);
});

test('current official artifacts connect candidates to every administrative dong without upgrading evidence', () => {
  const candidates = readJson('src/data/daejeonPlaceCandidates.generated.json');
  const legalDongs = readJson('src/data/daejeonLegalDongs.generated.json');
  const administrativeDongs = readJson('src/data/daejeonAdministrativeDongs.generated.json');
  const roadviewAudit = readJson('src/data/daejeonRoadviewAudit.generated.json');
  const generatedBridge = readJson('src/data/daejeonCandidateRegionBridge.generated.json');
  const bridge = buildDaejeonCandidateRegionBridge(
    candidates,
    legalDongs,
    administrativeDongs,
    { roadviewAuditInput: roadviewAudit },
  );

  assert.equal(bridge.summary.candidateRowCount, 828);
  assert.equal(bridge.summary.coordinateEligibleCandidateCount, 827);
  assert.equal(bridge.summary.candidateRegionMatchedCount, 453);
  assert.equal(bridge.summary.candidateRegionRelatedCount, 744);
  assert.equal(bridge.summary.candidateRegionUnmatchedCount, 84);
  assert.equal(bridge.summary.candidateRegionAmbiguousCount, 291);
  assert.equal(bridge.summary.administrativeDongMatchedCount, 82);
  assert.equal(bridge.summary.administrativeDongRelationCoverageCount, 82);
  assert.equal(bridge.summary.administrativeDongExactCandidateCoverageCount, 54);
  assert.equal(bridge.summary.expectedAdministrativeDongCount, 82);
  assert.equal(bridge.summary.allAdministrativeDongsCovered, true);
  assert.equal(bridge.summary.inlineRoadviewCandidateCount, 1);
  assert.equal(bridge.summary.inlineRoadviewAdministrativeDongCount, 1);
  assert.equal(bridge.summary.placeMatchVerifiedCandidateCount, 0);
  assert.equal(bridge.summary.accessibilityVerifiedCandidateCount, 0);
  assert.deepEqual(
    bridge.summary,
    generatedBridge.summary,
  );
  assert.equal(createDaejeonCandidateRegionBridgeIndex(generatedBridge).size, 828);
});
