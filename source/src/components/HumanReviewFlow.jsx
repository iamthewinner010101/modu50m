import { useEffect, useMemo, useState } from 'react';
import roadviewAnalysisAssets from '../data/roadviewAnalysisAssets';
import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { getPhotoAiDraft } from '../utils/photoAiDraft';

const PLACE_OPTIONS = [
  { value: 'match', label: '같은 장소예요', description: '건물·출구·도로 모습이 장소 설명과 맞아요.' },
  { value: 'mismatch', label: '다른 장소예요', description: '사진이 다른 건물이나 도로를 보여 줘요.' },
  { value: 'unclear', label: '잘 모르겠어요', description: '표지나 주변 모습이 부족해 확인하기 어려워요.' },
];

const OBSERVATION_OPTIONS = [
  { value: 'seen', label: '보여요' },
  { value: 'not_seen', label: '안 보여요' },
  { value: 'unclear', label: '모르겠어요' },
];

const OUTCOME_OPTIONS = [
  {
    value: 'low',
    label: '작은 불편이 보여요',
    description: '사진에서 지나갈 때 조금 불편할 수 있는 부분이 보여요.',
    allowedPlaceMatches: ['match'],
  },
  {
    value: 'medium',
    label: '도움이나 다른 길이 필요해 보여요',
    description: '혼자 지나가기 어렵거나 다른 길을 찾아야 할 수 있어요.',
    allowedPlaceMatches: ['match'],
  },
  {
    value: 'high',
    label: '혼자 지나가기 어려워 보여요',
    description: '사진에서 지나가기 어려워 보이는 부분이 뚜렷해요.',
    allowedPlaceMatches: ['match'],
  },
  {
    value: 'photo_confirmed',
    label: '사진 확인 완료',
    description: '확인할 세 곳이 모두 보여요. 이 사진을 저장하고 다음으로 넘어가요.',
    allowedPlaceMatches: ['match'],
  },
  {
    value: 'field',
    label: '직접 가서 확인하기',
    description: '사진에서 안 보이는 곳이 있어 이 장소만 직접 확인해요.',
    allowedPlaceMatches: ['match', 'unclear'],
  },
  {
    value: 'rejected',
    label: '이 사진은 빼기',
    description: '장소가 다르거나 확인하려던 곳이 아니에요.',
    allowedPlaceMatches: ['match', 'mismatch'],
  },
];

const PLACE_LABELS = Object.fromEntries(PLACE_OPTIONS.map((option) => [option.value, option.label]));
const OBSERVATION_LABELS = Object.fromEntries(
  OBSERVATION_OPTIONS.map((option) => [option.value, option.label]),
);
const OUTCOME_LABELS = Object.fromEntries(OUTCOME_OPTIONS.map((option) => [option.value, option.label]));

function getAllowedOutcomeValues({
  guideKind,
  placeMatch,
  observationAnswers,
  reviewPoints,
}) {
  if (placeMatch === 'mismatch') return ['rejected'];
  if (placeMatch === 'unclear') return ['field'];
  if (placeMatch !== 'match') return [];

  const observationValues = reviewPoints
    .map((point) => observationAnswers[point.id])
    .filter(Boolean);
  const observationComplete = reviewPoints.length > 0
    && observationValues.length === reviewPoints.length;
  if (!observationComplete) return [];

  const observationsNeedField = observationValues.some((value) => value !== 'seen');
  if (observationsNeedField) return ['field', 'rejected'];
  if (guideKind === 'source_check_only') return ['photo_confirmed', 'rejected'];
  return ['low', 'medium', 'high', 'rejected'];
}

const KAKAO_MAP_IMAGE_IDS = new Set([
  'L50-001',
  'L50-002',
  'L50-003',
  'L50-004',
  'L50-005',
  'L50-006',
  'L50-007',
  'L50-008',
  'L50-009',
  'L50-010',
  'L50-011',
  'L50-012',
]);

const PLACE_DISPLAY_NAMES = {
  'L50-001': '갤러리아 타임월드 서쪽 인도',
  'L50-002': '시청역 8번 출구 앞 인도',
  'L50-003': '둔산 버스정류장으로 들어가는 길',
  'L50-004': '소아과 건물 입구',
  'L50-005': '세이브존 대전점 정문',
  'L50-006': '공원 화장실로 가는 길',
  'L50-007': '도서관 앞 인도',
  'L50-008': '학교 정문 주변 인도',
  'L50-009': '편의점 앞에서 길을 건너는 곳',
  'L50-010': '주민센터 민원실 입구',
  'L50-011': '시장 입구 인도',
  'L50-012': '은행 ATM 입구',
};

function getPlaceDisplayName(candidate) {
  return PLACE_DISPLAY_NAMES[candidate?.id] ?? candidate?.name ?? '';
}

