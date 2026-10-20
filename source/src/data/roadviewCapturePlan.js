import roadviewDirectionAssets from './roadviewDirectionAssets.generated.js';

export const ROADVIEW_CAPTURE_TARGET = 12;
export const KAKAO_ROADVIEW_PERMISSION_NOTE =
  '카카오맵 로드뷰 개발자에게 수업·코드페어 프로젝트 검토 후보 범위의 사용 허락을 물리적으로 받은 전제에서 사용합니다. 이 문구는 권한 재확인 요구가 아니라, 사용 범위를 잊지 않기 위한 프로젝트 고정 조건입니다.';

export const PUBLIC_DATA_REFERENCES = {
  daejeonRoadFacility: {
    title: '대전광역시 장애인편의시설(도로시설물) 현황',
    source: '공공데이터포털',
    url: 'https://www.data.go.kr/data/15110478/fileData.do',
    use: '점자블록, 도로시설물, 설치 구간, 관리 상태를 참고해 마지막 50m 검수 기준을 잡습니다.',
  },
  daejeonSeoParking: {
    title: '대전광역시 서구 장애인 전용주차 면수 현황',
    source: '공공데이터포털',
    url: 'https://www.data.go.kr/data/15147006/fileData.do',
    use: '공공기관과 생활시설 주변의 장애인 접근성 후보를 정할 때 보조 기준으로 씁니다.',
  },
  daejeonSeoOpenToilet: {
    title: '대전광역시 서구 개방화장실현황',
    source: '공공데이터포털',
    url: 'https://www.data.go.kr/data/15108145/openapi.do',
    use: '장애인 화장실이 있는 생활시설 주변 접근로 후보를 정할 때 참고합니다.',
  },
  bfCertifiedFacilities: {
    title: '장애물 없는 생활환경(BF) 인증 시설 정보',
    source: '공공데이터포털',
    url: 'https://www.data.go.kr/data/15014781/fileData.do',
    use: '이미 접근성이 인증된 시설과 아닌 시설의 차이를 비교하는 기준 데이터로 씁니다.',
  },
};

const POINT_PRESETS = {
  curb: [
    ['횡단보도 끝의 턱', '횡단보도 끝에 턱이 보이나요? 사진만 보고 높이를 재지 마세요.'],
    ['턱이 낮아진 곳', '가까이에 턱이 낮아진 곳이 보이나요?'],
    ['인도의 빈자리', '방향을 바꾸거나 기다릴 자리가 보이나요? 넓이는 사진만 보고 재지 마세요.'],
  ],
  slope: [
    ['기울어진 길이 시작되는 곳', '출구나 인도에서 길이 갑자기 기울어지는 곳이 보이나요?'],
    ['점자블록이 이어지는 곳', '점자블록과 경사로가 끊기거나 어긋나 보이나요?'],
    ['돌거나 기다릴 자리', '휠체어나 유모차가 방향을 바꿀 자리가 보이나요? 넓이는 사진만 보고 재지 마세요.'],
  ],
  narrow_sidewalk: [
    ['가장 좁아 보이는 길', '나무, 표지판, 정류장 시설 사이의 길이 보이나요? 너비는 사진만 보고 재지 마세요.'],
    ['길을 막는 물건', '간판, 울타리, 자전거 보관대처럼 길을 막는 물건이 보이나요?'],
    ['사람이 기다리는 자리', '사람이 서 있을 자리가 보이나요? 지나갈 수 있는지는 사진만 보고 정하지 마세요.'],
  ],
  crossing: [
    ['차와 사람이 함께 지나는 곳', '차가 드나드는 길과 사람이 걷는 길이 겹쳐 보이나요?'],
    ['턱이 낮아진 곳', '차도와 인도 사이에 턱이 낮아진 곳이 보이나요?'],
    ['사람이 기다리는 자리', '차가 지날 때 사람이 기다릴 자리가 보이나요? 안전한지는 사진만 보고 정하지 마세요.'],
  ],
  entrance_step: [
    ['문 앞의 턱', '건물 문 앞에 턱이 보이나요? 높이는 사진만 보고 재지 마세요.'],
    ['계단 옆 경사로', '계단 옆에 완만하게 기울어진 길이 보이나요?'],
    ['문 앞의 빈자리', '문을 열고 방향을 바꿀 자리가 보이나요? 넓이는 사진만 보고 재지 마세요.'],
  ],
  surface: [
    ['깨지거나 울퉁불퉁한 바닥', '바퀴가 걸릴 수 있는 틈, 파인 곳, 깨진 바닥이 보이나요?'],
    ['길의 기울기가 바뀌는 곳', '포장된 길에서 입구로 갈 때 갑자기 기울어지는 곳이 보이나요?'],
    ['입구의 작은 턱', '화장실이나 건물 입구에 작은 턱이 보이나요?'],
  ],
};

