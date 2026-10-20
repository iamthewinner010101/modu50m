import { getPublicDataReferences, getRoadviewCapturePlan } from '../data/roadviewCapturePlan.js';
import {
  getAiAgreementLabel,
  getReviewStatus,
  getSeverityLabel,
  getStatusLabel,
  getValidationStatusLabel,
} from './report.js';
import { getPhotoAiDraft } from './photoAiDraft.js';
import { getBarrierLabel, scoreCandidate } from './scoring.js';
import { createEmptyHumanCompletion, getHumanCompletionSummary } from './humanCompletion.js';

export const SUBMISSION_TARGET = 12;
export const REVIEW_REQUIREMENT_TOTAL = 8;
export const SECOND_REVIEW_TARGET = 3;
export const FIELD_VERIFICATION_TARGET = 2;

const REVIEWED_STATUSES = new Set(['published', 'field_check_needed', 'rejected']);
const SOURCE_LABELS = {
  naverMap: '네이버',
  kakaoMap: '카카오 좌표 마커',
  kakaoRoadview: '카카오 360도 로드뷰',
  googleMap: '구글',
};

function hashEvidencePayload(value) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function getCandidateEvidenceVersion(candidate) {
  const location = candidate?.locationVerification ?? {};
  const capturePlan = getRoadviewCapturePlan(candidate);
  const roadviewAsset = capturePlan?.roadviewAsset ?? {};
  const payload = {
    schema: 'modu50m.candidate_evidence.v1',
    id: candidate?.id ?? '',
    name: candidate?.name ?? '',
    coordinate: [candidate?.lat ?? null, candidate?.lng ?? null],
    mapLinks: {
      kakaoMap: candidate?.reviewLinks?.kakaoMap ?? '',
      kakaoRoadview: candidate?.reviewLinks?.kakaoRoadview ?? '',
    },
    location: {
      status: location.status ?? '',
      coordinateContext: location.coordinateContext ?? '',
      reason: location.reason ?? '',
      requiredAction: location.requiredAction ?? '',
    },
    roadview: {
      status: capturePlan?.status ?? '',
      fileName: capturePlan?.fileName ?? '',
      image: capturePlan?.image ?? '',
      roadviewUrl: capturePlan?.roadviewUrl ?? '',
      panoId: roadviewAsset.panoId ?? '',
      captureDate: roadviewAsset.captureDate ?? '',
      targetDistanceMeters: roadviewAsset.targetDistanceMeters ?? null,
      freshnessStatus: capturePlan?.freshnessStatus ?? '',
      primaryDirectionKey: capturePlan?.primaryDirectionKey ?? '',
      spatialMarkersVerified: Boolean(capturePlan?.spatialMarkersVerified),
    },
  };

  return `ev1-${hashEvidencePayload(JSON.stringify(payload))}`;
}

function escapeTableCell(value) {
  return String(value ?? '')
    .replaceAll('|', '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSourceLabel(sourceChecks = {}) {
  const labels = Object.entries(SOURCE_LABELS)
    .filter(([key]) => sourceChecks[key])
    .map(([, label]) => label);

  return labels.length ? labels.join(' / ') : '확인 지도 미기록';
}

function hasSourceEvidence(sourceChecks = {}) {
  return Object.keys(SOURCE_LABELS).some((key) => sourceChecks[key]);
}

function hasFocusEvidence(focusChecks = {}) {
  return Object.values(focusChecks).some(Boolean);
}

function hasValidIsoDate(value, { allowFuture = true } = {}) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  return allowFuture || timestamp <= Date.now();
}

export function hasPrimaryHumanAttribution(review) {
  const evidence = review?.primaryReviewEvidence;
  return Boolean(
    evidence?.actorId &&
      evidence?.displayName &&
      evidence?.source === 'server_session_attribution' &&
      hasValidIsoDate(evidence?.reviewedAt, { allowFuture: false }),
  );
}

