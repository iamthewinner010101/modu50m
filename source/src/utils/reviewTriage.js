import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan.js';
import { getReviewRequirementState, REVIEW_REQUIREMENT_TOTAL } from './evidence.js';
import { getPhotoAiDraft } from './photoAiDraft.js';
import { getBarrierLabel, getWeightedReviewPriority, scoreCandidate } from './scoring.js';

export const TRIAGE_DECISIONS = Object.freeze({
  AUTO_VERIFIED: 'AUTO_VERIFIED',
  HUMAN_REVIEW_REQUIRED: 'HUMAN_REVIEW_REQUIRED',
  BLOCKED_DATA: 'BLOCKED_DATA',
  REJECTED_INVALID: 'REJECTED_INVALID',
});

export const FEEDBACK_ORIGINS = Object.freeze({
  HUMAN_USER: 'human_user',
  AUTOMATED_QA: 'automated_qa',
  LEGACY_UNVERIFIED: 'legacy_unverified',
});

export const LEARNING_STAGES = Object.freeze({
  CANDIDATE: 'CANDIDATE',
  SHADOW: 'SHADOW',
  PROMOTED: 'PROMOTED',
  ROLLED_BACK: 'ROLLED_BACK',
});

export const LEARNING_PRIORITY_EFFECTS = Object.freeze({
  NONE: 'NONE',
  DEPRIORITIZE_P1_TO_P2: 'DEPRIORITIZE_P1_TO_P2',
});

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2 };
const COMPLETED_STATUSES = new Set(['published', 'rejected']);
const OPEN_FOLLOW_UP_VALIDATION_STATUSES = new Set(['needs_second_review', 'disputed', 'not_visible']);
const SHADOW_MINIMUM_HUMAN_FEEDBACK = 5;
const TRANSIENT_LEARNING_REASONS = new Set([
  'STUDENT_DIRECT_REVIEW_REQUIRED',
  'REVIEW_REQUIREMENTS_INCOMPLETE',
  'FIELD_CHECK_PENDING',
  'HUMAN_DECISION_COMPLETED',
]);

const LOCATION_REASONS = {
  context_conflict: {
    code: 'PLACE_CONTEXT_CONFLICT',
    priority: 'P0',
    label: '시설명·좌표 불일치',
    question: '프로젝트 가설명과 실제 좌표 주변 지명이 같은 장소입니까?',
  },
  roadview_distance_warning: {
    code: 'ROADVIEW_DISTANCE_WARNING',
    priority: 'P0',
    label: '로드뷰 거리 주의',
    question: '이 로드뷰가 후보 지점을 판단할 만큼 충분히 가깝습니까?',
  },
  stale_roadview: {
    code: 'STALE_ROADVIEW',
    priority: 'P0',
    label: '오래된 로드뷰',
    question: '현재 상태를 판단할 최신 지도나 현장 근거가 있습니까?',
  },
  place_match_required: {
    code: 'PLACE_MATCH_REQUIRED',
    priority: 'P1',
    label: '시설 위치 대조 필요',
    question: '지도 마커, 주변 건물, 로드뷰 장면이 같은 지점입니까?',
  },
};

function getRuleState(ruleStates, reasonCode) {
  return ruleStates?.[reasonCode] ?? null;
}

function applyPromotedRuleEffects(row, ruleStates) {
  if (row.decision !== TRIAGE_DECISIONS.HUMAN_REVIEW_REQUIRED) return row;
  const promotedReasonCodes = row.reasonCodes.filter(
    (reasonCode) => getRuleState(ruleStates, reasonCode)?.stage === LEARNING_STAGES.PROMOTED,
  );
  if (promotedReasonCodes.length === 0) return row;

  const priorityEffect =
    row.priority === 'P1'
      ? LEARNING_PRIORITY_EFFECTS.DEPRIORITIZE_P1_TO_P2
      : LEARNING_PRIORITY_EFFECTS.NONE;

  return {
    ...row,
    priority: priorityEffect === LEARNING_PRIORITY_EFFECTS.DEPRIORITIZE_P1_TO_P2 ? 'P2' : row.priority,
    learnedRuleApplied: true,
    learnedRuleReasonCodes: promotedReasonCodes,
    learnedPriorityEffect: priorityEffect,
    queueType:
      priorityEffect === LEARNING_PRIORITY_EFFECTS.DEPRIORITIZE_P1_TO_P2
        ? '승격 규칙 보조'
        : row.queueType,
  };
}

