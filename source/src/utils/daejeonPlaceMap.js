const DAEJEON_DISTRICTS = Object.freeze(['동구', '중구', '서구', '유성구', '대덕구']);
const DAEJEON_PLACE_PLOT_BOUNDS = Object.freeze({
  minLat: 36.18,
  maxLat: 36.50,
  minLng: 127.26,
  maxLng: 127.53,
});

import {
  createRoadviewAuditIndex,
  isRoadviewAuditStatus,
  resolveRoadviewAuditStatus,
  ROADVIEW_AUDIT_STATUS_META,
  ROADVIEW_AUDIT_STATUSES,
  summarizeRoadviewAudit,
} from './daejeonRoadviewAudit.js';
import {
  applyDaejeonCandidateRegionBridge,
  summarizeDaejeonCandidateRegionCoverage,
} from './daejeonCandidateRegionBridge.js';

function firstText(...values) {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value?.trim() ?? '';
}

function toCoordinate(value) {
  if (value === null || value === undefined || value === '') return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function inferDistrict(explicitDistrict, address) {
  const supplied = firstText(explicitDistrict).replace(/^대전광역시\s*/, '');
  if (DAEJEON_DISTRICTS.includes(supplied)) return supplied;
  return DAEJEON_DISTRICTS.find((district) => (
    new RegExp(`(?:대전광역시\\s*)?${district}(?:\\s|$)`).test(address)
  )) ?? '';
}

function resolveRows(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.candidates)) return input.candidates;
  if (Array.isArray(input?.places)) return input.places;
  if (Array.isArray(input?.records)) return input.records;
  return [];
}

export function normalizeDaejeonPlaceCandidates(input, auditInput = null, regionBridgeInput = null) {
  const auditIndex = createRoadviewAuditIndex(auditInput);
  const normalizedCandidates = resolveRows(input).map((candidate, index) => {
    const roadAddress = firstText(candidate.roadAddress, candidate.roadNameAddress, candidate.rdnmadr);
    const lotAddress = firstText(candidate.lotAddress, candidate.landLotAddress, candidate.lnmadr);
    const address = firstText(candidate.address, roadAddress, lotAddress);
    const lat = toCoordinate(candidate.lat ?? candidate.latitude);
    const lng = toCoordinate(candidate.lng ?? candidate.longitude);
    const coordinateValid = lat !== null
      && lng !== null
      && lat >= 35.9
      && lat <= 36.7
      && lng >= 127.0
      && lng <= 127.8;
    const coordinateStatus = lat === null || lng === null
      ? 'missing'
      : coordinateValid
        ? 'within_daejeon_bounds'
        : 'out_of_bounds';
    const sourceId = firstText(candidate.sourceId, candidate.datasetId, 'unknown-source');
    const sourceRecordId = firstText(
      candidate.sourceRecordId,
      candidate.recordId,
      candidate.manageNo,
      candidate.id,
      String(index + 1),
    );
    const id = firstText(candidate.id, `${sourceId}:${sourceRecordId}`);
    const roadviewAudit = auditIndex.get(id) ?? null;
    const roadviewStatus = resolveRoadviewAuditStatus(candidate, roadviewAudit);

    return {
      ...candidate,
      id,
      sourceId,
      sourceRecordId,
      category: firstText(candidate.category, 'other'),
      categoryLabel: firstText(candidate.categoryLabel, candidate.categoryName, '기타'),
      name: firstText(candidate.name, candidate.placeName, candidate.facilityName, '이름 확인 필요'),
      roadAddress,
      lotAddress,
      address,
      district: inferDistrict(candidate.district, address),
      lat,
      lng,
      coordinateValid,
      coordinateStatus,
      candidateStatus: candidate.candidateStatus === 'candidate_only'
        ? 'candidate_only'
        : 'candidate_only',
      roadviewStatus,
      roadviewStatusMeta: ROADVIEW_AUDIT_STATUS_META[roadviewStatus],
      roadviewAudit,
      roadviewEligible: roadviewAudit?.eligibleForRoadviewAudit !== false,
      placeMatchVerified: candidate.placeMatchVerified === true
        || roadviewAudit?.placeMatch?.verified === true,
      accessibilityVerified: candidate.accessibilityVerified === true
        || roadviewAudit?.accessibility?.verified === true,
      studentReviewed: candidate.studentReviewed === true,
      independentReviewed: candidate.independentReviewed === true,
      fieldConfirmed: candidate.fieldConfirmed === true,
    };
  });
  return applyDaejeonCandidateRegionBridge(normalizedCandidates, regionBridgeInput);
}

