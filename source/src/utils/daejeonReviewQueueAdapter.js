import { getRenderableRoadviewImage, ROADVIEW_AUDIT_STATUS_META } from './daejeonRoadviewAudit.js';
import { getCandidateReviewLinks } from './mapLinks.js';
import { normalizeDaejeonPlaceCandidates } from './daejeonPlaceMap.js';

export const DAEJEON_REVIEW_QUEUE_SCHEMA = 'modu50m.daejeon_review_queue_adapter.v1';

export const DAEJEON_REVIEW_QUEUE_STATUS = Object.freeze({
  ALL: 'all',
  ONE_FRAME_READY: 'one_frame_ready',
  PLACE_MATCH_ONLY: 'place_match_only',
  ROADVIEW_CAPTURE_REQUIRED: 'roadview_capture_required',
  SOURCE_EXCLUDED: 'source_excluded',
  LOCATION_CONFIRMATION_NEEDED: 'location_confirmation_needed',
  PLACE_MATCH_VERIFIED: 'place_match_verified',
  ACCESSIBILITY_VERIFIED: 'accessibility_verified',
});

export const DAEJEON_REVIEW_QUEUE_STATUS_OPTIONS = Object.freeze([
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.ALL,
    label: '전체 상태',
    description: '모든 공식 후보 행',
  },
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.ONE_FRAME_READY,
    label: '한 장 검수 준비 완료',
    description: '사진과 세 곳의 검수 가이드가 모두 있는 행',
  },
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY,
    label: '장소 일치 질문만 가능',
    description: '기존 사진은 있지만 접근성 가이드가 없어 장소 질문만 열 수 있는 행',
  },
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED,
    label: '로드뷰 자료 준비 필요',
    description: '좌표는 유효하지만 화면 자료가 아직 없는 행',
  },
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED,
    label: '원천 제외',
    description: '대전 좌표 범위 밖으로 로드뷰 확인 대상에서 제외된 행',
  },
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_VERIFIED,
    label: '장소 일치 검증 완료',
    description: '정본 장소·입구 일치 증거가 있는 행',
  },
  {
    value: DAEJEON_REVIEW_QUEUE_STATUS.ACCESSIBILITY_VERIFIED,
    label: '접근성 검증 완료',
    description: '정본 접근성 판정이 있는 행',
  },
]);

const CATEGORY_LABELS = Object.freeze({
  park: '공원',
  wheelchair_charger: '전동휠체어 급속충전기',
  library: '도서관',
  other: '기타',
});

function firstText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getRegionEvidence(candidate) {
  return candidate?.regionBridge?.roadviewEvidence ?? {};
}

function getAdministrativeDongs(candidate) {
  const links = Array.isArray(candidate?.administrativeDongMatches)
    ? candidate.administrativeDongMatches
    : candidate?.regionBridge?.administrativeDongs ?? [];
  const seen = new Set();
  return links
    .map((dong) => ({
      code: firstText(dong?.code, dong?.id),
      name: firstText(dong?.name, dong?.dongName, dong?.administrativeDongName),
      district: firstText(dong?.district, dong?.gu, candidate?.district),
      reconciliationStatus: firstText(dong?.reconciliationStatus, 'source_confirmed'),
    }))
    .filter((dong) => {
      if (!dong.code || seen.has(dong.code)) return false;
      seen.add(dong.code);
      return true;
    });
}

function getCategoryLabel(candidate) {
  return firstText(
    candidate?.categoryLabel,
    CATEGORY_LABELS[candidate?.category],
    candidate?.category,
    '기타',
  );
}

function getAuditStatusMeta(status) {
  return ROADVIEW_AUDIT_STATUS_META[status]
    ?? ROADVIEW_AUDIT_STATUS_META.unchecked;
}

function getGuideState(candidate) {
  const evidence = candidate?.locationVerification?.placeMatchEvidence ?? {};
  const guide = candidate?.accessibilityObservationGuide
    ?? candidate?.reviewGuide
    ?? evidence.accessibilityObservationGuide
    ?? [];
  const guideCount = Array.isArray(guide) ? guide.length : 0;
  return {
    state: guideCount >= 3 ? 'three_regions_ready' : 'guide_required',
    regionCount: guideCount,
    accessibilityQuestionsEnabled: guideCount >= 3,
  };
}

