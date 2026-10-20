import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { getReviewQueue } from '../utils/evidence';
import { getCoordinateLabel, getRoadviewCoordinateLabel } from '../utils/mapLinks';
import { getBarrierLabel, getInspectionPlan } from '../utils/scoring';
import PhotoLabelPanel from './PhotoLabelPanel';
import LocationVerificationCard from './LocationVerificationCard';
import SupplementalHumanEvidencePanel from './SupplementalHumanEvidencePanel';

const STATUS_OPTIONS = [
  { value: 'unreviewed', label: '검수 전' },
  { value: 'field_check_needed', label: '현장 확인 필요' },
  { value: 'published', label: '검수 완료' },
  { value: 'rejected', label: '후보 제외' },
];

const BARRIER_OPTIONS = [
  'curb',
  'slope',
  'narrow_sidewalk',
  'crossing',
  'entrance_step',
  'surface',
  'none',
  'unknown',
];

const SEVERITY_OPTIONS = [
  { value: 'unknown', label: '라벨 미정' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '높음' },
  { value: 'field_check_needed', label: '현장 확인 필요' },
];

const AI_AGREEMENT_OPTIONS = [
  { value: 'unknown', label: '비교 미정' },
  { value: 'match', label: '일치' },
  { value: 'partial', label: '부분 일치' },
  { value: 'mismatch', label: '불일치' },
  { value: 'hold', label: '판단 보류' },
];

const SEVERITY_GUIDE = [
  { value: 'low', label: '낮음', description: '이동은 가능하지만 조심해서 확인해야 하는 정도' },
  { value: 'medium', label: '중간', description: '보조자 도움이나 우회 확인이 필요할 수 있는 정도' },
  { value: 'high', label: '높음', description: '혼자 이동하기 어렵거나 우회가 필요해 보이는 정도' },
  { value: 'field_check_needed', label: '현장 확인 필요', description: '로드뷰 각도나 사진 시점 때문에 확정하기 어려운 경우' },
];

const AI_AGREEMENT_GUIDE = [
  { value: 'match', label: '일치', description: 'AI 예상 장벽과 사람이 확인한 장벽 유형이 같을 때' },
  { value: 'partial', label: '부분 일치', description: 'AI 예상 장벽도 보이지만 다른 장벽도 함께 중요할 때' },
  { value: 'mismatch', label: '불일치', description: 'AI 예상과 다른 장벽이 더 중요하거나 후보가 아니라고 볼 때' },
  { value: 'hold', label: '판단 보류', description: '지도나 로드뷰만으로 확정하기 어려워 현장 확인이 필요할 때' },
];

const SOURCE_OPTIONS = [
  { key: 'naverMap', label: '네이버 지도' },
  { key: 'kakaoMap', label: '카카오 좌표 마커' },
  { key: 'kakaoRoadview', label: '카카오 360도 로드뷰' },
  { key: 'googleMap', label: '구글 지도' },
];

const SOURCE_DECISION_GUIDE = [
  {
    key: 'naverMap',
    when: '후보 주소, 교차로 이름, 마지막 50m 기준점이 맞을 때',
    caution: '장벽 장면을 본 것이 아니라면 지도 위치 확인으로만 기록',
  },
  {
    key: 'kakaoMap',
    when: '카카오 좌표 마커가 후보 건물, 횡단보도, 입구와 맞을 때',
    caution: '좌표만 맞고 장벽 사진을 못 봤으면 로드뷰는 아직 체크하지 않음',
  },
  {
    key: 'kakaoRoadview',
    when: '360도 사진에서 턱, 경사, 보도 폭, 입구 단차 중 하나 이상을 봤을 때',
    caution: '다른 도로 시점이면 체크하지 않고 메모에 위치 불일치 기록',
  },
  {
    key: 'googleMap',
    when: '네이버/카카오와 같은 위치인지 보조 확인했을 때',
    caution: '구글만 보고 확정하지 말고 다른 지도 또는 현장 확인 필요 여부 기록',
  },
];

const VALIDATION_OPTIONS = [
  { value: 'not_started', label: '후속 검수 기록 전' },
  { value: 'single_review', label: '1차 검수 완료' },
  { value: 'needs_second_review', label: '독립 검수 필요' },
  { value: 'confirmed', label: '독립 검수 확인 완료' },
  { value: 'disputed', label: '독립 검수 판정 불일치' },
  { value: 'not_visible', label: '로드뷰에서 안 보임' },
];

const MISSION_LEVELS = {
  high: {
    label: '긴급 미션',
    title: '혼자 지나가기 어려운 마지막 50m인지 판정하기',
    tone: 'high',
  },
  medium: {
    label: '집중 미션',
    title: '도움이나 우회가 필요한 길인지 확인하기',
    tone: 'medium',
  },
  low: {
    label: '기본 미션',
    title: 'AI 후보가 실제 장벽인지 차분히 확인하기',
    tone: 'low',
  },
};

