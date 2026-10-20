import { useState } from 'react';
import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { getLocationReviewGate } from '../utils/locationReviewGate';
import { getPhotoAiDraft, getPhotoHumanComparison } from '../utils/photoAiDraft';

const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;

const SEVERITY_LABELS = {
  unknown: '라벨 미정',
  low: '낮음',
  medium: '중간',
  high: '높음',
  field_check_needed: '현장 확인 필요',
};

const AGREEMENT_LABELS = {
  unknown: '비교 미정',
  match: '일치',
  partial: '부분 일치',
  mismatch: '불일치',
  hold: '판단 보류',
};

function getVisionStatusMessage(run) {
  if (!run) return '온라인 서버와 OpenAI API 키가 있을 때만 분석합니다. 오프라인에서는 실행하지 않습니다.';
  if (run.status === 'loading') return '온라인 GPT-5.6 Sol이 로드뷰 이미지를 분석하고 있습니다.';
  if (run.status === 'loaded') return '온라인 분석 응답이 검증되었습니다. 최종 판단은 아직 사람 검수 대기입니다.';
  const messages = {
    ONLINE_VISION_REQUIRED: '온라인 서버 또는 OpenAI API 키가 없어 분석을 시작하지 않았습니다.',
    ONLINE_VISION_UNAVAILABLE: '인터넷 연결이 없어 분석을 실행하지 않았습니다. 로컬 AI로 대신하지 않습니다.',
    API_UNAVAILABLE: '온라인 분석 서버에 연결할 수 없어 분석을 실행하지 않았습니다.',
    VISION_CREDENTIAL_REJECTED: 'OpenAI API 키가 거부되어 분석 결과를 저장하지 않았습니다.',
    VISION_PROVIDER_ERROR: '온라인 AI가 분석을 완료하지 못해 결과를 저장하지 않았습니다.',
    VISION_PROVIDER_INVALID_RESPONSE: '온라인 AI 응답을 읽을 수 없어 결과를 저장하지 않았습니다.',
    VISION_RESPONSE_INVALID: '온라인 AI 응답이 보수적 검증 기준을 통과하지 못해 결과를 저장하지 않았습니다.',
  };
  return messages[run.code] ?? run.error ?? '온라인 분석을 실행하지 못했습니다.';
}

function buildPoints(candidate, focusItems, capturePlan) {
  const verifiedPhotoPoints = candidate.reviewPhoto?.spatiallyVerified
    ? candidate.reviewPhoto?.points ?? []
    : [];
  const sourceItems = verifiedPhotoPoints.length > 0
    ? verifiedPhotoPoints
    : capturePlan?.points?.length
      ? capturePlan.points
      : focusItems.map((label) => ({
    label,
    spatiallyVerified: false,
  }));

  return sourceItems.slice(0, 4).map((point, index) => ({
    id: `${candidate.id}-photo-point-${index + 1}`,
    number: index + 1,
    label: point.label ?? focusItems[index] ?? '사진에서 확인할 위치',
    description: point.description ?? focusItems[index] ?? '',
    x: Number.isFinite(point.x) ? point.x : null,
    y: Number.isFinite(point.y) ? point.y : null,
    spatiallyVerified: Boolean(point.spatiallyVerified && Number.isFinite(point.x) && Number.isFinite(point.y)),
  }));
}

function getDirectionLabel(view) {
  if (!view) return '';
  return view.key === 'focus' ? '후보 좌표 방향' : `${view.label}쪽 시점`;
}