function adaptCandidate(candidate) {
  const audit = candidate?.roadviewAudit ?? null;
  const regionEvidence = getRegionEvidence(candidate);
  const imagePath = getRenderableRoadviewImage(audit);
  const coordinateEligible = candidate?.coordinateValid === true
    && candidate?.roadviewEligible !== false;
  const placeMatchVerified = candidate?.placeMatchVerified === true
    || audit?.placeMatch?.verified === true
    || regionEvidence.placeMatchVerified === true;
  const accessibilityVerified = candidate?.accessibilityVerified === true
    || audit?.accessibility?.verified === true
    || regionEvidence.accessibilityVerified === true;
  const studentReviewed = candidate?.studentReviewed === true
    || audit?.humanReview?.taeyunDirectReview === 'verified'
    || regionEvidence.studentReviewed === true;
  const independentReviewed = candidate?.independentReviewed === true
    || audit?.humanReview?.independentReview === 'verified'
    || regionEvidence.independentReviewed === true;
  const fieldConfirmed = candidate?.fieldConfirmed === true
    || audit?.humanReview?.fieldConfirmation === 'verified'
    || regionEvidence.fieldConfirmed === true;
  const photoAvailable = Boolean(imagePath);
  const guideState = getGuideState(candidate);
  const locationConfirmationNeeded = photoAvailable && (!placeMatchVerified || !accessibilityVerified);
  const reviewReadiness = !coordinateEligible
    ? DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED
    : !photoAvailable
      ? DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED
      : guideState.state === 'three_regions_ready'
        ? DAEJEON_REVIEW_QUEUE_STATUS.ONE_FRAME_READY
        : DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY;
  const nextAction = !coordinateEligible
    ? DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED
    : locationConfirmationNeeded
      ? DAEJEON_REVIEW_QUEUE_STATUS.LOCATION_CONFIRMATION_NEEDED
      : DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED;
  const administrativeDongs = getAdministrativeDongs(candidate);
  const roadviewStatus = candidate?.roadviewStatus ?? audit?.status ?? 'unchecked';
  const roadviewStatusMeta = getAuditStatusMeta(roadviewStatus);
  const links = coordinateEligible ? getCandidateReviewLinks(candidate) : null;
  const capture = audit?.capture ?? {};
  const humanReview = audit?.humanReview ?? {};

  return {
    id: String(candidate?.id ?? ''),
    candidate,
    name: firstText(candidate?.name, candidate?.placeName, '이름 확인 필요'),
    category: firstText(candidate?.category, 'other'),
    categoryLabel: getCategoryLabel(candidate),
    district: firstText(candidate?.district, '구 확인 필요'),
    address: firstText(candidate?.address, candidate?.roadAddress, candidate?.lotAddress),
    sourceId: firstText(candidate?.sourceId, candidate?.datasetId),
    sourceRecordId: firstText(candidate?.sourceRecordId, candidate?.recordId),
    sourceRowIndex: candidate?.sourceRowIndex ?? null,
    basisDate: firstText(candidate?.basisDate, candidate?.referenceDate),
    coordinate: {
      lat: toFiniteNumber(candidate?.lat),
      lng: toFiniteNumber(candidate?.lng),
      valid: coordinateEligible,
      status: candidate?.coordinateStatus ?? (coordinateEligible ? 'within_daejeon_bounds' : 'out_of_bounds'),
      exclusionReason: audit?.exclusionReason ?? null,
    },
    administrativeDongs,
    administrativeDongCodes: administrativeDongs.map((dong) => dong.code),
    regionMatchStatus: firstText(candidate?.regionMatchStatus, candidate?.regionBridge?.status, 'unmatched'),
    photo: {
      available: photoAvailable,
      imagePath,
      imageKind: firstText(capture.imageKind, 'existing_capture'),
      imageSource: firstText(capture.imageSource),
      imageSha256: firstText(capture.imageSha256),
      captureTime: firstText(audit?.captureTime),
      captureTimePrecision: firstText(audit?.captureTimePrecision),
      sourceReceipt: firstText(capture.sourceReceipt),
    },
    roadview: {
      status: roadviewStatus,
      statusLabel: roadviewStatusMeta.label,
      statusDescription: roadviewStatusMeta.description,
      panoId: firstText(audit?.panoId),
      panoramaAvailable: audit?.panoramaAvailable === true,
      captureStored: photoAvailable,
      humanReviewRequired: audit?.humanReview?.required === true,
    },
    location: {
      placeMatchVerified,
      accessibilityVerified,
      placeMatchStatus: firstText(audit?.placeMatch?.status, placeMatchVerified ? 'verified' : 'pending'),
      accessibilityStatus: firstText(audit?.accessibility?.status, accessibilityVerified ? 'verified' : 'pending'),
      confirmationNeeded: locationConfirmationNeeded,
      placeMatchEvidence: firstText(audit?.placeMatch?.evidence),
      accessibilityEvidence: firstText(audit?.accessibility?.evidence),
    },
    guideState: guideState.state,
    guideRegionCount: guideState.regionCount,
    accessibilityQuestionsEnabled: guideState.accessibilityQuestionsEnabled,
    humanEvidence: {
      studentReviewed,
      independentReviewed,
      fieldConfirmed,
      taeyunStatus: firstText(humanReview.taeyunDirectReview, studentReviewed ? 'verified' : 'pending'),
      independentStatus: firstText(humanReview.independentReview, independentReviewed ? 'verified' : 'pending'),
      fieldStatus: firstText(humanReview.fieldConfirmation, fieldConfirmed ? 'verified' : 'pending'),
    },
    reviewReadiness,
    reviewStatus: reviewReadiness,
    nextAction,
    canOpenPhotoReview: reviewReadiness === DAEJEON_REVIEW_QUEUE_STATUS.ONE_FRAME_READY,
    canOpenPlaceMatchQuestion: reviewReadiness === DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY,
    links,
    statusMeta: {
      reviewLabel: reviewReadiness === DAEJEON_REVIEW_QUEUE_STATUS.ONE_FRAME_READY
        ? '한 장 검수 준비 완료'
        : reviewReadiness === DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY
          ? '장소 일치 질문만'
          : reviewReadiness === DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED
            ? '로드뷰 자료 준비 필요'
            : '원천 제외',
      nextActionLabel: nextAction === DAEJEON_REVIEW_QUEUE_STATUS.LOCATION_CONFIRMATION_NEEDED
        ? '장소·입구·접근성 확인 필요'
        : nextAction === DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED
          ? '좌표 범위 확인 필요'
          : '로드뷰 자료 준비 필요',
      roadviewStatusColor: roadviewStatusMeta.color,
    },
    evidenceBoundary: {
      candidateOnly: true,
      photoIsNotPlaceVerification: photoAvailable,
      placeMatchVerified,
      accessibilityVerified,
      studentReviewed,
      independentReviewed,
      fieldConfirmed,
      note: '사진·pano ID·좌표 링크의 존재만으로 장소 일치나 접근성을 확정하지 않습니다.',
    },
  };
}