export function filterDaejeonPlaceCandidates(
  candidates,
  {
    category = 'all',
    district = 'all',
    query = '',
    coordinateOnly = false,
    roadviewStatus = 'all',
    administrativeDongCode = 'all',
    regionMatchStatus = 'all',
  } = {},
) {
  const normalizedQuery = String(query).trim().toLowerCase();
  return candidates.filter((candidate) => {
    if (category !== 'all' && candidate.category !== category) return false;
    if (district !== 'all' && candidate.district !== district) return false;
    if (coordinateOnly && !candidate.coordinateValid) return false;
    if (roadviewStatus !== 'all'
      && (candidate.roadviewEligible === false || candidate.roadviewStatus !== roadviewStatus)) return false;
    if (administrativeDongCode !== 'all'
      && !(candidate.administrativeDongCodes ?? []).includes(administrativeDongCode)) return false;
    if (regionMatchStatus !== 'all' && candidate.regionMatchStatus !== regionMatchStatus) return false;
    if (!normalizedQuery) return true;
    return [
      candidate.name,
      candidate.categoryLabel,
      candidate.district,
      candidate.address,
      candidate.sourceRecordId,
      ...(candidate.administrativeDongMatches ?? []).map((dong) => dong.name),
    ].some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
  });
}

export function summarizeDaejeonPlaceCandidates(candidates, regionBridgeInput = null) {
  const categoryCounts = {};
  const districtCounts = {};
  let coordinateValidCount = 0;
  let coordinateMissingCount = 0;
  let coordinateOutOfBoundsCount = 0;
  let roadviewCheckedCount = 0;
  let placeMatchVerifiedCount = 0;
  let accessibilityVerifiedCount = 0;
  let studentReviewedCount = 0;
  let independentReviewedCount = 0;
  let fieldConfirmedCount = 0;
  const basisDates = candidates
    .map((candidate) => firstText(candidate.basisDate, candidate.referenceDate))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();

  candidates.forEach((candidate) => {
    categoryCounts[candidate.category] = (categoryCounts[candidate.category] ?? 0) + 1;
    const districtKey = candidate.district || '자치구 확인 필요';
    districtCounts[districtKey] = (districtCounts[districtKey] ?? 0) + 1;
    if (candidate.coordinateValid) coordinateValidCount += 1;
    if (candidate.coordinateStatus === 'missing') coordinateMissingCount += 1;
    if (candidate.coordinateStatus === 'out_of_bounds') coordinateOutOfBoundsCount += 1;
    if (candidate.coordinateValid && candidate.roadviewEligible !== false
      && isRoadviewAuditStatus(candidate.roadviewStatus)
      && candidate.roadviewStatus !== 'unchecked') roadviewCheckedCount += 1;
    if (candidate.placeMatchVerified) placeMatchVerifiedCount += 1;
    if (candidate.accessibilityVerified) accessibilityVerifiedCount += 1;
    if (candidate.studentReviewed) studentReviewedCount += 1;
    if (candidate.independentReviewed) independentReviewedCount += 1;
    if (candidate.fieldConfirmed) fieldConfirmedCount += 1;
  });

  const roadviewAudit = summarizeRoadviewAudit(candidates);
  const regionCoverage = summarizeDaejeonCandidateRegionCoverage(candidates, regionBridgeInput);
  return {
    sourceRowCount: candidates.length,
    coordinateValidCount,
    coordinateMissingCount,
    coordinateOutOfBoundsCount,
    coordinateExcludedCount: coordinateMissingCount + coordinateOutOfBoundsCount,
    roadviewCheckedCount,
    placeMatchVerifiedCount,
    accessibilityVerifiedCount,
    studentReviewedCount,
    independentReviewedCount,
    fieldConfirmedCount,
    roadviewEligibleCount: roadviewAudit.eligibleCount,
    roadviewCompletedCount: roadviewAudit.completedCount,
    roadviewRemainingCount: roadviewAudit.remainingCount,
    roadviewVerifiedCount: roadviewAudit.verifiedCount,
    roadviewHumanReviewCount: roadviewAudit.humanReviewCount,
    roadviewStatusCounts: roadviewAudit.statusCounts,
    roadviewStatusOptions: ROADVIEW_AUDIT_STATUSES,
    regionCoverage,
    oldestBasisDate: basisDates[0] ?? '',
    newestBasisDate: basisDates.at(-1) ?? '',
    categoryCounts,
    districtCounts,
  };
}

export function projectDaejeonCoordinates(candidates, bounds = DAEJEON_PLACE_PLOT_BOUNDS) {
  const longitudeSpan = bounds.maxLng - bounds.minLng;
  const latitudeSpan = bounds.maxLat - bounds.minLat;
  if (!(longitudeSpan > 0) || !(latitudeSpan > 0)) return [];

  return candidates
    .filter((candidate) => candidate.coordinateValid)
    .map((candidate) => ({
      ...candidate,
      plotX: ((candidate.lng - bounds.minLng) / longitudeSpan) * 100,
      plotY: ((bounds.maxLat - candidate.lat) / latitudeSpan) * 100,
      plotBounds: bounds,
    }));
}

export { DAEJEON_DISTRICTS, DAEJEON_PLACE_PLOT_BOUNDS };