export function hasIndependentSecondReview(review) {
  const primary = review?.primaryReviewEvidence;
  const second = review?.secondReviewEvidence;
  return Boolean(
    hasPrimaryHumanAttribution(review) &&
      second?.actorId &&
      second.actorId !== primary.actorId &&
      second?.displayName &&
      ['confirmed', 'disputed'].includes(second?.decision) &&
      second?.memo?.trim().length >= 8 &&
      second?.source === 'server_session_attribution' &&
      hasValidIsoDate(second?.reviewedAt, { allowFuture: false }),
  );
}

export function hasFieldVerification(review) {
  const evidence = review?.fieldVerificationEvidence;
  return Boolean(
    evidence?.actorId &&
      evidence?.displayName &&
      ['barrier_confirmed', 'no_barrier', 'condition_changed'].includes(evidence?.outcome) &&
      evidence?.memo?.trim().length >= 8 &&
      evidence?.photoName &&
      /^data:image\/[a-z0-9.+-]+;base64,/i.test(evidence?.photoDataUrl ?? '') &&
      evidence.photoDataUrl.length <= 2_500_000 &&
      evidence?.source === 'server_session_attribution' &&
      hasValidIsoDate(evidence?.visitedAt, { allowFuture: false }) &&
      hasValidIsoDate(evidence?.recordedAt, { allowFuture: false }),
  );
}

function getFocusLabel(focusChecks = {}) {
  const checked = Object.entries(focusChecks)
    .filter(([, value]) => value)
    .map(([label]) => label);

  return checked.length ? checked.join(' / ') : '검수 항목 미체크';
}

function buildPhotoEvidence(candidate, review) {
  const reviewPhoto = candidate.reviewPhoto ?? {};
  const capturePlan = getRoadviewCapturePlan(candidate);
  const attachedPhoto = Boolean(review?.photoDataUrl);
  const points = reviewPhoto.points ?? capturePlan?.points ?? [];

  return {
    available: Boolean(attachedPhoto || capturePlan?.image || reviewPhoto.image),
    capturePlanned: Boolean(capturePlan),
    captureOrder: capturePlan?.order ?? null,
    captureFileName: capturePlan?.fileName ?? '',
    source: attachedPhoto ? 'student-attached-photo' : capturePlan?.aiDraft?.source ?? reviewPhoto.aiDraft?.source ?? 'candidate-roadview-link',
    imagePath: attachedPhoto ? null : capturePlan?.image ?? reviewPhoto.image ?? null,
    attachedPhotoIncluded: attachedPhoto,
    attachedPhotoName: review?.photoName ?? '',
    roadviewUrl: capturePlan?.roadviewUrl ?? reviewPhoto.roadviewUrl ?? candidate.reviewLinks?.kakaoRoadview ?? '',
    caption: attachedPhoto ? review?.photoName ?? '학생 첨부 사진' : capturePlan?.caption ?? reviewPhoto.caption ?? '',
    points: points.map((point, index) => ({
      number: index + 1,
      x: point.x,
      y: point.y,
      label: point.label ?? '',
      description: point.description ?? '',
    })),
  };
}

function buildAiDraftEvidence(candidate) {
  const photoAiDraft = getPhotoAiDraft(candidate);

  return {
    available: photoAiDraft.available,
    sourceLabel: photoAiDraft.sourceLabel,
    score: photoAiDraft.score,
    metricLabel: photoAiDraft.metricLabel,
    scoreBasis: photoAiDraft.scoreBasis,
    barrierType: photoAiDraft.barrierType ?? candidate.reviewPhoto?.aiDraft?.barrierType ?? candidate.defaultBarrierType ?? 'unknown',
    barrierLabel: photoAiDraft.barrierLabel,
    confidenceLabel: photoAiDraft.confidenceLabel,
    signals: photoAiDraft.signals,
    humanCheckpoints: photoAiDraft.humanCheckpoints ?? [],
    limits: photoAiDraft.limits,
    summary: photoAiDraft.summary,
    provenance: photoAiDraft.provenance,
  };
}