function pointsFor(barrierType) {
  return (POINT_PRESETS[barrierType] ?? POINT_PRESETS.curb).map(([label, description], index) => ({
    id: `check-${index + 1}`,
    label,
    description,
    spatiallyVerified: false,
  }));
}

function plan({
  id,
  order,
  barrierType,
  fileName,
  publicDataRefs,
  captureFocus,
  status = 'capture-needed',
  image = '',
  caption = '',
  roadviewUrl = '',
}) {
  const roadviewAsset = roadviewDirectionAssets[id] ?? null;
  const captureDate = roadviewAsset?.captureDate ? roadviewAsset.captureDate.slice(0, 10) : '';

  return {
    id,
    order,
    status: roadviewAsset ? 'captured' : status,
    fileName: roadviewAsset?.primaryImage?.split('/').pop() || fileName,
    image: roadviewAsset?.primaryImage || image,
    caption: roadviewAsset
      ? `카카오 360도 로드뷰 검수 시점: ${captureDate}, pano ${roadviewAsset.panoId}, 후보 좌표 방위 ${roadviewAsset.targetBearing}도`
      : caption,
    roadviewUrl: roadviewAsset?.roadviewUrl || roadviewUrl,
    roadviewAsset,
    directionViews: roadviewAsset?.views ?? [],
    primaryDirectionKey: roadviewAsset?.primaryDirectionKey ?? '',
    primaryDirectionLabel: roadviewAsset?.primaryDirectionLabel ?? '',
    targetBearing: roadviewAsset?.targetBearing ?? null,
    targetDistanceMeters: roadviewAsset?.targetDistanceMeters ?? null,
    freshnessStatus: roadviewAsset?.freshnessStatus ?? 'unknown',
    spatialMarkersVerified: Boolean(roadviewAsset?.spatialMarkersVerified),
    pointPlacementPolicy: roadviewAsset?.pointPlacementPolicy ?? '',
    permissionNote: KAKAO_ROADVIEW_PERMISSION_NOTE,
    captureFocus,
    publicDataRefs,
    points: pointsFor(barrierType),
    aiDraft: {
      source: 'kakao-roadview-authorized-review-candidates',
      method: 'roadview-capture-draft-labeling',
      barrierType,
      score: null,
      confidence: 'medium',
      status: roadviewAsset || status === 'captured' ? 'AI 초안' : '캡처 예정 초안',
      signals: [
        `${captureFocus}을 먼저 확인해야 하는 후보입니다.`,
        '공공데이터는 후보 선정 기준이고, 실제 장벽 여부는 로드뷰 사진과 사람 검수로 확인합니다.',
        '사진만으로 높이와 경사를 확정하지 않고 장벽 유형과 심각도를 사람이 라벨링합니다.',
      ],
      limits: [
        '로드뷰는 가장 가까운 도로 촬영 시점으로 열릴 수 있어 앱 지도 마커와 비교해야 합니다.',
        '사진 각도나 차량, 가로수, 간판 때문에 실제 단차가 가려질 수 있습니다.',
        '최종 제출 증거는 태윤이가 직접 저장한 사람 라벨링 검수 기록입니다.',
      ],
    },
  };
}

