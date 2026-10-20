import { getCityPlace } from './previewCityPlaces.js';
import entrancePilot from './entrancePilot.generated.json' with { type: 'json' };
import dunsanPhotos from './dunsanCandidateRoadview.generated.json' with { type: 'json' };

// Presentation positions only. These are NOT geographic or accessible-route coordinates.
export const CORE_MAP_IMAGE = '/modu50m/visual-preview-v1/daejeon-core-miniature-v10.png';
const subway = entrancePilot.entries.find(entry => entry.alias === 'L50-002');
const civicPhoto = dunsanPhotos.assets['D50-009'];
export const CORE_CASES = [
  {
    id: 'tourism', number: '01', category: '관광', name: '한빛탑', area: '도룡동 · 엑스포과학공원',
    pin: [69, 26], placeId: 'hanbit', pointId: 'doorway',
    photo: getCityPlace('hanbit').photos.doorway,
    photoTitle: '광장 앞 볼라드와 화분', status: '광장 진입부 사진',
    question: '광장으로 들어가는 공간이 보이나요?',
    observations: ['광장 앞 볼라드와 화분이 보입니다.', '그 사이의 실제 통과 폭과 탑 출입문까지의 연결은 확인이 필요합니다.'],
    next: '광장 진입부에서 실제 관람객 출입문까지 바닥이 이어지도록 촬영하기',
    scope: '남측 광장의 일부 장면입니다. 동측 정류장 사진과 연속된 경로는 아닙니다.',
  },
  {
    id: 'bus', number: '02', category: '버스', name: '한빛탑 동측 정류장 주변', shortName: '정류장 주변', area: '도룡동 · 동측 보도',
    pin: [87, 38], placeId: 'hanbit', pointId: 'approach',
    photo: getCityPlace('hanbit').photos.approach,
    photoTitle: '정류장 옆 보도와 가로수', status: '정류장 옆 보도 사진',
    question: '정류장 옆으로 지날 공간이 보이나요?',
    observations: ['정류장 시설과 가로수가 보도에 있습니다.', '시설물 사이의 통과 폭, 정류장 명칭·방향과 승하차 공간은 추가 확인 대상입니다.'],
    next: '정류장 표지와 승하차 공간, 가장 좁은 통로를 함께 촬영하기',
    scope: '정류장 주변 보도를 살펴보는 후보 사례입니다. 버스 승하차 가능 여부를 확인한 자료는 아닙니다.',
  },
  {
    id: 'culture', number: '03', category: '문화', name: '대전예술의전당', area: '만년동 · 문화예술단지',
    pin: [28, 54], placeId: 'arts', pointId: 'approach',
    photo: getCityPlace('arts').photos.approach,
    photoTitle: '서측 주차장과 승강기 주변', status: '주차장 접근부 사진',
    question: '주차장에서 출입문까지 어떻게 이어질까요?',
    observations: ['장애인 주차 표시와 유리 승강기 구조물이 보입니다.', '승강기 운영 상태와 공연장 출입문까지의 연결은 아직 확인 전입니다.'],
    next: '승하차 공간부터 승강기 문 앞, 실제 관람객 출입문까지 연결 촬영하기',
    scope: '서측 주차장의 한 장면입니다. 남측 정면과 연결된 통행 경로로 표시하지 않습니다.',
  },
  {
    id: 'civic', number: '04', category: '공공', name: '둔산2동 행정복지센터', shortName: '행정복지센터', area: '둔산동 · 생활 공공시설',
    pin: [32, 79],
    photo: { image: '/modu50m/hanbit-v1/D50-009-P2-C.jpg', captureDate: civicPhoto.captureDate.slice(0, 10), providerLabel: '카카오 로드뷰', sourceUrl: civicPhoto.roadviewUrl },
    photoTitle: '센터 방향 진입부 · 기존 수집 사진', status: '장소·입구 재확인 필요',
    question: '문 앞까지의 바닥이 충분히 보이나요?',
    observations: ['건물 방향 진입부와 주차 표시가 보입니다.', '문 앞 경계는 멀리 있어 문턱과 실제 이용 출입문을 다시 확인해야 합니다.'],
    next: '이용하는 민원실 출입문을 확인하고 문 앞 바닥과 진입부를 가까이 촬영하기',
    scope: '기존 수집 후보 장면입니다. 사람의 장소·입구 매칭과 현장 확인은 완료 전입니다.',
  },
  {
    id: 'subway', number: '05', category: '지하철', name: '시청역 주변', area: '둔산동 · 시청역 생활권',
    pin: [70, 81],
    photo: { image: subway.images[0].url, captureDate: subway.images[0].captureDate.slice(0, 10), providerLabel: '카카오 로드뷰', sourceUrl: subway.images[0].roadviewUrl },
    photoTitle: '8번 출구 앞 보도 · 계단 출구 사진', status: '승강기 접근 사진 필요',
    question: '지상 엘리베이터는 어디로 이어질까요?',
    observations: ['현재 사진에는 8번 계단 출구와 옆 보도가 보입니다.', '지상 엘리베이터의 위치와 보도 연결은 이 사진에서 확인할 수 없습니다.'],
    next: '실제 지상 엘리베이터 출입구와 연결 보도를 확인하고 촬영하기',
    scope: '번호는 시청역 주변 사례를 선택합니다. 실제 승강기 위치를 나타내지 않습니다.',
  },
];
export const getCoreCase = id => CORE_CASES.find(item => item.id === id) || CORE_CASES[0];