function buildHumanReviewEvidence(candidate, review) {
  const status = getReviewStatus(candidate, review);
  const barrierType = review?.barrierType ?? candidate.defaultBarrierType ?? 'unknown';
  const severity = review?.severity ?? 'unknown';
  const aiAgreement = review?.aiAgreement ?? 'unknown';
  const validationStatus = review?.validationStatus ?? 'not_started';

  return {
    status,
    statusLabel: getStatusLabel(status),
    barrierType,
    barrierLabel: getBarrierLabel(barrierType),
    severity,
    severityLabel: getSeverityLabel(severity),
    sourceChecks: review?.sourceChecks ?? {},
    focusChecks: review?.focusChecks ?? {},
    stepChecks: review?.stepChecks ?? {},
    memo: review?.memo ?? '',
    updatedAt: review?.updatedAt ?? '',
    aiAgreement,
    aiAgreementLabel: getAiAgreementLabel(aiAgreement),
    validationStatus,
    validationStatusLabel: getValidationStatusLabel(validationStatus),
    evidenceVersion: review?.evidenceVersion ?? '',
    currentEvidenceVersion: getCandidateEvidenceVersion(candidate),
    primaryReviewEvidence: review?.primaryReviewEvidence ?? null,
    secondReviewEvidence: review?.secondReviewEvidence ?? null,
    fieldVerificationEvidence: review?.fieldVerificationEvidence ?? null,
  };
}

function buildReviewEvidenceRecord(candidate, review) {
  const requirementState = getReviewRequirementState(candidate, review);
  const humanReview = buildHumanReviewEvidence(candidate, review);

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    facilityType: candidate.facilityType,
    last50mNote: candidate.last50mNote,
    publicDataReferences: getPublicDataReferences(candidate),
    photoEvidence: buildPhotoEvidence(candidate, review),
    aiDraft: buildAiDraftEvidence(candidate),
    humanReview,
    agreementStatus: {
      value: humanReview.aiAgreement,
      label: humanReview.aiAgreementLabel,
      hasHumanDecision: requirementState.hasSeverityLabel && requirementState.hasAiAgreementLabel,
    },
    verificationLimit: {
      requiresHumanReview: true,
      reason:
        candidate.aiLimitReason ??
        '지도와 거리사진만으로 실제 이동 가능 여부를 확정할 수 없어 사람이 라벨링 검수해야 합니다.',
      missingRequirements: requirementState.missingRequirements,
    },
    evidenceVersion: {
      stored: requirementState.storedEvidenceVersion,
      current: requirementState.currentEvidenceVersion,
      tracked: requirementState.evidenceVersionTracked,
      currentMatch: requirementState.evidenceCurrent,
    },
  };
}

