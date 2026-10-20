import { useEffect, useRef, useState } from 'react';
import {
  ROADVIEW_ADAPTER_STATUS,
  createInitialRoadviewState,
  createKakaoRoadviewController,
} from '../utils/kakaoRoadviewAdapter';
import {
  getRoadviewViewerPresentation,
  getRoadviewViewerReviewState,
} from '../utils/kakaoRoadviewViewerState';
import './KakaoRoadviewViewer.css';

const ERROR_COPY = Object.freeze({
  missing_javascript_key: {
    title: '카카오 JavaScript 키 연결이 필요해요',
    description: '키와 실행 도메인을 등록하면 이 자리에서 360도 로드뷰가 열립니다.',
  },
  sdk_load_failed: {
    title: '공식 로드뷰를 불러오지 못했어요',
    description: '네트워크와 카카오 도메인 등록 상태를 확인해야 합니다.',
  },
  sdk_global_unavailable: {
    title: '공식 로드뷰 초기화에 실패했어요',
    description: '카카오 지도 사용 설정과 JavaScript 키 종류를 확인해야 합니다.',
  },
  sdk_api_unavailable: {
    title: '로드뷰 기능을 사용할 수 없어요',
    description: '현재 불러온 SDK에서 Roadview API를 찾지 못했습니다.',
  },
  invalid_position: {
    title: '로드뷰를 요청할 좌표가 없어요',
    description: '공식 원천 좌표가 확인된 후보만 라이브 로드뷰를 요청합니다.',
  },
});

function statusCopy(state) {
  if (state.status === ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND) {
    return {
      title: '360도 로드뷰를 화면 안에 표시했어요',
      description: '가장 가까운 촬영점일 뿐, 목적지 입구와 같은지는 사람이 확인해야 합니다.',
    };
  }
  if (state.status === ROADVIEW_ADAPTER_STATUS.NO_PANORAMA) {
    return {
      title: '반경 50m 안에 로드뷰가 없어요',
      description: '로드뷰 없음은 접근 가능이나 불가능을 뜻하지 않습니다. 현장 확인 대상으로 남깁니다.',
    };
  }
  if (state.status === ROADVIEW_ADAPTER_STATUS.ERROR) {
    return ERROR_COPY[state.errorCode] ?? {
      title: '공식 로드뷰를 표시하지 못했어요',
      description: '오류 상태를 유지하고 장소·접근성 검증으로 올리지 않습니다.',
    };
  }
  return {
    title: '공식 360도 로드뷰를 불러오는 중이에요',
    description: '선택한 후보 좌표에서 반경 50m 안의 가장 가까운 촬영점을 찾고 있습니다.',
  };
}

function coordinateText(position) {
  if (!position) return '촬영점 좌표 읽기 대기';
  return `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
}

export default function KakaoRoadviewViewer({
  candidate,
  review = null,
  storedImage = null,
  onExpandStoredImage = null,
}) {
  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const [liveState, setLiveState] = useState(createInitialRoadviewState);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const controller = createKakaoRoadviewController({
      container: containerRef.current,
      onStateChange: setLiveState,
    });
    controllerRef.current = controller;
    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => controller.relayout())
      : null;
    resizeObserver?.observe(containerRef.current);

    return () => {
      resizeObserver?.disconnect();
      controller.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (!candidate?.coordinateValid) {
      controller.reset();
      return;
    }
    void controller.request(candidate.id, {
      lat: candidate.lat,
      lng: candidate.lng,
    });
  }, [candidate?.coordinateValid, candidate?.id, candidate?.lat, candidate?.lng]);

  const isCurrentCandidate = liveState.candidateId === String(candidate?.id ?? '');
  const isLive = isCurrentCandidate
    && liveState.status === ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND;
  const copy = statusCopy(liveState);
  const showStoredFallback = !isLive && Boolean(storedImage);
  const reviewState = getRoadviewViewerReviewState(review);
  const presentation = getRoadviewViewerPresentation({ isLive, showStoredFallback });

  return (
    <section
      className={`daejeon-live-roadview ${isLive ? 'is-live' : 'is-pending'} is-${presentation.kind}`}
      data-testid="daejeon-live-roadview"
      data-roadview-live-state={isCurrentCandidate ? liveState.status : ROADVIEW_ADAPTER_STATUS.REQUESTING}
      data-roadview-sdk-provider="kakao-maps-web-js-sdk"
      data-roadview-display-kind={presentation.kind}
      data-roadview-review-place-match={reviewState.placeMatchStatus}
      data-roadview-review-accessibility={reviewState.accessibilityStatus}
      data-roadview-review-student={reviewState.studentReviewStatus}
    >
      <header>
        <div>
          <span>{presentation.headerLabel}</span>
          <strong>{presentation.title}</strong>
        </div>
        <b className={isLive ? 'live' : presentation.kind === 'stored' ? 'stored' : 'pending'}>
          {presentation.badge}
        </b>
      </header>

      <div className="daejeon-live-roadview__stage">
        <div
          ref={containerRef}
          className="daejeon-live-roadview__sdk"
          aria-label={isLive ? `${candidate.name} 카카오 LIVE 360° 로드뷰` : presentation.stageLabel}
          aria-hidden={!isLive}
        />
        {showStoredFallback ? (
          <button
            type="button"
            className="daejeon-live-roadview__stored"
            onClick={onExpandStoredImage ?? undefined}
            disabled={!onExpandStoredImage}
            aria-label={`${candidate?.name ?? '선택 장소'} 기록 이미지 크게 보기`}
          >
            <img src={storedImage} alt={`${candidate?.name ?? '선택 장소'} ${presentation.imageLabel}`} />
            <span>{presentation.imageCaption}</span>
          </button>
        ) : null}
        {!isLive && !showStoredFallback ? (
          <div className="daejeon-live-roadview__placeholder" aria-hidden="true">
            <span>360°</span>
          </div>
        ) : null}
      </div>

      <div className={`daejeon-live-roadview__status ${isLive ? 'live' : 'pending'}`} role="status">
        <strong>{copy.title}</strong>
        <p>{copy.description}</p>
        {isLive ? (
          <small>
            pano ID {liveState.panoId ?? '읽기 대기'} · 촬영점 {coordinateText(liveState.panoPosition)}
          </small>
        ) : null}
      </div>

      <footer>
        <span>장소·입구 일치: {reviewState.placeMatchLabel}</span>
        <span>접근성 판단: {reviewState.accessibilityLabel}</span>
        <span>학생 검수: {reviewState.studentReviewLabel}</span>
      </footer>
    </section>
  );
}