const GUIDE_DISPLAY_OVERRIDES = {
  'L50-002': {
    step_free_route_visible: {
      label: '8번 출구 계단과 손잡이',
      humanCheck: '동그라미 안에 계단과 손잡이가 보이나요? 파란 위치 표시가 가리면 ‘모르겠어요’를 눌러요.',
    },
    fixed_obstacle_visible: {
      label: '출구 오른쪽 길가',
      humanCheck: '동그라미 안에 나무나 세로로 긴 표지판이 보이나요? 보이는 것만 답해요. 길이 넓은지는 이 사진만 보고 짐작하지 마세요.',
      region: { centerX: 0.89, centerY: 0.8, radius: 0.1 },
    },
    curb_transition_visible: {
      label: '왼쪽 아래, 인도와 차도가 만나는 곳',
      humanCheck: '동그라미 안에서 인도와 차도가 나뉘는 선이 잘 보이나요? 턱이 낮아진 곳이 안 보이면 ‘안 보여요’나 ‘모르겠어요’를 눌러요.',
    },
  },
};

const ROADVIEW_STATUS_GUIDANCE = {
  context_conflict: {
    tone: 'warning',
    title: '목표 시설이 이 사진에 실제로 있는지 먼저 확인하세요',
  },
  field_check_required: {
    tone: 'field',
    title: '이곳은 현재 로드뷰보다 현장 확인이 먼저 필요해요',
  },
  roadview_distance_warning: {
    tone: 'warning',
    title: '사진이 멀어서 목표 입구가 작거나 안 보일 수 있어요',
  },
  stale_roadview: {
    tone: 'warning',
    title: '촬영 시점이 오래된 사진이라 현재 모습과 다를 수 있어요',
  },
  place_match_required: {
    tone: 'ready',
    title: '지도 이름과 사진 속 표지를 먼저 맞춰 보세요',
  },
};

function isValidGuideRegion(region) {
  return (
    Number.isFinite(region?.centerX) && region.centerX >= 0 && region.centerX <= 1
    && Number.isFinite(region?.centerY) && region.centerY >= 0 && region.centerY <= 1
    && Number.isFinite(region?.radius) && region.radius >= 0.04 && region.radius <= 0.22
  );
}

function buildImageBoundGuide(candidate, selectedDirection) {
  const verification = candidate.locationVerification ?? {};
  const evidence = verification.placeMatchEvidence ?? {};
  const guide = evidence.accessibilityObservationGuide ?? [];
  const exactImageMatch = Boolean(
    selectedDirection?.image
      && evidence.image
      && selectedDirection.image === evidence.image,
  );
  const eligible = (
    verification.status === 'place_match_required'
      && evidence.status === 'candidate_ready_for_human_match'
      && evidence.humanConfirmationStatus === 'pending'
      && exactImageMatch
  );
  if (!eligible) return [];

  const overrides = GUIDE_DISPLAY_OVERRIDES[candidate.id] ?? {};
  return guide
    .map((item, index) => {
      const override = overrides[item.id] ?? {};
      const region = override.region ?? item.region;
      return {
        id: `check-${index + 1}`,
        sourcePointId: item.id,
        label: override.label ?? item.area,
        humanCheck: override.humanCheck ?? item.question,
        description: override.humanCheck ?? item.question,
        nextEvidenceAction: item.nextEvidenceAction,
        guideSource: 'verified_image_guide',
        guideKind: 'accessibility_observation',
        ...region,
      };
    })
    .filter(isValidGuideRegion)
    .slice(0, 3);
}

function buildOnlineImageGuide(candidate, selectedDirection, photoDraft) {
  const analysisAsset = roadviewAnalysisAssets[candidate.id];
  if (analysisAsset?.reviewMode !== 'accessibility_observation') return [];
  const exactAnalysisImageSelected = Boolean(
    analysisAsset?.image
      && selectedDirection?.image
      && selectedDirection.image === analysisAsset.image,
  );
  if (!exactAnalysisImageSelected || !photoDraft.available) return [];

  return photoDraft.attentionRegions
    .map((region, index) => ({
      id: `check-${index + 1}`,
      sourcePointId: `online-ai-region-${index + 1}`,
      label: region.label,
      humanCheck: region.humanCheck,
      description: region.humanCheck,
      nextEvidenceAction: photoDraft.nextEvidenceAction?.evidenceNeeded ?? '',
      guideSource: 'approved_online_ai',
      guideKind: 'accessibility_observation',
      ...region,
    }))
    .filter(isValidGuideRegion)
    .slice(0, 3);
}

function buildSourceCheckGuide(candidate, selectedDirection) {
  const analysisAsset = roadviewAnalysisAssets[candidate.id];
  const exactSourceImageSelected = Boolean(
    analysisAsset?.reviewMode === 'source_check_only'
      && analysisAsset.image
      && selectedDirection?.image === analysisAsset.image,
  );
  if (!exactSourceImageSelected) return [];

  return (analysisAsset.sourceCheckGuide ?? [])
    .map((region, index) => ({
      id: `check-${index + 1}`,
      sourcePointId: `${candidate.id}-source-check-${index + 1}`,
      label: region.label,
      humanCheck: region.humanCheck,
      description: region.humanCheck,
      nextEvidenceAction: '사진이 목표 장소와 다르거나 불명확하면 가까운 카카오 로드뷰 또는 현장 사진을 다시 확인합니다.',
      guideSource: 'image_source_check',
      guideKind: 'source_check_only',
      ...region,
    }))
    .filter(isValidGuideRegion)
    .slice(0, 3);
}

