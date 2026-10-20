import roadviewDirectionAssets from '../data/roadviewDirectionAssets.generated';
import roadviewAnalysisAssets from '../data/roadviewAnalysisAssets';
import { getCandidateReviewLinks, getCoordinateLabel } from '../utils/mapLinks';

const KAKAO_MAP_HOST = 'https://map.kakao.com';

export default function CandidateMap({
  candidates,
  selectedId,
  onSelectCandidate,
  showCandidateList = false,
  showLocationVerification = true,
  attentionRegions = [],
  attentionKind = 'ai',
}) {
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  if (!selectedCandidate) return null;

  const generatedLinks = getCandidateReviewLinks(selectedCandidate);
  const candidateLinks = selectedCandidate.reviewLinks ?? {};
  const kakaoMapUrl = candidateLinks.kakaoMap?.startsWith(`${KAKAO_MAP_HOST}/`)
    ? candidateLinks.kakaoMap
    : generatedLinks.kakaoMap;
  const kakaoRoadviewUrl = candidateLinks.kakaoRoadview?.startsWith(`${KAKAO_MAP_HOST}/`)
    ? candidateLinks.kakaoRoadview
    : generatedLinks.kakaoRoadview;
  const directionAsset = roadviewDirectionAssets[selectedCandidate.id];
  const analysisAsset = roadviewAnalysisAssets[selectedCandidate.id];
  const locationVerification = selectedCandidate.locationVerification ?? {};
  const locationStatus = locationVerification.status ?? 'missing';
  const locationConfirmed = locationStatus === 'place_match_confirmed';
  const placeMatchEvidence = locationVerification.placeMatchEvidence ?? null;
  const previewImage = locationStatus === 'place_match_required' && placeMatchEvidence?.image
    ? placeMatchEvidence.image
    : locationConfirmed
      ? analysisAsset?.image ?? directionAsset?.primaryImage ?? selectedCandidate.reviewPhoto?.image ?? ''
      : '';
  const captureDateSource = placeMatchEvidence?.captureDate ?? directionAsset?.captureDate;
  const captureDate = captureDateSource
    ? new Date(captureDateSource).toLocaleDateString('ko-KR')
    : '';
  const visibleAttentionRegions = attentionRegions.filter((region) => (
    Number.isFinite(region?.centerX) && region.centerX >= 0 && region.centerX <= 1 &&
    Number.isFinite(region?.centerY) && region.centerY >= 0 && region.centerY <= 1 &&
    Number.isFinite(region?.radius) && region.radius >= 0.04 && region.radius <= 0.22 &&
    typeof region?.label === 'string' && typeof region?.humanCheck === 'string'
  )).slice(0, 3);
  const isObservationGuide = attentionKind === 'observation_guide';

  return (
    <section className="map-card kakao-map-card" data-map-provider="kakao" aria-label="카카오맵 위치 확인">
      <div className="kakao-map-summary">
        <div>
          <span>카카오맵</span>
          <strong>{selectedCandidate.name}</strong>
          <p>{selectedCandidate.detailedLocation ?? selectedCandidate.address}</p>
        </div>
        <small>{getCoordinateLabel(selectedCandidate)}</small>
      </div>

      {showLocationVerification ? (
        <section
          className={`location-verification-summary ${locationConfirmed ? 'confirmed' : 'blocked'} ${locationStatus}`}
          data-location-review-state={locationConfirmed ? 'ready' : 'blocked'}
          aria-label="입력된 후보와 좌표 주변 확인 결과 비교"
        >
          <header>
            <span>사진과 설명이 같은가요?</span>
            <strong>{locationVerification.statusLabel ?? '장소 확인 필요'}</strong>
          </header>
          <div>
            <p>
              <span>입력된 후보</span>
              <strong>{selectedCandidate.name}</strong>
            </p>
            <p>
              <span>좌표 주변 확인 결과</span>
              <strong>{locationVerification.coordinateContext ?? '확인된 지명 없음'}</strong>
            </p>
          </div>
          {!locationConfirmed ? (
            <p className="location-verification-reason">
              {locationVerification.reason ?? '후보 설명과 사진이 같은 장소인지 아직 확인되지 않았습니다.'}
            </p>
          ) : null}
        </section>
      ) : null}

      {previewImage ? (
        <figure className="kakao-map-preview">
          <div className="kakao-roadview-stage">
            <img
              className="kakao-map-preview-image"
              src={previewImage}
              alt={`${selectedCandidate.name} 후보 좌표에서 연 카카오 로드뷰`}
            />
            {visibleAttentionRegions.length > 0 ? (
              <div className="roadview-attention-layer" aria-hidden="true">
                {visibleAttentionRegions.map((region, index) => (
                  <span
                    className="roadview-attention-circle"
                    key={`${region.label}-${index}`}
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
            ) : null}
          </div>
          <figcaption>
            <span>같이 볼 카카오 로드뷰</span>
            <strong>{analysisAsset?.directionLabel ? `${analysisAsset.directionLabel}쪽 화면` : '후보 좌표 방향'}</strong>
            {captureDate ? <small>로드뷰 촬영 {captureDate}</small> : null}
          </figcaption>
        </figure>
      ) : (
        <section className="kakao-roadview-withheld" aria-label="장소가 맞는 사진 준비 상태">
          <span>사진 재확인 중</span>
          <strong>장소와 맞지 않는 로드뷰는 보여주지 않아요</strong>
          <p>{locationVerification.requiredAction ?? '카카오맵에서 장소 식별자와 목적지 앞 동선을 함께 확인할 수 있는 장면을 다시 찾습니다.'}</p>
        </section>
      )}

      {visibleAttentionRegions.length > 0 ? (
        <div
          className={`roadview-attention-guide ${isObservationGuide ? 'observation-guide' : 'ai-guide'}`}
          aria-label={isObservationGuide ? '사진에서 확인할 관찰 위치' : 'AI가 표시한 확인 후보 위치'}
        >
          <div className="roadview-attention-guide-heading">
            <strong>{isObservationGuide ? '사진에서 이 세 곳을 보세요' : '원의 위치부터 다시 확인하세요'}</strong>
            <span>
              {isObservationGuide ? '관찰 위치' : 'AI 확인 후보'} {visibleAttentionRegions.length}곳
            </span>
          </div>
          <ol>
            {visibleAttentionRegions.map((region, index) => (
              <li key={`${region.label}-guide-${index}`}>
                <small>{index + 1}</small>
                <span>
                  <strong>{region.label}</strong>
                  <em>{region.humanCheck}</em>
                </span>
              </li>
            ))}
          </ol>
          <p>
            {isObservationGuide
              ? '원은 확인할 위치 안내이며, 접근 가능·안전 판정 표시가 아니에요.'
              : '원은 장벽 확정 표시가 아니라, 사람이 다시 볼 위치예요.'}
          </p>
        </div>
      ) : null}

      <div className="kakao-map-actions">
        <a className="kakao-map-link secondary" href={kakaoMapUrl} target="_blank" rel="noreferrer">
          카카오맵에서 보기
        </a>
        <a className="kakao-map-link primary" href={kakaoRoadviewUrl} target="_blank" rel="noreferrer">
          카카오 로드뷰 열기
        </a>
      </div>

      {showCandidateList ? (
        <div className="candidate-list-panel kakao-candidate-list" aria-label="카카오맵 확인 장소 목록">
          <div className="candidate-list-heading">
            <span>다른 장소</span>
            <strong>확인할 장소를 선택하세요</strong>
          </div>
          <div className="candidate-list-scroll">
            {candidates.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                className={`candidate-list-button ${candidate.id === selectedCandidate.id ? 'selected' : ''}`}
                aria-pressed={candidate.id === selectedCandidate.id}
                onClick={() => onSelectCandidate(candidate.id)}
              >
                <span>{candidate.id}</span>
                <strong>{candidate.name}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
