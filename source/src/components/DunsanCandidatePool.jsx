import { useEffect, useMemo, useRef, useState } from 'react';
import candidatePool from '../data/dunsanCandidatePool.json';
import generatedRoadview from '../data/dunsanCandidateRoadview.generated.json';
import bundledSixReview from '../data/dunsanSixReview20260724.json';

const MAX_SELECTION = 12;
const STORAGE_KEY = 'modu50m-dunsan-candidate-selection-v1';
const REVIEW_STORAGE_KEY = 'modu50m-dunsan-candidate-review-v1';

const OBSERVATION_OPTIONS = [
  { value: 'seen', label: '보여요' },
  { value: 'not_seen', label: '안 보여요' },
  { value: 'unclear', label: '모르겠어요' },
];
const OBSERVATION_VALUES = new Set(OBSERVATION_OPTIONS.map((option) => option.value));
const WHEELCHAIR_ENTRY_OPTIONS = [
  {
    value: 'route_visible', label: '들어갈 길이 보여요',
    description: '계단 없이 출입구까지 이어지는 길이 사진에서 보여요.',
  },
  {
    value: 'difficulty_visible', label: '들어가기 어려워 보여요',
    description: '계단, 높은 턱, 좁거나 막힌 길처럼 불편한 부분이 보여요.',
  },
  {
    value: 'photo_unclear', label: '사진만으로 모르겠어요',
    description: '길의 폭, 경사, 문턱이나 출입구가 선명하지 않아요.',
  },
];
const WHEELCHAIR_ENTRY_VALUES = new Set(WHEELCHAIR_ENTRY_OPTIONS.map((option) => option.value));
const FIELD_DECISION_OPTIONS = [
  {
    value: 'not_required', label: '로드뷰로 확인 가능',
    description: '사진에서 필요한 부분을 확인할 수 있어 직접 방문하지 않아도 돼요.',
  },
  {
    value: 'required', label: '현장에서 다시 확인 필요',
    description: '사진만으로 판단하기 어려워 직접 가서 확인해야 해요.',
  },
];
const FIELD_DECISION_VALUES = new Set(FIELD_DECISION_OPTIONS.map((option) => option.value));
const REVIEW_SURFACES = ['presentation', 'candidate'];

const STATUS_LABELS = {
  roadview: {
    pending: '로드뷰 확인 전',
    not_started: '로드뷰 확인 전',
    ready: '로드뷰 이미지 준비됨',
    usable: '로드뷰 이미지 준비됨',
    matched: '장소와 사진 연결됨',
    candidate_scene_needs_place_check: '장면 수집됨 · 장소 확인 전',
    field_first: '로드뷰만으로 부족 · 현장 우선',
    stale: '촬영 오래됨 · 재확인 필요',
    unavailable: '로드뷰 없음',
    missing: '로드뷰 없음',
    mismatch: '장소와 사진 재확인 필요',
    excluded: '후보에서 제외됨',
  },
  ai: {
    pending: 'AI 실행 전',
    not_run: 'AI 실행 전',
    not_started: 'AI 실행 전',
    ready: 'AI 관찰 준비됨',
    completed: 'AI 관찰 있음',
    failed: 'AI 확인 실패',
    unavailable: 'AI 확인 불가',
  },
  human: {
    pending: '사람 확인 전',
    not_started: '사람 확인 전',
    in_progress: '사람 확인 중',
    completed: '사람 확인 기록 있음',
    verified: '사람 확인 기록 있음',
  },
  wheelchair: {
    pending: '사람 판단 전',
    route_visible: '사진에서 들어갈 길이 보임',
    difficulty_visible: '사진에서 어려운 부분이 보임',
    photo_unclear: '사진만으로 판단 어려움',
  },
  field: {
    pending: '현장 확인 전',
    not_started: '현장 확인 전',
    required: '현장 확인 필요',
    in_progress: '현장 확인 중',
    completed: '현장 기록 있음',
    verified: '현장 기록 있음',
    not_required: '현재 현장 확인 대상 아님',
  },
};

const STATUS_TITLES = {
  roadview: '로드뷰',
  ai: '접근성 AI',
  human: '사람 확인',
  wheelchair: '휠체어 입장',
  field: '현장 확인',
};

const CONFIDENCE_LABELS = {
  high: '장면 근거 선명',
  medium: '사람 대조 필요',
  low: '로드뷰 근거 부족',
};

const COMPLETE_STATUS = new Set(['ready', 'usable', 'matched', 'completed', 'verified', 'not_required', 'route_visible']);
const BLOCKED_STATUS = new Set(['unavailable', 'missing', 'mismatch', 'failed', 'excluded', 'stale', 'difficulty_visible']);

function normalizeText(item) {
  if (typeof item === 'string') return item;
  return item?.label ?? item?.question ?? item?.title ?? item?.text ?? '';
}

function getAsset(candidateId) {
  return generatedRoadview?.assets?.[candidateId] ?? {};
}

function mergeCandidate(candidate) {
  const asset = getAsset(candidate.id);
  return {
    ...candidate,
    image: asset.image || candidate.image || '',
    kakaoRoadviewUrl: asset.roadviewUrl || candidate.kakaoRoadviewUrl || '',
    roadviewAsset: asset,
  };
}

const CANDIDATES = candidatePool.map(mergeCandidate);
const CANDIDATE_IDS = new Set(CANDIDATES.map((candidate) => candidate.id));
const PRESENTATION_CANDIDATES = CANDIDATES
  .filter((candidate) => candidate.presentation?.enabled)
  .sort((left, right) => left.presentation.order - right.presentation.order);
const PRESENTATION_COUNT = PRESENTATION_CANDIDATES.length;

function readStoredSelection() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    const ids = Array.isArray(saved) ? saved : saved?.selectedIds;
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids)].filter((id) => CANDIDATE_IDS.has(id)).slice(0, MAX_SELECTION);
  } catch {
    return [];
  }
}

function getCandidateReviewStorageKey() {
  if (typeof window === 'undefined') return `${REVIEW_STORAGE_KEY}:default`;
  const searchParams = new URLSearchParams(window.location.search);
  const workspace = (searchParams.get('workspace') || 'default')
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'default';
  return `${REVIEW_STORAGE_KEY}:${workspace}`;
}

function getBundledCandidateReviewSeed() {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('seed') !== bundledSixReview.seedId) return null;
  if (searchParams.get('workspace') !== bundledSixReview.workspace) return null;
  return bundledSixReview;
}

function getReviewSurface(presentationView) {
  return presentationView ? 'presentation' : 'candidate';
}