function ReviewMarkerLayer({ regions, className = '' }) {
  if (!regions.length) return null;
  const guideKind = regions[0]?.guideKind ?? 'accessibility_observation';
  return (
    <div
      className={`human-review-marker-layer ${guideKind === 'source_check_only' ? 'source-check' : ''} ${className}`.trim()}
      data-testid="human-review-marker-layer"
      data-guide-kind={guideKind}
      aria-hidden="true"
    >
      {regions.map((region, index) => (
        <span
          className="human-review-marker"
          key={region.id}
          style={{
            left: `${region.centerX * 100}%`,
            top: `${region.centerY * 100}%`,
            width: `${region.radius * 200}%`,
          }}
        >
          <small>{index + 1}</small>
        </span>
      ))}
    </div>
  );
}

function buildDirectionViews(candidate, capturePlan, analysisAsset) {
  const primaryCandidatePhoto = candidate.reviewPhoto?.image
      ? [{
        key: 'candidate',
        label: '이 장소로 고른 사진',
        image: candidate.reviewPhoto.image,
        recommended: true,
      }]
    : [];
  const directionViews = capturePlan?.directionViews ?? [];
  const guidedView = analysisAsset?.image
    ? [{
        key: analysisAsset.directionKey,
        label: `${analysisAsset.directionLabel} · 확인 원`,
        image: analysisAsset.image,
        recommended: true,
      }]
    : [];
  if (guidedView.length) return guidedView;
  const combined = [
    ...guidedView,
    ...primaryCandidatePhoto,
    ...directionViews.filter((view) => view.key !== analysisAsset?.directionKey),
  ];
  return combined.filter((view, index) => (
    view.image
      && combined.findIndex((item) => item.key === view.key || item.image === view.image) === index
  ));
}

function getInitialDraft(review) {
  const saved = review?.humanQuickReview;
  return {
    placeMatch: saved?.placeMatch ?? '',
    observationAnswers: saved?.observationAnswers ?? {},
    outcome: saved?.outcome ?? '',
    note: saved?.note ?? '',
  };
}

function buildMemo({ candidate, reviewPoints, placeMatch, observationAnswers, outcome, note }) {
  const observationText = reviewPoints
    .map((point) => `${point.label}: ${OBSERVATION_LABELS[observationAnswers[point.id]] ?? '응답 없음'}`)
    .join(' / ');
  return [
    `장소 일치: ${PLACE_LABELS[placeMatch]}.`,
    observationText ? `사진 관찰: ${observationText}.` : '',
    `사람 기록: ${OUTCOME_LABELS[outcome]}.`,
    `확인 사진: ${candidate.name} 카카오 로드뷰 후보.`,
    note.trim() ? `추가 메모: ${note.trim()}` : '',
  ].filter(Boolean).join(' ');
}

function buildReviewPatch({
  candidate,
  reviewPoints,
  draft,
  selectedDirection,
  selectedDirectionKey,
  mapReferenceShown,
  guideSource,
  guideKind,
  photoDraft,
}) {
  const { placeMatch, observationAnswers, outcome, note } = draft;
  const status = outcome === 'field'
    ? 'field_check_needed'
    : outcome === 'rejected'
      ? 'rejected'
      : outcome === 'photo_confirmed'
        ? 'unreviewed'
        : 'published';
  const severity = ['low', 'medium', 'high'].includes(outcome)
    ? outcome
    : outcome === 'field'
      ? 'field_check_needed'
      : outcome === 'photo_confirmed'
        ? 'unknown'
        : 'low';
  const observationValues = Object.values(observationAnswers);
  const aiAgreement = outcome === 'field' || observationValues.includes('unclear')
    ? 'hold'
    : outcome === 'rejected' || placeMatch === 'mismatch'
      ? 'mismatch'
      : observationValues.includes('seen')
        ? 'match'
        : 'partial';
  const focusChecks = Object.fromEntries(
    reviewPoints.map((point) => [point.label, Boolean(observationAnswers[point.id])]),
  );
  focusChecks['장소 일치 여부 확인'] = true;
  const observationComplete = placeMatch === 'match'
    && reviewPoints.every((point) => Boolean(observationAnswers[point.id]));

  return {
    status,
    barrierType: outcome === 'rejected'
      ? 'none'
      : outcome === 'photo_confirmed'
        ? 'unknown'
        : candidate.defaultBarrierType ?? 'unknown',
    severity,
    aiAgreement,
    validationStatus: 'single_review',
    stepChecks: {
      targetPoint: placeMatch === 'match',
      externalMap: mapReferenceShown,
      focusChecked: observationComplete,
      decisionSaved: true,
    },
    focusChecks,
    sourceChecks: {
      kakaoMap: mapReferenceShown,
      kakaoRoadview: Boolean(selectedDirectionKey),
    },
    memo: buildMemo({
      candidate,
      reviewPoints,
      placeMatch,
      observationAnswers,
      outcome,
      note,
    }),
    humanQuickReview: {
      source: 'person_direct_kakao_review',
      placeMatch,
      observationAnswers,
      outcome,
      note: note.trim(),
      selectedDirectionKey,
      mapReferenceShown,
      sourceSnapshot: {
        candidateId: candidate.id,
        selectedDirectionKey,
        image: selectedDirection?.image ?? '',
        guideSource,
        guideKind,
        sourcePointIds: reviewPoints.map((point) => point.sourcePointId ?? point.id),
        placeId: candidate.locationVerification?.placeMatchEvidence?.placeId
          ?? candidate.reviewPhoto?.sourcePlaceId
          ?? '',
        inputSha256: selectedDirection?.image === candidate.locationVerification?.placeMatchEvidence?.image
          ? photoDraft.provenance?.inputSha256
            ?? candidate.locationVerification?.placeMatchEvidence?.imageSha256
            ?? ''
          : '',
        responseId: photoDraft.provenance?.responseId ?? '',
      },
      nextEvidence: outcome === 'field'
        ? '같은 장소의 가까운 사진 또는 현장 측정'
        : outcome === 'rejected'
          ? '새 카카오 로드뷰 방향 또는 다른 후보'
          : outcome === 'photo_confirmed'
            ? '사진 확인 완료. 접근성 확인용 근접 사진을 다음 검수로 연결'
            : '다른 사람이 같은 사진을 독립 재검수',
      savedAt: new Date().toISOString(),
    },
  };
}