function isValidCoordinate(candidate) {
  return Number.isFinite(candidate?.lat) &&
    Number.isFinite(candidate?.lng) &&
    candidate.lat >= -90 &&
    candidate.lat <= 90 &&
    candidate.lng >= -180 &&
    candidate.lng <= 180;
}

function getMissingData(candidate) {
  const missing = [];
  const capturePlan = getRoadviewCapturePlan(candidate);

  if (!candidate?.locationVerification) missing.push('위치 이중 확인 데이터');
  if (!capturePlan?.image) missing.push('후보 좌표 방향 로드뷰');
  if (!candidate?.reviewLinks?.kakaoMap) missing.push('카카오 좌표 링크');
  if (!candidate?.reviewLinks?.kakaoRoadview) missing.push('카카오 로드뷰 링크');

  return missing;
}

function getLocationReason(candidate) {
  const status = candidate?.locationVerification?.status;
  const reason = LOCATION_REASONS[status];
  if (!reason) return null;

  return {
    ...reason,
    detail: candidate.locationVerification.reason ?? reason.label,
    requiredAction:
      candidate.locationVerification.requiredAction ??
      '지도와 로드뷰에서 후보 위치를 다시 확인합니다.',
  };
}

function countPassedReviewRequirements(requirementState) {
  return REVIEW_REQUIREMENT_TOTAL - requirementState.missingRequirementCount;
}

function getOldestQueueAge(humanRows, now) {
  const updatedTimes = humanRows
    .map((row) => row.review?.updatedAt)
    .filter(Boolean)
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);

  if (updatedTimes.length === 0) {
    return { hours: null, label: '검수 시작 전' };
  }

  const oldest = Math.min(...updatedTimes);
  const hours = Math.max(0, Math.floor((now.getTime() - oldest) / 3_600_000));
  return { hours, label: `${hours}시간` };
}