function getSeverityOptionLabel(value) {
  return SEVERITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getStatusOptionLabel(value) {
  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getAiAgreementOptionLabel(value) {
  return AI_AGREEMENT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getValidationOptionLabel(value) {
  return VALIDATION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getSuggestedSeverity(status, barrierType, riskKey) {
  if (status === 'field_check_needed' || barrierType === 'unknown') return 'field_check_needed';
  if (status === 'rejected' || barrierType === 'none') return 'low';
  if (riskKey === 'high') return 'high';
  if (riskKey === 'medium') return 'medium';
  return 'low';
}

function getSuggestedAiAgreement(status, aiBarrierType, humanBarrierType) {
  if (status === 'field_check_needed' || humanBarrierType === 'unknown') return 'hold';
  if (status === 'rejected' || humanBarrierType === 'none') return 'mismatch';
  return humanBarrierType === aiBarrierType ? 'match' : 'mismatch';
}

function buildMissionPlan(candidate, inspectionPlan, aiBarrierType, focusItems) {
  const level = MISSION_LEVELS[inspectionPlan.risk.key] ?? MISSION_LEVELS.low;
  const barrierLabel = getBarrierLabel(aiBarrierType);
  const primaryFocus = focusItems[0] ?? '지도 기준점과 로드뷰 장면';
  const facilityType = candidate.facilityType ?? '생활시설';

  return {
    ...level,
    question: `${facilityType} 앞 마지막 50m에서 ${barrierLabel} 때문에 혼자 이동하기 어려울까요?`,
    answer: `AI는 ${barrierLabel} 후보를 먼저 골랐습니다. 사람 검수자는 '${primaryFocus}' 항목을 보고 실제 장벽인지, 사진 시점 때문에 보류해야 하는지 판정합니다.`,
    clearConditions: [
      '지도 기준점과 마지막 50m 원을 확인',
      '로드뷰에서 핵심 장면 1개 이상 확인',
      '심각도 1개와 AI-사람 비교 라벨 저장',
    ],
  };
}

function buildDirectorDecisionState({
  reviewReady,
  currentStatus,
  currentSeverity,
  currentAiAgreement,
  currentValidationStatus,
  hasSourceCheck,
  missingRequirements,
}) {
  if (reviewReady) {
    return {
      key: 'complete',
      label: '검수 완료',
      nextAction: '제출 자료 탭에서 JSON/마크다운 반영을 확인합니다.',
    };
  }

  if (currentStatus === 'field_check_needed') {
    return {
      key: 'field-check',
      label: '현장 확인 필요',
      nextAction:
        '태윤: 확인한 지도와 추가로 필요한 사진 각도를 메모 → 다른 계정: 독립 2차 검수 → 방문자: 방문 시각·현장 사진·결과 저장',
    };
  }

  if (!hasSourceCheck) {
    return {
      key: 'needs-source',
      label: '지도 근거 대기',
      nextAction: '네이버, 카카오 좌표, 카카오 360도 로드뷰, 구글 중 실제로 확인한 지도를 체크합니다.',
    };
  }

  if (
    currentSeverity === 'unknown' ||
    currentAiAgreement === 'unknown' ||
    currentValidationStatus === 'not_started'
  ) {
    return {
      key: 'needs-label',
      label: '라벨 저장 대기',
      nextAction: '심각도, AI-사람 비교, 후속 검수 필요도를 저장합니다.',
    };
  }

  return {
    key: 'repair',
    label: '보강 필요',
    nextAction: missingRequirements[0]
      ? `${missingRequirements[0]}을 먼저 완료합니다.`
      : '빠진 조건을 하나씩 채워 검수 기록 조건을 완료합니다.',
  };
}

export default function ReviewPanel({
  candidate,
  candidates = [],
  review,
  reviews = {},
  report,
  onChangeReview,
  onReviewCandidate,
  onOpenReport,
  onOpenEvidence,
  actor,
  onSubmitSecondReview,
  onSubmitFieldVerification,
  roadviewVisionRun,
  onAnalyzeRoadview,
}) {
  if (!candidate) return null;

  const currentStatus = review?.status ?? 'unreviewed';
  const currentBarrier = review?.barrierType ?? candidate.defaultBarrierType ?? 'unknown';
  const currentSeverity = review?.severity ?? 'unknown';
  const currentAiAgreement = review?.aiAgreement ?? 'unknown';
  const currentValidationStatus = review?.validationStatus ?? 'not_started';
  const currentMemo = review?.memo ?? '';
  const currentSourceChecks = review?.sourceChecks ?? {};
  const currentStepChecks = review?.stepChecks ?? {};
  const currentFocusChecks = review?.focusChecks ?? {};
  const inspectionPlan = getInspectionPlan(candidate);
  const capturePlan = getRoadviewCapturePlan(candidate);
  const aiBarrierType = candidate.defaultBarrierType ?? 'unknown';
  const suggestedSeverity = getSuggestedSeverity(currentStatus, currentBarrier, inspectionPlan.risk.key);
  const suggestedAiAgreement = getSuggestedAiAgreement(currentStatus, aiBarrierType, currentBarrier);
  const focusItems = inspectionPlan.humanCheckFocus.slice(0, 4);
  const kakaoFocusItems = focusItems.slice(0, 3);
  const kakaoPrimaryDirection = capturePlan?.primaryDirectionLabel
    ? `${capturePlan.primaryDirectionLabel}쪽`
    : candidate.checkDirection ?? 'AI 우선 시점';
  const kakaoDecisionHint = currentSourceChecks.kakaoRoadview
    ? '360도 사진 근거가 저장되어 있습니다. 메모와 라벨이 같은 장면 기준인지 확인합니다.'
    : currentSourceChecks.kakaoMap
      ? '좌표 마커만 저장되어 있습니다. 사진에서 장벽이 보이면 카카오 360도 로드뷰도 체크합니다.'
      : '카카오 근거가 없습니다. 좌표, 건물, 사진 위치를 맞춘 뒤 해당 체크박스만 선택합니다.';
  const checkedFocusCount = focusItems.filter((focus) => currentFocusChecks[focus]).length;
  const hasSourceCheck = SOURCE_OPTIONS.some((source) => currentSourceChecks[source.key]);
  const hasSeverityLabel = currentSeverity !== 'unknown';
  const hasAiAgreementLabel = currentAiAgreement !== 'unknown';
  const hasValidationState = currentValidationStatus !== 'not_started';
  const missionPlan = buildMissionPlan(candidate, inspectionPlan, aiBarrierType, focusItems);
  const hasDecision =
    currentStatus !== 'unreviewed' &&
    hasSeverityLabel &&
    hasAiAgreementLabel &&
    currentMemo.trim().length > 0;
  const reviewSteps = [
    {
      key: 'targetPoint',
      title: '지도 기준점 확인',
      description: '왼쪽 지도에서 마커와 마지막 50m 원을 먼저 봅니다.',
      checked: Boolean(currentStepChecks.targetPoint),
    },
    {
      key: 'externalMap',
      title: '외부 지도 비교',
      description: '네이버/카카오/구글 중 실제로 연 지도를 체크합니다.',
      checked: hasSourceCheck,
    },
    {
      key: 'focusChecked',
      title: '세부 항목 확인',
      description: '아래 검수 항목 중 직접 확인한 것을 체크합니다.',
      checked: checkedFocusCount > 0,
    },
    {
      key: 'decisionSaved',
      title: '라벨 저장',
      description: '상태, 장벽 유형, 심각도, AI와의 일치 여부, 메모를 남깁니다.',
      checked: hasDecision,
    },
  ];
  const reviewRequirements = [
    { key: 'target', label: '지도 기준점 확인', met: Boolean(currentStepChecks.targetPoint) },
    { key: 'focus', label: '검수 항목 체크', met: checkedFocusCount > 0 },
    { key: 'status', label: '검수 상태 저장', met: currentStatus !== 'unreviewed' },
    { key: 'severity', label: '심각도 라벨 저장', met: hasSeverityLabel },
    { key: 'agreement', label: 'AI-사람 비교 라벨 저장', met: hasAiAgreementLabel },
    { key: 'validation', label: '후속 검수 필요도 저장', met: hasValidationState },
    { key: 'source', label: '확인 지도 체크', met: hasSourceCheck },
    { key: 'memo', label: '메모 작성', met: currentMemo.trim().length > 0 },
  ];
  const reviewReady = reviewRequirements.every((requirement) => requirement.met);
  const missingRequirements = reviewRequirements
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.label);
  const reviewedCount = report?.reviewedCount ?? 0;
  const reviewedRate = report?.reviewedRate ?? 0;
  const comparableCount = report?.aiHumanComparableCount ?? 0;
  const matchRate = report?.aiHumanMatchRate ?? 0;
  const reportReflected = currentStatus !== 'unreviewed';
  const submissionReflected = reviewReady;
  const nextQueue = getReviewQueue(candidates, reviews, candidates.length);
  const currentQueueRow = nextQueue.find((row) => row.candidate.id === candidate.id);
  const nextQueueRow = nextQueue.find((row) => row.candidate.id !== candidate.id);
  const remainingQueueCount = nextQueue.length;
  const canMoveNext = reviewReady && Boolean(nextQueueRow) && Boolean(onReviewCandidate);
  const directorDecisionState = buildDirectorDecisionState({
    reviewReady,
    currentStatus,
    currentSeverity,
    currentAiAgreement,
    currentValidationStatus,
    hasSourceCheck,
    missingRequirements,
  });
  const savedAtLabel = review?.updatedAt
    ? new Date(review.updatedAt).toLocaleString('ko-KR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '저장 전';
  const checkedSourceLabels = SOURCE_OPTIONS
    .filter((source) => currentSourceChecks[source.key])
    .map((source) => source.label);
  const saveReceiptRows = [
    { label: 'humanReview.status', value: getStatusOptionLabel(currentStatus) },
    { label: 'humanReview.barrierType', value: getBarrierLabel(currentBarrier) },
    { label: 'humanReview.severity', value: getSeverityOptionLabel(currentSeverity) },
    { label: 'agreementStatus.label', value: getAiAgreementOptionLabel(currentAiAgreement) },
    {
      label: 'humanReview.sourceChecks',
      value: checkedSourceLabels.length ? checkedSourceLabels.join(' / ') : '확인 지도 대기',
    },
    { label: 'humanReview.memo', value: currentMemo.trim() ? currentMemo.trim() : '메모 대기' },
  ];

  return (
    <section className="panel review-panel">
      <div className="panel-title-row">
        <span className="panel-label">사람 라벨링 검수</span>
        <small>{review?.updatedAt ? '저장됨' : '아직 저장 전'}</small>
      </div>

      <section className="quick-review-card" aria-label="사람 최종 판정 빠른 입력">
        <div className="quick-review-heading">
          <div>
            <span>사람이 최종 판단합니다</span>
            <strong>{candidate.name}</strong>
            <p>사진과 지도를 보고 한 가지 상태를 선택하세요.</p>
          </div>
          <em>{currentStatus === 'unreviewed' ? '판정 대기' : getStatusOptionLabel(currentStatus)}</em>
        </div>
        <div className="quick-review-options" role="group" aria-label="최종 판정 상태">
          {[
            ['published', '통과', '장벽 근거를 확인함'],
            ['field_check_needed', '현장 확인', '사진만으로 확정 어려움'],
            ['rejected', '제외', '후보 위치 또는 장벽이 아님'],
          ].map(([value, label, description]) => (
            <button
              type="button"
              key={value}
              className={`${value} ${currentStatus === value ? 'selected' : ''}`}
              aria-pressed={currentStatus === value}
              onClick={() => onChangeReview(candidate.id, { status: value })}
            >
              <strong>{label}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
        <label className="quick-review-memo">
          <span>판단 메모</span>
          <textarea
            rows="2"
            value={currentMemo}
            onChange={(event) => onChangeReview(candidate.id, { memo: event.target.value })}
            placeholder="무엇을 보고 그렇게 판단했는지 짧게 적어 주세요."
          />
        </label>
        <button
          type="button"
          className="quick-review-save"
          disabled={currentStatus === 'unreviewed' || currentMemo.trim().length === 0}
          onClick={() => onChangeReview(candidate.id, {
            validationStatus: currentValidationStatus === 'not_started' ? 'single_review' : currentValidationStatus,
            stepChecks: { ...currentStepChecks, decisionSaved: true },
          })}
        >
          판정 저장
        </button>
        <p className="quick-review-boundary">AI 초안은 참고용이며 저장값은 사람의 판정입니다.</p>
      </section>

      <LocationVerificationCard candidate={candidate} />

      <SupplementalHumanEvidencePanel
        candidate={candidate}
        review={review}
        actor={actor}
        onSubmitSecondReview={onSubmitSecondReview}
        onSubmitFieldVerification={onSubmitFieldVerification}
      />

      <div className="director-decision-card" aria-label="감독 판단 기준 카드">
        <div className="director-decision-header">
          <div>
            <span>감독 판정판</span>
            <strong>{candidate.name}</strong>
            <p>{candidate.detailedLocation ?? candidate.address}</p>
          </div>
          <div className={`director-decision-state ${directorDecisionState.key}`}>
            <span>현재 상태</span>
            <strong>{directorDecisionState.label}</strong>
          </div>
        </div>
        <div className="director-decision-next">
          <span>다음 저장 행동</span>
          <strong>{directorDecisionState.nextAction}</strong>
        </div>
        <div className="director-decision-grid">
          <div>
            <span>어디를 볼까</span>
            <strong>마커, 50m 원, 카카오 360도 로드뷰의 후보 좌표 방향</strong>
            <p>{focusItems[0] ?? '지도 기준점과 로드뷰 장면'}부터 확인합니다.</p>
          </div>
          <div>
            <span>어떻게 저장할까</span>
            <strong>상태, 심각도, AI 비교, 확인 지도, 메모</strong>
            <p>사람 판단이 최종 증거이므로 지도 근거와 메모가 같이 있어야 합니다.</p>
          </div>
        </div>
        <div className="director-missing-list" aria-label="빠진 조건">
          <span>빠진 조건</span>
          {missingRequirements.length > 0 ? (
            <ul>
              {missingRequirements.slice(0, 4).map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          ) : (
            <strong>없음. 제출 자료 탭에서 반영 상태를 확인합니다.</strong>
          )}
        </div>
      </div>

      <div className="kakao-check-card director-kakao-check-card" aria-label="감독 카카오 로드뷰 판단 위치">
        <div className="kakao-check-card-header">
          <span>카카오/로드뷰 저장 전 체크</span>
          <strong>좌표 마커와 360도 사진을 따로 판단합니다</strong>
          <p>
            현재 카카오 저장 상태: 좌표 마커 {currentSourceChecks.kakaoMap ? '체크됨' : '대기'} ·
            360도 로드뷰 {currentSourceChecks.kakaoRoadview ? '체크됨' : '대기'}
          </p>
          <p className="kakao-decision-hint">{kakaoDecisionHint}</p>
        </div>
        <dl className="kakao-location-grid">
          <div>
            <dt>검수 기준 좌표</dt>
            <dd>{getCoordinateLabel(candidate)}</dd>
          </div>
          <div>
            <dt>로드뷰 요청 좌표</dt>
            <dd>{getRoadviewCoordinateLabel(candidate)}</dd>
          </div>
          <div>
            <dt>맞춰 볼 건물</dt>
            <dd>{candidate.nearbyBuilding ?? '인근 건물 정보 없음'}</dd>
          </div>
          <div>
            <dt>돌려 볼 방향</dt>
            <dd>{kakaoPrimaryDirection}</dd>
          </div>
          <div className="wide">
            <dt>사진 안에서 찾을 위치</dt>
            <dd>{candidate.detailedLocation ?? '상세 위치 정보 없음'}</dd>
          </div>
        </dl>
        <ol className="kakao-check-steps">
          <li>
            <strong>1</strong>
            <span>외부 지도 탭에서 노란 <b>카카오맵 360도 로드뷰 열기</b> 버튼을 누릅니다.</span>
          </li>
          <li>
            <strong>2</strong>
            <span>프로젝트 가설명과 좌표 주변 실제 지명이 같은 장면인지 먼저 대조합니다.</span>
          </li>
          <li>
            <strong>3</strong>
            <span>{kakaoFocusItems.length ? kakaoFocusItems.join(' / ') : '턱, 경사, 보도 폭, 입구 단차'} 중 보이는 항목을 확인합니다.</span>
          </li>
          <li>
            <strong>4</strong>
            <span>좌표만 봤으면 <b>카카오 좌표 마커</b>, 사진에서 장벽을 봤으면 <b>카카오 360도 로드뷰</b>를 체크합니다.</span>
          </li>
        </ol>
        <div className="kakao-checkbox-decision-table" aria-label="카카오 체크박스 결정표">
          <strong className="kakao-checkbox-decision-title">카카오 체크박스 결정표</strong>
          <div>
            <span>좌표만 맞음</span>
            <strong>카카오 좌표 마커 체크</strong>
            <p>지도 마커, 후보명, 근처 건물이 맞지만 사진 장벽은 아직 확인하지 못한 상태입니다.</p>
          </div>
          <div>
            <span>사진에서 장벽 확인</span>
            <strong>카카오 360도 로드뷰 체크</strong>
            <p>같은 위치의 360도 사진에서 턱, 경사, 보도 폭, 입구 단차 중 하나 이상을 본 상태입니다.</p>
          </div>
          <div>
            <span>위치가 다름</span>
            <strong>체크하지 않음</strong>
            <p>로드뷰가 다른 도로, 다른 건물, 다른 방향이면 메모에 위치 불일치를 남깁니다.</p>
          </div>
        </div>
        <div className="kakao-check-warning">
          <strong>감독 판정 규칙</strong>
          <p>로드뷰가 다른 도로 시점이면 카카오 360도 로드뷰는 체크하지 말고, 메모에 “위치 불일치”와 다시 볼 방향을 남깁니다.</p>
        </div>
      </div>

      <div className="next-review-card" aria-label="저장 후 다음 검수 후보">
        <div>
          <span>저장 후 다음 검수 후보</span>
          <strong>
            {canMoveNext
              ? `다음: ${nextQueueRow.candidate.name}`
              : reviewReady
                ? '남은 보강 후보 없음'
                : '현재 후보 보강 먼저'}
          </strong>
          <p>
            {canMoveNext
              ? `${nextQueueRow.queueType} · 빠진 조건: ${nextQueueRow.missingLabel || '감독 확인 대기 없음'}`
              : reviewReady
                ? '제출 자료 탭에서 12개 직접 검수 증거 import 상태를 확인합니다.'
                : `${currentQueueRow?.missingLabel || missingRequirements[0] || '빠진 조건'}을 채우면 다음 후보로 넘어갈 수 있습니다.`}
          </p>
        </div>
        <div className="next-review-meta">
          <span>남은 후보</span>
          <strong>{remainingQueueCount}</strong>
        </div>
        <button
          type="button"
          className="next-review-button"
          disabled={!canMoveNext}
          onClick={() => onReviewCandidate?.(nextQueueRow.candidate.id)}
        >
          다음 후보 검수
        </button>
      </div>

      <div className="review-reflection-card" aria-label="검수 저장 후 보고서와 제출 자료 반영 확인">
        <div className="review-reflection-header">
          <div>
            <span>저장 후 반영 확인</span>
            <strong>{reportReflected ? '보고서에 반영됨' : '보고서 반영 전'}</strong>
            <p>
              현재 저장 상태 기준 검수된 후보 {reviewedCount}/{report?.total ?? 12}, 완료율 {reviewedRate}%,
              AI-사람 비교 {comparableCount}개입니다.
            </p>
          </div>
          <div className={`review-reflection-status ${submissionReflected ? 'ready' : 'pending'}`}>
            <span>제출 자료</span>
            <strong>{submissionReflected ? '반영 가능' : '보강 필요'}</strong>
          </div>
        </div>
        <div className="review-reflection-grid">
          <div>
            <span>보고서 지표</span>
            <strong>{reviewedRate}% · {reviewedCount}/{report?.total ?? 12}</strong>
            <p>분석 보고서 탭의 검수 완료율과 검수된 후보 수가 이 값으로 바뀌어야 합니다.</p>
          </div>
          <div>
            <span>제출 증거</span>
            <strong>{submissionReflected ? 'JSON/마크다운 반영 가능' : `${missingRequirements.length}개 조건 대기`}</strong>
            <p>
              {submissionReflected
                ? '제출 자료 탭에서 검수 JSON과 제출 기록을 펼쳐 확인합니다.'
                : `${missingRequirements[0] ?? '검수 조건'}부터 채워야 제출 증거로 쓸 수 있습니다.`}
            </p>
          </div>
          <div>
            <span>AI 비교 지표</span>
            <strong>{matchRate}%</strong>
            <p>AI-사람 비교 라벨이 저장되면 보고서의 일치율 계산에 들어갑니다.</p>
          </div>
        </div>
        <div className="review-reflection-actions">
          <button
            type="button"
            className="review-reflection-report"
            onClick={onOpenReport}
          >
            보고서 보기
          </button>
          <button
            type="button"
            className="review-reflection-evidence"
            onClick={onOpenEvidence}
          >
            제출 자료 보기
          </button>
        </div>
      </div>

      <div className="save-receipt-card" aria-label="감독 저장 영수증">
        <div className="save-receipt-header">
          <div>
            <span>감독 저장 영수증</span>
            <strong>{review?.updatedAt ? '검수 저장됨' : '아직 저장 전'}</strong>
            <p>마지막 저장 시각: {savedAtLabel}</p>
          </div>
          <div className={`save-receipt-status ${submissionReflected ? 'ready' : 'pending'}`}>
            <span>제출 JSON</span>
            <strong>{submissionReflected ? '반영 가능' : `${missingRequirements.length}개 대기`}</strong>
          </div>
        </div>
        <div className="save-receipt-grid" aria-label="제출 JSON 반영 필드">
          <strong className="save-receipt-grid-title">제출 JSON 반영 필드</strong>
          {saveReceiptRows.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
        <p className="save-receipt-note">
          저장 영수증의 값은 제출 자료 탭의 검수 JSON, 제출 기록 마크다운, PPT 발표 근거에 같은 후보 기준으로 반영됩니다.
        </p>
      </div>

      <PhotoLabelPanel
        candidate={candidate}
        review={review}
        focusItems={focusItems}
        currentFocusChecks={currentFocusChecks}
        currentStepChecks={currentStepChecks}
        onChangeReview={onChangeReview}
        roadviewVisionRun={roadviewVisionRun}
        onAnalyzeRoadview={onAnalyzeRoadview}
      />

      <div className={`mission-qa-card ${missionPlan.tone}`} aria-label="지식형 검수 미션">
        <div className="mission-card-header">
          <div>
            <span>{missionPlan.label}</span>
            <strong>{missionPlan.title}</strong>
          </div>
          <small>{inspectionPlan.risk.label}</small>
        </div>
        <div className="knowledge-question">
          <span>Q</span>
          <p>{missionPlan.question}</p>
        </div>
        <div className="knowledge-answer">
          <span>A</span>
          <div>
            <strong>채택 답변 기준</strong>
            <p>{missionPlan.answer}</p>
          </div>
        </div>
        <div className="mission-clear-list">
          <strong>미션 클리어 조건</strong>
          <ul>
            {missionPlan.clearConditions.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="m2-application-scope" aria-label="이번 적용 범위">
        <div>
          <span>이번 적용 범위</span>
          <strong>AI 미션 가이드, 지식형 Q&A, 심각도/독립 검수 기록</strong>
          <p>Project Sidewalk, LabelAId, OpenSidewalks에서 확인한 구조를 검수 화면에만 좁게 반영합니다.</p>
        </div>
        <div>
          <span>이번에 넣지 않는 것</span>
          <strong>AI 자동판정, 로드뷰 대량 수집, 모델 학습, 전국 경로 안내</strong>
          <p>심사 제출용 MVP에서는 사람이 최종 판단하고, 외부 지도는 사람이 열어 확인하는 범위로 제한합니다.</p>
        </div>
      </div>

      <div className="judge-decision-brief" aria-label="심사위원용 사람 판단 요약">
        <div>
          <span>어디를 봐야 하나</span>
          <strong>지도 기준점, 마지막 50m 원, 로드뷰 사진의 표시 위치</strong>
          <ul>
            {focusItems.slice(0, 3).map((focus) => (
              <li key={focus}>{focus}</li>
            ))}
          </ul>
        </div>
        <div>
          <span>어떻게 판단하나</span>
          <strong>장벽 유형, 심각도, AI 예상과의 차이를 따로 기록</strong>
          <p>
            혼자 이동 가능하면 낮음, 보조자나 우회가 필요해 보이면 중간, 혼자 통과가 어렵거나 우회가 필요하면 높음,
            사진만으로 확정이 어려우면 현장 확인 필요로 남깁니다.
          </p>
        </div>
        <div>
          <span>증거로 인정되는 조건</span>
          <strong>확인 지도 + 체크 항목 + 라벨 + 메모</strong>
          <p>카카오맵 로드뷰나 다른 지도를 실제로 확인하고, 무엇을 보고 그렇게 판단했는지 짧은 메모까지 남겨야 합니다.</p>
        </div>
      </div>

      <h3 className="review-section-title">검수 순서</h3>
      <div className="review-stepper" aria-label="검수 순서">
        {reviewSteps.map((step, index) => (
          <div className={`review-step ${step.checked ? 'complete' : ''}`} key={step.key}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
            <em>{step.checked ? '완료' : '대기'}</em>
          </div>
        ))}
      </div>

      <h3 className="review-section-title">검수 체크리스트</h3>
      <div className="review-edit-guide" aria-label="검수자가 확인하고 바꿀 수 있는 항목">
        <label className="review-focus-check fixed">
          <input
            type="checkbox"
            checked={Boolean(currentStepChecks.targetPoint)}
            onChange={(event) =>
              onChangeReview(candidate.id, {
                stepChecks: {
                  ...currentStepChecks,
                  targetPoint: event.target.checked,
                },
              })
            }
          />
          <span>왼쪽 지도에서 검수 기준점과 마지막 50m 원을 확인했습니다.</span>
        </label>
        <div className="review-focus-list">
          {focusItems.map((focus) => (
            <label className="review-focus-check" key={focus}>
              <input
                type="checkbox"
                checked={Boolean(currentFocusChecks[focus])}
                onChange={(event) =>
                  onChangeReview(candidate.id, {
                    focusChecks: {
                      ...currentFocusChecks,
                      [focus]: event.target.checked,
                    },
                  })
                }
              />
              <span>{focus}</span>
            </label>
          ))}
        </div>
        <strong>검수 후 바꿀 수 있는 것</strong>
        <p>검수 상태, 실제 장벽 유형, 심각도, 확인한 지도, AI-사람 비교 라벨, 메모를 바꿔 AI 예상과 사람 확인 결과를 비교합니다.</p>
      </div>

      <div className="labeling-guide" aria-label="라벨링 기준표">
        <div className="labeling-guide-header">
          <div>
            <strong>라벨링 기준표</strong>
            <p>느낌으로 판단하지 않고 같은 기준으로 장벽 유형, 심각도, AI 비교 라벨을 기록합니다.</p>
          </div>
          <button
            type="button"
            className="label-suggest-button"
            onClick={() =>
              onChangeReview(candidate.id, {
                severity: suggestedSeverity,
                aiAgreement: suggestedAiAgreement,
              })
            }
          >
            추천 라벨 적용
          </button>
        </div>

        <div className="label-suggestion" aria-label="현재 후보 추천 라벨">
          <div>
            <span>AI 예상 장벽</span>
            <strong>{getBarrierLabel(aiBarrierType)}</strong>
          </div>
          <div>
            <span>사람 선택 장벽</span>
            <strong>{getBarrierLabel(currentBarrier)}</strong>
          </div>
          <div>
            <span>추천 심각도</span>
            <strong>{getSeverityOptionLabel(suggestedSeverity)}</strong>
          </div>
          <div>
            <span>추천 비교</span>
            <strong>{getAiAgreementOptionLabel(suggestedAiAgreement)}</strong>
          </div>
        </div>

        <div className="label-guide-grid">
          <div>
            <h4>심각도 라벨</h4>
            <ul>
              {SEVERITY_GUIDE.map((item) => (
                <li key={item.value}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>AI-사람 비교 라벨</h4>
            <ul>
              {AI_AGREEMENT_GUIDE.map((item) => (
                <li key={item.value}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="review-status">검수 상태</label>
        <select
          id="review-status"
          value={currentStatus}
          onChange={(event) => onChangeReview(candidate.id, { status: event.target.value })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="barrier-type">확인한 장벽 유형</label>
        <select
          id="barrier-type"
          value={currentBarrier}
          onChange={(event) => onChangeReview(candidate.id, { barrierType: event.target.value })}
        >
          {BARRIER_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {getBarrierLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="severity-label">심각도 라벨</label>
        <select
          id="severity-label"
          value={currentSeverity}
          onChange={(event) => onChangeReview(candidate.id, { severity: event.target.value })}
        >
          {SEVERITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="ai-agreement">AI-사람 비교 라벨</label>
        <select
          id="ai-agreement"
          value={currentAiAgreement}
          onChange={(event) => onChangeReview(candidate.id, { aiAgreement: event.target.value })}
        >
          {AI_AGREEMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="validation-status">후속 검수 필요도</label>
        <select
          id="validation-status"
          value={currentValidationStatus}
          onChange={(event) => onChangeReview(candidate.id, { validationStatus: event.target.value })}
        >
          {VALIDATION_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.value === 'confirmed' || option.value === 'disputed'}
            >
              {option.label}
            </option>
          ))}
        </select>
        <small className="field-hint">독립 2차 검수의 확인·불일치 결과는 아래에서 다른 계정이 저장할 때만 반영됩니다.</small>
        <small className="field-hint">
          현재 상태: {getValidationOptionLabel(currentValidationStatus)}. 독립 검수 확인 완료와 판정 불일치는 아래 독립 검수 증거를 저장할 때만 바뀝니다.
        </small>
      </div>

      <div className="field-group">
        <label htmlFor="review-memo">검수 메모</label>
        <textarea
          id="review-memo"
          value={currentMemo}
          placeholder="로드뷰나 현장에서 확인한 내용을 짧게 적습니다."
          rows={4}
          onChange={(event) => onChangeReview(candidate.id, { memo: event.target.value })}
        />
      </div>

      <div className="kakao-source-helper" aria-label="카카오 체크박스 사용 기준">
        <strong>카카오 로드뷰 체크 전에 확인</strong>
        <p>
          외부 지도 탭에서 노란 카카오맵 360도 로드뷰 버튼을 열고,
          {candidate.detailedLocation ? ` ${candidate.detailedLocation}` : ' 상세 확인 위치'}와
          {candidate.nearbyBuilding ? ` ${candidate.nearbyBuilding}` : ' 근처 주요 건물'}이 같은 장면에 맞는지 확인합니다.
        </p>
        <ul>
          <li>좌표 마커만 확인했으면 <b>카카오 좌표 마커</b>만 체크합니다.</li>
          <li>360도 사진에서 턱, 경사, 보도 폭, 입구 단차 중 하나 이상을 봤으면 <b>카카오 360도 로드뷰</b>를 체크합니다.</li>
          <li>로드뷰가 다른 도로 시점으로 열려 위치가 맞지 않으면 체크하지 말고 메모에 위치 불일치를 남깁니다.</li>
        </ul>
      </div>

      <div className="source-decision-guide" aria-label="확인 지도 체크 기준표">
        <div className="source-decision-guide-header">
          <span>확인 지도 체크 기준표</span>
          <strong>열어 본 지도와 실제로 확인한 증거를 분리합니다</strong>
          <p>체크된 항목은 제출 JSON의 humanReview.sourceChecks에 그대로 남습니다.</p>
        </div>
        <div className="source-decision-guide-grid">
          {SOURCE_DECISION_GUIDE.map((item) => {
            const sourceLabel = SOURCE_OPTIONS.find((source) => source.key === item.key)?.label ?? item.key;
            const checked = Boolean(currentSourceChecks[item.key]);

            return (
              <article className={checked ? 'checked' : ''} key={item.key}>
                <div>
                  <span>{sourceLabel}</span>
                  <strong>{checked ? '저장됨' : '대기'}</strong>
                </div>
                <p>{item.when}</p>
                <small>{item.caution}</small>
              </article>
            );
          })}
        </div>
      </div>

      <fieldset className="source-checks">
        <legend>확인한 지도</legend>
        {SOURCE_OPTIONS.map((source) => (
          <label key={source.key}>
            <input
              type="checkbox"
              checked={Boolean(currentSourceChecks[source.key])}
              onChange={(event) =>
                onChangeReview(candidate.id, {
                  sourceChecks: {
                    ...currentSourceChecks,
                    [source.key]: event.target.checked,
                  },
                })
              }
            />
            <span>{source.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="review-requirements" aria-label="검수 기록 조건">
        <div className="review-requirements-header">
          <strong>검수 기록 조건</strong>
          <span className={reviewReady ? 'complete' : 'missing'}>{reviewReady ? '제출 증거 가능' : '보강 필요'}</span>
        </div>
        <ul>
          {reviewRequirements.map((requirement) => (
            <li key={requirement.key} className={requirement.met ? 'complete' : 'missing'}>
              <span>{requirement.label}</span>
              <strong>{requirement.met ? '완료' : '대기'}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="quick-actions" aria-label="빠른 검수 상태 변경">
        <button
          type="button"
          onClick={() =>
            onChangeReview(candidate.id, {
              status: 'published',
              barrierType: currentBarrier,
              severity: currentSeverity === 'unknown' ? 'medium' : currentSeverity,
              aiAgreement:
                currentAiAgreement === 'unknown'
                  ? currentBarrier === (candidate.defaultBarrierType ?? 'unknown')
                    ? 'match'
                    : 'mismatch'
                  : currentAiAgreement,
              validationStatus:
                currentValidationStatus === 'not_started' ? 'single_review' : currentValidationStatus,
              memo: currentMemo || '로드뷰 기준으로 검수 완료',
              stepChecks: {
                ...currentStepChecks,
                targetPoint: true,
              },
              focusChecks: {
                ...currentFocusChecks,
                [focusItems[0]]: true,
              },
            })
          }
        >
          검수 완료
        </button>
        <button
          type="button"
          onClick={() =>
            onChangeReview(candidate.id, {
              status: 'field_check_needed',
              barrierType: currentBarrier,
              severity: 'field_check_needed',
              aiAgreement: currentAiAgreement === 'unknown' ? 'hold' : currentAiAgreement,
              validationStatus: 'needs_second_review',
              memo: currentMemo || '로드뷰만으로 판단이 어려워 현장 확인 필요',
              stepChecks: {
                ...currentStepChecks,
                targetPoint: true,
              },
              focusChecks: {
                ...currentFocusChecks,
                [focusItems[0]]: true,
              },
            })
          }
        >
          현장 확인
        </button>
        <button
          type="button"
          onClick={() =>
            onChangeReview(candidate.id, {
              status: 'rejected',
              barrierType: 'none',
              severity: 'low',
              aiAgreement: 'mismatch',
              validationStatus:
                currentValidationStatus === 'not_started' ? 'single_review' : currentValidationStatus,
              memo: currentMemo || '이동장벽 후보로 보기 어려워 제외',
              stepChecks: {
                ...currentStepChecks,
                targetPoint: true,
              },
              focusChecks: {
                ...currentFocusChecks,
                [focusItems[0]]: true,
              },
            })
          }
        >
          후보 제외
        </button>
      </div>
    </section>
  );
}
