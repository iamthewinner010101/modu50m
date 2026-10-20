import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { getCoordinateLabel } from '../utils/mapLinks';

function getTone(status) {
  if (status === 'context_conflict') return 'conflict';
  if (status === 'stale_roadview' || status === 'roadview_distance_warning') return 'warning';
  return 'pending';
}

export default function LocationVerificationCard({ candidate, compact = false }) {
  if (!candidate) return null;

  const verification = candidate.locationVerification;
  const capturePlan = getRoadviewCapturePlan(candidate);
  const tone = getTone(verification?.status);
  const captureDate = capturePlan?.roadviewAsset?.captureDate?.slice(0, 10) || '촬영일 미확인';

  return (
    <section className={`location-verification-card ${tone} ${compact ? 'compact' : ''}`} aria-label="지도와 로드뷰 위치 이중 확인">
      <header>
        <div>
          <span>위치 이중 확인</span>
          <strong>{verification?.statusLabel ?? '시설명 확인 필요'}</strong>
        </div>
        <em>{getCoordinateLabel(candidate)}</em>
      </header>

      <div className="location-name-compare">
        <div>
          <span>프로젝트 가설명</span>
          <strong>{candidate.name}</strong>
        </div>
        <div>
          <span>좌표 주변 실제 지명</span>
          <strong>{verification?.coordinateContext ?? '외부 지도 대조 필요'}</strong>
        </div>
      </div>

      {!compact ? (
        <>
          <dl className="location-evidence-grid">
            <div>
              <dt>파노라마 거리</dt>
              <dd>{capturePlan?.targetDistanceMeters === null ? '미확인' : `약 ${capturePlan.targetDistanceMeters}m`}</dd>
            </div>
            <div>
              <dt>후보 좌표 방위</dt>
              <dd>{capturePlan?.targetBearing === null ? '미확인' : `${capturePlan.targetBearing}도`}</dd>
            </div>
            <div>
              <dt>로드뷰 촬영일</dt>
              <dd>{captureDate}</dd>
            </div>
          </dl>
          <p>{verification?.reason ?? '후보명과 실제 좌표 주변 지명이 같은지 사람이 확인해야 합니다.'}</p>
          <div className="location-required-action">
            <span>다음 확인</span>
            <strong>{verification?.requiredAction ?? '외부 지도에서 건물과 도로 방향을 대조합니다.'}</strong>
          </div>
        </>
      ) : null}
    </section>
  );
}