export default function PhotoLabelPanel({
  candidate,
  review,
  focusItems,
  currentFocusChecks,
  currentStepChecks,
  onChangeReview,
  roadviewVisionRun,
  onAnalyzeRoadview,
}) {
  const [photoError, setPhotoError] = useState('');
  const [selectedDirectionByCandidate, setSelectedDirectionByCandidate] = useState({});
  const locationGate = getLocationReviewGate(candidate);
  const capturePlan = getRoadviewCapturePlan(candidate);
  const directionViews = capturePlan?.directionViews ?? [];
  const primaryDirectionKey = capturePlan?.primaryDirectionKey ?? '';
  const selectedDirectionKey = selectedDirectionByCandidate[candidate.id] ?? primaryDirectionKey;
  const selectedDirection =
    directionViews.find((view) => view.key === selectedDirectionKey) ||
    directionViews.find((view) => view.recommended) ||
    directionViews[0] ||
    null;
  const hasAttachedPhoto = Boolean(review?.photoDataUrl);
  const roadviewSource = candidate.reviewPhoto?.roadviewUrl || capturePlan?.roadviewUrl || candidate.reviewLinks?.kakaoRoadview || '';
  const photoSource = review?.photoDataUrl || selectedDirection?.image || capturePlan?.image || candidate.reviewPhoto?.image || '';
  const hasVisualPreview = Boolean(photoSource);
  const photoName = review?.photoName || (
    selectedDirection
      ? `${capturePlan?.caption ?? '카카오 360도 로드뷰 검수 시점'} · ${getDirectionLabel(selectedDirection)}`
      : candidate.reviewPhoto?.caption || capturePlan?.caption || ''
  );
  const points = buildPoints(candidate, focusItems, capturePlan);
  const spatialPoints = points.filter((point) => point.spatiallyVerified);
  const photoDraft = getPhotoAiDraft(candidate, roadviewVisionRun?.result);
  const photoComparison = getPhotoHumanComparison(photoDraft, review, candidate);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPhotoError('');

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 첨부할 수 있습니다.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('사진 용량은 2.5MB 이하로 줄여서 첨부해 주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChangeReview(candidate.id, {
        photoDataUrl: String(reader.result),
        photoName: file.name,
        stepChecks: {
          ...currentStepChecks,
          targetPoint: true,
        },
      });
    };
    reader.onerror = () => {
      setPhotoError('사진을 읽지 못했습니다. 다른 캡처 파일로 다시 시도해 주세요.');
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    onChangeReview(candidate.id, {
      photoDataUrl: '',
      photoName: '',
    });
    setPhotoError('');
  }

  return (
    <section className="photo-label-panel" aria-label="검수 사진 라벨링">
      <div className="photo-label-header">
        <div>
          <strong>검수 사진 라벨링</strong>
          <p>후보 좌표를 향한 시점과 주변 네 방향을 비교하고, 사진에서 실제로 확인한 항목만 체크합니다.</p>
        </div>
        <div className="photo-actions">
          <label className="photo-upload-button">
            사진 첨부
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          {hasAttachedPhoto ? (
            <button type="button" className="photo-clear-button" onClick={clearPhoto}>
              첨부 삭제
            </button>
          ) : null}
        </div>
      </div>

      {photoError ? <p className="photo-error">{photoError}</p> : null}

      {capturePlan ? (
        <div className="review-target-box" aria-label="360도 로드뷰 검토 후보 계획">
          <strong>360도 로드뷰 검토 후보 {capturePlan.order}번</strong>
          <p>
            저장 파일명: <b>{capturePlan.fileName}</b>
          </p>
          {capturePlan.primaryDirectionLabel ? (
            <p>
              후보 좌표 방향: <b>{capturePlan.targetBearing}도</b>
              {capturePlan.targetDistanceMeters !== null ? ` · 파노라마에서 약 ${capturePlan.targetDistanceMeters}m` : ''}
            </p>
          ) : null}
          {capturePlan.freshnessStatus === 'stale' ? (
            <p className="roadview-stale-warning">촬영일이 오래되어 현재 상태와 다를 수 있습니다. 현장 확인을 우선합니다.</p>
          ) : null}
          <p>{capturePlan.captureFocus}</p>
          <p>{capturePlan.permissionNote}</p>
        </div>
      ) : null}

      {directionViews.length > 0 ? (
        <div className="roadview-direction-panel" aria-label="카카오 360도 로드뷰 검수 화면">
          <div className="roadview-direction-header">
            <strong>360도 로드뷰 검수 화면</strong>
            <p>후보 좌표를 향한 정확한 방위각을 먼저 보여주고, 북·동·남·서 화면은 주변 맥락을 대조할 때 사용합니다.</p>
          </div>
          <div className="roadview-360-steps" aria-label="360도 로드뷰 검수 순서">
            <span>1. 후보 좌표 방향 확인</span>
            <span>2. 주변 건물과 도로 대조</span>
            <span>3. 사람 최종 라벨 저장</span>
          </div>
          <div className="roadview-direction-grid">
            {directionViews.map((view) => (
              <button
                type="button"
                key={view.key}
                className={`roadview-direction-card ${view.key === selectedDirection?.key ? 'selected' : ''} ${view.recommended ? 'recommended' : ''}`}
                onClick={() => setSelectedDirectionByCandidate((current) => ({ ...current, [candidate.id]: view.key }))}
              >
                <img src={view.image} alt={`${candidate.name} 360도 로드뷰 ${getDirectionLabel(view)}`} />
                <span>{getDirectionLabel(view)}</span>
                {view.recommended ? <b>좌표 방위 중심</b> : <small>주변 맥락</small>}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={`photo-ai-draft ${photoDraft.available ? 'available' : 'pending'}`}>
        <div className="photo-ai-draft-header">
          <div>
            <strong>실제 비전 모델 정성 초안</strong>
            <p>로드뷰 이미지 추론 결과와 한계를 보여줍니다. 숫자 정확도나 최종 안전 판정으로 사용하지 않습니다.</p>
          </div>
          <span>{photoDraft.sourceLabel}</span>
        </div>

        <div className={`photo-ai-online-control ${locationGate.roadviewPrecheckAllowed ? roadviewVisionRun?.status ?? 'idle' : 'blocked'}`}>
          <button
            type="button"
            onClick={() => {
              if (!locationGate.roadviewPrecheckAllowed) return;
              onAnalyzeRoadview?.(candidate.id, selectedDirectionKey);
            }}
            disabled={!locationGate.roadviewPrecheckAllowed || !onAnalyzeRoadview || roadviewVisionRun?.status === 'loading'}
          >
            {!locationGate.roadviewPrecheckAllowed
              ? '정확한 로드뷰 근거가 없어 분석하지 않음'
              : roadviewVisionRun?.status === 'loading'
                ? '온라인 분석 중…'
                : '정확한 로드뷰를 온라인 AI로 먼저 확인'}
          </button>
          <p role="status" aria-live="polite">
            {locationGate.roadviewPrecheckAllowed
              ? getVisionStatusMessage(roadviewVisionRun)
              : `${locationGate.title} ${locationGate.requiredAction}`}
          </p>
          <small>허용 모델: GPT-5.6 Sol · 로컬 모델 대체 실행 없음</small>
        </div>

        <div className="photo-ai-score-grid" aria-label="사진 기반 AI 초안과 사람 검수 비교">
          <div>
            <span>AI 출력 형식</span>
            <strong>{photoDraft.metricLabel ?? (photoDraft.score === null ? '대기' : `${photoDraft.score}점`)}</strong>
            <small>{photoDraft.scoreBasis}</small>
          </div>
          <div>
            <span>AI 초안 장벽</span>
            <strong>{photoComparison.aiBarrierLabel}</strong>
            <small>신뢰도: {photoDraft.confidenceLabel}</small>
          </div>
          <div>
            <span>사람 최종 라벨</span>
            <strong>{photoComparison.humanBarrierLabel}</strong>
            <small>심각도: {SEVERITY_LABELS[photoComparison.humanSeverity] ?? photoComparison.humanSeverity}</small>
          </div>
          <div>
            <span>AI-사람 비교</span>
            <strong>{AGREEMENT_LABELS[photoComparison.humanAgreement] ?? photoComparison.humanAgreement}</strong>
            <small>{photoComparison.hasHumanDecision ? '사람 라벨 저장됨' : '사람 검수 전'}</small>
          </div>
        </div>

        <p className="photo-ai-summary">{photoDraft.summary}</p>

        {photoDraft.provenance ? (
          <p className="photo-ai-summary">
            실행 근거: {photoDraft.provenance.model} · 입력 해시 {photoDraft.provenance.inputSha256.slice(0, 12)} · 프롬프트 해시 {photoDraft.provenance.promptSha256.slice(0, 12)}
          </p>
        ) : null}

        <div className="photo-ai-details">
          <div>
            <b>AI가 사진에서 먼저 본 신호</b>
            <ul>
              {(photoDraft.signals.length > 0 ? photoDraft.signals : ['사진 기반 초안 신호가 아직 없습니다.']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <b>그래서 사람이 검수해야 하는 이유</b>
            <ul>
              {photoDraft.limits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {hasVisualPreview ? (
        <figure className="photo-preview">
          <img src={photoSource} alt={`${candidate.name} 검수 사진`} />
          {spatialPoints.map((point) => (
            <span
              className="photo-marker"
              key={point.id}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={point.label}
            >
              {point.number}
            </span>
          ))}
          <figcaption>{photoName || '검수 사진'}</figcaption>
        </figure>
      ) : (
        <div className="photo-empty">
          <strong>아직 실제 로드뷰 캡처가 없습니다.</strong>
          <span>
            지도 화면을 대신 보여주지 않습니다. 아래 로드뷰 링크를 열어 {capturePlan?.fileName ?? '캡처 파일'}로 저장한 뒤
            사진을 첨부하면 이 영역에 실제 사진과 라벨링 포인트가 표시됩니다.
          </span>
          {roadviewSource ? (
            <a className="roadview-open-link" href={roadviewSource} target="_blank" rel="noreferrer">
              로드뷰 열기
            </a>
          ) : null}
        </div>
      )}

      {hasVisualPreview && spatialPoints.length === 0 ? (
        <div className="photo-spatial-warning" role="note">
          <strong>사진 위 장벽 마커는 아직 확정하지 않았습니다.</strong>
          <span>파란 중심선은 후보 좌표의 방향만 뜻합니다. 아래 항목을 사진에서 직접 확인한 뒤 라벨을 저장하세요.</span>
        </div>
      ) : null}

      <div className="photo-target-list" aria-label="사진에서 확인할 라벨링 위치">
        <strong>사진에서 직접 확인할 항목</strong>
        {points.map((point, index) => {
          const focusLabel = focusItems[index] ?? point.label;
          return (
            <label key={point.id}>
              <input
                type="checkbox"
                checked={Boolean(currentFocusChecks[focusLabel])}
                onChange={(event) =>
                  onChangeReview(candidate.id, {
                    focusChecks: {
                      ...currentFocusChecks,
                      [focusLabel]: event.target.checked,
                    },
                  })
                }
              />
              <span>
                <em>{point.spatiallyVerified ? point.number : '확인'}</em>
                <b>{point.label}</b>
                {point.description ? <small>{point.description}</small> : null}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
