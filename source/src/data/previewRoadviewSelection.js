import { PRECINCTS, getPrecinct } from './daejeonPrecincts.js';
import refreshedPhotos from './previewRoadviewRefresh.generated.json' with { type: 'json' };

// Preview-only selection. Naver camera coordinates have not been acquired;
// never reuse the replaced Kakao camera or bind these images to its map pins.
export const NAVER_ARTS_PHOTOS = {
  approach: {
    id: 'naver-arts-west-2026-04', checkpointId: 'approach', provider: 'naver', providerLabel: '네이버 거리뷰',
    panoId: 'GVFgIi1wSlJ6nD-jD0MJTw', captureDate: '2026-04', captureDatePrecision: 'month', retrievedAt: '2026-09-18',
    image: '/modu50m/naver-roadview-v1/arts-west-2026-04.jpg', sourceUrl: 'https://naver.me/5hoysajS',
    heading: 68, pitch: 10, fov: 80, camera: null, mapBindingVerified: false,
    fieldVerified: false, entranceVerified: false, historical: false,
    permissionStatus: 'user_reported_obtained', captureMethod: 'visible-browser-screenshot-clip',
    sourceViewport: { width: 1278, height: 1207 }, crop: { x: 0, y: 300, width: 1200, height: 630 },
    sha256: 'c54f217fc967aa8bfb62b377ca44530e674820028649ff7e6cd1c1c6224b91d3',
  },
  threshold: {
    id: 'naver-arts-south-2026-04', checkpointId: 'threshold', provider: 'naver', providerLabel: '네이버 거리뷰',
    panoId: 'dsE_ce5sJpfE1Z-Arj_Ufw', captureDate: '2026-04', captureDatePrecision: 'month', retrievedAt: '2026-09-18',
    image: '/modu50m/naver-roadview-v1/arts-south-2026-04.jpg', sourceUrl: 'https://naver.me/FIc4ZQYI',
    heading: -22, pitch: 6.2, fov: 55.94, camera: null, mapBindingVerified: false,
    fieldVerified: false, entranceVerified: false, historical: false,
    permissionStatus: 'user_reported_obtained', captureMethod: 'visible-browser-screenshot-clip',
    sourceViewport: { width: 1278, height: 1207 }, crop: { x: 0, y: 300, width: 1200, height: 630 },
    sha256: 'f305deda516c029de0d58c6babdaec6e8b722c49d8a6696058b7e45e0c35da74',
  },
};

const ARTS_POINT_COPY = {
  approach: {
    title: '서측 주차장', short: '서측 주차장',
    question: '장애인 주차구역 표시, 유리 승강기 구조물과 옆 계단이 보이나요?',
    hint: '2026년 4월 네이버 거리뷰입니다. 승강기 작동 여부와 관람객 출입구까지의 연결은 확인 전입니다.',
    next: '승강기 이용 가능 여부, 출입문 폭·문턱, 공연장 내부로 이어지는 연결 확인하기',
    features: ['장애인 주차 표시', '승강기 구조물', '옆 계단'],
  },
  threshold: {
    title: '남측 광장 전경', short: '광장 전경',
    question: '도로와 광장 사이 경계, 포장면과 건물까지 이어지는 공간이 보이나요?',
    hint: '2026년 4월 도로 건너편에서 촬영한 네이버 거리뷰입니다. 출입문 근접 사진이나 검증된 이동 경로가 아닙니다.',
    next: '보도에서 광장으로 진입하는 실제 지점과 출입문까지의 무단차 연결 확인하기',
  },
  doorway: {
    title: '정면 계단과 유리 외벽', short: '정면 전경',
    question: '곡선 지붕 아래 유리 정면과 넓은 계단, 앞쪽 원형 공간을 살펴보세요.',
    hint: '2026년 4월 남쪽 도로에서 촬영한 네이버 거리뷰입니다. 문 앞 근접 사진은 아닙니다.',
    next: '관람객 출입문과 계단을 거치지 않는 접근 경로를 확인하기',
    features: ['곡선 지붕', '정면 계단', '유리 외벽'],
  },
};