function readStoredCandidateReviews() {
  if (typeof window === 'undefined') return {};
  try {
    const storedText = window.localStorage.getItem(getCandidateReviewStorageKey());
    const saved = storedText ? JSON.parse(storedText) : getBundledCandidateReviewSeed();
    const reviews = saved?.reviews && typeof saved.reviews === 'object' ? saved.reviews : {};
    return Object.fromEntries(
      Object.entries(reviews)
        .filter(([candidateId, review]) => CANDIDATE_IDS.has(candidateId) && review && typeof review === 'object')
        .map(([candidateId, review]) => {
          const candidate = CANDIDATES.find((item) => item.id === candidateId);
          const expectedPointsById = Object.fromEntries([
            ...getReviewPoints(candidate, true),
            ...getReviewPoints(candidate, false),
          ].map((point) => [point.id, point.label]));
          const pointAnswers = Object.fromEntries(
            Object.entries(review.pointAnswers ?? {})
              .filter(([pointId, answer]) => (
                /^(presentation|candidate)-point-[1-3]$/.test(pointId) &&
                OBSERVATION_VALUES.has(answer) &&
                review.pointLabels?.[pointId] === expectedPointsById[pointId]
              )),
          );
          const pointLabels = Object.fromEntries(
            Object.keys(pointAnswers).map((pointId) => [pointId, expectedPointsById[pointId]]),
          );
          const fieldDecisions = Object.fromEntries(
            Object.entries(review.fieldDecisions ?? {})
              .filter(([surface, decision]) => (
                REVIEW_SURFACES.includes(surface) &&
                FIELD_DECISION_VALUES.has(decision)
              )),
          );
          const wheelchairEntryAssessments = Object.fromEntries(
            Object.entries(review.wheelchairEntryAssessments ?? {})
              .filter(([surface, assessment]) => (
                REVIEW_SURFACES.includes(surface) &&
                WHEELCHAIR_ENTRY_VALUES.has(assessment)
              )),
          );
          const recordStatuses = {};
          const savedAtBySurface = {};
          REVIEW_SURFACES.forEach((surface) => {
            const surfacePoints = getReviewPoints(candidate, surface === 'presentation');
            const allPointsAnswered = (
              surfacePoints.length > 0 &&
              surfacePoints.every((point) => pointAnswers[point.id])
            );
            const hasDraft = (
              surfacePoints.some((point) => pointAnswers[point.id]) ||
              Boolean(wheelchairEntryAssessments[surface]) ||
              Boolean(fieldDecisions[surface])
            );
            if (
              review.recordStatuses?.[surface] === 'saved' &&
              allPointsAnswered &&
              wheelchairEntryAssessments[surface] &&
              fieldDecisions[surface] &&
              typeof review.savedAtBySurface?.[surface] === 'string'
            ) {
              recordStatuses[surface] = 'saved';
              savedAtBySurface[surface] = review.savedAtBySurface[surface];
            } else if (hasDraft) {
              recordStatuses[surface] = 'draft';
            }
          });
          return [candidateId, {
            ...review,
            pointAnswers,
            pointLabels,
            wheelchairEntryAssessments,
            fieldDecisions,
            recordStatuses,
            savedAtBySurface,
            humanEvidenceStatus: 'pending',
          }];
        }),
    );
  } catch {
    return {};
  }
}

function getReviewPoints(candidate, presentationView) {
  if (!candidate) return [];
  const sourcePoints = presentationView
    ? candidate.presentation?.observationPoints ?? []
    : candidate.roadviewChecks ?? [];
  return sourcePoints
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, 3)
    .map((label, index) => ({
      id: `${presentationView ? 'presentation' : 'candidate'}-point-${index + 1}`,
      label,
    }));
}

function getStatusValue(candidate, kind) {
  if (kind === 'roadview' && candidate.roadviewAsset?.freshnessStatus === 'stale') {
    return 'stale';
  }
  if (kind === 'roadview' && candidate.roadviewAsset?.sceneStatus) {
    return candidate.roadviewAsset.sceneStatus;
  }
  if (candidate.status && typeof candidate.status === 'object' && candidate.status[kind]) {
    return candidate.status[kind];
  }
  if (kind === 'field' && typeof candidate.fieldCheck === 'string') {
    const fieldValue = candidate.fieldCheck.toLowerCase();
    if (/필요|required/.test(fieldValue)) return 'required';
  }
  return 'pending';
}

function getCoreLinkLabel(candidate) {
  if (candidate.coreCandidateId) {
    return `핵심 후보 ${candidate.coreCandidateId}와 연결 · 검수 전 PENDING`;
  }
  return '핵심 후보 편입 전 PENDING';
}

function getStatusLabel(kind, value) {
  const normalized = String(value ?? 'pending').toLowerCase();
  if (STATUS_LABELS[kind]?.[normalized]) return STATUS_LABELS[kind][normalized];
  if (/[가-힣]/.test(String(value ?? ''))) return String(value);
  return `${STATUS_TITLES[kind]} 확인 필요`;
}

function getStatusTone(value) {
  const normalized = String(value ?? 'pending').toLowerCase();
  if (COMPLETE_STATUS.has(normalized)) return 'done';
  if (BLOCKED_STATUS.has(normalized)) return 'attention';
  return 'pending';
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ''));
}

