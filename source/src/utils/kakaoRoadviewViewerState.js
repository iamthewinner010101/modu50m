import {
  ACCESSIBILITY_STATUS_OPTIONS,
  PLACE_MATCH_STATUS_OPTIONS,
  STUDENT_REVIEW_STATUS_OPTIONS,
  getDaejeonCandidateReviewStatusLabel,
} from './daejeonCandidateReviewLedger.js';

const UNCHECKED_STATUS = 'unchecked';

function normalizeStatus(value, options) {
  return options.some((option) => option.value === value) ? value : UNCHECKED_STATUS;
}

function reviewStatus(review, field, options) {
  return normalizeStatus(review?.[field], options);
}

export function getRoadviewViewerReviewState(review = null) {
  const placeMatchStatus = reviewStatus(review, 'placeMatchStatus', PLACE_MATCH_STATUS_OPTIONS);
  const accessibilityStatus = reviewStatus(review, 'accessibilityStatus', ACCESSIBILITY_STATUS_OPTIONS);
  const studentReviewStatus = reviewStatus(review, 'studentReviewStatus', STUDENT_REVIEW_STATUS_OPTIONS);
  const studentReviewLabel = review === null || review === undefined
    ? '확인 전'
    : getDaejeonCandidateReviewStatusLabel(STUDENT_REVIEW_STATUS_OPTIONS, studentReviewStatus);

  return {
    placeMatchStatus,
    placeMatchLabel: getDaejeonCandidateReviewStatusLabel(PLACE_MATCH_STATUS_OPTIONS, placeMatchStatus),
    accessibilityStatus,
    accessibilityLabel: getDaejeonCandidateReviewStatusLabel(
      ACCESSIBILITY_STATUS_OPTIONS,
      accessibilityStatus,
    ),
    studentReviewStatus,
    studentReviewLabel,
  };
}

export function getRoadviewViewerPresentation({ isLive = false, showStoredFallback = false } = {}) {
  if (isLive) {
    return {
      kind: 'live',
      headerLabel: 'LIVE 360°',
      title: 'LIVE 360°',
      badge: 'LIVE 360°',
      stageLabel: 'LIVE 360° 로드뷰 표시 영역',
    };
  }

  if (showStoredFallback) {
    return {
      kind: 'stored',
      headerLabel: '저장된 로드뷰 기록 이미지',
      title: '저장된 로드뷰 기록 이미지',
      badge: '기록 이미지',
      stageLabel: '저장된 로드뷰 기록 이미지 표시 영역',
      imageLabel: '저장된 로드뷰 기록 이미지',
      imageCaption: '저장된 로드뷰 기록 이미지 · 360도 조작 불가',
    };
  }

  return {
    kind: 'unavailable',
    headerLabel: 'LIVE 360°',
    title: 'LIVE 360° 연결 상태',
    badge: '미검증',
    stageLabel: 'LIVE 360° 로드뷰 표시 영역',
  };
}
