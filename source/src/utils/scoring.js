const SIGNAL_LABELS = {
  curb: '경계석 단차 가능성',
  slope: '경사 변화 가능성',
  narrowSidewalk: '보도 폭 부족 가능성',
  crossingComplexity: '차량 동선 교차 가능성',
  entranceStep: '입구 문턱 가능성',
  roadviewConfidence: '로드뷰 확인 가능성',
};

const HUMAN_CHECK_FOCUS = {
  curb: ['횡단보도 끝 경계석 높이', '휠체어나 유모차가 넘기 어려운 턱인지', '우회 가능한 낮은 경계석 위치'],
  slope: ['입구나 보도의 경사 방향', '경사가 짧고 급한지', '비나 눈이 올 때 미끄러질 가능성'],
  narrow_sidewalk: ['보도 폭이 휠체어 한 대가 지나갈 만큼 충분한지', '전봇대·간판·주차 차량이 통로를 막는지', '사람이 많은 시간에도 통행 가능한지'],
  crossing: ['차량 출입구와 보행 동선이 겹치는지', '횡단 대기 공간이 좁은지', '운전자가 보행자를 보기 어려운 구조인지'],
  entrance_step: ['건물 입구 문턱 높이', '경사로 또는 자동문이 있는지', '문 앞 회전 공간이 충분한지'],
  surface: ['노면이 울퉁불퉁하거나 파손되었는지', '바퀴가 걸릴 틈이나 배수구가 있는지', '비 오는 날 미끄러울 가능성'],
  none: ['AI 후보가 실제 장벽인지 다시 확인', '문제가 없다면 제외 사유 기록'],
  unknown: ['로드뷰 각도나 사진 시점 확인', '지도만으로 부족한 부분 메모', '현장 확인이 필요한 이유 기록'],
};

const SIGNAL_WEIGHTS = {
  curb: 18,
  slope: 18,
  narrowSidewalk: 20,
  crossingComplexity: 18,
  entranceStep: 20,
  roadviewConfidence: 6,
};

// 이 가중치는 안전 또는 접근 가능성을 판정하는 기준이 아니다.
// 같은 12개 사례의 사람 비교 결과가 생기기 전까지 검수 순서를 정하는 초기 가설로만 사용한다.
export const REVIEW_PRIORITY_WEIGHTS = Object.freeze({
  evidenceGap: 25,
  aiUncertainty: 25,
  candidateSignal: 20,
  imageryLimitation: 10,
  verificationConflict: 10,
  followUpNeed: 10,
});

const REVIEW_PRIORITY_FACTOR_LABELS = {
  evidenceGap: '사람 증거 공백',
  aiUncertainty: 'AI 판단 불확실성',
  candidateSignal: '규칙 후보 신호',
  imageryLimitation: '사진 시점·위치 한계',
  verificationConflict: 'AI·사람 판단 불일치',
  followUpNeed: '후속 검수 필요',
};

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function getEvidenceGap(review = {}, requirementState = null) {
  if (
    Number.isFinite(requirementState?.missingRequirementCount) &&
    Number.isFinite(requirementState?.totalRequirementCount) &&
    requirementState.totalRequirementCount > 0
  ) {
    return Math.round(clampPercent(
      requirementState.missingRequirementCount /
        requirementState.totalRequirementCount *
        100,
    ));
  }

  const validationStatus = review.validationStatus ?? 'not_started';
  if (validationStatus === 'disputed') return 100;
  if (validationStatus === 'needs_second_review' || review.status === 'field_check_needed') return 90;
  if (review.stepChecks?.decisionSaved) return 50;
  if (Object.values(review.focusChecks ?? {}).some(Boolean)) return 75;
  return 100;
}

function getAiUncertainty(photoDraft) {
  if (!photoDraft?.available) return 100;

  const confidenceScores = {
    high: 30,
    medium: 60,
    low: 90,
    unknown: 100,
  };
  const confidenceScore = confidenceScores[photoDraft.confidenceKey] ?? 100;
  return photoDraft.barrierType === 'unknown' ? Math.max(95, confidenceScore) : confidenceScore;
}

