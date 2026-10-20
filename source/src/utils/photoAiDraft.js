import roadviewAiInference from '../data/roadviewAiInference.generated.js';
import { getBarrierLabel } from './scoring.js';

const APPROVED_PROVIDER = 'openai_responses';
const APPROVED_MODEL = 'gpt-5.6-sol';

const CONFIDENCE_LABELS = {
  high: '높음',
  medium: '중간',
  low: '낮음',
  unknown: '미정',
};

function isApprovedOnlineResult(result, candidate) {
  const evidence = candidate?.locationVerification?.placeMatchEvidence;
  const evidenceBindingValid = !evidence || (
    result?.input?.inputSha256 === evidence.imageSha256 &&
    result?.input?.placeId === evidence.placeId &&
    (!evidence.panoId || result?.input?.panoId === evidence.panoId)
  );

  return Boolean(
    result?.candidateId === candidate?.id &&
    evidenceBindingValid &&
    result?.status === 'PASS' &&
    result?.run?.provider === APPROVED_PROVIDER &&
    result?.run?.model === APPROVED_MODEL &&
    result?.run?.onlineRequired === true &&
    result?.run?.localFallbackUsed === false &&
    result?.inference?.needsHumanReview === true &&
    result?.humanEvidence?.humanVerified === false,
  );
}

function getStoredOnlineResult(candidate) {
  if (
    roadviewAiInference?.status !== 'PASS' ||
    roadviewAiInference?.provider?.type !== APPROVED_PROVIDER ||
    roadviewAiInference?.provider?.model !== APPROVED_MODEL ||
    roadviewAiInference?.provider?.onlineRequired !== true ||
    roadviewAiInference?.provider?.localFallbackEnabled !== false
  ) {
    return null;
  }
  const result = (roadviewAiInference.results ?? []).find((item) => item.candidateId === candidate.id);
  return isApprovedOnlineResult(result, candidate) ? result : null;
}

function buildOnlineDraft(result) {
  const inference = result.inference;
  const barrierType = inference.primaryBarrierType ?? 'unknown';
  const nextAction = inference.nextEvidenceAction;
  const humanCheckpoints = inference.humanCheckpoints ?? [];
  const limitations = inference.limitations ?? [];
  const confidenceKey = inference.confidence ?? 'unknown';
  const nextActionText = nextAction
    ? `다음 증거: ${nextAction.evidenceNeeded} · 확인: ${nextAction.verifier}`
    : '다음 증거 행동을 사람이 정해야 합니다.';

  return {
    available: true,
    isModelInference: true,
    analysisState: barrierType === 'unknown' ? 'abstained' : 'signal_only',
    attemptedCount: 1,
    successfulCount: 1,
    sourceLabel: '온라인 GPT-5.6 Sol 관찰 초안',
    score: null,
    metricLabel: '정성 관찰',
    confidenceKey,
    confidenceLabel: CONFIDENCE_LABELS[confidenceKey] ?? confidenceKey,
    barrierType,
    barrierLabel: getBarrierLabel(barrierType),
    summary:
      barrierType === 'unknown'
        ? '온라인 비전 AI가 보이는 신호를 기록했지만 장벽 유형은 판단 보류했습니다. 아래 다음 증거 행동을 사람이 수행해야 합니다.'
        : `온라인 비전 AI가 ${getBarrierLabel(barrierType)} 후보 신호를 관찰 초안으로 제시했습니다. 접근 가능 여부와 안전은 확정하지 않습니다.`,
    signals: inference.visibleEvidence ?? [],
    attentionRegions: inference.attentionRegions ?? [],
    humanCheckpoints,
    limitations,
    nextEvidenceAction: nextAction ?? null,
    limits: [...humanCheckpoints, ...limitations, nextActionText].slice(0, 5),
    scoreBasis: 'OpenAI Responses API 이미지 입력 · 엄격한 JSON Schema · 사람 최종 검수 필수',
    provenance: {
      provider: 'OpenAI Responses API',
      model: result.run.model,
      responseId: result.run.responseId ?? '',
      promptSha256: result.run.promptSha256 ?? roadviewAiInference.prompt?.sha256 ?? '',
      inputSha256: result.input?.inputSha256 ?? '',
      completedAt: result.run.completedAt ?? '',
      directionKey: result.input?.directionKey ?? '',
      onlineRequired: true,
      localFallbackUsed: false,
      candidateContextPassedToModel: result.input?.candidateContextPassedToModel ?? null,
      expectedBarrierPassedToModel: result.input?.expectedBarrierPassedToModel ?? null,
    },
  };
}

