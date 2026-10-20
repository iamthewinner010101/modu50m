import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { getPhotoAiDraft, getPhotoHumanComparison } from '../utils/photoAiDraft';
import {
  getAiAgreementLabel,
  getReviewStatus,
  getSeverityLabel,
  getStatusLabel,
} from '../utils/report';

const SOURCE_LABELS = {
  naverMap: '네이버 지도',
  kakaoMap: '카카오 좌표',
  kakaoRoadview: '카카오 360도 로드뷰',
  googleMap: '구글 지도',
};

function getPhotoState(candidate, review) {
  const capturePlan = getRoadviewCapturePlan(candidate);
  const direction =
    capturePlan?.directionViews?.find((view) => view.recommended) ??
    capturePlan?.directionViews?.[0] ??
    null;

  const points = candidate.reviewPhoto?.spatiallyVerified
    ? candidate.reviewPhoto?.points ?? []
    : capturePlan?.points ?? [];

  return {
    capturePlan,
    source:
      review?.photoDataUrl ||
      direction?.image ||
      capturePlan?.image ||
      candidate.reviewPhoto?.image ||
      '',
    caption:
      review?.photoName ||
      (direction
        ? `${capturePlan?.caption ?? '카카오 360도 로드뷰'} · ${direction.key === 'focus' ? '후보 좌표 방향' : `${direction.label}쪽 시점`}`
        : '') ||
      candidate.reviewPhoto?.caption ||
      '',
    points,
    spatialPoints: points.filter((point) => (
      point.spatiallyVerified && Number.isFinite(point.x) && Number.isFinite(point.y)
    )),
  };
}