function countBy(items, getKey, fallback = '미분류') {
  return items.reduce((counts, item) => {
    const key = getKey(item) || fallback;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function sortByLabel(left, right) {
  return String(left.label ?? left.name ?? left.value ?? '').localeCompare(
    String(right.label ?? right.name ?? right.value ?? ''),
    'ko',
  );
}

function buildFilterOptions(items) {
  const districtCounts = countBy(items, (item) => item.district, '구 확인 필요');
  const categoryCounts = countBy(items, (item) => item.category, 'other');
  const dongCounts = new Map();
  let unmatchedDongCount = 0;
  items.forEach((item) => {
    if (item.administrativeDongs.length === 0) unmatchedDongCount += 1;
    item.administrativeDongs.forEach((dong) => {
      const current = dongCounts.get(dong.code) ?? {
        value: dong.code,
        label: dong.name || '동 이름 확인 필요',
        district: dong.district || item.district,
        count: 0,
      };
      current.count += 1;
      dongCounts.set(dong.code, current);
    });
  });

  return {
    districts: [
      { value: 'all', label: '전체 구', count: items.length },
      ...Object.entries(districtCounts)
        .map(([value, count]) => ({ value, label: value, count }))
        .sort(sortByLabel),
    ],
    categories: [
      { value: 'all', label: '전체 유형', count: items.length },
      ...Object.entries(categoryCounts)
        .map(([value, count]) => ({
          value,
          label: CATEGORY_LABELS[value] ?? value,
          count,
        }))
        .sort(sortByLabel),
    ],
    dongs: [
      { value: 'all', label: '전체 동', count: items.length },
      ...[...dongCounts.values()].sort((left, right) => (
        String(left.district).localeCompare(String(right.district), 'ko')
        || String(left.label).localeCompare(String(right.label), 'ko')
      )),
      ...(unmatchedDongCount > 0
        ? [{ value: 'unmatched', label: '동 연결 대기', count: unmatchedDongCount }]
        : []),
    ],
  };
}

function summarizeItems(items, regionBridgeInput, candidatesInput) {
  const administrativeCoverageSummary = regionBridgeInput?.summary ?? {};
  const statusCounts = countBy(items, (item) => item.reviewStatus, 'unknown');
  const roadviewStatusCounts = countBy(items, (item) => item.roadview.status, 'unchecked');
  const photoAvailableCount = items.filter((item) => item.photo.available).length;
  const coordinateEligibleCount = items.filter((item) => item.coordinate.valid).length;
  const locationConfirmationNeededCount = items.filter((item) => item.location.confirmationNeeded).length;
  const placeMatchVerifiedCount = items.filter((item) => item.location.placeMatchVerified).length;
  const accessibilityVerifiedCount = items.filter((item) => item.location.accessibilityVerified).length;
  const studentReviewedCount = items.filter((item) => item.humanEvidence.studentReviewed).length;
  const independentReviewedCount = items.filter((item) => item.humanEvidence.independentReviewed).length;
  const fieldConfirmedCount = items.filter((item) => item.humanEvidence.fieldConfirmed).length;
  const validUniqueCoordinateCount = new Set(
    items
      .filter((item) => item.coordinate.valid)
      .map((item) => `${item.coordinate.lat}|${item.coordinate.lng}`),
  ).size;
  const sourceCategoryCounts = Object.fromEntries(
    Object.entries(countBy(items, (item) => item.category, 'other')),
  );

  return {
    sourceRows: items.length,
    candidateCount: items.length,
    plottableCandidateCount: coordinateEligibleCount,
    coordinateExcludedCount: items.length - coordinateEligibleCount,
    uniqueCoordinateCount: Number(candidatesInput?.coordinateSummary?.uniqueCoordinateCount ?? 0),
    validUniqueCoordinateCount,
    duplicateCoordinateExtraRowCount: coordinateEligibleCount - validUniqueCoordinateCount,
    sourceCategoryCounts,
    oneFrameReadyCount: statusCounts[DAEJEON_REVIEW_QUEUE_STATUS.ONE_FRAME_READY] ?? 0,
    placeMatchOnlyCount: statusCounts[DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY] ?? 0,
    roadviewCaptureRequiredCount:
      statusCounts[DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED] ?? 0,
    sourceExcludedCount: statusCounts[DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED] ?? 0,
    photoReviewReadyCount: photoAvailableCount,
    roadviewMaterialNeededCount:
      statusCounts[DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED] ?? 0,
    roadviewPreparationOrLocationCount:
      (statusCounts[DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED] ?? 0)
      + locationConfirmationNeededCount,
    locationConfirmationNeededCount,
    placeMatchVerifiedCount,
    accessibilityVerifiedCount,
    studentReviewedCount,
    independentReviewedCount,
    fieldConfirmedCount,
    pendingPlaceMatchCount: items.length - placeMatchVerifiedCount,
    pendingAccessibilityCount: items.length - accessibilityVerifiedCount,
    photoAvailableCount,
    statusCounts,
    roadviewStatusCounts,
    administrativeDongCoverageCount: Number(
      administrativeCoverageSummary.administrativeDongMatchedCount
      ?? administrativeCoverageSummary.administrativeDongRelationCoverageCount
      ?? 0,
    ),
    administrativeDongExactCandidateCoverageCount: Number(
      administrativeCoverageSummary.administrativeDongExactCandidateCoverageCount ?? 0,
    ),
    expectedAdministrativeDongCount: Number(
      administrativeCoverageSummary.expectedAdministrativeDongCount ?? 0,
    ),
    legalDongCoverageCount: Number(
      administrativeCoverageSummary.legalDongMatchedCount ?? 0,
    ),
    expectedLegalDongCount: Number(
      administrativeCoverageSummary.expectedLegalDongCount ?? 0,
    ),
    regionMatchedCandidateCount: Number(
      administrativeCoverageSummary.candidateRegionMatchedCount ?? 0,
    ),
    regionAmbiguousCandidateCount: Number(
      administrativeCoverageSummary.candidateRegionAmbiguousCount ?? 0,
    ),
    regionUnmatchedCandidateCount: Number(
      administrativeCoverageSummary.candidateRegionUnmatchedCount ?? 0,
    ),
  };
}

export function createDaejeonReviewQueueData(
  candidatesInput,
  { roadviewAuditInput = null, regionBridgeInput = null } = {},
) {
  const normalizedCandidates = normalizeDaejeonPlaceCandidates(
    candidatesInput,
    roadviewAuditInput,
    regionBridgeInput,
  );
  const items = normalizedCandidates.map(adaptCandidate);
  const summary = summarizeItems(items, regionBridgeInput, candidatesInput);
  return {
    schema: DAEJEON_REVIEW_QUEUE_SCHEMA,
    municipality: '대전광역시',
    items,
    summary,
    filters: buildFilterOptions(items),
    sourceBoundary: {
      sourceRows: summary.sourceRows,
      plottableCandidateCount: summary.plottableCandidateCount,
      photoAvailableCount: summary.photoAvailableCount,
      reviewReadiness: {
        one_frame_ready: summary.oneFrameReadyCount,
        place_match_only: summary.placeMatchOnlyCount,
        roadview_capture_required: summary.roadviewCaptureRequiredCount,
        source_excluded: summary.sourceExcludedCount,
      },
      guideState: {
        three_regions_ready: items.filter((item) => item.guideState === 'three_regions_ready').length,
        guide_required: items.filter((item) => item.guideState === 'guide_required').length,
      },
      placeMatchVerifiedCount: summary.placeMatchVerifiedCount,
      accessibilityVerifiedCount: summary.accessibilityVerifiedCount,
      studentReviewedCount: summary.studentReviewedCount,
      independentReviewedCount: summary.independentReviewedCount,
      fieldConfirmedCount: summary.fieldConfirmedCount,
      note: '행정동 목록 커버리지와 로드뷰·장소·접근성 검증은 별도 상태입니다.',
    },
  };
}

export function filterDaejeonReviewQueue(items, {
  district = 'all',
  dong = 'all',
  category = 'all',
  status = 'all',
  query = '',
} = {}) {
  const normalizedQuery = String(query).trim().toLowerCase();
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (district !== 'all' && item.district !== district) return false;
    if (category !== 'all' && item.category !== category) return false;
    if (dong !== 'all') {
      if (dong === 'unmatched' && item.administrativeDongs.length > 0) return false;
      if (dong !== 'unmatched' && !item.administrativeDongCodes.includes(dong)) return false;
    }
    if (status !== 'all') {
      const matchesStatus = item.reviewStatus === status
        || (status === DAEJEON_REVIEW_QUEUE_STATUS.LOCATION_CONFIRMATION_NEEDED
          && item.location.confirmationNeeded)
        || (status === DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_VERIFIED
          && item.location.placeMatchVerified)
        || (status === DAEJEON_REVIEW_QUEUE_STATUS.ACCESSIBILITY_VERIFIED
          && item.location.accessibilityVerified);
      if (!matchesStatus) return false;
    }
    if (!normalizedQuery) return true;
    return [
      item.id,
      item.name,
      item.categoryLabel,
      item.district,
      item.address,
      item.sourceRecordId,
      ...item.administrativeDongs.map((dongItem) => dongItem.name),
    ].some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
  });
}

export function getPreferredDaejeonReviewQueueItem(items) {
  return (Array.isArray(items) ? items : []).find((item) => item.photo?.available)
    ?? (Array.isArray(items) ? items[0] : null)
    ?? null;
}

export function toDaejeonCitizenReviewCandidate(itemOrCandidate) {
  const item = itemOrCandidate?.candidate ? itemOrCandidate : null;
  const candidate = item?.candidate ?? itemOrCandidate ?? {};
  const photo = item?.photo ?? {};
  const imagePath = photo.imagePath ?? getRenderableRoadviewImage(candidate?.roadviewAudit);
  if (!imagePath) return candidate;

  const evidence = candidate?.locationVerification?.placeMatchEvidence ?? {};
  return {
    ...candidate,
    reviewReadiness: item?.reviewReadiness ?? 'place_match_only',
    reviewPhoto: {
      ...(candidate.reviewPhoto ?? {}),
      image: imagePath,
      captureDate: photo.captureTime ?? candidate.reviewPhoto?.captureDate ?? '',
    },
    locationVerification: {
      ...(candidate.locationVerification ?? {}),
      placeMatchEvidence: {
        ...evidence,
        image: imagePath,
        panoId: item?.roadview?.panoId ?? candidate.roadviewAudit?.panoId ?? evidence.panoId ?? '',
        imageSha256: photo.imageSha256 ?? evidence.imageSha256 ?? '',
        captureDate: photo.captureTime ?? evidence.captureDate ?? '',
        placeName: candidate.name ?? evidence.placeName ?? '',
        address: candidate.address ?? evidence.address ?? '',
        sourceRecordId: item?.sourceRecordId ?? candidate.sourceRecordId ?? '',
        sourceRecordSha256: candidate.sourceRecordSha256 ?? '',
      },
    },
  };
}