function buildOnlineRequiredDraft() {
  return {
    available: false,
    isModelInference: false,
    analysisState: 'not_run',
    attemptedCount: Number(roadviewAiInference?.summary?.attemptedCount ?? 0),
    successfulCount: Number(roadviewAiInference?.summary?.successfulCount ?? 0),
    sourceLabel: '온라인 분석 대기',
    score: null,
    metricLabel: '실행 안 함',
    confidenceKey: 'unknown',
    confidenceLabel: '미정',
    barrierType: 'unknown',
    barrierLabel: getBarrierLabel('unknown'),
    summary: '온라인 GPT-5.6 Sol 분석을 실행한 경우에만 AI 관찰 초안을 표시합니다. 오프라인·키 없음·응답 검증 실패 때는 분석하지 않습니다.',
    signals: [],
    attentionRegions: [],
    humanCheckpoints: [],
    limitations: [],
    nextEvidenceAction: null,
    limits: [
      '인터넷과 서버의 OPENAI_API_KEY가 모두 있어야 이미지 분석을 시작합니다.',
      '로컬 모델이나 규칙 점수를 로드뷰 이미지 분석 결과로 대신 사용하지 않습니다.',
      '온라인 분석이 성공해도 최종 접근 가능 여부와 안전은 사람이 판단합니다.',
    ],
    scoreBasis: '온라인 AI 성공 응답 전에는 결과 없음',
    provenance: null,
  };
}

export function getPhotoAiDraft(candidate, runtimeResult = null) {
  if (isApprovedOnlineResult(runtimeResult, candidate)) return buildOnlineDraft(runtimeResult);
  const storedResult = getStoredOnlineResult(candidate);
  return storedResult ? buildOnlineDraft(storedResult) : buildOnlineRequiredDraft();
}

