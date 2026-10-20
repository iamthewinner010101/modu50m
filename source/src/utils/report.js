import { getBarrierLabel, scoreCandidate } from './scoring.js';

const STATUS_LABELS = {
  unreviewed: '검수 전',
  field_check_needed: '현장 확인 필요',
  rejected: '후보 제외',
  published: '검수 완료',
};

const SEVERITY_LABELS = {
  unknown: '라벨 미정',
  low: '낮음',
  medium: '중간',
  high: '높음',
  field_check_needed: '현장 확인 필요',
};

const AI_AGREEMENT_LABELS = {
  unknown: '비교 미정',
  match: '일치',
  partial: '부분 일치',
  mismatch: '불일치',
  hold: '판단 보류',
};

const VALIDATION_STATUS_LABELS = {
  not_started: '후속 검수 기록 전',
  single_review: '1차 검수 완료',
  needs_second_review: '독립 검수 필요',
  confirmed: '독립 검수 확인 완료',
  disputed: '독립 검수 판정 불일치',
  not_visible: '로드뷰에서 안 보임',
};

const FACILITY_GROUPS = {
  약국: '의료·생활필수시설',
  병원: '의료·생활필수시설',
  편의점: '의료·생활필수시설',
  버스정류장: '교통시설',
  지하철역: '교통시설',
  공공기관: '공공·민원시설',
  도서관: '공공·민원시설',
  은행: '공공·민원시설',
  학원: '교육·돌봄시설',
  학교: '교육·돌봄시설',
  시장: '상업·시장시설',
  공원: '공원·여가시설',
};

export function getReviewStatus(candidate, review) {
  return review?.status ?? candidate.reviewStatus ?? 'unreviewed';
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function getSeverityLabel(severity) {
  return SEVERITY_LABELS[severity] ?? severity ?? SEVERITY_LABELS.unknown;
}

export function getAiAgreementLabel(agreement) {
  return AI_AGREEMENT_LABELS[agreement] ?? agreement ?? AI_AGREEMENT_LABELS.unknown;
}

export function getValidationStatusLabel(status) {
  return VALIDATION_STATUS_LABELS[status] ?? status ?? VALIDATION_STATUS_LABELS.not_started;
}

function getFacilityGroup(facilityType) {
  return FACILITY_GROUPS[facilityType] ?? facilityType ?? '기타';
}

export function generateReport(candidates, reviews) {
  const statusCounts = {
    unreviewed: 0,
    field_check_needed: 0,
    rejected: 0,
    published: 0,
  };
  const barrierCounts = {};
  const severityCounts = {};
  const aiAgreementCounts = {};
  const facilityPatterns = {};
  let aiHumanComparableCount = 0;
  let aiHumanMatchCount = 0;

  const scoredCandidates = candidates
    .map((candidate) => {
      const review = reviews[candidate.id];
      const status = getReviewStatus(candidate, review);
      const aiBarrierType = candidate.defaultBarrierType ?? 'unknown';
      const barrierType = review?.barrierType ?? aiBarrierType;
      const severity = review?.severity ?? 'unknown';
      const aiAgreement = review?.aiAgreement ?? 'unknown';
      const score = scoreCandidate(candidate);
      const isReviewed = status !== 'unreviewed';
      const facilityType = getFacilityGroup(candidate.facilityType);

      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      barrierCounts[barrierType] = (barrierCounts[barrierType] ?? 0) + 1;
      severityCounts[severity] = (severityCounts[severity] ?? 0) + 1;
      aiAgreementCounts[aiAgreement] = (aiAgreementCounts[aiAgreement] ?? 0) + 1;
      facilityPatterns[facilityType] ??= { total: 0, barrierCounts: {} };
      facilityPatterns[facilityType].total += 1;
      facilityPatterns[facilityType].barrierCounts[barrierType] =
        (facilityPatterns[facilityType].barrierCounts[barrierType] ?? 0) + 1;

      if (isReviewed && aiAgreement !== 'unknown') {
        aiHumanComparableCount += 1;
        if (aiAgreement === 'match') aiHumanMatchCount += 1;
      }

      return {
        ...candidate,
        score,
        status,
        aiBarrierType,
        barrierType,
        severity,
        aiAgreement,
        facilityGroup: facilityType,
      };
    })
    .sort((a, b) => b.score - a.score);

  const reviewedCount =
    statusCounts.field_check_needed + statusCounts.rejected + statusCounts.published;

  const topBarrierTypes = Object.entries(barrierCounts)
    .map(([type, count]) => ({
      type,
      label: getBarrierLabel(type),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topFacilityPatterns = Object.entries(facilityPatterns)
    .map(([facilityType, pattern]) => {
      const [topBarrierType, topBarrierCount] =
        Object.entries(pattern.barrierCounts).sort((a, b) => b[1] - a[1])[0] ?? ['unknown', 0];

      return {
        facilityType,
        count: pattern.total,
        topBarrierType,
        topBarrierLabel: getBarrierLabel(topBarrierType),
        topBarrierCount,
      };
    })
    .sort((a, b) => b.count - a.count || b.topBarrierCount - a.topBarrierCount)
    .slice(0, 4);

  return {
    total: candidates.length,
    reviewedCount,
    reviewedRate: Math.round((reviewedCount / Math.max(candidates.length, 1)) * 100),
    aiHumanComparableCount,
    aiHumanMatchCount,
    aiHumanMatchRate:
      aiHumanComparableCount === 0
        ? 0
        : Math.round((aiHumanMatchCount / aiHumanComparableCount) * 100),
    statusCounts,
    severityCounts,
    aiAgreementCounts,
    topRiskCandidates: scoredCandidates.slice(0, 3),
    topBarrierTypes,
    topFacilityPatterns,
  };
}
