const CONFIRMED_LOCATION_STATUS = 'place_match_confirmed';

function hasExactRoadviewPrecheckEvidence(candidate) {
  const verification = candidate?.locationVerification ?? null;
  const evidence = verification?.placeMatchEvidence;

  return Boolean(
    verification?.status === 'place_match_required' &&
    evidence?.status === 'candidate_ready_for_human_match' &&
    evidence?.provider === 'kakao_map_roadview' &&
    evidence?.humanConfirmationStatus === 'pending' &&
    typeof evidence?.placeId === 'string' && evidence.placeId.length > 0 &&
    typeof evidence?.image === 'string' && evidence.image.startsWith('/modu50m/review-photos/') &&
    typeof evidence?.imageSha256 === 'string' && /^[a-f0-9]{64}$/.test(evidence.imageSha256)
  );
}

const BLOCKED_COPY = {
  context_conflict: {
    eyebrow: '사진·장소 불일치',
    title: '장소가 맞지 않아요',
    description: '지금 사진은 입력된 후보 장소를 보여 준다고 볼 수 없어요.',
  },
  place_match_required: {
    eyebrow: '장소 확인 필요',
    title: '장소 확인이 먼저예요',
    description: '시설명이나 주변 표지가 사진에서 확인되기 전에는 접근성을 판단하지 않아요.',
  },
  roadview_distance_warning: {
    eyebrow: '사진 거리 주의',
    title: '사진이 후보에서 너무 멀어요',
    description: '먼 거리의 로드뷰로는 목적지 앞 장벽을 확인할 수 없어요.',
  },
  stale_roadview: {
    eyebrow: '촬영 시점 주의',
    title: '사진이 너무 오래됐어요',
    description: '현재 상태와 다를 수 있어 최신 사진이나 현장 확인이 필요해요.',
  },
  field_check_required: {
    eyebrow: '현장 확인 필요',
    title: '로드뷰 대신 직접 확인해요',
    description: '카카오 장소는 확인됐지만 마지막 30~50m를 보여 주는 사진이 부족해요.',
  },
  missing: {
    eyebrow: '장소 근거 없음',
    title: '장소를 먼저 확인해요',
    description: '좌표와 사진이 같은 장소라는 근거가 아직 없어요.',
  },
};

export function getLocationReviewGate(candidate) {
  const verification = candidate?.locationVerification ?? null;
  const status = verification?.status ?? 'missing';
  const reviewReady = status === CONFIRMED_LOCATION_STATUS;
  const roadviewPrecheckAllowed = reviewReady || hasExactRoadviewPrecheckEvidence(candidate);
  const copy = BLOCKED_COPY[status] ?? BLOCKED_COPY.missing;

  if (reviewReady) {
    return {
      status,
      reviewReady: true,
      roadviewPrecheckAllowed: true,
      analysisAllowed: true,
      checklistAllowed: true,
      allowedDecisionValues: ['published', 'field_check_needed', 'rejected'],
      eyebrow: '장소 일치 확인',
      title: '이제 접근성을 확인해요',
      description: '후보 장소와 사진이 같은 지점이라는 근거가 확인됐어요.',
      coordinateContext: verification?.coordinateContext ?? candidate?.address ?? '좌표 주변 지명 미기록',
      reason: verification?.reason ?? '장소 일치 근거가 확인되었습니다.',
      requiredAction: verification?.requiredAction ?? '사진에서 접근성 항목을 확인합니다.',
      memoPlaceholder: '예: 입구 앞 턱이 사진에서 가려져 있어요',
    };
  }

  return {
    status,
    reviewReady: false,
    roadviewPrecheckAllowed,
    analysisAllowed: false,
    checklistAllowed: false,
    allowedDecisionValues: ['field_check_needed', 'rejected'],
    ...copy,
    coordinateContext: verification?.coordinateContext ?? candidate?.address ?? '좌표 주변 지명 미확인',
    reason: verification?.reason ?? '후보 설명과 사진이 같은 장소인지 확인되지 않았습니다.',
    requiredAction: verification?.requiredAction ?? '카카오맵에서 후보 좌표와 시설명을 다시 맞춥니다.',
    memoPlaceholder: '예: 사진의 장소 표지와 입력된 후보명이 서로 맞지 않아요',
  };
}

export function getCustomerReadyCandidates(candidates = []) {
  return candidates.filter((candidate) => getLocationReviewGate(candidate).reviewReady);
}

export function getCustomerPlaceMatchCandidates(candidates = []) {
  return candidates.filter((candidate) => {
    const gate = getLocationReviewGate(candidate);
    const evidence = candidate?.locationVerification?.placeMatchEvidence;

    return (
      !gate.reviewReady &&
      gate.roadviewPrecheckAllowed &&
      evidence?.status === 'candidate_ready_for_human_match'
    );
  });
}

export function getCustomerFieldVisitCandidates(candidates = []) {
  return candidates.filter((candidate) => {
    const gate = getLocationReviewGate(candidate);
    const plan = candidate?.locationVerification?.fieldVisitPlan;

    return (
      !gate.reviewReady &&
      gate.status === 'field_check_required' &&
      plan?.status === 'pending_student_field_visit' &&
      plan?.provider === 'kakao_map_field_visit' &&
      plan?.humanEvidenceStatus === 'pending' &&
      typeof plan?.placeId === 'string' && plan.placeId.length > 0 &&
      typeof plan?.placeUrl === 'string' && plan.placeUrl.startsWith('https://place.map.kakao.com/') &&
      typeof plan?.mapUrl === 'string' && plan.mapUrl.startsWith('https://map.kakao.com/') &&
      typeof plan?.directionsUrl === 'string' && plan.directionsUrl.startsWith('https://map.kakao.com/') &&
      Array.isArray(plan?.checkpoints) && plan.checkpoints.length > 0
    );
  });
}