const POINT_COPY = {
  arts: ARTS_POINT_COPY,
  museum: {
    approach: {
      title: '서측 외관과 주차 공간', short: '서측 외관',
      question: '미술관 서측 외벽과 유리문, 노란 유도선과 오른쪽 난간을 살펴보세요.',
      hint: '2026년 4월 미술관 서측 주차 통로에서 촬영한 네이버 거리뷰입니다. 앞쪽 주차 차량 너머로 건물과 진입 공간이 보입니다.',
      next: '주차 공간에서 관람객 출입문까지 이어지는 실제 보행 연결을 확인하기',
      features: ['서측 외관', '노란 유도선', '옆 난간'],
    },
    threshold: {
      title: '미술관 표지와 옆길', short: '표지와 옆길',
      question: '대전시립미술관 이름 표지와 길 양옆의 보도·경계석을 살펴보세요.',
      hint: '2026년 4월 미술관 북서쪽에서 동쪽을 바라본 네이버 거리뷰입니다. 표지와 도로 옆 보도가 보이며, 건물은 일부 나무에 가려집니다.',
      next: '도로 옆 보도에서 관람객 출입구까지 이어지는 연결을 확인하기',
      features: ['미술관 이름 표지', '도로 옆 보도', '경계석'],
    },
    doorway: {
      title: '서측 유리문 주변 확대', short: '유리문 주변',
      question: '01과 같은 촬영 지점을 확대한 사진입니다. 유리문 앞 바닥과 옆 경사로·난간을 살펴보세요.',
      hint: '2026년 4월 서측 외관 사진과 같은 위치에서 시야를 확대한 네이버 거리뷰입니다. 가까이 이동해 촬영한 사진은 아니며, 관람객 출입문 여부는 미확인입니다.',
      next: '유리문의 관람객 이용 여부와 문턱, 경사로 연결을 가까이에서 확인하기',
      features: ['같은 지점 확대', '유리문', '경사로와 난간'],
    },
  },
  hanbit: {
    doorway: {
      title: '한빛탑과 물빛광장 전경', short: '탑과 광장',
      question: '한빛탑 전체 모습과 물빛광장, 앞쪽 보도와 볼라드를 살펴보세요.',
      hint: '2025년 4월 남쪽 엑스포로에서 촬영한 네이버 거리뷰입니다. 탑 출입문 가까이의 사진은 아닙니다.',
      next: '광장 진입부와 탑 출입문까지의 실제 연결, 현재 광장 운영 상태를 확인하기',
      features: ['한빛탑 전체', '물빛광장', '보도와 볼라드'],
    },
  },
};

const SITE_COPY = {
  arts: { coverage: '네이버 2026년 4월 사진 3장 · 서측 주차장과 남측 정면 전경', thumbnailId: 'approach' },
  museum: { subtitle: '서측 외관과 북측 옆길', photoArea: '미술관 서측 · 북서측', coverage: '네이버 2026년 4월 · 서측 외관과 표지 · 03은 01과 같은 지점 확대', thumbnailId: 'approach' },
  hanbit: { subtitle: '동측 접근부와 남측 광장', photoArea: '동측 도로 · 남측 엑스포로', coverage: '카카오 동측 사진 2장 · 네이버 2025년 4월 광장 전경 · 문 앞 근접 근거 미확보', thumbnailId: 'doorway' },
};

export const SELECTED_NAVER_PHOTOS = {
  ...refreshedPhotos,
  arts: { ...NAVER_ARTS_PHOTOS, ...refreshedPhotos.arts },
};

export const photoProviderLabel = photo => photo.providerLabel || '카카오 로드뷰';
export const photoDateLabel = photo => String(photo.captureDate || '날짜 미확인').slice(0, 10).replaceAll('-', '.');

export function getPreviewPrecinct(id) {
  const site = getPrecinct(id);
  const selected = SELECTED_NAVER_PHOTOS[site.id];
  if (!selected) return site;
  const { thumbnailId, ...copy } = SITE_COPY[site.id];
  const photos = { ...site.photos, ...selected };
  return {
    ...site, ...copy, version: `${site.id}-preview-naver-v2`, thumbnail: photos[thumbnailId].image,
    photos,
    checkpoints: site.checkpoints.map(point => selected[point.id]
      ? { ...point, ...POINT_COPY[site.id][point.id], camera: null, point: null }
      : point),
  };
}

export const PREVIEW_PRECINCTS = PRECINCTS.map(site => getPreviewPrecinct(site.id));