export function getReviewRequirementState(candidate, review) {
  const status = getReviewStatus(candidate, review);
  const directReviewed = Boolean(review?.updatedAt) && REVIEWED_STATUSES.has(status);
  const hasTargetPointCheck = Boolean(review?.stepChecks?.targetPoint);
  const hasFocusCheck = hasFocusEvidence(review?.focusChecks);
  const hasComparisonMemo = Boolean(review?.memo?.trim());
  const hasMapSource = hasSourceEvidence(review?.sourceChecks);
  const hasSeverityLabel = Boolean(review?.severity && review.severity !== 'unknown');
  const hasAiAgreementLabel = Boolean(review?.aiAgreement && review.aiAgreement !== 'unknown');
  const hasValidationState = Boolean(review?.validationStatus && review.validationStatus !== 'not_started');
  const currentEvidenceVersion = getCandidateEvidenceVersion(candidate);
  const storedEvidenceVersion = review?.evidenceVersion ?? '';
  const evidenceVersionTracked = Boolean(storedEvidenceVersion);
  const evidenceCurrent = !evidenceVersionTracked || storedEvidenceVersion === currentEvidenceVersion;
  const hasPrimaryAttribution = hasPrimaryHumanAttribution(review);
  const hasIndependentSecondReviewEvidence = hasIndependentSecondReview(review);
  const hasFieldVerificationEvidence = hasFieldVerification(review);
  const missingRequirements = [];

  if (!hasTargetPointCheck) missingRequirements.push('지도 기준점 확인');
  if (!hasFocusCheck) missingRequirements.push('검수 항목 체크');
  if (!directReviewed) missingRequirements.push('검수 상태 저장');
  if (!hasSeverityLabel) missingRequirements.push('심각도 라벨 저장');
  if (!hasAiAgreementLabel) missingRequirements.push('AI-사람 비교 라벨 저장');
  if (!hasValidationState) missingRequirements.push('후속 검수 필요도 저장');
  if (!hasMapSource) missingRequirements.push('확인 지도 체크');
  if (!hasComparisonMemo) missingRequirements.push('메모 작성');
  if (!evidenceCurrent) missingRequirements.push('근거 변경 후 재검수');
  const missingRequirementCount = missingRequirements.length;
  const studentRequirementMissingCount = missingRequirementCount - (evidenceCurrent ? 0 : 1);
  const metRequirementCount = REVIEW_REQUIREMENT_TOTAL - studentRequirementMissingCount;

  return {
    status,
    directReviewed,
    hasTargetPointCheck,
    hasFocusCheck,
    hasComparisonMemo,
    hasSeverityLabel,
    hasAiAgreementLabel,
    hasValidationState,
    hasSourceEvidence: hasMapSource,
    currentEvidenceVersion,
    storedEvidenceVersion,
    evidenceVersionTracked,
    evidenceCurrent,
    hasPrimaryAttribution,
    hasIndependentSecondReview: hasIndependentSecondReviewEvidence,
    hasFieldVerification: hasFieldVerificationEvidence,
    ready:
      hasTargetPointCheck &&
      hasFocusCheck &&
      directReviewed &&
      hasSeverityLabel &&
      hasAiAgreementLabel &&
      hasValidationState &&
      hasComparisonMemo &&
      hasMapSource &&
      evidenceCurrent,
    metRequirementCount,
    missingRequirementCount,
    totalRequirementCount: REVIEW_REQUIREMENT_TOTAL,
    missingRequirements,
    missingLabel: missingRequirements.join(', '),
  };
}

export function getEvidenceRows(candidates, reviews) {
  return candidates
    .map((candidate) => {
      const review = reviews[candidate.id];
      const requirementState = getReviewRequirementState(candidate, review);
      const status = requirementState.status;
      const score = scoreCandidate(candidate);
      const aiBarrierType = candidate.defaultBarrierType ?? 'unknown';
      const reviewBarrierType = review?.barrierType ?? aiBarrierType;
      const severity = review?.severity ?? 'unknown';
      const aiAgreement = review?.aiAgreement ?? 'unknown';
      const validationStatus = review?.validationStatus ?? 'not_started';
      const photoAiDraft = getPhotoAiDraft(candidate);

      return {
        candidate,
        review,
        status,
        score,
        photoAiDraftScore: photoAiDraft.score,
        photoAiDraftMetricLabel: photoAiDraft.metricLabel,
        photoAiDraftLabel: photoAiDraft.barrierLabel,
        photoAiDraftAvailable: photoAiDraft.available,
        aiBarrierLabel: getBarrierLabel(aiBarrierType),
        reviewBarrierLabel: getBarrierLabel(reviewBarrierType),
        severityLabel: getSeverityLabel(severity),
        aiAgreementLabel: getAiAgreementLabel(aiAgreement),
        validationStatusLabel: getValidationStatusLabel(validationStatus),
        statusLabel: getStatusLabel(status),
        sourceLabel: getSourceLabel(review?.sourceChecks),
        focusLabel: getFocusLabel(review?.focusChecks),
        hasSourceEvidence: requirementState.hasSourceEvidence,
        hasTargetPointCheck: requirementState.hasTargetPointCheck,
        hasFocusCheck: requirementState.hasFocusCheck,
        hasSeverityLabel: requirementState.hasSeverityLabel,
        hasAiAgreementLabel: requirementState.hasAiAgreementLabel,
        hasValidationState: requirementState.hasValidationState,
        directReviewed: requirementState.directReviewed,
        hasComparisonMemo: requirementState.hasComparisonMemo,
        evidenceVersionTracked: requirementState.evidenceVersionTracked,
        evidenceCurrent: requirementState.evidenceCurrent,
        hasPrimaryAttribution: requirementState.hasPrimaryAttribution,
        hasIndependentSecondReview: requirementState.hasIndependentSecondReview,
        hasFieldVerification: requirementState.hasFieldVerification,
        currentEvidenceVersion: requirementState.currentEvidenceVersion,
        storedEvidenceVersion: requirementState.storedEvidenceVersion,
        reviewReady: requirementState.ready,
        missingRequirements: requirementState.missingRequirements,
      };
    })
    .filter((row) => row.directReviewed);
}