function classifyCandidate(candidate, review, duplicateId) {
  const requirementState = getReviewRequirementState(candidate, review);
  const score = scoreCandidate(candidate);
  const capturePlan = getRoadviewCapturePlan(candidate);
  const photoDraft = getPhotoAiDraft(candidate);
  const reviewPriority = getWeightedReviewPriority(candidate, {
    review,
    photoDraft,
    directionAsset: capturePlan?.roadviewAsset,
    requirementState,
  });
  const base = {
    candidate,
    review,
    score,
    reviewPriority,
    reviewPriorityScore: reviewPriority.score,
    barrierLabel: getBarrierLabel(candidate?.defaultBarrierType ?? 'unknown'),
    locationStatus: candidate?.locationVerification?.status ?? 'missing',
    locationStatusLabel:
      candidate?.locationVerification?.statusLabel ?? '위치 데이터 없음',
    metRequirementCount: requirementState.metRequirementCount,
    missingRequirementCount: requirementState.missingRequirementCount,
    totalRequirementCount: requirementState.totalRequirementCount,
    missingRequirements: requirementState.missingRequirements,
    missingLabel: requirementState.missingLabel,
    reviewReady: requirementState.ready,
    evidenceVersionTracked: requirementState.evidenceVersionTracked,
    evidenceCurrent: requirementState.evidenceCurrent,
    currentEvidenceVersion: requirementState.currentEvidenceVersion,
    storedEvidenceVersion: requirementState.storedEvidenceVersion,
  };

  if (!candidate?.id || !candidate?.name || duplicateId || !isValidCoordinate(candidate)) {
    const invalidReason = duplicateId
      ? '후보 ID가 중복되었습니다.'
      : !candidate?.id || !candidate?.name
        ? '후보 ID 또는 이름이 없습니다.'
        : '후보 좌표 범위가 올바르지 않습니다.';

    return {
      ...base,
      decision: TRIAGE_DECISIONS.REJECTED_INVALID,
      priority: 'P0',
      reasonCodes: ['INVALID_CANDIDATE'],
      primaryReason: invalidReason,
      question: '',
      requiredAction: '후보 데이터를 수정한 뒤 다시 가져옵니다.',
      evidenceRefs: ['candidate_data'],
      humanReviewRequired: false,
      queueType: '무효 후보',
      autoChecks: { passed: 0, failed: 1 },
    };
  }

  const missingData = getMissingData(candidate);
  if (missingData.length > 0) {
    return {
      ...base,
      decision: TRIAGE_DECISIONS.BLOCKED_DATA,
      priority: 'P1',
      reasonCodes: ['REQUIRED_DATA_MISSING'],
      primaryReason: `${missingData.join(', ')} 누락`,
      question: '',
      requiredAction: `${missingData.join(', ')}을 보강한 뒤 자동 분류를 다시 실행합니다.`,
      evidenceRefs: ['candidate_data', 'roadview_asset', 'map_links'],
      humanReviewRequired: false,
      queueType: '데이터 보강',
      autoChecks: { passed: 4 - missingData.length, failed: missingData.length },
    };
  }

  if (
    requirementState.ready &&
    COMPLETED_STATUSES.has(requirementState.status) &&
    !OPEN_FOLLOW_UP_VALIDATION_STATUSES.has(review?.validationStatus)
  ) {
    return {
      ...base,
      decision: TRIAGE_DECISIONS.AUTO_VERIFIED,
      priority: 'P2',
      reasonCodes: ['HUMAN_DECISION_COMPLETED'],
      primaryReason: '필수 사람 판정과 근거 저장이 완료되었습니다.',
      question: '',
      requiredAction: '현재 행동 없음. 감사 로그에서 판정 이력을 확인할 수 있습니다.',
      evidenceRefs: ['review_decision', 'review_requirements', 'audit_log'],
      humanReviewRequired: false,
      queueType: '처리 완료',
      autoChecks: { passed: REVIEW_REQUIREMENT_TOTAL + 5, failed: 0 },
    };
  }

  const reasons = [];
  const locationReason = getLocationReason(candidate);
  if (locationReason) reasons.push(locationReason);

  if (review?.validationStatus === 'disputed') {
    reasons.push({
      code: 'INDEPENDENT_REVIEW_DISPUTED',
      priority: 'P0',
      label: '독립 검수 불일치',
      detail: '1차 판단과 독립 재검수 결과가 달라 현장 또는 추가 증거가 필요합니다.',
      question: '불일치 이유를 비교하고 같은 위치의 추가 사진이나 현장 측정을 확보했습니까?',
      requiredAction: '불일치 이유를 보존하고 추가 사진 또는 현장 측정 결과를 연결합니다.',
    });
  } else if (review?.validationStatus === 'needs_second_review') {
    reasons.push({
      code: 'INDEPENDENT_REVIEW_PENDING',
      priority: 'P1',
      label: '독립 2차 검수 대기',
      detail: '1차 검수는 저장됐지만 다른 사람의 독립 재검수가 아직 필요합니다.',
      question: '1차 기록을 보지 않은 다른 검수자가 같은 위치를 확인했습니까?',
      requiredAction: '다른 계정의 독립 검수 결과와 근거 메모를 저장합니다.',
    });
  } else if (review?.validationStatus === 'not_visible') {
    reasons.push({
      code: 'ADDITIONAL_EVIDENCE_NOT_VISIBLE',
      priority: 'P1',
      label: '사진에서 근거 확인 불가',
      detail: '가림·각도·화질 때문에 현재 사진만으로 필요한 근거를 볼 수 없습니다.',
      question: '다른 각도 사진이나 현재 현장 증거를 확보했습니까?',
      requiredAction: '다른 각도 사진 또는 현장 확인으로 보이지 않은 항목을 보강합니다.',
    });
  }

  if (requirementState.status === 'field_check_needed') {
    reasons.push({
      code: 'FIELD_CHECK_PENDING',
      priority: 'P0',
      label: '현장 확인 대기',
      detail: '저장된 판정이 현장 확인 필요 상태입니다.',
      question: '현장 확인 결과를 반영해 최종 상태를 결정했습니까?',
      requiredAction: '현장 확인 결과를 기록하고 최종 상태를 다시 저장합니다.',
    });
  }

  if (requirementState.directReviewed && !requirementState.evidenceCurrent) {
    reasons.push({
      code: 'EVIDENCE_VERSION_CHANGED',
      priority: 'P0',
      label: '지도·로드뷰 근거 변경',
      detail: '저장된 사람 판정 이후 후보 위치 또는 로드뷰 근거 버전이 바뀌었습니다.',
      question: '변경된 지도와 로드뷰를 다시 확인해 기존 판정이 여전히 유효합니까?',
      requiredAction: '변경된 근거를 확인하고 사람 판정을 다시 저장합니다.',
    });
  }

  if (!requirementState.directReviewed) {
    reasons.push({
      code: 'STUDENT_DIRECT_REVIEW_REQUIRED',
      priority: 'P1',
      label: '직접 검수 미완료',
      detail: '코드페어 제출에 필요한 학생 직접 검수 기록이 없습니다.',
      question: '지도와 로드뷰를 직접 확인하고 최종 판정을 저장했습니까?',
      requiredAction: '검수 상태, 장벽, 심각도, AI 비교, 지도 근거와 메모를 저장합니다.',
    });
  } else if (!requirementState.ready) {
    reasons.push({
      code: 'REVIEW_REQUIREMENTS_INCOMPLETE',
      priority: 'P1',
      label: '검수 근거 보강 필요',
      detail: requirementState.missingLabel,
      question: '저장된 판정에 빠진 근거를 모두 채웠습니까?',
      requiredAction: `${requirementState.missingLabel}을 보강합니다.`,
    });
  }

  const priority = reasons.reduce(
    (highest, reason) =>
      PRIORITY_RANK[reason.priority] < PRIORITY_RANK[highest]
        ? reason.priority
        : highest,
    'P2',
  );
  const primary = reasons
    .slice()
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0];

  return {
    ...base,
    decision: TRIAGE_DECISIONS.HUMAN_REVIEW_REQUIRED,
    priority,
    reasonCodes: reasons.map((reason) => reason.code),
    primaryReason: primary?.label ?? '사람 판단 필요',
    reasonDetail: primary?.detail ?? requirementState.missingLabel,
    question: primary?.question ?? '이 후보의 최종 상태를 사람이 확인했습니까?',
    requiredAction: primary?.requiredAction ?? requirementState.missingLabel,
    evidenceRefs: ['map', 'roadview_focus', 'review_requirements'],
    humanReviewRequired: true,
    queueType:
      priority === 'P0'
        ? primary?.code === 'INDEPENDENT_REVIEW_DISPUTED'
          ? '판정 불일치'
          : '위치 위험'
        : requirementState.directReviewed
          ? '보강 필요'
          : '직접 검수',
    autoChecks: {
      passed: countPassedReviewRequirements(requirementState) + 5,
      failed: requirementState.missingRequirementCount,
    },
  };
}