function getImageAgeYears(directionAsset, referenceDate) {
  if (!directionAsset?.captureDate) return null;
  const capturedAt = new Date(directionAsset.captureDate);
  const comparedAt = referenceDate instanceof Date ? referenceDate : new Date(referenceDate ?? Date.now());
  if (Number.isNaN(capturedAt.getTime()) || Number.isNaN(comparedAt.getTime())) return null;
  return Math.max(0, (comparedAt.getTime() - capturedAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function getAiReviewGuidance(photoDraft, directionAsset = null, options = {}) {
  const reasons = [];
  const addReason = (reasonCode, title, detail) => reasons.push({ reasonCode, title, detail });

  if (!photoDraft?.available) {
    addReason(
      'APPROVED_ONLINE_RESULT_MISSING',
      '승인된 온라인 분석 결과가 아직 없어요',
      `현재 온라인 시도 ${photoDraft?.attemptedCount ?? 0}건 · 성공 ${photoDraft?.successfulCount ?? 0}건입니다. 오프라인 모델로 대신 판단하지 않습니다.`,
    );
  } else if (photoDraft.analysisState === 'abstained' || photoDraft.barrierType === 'unknown') {
    addReason(
      'MODEL_ABSTAINED',
      '보이는 신호만으로 장벽 종류를 확정하지 못했어요',
      '틀릴 가능성이 큰 답을 만들지 않고 판단보류로 사람에게 넘긴 상태입니다.',
    );
  } else {
    addReason(
      'FINAL_DECISION_RESERVED_FOR_HUMAN',
      'AI는 후보 신호까지만 제시했어요',
      '접근 가능 여부와 안전은 이동 보조기기, 현재 현장 상태와 실제 치수를 확인한 사람이 판단합니다.',
    );
  }

  const imageAgeYears = getImageAgeYears(directionAsset, options.referenceDate ?? new Date());
  if (imageAgeYears !== null && imageAgeYears > 2) {
    addReason(
      'STALE_STREETVIEW_IMAGE',
      '로드뷰 촬영 시점이 오래됐어요',
      `약 ${Math.floor(imageAgeYears)}년 전 사진이라 현재 공사·주차·노면 상태와 다를 수 있습니다.`,
    );
  }
  if (directionAsset?.spatialMarkersVerified !== true) {
    addReason(
      'DIRECTION_NOT_BARRIER_LOCATION',
      '후보 방향이 실제 장벽 위치로 확인된 것은 아니에요',
      '좌표, 주변 건물, 사진 속 위치가 같은 지점인지 사람이 먼저 맞춰야 합니다.',
    );
  }
  addReason(
    'SINGLE_IMAGE_GEOMETRY_LIMIT',
    '한 장의 사진에는 실제 치수와 깊이가 없어요',
    '턱 높이·유효 통과 폭·경사도는 기준자와 깊이 정보가 없는 거리뷰만으로 확정하지 않습니다.',
  );

  const modelActions = [
    ...(photoDraft?.humanCheckpoints ?? []),
    photoDraft?.nextEvidenceAction?.evidenceNeeded
      ? `${photoDraft.nextEvidenceAction.evidenceNeeded} · ${photoDraft.nextEvidenceAction.verifier ?? '사람 검수자'} 확인`
      : '',
  ].filter(Boolean);
  const defaultActions = [
    '카카오 로드뷰에서 같은 좌표를 다른 각도로 돌려 위치와 가림을 확인합니다.',
    '근거가 안 보이면 “더 확인할래요”를 선택하고 필요한 사진·현장 항목을 메모합니다.',
    '턱 높이·유효 폭·경사처럼 수치가 필요한 항목은 현장에서 측정하고 촬영 시각과 함께 저장합니다.',
  ];
  const nextActions = [...new Set([...modelActions, ...defaultActions])].slice(0, 3);

  return {
    stateKey: photoDraft?.analysisState ?? 'not_run',
    stateLabel: !photoDraft?.available
      ? '온라인 분석 전'
      : photoDraft.analysisState === 'abstained'
        ? 'AI 판단보류'
        : 'AI 후보 신호',
    summary: !photoDraft?.available
      ? 'AI가 틀린 답을 만든 것이 아니라, 승인된 온라인 분석이 실행되지 않아 결과를 만들지 않은 상태예요.'
      : photoDraft.summary,
    reasons: reasons.slice(0, 4),
    nextActions,
    cautions: [
      '사진에 안 보인다는 사실을 “장벽 없음”으로 바꾸지 않아요.',
      '로드뷰 촬영 당시 상태와 현재 현장 상태를 구분해요.',
      'AI 후보 신호와 사람의 최종 판단을 같은 기록으로 섞지 않아요.',
    ],
  };
}

export function getPhotoHumanComparison(photoDraft, review, candidate) {
  const humanBarrier = review?.barrierType ?? candidate.defaultBarrierType ?? 'unknown';
  const humanSeverity = review?.severity ?? 'unknown';
  const humanAgreement = review?.aiAgreement ?? 'unknown';
  const hasHumanDecision = Boolean(
    review?.status &&
    review.status !== 'unreviewed' &&
    humanSeverity !== 'unknown' &&
    humanAgreement !== 'unknown',
  );

  return {
    aiBarrierLabel: photoDraft.barrierLabel,
    humanBarrierLabel: hasHumanDecision ? getBarrierLabel(humanBarrier) : '검수 전',
    humanSeverity,
    humanAgreement,
    hasHumanDecision,
  };
}