export function getEvidenceSummary(evidenceRows) {
  const directReviewCount = evidenceRows.length;
  const targetPointCount = evidenceRows.filter((row) => row.hasTargetPointCheck).length;
  const focusCheckCount = evidenceRows.filter((row) => row.hasFocusCheck).length;
  const severityLabelCount = evidenceRows.filter((row) => row.hasSeverityLabel).length;
  const aiAgreementLabelCount = evidenceRows.filter((row) => row.hasAiAgreementLabel).length;
  const validationStateCount = evidenceRows.filter((row) => row.hasValidationState).length;
  const comparisonCount = evidenceRows.filter((row) => row.hasComparisonMemo).length;
  const sourceEvidenceCount = evidenceRows.filter((row) => row.hasSourceEvidence).length;
  const currentEvidenceCount = evidenceRows.filter((row) => row.evidenceCurrent).length;
  const primaryAttributionCount = evidenceRows.filter((row) => row.hasPrimaryAttribution).length;
  const independentSecondReviewCount = evidenceRows.filter((row) => row.hasIndependentSecondReview).length;
  const fieldVerificationCount = evidenceRows.filter((row) => row.hasFieldVerification).length;
  const directEvidenceReady =
    directReviewCount >= SUBMISSION_TARGET &&
    targetPointCount >= SUBMISSION_TARGET &&
    focusCheckCount >= SUBMISSION_TARGET &&
    severityLabelCount >= SUBMISSION_TARGET &&
    aiAgreementLabelCount >= SUBMISSION_TARGET &&
    validationStateCount >= SUBMISSION_TARGET &&
    comparisonCount >= SUBMISSION_TARGET &&
    sourceEvidenceCount >= SUBMISSION_TARGET &&
    currentEvidenceCount >= SUBMISSION_TARGET &&
    primaryAttributionCount >= SUBMISSION_TARGET;

  return {
    directReviewCount,
    targetPointCount,
    focusCheckCount,
    severityLabelCount,
    aiAgreementLabelCount,
    validationStateCount,
    comparisonCount,
    sourceEvidenceCount,
    currentEvidenceCount,
    primaryAttributionCount,
    independentSecondReviewCount,
    fieldVerificationCount,
    directEvidenceReady,
    ready:
      directEvidenceReady &&
      independentSecondReviewCount >= SECOND_REVIEW_TARGET &&
      fieldVerificationCount >= FIELD_VERIFICATION_TARGET,
  };
}