export const ROADVIEW_CAPTURE_PLAN = [
  plan({
    id: 'L50-001',
    order: 1,
    status: 'captured',
    barrierType: 'curb',
    fileName: 'L50-001-kakao-roadview-view.jpg',
    image: '/modu50m/review-photos/L50-001-kakao-roadview-view.jpg',
    caption: '카카오 로드뷰 캡처: 2025-09-22, pano 1201119934',
    roadviewUrl: 'https://map.kakao.com/?panoid=1201119934&pan=208.0&zoom=0&map_type=TYPE_MAP&map_attribute=ROADVIEW&urlX=584989.0&urlY=792888.0',
    captureFocus: '약국 앞 횡단보도 끝의 턱과 낮아진 곳',
    publicDataRefs: ['daejeonRoadFacility', 'bfCertifiedFacilities'],
  }),
  plan({ id: 'L50-002', order: 2, barrierType: 'slope', fileName: 'L50-002-kakao-roadview-capture.jpg', captureFocus: '시청역 8번 출구 앞 인도와 점자블록이 이어지는 곳', publicDataRefs: ['daejeonRoadFacility', 'bfCertifiedFacilities'] }),
  plan({ id: 'L50-003', order: 3, barrierType: 'narrow_sidewalk', fileName: 'L50-003-kakao-roadview-capture.jpg', captureFocus: '정류장 시설과 나무 사이의 길', publicDataRefs: ['daejeonRoadFacility'] }),
  plan({ id: 'L50-004', order: 4, barrierType: 'entrance_step', fileName: 'L50-004-kakao-roadview-capture.jpg', captureFocus: '병원 건물 문 앞의 턱과 경사로', publicDataRefs: ['bfCertifiedFacilities', 'daejeonRoadFacility'] }),
  plan({ id: 'L50-005', order: 5, barrierType: 'crossing', fileName: 'L50-005-kakao-roadview-capture.jpg', captureFocus: '세이브존으로 걸어 들어가는 정문과 주변 길', publicDataRefs: ['daejeonRoadFacility'] }),
  plan({ id: 'L50-006', order: 6, barrierType: 'surface', fileName: 'L50-006-kakao-roadview-capture.jpg', captureFocus: '공원 화장실로 가는 길의 바닥과 문 앞 턱', publicDataRefs: ['daejeonSeoOpenToilet', 'daejeonRoadFacility'] }),
  plan({ id: 'L50-007', order: 7, barrierType: 'curb', fileName: 'L50-007-kakao-roadview-capture.jpg', captureFocus: '도서관으로 들어가는 인도와 주차장 끝', publicDataRefs: ['daejeonRoadFacility', 'bfCertifiedFacilities'] }),
  plan({ id: 'L50-008', order: 8, barrierType: 'narrow_sidewalk', fileName: 'L50-008-kakao-roadview-capture.jpg', captureFocus: '학교 정문 울타리 안쪽 길', publicDataRefs: ['daejeonRoadFacility'] }),
  plan({ id: 'L50-009', order: 9, barrierType: 'crossing', fileName: 'L50-009-kakao-roadview-capture.jpg', captureFocus: '편의점 앞에서 차와 사람이 함께 지나는 곳', publicDataRefs: ['daejeonRoadFacility'] }),
  plan({ id: 'L50-010', order: 10, barrierType: 'entrance_step', fileName: 'L50-010-kakao-roadview-capture.jpg', captureFocus: '주민센터 민원실 문 앞 경사로와 턱', publicDataRefs: ['daejeonSeoParking', 'bfCertifiedFacilities', 'daejeonRoadFacility'] }),
  plan({ id: 'L50-011', order: 11, barrierType: 'narrow_sidewalk', fileName: 'L50-011-kakao-roadview-capture.jpg', captureFocus: '시장 입구 인도와 길을 막는 물건', publicDataRefs: ['daejeonRoadFacility'] }),
  plan({ id: 'L50-012', order: 12, barrierType: 'entrance_step', fileName: 'L50-012-kakao-roadview-capture.jpg', captureFocus: '은행 ATM 부스 문 앞 턱과 방향을 바꿀 자리', publicDataRefs: ['bfCertifiedFacilities', 'daejeonRoadFacility'] }),
];

export function getRoadviewCapturePlan(candidateOrId) {
  const id = typeof candidateOrId === 'string' ? candidateOrId : candidateOrId?.id;
  return ROADVIEW_CAPTURE_PLAN.find((item) => item.id === id) ?? null;
}

export function getPublicDataReferences(candidateOrId) {
  const capturePlan = getRoadviewCapturePlan(candidateOrId);
  return (capturePlan?.publicDataRefs ?? []).map((key) => PUBLIC_DATA_REFERENCES[key]).filter(Boolean);
}
