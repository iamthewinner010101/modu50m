import { getPublicDataReferences, getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { getAiAgreementLabel, getReviewStatus, getSeverityLabel, getStatusLabel } from '../utils/report';
import { getCandidateReviewLinks, getCoordinateLabel, getRoadviewCoordinateLabel } from '../utils/mapLinks';
import { getBarrierLabel, getInspectionPlan, getReasonChips, getRiskLevel, scoreCandidate } from '../utils/scoring';
import LocationVerificationCard from './LocationVerificationCard';

export default function CandidatePanel({ candidate, review, mode }) {
  if (!candidate) {
    return <section className="panel">후보 지점을 선택해 주세요.</section>;
  }

  const score = scoreCandidate(candidate);
  const risk = getRiskLevel(score);
  const status = getReviewStatus(candidate, review);
  const aiBarrierType = candidate.defaultBarrierType ?? 'unknown';
  const humanBarrierType = review?.barrierType;
  const severity = review?.severity ?? 'unknown';
  const aiAgreement = review?.aiAgreement ?? 'unknown';
  const hasHumanReview = Boolean(review?.status);
  const reasonChips = getReasonChips(candidate);
  const inspectionPlan = getInspectionPlan(candidate);
  const reviewLinks = getCandidateReviewLinks(candidate);
  const capturePlan = getRoadviewCapturePlan(candidate);
  const publicDataReferences = getPublicDataReferences(candidate);
  const kakaoFocusItems = inspectionPlan.humanCheckFocus.slice(0, 3);

  const roadviewGuideBox = (
    <div className="roadview-guide-box">
      <strong className="roadview-guide-title">로드뷰 검수 가이드 (AI 한계 보완)</strong>
      <ul className="roadview-guide-list">
        <li className="roadview-guide-item">
          <span className="roadview-guide-label">근처 주요 건물</span>
          <span className="roadview-guide-value">{candidate.nearbyBuilding ?? '인근 건물 정보 없음'}</span>
        </li>
        <li className="roadview-guide-item">
          <span className="roadview-guide-label">AI 우선 시점</span>
          <span className="roadview-guide-value direction">{candidate.checkDirection ?? '방향 정보 없음'}</span>
        </li>
        <li className="roadview-guide-item">
          <span className="roadview-guide-label">상세 확인 위치</span>
          <span className="roadview-guide-value location">{candidate.detailedLocation ?? '상세 위치 정보 없음'}</span>
        </li>
        <li className="roadview-guide-divider">
          <span className="roadview-guide-warn-label">AI 인식 한계 및 사람 라벨링 검수 항목</span>
          <span className="roadview-guide-warn-desc">{candidate.aiLimitReason ?? '인식 한계 정보 없음'}</span>
        </li>
      </ul>
    </div>
  );

  const publicDataBox = capturePlan ? (
    <div className="review-target-box" aria-label="공공데이터 기반 360도 로드뷰 검수 계획">
      <strong>공공데이터 + 카카오 360도 로드뷰 검수 계획</strong>
      <p>
        {capturePlan.order}번 검토 후보 · AI 우선 확인 시점 <b>{capturePlan.primaryDirectionLabel || '미정'}쪽</b>
      </p>
      <p>{capturePlan.captureFocus}</p>
      {publicDataReferences.length > 0 ? (
        <ul>
          {publicDataReferences.map((source) => (
            <li key={source.title}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <span> - {source.use}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  ) : null;

  const kakaoCheckLocationBox = (
    <div className="kakao-check-card" aria-label="카카오탭에서 체크할 정확한 위치">
      <div className="kakao-check-card-header">
        <span>카카오탭 확인 위치</span>
        <strong>카카오에서 체크할 정확한 위치</strong>
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
          <dd>{capturePlan?.primaryDirectionLabel ? `${capturePlan.primaryDirectionLabel}쪽` : candidate.checkDirection ?? '방향 정보 없음'}</dd>
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
          <span>로드뷰 화면을 위의 방향으로 돌리고, 근처 건물과 상세 확인 위치가 맞는지 먼저 대조합니다.</span>
        </li>
        <li>
          <strong>3</strong>
          <span>{kakaoFocusItems.length ? kakaoFocusItems.join(' / ') : '턱, 경사, 보도 폭, 입구 단차'} 중 보이는 항목을 확인합니다.</span>
        </li>
        <li>
          <strong>4</strong>
          <span>좌표만 확인했으면 <b>카카오 좌표 마커</b>, 360도 사진까지 확인했으면 <b>카카오 360도 로드뷰</b>를 체크합니다.</span>
        </li>
      </ol>
      <div className="kakao-check-warning">
        <strong>체크하지 말아야 하는 경우</strong>
        <p>카카오 로드뷰가 가까운 도로 시점으로 열렸지만 마커, 건물, 상세 위치가 서로 맞지 않으면 카카오 로드뷰를 체크하지 말고 메모에 “위치 불일치”라고 남깁니다.</p>
      </div>
    </div>
  );

  return (
    <section className="panel selected-candidate">
      {!mode ? (
        <>
          <div className="panel-title-row">
            <span className="panel-label">선택 후보</span>
            <span className={`status-pill ${status}`}>{getStatusLabel(status)}</span>
          </div>

          <h2>{candidate.name}</h2>
          <p className="muted">{candidate.address}</p>

          <div className="score-row">
            <div className={`score-badge ${risk.key}`}>
              <span>{score}</span>
              <small>규칙 점수</small>
            </div>
            <div>
              <strong>위험도 {risk.label}</strong>
              <p>{candidate.last50mNote}</p>
            </div>
          </div>

          <LocationVerificationCard candidate={candidate} compact />

          <div className="chip-group" aria-label="규칙 추천 이유">
            {reasonChips.map((chip) => (
              <span className="reason-chip" key={chip.key}>
                {chip.label} {chip.value}/5
              </span>
            ))}
          </div>

          <div className="inspection-plan" aria-label="규칙 추천 근거와 사람 라벨링 검수 위치">
            <div className="inspection-plan-header">
              <strong>규칙 추천 근거 / 우선 검수 후보</strong>
              <span>{inspectionPlan.clarityLabel}</span>
            </div>
            <p>{inspectionPlan.reviewPriorityReason}</p>
            <div className="inspection-columns">
              <div>
                <h3>규칙 추천 근거</h3>
                <ul>
                  {inspectionPlan.aiCheckedItems.map((item) => (
                    <li key={item.key}>
                      <span>{item.label}</span>
                      <strong>
                        {item.value}/5 · {item.clarity}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>사람이 검수할 위치</h3>
                <ul>
                  {inspectionPlan.humanCheckFocus.map((focus) => (
                    <li key={focus}>{focus}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <dl className="meta-list">
            <div>
              <dt>시설 유형</dt>
              <dd>{candidate.facilityType}</dd>
            </div>
            <div>
              <dt>규칙 예상 장벽</dt>
              <dd>{getBarrierLabel(aiBarrierType)}</dd>
            </div>
            <div>
              <dt>사람 라벨 장벽</dt>
              <dd>{hasHumanReview ? getBarrierLabel(humanBarrierType ?? 'unknown') : '검수 전'}</dd>
            </div>
            <div>
              <dt>심각도 라벨</dt>
              <dd>{hasHumanReview ? getSeverityLabel(severity) : '검수 전'}</dd>
            </div>
            <div>
              <dt>AI-사람 비교</dt>
              <dd>{hasHumanReview ? getAiAgreementLabel(aiAgreement) : '검수 전'}</dd>
            </div>
            <div>
              <dt>검수 기준 좌표</dt>
              <dd>{getCoordinateLabel(candidate)}</dd>
            </div>
            <div>
              <dt>로드뷰 요청 좌표</dt>
              <dd>{getRoadviewCoordinateLabel(candidate)}</dd>
            </div>
          </dl>

          <div className="review-target-box" aria-label="지도 검수 기준">
            <strong>지도에서 먼저 볼 곳</strong>
            <p>앱 지도 마커와 50m 원을 기준으로 보고, 외부 지도는 같은 좌표를 다시 확인하는 보조 자료로 사용합니다.</p>
          </div>

          {publicDataBox}
          {kakaoCheckLocationBox}

          <div className="map-link-grid" aria-label="지도와 로드뷰 검수 링크">
            <a className="map-review-link naver" href={reviewLinks.naverIntent} target="_blank" rel="noreferrer">
              네이버 지도 앱 좌표 열기
            </a>
            <a className="map-review-link secondary" href={reviewLinks.naverMap} target="_blank" rel="noreferrer">
              네이버 웹에서 후보명+좌표 확인
            </a>
            <a className="map-review-link kakao" href={reviewLinks.kakaoRoadview} target="_blank" rel="noreferrer">
              카카오맵 360도 로드뷰 열기
            </a>
            <a className="map-review-link secondary" href={reviewLinks.kakaoMap} target="_blank" rel="noreferrer">
              카카오맵 좌표 마커 열기
            </a>
            <a className="map-review-link google" href={reviewLinks.googleMap} target="_blank" rel="noreferrer">
              구글 지도 좌표 확인
            </a>
          </div>
          <p className="roadview-note">
            로드뷰는 촬영 차량이 지나간 가장 가까운 도로 시점으로 열릴 수 있으므로, 앱 지도 마커와 비교해
            실제 검수 위치가 맞는지 다시 확인합니다.
          </p>

          {roadviewGuideBox}
        </>
      ) : mode === 'ai' ? (
        <>
          <div className="panel-title-row">
            <span className="panel-label">AI 추천 정보</span>
          </div>

          <div className="score-row">
            <div className={`score-badge ${risk.key}`}>
              <span>{score}</span>
              <small>규칙 점수</small>
            </div>
            <div>
              <strong>위험도 {risk.label}</strong>
              <p>{candidate.last50mNote}</p>
            </div>
          </div>

          <LocationVerificationCard candidate={candidate} compact />

          <div className="chip-group" aria-label="규칙 추천 이유">
            {reasonChips.map((chip) => (
              <span className="reason-chip" key={chip.key}>
                {chip.label} {chip.value}/5
              </span>
            ))}
          </div>

          <div className="inspection-plan" aria-label="규칙 추천 근거와 사람 라벨링 검수 위치">
            <div className="inspection-plan-header">
              <strong>규칙 추천 근거 / 우선 검수 후보</strong>
              <span>{inspectionPlan.clarityLabel}</span>
            </div>
            <p>{inspectionPlan.reviewPriorityReason}</p>
            <div className="inspection-columns">
              <div>
                <h3>규칙 추천 근거</h3>
                <ul>
                  {inspectionPlan.aiCheckedItems.map((item) => (
                    <li key={item.key}>
                      <span>{item.label}</span>
                      <strong>
                        {item.value}/5 · {item.clarity}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>사람이 검수할 위치</h3>
                <ul>
                  {inspectionPlan.humanCheckFocus.map((focus) => (
                    <li key={focus}>{focus}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {roadviewGuideBox}
          {publicDataBox}
        </>
      ) : mode === 'map' ? (
        <>
          <div className="panel-title-row">
            <span className="panel-label">외부 지도 비교</span>
          </div>

          <LocationVerificationCard candidate={candidate} compact />

          {capturePlan?.image ? (
            <figure className="map-roadview-quicklook" aria-label="후보 좌표 방향 로드뷰 빠른 확인">
              <div className="map-roadview-quicklook-heading">
                <div>
                  <span>후보 좌표 방향 로드뷰</span>
                  <strong>{capturePlan.targetBearing}도 · 파노라마에서 약 {capturePlan.targetDistanceMeters}m</strong>
                </div>
                <em>{capturePlan.roadviewAsset?.captureDate?.slice(0, 10) || '촬영일 미확인'}</em>
              </div>
              <img src={capturePlan.image} alt={`${candidate.name} 후보 좌표 방향 카카오 로드뷰`} />
              <figcaption>
                <span>파란선은 후보 좌표의 방위이며 장벽 위치 표시는 아닙니다.</span>
                <a href={reviewLinks.kakaoRoadview} target="_blank" rel="noreferrer">
                  카카오 360도에서 대조
                </a>
              </figcaption>
            </figure>
          ) : null}

          <dl className="meta-list">
            <div>
              <dt>시설 유형</dt>
              <dd>{candidate.facilityType}</dd>
            </div>
            <div>
              <dt>AI 예상 장벽</dt>
              <dd>{getBarrierLabel(aiBarrierType)}</dd>
            </div>
            <div>
              <dt>사람 라벨 장벽</dt>
              <dd>{hasHumanReview ? getBarrierLabel(humanBarrierType ?? 'unknown') : '검수 전'}</dd>
            </div>
            <div>
              <dt>심각도 라벨</dt>
              <dd>{hasHumanReview ? getSeverityLabel(severity) : '검수 전'}</dd>
            </div>
            <div>
              <dt>AI-사람 비교</dt>
              <dd>{hasHumanReview ? getAiAgreementLabel(aiAgreement) : '검수 전'}</dd>
            </div>
            <div>
              <dt>검수 기준 좌표</dt>
              <dd>{getCoordinateLabel(candidate)}</dd>
            </div>
            <div>
              <dt>로드뷰 요청 좌표</dt>
              <dd>{getRoadviewCoordinateLabel(candidate)}</dd>
            </div>
          </dl>

          <div className="review-target-box" aria-label="지도 검수 기준">
            <strong>지도에서 먼저 볼 곳</strong>
            <p>앱 지도 마커와 50m 원을 기준으로 보고, 외부 지도는 같은 좌표를 다시 확인하는 보조 자료로 사용합니다.</p>
          </div>

          {publicDataBox}
          {kakaoCheckLocationBox}

          <div className="map-link-grid" aria-label="지도와 로드뷰 검수 링크">
            <a className="map-review-link naver" href={reviewLinks.naverIntent} target="_blank" rel="noreferrer">
              네이버 지도 앱 좌표 열기
            </a>
            <a className="map-review-link secondary" href={reviewLinks.naverMap} target="_blank" rel="noreferrer">
              네이버 웹에서 후보명+좌표 확인
            </a>
            <a className="map-review-link kakao" href={reviewLinks.kakaoRoadview} target="_blank" rel="noreferrer">
              카카오맵 360도 로드뷰 열기
            </a>
            <a className="map-review-link secondary" href={reviewLinks.kakaoMap} target="_blank" rel="noreferrer">
              카카오맵 좌표 마커 열기
            </a>
            <a className="map-review-link google" href={reviewLinks.googleMap} target="_blank" rel="noreferrer">
              구글 지도 좌표 확인
            </a>
          </div>
          <p className="roadview-note">
            로드뷰는 촬영 차량이 지나간 가장 가까운 도로 시점으로 열릴 수 있으므로, 앱 지도 마커와 비교해
            실제 검수 위치가 맞는지 다시 확인합니다.
          </p>

          {roadviewGuideBox}
        </>
      ) : null}
    </section>
  );
}
