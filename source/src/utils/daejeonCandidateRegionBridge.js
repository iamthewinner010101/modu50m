import { getRenderableRoadviewImage } from './daejeonRoadviewAudit.js';

export const DAEJEON_CANDIDATE_REGION_MATCH_STATUSES = Object.freeze([
  'matched',
  'ambiguous',
  'unmatched',
]);

const DAEJEON_COORDINATE_BOUNDS = Object.freeze({
  minLat: 35.9,
  maxLat: 36.7,
  minLng: 127.0,
  maxLng: 127.8,
});

function firstText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function firstIdentifier(...values) {
  return values.find((value) => (
    typeof value === 'string' || typeof value === 'number'
  )) ?? null;
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function resolveCandidates(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.candidates)) return input.candidates;
  if (Array.isArray(input?.places)) return input.places;
  if (Array.isArray(input?.records)) return input.records;
  return [];
}

function resolveLegalDongs(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.legalDongs)) return input.legalDongs;
  if (Array.isArray(input?.dongs)) return input.dongs;
  if (Array.isArray(input?.records)) return input.records;
  return [];
}

function resolveAdministrativeDongs(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.dongs)) return input.dongs;
  if (Array.isArray(input?.administrativeDongs)) return input.administrativeDongs;
  if (Array.isArray(input?.records)) return input.records;
  return [];
}

function resolveAuditEntries(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.entries)) return input.entries;
  if (Array.isArray(input?.records)) return input.records;
  return [];
}