function getImageryLimitation(directionAsset, referenceDate) {
  if (!directionAsset?.captureDate) return 100;

  const capturedAt = new Date(directionAsset.captureDate);
  const comparedAt = referenceDate instanceof Date ? referenceDate : new Date(referenceDate ?? Date.now());
  if (Number.isNaN(capturedAt.getTime()) || Number.isNaN(comparedAt.getTime())) return 100;

  const ageYears = Math.max(0, (comparedAt.getTime() - capturedAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  let ageScore = ageYears > 5 ? 100 : ageYears > 2 ? 80 : ageYears > 1 ? 55 : 25;
  if (directionAsset.spatialMarkersVerified !== true) ageScore = Math.max(ageScore, 65);
  return ageScore;
}

function getVerificationConflict(review = {}) {
  const agreement = review.aiAgreement ?? 'unknown';
  if (agreement === 'mismatch') return 100;
  if (agreement === 'partial') return 85;
  if (agreement === 'hold') return 25;
  return 0;
}

function getFollowUpNeed(review = {}) {
  const validationStatus = review.validationStatus ?? 'not_started';
  if (validationStatus === 'disputed' || review.status === 'field_check_needed') return 100;
  if (validationStatus === 'needs_second_review' || validationStatus === 'not_visible') return 90;
  if (validationStatus === 'single_review') return 20;
  return 0;
}

export function scoreCandidate(candidate) {
  const signals = candidate.aiSignals ?? {};
  const weightedTotal = Object.entries(SIGNAL_WEIGHTS).reduce((sum, [key, weight]) => {
    const normalizedSignal = Math.max(0, Math.min(5, Number(signals[key] ?? 0))) / 5;
    return sum + normalizedSignal * weight;
  }, 0);

  return Math.round(weightedTotal);
}

export function getWeightedReviewPriority(candidate, context = {}) {
  const {
    review = {},
    photoDraft = null,
    directionAsset = null,
    requirementState = null,
    referenceDate = new Date(),
  } = context;
  const factorValues = {
    evidenceGap: getEvidenceGap(review, requirementState),
    aiUncertainty: getAiUncertainty(photoDraft),
    candidateSignal: scoreCandidate(candidate),
    imageryLimitation: getImageryLimitation(directionAsset, referenceDate),
    verificationConflict: getVerificationConflict(review),
    followUpNeed: getFollowUpNeed(review),
  };
  const factors = Object.entries(REVIEW_PRIORITY_WEIGHTS).map(([key, weight]) => {
    const value = clampPercent(factorValues[key]);
    return {
      key,
      label: REVIEW_PRIORITY_FACTOR_LABELS[key],
      value,
      weight,
      contribution: Math.round(value * weight) / 100,
    };
  });
  const score = Math.round(factors.reduce((sum, factor) => sum + factor.contribution, 0));
  const band = score >= 80
    ? { key: 'first', label: '먼저 검수' }
    : score >= 65
      ? { key: 'high', label: '우선 검수' }
      : score >= 45
        ? { key: 'normal', label: '일반 검수' }
        : { key: 'keep', label: '기록 유지' };

  return {
    kind: 'review_priority_only',
    score,
    band,
    factors,
    topFactors: [...factors].sort((a, b) => b.contribution - a.contribution).slice(0, 2),
    methodologyStatus: 'PROVISIONAL_UNCALIBRATED',
    calibrationNote: '초기 가중치이며, 같은 12개 실제 비교 뒤 조정합니다.',
    disclaimer: '검수 순서를 정하는 값이며 안전·접근 가능성 점수가 아닙니다.',
  };
}

export function getRiskLevel(score) {
  if (score >= 76) return { key: 'high', label: '높음' };
  if (score >= 56) return { key: 'medium', label: '중간' };
  return { key: 'low', label: '낮음' };
}

export function getReasonChips(candidate, limit = 3) {
  const signals = candidate.aiSignals ?? {};

  return Object.entries(signals)
    .filter(([key]) => key !== 'roadviewConfidence')
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([key, value]) => ({
      key,
      label: SIGNAL_LABELS[key] ?? key,
      value,
    }));
}

export function getInspectionPlan(candidate) {
  const score = scoreCandidate(candidate);
  const risk = getRiskLevel(score);
  const barrierType = candidate.defaultBarrierType ?? 'unknown';
  const signals = candidate.aiSignals ?? {};
  const strongestSignals = Object.entries(signals)
    .filter(([key]) => key !== 'roadviewConfidence')
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([key, value]) => ({
      key,
      label: SIGNAL_LABELS[key] ?? key,
      value,
      clarity: Number(value) >= 4 ? '우선 확인 신호' : Number(value) >= 3 ? '보조 확인 신호' : '추가 확인 신호',
    }));
  const roadviewConfidence = Number(signals.roadviewConfidence ?? 0);

  return {
    score,
    risk,
    barrierType,
    barrierLabel: getBarrierLabel(barrierType),
    clarityLabel: roadviewConfidence >= 4 ? '지도/로드뷰 우선 확인 가능' : roadviewConfidence >= 3 ? '지도/로드뷰 보조 확인' : '현장 확인 우선',
    aiCheckedItems: strongestSignals,
    humanCheckFocus: HUMAN_CHECK_FOCUS[barrierType] ?? HUMAN_CHECK_FOCUS.unknown,
    reviewPriorityReason: `규칙 후보 신호가 ${risk.label}이며, ${strongestSignals[0]?.label ?? '추가 확인 신호'}부터 사람이 확인합니다.`,
  };
}

export function getBarrierLabel(type) {
  const labels = {
    curb: '경계석/턱',
    slope: '경사',
    narrow_sidewalk: '좁은 보도',
    crossing: '차량 동선 교차',
    entrance_step: '입구 문턱',
    surface: '노면 상태',
    none: '문제 없음',
    unknown: '추가 확인 필요',
  };

  return labels[type] ?? type;
}
