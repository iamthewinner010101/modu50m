import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASTRA_DAEJEON_ACQUISITION_PRIORITIES,
  getAstraDaejeonAcquisitionPriority,
} from '../data/astraDaejeonAcquisitionPriorities.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const metadata = JSON.parse(fs.readFileSync(
  path.join(projectRoot, 'src/data/astraRoadviewImageSelections.metadata.json'),
  'utf8',
));

test('records Astra visual review without upgrading online AI or human evidence', () => {
  assert.equal(metadata.reviewer.model, 'gpt-6-astra');
  assert.equal(metadata.reviewer.onlineInferenceRun, false);

  const selection = metadata.selections['L50-002'];
  assert.equal(selection.status, 'selected_pending_human_place_match');
  assert.equal(selection.onlineAiEligible, false);
  assert.equal(selection.humanVerificationStatus, 'pending');
  assert.equal(selection.accessibilityVerified, false);
  assert.equal(selection.studentEvidence, false);
});

test('selects P4-R as the last-50m primary and P1-C as complementary place evidence', () => {
  const selection = metadata.selections['L50-002'];
  assert.equal(selection.primary.key, 'P4-R');
  assert.equal(selection.primary.panoId, '1200993450');
  assert.equal(selection.primary.sha256, '9769cf157d4a816287b61551f177cbe8b24dd3a4f638cd59bef5967540030fd9');
  assert.equal(selection.secondary.key, 'P1-C');
  assert.equal(selection.secondary.panoId, '1200993172');
  assert.equal(selection.secondary.sha256, '61eaf2a3385389970e77bc060c01cab12854785991dea417eff188075130d19e');
  assert.equal(selection.primary.guide.length, 3);
  selection.primary.guide.forEach((region) => {
    assert.ok(region.centerX > 0 && region.centerX < 1);
    assert.ok(region.centerY > 0 && region.centerY < 1);
    assert.ok(region.radius > 0 && region.radius < 0.25);
  });
});

test('keeps the Donggwang Park capture as insufficient input, not a representative image', () => {
  const selection = metadata.selections['15012890:01711'];
  assert.equal(selection.status, 'input_insufficient_place_match_only');
  assert.equal(selection.humanVerificationStatus, 'pending');
  assert.equal(selection.accessibilityVerified, false);
  assert.equal(selection.studentEvidence, false);
  assert.match(selection.nextImageNeeded, /진입구/);
});

test('keeps a unique 15-place acquisition queue with entrance-described sites first', () => {
  assert.equal(ASTRA_DAEJEON_ACQUISITION_PRIORITIES.length, 15);
  assert.equal(new Set(ASTRA_DAEJEON_ACQUISITION_PRIORITIES.map(({ id }) => id)).size, 15);
  assert.deepEqual(
    ASTRA_DAEJEON_ACQUISITION_PRIORITIES.map(({ rank }) => rank),
    Array.from({ length: 15 }, (_, index) => index + 1),
  );
  assert.equal(getAstraDaejeonAcquisitionPriority('15034533:00777')?.rank, 2);
  assert.equal(getAstraDaejeonAcquisitionPriority('15034533:00678')?.rank, 3);
});