export default function HumanReviewFlow({
  candidates,
  selectedId,
  reviews,
  onSelectCandidate,
  onChangeReview,
  reviewSync,
  roadviewVisionRun,
  onAnalyzeRoadview,
}) {
  const candidate = candidates.find((item) => item.id === selectedId) ?? candidates[0];
  const displayName = getPlaceDisplayName(candidate);
  const review = reviews[candidate.id] ?? {};
  const capturePlan = getRoadviewCapturePlan(candidate);
  const analysisAsset = roadviewAnalysisAssets[candidate.id] ?? null;
  const directionViews = useMemo(
    () => buildDirectionViews(candidate, capturePlan, analysisAsset),
    [candidate, capturePlan, analysisAsset],
  );
  const savedDirectionKey = review?.humanQuickReview?.selectedDirectionKey ?? '';
  const initialDirectionKey = directionViews.some((view) => view.key === savedDirectionKey)
    ? savedDirectionKey
    : directionViews[0]?.key ?? '';
  const [selectedDirectionKey, setSelectedDirectionKey] = useState(initialDirectionKey);
  const [draft, setDraft] = useState(() => getInitialDraft(review));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const [savedHere, setSavedHere] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savedReviewAt = review?.humanQuickReview?.savedAt ?? '';
  const [restoredSavedAt, setRestoredSavedAt] = useState(savedReviewAt);
  if (restoredSavedAt !== savedReviewAt) {
    const restoredDirectionKey = review?.humanQuickReview?.selectedDirectionKey ?? '';
    setRestoredSavedAt(savedReviewAt);
    setSelectedDirectionKey(
      directionViews.some((view) => view.key === restoredDirectionKey)
        ? restoredDirectionKey
        : directionViews[0]?.key ?? '',
    );
    setDraft(getInitialDraft(review));
    setSavedHere(false);
    setSaveError('');
  }
  const selectedDirection = directionViews.find((view) => view.key === selectedDirectionKey)
    ?? directionViews[0]
    ?? null;
  const placeEvidence = candidate.locationVerification?.placeMatchEvidence ?? {};
  const photoDraft = getPhotoAiDraft(candidate, roadviewVisionRun?.result ?? null);
  const onlineImageGuide = buildOnlineImageGuide(candidate, selectedDirection, photoDraft);
  const boundGuide = buildImageBoundGuide(candidate, selectedDirection);
  const exactObservationGuide = (onlineImageGuide.length
    ? [...onlineImageGuide, ...boundGuide.slice(onlineImageGuide.length)]
    : boundGuide
  ).slice(0, 3).map((point, index) => ({ ...point, id: `check-${index + 1}` }));
  const sourceCheckGuide = buildSourceCheckGuide(candidate, selectedDirection);
  const activeMarkerRegions = exactObservationGuide.length
    ? exactObservationGuide
    : sourceCheckGuide;
  const guideSource = onlineImageGuide.length
    ? 'approved_online_ai'
    : boundGuide.length
      ? 'verified_image_guide'
      : sourceCheckGuide.length
        ? 'image_source_check'
        : 'text_only_capture_plan';
  const guideKind = exactObservationGuide.length
    ? 'accessibility_observation'
    : sourceCheckGuide.length
      ? 'source_check_only'
      : 'text_only_capture_plan';
  const activeReviewPoints = activeMarkerRegions.length
    ? activeMarkerRegions
    : capturePlan.points.map((point) => ({
        ...point,
        sourcePointId: point.id,
        humanCheck: point.description,
        guideSource: 'text_only_capture_plan',
        guideKind: 'text_only_capture_plan',
      }));
  const onlineAnalysisImageSelected = Boolean(
    analysisAsset?.image
      && selectedDirection?.image
      && selectedDirection.image === analysisAsset.image
      && candidate.locationVerification?.status === 'place_match_required'
      && placeEvidence.status === 'candidate_ready_for_human_match',
  );
  const guidedDirection = directionViews.find((view) => view.image === placeEvidence.image) ?? null;
  const exactEvidenceImageSelected = Boolean(
    selectedDirection?.image
      && placeEvidence.image
      && selectedDirection.image === placeEvidence.image,
  );
  const selectedCaptureDate = String(
    exactEvidenceImageSelected
      ? placeEvidence.captureDate ?? ''
      : capturePlan.roadviewAsset?.captureDate ?? '',
  ).slice(0, 10);
  const selectedRoadviewCaption = exactEvidenceImageSelected
    ? `카카오 로드뷰 ${selectedCaptureDate} · 동그라미 표시와 같은 사진`
    : selectedDirection?.key === 'candidate'
      ? candidate.reviewPhoto?.caption
      : `카카오 로드뷰 ${selectedCaptureDate} · ${selectedDirection?.label ?? '주변'} 화면`;
  const directRoadviewUrl = candidate.locationVerification?.status === 'field_check_required'
    ? candidate.reviewLinks.kakaoRoadview
    : candidate.reviewPhoto?.roadviewUrl
      || capturePlan.roadviewUrl
      || candidate.reviewLinks.kakaoRoadview;
  const roadviewStatus = ROADVIEW_STATUS_GUIDANCE[candidate.locationVerification?.status]
    ?? ROADVIEW_STATUS_GUIDANCE.place_match_required;
  const guideAvailableOnAnotherImage = (
    !activeMarkerRegions.length
      && guidedDirection
      && selectedDirection?.image !== guidedDirection.image
      && (placeEvidence.accessibilityObservationGuide?.length ?? 0) > 0
  );
  const currentIndex = Math.max(0, candidates.findIndex((item) => item.id === candidate.id));
  const completedIds = new Set(
    candidates
      .filter((item) => reviews[item.id]?.humanQuickReview?.savedAt)
      .map((item) => item.id),
  );
  const mapImageAvailable = KAKAO_MAP_IMAGE_IDS.has(candidate.id) && !mapImageFailed;
  const observationComplete = activeReviewPoints.every(
    (point) => Boolean(draft.observationAnswers[point.id]),
  );
  const allowedOutcomeValues = getAllowedOutcomeValues({
    guideKind,
    placeMatch: draft.placeMatch,
    observationAnswers: draft.observationAnswers,
    reviewPoints: activeReviewPoints,
  });
  const fieldVisitRequired = allowedOutcomeValues.includes('field');
  const outcomeQuestionTitle = draft.placeMatch === 'mismatch'
    ? '이 사진은 찾는 장소와 다른가요?'
    : fieldVisitRequired
      ? '직접 가서 확인해야 하나요?'
      : guideKind === 'accessibility_observation'
        ? '사진에서 휠체어가 지나가기 얼마나 불편해 보이나요?'
        : '이 사진이 찾는 장소와 맞다고 기록할까요?';
  const outcomeQuestionDescription = draft.placeMatch === 'mismatch'
    ? '다른 장소 사진으로 불편 정도를 판단하지 않도록 이 사진은 빼요.'
    : fieldVisitRequired
      ? '사진에서 안 보이는 곳이 하나라도 있으면 불편 정도를 짐작하지 않고 직접 확인할 곳으로 남겨요.'
      : guideKind === 'accessibility_observation'
        ? '사진에서 보이는 불편 정도를 골라요. 이 기록으로 다른 사람이 다시 볼 곳과 직접 가서 확인할 곳을 정해요. 실제로 지나갈 수 있는지는 사진 한 장만으로 정하지 않아요.'
        : '주황색 동그라미 3곳은 사진이 찾는 장소와 맞는지 확인하기 위한 표시예요. 휠체어가 지나가기 불편한지는 이 사진으로 정하지 않아요.';
  const outcomeAllowed = allowedOutcomeValues.includes(draft.outcome);
  const placeNeedsObservations = draft.placeMatch === 'match';
  const readyToSave = Boolean(
    draft.placeMatch
      && draft.outcome
      && outcomeAllowed
      && (!placeNeedsObservations || observationComplete),
  );
  const nextCandidate = candidates
    .slice(currentIndex + 1)
    .concat(candidates.slice(0, currentIndex))
    .find((item) => !completedIds.has(item.id))
    ?? candidates[(currentIndex + 1) % candidates.length];

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('human-review-modal-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('human-review-modal-open');
    };
  }, [lightboxOpen]);

  function updateDraft(patch) {
    setSavedHere(false);
    setSaveError('');
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handlePlaceMatch(placeMatch) {
    const currentOutcome = draft.outcome;
    const observationAnswers = placeMatch === 'match' ? draft.observationAnswers : {};
    const nextAllowedOutcomeValues = getAllowedOutcomeValues({
      guideKind,
      placeMatch,
      observationAnswers,
      reviewPoints: activeReviewPoints,
    });
    updateDraft({
      placeMatch,
      outcome: nextAllowedOutcomeValues.includes(currentOutcome) ? currentOutcome : '',
      observationAnswers,
    });
  }

  function handleObservationAnswer(pointId, answer) {
    const observationAnswers = {
      ...draft.observationAnswers,
      [pointId]: answer,
    };
    const nextAllowedOutcomeValues = getAllowedOutcomeValues({
      guideKind,
      placeMatch: draft.placeMatch,
      observationAnswers,
      reviewPoints: activeReviewPoints,
    });
    updateDraft({
      observationAnswers,
      outcome: nextAllowedOutcomeValues.includes(draft.outcome) ? draft.outcome : '',
    });
  }

  function handleDirectionChange(directionKey) {
    if (directionKey === selectedDirectionKey) return;
    setSelectedDirectionKey(directionKey);
    setLightboxOpen(false);
    updateDraft({
      placeMatch: '',
      observationAnswers: {},
      outcome: '',
    });
  }

  function handleAnalyzeSelectedImage() {
    if (
      !onlineAnalysisImageSelected
      || !onAnalyzeRoadview
      || roadviewVisionRun?.status === 'loading'
    ) return;
    onAnalyzeRoadview(candidate.id, analysisAsset.directionKey);
  }

  async function handleSave({ moveNext }) {
    if (!readyToSave || saving) return;
    setSaving(true);
    setSavedHere(false);
    setSaveError('');
    try {
      const result = await onChangeReview(candidate.id, buildReviewPatch({
        candidate,
        reviewPoints: activeReviewPoints,
        draft,
        selectedDirection,
        selectedDirectionKey,
        mapReferenceShown: mapImageAvailable,
        guideSource,
        guideKind,
        photoDraft,
      }));
      if (result?.ok === false) {
        setSaveError('서버에 저장하지 못했습니다. 이 장소에서 다시 저장해 주세요.');
        return;
      }
      setSavedHere(true);
      if (moveNext && nextCandidate?.id !== candidate.id) {
        onSelectCandidate(nextCandidate.id);
      }
    } catch {
      setSaveError('저장 중 문제가 생겼습니다. 입력은 그대로 두었으니 다시 저장해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="human-review-shell"
      data-human-review-flow="easy-12"
      data-selected-candidate={candidate.id}
    >
      <header className="human-review-header">
        <div>
          <span>모두의 50m</span>
          <h1>12곳 직접 확인</h1>
          <p>이 사진 12장은 정답이 아니에요. 사진에서 실제로 보이는 것과 사람의 답을 모두 같은 방법으로 기록해요.</p>
        </div>
        <div className="human-review-progress" aria-label="확인 진행률">
          <strong>{completedIds.size}/12</strong>
          <span>{reviewSync?.status === 'syncing' ? '저장 중' : '저장된 장소'}</span>
        </div>
      </header>

      <nav className="human-review-place-rail" aria-label="확인할 12곳">
        {candidates.map((item, index) => {
          const completed = completedIds.has(item.id);
          return (
            <button
              type="button"
              key={item.id}
              className={`${item.id === candidate.id ? 'selected' : ''} ${completed ? 'completed' : ''}`}
              aria-pressed={item.id === candidate.id}
              onClick={() => onSelectCandidate(item.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{getPlaceDisplayName(item)}</strong>
              <em>{completed ? '저장됨' : '대기'}</em>
            </button>
          );
        })}
      </nav>

      <section className="human-review-place-card" aria-label="카카오 지도 위치">
        <div className="human-review-place-copy">
          <span>현재 장소 {currentIndex + 1}/12</span>
          <h2>{displayName}</h2>
          <p>{candidate.address}</p>
          <small>{candidate.nearbyBuilding}</small>
        </div>
        <div className="human-review-map-actions">
          <a href={candidate.reviewLinks.kakaoMap} target="_blank" rel="noreferrer">
            카카오맵에서 위치 확인
          </a>
          <a className="primary" href={directRoadviewUrl} target="_blank" rel="noreferrer">
            카카오 로드뷰에서 직접 보기
          </a>
        </div>
      </section>

      <div className="human-review-media-grid">
        <section className="human-review-map-panel" aria-label="카카오 지도 이미지">
          <header>
            <strong>지도에서 위치 확인</strong>
            <span>파란 핀과 주변 도로를 먼저 맞춰 보세요.</span>
          </header>
          {mapImageAvailable ? (
            <button
              type="button"
              className="human-review-map-image"
              onClick={() => setLightboxOpen('map')}
              aria-label={`${displayName} 카카오 지도 크게 보기`}
            >
              <img
                src={`/modu50m/review-photos/kakao-maps/${candidate.id}-kakao-map.png`}
                alt={`${displayName} 카카오 지도 위치`}
                onError={() => setMapImageFailed(true)}
              />
              <span>지도 크게 보기</span>
            </button>
          ) : (
            <div className="human-review-map-fallback">
              <strong>이 장소는 카카오맵에서 직접 확인해 주세요</strong>
              <p>위의 ‘카카오맵에서 위치 확인’을 누르면 같은 위치가 바로 열립니다.</p>
              <a href={candidate.reviewLinks.kakaoMap} target="_blank" rel="noreferrer">
                카카오맵 열기
              </a>
            </div>
          )}
        </section>

        <section className="human-review-roadview-card" aria-label="확인할 카카오 로드뷰 사진">
          <header>
            <div>
              <span>로드뷰에서 실제 모습 확인</span>
              <h2>사진이 같은 장소인지 먼저 보세요</h2>
              <p>{capturePlan.captureFocus}</p>
            </div>
            <small>{selectedRoadviewCaption}</small>
          </header>

          {onlineAnalysisImageSelected ? (
            <div
              className={`human-review-ai-control ${roadviewVisionRun?.status ?? 'idle'}`}
              data-ai-guide-status={onlineImageGuide.length ? 'ready' : roadviewVisionRun?.status ?? 'idle'}
            >
              <div>
                <strong>
                  {onlineImageGuide.length
                    ? `온라인 AI가 이 사진에서 ${onlineImageGuide.length}곳을 표시했어요`
                    : '이 사진은 위치와 원본이 맞는지 확인됐어요'}
                </strong>
                <span>
                  {roadviewVisionRun?.status === 'loading'
                    ? '온라인 AI가 사진을 보고 사람이 다시 볼 위치를 찾고 있어요.'
                    : roadviewVisionRun?.status === 'error'
                      ? `${roadviewVisionRun.error} 확인하지 못한 곳에 원을 마음대로 그리지 않았어요.`
                      : onlineImageGuide.length
                        ? '동그라미 번호와 아래 설명을 맞춰 보고, 직접 답을 남겨 주세요.'
                        : '미리 정한 동그라미 3개를 먼저 보고, AI에게 확인할 곳을 다시 찾게 할 수도 있어요.'}
                </span>
              </div>
              <button
                type="button"
                disabled={!onAnalyzeRoadview || roadviewVisionRun?.status === 'loading'}
                onClick={handleAnalyzeSelectedImage}
              >
                {roadviewVisionRun?.status === 'loading'
                  ? '사진을 확인하는 중'
                  : 'AI에게 사진에서 볼 곳 찾게 하기'}
              </button>
            </div>
          ) : null}

          {selectedDirection ? (
            <button
              type="button"
              className={`human-review-roadview-main ${activeMarkerRegions.length ? 'annotated' : ''}`}
              data-testid="human-review-main-image"
              data-guide-image-match={activeMarkerRegions.length ? 'true' : 'false'}
              onClick={() => setLightboxOpen('roadview')}
              aria-label={`${displayName} 카카오 로드뷰 크게 보기`}
            >
              <img src={selectedDirection.image} alt={`${displayName} ${selectedDirection.label} 카카오 로드뷰`} />
              <ReviewMarkerLayer regions={activeMarkerRegions} />
              <span>눌러서 화면 가득 보기</span>
            </button>
          ) : (
            <div className="human-review-roadview-empty">
              <strong>저장된 확인용 사진이 없어요</strong>
              <p>위의 카카오 로드뷰 버튼에서 장소를 직접 확인해 주세요.</p>
            </div>
          )}

          <div className="human-review-directions" aria-label="다른 방향 사진">
            {directionViews.map((view) => (
              <button
                type="button"
                key={view.key}
                className={view.key === selectedDirection?.key ? 'selected' : ''}
                aria-pressed={view.key === selectedDirection?.key}
                onClick={() => handleDirectionChange(view.key)}
              >
                <img src={view.image} alt="" />
                <span>{view.label}</span>
              </button>
            ))}
          </div>

          <section
            className={`human-review-guidance ${
              guideKind === 'source_check_only'
                ? 'source-check'
                : activeMarkerRegions.length
                  ? 'exact'
                  : roadviewStatus.tone
            }`}
            aria-label="사진에서 확인할 위치와 보는 방법"
          >
            <header>
              <span>
                {guideKind === 'source_check_only'
                  ? '사진에서 먼저 볼 곳'
                  : '사진에서 확인할 곳'}
              </span>
              <strong>
                {activeMarkerRegions.length
                  ? guideKind === 'source_check_only'
                    ? '주황색 동그라미 3곳을 차례로 봐 주세요'
                    : onlineImageGuide.length
                      ? 'AI가 표시한 동그라미 번호와 아래 설명을 차례로 맞춰 보세요'
                      : '동그라미 번호와 아래 설명을 차례로 맞춰 보세요'
                  : roadviewStatus.title}
              </strong>
            </header>

            {activeMarkerRegions.length ? (
              <>
                <ol>
                  {activeMarkerRegions.map((region, index) => (
                    <li key={`${region.id}-human-guide`}>
                      <small>{index + 1}</small>
                      <span>
                        <strong>{region.label}</strong>
                        <em>{region.humanCheck}</em>
                      </span>
                    </li>
                  ))}
                </ol>
                <p>
                  {guideKind === 'source_check_only'
                    ? '주황색 동그라미는 턱이나 계단 같은 불편을 판단하는 표시가 아니에요. 사진이 찾는 장소가 맞는지, 다른 사진이나 직접 확인이 필요한지만 봐요.'
                    : '파란 동그라미는 사진에서 다시 볼 곳만 가리켜요. 동그라미만 보고 지나가기 쉬운지는 판단하지 마세요. 번호와 아래 질문은 서로 짝이에요.'}
                </p>
              </>
            ) : (
              <div className="human-review-guidance-missing">
                <ol>
                  {activeReviewPoints.map((point, index) => (
                    <li key={`${point.id}-text-guide`}>
                      <small>{index + 1}</small>
                      <span>
                        <strong>{point.label}</strong>
                        <em>{point.description}</em>
                      </span>
                    </li>
                  ))}
                </ol>
                <p>
                  <strong>사진에 찾는 장소가 안 보이면</strong>
                  <span>
                    불편한 곳을 짐작하지 말고 아래에서 ‘다른 장소예요’ 또는 ‘잘 모르겠어요’를 눌러요.
                  </span>
                </p>
                <p className="human-review-guidance-reason">
                  {candidate.locationVerification?.reason
                    || '이 사진에서는 정확히 표시할 곳을 확인하지 못해 동그라미를 그리지 않았어요.'}
                </p>
                {guideAvailableOnAnotherImage ? (
                  <button
                    type="button"
                    onClick={() => handleDirectionChange(guidedDirection.key)}
                  >
                    동그라미가 표시된 사진으로 돌아가기
                  </button>
                ) : null}
              </div>
            )}
          </section>
        </section>
      </div>

      <section className="human-review-questions" aria-label="사진을 보고 답하기">
        <fieldset className="human-review-question">
          <legend><small>1</small><span>장소가 맞나요?</span></legend>
          <p>지도 이름과 사진 속 건물·출구·도로를 비교해 주세요.</p>
          <div className="human-review-choice-grid three">
            {PLACE_OPTIONS.map((option) => (
              <label key={option.value} className={draft.placeMatch === option.value ? 'selected' : ''}>
                <input
                  type="radio"
                  name={`place-${candidate.id}`}
                  value={option.value}
                  checked={draft.placeMatch === option.value}
                  onChange={() => handlePlaceMatch(option.value)}
                />
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="human-review-question" disabled={draft.placeMatch !== 'match'}>
          <legend><small>2</small><span>사진에서 무엇이 보이나요?</span></legend>
          <p>
            {guideKind === 'source_check_only'
              ? '사진이 같은 장소라면 주황색 동그라미 3곳에 답해 주세요. 이 답만으로 턱 높이, 길 너비, 기울기를 정하지 않아요.'
              : '사진이 같은 장소일 때만 아래 세 가지에 답해 주세요. 사진만 보고 높이, 길 너비, 기울기를 재거나 짐작하지 마세요.'}
          </p>
          <div className="human-review-observation-list">
            {activeReviewPoints.map((point, index) => (
              <div key={point.id} data-review-point-id={point.sourcePointId ?? point.id}>
                <span>
                  <b>{index + 1}</b>
                  <span>
                    <strong>{point.label}</strong>
                    <small>{point.description}</small>
                  </span>
                </span>
                <div>
                  {OBSERVATION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={draft.observationAnswers[point.id] === option.value ? 'selected' : ''}
                    >
                      <input
                        type="radio"
                        name={`${candidate.id}-${point.id}`}
                        value={option.value}
                        checked={draft.observationAnswers[point.id] === option.value}
                        onChange={() => handleObservationAnswer(point.id, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset
          className="human-review-question"
          disabled={!draft.placeMatch || (draft.placeMatch === 'match' && !observationComplete)}
        >
          <legend><small>3</small><span>{outcomeQuestionTitle}</span></legend>
          <p>{outcomeQuestionDescription}</p>
          <div className="human-review-choice-grid outcome">
            {OUTCOME_OPTIONS
              .filter((option) => allowedOutcomeValues.includes(option.value))
              .map((option) => {
              return (
                <label
                  key={option.value}
                  className={draft.outcome === option.value ? 'selected' : ''}
                >
                  <input
                    type="radio"
                    name={`outcome-${candidate.id}`}
                    value={option.value}
                    checked={draft.outcome === option.value}
                    onChange={() => updateDraft({ outcome: option.value })}
                  />
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </label>
              );
            })}
          </div>
          <label className="human-review-note">
            <span>덧붙일 말이 있으면 적어 주세요 <small>선택</small></span>
            <textarea
              rows="2"
              value={draft.note}
              onChange={(event) => updateDraft({ note: event.target.value })}
              placeholder="예: 출구 표지는 맞지만 턱 아래쪽이 차량에 가려져 있어요."
            />
          </label>
        </fieldset>
      </section>

      <footer className="human-review-savebar">
        <div>
          <strong>
            {readyToSave
              ? '이제 사람의 선택을 저장할 수 있어요'
              : draft.placeMatch === 'match' && !observationComplete
                ? '사진 항목 세 가지를 모두 답해 주세요'
                : '장소와 기록 방법을 선택해 주세요'}
          </strong>
          <span role="status" aria-live="polite">
            {saveError || (savedHere
              ? '이 장소의 기록을 저장했어요.'
              : reviewSync?.status === 'syncing'
                ? '기록을 저장하고 있어요.'
                : '선택한 내용은 이 장소 기록으로 저장됩니다.')}
          </span>
        </div>
        <button type="button" disabled={!readyToSave || saving} onClick={() => handleSave({ moveNext: true })}>
          {saving ? '저장 중' : '저장하고 다음 장소'}
        </button>
      </footer>

      {lightboxOpen ? (
        <div
          className={`human-review-lightbox ${lightboxOpen === 'map' ? 'map' : 'roadview'}`}
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
        >
          <button
            type="button"
            className="human-review-lightbox-close"
            autoFocus
            onClick={() => setLightboxOpen(false)}
          >
            닫기
          </button>
          <div className="human-review-lightbox-stage">
            <div className="human-review-lightbox-image-wrap">
              <img
                src={lightboxOpen === 'map'
                  ? `/modu50m/review-photos/kakao-maps/${candidate.id}-kakao-map.png`
                  : selectedDirection?.image}
                alt={lightboxOpen === 'map'
                  ? `${displayName} 카카오 지도 크게 보기`
                  : `${displayName} 카카오 로드뷰 크게 보기`}
              />
              {lightboxOpen === 'roadview' ? (
                <ReviewMarkerLayer regions={activeMarkerRegions} className="human-review-lightbox-markers" />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
