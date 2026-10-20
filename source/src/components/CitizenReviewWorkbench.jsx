import {
  ArrowsClockwise,
  CalendarBlank,
  CaretUp,
  Clock,
  Info,
  MapPin,
  MapTrifold,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import rawCandidates from '../data/candidates.json';
import locationVerification from '../data/locationVerification.generated.json';
import roadviewDirectionAssets from '../data/roadviewDirectionAssets.generated.js';
import roadviewAnalysisAssets from '../data/roadviewAnalysisAssets';
import { getPhotoAiDraft } from '../utils/photoAiDraft';
import './CitizenReviewWorkbench.css';

const DEFAULT_CANDIDATE_ID = 'L50-002';
const SELECTION_AI_UNAVAILABLE = Object.freeze({
  available: false,
  reason: 'selected_image_not_registered_for_online_ai',
});
const OBSERVATION_OPTIONS = [
  { value: 'seen', label: '보여요' },
  { value: 'not_seen', label: '안 보여요' },
  { value: 'unclear', label: '판단보류' },
];

const DEFAULT_CANDIDATE = (() => {
  const source = rawCandidates.find((item) => item.id === DEFAULT_CANDIDATE_ID) ?? {};
  return {
    ...source,
    locationVerification: locationVerification.candidates?.[DEFAULT_CANDIDATE_ID] ?? null,
  };
})();

function toFraction(value, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number > 1 ? number / 100 : number;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatReviewDate(value) {
  if (!value) return '촬영일 확인 전';
  const match = String(value).match(/^(\d{4})[-/.](\d{1,2})/);
  return match ? `${match[1]}년 ${String(match[2]).padStart(2, '0')}월` : String(value);
}

function normaliseRegion(region, index, source = 'review_guide') {
  const geometry = region?.region ?? region ?? {};
  const x = toFraction(geometry.centerX ?? geometry.x ?? geometry.xPercent, 0.5);
  const y = toFraction(geometry.centerY ?? geometry.y ?? geometry.yPercent, 0.5);
  const radius = clamp(toFraction(geometry.radius ?? geometry.size ?? 0.1, 0.1), 0.04, 0.25);
  return {
    id: region?.id ?? `citizen-point-${index + 1}`,
    sourcePointId: region?.sourcePointId ?? region?.id ?? `point-${index + 1}`,
    centerX: clamp(x, 0.04, 0.96),
    centerY: clamp(y, 0.05, 0.95),
    radius,
    label: region?.label ?? region?.area ?? `사진의 확인 위치 ${index + 1}`,
    question: region?.humanCheck ?? region?.question ?? region?.description ?? '이 위치에서 무엇이 보이나요?',
    nextEvidenceAction: region?.nextEvidenceAction ?? '',
    source: region?.source ?? source,
  };
}

function getEvidence(candidate) {
  return candidate?.locationVerification?.placeMatchEvidence
    ?? candidate?.placeMatchEvidence
    ?? {};
}

function getImageSelection(candidate) {
  return candidate?.roadviewImageSelection ?? null;
}

function getGuideRegions(candidate) {
  const evidence = getEvidence(candidate);
  const imageSelection = getImageSelection(candidate);
  const analysisAsset = roadviewAnalysisAssets[candidate?.id] ?? {};
  const guide = imageSelection?.primary?.guide
    ?? evidence.accessibilityObservationGuide
    ?? candidate?.locationVerification?.accessibilityObservationGuide
    ?? analysisAsset.sourceCheckGuide
    ?? [];
  const source = imageSelection?.primary?.guide ? 'astra_visual_review' : 'verified_image_guide';
  return guide.slice(0, 3).map((region, index) => normaliseRegion(region, index, source));
}

function getImageSource(candidate) {
  const analysisAsset = roadviewAnalysisAssets[candidate?.id] ?? {};
  const evidence = getEvidence(candidate);
  return getImageSelection(candidate)?.primary?.image
    ?? candidate?.reviewPhoto?.image
    ?? evidence.image
    ?? analysisAsset.image
    ?? '';
}

function getAlternateViews(candidate, primaryImage, suppliedViews) {
  const directionAsset = roadviewDirectionAssets[candidate?.id] ?? {};
  const imageSelection = getImageSelection(candidate);
  const selectionViews = imageSelection?.secondary?.image
    ? [{
      key: 'secondary',
      sourceKey: imageSelection.secondary.key,
      label: imageSelection.secondary.label ?? '보조 사진',
      image: imageSelection.secondary.image,
      panoId: imageSelection.secondary.panoId ?? '',
      captureDate: imageSelection.secondary.captureDate ?? '',
      addsEvidence: imageSelection.secondary.addsEvidence ?? '',
    }]
    : [];
  const directionViews = suppliedViews
    ?? candidate?.alternateViews
    ?? directionAsset.views
    ?? [];
  const seen = new Set([primaryImage]);
  return [...selectionViews, ...directionViews]
    .reduce((views, view) => {
      if (!view?.image || seen.has(view.image)) return views;
      seen.add(view.image);
      views.push({
        key: view.key ?? view.image,
        sourceKey: view.sourceKey ?? view.key ?? view.image,
        label: view.label ?? '다른 방향',
        image: view.image,
        panoId: view.panoId ?? directionAsset.panoId ?? candidate?.roadviewAsset?.panoId ?? '',
        captureDate: view.captureDate ?? '',
        addsEvidence: view.addsEvidence ?? '',
      });
      return views;
    }, []);
}

function getInitialAnswers(regions, initialAnswers) {
  if (!initialAnswers || typeof initialAnswers !== 'object') return {};
  return Object.fromEntries(
    regions
      .map((region) => [region.id, initialAnswers[region.id] ?? initialAnswers[region.sourcePointId]])
      .filter(([, answer]) => OBSERVATION_OPTIONS.some((option) => option.value === answer)),
  );
}

function getCompactLocation(candidate, evidence) {
  const address = evidence.address ?? candidate?.address ?? '';
  if (address) return String(address).replace(/\s+\d+(?:-\d+)?$/, '');
  return candidate?.locationVerification?.coordinateContext ?? '위치 정보 확인 전';
}

function buildReviewPayload({
  candidate,
  selectedView,
  regions,
  answers,
  aiDraft,
  regionSource,
  placeMatch,
  reviewMode,
}) {
  const evidence = getEvidence(candidate);
  const placeMatchOnly = reviewMode === 'place_match_only';
  const observationAnswers = placeMatch === 'match' && !placeMatchOnly
    ? Object.fromEntries(regions.map((region) => [region.sourcePointId, answers[region.id] ?? 'unclear']))
    : {};
  const followUpRequired = placeMatchOnly
    || placeMatch !== 'match'
    || regions.some((region) => answers[region.id] !== 'seen');
  return {
    schema: 'modu50m.citizen_one_frame_review.v1',
    status: 'recorded_pending_moderation',
    source: 'citizen_self_reported_photo_observation',
    humanEvidenceStatus: 'pending',
    reviewSurface: 'citizen',
    reviewMode,
    candidateId: candidate.id,
    placeName: candidate.name ?? evidence.placeName ?? '',
    placeMatch,
    observationAnswers,
    followUpRequired,
    selectedDirectionKey: selectedView?.sourceKey ?? selectedView?.key ?? 'primary',
    sourceSnapshot: {
      candidateId: candidate.id,
      image: selectedView?.image ?? '',
      panoId: selectedView?.panoId ?? evidence.panoId ?? '',
      imageSha256: evidence.imageSha256 ?? '',
      captureDate: selectedView?.captureDate ?? evidence.captureDate ?? '',
      placeId: evidence.placeId ?? '',
      guideSource: regionSource,
      guideState: placeMatchOnly ? 'guide_required' : regions.length === 3 ? 'three_regions_ready' : 'guide_required',
      sourcePointIds: regions.map((region) => region.sourcePointId),
      isPrimaryDirection: Boolean(selectedView?.isPrimary),
    },
    studentEvidencePromotion: false,
    taeyunEvidencePromotion: false,
    ai: {
      regionSource,
      analysisAvailable: Boolean(aiDraft?.available),
      responseId: aiDraft?.provenance?.responseId ?? '',
      accessibilityConclusion: 'not_made',
      safetyConclusion: 'not_made',
    },
    humanReview: {
      status: 'saved_citizen_observation',
      savedAt: new Date().toISOString(),
    },
    evidenceBoundary: {
      promotesToTaeyunDirectEvidence: false,
      promotesToStudentDirectEvidence: false,
      studentEvidenceStatus: 'pending',
      note: '시민 검수 저장만 기록하며 태윤이 직접 조사 증거를 자동 증가시키지 않습니다.',
    },
  };
}

/**
 * 시민이 사진 한 장을 보고 확인 위치를 기록하는 토스형 검수 워크벤치입니다.
 *
 * Props contract:
 * - candidate: App에서 전달하는 후보. id, name, reviewPhoto.image,
 *   locationVerification.placeMatchEvidence를 사용할 수 있습니다. 생략하면 L50-002를 사용합니다.
 * - candidateIndex / candidateCount: 상단 시민 검수 진행 표시(기본 0 / 6).
 * - aiRegions: AI가 반환한 최대 3개 정규화 영역({ centerX, centerY, radius, label, humanCheck }).
 *   전달하지 않으면 승인된 AI 결과를 읽고, 없을 때는 locationVerification의 사람 검수 가이드를 씁니다.
 * - roadviewVisionRun / onAnalyzeRoadview: 기존 온라인 로드뷰 AI 실행 경계입니다.
 *   실행 결과는 getPhotoAiDraft(candidate, roadviewVisionRun.result)로만 읽습니다.
 * - aiDraft: getPhotoAiDraft(candidate, runtimeResult)의 결과. AI는 접근 가능/안전 결론을 만들지 않습니다.
 * - review / initialAnswers: 기존 시민 검수 초안 또는 저장 값을 복원할 때 사용합니다.
 * - alternateViews: 다른 각도 보기 목록({ key, label, image, panoId }).
 * - onSave(payload): 저장 콜백. 컴포넌트는 localStorage나 학생 증거 상태를 수정하지 않습니다.
 * - onNext(payload): 저장 뒤 다음 후보로 이동할 때 선택적으로 호출합니다.
 * - onViewAlternate(view): 다른 각도를 연 사실을 기록할 선택적 콜백입니다.
 * - onOpenCoverage(): 대전 조사 현황 화면을 여는 선택적 콜백입니다.
 * - reviewMode: `full` 또는 장소 일치만 기록하는 `place_match_only`입니다.
 */
export default function CitizenReviewWorkbench({
  candidate: candidateProp,
  candidateIndex = 0,
  candidateCount = 6,
  aiRegions,
  aiDraft: aiDraftProp,
  roadviewVisionRun,
  onAnalyzeRoadview,
  review,
  initialAnswers,
  initialPlaceMatch,
  alternateViews,
  onSave,
  onNext,
  onViewAlternate,
  onOpenCoverage,
  coverageLabel = '대전 현황',
  reviewMode = 'full',
  className = '',
  disabled = false,
}) {
  const candidate = candidateProp ?? DEFAULT_CANDIDATE;
  const placeMatchOnly = reviewMode === 'place_match_only';
  const evidence = getEvidence(candidate);
  const imageSelection = getImageSelection(candidate);
  const hasAstraSelection = imageSelection?.reviewer?.model === 'gpt-6-astra'
    && imageSelection?.status === 'selected_pending_human_place_match';
  const onlineAiEligible = imageSelection?.onlineAiEligible !== false;
  const primaryImage = getImageSource(candidate);
  const rawAiDraft = useMemo(
    () => aiDraftProp ?? getPhotoAiDraft(candidate, roadviewVisionRun?.result ?? null),
    [aiDraftProp, candidate, roadviewVisionRun],
  );
  const aiDraft = useMemo(
    () => (onlineAiEligible ? rawAiDraft : SELECTION_AI_UNAVAILABLE),
    [onlineAiEligible, rawAiDraft],
  );
  const aiRegionsProvided = Array.isArray(aiRegions);
  const sourceRegions = useMemo(
    () => {
      if (aiDraft?.available !== true) return [];
      return aiRegionsProvided ? aiRegions : (aiDraft.attentionRegions ?? []);
    },
    [aiDraft, aiRegions, aiRegionsProvided],
  );
  const regionSource = sourceRegions.length > 0 && aiDraft?.available === true
    ? 'approved_online_ai'
    : imageSelection?.primary?.guide
      ? 'astra_visual_review'
      : 'verified_image_guide';
  const regions = useMemo(
    () => (sourceRegions.length > 0 ? sourceRegions : getGuideRegions(candidate))
      .slice(0, 3)
      .map((region, index) => normaliseRegion(region, index, regionSource)),
    [candidate, regionSource, sourceRegions],
  );
  const views = useMemo(
    () => [
      {
        key: 'primary',
        sourceKey: imageSelection?.primary?.key ?? 'primary',
        label: imageSelection?.primary?.label
          ?? (aiDraft?.available === true ? 'AI 분석 연결 사진' : '검수 기준 사진'),
        image: primaryImage,
        panoId: imageSelection?.primary?.panoId ?? evidence.panoId ?? '',
        captureDate: imageSelection?.primary?.captureDate ?? evidence.captureDate ?? '',
        selectionReason: imageSelection?.primary?.selectionReason ?? '',
        isPrimary: true,
      },
      ...getAlternateViews(candidate, primaryImage, alternateViews),
    ],
    [aiDraft, alternateViews, candidate, evidence.captureDate, evidence.panoId, imageSelection, primaryImage],
  );
  const [selectedViewKey, setSelectedViewKey] = useState('primary');
  const [answers, setAnswers] = useState(() => getInitialAnswers(
    regions,
    review?.observationAnswers ?? review?.answers ?? initialAnswers,
  ));
  const [placeMatch, setPlaceMatch] = useState(
    () => review?.placeMatch ?? review?.humanQuickReview?.placeMatch ?? initialPlaceMatch ?? '',
  );
  const [alternateOpen, setAlternateOpen] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const selectedView = views.find((view) => view.key === selectedViewKey) ?? views[0] ?? null;
  const reviewStateKey = `${candidate.id}:${regions.map((region) => region.id).join(',')}`;
  const [restoredReviewStateKey, setRestoredReviewStateKey] = useState(reviewStateKey);
  if (restoredReviewStateKey !== reviewStateKey) {
    setRestoredReviewStateKey(reviewStateKey);
    setAnswers(getInitialAnswers(
      regions,
      review?.observationAnswers ?? review?.answers ?? initialAnswers,
    ));
    setPlaceMatch(review?.placeMatch ?? review?.humanQuickReview?.placeMatch ?? initialPlaceMatch ?? '');
    setSelectedViewKey('primary');
    setSaveState('idle');
    setSaveError('');
    setImageFailed(false);
  }
  const markersVisible = Boolean(selectedView?.isPrimary);
  const answerCount = regions.filter((region) => answers[region.id]).length;
  const observationComplete = regions.length === 3 && answerCount === regions.length;
  const photoReady = Boolean(selectedView?.image && !imageFailed);
  const readyToSave = Boolean(placeMatch)
    && photoReady
    && (placeMatchOnly || placeMatch !== 'match' || observationComplete)
    && markersVisible
    && typeof onSave === 'function'
    && !disabled;
  const progressCount = Math.max(1, Number(candidateCount) || 1);
  const displayIndex = clamp(Number(candidateIndex) || 0, 0, progressCount - 1);
  const locationLabel = getCompactLocation(candidate, evidence);
  const reviewDate = formatReviewDate(imageSelection?.primary?.captureDate ?? evidence.captureDate ?? candidate.reviewPhoto?.captureDate);
  const isAiRegionSource = regionSource === 'approved_online_ai';
  const isAstraRegionSource = regionSource === 'astra_visual_review';
  const isApprovedOnlineAi = aiDraft?.available === true;
  const aiIsRunning = roadviewVisionRun?.status === 'loading';
  const aiHasError = roadviewVisionRun?.status === 'error';
  const placeMatchOptions = [
    { value: 'match', label: '같은 장소예요' },
    { value: 'mismatch', label: '다른 장소예요' },
    { value: 'unclear', label: '잘 모르겠어요' },
  ];

  function handleAnswer(regionId, value) {
    setAnswers((current) => ({ ...current, [regionId]: value }));
    setSaveState('idle');
    setSaveError('');
  }

  function handleSelectView(view) {
    setSelectedViewKey(view.key);
    setAlternateOpen(false);
    setAnswers({});
    setPlaceMatch('');
    setSaveState('idle');
    setSaveError('');
    setImageFailed(false);
    if (view.key !== 'primary') onViewAlternate?.(view);
  }

  function handlePlaceMatch(value) {
    setPlaceMatch(value);
    if (value !== 'match') setAnswers({});
    setSaveState('idle');
    setSaveError('');
  }

  function handleAnalyzeSelectedImage() {
    if (!onAnalyzeRoadview || aiIsRunning || !selectedView?.isPrimary || !onlineAiEligible) return;
    const analysisAsset = roadviewAnalysisAssets[candidate.id] ?? {};
    onAnalyzeRoadview(candidate.id, analysisAsset.directionKey ?? selectedView.key);
  }

  async function handleSave() {
    if (!readyToSave || !selectedView) return;
    setSaveState('saving');
    setSaveError('');
    const payload = buildReviewPayload({
      candidate,
      selectedView,
      regions,
      answers,
      aiDraft,
      regionSource,
      placeMatch,
      reviewMode,
    });
    try {
      await onSave(payload);
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
      setSaveError(error?.message || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }

  function handleNext() {
    if (saveState !== 'saved') return;
    onNext?.({ candidateId: candidate.id, saved: true });
  }

  return (
    <main
      className={`citizen-review-workbench ${hasAstraSelection ? 'has-astra-selection' : ''} ${className}`.trim()}
      data-candidate-id={candidate.id}
      data-review-state={saveState}
      data-region-source={regionSource}
    >
      <header className="citizen-workbench-topbar">
        <div className="citizen-brand-lockup" aria-label="모두의 50m 시민 검수">
          <strong>모두의 50m</strong>
          <span aria-hidden="true" />
          <b>시민 검수</b>
          <span aria-hidden="true" />
          <b>{evidence.placeName ?? candidate.name ?? '검수 장소'}</b>
        </div>
        <div className="citizen-workbench-progress" aria-label={`시민 검수 ${displayIndex + 1} / ${progressCount}`}>
          {onOpenCoverage ? (
            <button type="button" className="citizen-coverage-button" onClick={onOpenCoverage}>
              <MapTrifold size={18} weight="bold" aria-hidden="true" />
              {coverageLabel}
            </button>
          ) : null}
          <Clock className="citizen-timer-icon" size={22} weight="bold" aria-hidden="true" />
          <strong>1분 시민 검수</strong>
          <b>후보 {displayIndex + 1}/{progressCount}</b>
          <span className="citizen-progress-dots" aria-hidden="true">
            {Array.from({ length: progressCount }, (_, index) => (
              <i key={index} className={index === displayIndex ? 'active' : index < displayIndex ? 'done' : ''} />
            ))}
          </span>
        </div>
      </header>

      <div className="citizen-workbench-body">
        <section className="citizen-photo-column" aria-labelledby="citizen-photo-title">
          <div className="citizen-column-heading">
            <div>
              <h1 id="citizen-photo-title">
                검수할 사진
                <Info className="citizen-info-icon" size={19} weight="bold" aria-label="AI가 표시한 곳 또는 검수 기준을 보고 보이는 것만 답해 주세요." />
              </h1>
              <p>
                <MapPin size={16} weight="bold" aria-hidden="true" /> {locationLabel}
                <em aria-hidden="true">|</em>
                <CalendarBlank size={16} weight="bold" aria-hidden="true" /> {reviewDate}
              </p>
            </div>
            <span className={`citizen-source-pill ${isAiRegionSource ? 'ai' : isAstraRegionSource ? 'astra' : 'guide'}`}>
              {placeMatchOnly
                ? '장소 확인용 · 대표 보류'
                : isAiRegionSource
                  ? '온라인 AI 확인 위치'
                  : isAstraRegionSource
                    ? '대표 후보 · 사람 확인 전'
                    : '확인 기준'}
            </span>
          </div>
          <div className={`citizen-photo-frame ${markersVisible && regions.length ? 'has-markers' : ''}`}>
            {selectedView?.image && !imageFailed ? (
              <img
                src={selectedView.image}
                alt={`${candidate.name ?? '검수 장소'} ${selectedView.label}`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="citizen-photo-fallback" role="img" aria-label="검수용 사진을 불러오지 못함">
                <strong>검수용 사진을 불러오지 못했어요</strong>
                <span>다른 각도 보기에서 확인용 사진을 선택해 주세요.</span>
              </div>
            )}
            {markersVisible ? (
              <div className="citizen-photo-markers" aria-label="사진 위 확인 위치">
                {regions.map((region, index) => (
                  <span
                    className={`citizen-photo-marker marker-${index + 1}`}
                    key={region.id}
                    style={{
                      left: `${region.centerX * 100}%`,
                      top: `${region.centerY * 100}%`,
                      '--marker-radius': `${region.radius * 100}%`,
                    }}
                    title={`${index + 1}. ${region.label}`}
                  >
                    <i>{index + 1}</i>
                  </span>
                ))}
              </div>
            ) : null}
            <span className="citizen-image-expand-hint">
              {selectedView?.isPrimary
                ? `${hasAstraSelection ? '병렬 이미지 비교' : isApprovedOnlineAi ? 'AI 분석 사진' : '검수 기준 사진'} · ${selectedView?.label ?? '선택 전'}`
                : `보조 비교용 · ${selectedView?.label ?? '선택 전'}`}
            </span>
          </div>

          <div className="citizen-marker-legend" aria-label="사진 표시 설명">
            {regions.map((region, index) => (
              <div key={region.id} className={`citizen-legend-item tone-${index + 1}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{region.label}</strong>
                  <small>{index === 0 ? '목표 지점·출입구를 확인해요.' : index === 1 ? '접근·연결 구간을 다시 봐요.' : '가림·거리로 어려운 곳이에요.'}</small>
                </div>
              </div>
            ))}
          </div>

        </section>

        <section className="citizen-question-column" aria-labelledby="citizen-question-title">
          <div className="citizen-question-heading">
            <h2 id="citizen-question-title">
              {placeMatchOnly ? '이 사진이 찾는 장소와 맞나요?' : '마지막 50m에서 무엇을 확인하나요?'}
            </h2>
            <p>
              {placeMatchOnly
                ? '접근성을 보기 전에 잘못 연결된 사진부터 걸러냅니다.'
                : '지도 안내가 끝난 뒤 실제 출입구와 보행 연결이 어떻게 이어지는지 확인합니다.'}
            </p>
          </div>
          <section className={`citizen-research-brief ${placeMatchOnly ? 'is-hold' : hasAstraSelection ? 'is-astra' : ''}`} aria-label="모두의 50m 조사 방법">
            <div>
              <span>{placeMatchOnly ? '대표 이미지 선정 보류' : hasAstraSelection ? '이미지 비교 제안 · 사람 확인 전' : '모두의 50m 조사 방법'}</span>
              <strong>
                {placeMatchOnly
                  ? '사진이 있어도 실제 입구와 이어지는 길이 안 보이면 접근성 대표 사진으로 쓰지 않아요.'
                  : imageSelection?.primary?.selectionReason
                    ?? '공공 후보 수집 → 여러 방향 비교 → 사람이 최종 판단'}
              </strong>
            </div>
            <p>
              {placeMatchOnly
                ? imageSelection?.reason ?? '지금은 장소 일치만 확인하고, 필요한 다음 사진을 남깁니다.'
                : '가까운 사진보다 입구·바닥·보행 연결이 함께 보이는 한 장을 먼저 고르고, 빠진 근거는 보조 사진으로 확인합니다.'}
            </p>
          </section>
          <div className={`citizen-ai-status ${isApprovedOnlineAi ? 'ready' : aiHasError ? 'error' : 'pending'}`}>
            <span>
              {placeMatchOnly
                ? '접근성 3문항은 확인 가이드가 준비될 때까지 잠겨 있어요.'
                : hasAstraSelection
                  ? `병렬 이미지 검토로 재확인 위치 ${regions.length}곳을 제안했어요. 온라인 AI 실행 결과나 접근성 결론은 아닙니다.`
                : isApprovedOnlineAi
                ? '온라인 AI 결과를 반영했어요.'
                : aiHasError
                  ? 'AI 연결 실패 · 기존 검수 기준을 그대로 유지합니다.'
                  : 'AI 실행 전 · 기존 검수 기준을 먼저 표시하고 있어요.'}
            </span>
            {onAnalyzeRoadview && !placeMatchOnly ? (
              <button type="button" onClick={handleAnalyzeSelectedImage} disabled={aiIsRunning || !selectedView?.isPrimary || !onlineAiEligible}>
                {!onlineAiEligible
                  ? '새 대표 사진 AI 연결 전'
                  : aiIsRunning
                    ? 'AI 확인 중…'
                    : isApprovedOnlineAi
                      ? 'AI 표시 다시 보기'
                      : aiHasError
                        ? 'AI 다시 연결'
                        : 'AI에게 확인할 곳 찾게 하기'}
              </button>
            ) : null}
          </div>
          {!markersVisible ? (
            <div className="citizen-alternate-banner" role="status">
              <strong>보조 비교용 사진이에요.</strong>
              <span>{selectedView?.addsEvidence || '파노라마가 다를 수 있어 번호 표시와 관찰 저장을 잠시 멈췄어요. 대표 사진으로 돌아가 주세요.'}</span>
            </div>
          ) : null}

          <fieldset className="citizen-place-gate">
            <legend><span>① 먼저</span> 이 사진이 찾는 장소와 맞나요?</legend>
            <p>장소가 맞지 않거나 잘 모르겠으면 사진 관찰을 억지로 기록하지 않고 추가 확인으로 남겨요.</p>
            <div className="citizen-place-gate-options">
              {placeMatchOptions.map((option) => (
                <label className={placeMatch === option.value ? 'selected' : ''} key={option.value}>
                  <input
                    type="radio"
                    name={`citizen-place-match-${candidate.id}`}
                    value={option.value}
                    checked={placeMatch === option.value}
                    onChange={() => handlePlaceMatch(option.value)}
                    disabled={disabled || saveState === 'saving' || !markersVisible}
                  />
                  <span className="citizen-radio-ui" aria-hidden="true" />
                  <strong>{option.label}</strong>
                </label>
              ))}
            </div>
          </fieldset>

          {regions.length ? (
            <div className={`citizen-question-list ${placeMatch === 'match' && markersVisible ? '' : 'is-locked'}`}>
              {regions.map((region, index) => (
                <fieldset className={`citizen-question-card tone-${index + 1}`} key={region.id}>
                  <legend className="citizen-question-card-heading">
                    <span className="citizen-question-number">{index + 1}</span>
                    <span>
                      <strong>{region.label}</strong>
                      <small>{region.question}</small>
                    </span>
                    <CaretUp className="citizen-question-chevron" size={20} weight="bold" aria-hidden="true" />
                  </legend>
                  <div className="citizen-answer-grid">
                    {OBSERVATION_OPTIONS.map((option) => (
                      <label className={answers[region.id] === option.value ? 'selected' : ''} key={option.value}>
                        <input
                          type="radio"
                          name={`citizen-answer-${candidate.id}-${region.id}`}
                          value={option.value}
                          checked={answers[region.id] === option.value}
                          onChange={() => handleAnswer(region.id, option.value)}
                          disabled={disabled || saveState === 'saving' || !markersVisible || placeMatch !== 'match'}
                        />
                        <span className="citizen-radio-ui" aria-hidden="true" />
                        <strong>{option.label}</strong>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : (
            <div className="citizen-empty-state">
              <strong>{placeMatchOnly ? '접근성 확인 위치는 아직 준비되지 않았어요.' : '확인할 위치가 아직 준비되지 않았어요.'}</strong>
              <span>
                {placeMatchOnly
                  ? '이 화면에서는 장소 일치만 저장하며, 접근성 여부는 판단하지 않습니다.'
                  : 'AI가 결과를 만들지 못했거나 장소 일치 확인이 필요합니다. 판단보류 상태로 저장하지 말고 다른 각도를 확인해 주세요.'}
              </span>
            </div>
          )}

          <div className="citizen-action-row">
            <button
              type="button"
              className="citizen-secondary-button"
              onClick={placeMatchOnly && onOpenCoverage
                ? onOpenCoverage
                : () => setAlternateOpen((current) => !current)}
              disabled={disabled || (!placeMatchOnly && views.length < 2)}
            >
              {placeMatchOnly ? (
                <><MapTrifold size={20} weight="bold" aria-hidden="true" /> 확인 목록</>
              ) : (
                <><ArrowsClockwise size={20} weight="bold" aria-hidden="true" /> 다른 각도 보기</>
              )}
            </button>
            {saveState === 'saved' ? (
              <button type="button" className="citizen-primary-button saved" onClick={handleNext} disabled={!onNext}>
                저장했어요 · 다음 후보
              </button>
            ) : (
              <button type="button" className="citizen-primary-button" onClick={handleSave} disabled={!readyToSave || saveState === 'saving'}>
                {saveState === 'saving' ? '저장 중…' : '확인 내용 저장'}
              </button>
            )}
          </div>
          {saveError ? <p className="citizen-save-error" role="alert">{saveError}</p> : null}
          {saveState === 'saved' ? <p className="citizen-save-success" role="status">시민 관찰 기록만 저장했어요. 태윤이 직접 조사 증거에는 자동 반영되지 않습니다.</p> : null}

          {alternateOpen ? (
            <div className="citizen-alternate-panel" role="dialog" aria-label="다른 각도 선택">
              <div className="citizen-alternate-panel-header">
                <strong>같은 장소의 다른 각도</strong>
                <button type="button" onClick={() => setAlternateOpen(false)} aria-label="다른 각도 닫기">닫기</button>
              </div>
              <div className="citizen-alternate-grid">
                {views.map((view) => (
                  <button
                    type="button"
                    key={view.key}
                    className={view.key === selectedView?.key ? 'selected' : ''}
                    onClick={() => handleSelectView(view)}
                  >
                    <img src={view.image} alt="" />
                    <span>{view.label}</span>
                  </button>
                ))}
              </div>
              <p>보조 비교용 사진입니다. 다른 각도에는 기존 표시가 적용되지 않고 파노라마 ID가 다를 수 있어요. 위치가 같은지 먼저 확인하고, 확인할 위치가 보이지 않으면 판단보류로 남겨 주세요.</p>
            </div>
          ) : null}
        </section>
      </div>

      <footer className="citizen-boundary-footer">
        <Info size={23} weight="bold" aria-hidden="true" />
        <p>
          {placeMatchOnly
            ? '현재는 장소 일치만 기록합니다. 접근성 판단과 태윤 직접 증거로 자동 반영하지 않습니다.'
            : hasAstraSelection
              ? '이미지 비교는 대표 사진과 다시 볼 위치만 제안하고, 장소 일치와 최종 판단은 사람이 합니다.'
              : 'AI는 확인할 곳만 표시하고, 최종 판단은 사람이 합니다.'}
        </p>
      </footer>
    </main>
  );
}