export function buildHumanReviewTriage(candidates, reviews = {}, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
  const idCounts = candidates.reduce((counts, candidate) => {
    const key = candidate?.id ?? '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map());

  const rows = candidates.map((candidate) =>
    applyPromotedRuleEffects(
      classifyCandidate(candidate, reviews[candidate?.id], (idCounts.get(candidate?.id) ?? 0) > 1),
      options.ruleStates,
    ),
  );
  const sortRows = (items) =>
    items.slice().sort((a, b) => {
      const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      if (a.reviewPriorityScore !== b.reviewPriorityScore) {
        return b.reviewPriorityScore - a.reviewPriorityScore;
      }
      if (a.missingRequirementCount !== b.missingRequirementCount) {
        return b.missingRequirementCount - a.missingRequirementCount;
      }
      return b.score - a.score;
    });

  const humanReviewRequired = sortRows(
    rows.filter((row) => row.decision === TRIAGE_DECISIONS.HUMAN_REVIEW_REQUIRED),
  );
  const autoVerified = sortRows(
    rows.filter((row) => row.decision === TRIAGE_DECISIONS.AUTO_VERIFIED),
  );
  const blockedData = sortRows(
    rows.filter((row) => row.decision === TRIAGE_DECISIONS.BLOCKED_DATA),
  );
  const rejectedInvalid = sortRows(
    rows.filter((row) => row.decision === TRIAGE_DECISIONS.REJECTED_INVALID),
  );
  const oldestQueueAge = getOldestQueueAge(humanReviewRequired, now);
  const falseAutoPassCount = autoVerified.filter(
    (row) => !row.reviewReady || !COMPLETED_STATUSES.has(row.review?.status),
  ).length;
  const reasonCounts = humanReviewRequired
    .flatMap((row) => row.reasonCodes)
    .reduce((counts, code) => ({ ...counts, [code]: (counts[code] ?? 0) + 1 }), {});

  return {
    schema: 'modu50m.human_review_triage.v1',
    generatedAt: now.toISOString(),
    rows,
    humanReviewRequired,
    autoVerified,
    blockedData,
    rejectedInvalid,
    reasonCounts,
    metrics: {
      totalCandidateCount: rows.length,
      humanReviewRequiredCount: humanReviewRequired.length,
      autoVerifiedCount: autoVerified.length,
      blockedDataCount: blockedData.length,
      invalidRejectedCount: rejectedInvalid.length,
      highPriorityCount: humanReviewRequired.filter((row) => row.priority === 'P0').length,
      humanReviewRate:
        rows.length === 0 ? 0 : Math.round((humanReviewRequired.length / rows.length) * 100),
      oldestQueueAgeHours: oldestQueueAge.hours,
      oldestQueueAgeLabel: oldestQueueAge.label,
      falseAutoPassCount,
      promotedRuleAppliedCount: humanReviewRequired.filter((row) => row.learnedRuleApplied).length,
      evidenceRevalidationCount: humanReviewRequired.filter((row) =>
        row.reasonCodes.includes('EVIDENCE_VERSION_CHANGED'),
      ).length,
    },
  };
}

function getFeedbackOrigin(review) {
  if (review?.feedbackOrigin === FEEDBACK_ORIGINS.HUMAN_USER) {
    return FEEDBACK_ORIGINS.HUMAN_USER;
  }
  if (review?.feedbackOrigin === FEEDBACK_ORIGINS.AUTOMATED_QA) {
    return FEEDBACK_ORIGINS.AUTOMATED_QA;
  }
  return FEEDBACK_ORIGINS.LEGACY_UNVERIFIED;
}

function getLearningReasonCodes(row) {
  const codes = (row?.reasonCodes ?? []).filter((code) => !TRANSIENT_LEARNING_REASONS.has(code));
  return codes.length > 0 ? codes : ['GENERAL_ACCESSIBILITY_REVIEW'];
}

export function buildFeedbackLearningState(candidates, reviews = {}, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
  const baseline = buildHumanReviewTriage(candidates, {}, { now });
  const current = buildHumanReviewTriage(candidates, reviews, { now });
  const baselineByCandidate = new Map(
    baseline.rows.map((row) => [row.candidate?.id, row]),
  );
  const ruleMap = new Map();

  for (const row of baseline.humanReviewRequired) {
    for (const reasonCode of getLearningReasonCodes(row)) {
      if (ruleMap.has(reasonCode)) continue;
      ruleMap.set(reasonCode, {
        reasonCode,
        label: reasonCode === row.reasonCodes?.[0] ? row.primaryReason : reasonCode,
        priority: row.priority,
        feedback: [],
      });
    }
  }

  const decisionRecords = current.autoVerified.map((row) => {
    const baselineRow = baselineByCandidate.get(row.candidate?.id);
    const record = {
      candidateId: row.candidate?.id,
      origin: getFeedbackOrigin(row.review),
      aiAgreement: row.review?.aiAgreement ?? 'unknown',
      status: row.review?.status ?? 'unreviewed',
      updatedAt: row.review?.updatedAt ?? null,
      reasonCodes: getLearningReasonCodes(baselineRow),
    };
    for (const reasonCode of record.reasonCodes) {
      const rule = ruleMap.get(reasonCode) ?? {
        reasonCode,
        label: reasonCode,
        priority: 'P2',
        feedback: [],
      };
      rule.feedback.push(record);
      ruleMap.set(reasonCode, rule);
    }
    return record;
  });

  const falseAutoPassCount = current.metrics.falseAutoPassCount;
  const rules = Array.from(ruleMap.values())
    .map((rule) => {
      const humanFeedback = rule.feedback.filter(
        (record) => record.origin === FEEDBACK_ORIGINS.HUMAN_USER,
      );
      const automatedQaFeedback = rule.feedback.filter(
        (record) => record.origin === FEEDBACK_ORIGINS.AUTOMATED_QA,
      );
      const legacyFeedback = rule.feedback.filter(
        (record) => record.origin === FEEDBACK_ORIGINS.LEGACY_UNVERIFIED,
      );
      const matchCount = humanFeedback.filter((record) => record.aiAgreement === 'match').length;
      const overrideCount = humanFeedback.filter((record) =>
        ['partial', 'mismatch'].includes(record.aiAgreement),
      ).length;
      const shadowEligible =
        humanFeedback.length >= SHADOW_MINIMUM_HUMAN_FEEDBACK &&
        matchCount === humanFeedback.length &&
        falseAutoPassCount === 0;
      const persistedState = getRuleState(options.ruleStates, rule.reasonCode);
      const persistedStage = persistedState?.stage ?? '';
      const systemSuspended =
        persistedStage === LEARNING_STAGES.PROMOTED && !shadowEligible;
      const stage = systemSuspended
        ? LEARNING_STAGES.ROLLED_BACK
        : persistedStage === LEARNING_STAGES.PROMOTED
          ? LEARNING_STAGES.PROMOTED
          : persistedStage === LEARNING_STAGES.ROLLED_BACK
            ? LEARNING_STAGES.ROLLED_BACK
            : shadowEligible
              ? LEARNING_STAGES.SHADOW
              : LEARNING_STAGES.CANDIDATE;
      const priorityEffect =
        stage === LEARNING_STAGES.PROMOTED
          ? LEARNING_PRIORITY_EFFECTS.DEPRIORITIZE_P1_TO_P2
          : LEARNING_PRIORITY_EFFECTS.NONE;
      const promotionEligible =
        shadowEligible &&
        [LEARNING_STAGES.SHADOW, LEARNING_STAGES.ROLLED_BACK].includes(stage);
      const rollbackEligible = stage === LEARNING_STAGES.PROMOTED;

      let promotionBlocker = '최소 5건의 일치하는 사람 입력과 거짓 자동 통과 0건이 필요합니다.';
      if (stage === LEARNING_STAGES.SHADOW) {
        promotionBlocker = '그림자 평가를 통과했습니다. 감독이 큐 우선순위 반영 여부를 결정합니다.';
      } else if (stage === LEARNING_STAGES.PROMOTED) {
        promotionBlocker = '감독 승인으로 사람 검수 큐의 우선순위에만 적용 중입니다.';
      } else if (stage === LEARNING_STAGES.ROLLED_BACK) {
        promotionBlocker = systemSuspended
          ? '새 불일치 또는 안전 조건 변화로 규칙 적용을 자동 중지했습니다.'
          : '감독이 규칙을 롤백했습니다. 사람 검수 큐에는 적용되지 않습니다.';
      }

      return {
        reasonCode: rule.reasonCode,
        label: rule.label,
        priority: rule.priority,
        stage,
        humanFeedbackCount: humanFeedback.length,
        automatedQaFeedbackCount: automatedQaFeedback.length,
        legacyUnverifiedCount: legacyFeedback.length,
        matchCount,
        overrideCount,
        remainingForShadow: Math.max(
          0,
          SHADOW_MINIMUM_HUMAN_FEEDBACK - humanFeedback.length,
        ),
        shadowEligible,
        promotionEligible,
        rollbackEligible,
        priorityEffect,
        systemSuspended,
        persistedStage,
        version: persistedState?.version ?? 0,
        approvedAt: persistedState?.approvedAt ?? null,
        approvedBy: persistedState?.approvedBy ?? null,
        rolledBackAt: persistedState?.rolledBackAt ?? null,
        rolledBackBy: persistedState?.rolledBackBy ?? null,
        promotionBlocker,
      };
    })
    .sort((a, b) => {
      const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      if (a.humanFeedbackCount !== b.humanFeedbackCount) {
        return b.humanFeedbackCount - a.humanFeedbackCount;
      }
      return a.reasonCode.localeCompare(b.reasonCode, 'en');
    });

  const humanFeedbackCount = decisionRecords.filter(
    (record) => record.origin === FEEDBACK_ORIGINS.HUMAN_USER,
  ).length;
  const automatedQaFeedbackCount = decisionRecords.filter(
    (record) => record.origin === FEEDBACK_ORIGINS.AUTOMATED_QA,
  ).length;
  const legacyUnverifiedCount = decisionRecords.filter(
    (record) => record.origin === FEEDBACK_ORIGINS.LEGACY_UNVERIFIED,
  ).length;
  const shadowRuleCount = rules.filter((rule) => rule.stage === LEARNING_STAGES.SHADOW).length;
  const promotedRuleCount = rules.filter((rule) => rule.stage === LEARNING_STAGES.PROMOTED).length;
  const rolledBackRuleCount = rules.filter((rule) => rule.stage === LEARNING_STAGES.ROLLED_BACK).length;
  const topCandidateRule = rules.find((rule) => rule.stage === LEARNING_STAGES.CANDIDATE);

  return {
    schema: 'modu50m.feedback_learning_loop.v1',
    generatedAt: now.toISOString(),
    status:
      promotedRuleCount > 0
        ? 'PROMOTED_RULES_ACTIVE'
        : rolledBackRuleCount > 0
          ? 'ROLLED_BACK_RULES_PRESENT'
          : humanFeedbackCount === 0
            ? 'WAITING_FOR_HUMAN_FEEDBACK'
            : 'LEARNING_CANDIDATES_ACTIVE',
    metrics: {
      decisionRecordCount: decisionRecords.length,
      humanFeedbackCount,
      automatedQaFeedbackCount,
      legacyUnverifiedCount,
      humanOverrideCount: decisionRecords.filter(
        (record) =>
          record.origin === FEEDBACK_ORIGINS.HUMAN_USER &&
          ['partial', 'mismatch'].includes(record.aiAgreement),
      ).length,
      candidateRuleCount: rules.filter((rule) => rule.stage === LEARNING_STAGES.CANDIDATE).length,
      shadowRuleCount,
      promotedRuleCount,
      rolledBackRuleCount,
      falseAutoPassCount,
    },
    rules,
    guardrails: {
      automatedQaExcludedFromPromotion: true,
      legacyRecordsExcludedFromPromotion: true,
      minimumHumanFeedbackForShadow: SHADOW_MINIMUM_HUMAN_FEEDBACK,
      explicitSupervisorApprovalRequiredForPromotion: true,
      accessibilityRiskJudgmentRemainsHuman: true,
      finalSafetyDecisionAutomated: false,
      promotedRulesOnlyChangeHumanQueuePriority: true,
    },
    nextAction:
      promotedRuleCount > 0
        ? '승격 규칙이 바꾼 큐 순서를 재검증하고 불일치가 생기면 롤백합니다.'
        : rolledBackRuleCount > 0
          ? '롤백 원인과 원본 사람 판정을 대조한 뒤 다시 그림자 평가합니다.'
          : humanFeedbackCount === 0
        ? '사람 입력 경로에서 첫 판정을 저장해 규칙 후보 근거를 시작합니다.'
        : shadowRuleCount > 0
          ? '감독이 SHADOW 계산과 원본 사람 판정을 대조하고 큐 우선순위 반영 여부를 결정합니다.'
          : `${topCandidateRule?.label ?? '동일 유형'} 사람 판정 ${topCandidateRule?.remainingForShadow ?? SHADOW_MINIMUM_HUMAN_FEEDBACK}건을 더 수집합니다.`,
  };
}