function CandidateImage({ candidate, compact = false, annotate = false, lightbox = false }) {
  if (candidate.image) {
    return (
      <div
        className={[
          'dunsan-candidate-image-frame',
          compact ? 'compact' : '',
          lightbox ? 'lightbox' : '',
          annotate ? 'annotated' : '',
        ].filter(Boolean).join(' ')}
      >
        <img
          src={candidate.image}
          alt={`${candidate.name} 로드뷰 후보 화면`}
          loading="lazy"
        />
        {annotate && candidate.presentation?.destination ? (
          <>
            <span
              className="dunsan-destination-marker"
              style={{
                left: `${candidate.presentation.destination.xPercent}%`,
                top: `${candidate.presentation.destination.yPercent}%`,
              }}
            >
              <i aria-hidden="true" />
              <strong>{candidate.presentation.destination.label}</strong>
            </span>
            {(candidate.presentation.observationPoints ?? []).map((point, index) => (
              <span
                className="dunsan-observation-marker"
                key={`${candidate.id}-${point.label}`}
                style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
                title={`${index + 1}. ${point.label}`}
                aria-label={`${index + 1}. ${point.label}`}
              >
                {index + 1}
              </span>
            ))}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`dunsan-image-placeholder ${compact ? 'compact' : ''}`} role="img" aria-label={`${candidate.name} 이미지 준비 중`}>
      <span>카카오 로드뷰</span>
      <strong>이미지 연결 전</strong>
    </div>
  );
}

export default function DunsanCandidatePool({ onBack }) {
  const [selectedIds, setSelectedIds] = useState(readStoredSelection);
  const [candidateReviews, setCandidateReviews] = useState(readStoredCandidateReviews);
  const [reviewStorageStatus, setReviewStorageStatus] = useState('idle');
  const [saveNotice, setSaveNotice] = useState('');
  const [presentationView, setPresentationView] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [group, setGroup] = useState('전체');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [activeId, setActiveId] = useState(PRESENTATION_CANDIDATES[0]?.id ?? CANDIDATES[0]?.id ?? '');
  const [expandedId, setExpandedId] = useState('');
  const [selectionNotice, setSelectionNotice] = useState('');
  const expandTriggerRef = useRef(null);
  const detailTriggerRef = useRef(null);
  const detailHeadingRef = useRef(null);
  const modalPanelRef = useRef(null);
  const reviewStorageKey = getCandidateReviewStorageKey();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const groups = useMemo(
    () => ['전체', ...new Set(CANDIDATES.map((candidate) => candidate.group).filter(Boolean))],
    [],
  );
  const visibleCandidates = useMemo(
    () => {
      if (presentationView) return PRESENTATION_CANDIDATES;
      return CANDIDATES.filter((candidate) => (
        (group === '전체' || candidate.group === group) &&
        (!showSelectedOnly || selectedSet.has(candidate.id))
      ));
    },
    [group, presentationView, selectedSet, showSelectedOnly],
  );
  const presentationReviewSummary = useMemo(() => {
    let savedCount = 0;
    let fieldFollowupCount = 0;
    for (const candidate of PRESENTATION_CANDIDATES) {
      const review = candidateReviews[candidate.id] ?? {};
      if (review.recordStatuses?.presentation !== 'saved') continue;
      savedCount += 1;
      if (review.fieldDecisions?.presentation === 'required') fieldFollowupCount += 1;
    }
    return { savedCount, fieldFollowupCount };
  }, [candidateReviews]);
  const activeCandidate = visibleCandidates.find((candidate) => candidate.id === activeId)
    ?? visibleCandidates[0]
    ?? null;
  const expandedCandidate = CANDIDATES.find((candidate) => candidate.id === expandedId) ?? null;
  const reviewSurface = getReviewSurface(presentationView);
  const activeReviewPoints = getReviewPoints(activeCandidate, presentationView);
  const activeReview = activeCandidate ? candidateReviews[activeCandidate.id] ?? {} : {};
  const activePointAnswers = activeCandidate
    ? activeReview.pointAnswers ?? {}
    : {};
  const answeredPointCount = activeReviewPoints.filter((point) => activePointAnswers[point.id]).length;
  const activeWheelchairEntryAssessment = activeReview.wheelchairEntryAssessments?.[reviewSurface] ?? '';
  const activeFieldDecision = activeReview.fieldDecisions?.[reviewSurface] ?? '';
  const activeRecordStatus = activeReview.recordStatuses?.[reviewSurface] ?? 'draft';
  const activeSavedAt = activeReview.savedAtBySurface?.[reviewSurface] ?? '';
  const activeAllPointsAnswered = (
    activeReviewPoints.length > 0 &&
    answeredPointCount === activeReviewPoints.length
  );
  const activeCanSave = (
    activeAllPointsAnswered &&
    WHEELCHAIR_ENTRY_VALUES.has(activeWheelchairEntryAssessment) &&
    FIELD_DECISION_VALUES.has(activeFieldDecision) &&
    !(activeWheelchairEntryAssessment === 'photo_unclear' && activeFieldDecision === 'not_required')
  );
  const activeReviewComplete = (
    activeCanSave &&
    activeRecordStatus === 'saved'
  );
  const activeHasUnclearAnswer = activeReviewPoints
    .some((point) => activePointAnswers[point.id] === 'unclear');
  const activeCandidateId = activeCandidate?.id ?? '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(reviewStorageKey)) return;
    const seed = getBundledCandidateReviewSeed();
    if (!seed) return;
    window.localStorage.setItem(reviewStorageKey, JSON.stringify({
      schema: seed.schema,
      seedId: seed.seedId,
      source: seed.source,
      reviews: candidateReviews,
    }));
    setReviewStorageStatus('saved');
  }, [candidateReviews, reviewStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        schema: 'modu50m-dunsan-candidate-selection.v1',
        selectedIds,
      }));
    } catch {
      // The UI still works for this visit when browser storage is unavailable.
    }
  }, [selectedIds]);

  useEffect(() => {
    if (!expandedCandidate || typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setExpandedId('');
      if (event.key === 'Tab') {
        event.preventDefault();
        modalPanelRef.current?.querySelector('button')?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.requestAnimationFrame(() => expandTriggerRef.current?.focus());
    };
  }, [expandedCandidate]);

  useEffect(() => {
    if (!detailOpen || !activeCandidateId || typeof window === 'undefined') return undefined;
    window.scrollTo({ top: 0, behavior: 'auto' });
    const focusFrame = window.requestAnimationFrame(() => detailHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [activeCandidateId, detailOpen]);

  function openExpandedImage(candidateId, trigger) {
    setActiveId(candidateId);
    expandTriggerRef.current = trigger;
    setExpandedId(candidateId);
  }

  function openCandidateDetail(candidateId, trigger) {
    if (!CANDIDATE_IDS.has(candidateId)) return;
    detailTriggerRef.current = trigger ?? null;
    setActiveId(candidateId);
    setExpandedId('');
    setReviewStorageStatus('idle');
    setSaveNotice('');
    setDetailOpen(true);
  }

  function closeCandidateDetail() {
    setDetailOpen(false);
    setExpandedId('');
    setReviewStorageStatus('idle');
    setSaveNotice('');
    window.requestAnimationFrame(() => detailTriggerRef.current?.focus());
  }

  function toggleCandidate(candidateId) {
    setSelectionNotice('');
    if (selectedSet.has(candidateId)) {
      setSelectedIds((current) => current.filter((id) => id !== candidateId));
      return;
    }
    if (selectedIds.length >= MAX_SELECTION) {
      setSelectionNotice(`최대 ${MAX_SELECTION}곳까지 선택할 수 있어요. 먼저 한 곳을 빼 주세요.`);
      return;
    }
    setSelectedIds((current) => [...current, candidateId]);
  }

  function persistCandidateReviews(nextReviews) {
    try {
      window.localStorage.setItem(reviewStorageKey, JSON.stringify({
        schema: 'modu50m-dunsan-candidate-review.v1',
        reviews: nextReviews,
      }));
      setReviewStorageStatus('saved');
      return true;
    } catch {
      setReviewStorageStatus('error');
      return false;
    }
  }

  function updatePointAnswer(candidateId, pointId, pointLabel, answer) {
    const candidate = CANDIDATES.find((item) => item.id === candidateId);
    const presentationPoint = pointId.startsWith('presentation-');
    const surface = getReviewSurface(presentationPoint);
    const expectedPoint = getReviewPoints(candidate, presentationPoint)
      .find((point) => point.id === pointId);
    if (
      !candidate ||
      !/^(presentation|candidate)-point-[1-3]$/.test(pointId) ||
      expectedPoint?.label !== pointLabel ||
      !OBSERVATION_VALUES.has(answer)
    ) {
      return;
    }
    const previous = candidateReviews[candidateId] ?? {};
    const savedAtBySurface = { ...(previous.savedAtBySurface ?? {}) };
    const wheelchairEntryAssessments = { ...(previous.wheelchairEntryAssessments ?? {}) };
    const fieldDecisions = { ...(previous.fieldDecisions ?? {}) };
    delete savedAtBySurface[surface];
    delete wheelchairEntryAssessments[surface];
    delete fieldDecisions[surface];
    const nextReviews = {
      ...candidateReviews,
      [candidateId]: {
        ...previous,
        source: 'person_selected_photo_observation',
        humanEvidenceStatus: 'pending',
        pointAnswers: {
          ...(previous.pointAnswers ?? {}),
          [pointId]: answer,
        },
        pointLabels: {
          ...(previous.pointLabels ?? {}),
          [pointId]: pointLabel,
        },
        wheelchairEntryAssessments,
        fieldDecisions,
        recordStatuses: {
          ...(previous.recordStatuses ?? {}),
          [surface]: 'draft',
        },
        savedAtBySurface,
        updatedAt: new Date().toISOString(),
      },
    };
    persistCandidateReviews(nextReviews);
    setCandidateReviews(nextReviews);
    setSaveNotice('');
  }

  function updateWheelchairEntryAssessment(candidateId, surface, assessment) {
    const candidate = CANDIDATES.find((item) => item.id === candidateId);
    if (
      !candidate ||
      !REVIEW_SURFACES.includes(surface) ||
      !WHEELCHAIR_ENTRY_VALUES.has(assessment)
    ) {
      return;
    }
    const reviewPoints = getReviewPoints(candidate, surface === 'presentation');
    const previous = candidateReviews[candidateId] ?? {};
    const pointAnswers = previous.pointAnswers ?? {};
    if (
      reviewPoints.length === 0 ||
      !reviewPoints.every((point) => pointAnswers[point.id])
    ) {
      return;
    }
    const savedAtBySurface = { ...(previous.savedAtBySurface ?? {}) };
    const fieldDecisions = { ...(previous.fieldDecisions ?? {}) };
    delete savedAtBySurface[surface];
    delete fieldDecisions[surface];
    const nextReviews = {
      ...candidateReviews,
      [candidateId]: {
        ...previous,
        source: 'person_selected_photo_observation',
        humanEvidenceStatus: 'pending',
        wheelchairEntryAssessments: {
          ...(previous.wheelchairEntryAssessments ?? {}),
          [surface]: assessment,
        },
        fieldDecisions,
        recordStatuses: {
          ...(previous.recordStatuses ?? {}),
          [surface]: 'draft',
        },
        savedAtBySurface,
        updatedAt: new Date().toISOString(),
      },
    };
    persistCandidateReviews(nextReviews);
    setCandidateReviews(nextReviews);
    setSaveNotice('');
  }

  function updateFieldDecision(candidateId, surface, decision) {
    const candidate = CANDIDATES.find((item) => item.id === candidateId);
    if (
      !candidate ||
      !REVIEW_SURFACES.includes(surface) ||
      !FIELD_DECISION_VALUES.has(decision)
    ) {
      return;
    }
    const reviewPoints = getReviewPoints(candidate, surface === 'presentation');
    const previous = candidateReviews[candidateId] ?? {};
    const pointAnswers = previous.pointAnswers ?? {};
    const wheelchairEntryAssessment = previous.wheelchairEntryAssessments?.[surface];
    if (
      reviewPoints.length === 0 ||
      !reviewPoints.every((point) => pointAnswers[point.id]) ||
      !WHEELCHAIR_ENTRY_VALUES.has(wheelchairEntryAssessment) ||
      (wheelchairEntryAssessment === 'photo_unclear' && decision === 'not_required')
    ) {
      return;
    }
    const savedAtBySurface = { ...(previous.savedAtBySurface ?? {}) };
    delete savedAtBySurface[surface];
    const nextReviews = {
      ...candidateReviews,
      [candidateId]: {
        ...previous,
        source: 'person_selected_photo_observation',
        humanEvidenceStatus: 'pending',
        fieldDecisions: {
          ...(previous.fieldDecisions ?? {}),
          [surface]: decision,
        },
        recordStatuses: {
          ...(previous.recordStatuses ?? {}),
          [surface]: 'draft',
        },
        savedAtBySurface,
        updatedAt: new Date().toISOString(),
      },
    };
    persistCandidateReviews(nextReviews);
    setCandidateReviews(nextReviews);
    setSaveNotice('');
  }

  function saveCandidateReviewRecord(candidateId, surface) {
    const candidate = CANDIDATES.find((item) => item.id === candidateId);
    const previous = candidateReviews[candidateId] ?? {};
    const reviewPoints = getReviewPoints(candidate, surface === 'presentation');
    const pointAnswers = previous.pointAnswers ?? {};
    const wheelchairEntryAssessment = previous.wheelchairEntryAssessments?.[surface];
    const fieldDecision = previous.fieldDecisions?.[surface];
    if (
      !candidate ||
      !REVIEW_SURFACES.includes(surface) ||
      reviewPoints.length === 0 ||
      !reviewPoints.every((point) => pointAnswers[point.id]) ||
      !WHEELCHAIR_ENTRY_VALUES.has(wheelchairEntryAssessment) ||
      (wheelchairEntryAssessment === 'photo_unclear' && fieldDecision === 'not_required') ||
      !FIELD_DECISION_VALUES.has(fieldDecision)
    ) {
      setSaveNotice('세 곳, 휠체어 입장 판단, 현장 확인 여부를 모두 선택해 주세요.');
      return;
    }
    const savedAt = new Date().toISOString();
    const nextReviews = {
      ...candidateReviews,
      [candidateId]: {
        ...previous,
        source: 'person_selected_photo_observation',
        humanEvidenceStatus: 'pending',
        recordStatuses: {
          ...(previous.recordStatuses ?? {}),
          [surface]: 'saved',
        },
        savedAtBySurface: {
          ...(previous.savedAtBySurface ?? {}),
          [surface]: savedAt,
        },
        updatedAt: savedAt,
      },
    };
    if (!persistCandidateReviews(nextReviews)) {
      setSaveNotice('저장할 수 없어요. 브라우저 저장 공간을 확인한 뒤 다시 눌러 주세요.');
      return;
    }
    setCandidateReviews(nextReviews);
    setSaveNotice('검수 기록을 저장했어요.');
  }

  function changeView(nextPresentationView) {
    setPresentationView(nextPresentationView);
    setDetailOpen(false);
    setSelectionNotice('');
    setReviewStorageStatus('idle');
    setSaveNotice('');
    setExpandedId('');
    if (nextPresentationView) {
      setActiveId(PRESENTATION_CANDIDATES[0]?.id ?? '');
      return;
    }
    setActiveId(CANDIDATES[0]?.id ?? '');
  }

  return (
    <main className="customer-app-shell dunsan-candidate-shell" data-customer-state="dunsan-candidate-pool">
      <div
        className="dunsan-candidate-content"
        inert={Boolean(expandedCandidate)}
        aria-hidden={expandedCandidate ? 'true' : undefined}
      >
      {!detailOpen ? (
      <>
      <header className="dunsan-candidate-header">
        <div>
          <p className="customer-kicker">{presentationView ? '먼저 확인할 장소' : '둔산 후보 준비 목록'}</p>
          <h1>
            {presentationView
              ? <>마지막 50m를 보여 줄<br />여섯 장소예요</>
              : <>다음에 확인할 장소를<br />직접 골라요</>}
          </h1>
          {presentationView ? (
            <p>
              병원부터 생활시설까지, 목적지와 마지막 접근 길이 함께 보이는 장면만 골랐어요.
              사진의 <strong>도착지점</strong>과 숫자 원을 따라가면 무엇을 확인할지 바로 알 수 있어요.
            </p>
          ) : (
            <p>
              사진과 장소를 먼저 살펴보고 최대 {MAX_SELECTION}곳을 선택해 주세요.
              선택만으로 핵심 검수 대상이 되지는 않습니다.
            </p>
          )}
        </div>
        <button type="button" className="customer-mode-link" onClick={onBack}>사용자 화면으로 돌아가기</button>
      </header>

      <section className="dunsan-presentation-tabs" aria-label="후보 화면 선택">
        <button
          type="button"
          className={presentationView ? 'active' : ''}
          aria-pressed={presentationView}
          onClick={() => changeView(true)}
        >
          먼저 확인할 6곳
        </button>
        <button
          type="button"
          className={!presentationView ? 'active' : ''}
          aria-pressed={!presentationView}
          onClick={() => changeView(false)}
        >
          전체 후보 20곳
        </button>
      </section>

      {presentationView ? (
        <section className="dunsan-selection-summary presentation" aria-label="먼저 확인할 장소 구성">
          <div>
            <span>확인할 장소</span>
            <strong>{PRESENTATION_COUNT}<small>곳</small></strong>
          </div>
          <p>
            한 장소를 한 장에 보여 줍니다.
            목적지 → 사진에서 보이는 근거 → 사람이 다시 확인할 일을 같은 순서로 설명해요.
          </p>
          <span className="dunsan-pending-boundary">
            {presentationReviewSummary.savedCount > 0
              ? `사진 검수 ${presentationReviewSummary.savedCount}곳 저장됨 · 현장 확인 ${presentationReviewSummary.fieldFollowupCount}곳 필요`
              : '사진 검수 기록 전'}
          </span>
        </section>
      ) : (
        <>
          <section className="dunsan-selection-summary" aria-label="둔산 후보 선택 상태">
            <div>
              <span>선택한 후보</span>
              <strong aria-live="polite">{selectedIds.length}<small> / {MAX_SELECTION}</small></strong>
            </div>
            <p>
              이 선택은 이 기기의 준비 목록에만 저장됩니다.
              핵심 12개 후보와 태윤 검수 수치는 바뀌지 않습니다.
            </p>
            <span className="dunsan-pending-boundary">선택 후보는 모두 검수 전 PENDING</span>
          </section>

          <section className="dunsan-filter-bar" aria-label="후보 그룹 필터">
            <div className="dunsan-group-filters">
              {groups.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={group === item ? 'active' : ''}
                  aria-pressed={group === item}
                  onClick={() => setGroup(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`dunsan-selected-filter ${showSelectedOnly ? 'active' : ''}`}
              aria-pressed={showSelectedOnly}
              onClick={() => setShowSelectedOnly((current) => !current)}
            >
              선택한 후보만 보기
            </button>
          </section>
        </>
      )}

      {selectionNotice ? <p className="dunsan-selection-notice" role="status">{selectionNotice}</p> : null}
      </>
      ) : null}

      <div className={`dunsan-pool-layout ${detailOpen ? 'detail-open' : ''}`}>
        {!detailOpen ? (
        <section className="dunsan-candidate-grid" aria-label={`둔산 후보 ${visibleCandidates.length}곳`}>
          {visibleCandidates.map((candidate) => {
            const selected = selectedSet.has(candidate.id);
            const selectionDisabled = !selected && selectedIds.length >= MAX_SELECTION;
            const roadviewStatus = getStatusValue(candidate, 'roadview');
            const candidateReviewSurface = getReviewSurface(presentationView);
            const candidateReview = candidateReviews[candidate.id] ?? {};
            const candidateReviewPoints = getReviewPoints(candidate, presentationView);
            const candidatePointAnswers = candidateReview.pointAnswers ?? {};
            const candidateAnswerCount = candidateReviewPoints
              .filter((point) => candidatePointAnswers[point.id])
              .length;
            const candidateWheelchairEntryAssessment = (
              candidateReview.wheelchairEntryAssessments?.[candidateReviewSurface]
            );
            const candidateFieldDecision = candidateReview.fieldDecisions?.[candidateReviewSurface];
            const reviewComplete = (
              candidateReviewPoints.length > 0 &&
              candidateAnswerCount === candidateReviewPoints.length &&
              WHEELCHAIR_ENTRY_VALUES.has(candidateWheelchairEntryAssessment) &&
              FIELD_DECISION_VALUES.has(candidateFieldDecision) &&
              !(candidateWheelchairEntryAssessment === 'photo_unclear' && candidateFieldDecision === 'not_required') &&
              candidateReview.recordStatuses?.[candidateReviewSurface] === 'saved'
            );
            return (
              <article
                className={`dunsan-candidate-card ${selected ? 'selected' : ''} ${reviewComplete ? 'review-complete' : ''}`}
                key={candidate.id}
                data-candidate-id={candidate.id}
                data-core-link={candidate.coreCandidateId || 'unlinked'}
                data-review-status={reviewComplete ? 'completed' : 'pending'}
                data-promotion-status={candidate.coreCandidateId ? 'linked_pending_review' : 'pending'}
              >
                <button
                  type="button"
                  className="dunsan-card-preview"
                  aria-label={`${candidate.name} 검수 화면 열기`}
                  onClick={(event) => openCandidateDetail(candidate.id, event.currentTarget)}
                >
                  <CandidateImage candidate={candidate} compact />
                  <span className="dunsan-card-pending">
                    {presentationView ? `${candidate.presentation.order} / ${PRESENTATION_COUNT}` : 'PENDING'}
                  </span>
                  <span className={`dunsan-card-review-state ${reviewComplete ? 'complete' : ''}`}>
                    {reviewComplete
                      ? '검수 완료'
                      : candidateAnswerCount === candidateReviewPoints.length
                        ? `${candidateAnswerCount}/${candidateReviewPoints.length} 확인 · 저장 전`
                        : `${candidateAnswerCount}/${candidateReviewPoints.length} 확인`}
                  </span>
                  <span className="dunsan-image-expand-hint">큰 화면으로 보기</span>
                </button>
                <div className="dunsan-card-copy">
                  <span>{presentationView ? candidate.presentation.category : candidate.group || '그룹 확인 전'}</span>
                  <h2>{candidate.name}</h2>
                  <p>{presentationView ? candidate.presentation.headline : candidate.address}</p>
                  <small className={`dunsan-card-status ${getStatusTone(roadviewStatus)}`}>
                    {presentationView ? '도착지점과 확인할 곳 표시됨' : getStatusLabel('roadview', roadviewStatus)}
                  </small>
                </div>
                {presentationView ? (
                  <button
                    type="button"
                    className="dunsan-card-select"
                    onClick={(event) => openCandidateDetail(candidate.id, event.currentTarget)}
                  >
                    {reviewComplete
                      ? '검수 내용 다시 보기'
                      : candidateAnswerCount === candidateReviewPoints.length
                        ? '검수 기록 저장하기'
                        : '이 장소에서 확인할 점 보기'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dunsan-card-select"
                    aria-pressed={selected}
                    disabled={selectionDisabled}
                    onClick={() => toggleCandidate(candidate.id)}
                  >
                    {selected ? '선택 해제' : selectionDisabled ? '12곳 선택됨' : '이 후보 선택'}
                  </button>
                )}
              </article>
            );
          })}
          {visibleCandidates.length === 0 ? (
            <div className="dunsan-empty-filter">
              <strong>조건에 맞는 후보가 없어요</strong>
              <p>그룹을 바꾸거나 ‘선택한 후보만 보기’를 꺼 주세요.</p>
            </div>
          ) : null}
        </section>
        ) : null}

        {detailOpen && activeCandidate ? (
          <section className="dunsan-detail-screen" aria-labelledby="dunsan-detail-title">
            <header className="dunsan-detail-screen-header">
              <button type="button" onClick={closeCandidateDetail}>장소 목록으로</button>
              <div>
                <span>
                  {presentationView
                    ? activeCandidate.presentation?.category
                    : activeCandidate.group || '그룹 확인 전'}
                </span>
                <strong className={activeReviewComplete ? 'complete' : ''}>
                  {activeReviewComplete
                    ? '검수 완료'
                    : activeAllPointsAnswered
                      ? `${answeredPointCount}/${activeReviewPoints.length} 확인 · 저장 전`
                      : `${answeredPointCount}/${activeReviewPoints.length} 확인`}
                </strong>
              </div>
            </header>
          <aside className="dunsan-candidate-detail dunsan-candidate-detail-page" aria-label={`${activeCandidate.name} 상세 정보`}>
            {activeCandidate.image ? (
              <button
                type="button"
                className="dunsan-detail-image-button"
                aria-label={`${activeCandidate.name} 사진 크게 보기`}
                onClick={(event) => openExpandedImage(activeCandidate.id, event.currentTarget)}
              >
                <CandidateImage
                  candidate={activeCandidate}
                  annotate={presentationView && Boolean(activeCandidate.presentation?.enabled)}
                />
                <span className="dunsan-image-expand-hint">사진 크게 보기</span>
              </button>
            ) : <CandidateImage candidate={activeCandidate} />}
            <header>
              <span>
                {presentationView
                  ? `${activeCandidate.presentation?.order} / ${PRESENTATION_COUNT} · ${activeCandidate.presentation?.category}`
                  : activeCandidate.group || '그룹 확인 전'}
              </span>
              <h1 id="dunsan-detail-title" ref={detailHeadingRef} tabIndex="-1">{activeCandidate.name}</h1>
              <p>{activeCandidate.address}</p>
              <strong>{getCoreLinkLabel(activeCandidate)}</strong>
            </header>

            {presentationView && activeCandidate.presentation?.enabled ? (
              <section className="dunsan-presentation-story" aria-label="확인할 내용">
                <span>이 장소의 핵심</span>
                <h3>{activeCandidate.presentation.headline}</h3>
                <p>{activeCandidate.presentation.question}</p>
                <small>
                  파란 표시는 도착지점, 숫자 원은 사진에서 사람이 다시 볼 곳이에요.
                </small>
              </section>
            ) : null}

            <div className="dunsan-kakao-links" aria-label="카카오 원자료 링크">
              {isHttpUrl(activeCandidate.kakaoPlaceUrl) ? (
                <a href={activeCandidate.kakaoPlaceUrl} target="_blank" rel="noreferrer">카카오 장소 보기</a>
              ) : <span>카카오 장소 링크 준비 중</span>}
              {isHttpUrl(activeCandidate.kakaoRoadviewUrl) ? (
                <a href={activeCandidate.kakaoRoadviewUrl} target="_blank" rel="noreferrer">카카오 로드뷰 보기</a>
              ) : <span>카카오 로드뷰 링크 준비 중</span>}
            </div>

            {(activeCandidate.placeId || activeCandidate.roadviewAsset?.captureDate || activeCandidate.roadviewAsset?.panoId || Number.isFinite(activeCandidate.roadviewAsset?.targetDistanceMeters)) ? (
              <dl className="dunsan-roadview-meta">
                {activeCandidate.placeId ? <><dt>카카오 장소 ID</dt><dd>{activeCandidate.placeId}</dd></> : null}
                {activeCandidate.roadviewAsset.captureDate ? <><dt>촬영일</dt><dd>{activeCandidate.roadviewAsset.captureDate}</dd></> : null}
                {activeCandidate.roadviewAsset.panoId ? <><dt>파노라마</dt><dd>{activeCandidate.roadviewAsset.panoId}</dd></> : null}
                {Number.isFinite(activeCandidate.roadviewAsset.targetDistanceMeters) ? (
                  <><dt>후보와 거리</dt><dd>{activeCandidate.roadviewAsset.targetDistanceMeters}m</dd></>
                ) : null}
              </dl>
            ) : null}

            {activeCandidate.roadviewAsset?.selectionReason ? (
              <section
                className={`dunsan-scene-selection ${activeCandidate.roadviewAsset.fieldFirst ? 'needs-field' : ''}`}
                aria-label="AI 로드뷰 장면 선택 근거"
              >
                <span>사진 선택 AI</span>
                <h3>{activeCandidate.roadviewAsset.auditCandidateCount}개 장면을 비교했어요</h3>
                <p>{activeCandidate.roadviewAsset.selectionReason}</p>
                <small>
                  {CONFIDENCE_LABELS[activeCandidate.roadviewAsset.visualConfidence] ?? '사람 대조 필요'}
                  {' · '}장소 일치와 접근 가능 여부는 아직 사람이 확인해야 해요.
                </small>
                {activeCandidate.roadviewAsset.fieldFirst ? (
                  <strong>다음 확인: {normalizeText(activeCandidate.fieldCheck)}</strong>
                ) : null}
              </section>
            ) : null}

            <section
              className="dunsan-review-focus"
              data-review-answer-count={answeredPointCount}
              aria-labelledby={`dunsan-review-title-${activeCandidate.id}`}
            >
              <div className="dunsan-review-focus-header">
                <div>
                  <h3 id={`dunsan-review-title-${activeCandidate.id}`}>사진에서 세 곳을 확인해 주세요</h3>
                  <p>각 번호가 가리키는 곳을 보고 사진에 잘 보이는지 골라 주세요.</p>
                </div>
                <strong className={`dunsan-review-progress ${answeredPointCount === activeReviewPoints.length ? 'complete' : ''}`}>
                  {answeredPointCount}/{activeReviewPoints.length} 기록
                </strong>
              </div>
              {activeCandidate.reviewFocus ? <p>{activeCandidate.reviewFocus}</p> : null}
              <div className="dunsan-review-check-list">
                {activeReviewPoints.map((point, index) => (
                  <fieldset className="dunsan-review-check-item" key={point.id}>
                    <legend>
                      <small>{index + 1}</small>
                      <span>{point.label}</span>
                    </legend>
                    <div className="dunsan-review-answer-grid">
                      {OBSERVATION_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={activePointAnswers[point.id] === option.value ? 'selected' : ''}
                        >
                          <input
                            type="radio"
                            name={`dunsan-review-${activeCandidate.id}-${point.id}`}
                            value={option.value}
                            checked={activePointAnswers[point.id] === option.value}
                            onChange={() => updatePointAnswer(activeCandidate.id, point.id, point.label, option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <p className="dunsan-review-save-note" role="status" aria-live="polite">
                {reviewStorageStatus === 'error' && answeredPointCount > 0
                  ? `${answeredPointCount}곳을 골랐지만 저장할 수 없어 현재 화면에만 기록됐어요.`
                  : activeAllPointsAnswered
                  ? '세 곳을 모두 골랐어요. 이제 휠체어가 들어갈 길이 보이는지 선택해 주세요.'
                  : answeredPointCount > 0
                    ? `${answeredPointCount}곳을 기록했어요. 남은 곳도 사진을 보고 골라 주세요.`
                    : '사진에서 판단하기 어렵다면 ‘모르겠어요’를 선택하면 됩니다.'}
              </p>
            </section>

            <section
              className="dunsan-wheelchair-assessment"
              data-wheelchair-entry-assessment={activeWheelchairEntryAssessment || 'not_selected'}
              aria-labelledby={`dunsan-wheelchair-title-${activeCandidate.id}`}
            >
              <div>
                <h3 id={`dunsan-wheelchair-title-${activeCandidate.id}`}>이 사진에서 휠체어가 들어갈 수 있는 길이 보이나요?</h3>
                <p>위의 세 곳을 함께 보고, 사진에서 보이는 모습대로 한 가지를 골라 주세요.</p>
              </div>
              <div className="dunsan-wheelchair-options">
                {WHEELCHAIR_ENTRY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={activeWheelchairEntryAssessment === option.value ? 'selected' : ''}
                  >
                    <input
                      type="radio"
                      name={`dunsan-wheelchair-entry-${activeCandidate.id}-${reviewSurface}`}
                      value={option.value}
                      checked={activeWheelchairEntryAssessment === option.value}
                      disabled={!activeAllPointsAnswered}
                      onChange={() => updateWheelchairEntryAssessment(
                        activeCandidate.id,
                        reviewSurface,
                        option.value,
                      )}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
              {!activeAllPointsAnswered ? (
                <small>위의 세 곳을 모두 고르면 선택할 수 있어요.</small>
              ) : (
                <small>이 답은 사진을 본 사람의 판단이며, 실제 입장 가능 여부는 현장과 다를 수 있어요.</small>
              )}
            </section>

            <section
              className="dunsan-field-decision"
              data-field-decision={activeFieldDecision || 'not_selected'}
              aria-labelledby={`dunsan-field-decision-title-${activeCandidate.id}`}
            >
              <div>
                <h3 id={`dunsan-field-decision-title-${activeCandidate.id}`}>이 사진만으로 확인을 끝낼 수 있나요?</h3>
                <p>세 곳을 모두 본 뒤, 직접 가서 다시 볼 필요가 있는지 사람이 선택해요.</p>
              </div>
              <div className="dunsan-field-decision-options">
                {FIELD_DECISION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={activeFieldDecision === option.value ? 'selected' : ''}
                  >
                    <input
                      type="radio"
                      name={`dunsan-field-decision-${activeCandidate.id}-${reviewSurface}`}
                      value={option.value}
                      checked={activeFieldDecision === option.value}
                      disabled={(
                        !activeAllPointsAnswered ||
                        !activeWheelchairEntryAssessment ||
                        (activeWheelchairEntryAssessment === 'photo_unclear' && option.value === 'not_required')
                      )}
                      onChange={() => updateFieldDecision(activeCandidate.id, reviewSurface, option.value)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
              {!activeAllPointsAnswered ? (
                <small>위의 세 곳을 모두 고르면 선택할 수 있어요.</small>
              ) : !activeWheelchairEntryAssessment ? (
                <small>먼저 휠체어가 들어갈 길이 사진에서 보이는지 선택해 주세요.</small>
              ) : activeWheelchairEntryAssessment === 'photo_unclear' ? (
                <small>사진만으로 판단하기 어려우므로 ‘현장에서 다시 확인 필요’를 선택해 주세요.</small>
              ) : activeHasUnclearAnswer ? (
                <small>‘모르겠어요’가 있다면 직접 확인이 필요한지 한 번 더 생각해 주세요.</small>
              ) : (
                <small>이 판단은 AI가 아니라 로드뷰를 본 사람이 정합니다.</small>
              )}
            </section>

            <section
              className="dunsan-review-save-action"
              data-record-status={activeReviewComplete ? 'saved' : 'draft'}
              aria-label="검수 기록 저장"
            >
              <div>
                <h3>{activeReviewComplete ? '검수 기록이 저장됐어요' : '선택한 내용을 기록할까요?'}</h3>
                <p>
                  {activeReviewComplete
                    ? '다시 확인할 때 같은 장소의 검수 내용으로 불러옵니다.'
                    : '저장 버튼을 눌러야 이 장소의 검수 기록이 완료됩니다.'}
                </p>
                {activeReviewComplete && activeSavedAt ? (
                  <small>마지막 저장 {new Date(activeSavedAt).toLocaleString('ko-KR')}</small>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!activeCanSave || activeReviewComplete}
                onClick={() => saveCandidateReviewRecord(activeCandidate.id, reviewSurface)}
              >
                {activeReviewComplete ? '저장 완료' : '검수 기록 저장'}
              </button>
              {saveNotice ? <strong role="status" aria-live="polite">{saveNotice}</strong> : null}
            </section>

            <section className="dunsan-status-list" aria-label="현재 확인 상태">
              <h3>현재 확인 상태</h3>
              {Object.keys(STATUS_TITLES).map((kind) => {
                let value = getStatusValue(activeCandidate, kind);
                let label = getStatusLabel(kind, value);
                if (activeReviewComplete && kind === 'roadview') {
                  value = 'pending';
                  label = '사진 검수 기록됨 · 장소 확인 전';
                } else if (activeReviewComplete && kind === 'human') {
                  value = 'completed';
                  label = '검수 기록 저장됨';
                } else if (activeReviewComplete && kind === 'wheelchair') {
                  value = activeWheelchairEntryAssessment;
                  label = getStatusLabel('wheelchair', activeWheelchairEntryAssessment);
                } else if (activeReviewComplete && kind === 'field') {
                  value = activeFieldDecision;
                  label = activeFieldDecision === 'not_required'
                    ? '로드뷰로 확인 가능 · 현장 확인 필요 없음'
                    : '현장 확인 필요';
                } else if (kind === 'human' && answeredPointCount > 0) {
                  value = 'in_progress';
                  label = reviewStorageStatus === 'error'
                    ? `${answeredPointCount}/${activeReviewPoints.length} 현재 화면에만 기록됨`
                    : `${answeredPointCount}/${activeReviewPoints.length} 선택됨 · 저장 전`;
                } else if (kind === 'wheelchair' && activeWheelchairEntryAssessment) {
                  value = 'pending';
                  label = '휠체어 입장 판단 선택됨 · 저장 전';
                } else if (kind === 'wheelchair') {
                  value = 'pending';
                  label = '사람 판단 전';
                } else if (kind === 'field' && activeFieldDecision) {
                  value = 'pending';
                  label = '현장 확인 여부 선택됨 · 저장 전';
                } else if (kind === 'field') {
                  value = 'pending';
                  label = '현장 확인 전';
                }
                return (
                  <p key={kind}>
                    <span>{STATUS_TITLES[kind]}</span>
                    <strong className={getStatusTone(value)}>{label}</strong>
                  </p>
                );
              })}
              {activeReviewComplete && activeFieldDecision === 'required' && activeCandidate.fieldCheck ? (
                <small>직접 확인할 때 참고: {normalizeText(activeCandidate.fieldCheck)}</small>
              ) : null}
              {activeReviewComplete ? (
                <small>휠체어 입장 항목은 사진을 보고 남긴 사람 판단이며 현장 확정 기록은 아닙니다.</small>
              ) : null}
            </section>
          </aside>
          </section>
        ) : null}
      </div>
      </div>

      {expandedCandidate?.image ? (
        <div
          className="dunsan-image-lightbox"
          onClick={(event) => {
            if (event.target === event.currentTarget) setExpandedId('');
          }}
        >
          <section
            ref={modalPanelRef}
            className="dunsan-image-lightbox-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dunsan-expanded-image-title"
            aria-describedby="dunsan-expanded-image-note"
          >
            <header>
              <div>
                <span>카카오 로드뷰 크게 보기</span>
                <h2 id="dunsan-expanded-image-title">{expandedCandidate.name}</h2>
              </div>
              <button type="button" autoFocus onClick={() => setExpandedId('')} aria-label="확대 사진 닫기">
                닫기
              </button>
            </header>

            <div className="dunsan-image-lightbox-stage">
              <CandidateImage
                candidate={expandedCandidate}
                annotate={presentationView && Boolean(expandedCandidate.presentation?.enabled)}
                lightbox
              />
            </div>

            <footer id="dunsan-expanded-image-note">
              <div>
                <strong>
                  {presentationView && expandedCandidate.presentation?.enabled
                    ? '도착지점과 숫자 원 3곳'
                    : '이 사진에서 확인할 곳'}
                </strong>
                <span>
                  {presentationView && expandedCandidate.presentation?.enabled
                    ? '도착지점을 먼저 찾고 숫자 원을 차례로 살펴보세요. 접근 가능 여부는 사람 검수 뒤 기록합니다.'
                    : '사진을 크게 보는 기능이며 접근 가능 여부는 아직 사람 확인 전입니다.'}
                </span>
              </div>
              <ol>
                {(presentationView && expandedCandidate.presentation?.enabled
                  ? expandedCandidate.presentation.observationPoints
                  : expandedCandidate.roadviewChecks ?? [])
                  .map(normalizeText)
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((focus, index) => (
                    <li key={`${index}-${focus}`}><small>{index + 1}</small><span>{focus}</span></li>
                  ))}
              </ol>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
