import { PRECINCTS } from './daejeonPrecincts.js';

// These are inspection prompts, not accessibility findings or measured obstacle coordinates.
const topics = {
  hanbit: [
    ['보도 통과 폭', ['시설물 사이의 통과 폭', '가로수·정류장과의 간섭', '보도의 끊김 여부']],
    ['차량 교차부', ['차량과 보행 동선의 만남', '경계석·단차', '건너는 위치와 통행 방식']],
    ['출입문·문턱', ['실제 이용하는 출입문', '문턱과 문 앞 공간', '문을 여는 방식']],
  ],
  arts: [
    ['주차장 진입부', ['현재 주차구역과 출입구의 연결', '배수로·방지턱의 현재 상태', '차량과 분리된 보행 공간']],
    ['높이 변화', ['계단 형태의 높이 변화', '무단차 우회 접근로 유무', '경사·폭의 현장 측정']],
    ['출입문 확인', ['실제 이용하는 출입문', '문턱과 유효 통과 폭', '문 앞 회전·대기 공간']],
  ],
  museum: [
    ['보도 연결', ['보도와 경계석', '보행 진입 위치', '끊김 없는 보행 연결']],
    ['가려진 입구', ['수목에 가려진 부분', '실제 출입문 방향', '가리지 않는 근접 사진']],
    ['차량 통로', ['차량용 지하 진입로', '차량과 분리된 보행 동선', '차단 시설과 경계']],
  ],
};
const unlocated = [
  { id: 'entrance', title: '실제 이용 출입문', action: '사용하는 문과 문턱·문 앞 공간 확인' },
  { id: 'step-free', title: '무단차 접근로', action: '경사로·우회로의 유무와 연결 확인' },
  { id: 'parking', title: '장애인 전용 주차면', action: '유무·위치·보행 접근부와의 연결 확인' },
  { id: 'toilet', title: '장애인 이용 화장실', action: '유무·위치·이용 가능 시간 확인' },
];

export const PRECINCT_ANNOTATIONS = Object.fromEntries(PRECINCTS.map(site => [site.id, {
  hub: {
    id: site.id + '-building', title: site.name, kind: 'building',
    point: [...site.landmark], coordinate: { lat: site.anchor.lat, lon: site.anchor.lon },
    positionBasis: 'building_map_reference', sourceUrl: site.sourceUrl,
    photoId: site.id === 'hanbit' ? 'doorway' : 'approach',
    note: '건물 기준점입니다. 실제 이용 출입문이나 휠체어 도착점이 아닙니다.',
  },
  attention: site.checkpoints.map((point, index) => ({
    id: site.id + '-' + point.id, checkpointId: point.id, number: point.number,
    title: topics[site.id][index][0], checks: topics[site.id][index][1],
    point: [...point.point], coordinate: { ...point.camera },
    positionBasis: 'roadview_camera', targetCoordinate: null,
    sourceUrl: site.photos[point.id].sourceUrl, panoId: site.photos[point.id].panoId,
    fieldVerified: false, accessibilityStatus: 'not_assessed',
  })),
  unlocated: unlocated.map(item => ({ ...item, point: null, coordinate: null, positionBasis: 'unlocated', availability: 'unknown' })),
}]));

export function getPrecinctAnnotations(siteId) {
  const annotations = PRECINCT_ANNOTATIONS[siteId];
  if (!annotations) throw new Error('알 수 없는 장소의 표시를 요청했습니다.');
  return annotations;
}