export default function EvidenceComparePanel({
  candidate,
  review,
  judgeTour,
  onOpenReview,
  onOpenReport,
  roadviewVisionResult,
}) {
  if (!candidate) {
    return <section className="panel">후보 지점을 선택해 주세요.</section>;
  }

  const photoDraft = getPhotoAiDraft(candidate, roadviewVisionResult);
  const comparison = getPhotoHumanComparison(photoDraft, review, candidate);
  const photo = getPhotoState(candidate, review);
  const reviewStatus = getReviewStatus(candidate, review);
  const checkedSources = Object.entries(review?.sourceChecks ?? {})
    .filter(([, checked]) => checked)
    .map(([key]) => SOURCE_LABELS[key] ?? key);
  const humanDecisionReady = Boolean(review?.status && review?.severity && review?.aiAgreement);

  return (
    <section className="panel evidence-compare-panel" aria-label="AI와 사람의 근거 비교">
      {judgeTour ? (
        <nav className="judge-case-tour-nav" aria-label="90초 심사 대표 사례 전환">
          <div className="judge-case-tour-title">
            <span>90초 심사 테스트</span>
            <strong>대표 사례 {judgeTour.currentIndex + 1}/{judgeTour.cases.length}</strong>
          </div>
          <div className="judge-case-tour-buttons" role="group" aria-label="대표 사례 선택">
            {judgeTour.cases.map((item, index) => (
              <button
                type="button"
                key={item.candidateId}
                className={index === judgeTour.currentIndex ? 'active' : ''}
                aria-current={index === judgeTour.currentIndex ? 'step' : undefined}
                data-judge-tour-case={item.candidateId}
                onClick={() => judgeTour.onOpenCase(item.candidateId)}
              >
                <span>{index + 1}</span>
                {item.type}
              </button>
            ))}
          </div>
          <button type="button" className="judge-case-tour-return" onClick={judgeTour.onReturn}>
            대표 사례로 돌아가기
          </button>
        </nav>
      ) : null}

      <header className="proof-lead">
        <div>
          <p className="panel-label">근거 비교 질문</p>
          <h2>AI가 본 신호와 사람의 최종 판단은 왜 같거나 달랐을까요?</h2>
          <p>
            같은 후보 사진을 기준으로 AI 초안, 사람이 확인할 위치, 최종 라벨, 아직 확인하지 못한 한계를
            분리해 보여줍니다.
          </p>
        </div>
        <span className={`proof-review-state ${humanDecisionReady ? 'ready' : 'pending'}`}>
          {humanDecisionReady ? '사람 판단 저장됨' : '사람 판단 대기'}
        </span>
      </header>

      <div className="proof-grid">
        <figure className="proof-image-frame">
          {photo.source ? (
            <>
              <img src={photo.source} alt={`${candidate.name} 검수 근거`} />
              {photo.spatialPoints.slice(0, 4).map((point, index) => (
                <span
                  className="proof-image-marker"
                  key={`${candidate.id}-proof-${point.label ?? index}`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  title={point.label}
                >
                  {index + 1}
                </span>
              ))}
            </>
          ) : (
            <div className="proof-image-empty">
              <strong>사진 근거 대기</strong>
              <span>카카오 로드뷰 또는 현장 사진이 연결되면 이 위치에서 비교합니다.</span>
            </div>
          )}
          <figcaption>{photo.caption || '검수 근거 이미지'}</figcaption>
        </figure>

        <div className="proof-decision-stack">
          <div className="proof-metric-grid" aria-label="AI 초안과 사람 판단 비교">
            <div>
              <span>AI 초안</span>
              <strong>{photoDraft.metricLabel ?? (photoDraft.score === null ? '대기' : `${photoDraft.score}점`)}</strong>
              <small>{comparison.aiBarrierLabel}</small>
            </div>
            <div>
              <span>사람 최종 라벨</span>
              <strong>{humanDecisionReady ? comparison.humanBarrierLabel : '검수 전'}</strong>
              <small>{humanDecisionReady ? getSeverityLabel(comparison.humanSeverity) : '심각도 미정'}</small>
            </div>
            <div>
              <span>AI-사람 비교</span>
              <strong>{humanDecisionReady ? getAiAgreementLabel(comparison.humanAgreement) : '비교 대기'}</strong>
              <small>{getStatusLabel(reviewStatus)}</small>
            </div>
          </div>

          <section className="proof-evidence-block">
            <h3>AI가 먼저 본 신호</h3>
            <ul>
              {(photoDraft.signals.length ? photoDraft.signals : ['사진 기반 초안 신호가 아직 없습니다.'])
                .slice(0, 3)
                .map((signal) => <li key={signal}>{signal}</li>)}
            </ul>
          </section>

          <section className="proof-evidence-block human">
            <h3>사람이 확인해야 결론 나는 부분</h3>
            <ul>
              {photoDraft.limits.slice(0, 3).map((limit) => <li key={limit}>{limit}</li>)}
            </ul>
          </section>

          <div className="proof-source-line">
            <span>확인 지도</span>
            <strong>{checkedSources.length ? checkedSources.join(' · ') : '아직 체크 전'}</strong>
          </div>
          {photoDraft.provenance ? (
            <div className="proof-source-line">
              <span>AI 실행 근거</span>
              <strong>{photoDraft.provenance.model} · 입력 {photoDraft.provenance.inputSha256.slice(0, 10)}</strong>
            </div>
          ) : null}
        </div>
      </div>

      {photo.source && photo.spatialPoints.length === 0 ? (
        <div className="proof-spatial-warning" role="note">
          사진 중앙 안내선은 후보 좌표의 방위만 표시합니다. 실제 장벽 위치는 사람 검수 전이므로 번호 마커로 확정하지 않았습니다.
        </div>
      ) : null}

      <ol className="proof-point-list" aria-label="사진에서 직접 확인할 항목">
        {photo.points.slice(0, 4).map((point, index) => (
          <li key={`${candidate.id}-proof-point-${point.label ?? index}`}>
            <span>{point.spatiallyVerified ? index + 1 : '확인'}</span>
            <div>
              <strong>{point.label ?? '확인 위치'}</strong>
              <p>{point.description ?? '로드뷰와 지도 좌표를 함께 보고 확인합니다.'}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="proof-conclusion">
        <div>
          <span>현재 결론</span>
          <strong>{humanDecisionReady ? review.memo || '사람 검수 메모가 저장되었습니다.' : 'AI 초안만으로는 최종 판정하지 않습니다.'}</strong>
        </div>
        <div className="proof-actions">
          <button type="button" onClick={onOpenReview}>사람 검수 입력</button>
          <button type="button" className="secondary" onClick={onOpenReport}>보고서에서 확인</button>
        </div>
      </div>
    </section>
  );
}