export function getReviewQueue(candidates, reviews, limit = 4) {
  return candidates
    .map((candidate) => {
      const review = reviews[candidate.id];
      const requirementState = getReviewRequirementState(candidate, review);

      return {
        candidate,
        score: scoreCandidate(candidate),
        barrierLabel: getBarrierLabel(candidate.defaultBarrierType ?? 'unknown'),
        queueType: requirementState.directReviewed ? '보강 필요' : '미검수',
        missingLabel: requirementState.missingLabel,
        metRequirementCount: requirementState.metRequirementCount,
        missingRequirementCount: requirementState.missingRequirementCount,
        totalRequirementCount: requirementState.totalRequirementCount,
        reviewReady: requirementState.ready,
        evidenceVersionTracked: requirementState.evidenceVersionTracked,
        evidenceCurrent: requirementState.evidenceCurrent,
      };
    })
    .filter((row) => !row.reviewReady)
    .sort((a, b) => {
      if (a.queueType !== b.queueType) return a.queueType === '보강 필요' ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, limit);
}

export function getDirectorStatusLanes(candidates, reviews) {
  const lanes = {
    fieldCheckNeeded: {
      key: 'fieldCheckNeeded',
      label: '현장 확인 필요',
      actionLabel: '현장 확인 후보 열기',
      rows: [],
    },
    repairNeeded: {
      key: 'repairNeeded',
      label: '보강 필요',
      actionLabel: '보강 후보 열기',
      rows: [],
    },
    completed: {
      key: 'completed',
      label: '검수 완료',
      actionLabel: '완료 후보 다시 보기',
      rows: [],
    },
    unreviewed: {
      key: 'unreviewed',
      label: '미검수',
      actionLabel: '첫 검수 시작',
      rows: [],
    },
  };

  for (const candidate of candidates) {
    const review = reviews[candidate.id];
    const requirementState = getReviewRequirementState(candidate, review);
    const row = {
      candidate,
      review,
      status: requirementState.status,
      statusLabel: getStatusLabel(requirementState.status),
      score: scoreCandidate(candidate),
      barrierLabel: getBarrierLabel(candidate.defaultBarrierType ?? 'unknown'),
      missingLabel: requirementState.missingLabel,
      metRequirementCount: requirementState.metRequirementCount,
      missingRequirementCount: requirementState.missingRequirementCount,
      totalRequirementCount: requirementState.totalRequirementCount,
      reviewReady: requirementState.ready,
      evidenceVersionTracked: requirementState.evidenceVersionTracked,
      evidenceCurrent: requirementState.evidenceCurrent,
    };

    if (!requirementState.directReviewed) {
      lanes.unreviewed.rows.push(row);
    } else if (requirementState.status === 'field_check_needed') {
      lanes.fieldCheckNeeded.rows.push(row);
    } else if (!requirementState.ready) {
      lanes.repairNeeded.rows.push(row);
    } else {
      lanes.completed.rows.push(row);
    }
  }

  for (const lane of Object.values(lanes)) {
    lane.rows.sort((a, b) => {
      if (a.missingRequirementCount !== b.missingRequirementCount) {
        return b.missingRequirementCount - a.missingRequirementCount;
      }
      return b.score - a.score;
    });
    lane.count = lane.rows.length;
    lane.firstCandidate = lane.rows[0]?.candidate ?? null;
  }

  return lanes;
}

export function buildSubmissionEvidenceMarkdown(evidenceRows) {
  const {
    directReviewCount,
    severityLabelCount,
    aiAgreementLabelCount,
    validationStateCount,
    comparisonCount,
    sourceEvidenceCount,
    currentEvidenceCount,
    primaryAttributionCount,
    independentSecondReviewCount,
    fieldVerificationCount,
  } = getEvidenceSummary(evidenceRows);

  const reviewRows = evidenceRows
    .map(({ candidate, review, score, photoAiDraftScore, photoAiDraftMetricLabel, photoAiDraftLabel, aiBarrierLabel, reviewBarrierLabel, severityLabel, aiAgreementLabel, validationStatusLabel, statusLabel, sourceLabel, focusLabel, missingRequirements }, index) => {
      const missingLabel = missingRequirements.length ? missingRequirements.join(', ') : '완료';
      const photoScoreLabel = photoAiDraftMetricLabel
        ? `${photoAiDraftMetricLabel} / ${photoAiDraftLabel}`
        : photoAiDraftScore === null
          ? '사진 초안 없음'
          : `${photoAiDraftScore}점 / ${photoAiDraftLabel}`;

      return [
        index + 1,
        candidate.id,
        candidate.name,
        sourceLabel,
        `${score}점`,
        photoScoreLabel,
        aiBarrierLabel,
        statusLabel,
        reviewBarrierLabel,
        severityLabel,
        aiAgreementLabel,
        validationStatusLabel,
        focusLabel,
        missingLabel,
        review?.memo || '',
      ]
        .map(escapeTableCell)
        .join(' | ');
    })
    .map((row) => `| ${row} |`)
    .join('\n');

  const comparisonRows = evidenceRows
    .filter((row) => row.hasComparisonMemo)
    .map(({ candidate, review, score, aiBarrierLabel, reviewBarrierLabel, severityLabel, aiAgreementLabel, validationStatusLabel, statusLabel }, index) =>
      [
        index + 1,
        candidate.id,
        `AI ${score}점 / ${aiBarrierLabel}`,
        `${statusLabel} / ${reviewBarrierLabel} / ${severityLabel} / ${aiAgreementLabel} / ${validationStatusLabel}`,
        review?.memo || '',
      ]
        .map(escapeTableCell)
        .join(' | '),
    )
    .map((row) => `| ${row} |`)
    .join('\n');

  return `# 모두의 50m 제출 검수 기록

- 직접 검수 기록: ${directReviewCount}개
- 지도 기준점 확인: ${evidenceRows.filter((row) => row.hasTargetPointCheck).length}개
- 검수 항목 체크: ${evidenceRows.filter((row) => row.hasFocusCheck).length}개
- 심각도 라벨 기록: ${severityLabelCount}개
- AI-사람 비교 라벨 기록: ${aiAgreementLabelCount}개
- 후속 검수 필요도 기록: ${validationStateCount}개
- 전/후 비교 메모: ${comparisonCount}개
- 지도 근거 기록: ${sourceEvidenceCount}개
- 현재 근거 버전 일치: ${currentEvidenceCount}개
- 서버가 기록한 1차 검수자: ${primaryAttributionCount}개
- 독립 2차 검수: ${independentSecondReviewCount}/${SECOND_REVIEW_TARGET}개
- 현장 사진 포함 확인: ${fieldVerificationCount}/${FIELD_VERIFICATION_TARGET}개
- 제출 기준: ${SUBMISSION_TARGET}개 이상

## 태윤이 직접 검수 후보

| 번호 | 후보 ID | 후보명 | 확인 지도 | 규칙 우선순위 | 실제 비전 AI 초안 | 규칙 예상 장벽 | 사람 라벨 상태 | 확인 장벽 | 심각도 | AI-사람 비교 | 후속 검수 필요도 | 직접 확인한 항목 | 부족한 조건 | 태윤이 메모 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${reviewRows || '|  |  | 검수 기록 대기 |  |  |  |  |  |  |  |  |  |  |  |  |'}

## 검수 전/후 비교

| 번호 | 후보 ID | 검수 전 규칙 판단 | 검수 후 사람 라벨 | 달라진 이유 |
| --- | --- | --- | --- | --- |
${comparisonRows || '|  |  | 검수 기록 대기 |  |  |'}
`;
}

export function buildPresentationEvidenceMarkdown(evidenceRows) {
  const {
    directReviewCount,
    severityLabelCount,
    aiAgreementLabelCount,
    validationStateCount,
    comparisonCount,
    sourceEvidenceCount,
    currentEvidenceCount,
    primaryAttributionCount,
    independentSecondReviewCount,
    fieldVerificationCount,
  } = getEvidenceSummary(evidenceRows);
  const topRows = evidenceRows
    .slice(0, 3)
    .map(({ candidate, score, aiBarrierLabel, reviewBarrierLabel, severityLabel, aiAgreementLabel, validationStatusLabel, sourceLabel, focusLabel, review }, index) => {
      const memo = review?.memo?.trim() || '검수 메모 대기';
      return `${index + 1}. ${candidate.name}: AI ${score}점/${aiBarrierLabel} -> 사람 ${reviewBarrierLabel}/${severityLabel}/${aiAgreementLabel}/${validationStatusLabel}. 확인 지도: ${sourceLabel}. 확인 항목: ${focusLabel}. 메모: ${memo}`;
    })
    .join('\n');
  const reviewSummary = getEvidenceSummary(evidenceRows);
  const blockerLine = reviewSummary.ready
    ? '직접 검수, 서버 귀속, 독립 2차 검수, 현장 사진 확인 기준에 도달했습니다. 제출 전 검수 JSON import 검증이 필요합니다.'
    : `사람 증거가 직접 검수 ${directReviewCount}/${SUBMISSION_TARGET}, 서버 귀속 ${primaryAttributionCount}/${SUBMISSION_TARGET}, 독립 2차 검수 ${independentSecondReviewCount}/${SECOND_REVIEW_TARGET}, 현장 확인 ${fieldVerificationCount}/${FIELD_VERIFICATION_TARGET}라서 아직 최종 제출 PASS가 아닙니다.`;

  return `# 모두의 50m PPT 발표 근거 원고

## 슬라이드 1. 문제
- 생활시설 앞 마지막 50m에서 턱, 경사, 좁은 보도, 입구 단차 같은 이동장벽을 사람이 놓치기 쉽습니다.
- 이 앱은 길찾기 앱이 아니라, 검수 후보를 줄이고 사람이 직접 판단한 접근성 데이터를 쌓는 운영 프로그램입니다.

## 슬라이드 2. 운영 흐름
- AI 후보 추천 -> 감독 검수 큐 -> 카카오/네이버/구글 지도 확인 -> 사람 라벨 저장 -> JSON/마크다운/PPT 근거 export.
- 감독은 첫 화면에서 오늘 우선 후보를 보고, 검수 화면에서 카카오 좌표 마커와 360도 로드뷰를 따로 판단합니다.

## 슬라이드 3. 현재 검수 증거 수
- 직접 검수 기록: ${directReviewCount}/${SUBMISSION_TARGET}
- 심각도 라벨: ${severityLabelCount}/${SUBMISSION_TARGET}
- AI-사람 비교 라벨: ${aiAgreementLabelCount}/${SUBMISSION_TARGET}
- 후속 검수 필요도: ${validationStateCount}/${SUBMISSION_TARGET}
- 전/후 비교 메모: ${comparisonCount}/${SUBMISSION_TARGET}
- 지도 근거 기록: ${sourceEvidenceCount}/${SUBMISSION_TARGET}
- 현재 근거 버전 일치: ${currentEvidenceCount}/${SUBMISSION_TARGET}
- 서버가 기록한 1차 검수자: ${primaryAttributionCount}/${SUBMISSION_TARGET}
- 독립 2차 검수: ${independentSecondReviewCount}/${SECOND_REVIEW_TARGET}
- 현장 사진 포함 확인: ${fieldVerificationCount}/${FIELD_VERIFICATION_TARGET}

## 슬라이드 4. 대표 후보 근거
${topRows || '- 아직 저장된 검수 기록이 없습니다. 감독 검수 화면에서 후보를 저장하면 이 슬라이드가 채워집니다.'}

## 슬라이드 5. 검증 상태
- 자동 검증은 앱 구조, 브라우저 검수 흐름, JSON/마크다운 export, 학생 증거 import 경로를 확인합니다.
- ${blockerLine}

## 슬라이드 6. 다음 수업 행동
- 태윤이가 12개 후보를 직접 검수합니다.
- 검수 JSON을 다운로드하고 npm run import:evidence -- "<downloaded-json-path>" --apply를 실행합니다.
- npm run validate:submission으로 제출 증거를 다시 확인합니다.
`;
}

export function buildStudentReviewEvidenceJson(candidates, reviews, humanCompletion = createEmptyHumanCompletion()) {
  const evidenceRows = getEvidenceRows(candidates, reviews);
  const evidenceSummary = getEvidenceSummary(evidenceRows);
  const humanCompletionSummary = getHumanCompletionSummary(humanCompletion);

  return JSON.stringify(
    {
      schema: 'student-review-evidence.v1',
      student: '허태윤',
      source: 'app-localStorage-export',
      note: '수업 후 이 내용을 docs/student-review-evidence.v1.json에 옮긴 뒤 npm run validate:submission을 실행합니다.',
      target: SUBMISSION_TARGET,
      exportedAt: new Date().toISOString(),
      evidenceSummary,
      humanCompletion,
      humanCompletionSummary,
      reviews,
      reviewEvidence: candidates.map((candidate) => buildReviewEvidenceRecord(candidate, reviews[candidate.id])),
    },
    null,
    2,
  );
}