function uniqueByCode(records) {
  const seen = new Set();
  return records.filter((record) => {
    const code = String(record?.code ?? record?.id ?? '').trim();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasLegalDongToken(text, legalDongName) {
  if (!text || !legalDongName) return false;
  // Official addresses use whitespace or parentheses around a legal-dong token.
  // Requiring a token boundary avoids treating road names such as "도안대로"
  // as the legal dong "도안동".
  return new RegExp(`(?:^|[\\s(,])${escapeRegExp(legalDongName)}(?=[\\s),]|$)`).test(text);
}

export function getDaejeonCandidateAddressText(candidate) {
  const sourceRecord = candidate?.sourceRecord && typeof candidate.sourceRecord === 'object'
    ? candidate.sourceRecord
    : {};
  return [...new Set([
    candidate?.address,
    candidate?.roadAddress,
    candidate?.roadNameAddress,
    candidate?.lotAddress,
    candidate?.landLotAddress,
    candidate?.rdnmadr,
    candidate?.lnmadr,
    sourceRecord.RDNMADR,
    sourceRecord.LNMADR,
  ].filter((value) => typeof value === 'string' && value.trim()))]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCoordinateEligible(candidate) {
  if (typeof candidate?.coordinateValid === 'boolean') return candidate.coordinateValid;
  const lat = toFiniteNumber(candidate?.lat ?? candidate?.latitude);
  const lng = toFiniteNumber(candidate?.lng ?? candidate?.longitude);
  return lat !== null
    && lng !== null
    && lat >= DAEJEON_COORDINATE_BOUNDS.minLat
    && lat <= DAEJEON_COORDINATE_BOUNDS.maxLat
    && lng >= DAEJEON_COORDINATE_BOUNDS.minLng
    && lng <= DAEJEON_COORDINATE_BOUNDS.maxLng;
}

function normalizeAdministrativeLink(link, administrativeByCode) {
  const code = firstIdentifier(link?.code, link?.id, link?.administrativeDongCode);
  if (code === null || code === '') return null;
  const codeKey = String(code);
  const authoritative = administrativeByCode.get(codeKey);
  return {
    code: codeKey,
    name: firstText(link?.name, link?.administrativeDongName, authoritative?.name),
    district: firstText(link?.district, authoritative?.district),
    reconciliationStatus: firstText(
      link?.reconciliationStatus,
      authoritative?.reconciliationStatus,
      'source_confirmed',
    ),
  };
}

function normalizeLegalMatch(legalDong, administrativeByCode) {
  const code = firstIdentifier(legalDong?.code, legalDong?.id);
  if (code === null || code === '') return null;
  const administrativeDongs = uniqueByCode(
    (Array.isArray(legalDong?.administrativeDongs) ? legalDong.administrativeDongs : [])
      .map((link) => normalizeAdministrativeLink(link, administrativeByCode))
      .filter(Boolean),
  );
  return {
    code: String(code),
    name: firstText(legalDong?.name, legalDong?.legalDongName),
    district: firstText(legalDong?.district),
    administrativeDongs,
  };
}

export function findDaejeonCandidateLegalDongs(candidate, legalDongs) {
  const district = firstText(candidate?.district, candidate?.gu, candidate?.districtName);
  const text = getDaejeonCandidateAddressText(candidate);
  return resolveLegalDongs(legalDongs)
    .filter((legalDong) => (
      !district || firstText(legalDong?.district) === district
    ))
    .filter((legalDong) => hasLegalDongToken(text, firstText(legalDong?.name, legalDong?.legalDongName)))
    .map((legalDong) => legalDong);
}

function getCandidateId(candidate, index) {
  const id = firstIdentifier(candidate?.id, candidate?.candidateId);
  return id === null || id === '' ? `unkeyed-candidate-${index + 1}` : String(id);
}

function getRoadviewEvidence(candidate, auditByCandidateId) {
  const candidateId = String(candidate?.id ?? candidate?.candidateId ?? '');
  const audit = auditByCandidateId.get(candidateId) ?? null;
  const placeMatchVerified = candidate?.placeMatchVerified === true
    || audit?.placeMatch?.verified === true;
  const accessibilityVerified = candidate?.accessibilityVerified === true
    || audit?.accessibility?.verified === true;
  return {
    status: firstText(audit?.status, candidate?.roadviewStatus, 'unchecked'),
    inlineCaptureStored: Boolean(getRenderableRoadviewImage(audit)),
    placeMatchVerified,
    accessibilityVerified,
    studentReviewed: candidate?.studentReviewed === true
      || audit?.humanReview?.taeyunDirectReview === 'verified',
    independentReviewed: candidate?.independentReviewed === true
      || audit?.humanReview?.independentReview === 'verified',
    fieldConfirmed: candidate?.fieldConfirmed === true
      || audit?.humanReview?.fieldConfirmation === 'verified',
  };
}

function createAdministrativeCoverage(administrativeDongs) {
  return new Map(resolveAdministrativeDongs(administrativeDongs).map((dong) => {
    const code = firstIdentifier(dong?.code, dong?.id, dong?.administrativeDongCode);
    return [code === null || code === '' ? '' : String(code), dong];
  }).filter(([code]) => code));
}

function incrementCoverage(coverage, code, key) {
  const row = coverage.get(code);
  if (!row) return;
  row[key] += 1;
}

function buildAdministrativeCoverage(administrativeDongs, candidateRegions) {
  const coverage = new Map(
    resolveAdministrativeDongs(administrativeDongs).map((dong) => {
      const code = firstIdentifier(dong?.code, dong?.id, dong?.administrativeDongCode);
      const codeKey = code === null || code === '' ? '' : String(code);
      return [codeKey, {
        code: codeKey,
        name: firstText(dong?.name, dong?.dongName, dong?.administrativeDongName),
        district: firstText(dong?.district, dong?.gu, dong?.districtName),
        candidateCount: 0,
        exactCandidateCount: 0,
        ambiguousCandidateCount: 0,
        coordinateEligibleCandidateCount: 0,
        inlineRoadviewCandidateCount: 0,
        roadviewCompletedCandidateCount: 0,
        roadviewVerifiedCandidateCount: 0,
        placeMatchVerifiedCandidateCount: 0,
        accessibilityVerifiedCandidateCount: 0,
        studentReviewedCandidateCount: 0,
        independentReviewedCandidateCount: 0,
        fieldConfirmedCandidateCount: 0,
      }];
    }).filter(([code]) => code),
  );

  for (const candidateRegion of candidateRegions) {
    for (const administrativeDong of candidateRegion.administrativeDongs) {
      const code = String(administrativeDong.code);
      incrementCoverage(coverage, code, 'candidateCount');
      if (candidateRegion.status === 'matched') {
        incrementCoverage(coverage, code, 'exactCandidateCount');
      }
      if (candidateRegion.status === 'ambiguous') {
        incrementCoverage(coverage, code, 'ambiguousCandidateCount');
      }
      if (candidateRegion.coordinateEligible) {
        incrementCoverage(coverage, code, 'coordinateEligibleCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.inlineCaptureStored) {
        incrementCoverage(coverage, code, 'inlineRoadviewCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.status !== 'unchecked') {
        incrementCoverage(coverage, code, 'roadviewCompletedCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.status === 'verified') {
        incrementCoverage(coverage, code, 'roadviewVerifiedCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.placeMatchVerified) {
        incrementCoverage(coverage, code, 'placeMatchVerifiedCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.accessibilityVerified) {
        incrementCoverage(coverage, code, 'accessibilityVerifiedCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.studentReviewed) {
        incrementCoverage(coverage, code, 'studentReviewedCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.independentReviewed) {
        incrementCoverage(coverage, code, 'independentReviewedCandidateCount');
      }
      if (candidateRegion.roadviewEvidence.fieldConfirmed) {
        incrementCoverage(coverage, code, 'fieldConfirmedCandidateCount');
      }
    }
  }
  return [...coverage.values()];
}

export function buildDaejeonCandidateRegionBridge(
  candidatesInput,
  legalDongsInput,
  administrativeDongsInput,
  { roadviewAuditInput = null } = {},
) {
  const candidates = resolveCandidates(candidatesInput);
  const legalDongs = resolveLegalDongs(legalDongsInput);
  const administrativeDongs = resolveAdministrativeDongs(administrativeDongsInput);
  const administrativeByCode = createAdministrativeCoverage(administrativeDongs);
  const auditByCandidateId = new Map(
    resolveAuditEntries(roadviewAuditInput)
      .map((entry) => [firstText(entry?.candidateId, entry?.id), entry])
      .filter(([candidateId]) => candidateId),
  );

  const candidateRegions = candidates.map((candidate, index) => {
    const candidateId = getCandidateId(candidate, index);
    const legalMatches = uniqueByCode(
      findDaejeonCandidateLegalDongs(candidate, legalDongs)
        .map((legalDong) => normalizeLegalMatch(legalDong, administrativeByCode))
        .filter(Boolean),
    );
    const administrativeMatches = uniqueByCode(
      legalMatches.flatMap((legalDong) => legalDong.administrativeDongs),
    );
    const status = legalMatches.length > 1 || administrativeMatches.length > 1
      ? 'ambiguous'
      : legalMatches.length === 1 && administrativeMatches.length === 1
        ? 'matched'
        : 'unmatched';
    return {
      candidateId,
      sourceId: firstText(candidate?.sourceId, candidate?.datasetId),
      sourceRecordId: firstText(candidate?.sourceRecordId, candidate?.recordId),
      candidateName: firstText(candidate?.name, candidate?.placeName, candidate?.facilityName),
      district: firstText(candidate?.district, candidate?.gu, candidate?.districtName),
      status,
      coordinateEligible: isCoordinateEligible(candidate),
      legalDongs: legalMatches,
      legalDongCodes: legalMatches.map((legalDong) => legalDong.code),
      administrativeDongs: administrativeMatches,
      administrativeDongCodes: administrativeMatches.map((dong) => dong.code),
      roadviewEvidence: getRoadviewEvidence({ ...candidate, id: candidateId }, auditByCandidateId),
    };
  });

  const administrativeCoverage = buildAdministrativeCoverage(
    administrativeDongs,
    candidateRegions,
  );
  const legalDongCodes = new Set(candidateRegions.flatMap((candidate) => candidate.legalDongCodes));
  const administrativeDongCodes = new Set(
    candidateRegions.flatMap((candidate) => candidate.administrativeDongCodes),
  );
  const matchedCandidateRegions = candidateRegions.filter((candidate) => candidate.status !== 'unmatched');
  const inlineRoadviewCandidateCount = candidateRegions.filter(
    (candidate) => candidate.roadviewEvidence.inlineCaptureStored,
  ).length;
  const roadviewCompletedCandidateCount = candidateRegions.filter(
    (candidate) => candidate.roadviewEvidence.status !== 'unchecked',
  ).length;
  const roadviewVerifiedCandidateCount = candidateRegions.filter(
    (candidate) => candidate.roadviewEvidence.status === 'verified',
  ).length;
  const placeMatchVerifiedCandidateCount = candidateRegions.filter(
    (candidate) => candidate.roadviewEvidence.placeMatchVerified,
  ).length;
  const accessibilityVerifiedCandidateCount = candidateRegions.filter(
    (candidate) => candidate.roadviewEvidence.accessibilityVerified,
  ).length;
  const expectedAdministrativeDongCount = administrativeCoverage.length;
  const coveredAdministrativeDongCount = administrativeCoverage.filter(
    (dong) => dong.candidateCount > 0,
  ).length;

  return {
    schema: 'modu50m.daejeon_candidate_region_bridge.v1',
    municipality: '대전광역시',
    matching: {
      method: 'official_address_legal_dong_token_then_mois_relation',
      addressFields: [
        'address',
        'roadAddress',
        'lotAddress',
        'sourceRecord.RDNMADR',
        'sourceRecord.LNMADR',
      ],
      legalDongSource: 'src/data/daejeonLegalDongs.generated.json',
      administrativeDongSource: 'src/data/daejeonAdministrativeDongs.generated.json',
      ambiguityPolicy: 'preserve_all_legal_and_administrative_links',
      unmatchedPolicy: 'retain_candidate_without_inventing_region',
    },
    summary: {
      candidateRowCount: candidates.length,
      coordinateEligibleCandidateCount: candidateRegions.filter((candidate) => candidate.coordinateEligible).length,
      candidateRegionMatchedCount: candidateRegions.filter((candidate) => candidate.status === 'matched').length,
      candidateRegionRelatedCount: matchedCandidateRegions.length,
      candidateRegionUnmatchedCount: candidateRegions.length - matchedCandidateRegions.length,
      candidateRegionAmbiguousCount: candidateRegions.filter((candidate) => candidate.status === 'ambiguous').length,
      legalDongMatchedCount: legalDongCodes.size,
      expectedLegalDongCount: legalDongs.length,
      administrativeDongMatchedCount: coveredAdministrativeDongCount,
      administrativeDongRelationCoverageCount: coveredAdministrativeDongCount,
      administrativeDongExactCandidateCoverageCount: administrativeCoverage.filter(
        (dong) => dong.exactCandidateCount > 0,
      ).length,
      expectedAdministrativeDongCount,
      administrativeDongCoveragePercent: expectedAdministrativeDongCount > 0
        ? Math.round((coveredAdministrativeDongCount / expectedAdministrativeDongCount) * 100)
        : 0,
      allAdministrativeDongsCovered: coveredAdministrativeDongCount === expectedAdministrativeDongCount,
      administrativeDongCodes: [...administrativeDongCodes],
      inlineRoadviewCandidateCount,
      inlineRoadviewAdministrativeDongCount: administrativeCoverage.filter(
        (dong) => dong.inlineRoadviewCandidateCount > 0,
      ).length,
      roadviewCompletedCandidateCount,
      roadviewCompletedAdministrativeDongCount: administrativeCoverage.filter(
        (dong) => dong.roadviewCompletedCandidateCount > 0,
      ).length,
      roadviewVerifiedCandidateCount,
      placeMatchVerifiedCandidateCount,
      accessibilityVerifiedCandidateCount,
      placeMatchVerifiedAdministrativeDongCount: administrativeCoverage.filter(
        (dong) => dong.placeMatchVerifiedCandidateCount > 0,
      ).length,
      accessibilityVerifiedAdministrativeDongCount: administrativeCoverage.filter(
        (dong) => dong.accessibilityVerifiedCandidateCount > 0,
      ).length,
    },
    administrativeCoverage,
    candidateRegions,
  };
}

export function createDaejeonCandidateRegionBridgeIndex(input) {
  const entries = Array.isArray(input)
    ? input
    : Array.isArray(input?.candidateRegions)
      ? input.candidateRegions
      : Array.isArray(input?.entries)
        ? input.entries
        : [];
  return new Map(
    entries
      .map((entry) => [firstText(entry?.candidateId, entry?.id), entry])
      .filter(([candidateId]) => candidateId),
  );
}

export function applyDaejeonCandidateRegionBridge(candidatesInput, bridgeInput) {
  const index = createDaejeonCandidateRegionBridgeIndex(bridgeInput);
  return resolveCandidates(candidatesInput).map((candidate) => {
    const candidateId = firstText(candidate?.id, candidate?.candidateId);
    const region = index.get(candidateId);
    return {
      ...candidate,
      regionMatchStatus: region?.status ?? 'unmatched',
      legalDongMatches: region?.legalDongs ?? [],
      legalDongCodes: region?.legalDongCodes ?? [],
      administrativeDongMatches: region?.administrativeDongs ?? [],
      administrativeDongCodes: region?.administrativeDongCodes ?? [],
      coordinateEligible: region?.coordinateEligible ?? isCoordinateEligible(candidate),
      regionBridge: region ?? null,
    };
  });
}

export function summarizeDaejeonCandidateRegionCoverage(candidatesInput, bridgeInput = null) {
  const candidates = resolveCandidates(candidatesInput);
  const expectedAdministrativeDongCount = Number.isFinite(
    Number(bridgeInput?.summary?.expectedAdministrativeDongCount),
  )
    ? Number(bridgeInput.summary.expectedAdministrativeDongCount)
    : null;
  const expectedLegalDongCount = Number.isFinite(Number(bridgeInput?.summary?.expectedLegalDongCount))
    ? Number(bridgeInput.summary.expectedLegalDongCount)
    : null;
  const hasRegionBridge = Boolean(bridgeInput)
    || candidates.some((candidate) => candidate.regionBridge !== undefined);
  const relatedCandidates = hasRegionBridge
    ? candidates.filter((candidate) => candidate.regionMatchStatus !== 'unmatched')
    : [];
  const exactCandidates = hasRegionBridge
    ? candidates.filter((candidate) => candidate.regionMatchStatus === 'matched')
    : [];
  const administrativeDongCodes = new Set(
    candidates.flatMap((candidate) => candidate.administrativeDongCodes ?? []),
  );
  const exactAdministrativeDongCodes = new Set(
    exactCandidates.flatMap((candidate) => candidate.administrativeDongCodes ?? []),
  );
  const legalDongCodes = new Set(candidates.flatMap((candidate) => candidate.legalDongCodes ?? []));
  const inlineRoadviewAdministrativeDongCodes = new Set(
    candidates
      .filter((candidate) => candidate.regionBridge?.roadviewEvidence?.inlineCaptureStored)
      .flatMap((candidate) => candidate.administrativeDongCodes ?? []),
  );
  const placeMatchAdministrativeDongCodes = new Set(
    candidates
      .filter((candidate) => candidate.placeMatchVerified)
      .flatMap((candidate) => candidate.administrativeDongCodes ?? []),
  );
  const accessibilityAdministrativeDongCodes = new Set(
    candidates
      .filter((candidate) => candidate.accessibilityVerified)
      .flatMap((candidate) => candidate.administrativeDongCodes ?? []),
  );
  return {
    candidateRowCount: candidates.length,
    candidateRegionMatchedCount: exactCandidates.length,
    candidateRegionRelatedCount: relatedCandidates.length,
    candidateRegionUnmatchedCount: candidates.length - relatedCandidates.length,
    candidateRegionAmbiguousCount: candidates.filter((candidate) => candidate.regionMatchStatus === 'ambiguous').length,
    matchedLegalDongCount: legalDongCodes.size,
    expectedLegalDongCount,
    matchedAdministrativeDongCount: administrativeDongCodes.size,
    relatedAdministrativeDongCount: administrativeDongCodes.size,
    exactAdministrativeDongCount: exactAdministrativeDongCodes.size,
    expectedAdministrativeDongCount,
    administrativeDongCoveragePercent: expectedAdministrativeDongCount
      ? Math.round((administrativeDongCodes.size / expectedAdministrativeDongCount) * 100)
      : null,
    inlineRoadviewCandidateCount: candidates.filter(
      (candidate) => candidate.regionBridge?.roadviewEvidence?.inlineCaptureStored,
    ).length,
    inlineRoadviewAdministrativeDongCount: inlineRoadviewAdministrativeDongCodes.size,
    placeMatchVerifiedAdministrativeDongCount: placeMatchAdministrativeDongCodes.size,
    accessibilityVerifiedAdministrativeDongCount: accessibilityAdministrativeDongCodes.size,
  };
}
