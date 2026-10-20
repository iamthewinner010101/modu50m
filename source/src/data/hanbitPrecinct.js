import collection from './hanbitRoadview.generated.json' with { type: 'json' };

export const PRECINCT_VERSION = 'hanbit-roadview-v2';
export const TOWER = { lat: 36.376638, lon: 127.3880554, point: [-65, .6, 0], sourceUrl: 'https://www.openstreetmap.org/way/469022520' };
// East = +x, north = -z, 0.85 model units/metre. Only tower/camera anchors are georeferenced.
export function geoToModel({ lat, lon }) {
  return [-65 + (lon - TOWER.lon) * 111320 * Math.cos(TOWER.lat * Math.PI / 180) * .85, .6, -(lat - TOWER.lat) * 111320 * .85];
}
export const ROADVIEW = Object.fromEntries(collection.images.map(photo => [photo.checkpointId, photo]));
const pointDefinitions = [
  { id: 'approach', number: '01', title: '정류장 옆 보도', short: '보도',
    question: '보도 안에 정류장 시설과 나무가 보이나요?', hint: '시설물과 보도는 보이지만, 남은 통과 폭은 사진만으로 확정하지 않아요.', next: '정류장 시설과 가로수 사이의 실제 통과 폭, 보도 연결을 확인하기' },
  { id: 'threshold', number: '02', title: '주차장 교차부', short: '교차부',
    question: '차량 진입로를 가로지르는 횡단 표시가 보이나요?', hint: '출입문 문턱이 아니라 동측 차량 진입부입니다. 단차·통행 방식은 별도 확인해요.', next: '차량 진입부의 보행 연결, 경계 단차, 신호·우선 통행 방식을 확인하기' },
  { id: 'doorway', number: '03', title: '입구 방향 살피기', short: '입구 방향',
    question: '사진에서 출입문 아래 경계를 분명히 구분할 수 있나요?', hint: '한빛탑 방향 원거리 사진입니다. 문 앞 근접 사진이나 출입문 위치 확정 자료가 아닙니다.', next: '실제 사용하는 출입문을 확인하고 문턱·문 앞 공간의 근접 근거 확보하기' },
];
export const START = (() => { const p = geoToModel(ROADVIEW.approach.camera); return [p[0], p[1], p[2] + 10]; })();
export const ROUTE = [START, ...pointDefinitions.map(p => geoToModel(ROADVIEW[p.id].camera))];
const segmentLengths = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[2] - ROUTE[i][2]));
const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
export const CHECKPOINTS = pointDefinitions.map((p, i) => ({ ...p, point: ROUTE[i + 1], camera: ROADVIEW[p.id].camera, progress: segmentLengths.slice(0, i + 1).reduce((a, b) => a + b, 0) / totalLength }));
// Separate animation example, not a measured accessible route.
export const DEMO_ROUTE = [[-38, .6, 76], [-38, .6, 44], [-38, .6, 23], [-52, .6, 15]];
export const OBSERVATIONS = [
  { value: 'visible', label: '보여요' }, { value: 'not_visible', label: '안 보여요' }, { value: 'unknown', label: '모르겠어요' },
];
export const ARCHIVE = [
  { id: 'D50-002', name: '시청역 8번 출구', image: '/modu50m/hanbit-v1/D50-002-P4-R.jpg', key: 'D50-002-P4-R', date: '2025-09-18', note: '기존 시각 검토에서 선정한 사진 · 현장 확인 전' },
  { id: 'D50-001', name: '대전광역시청', image: '/modu50m/hanbit-v1/D50-001-P1-L.jpg', key: 'D50-001-P1-L', date: null, note: '수집 원본 · 장소·입구 일치 여부 재확인 필요' },
  { id: 'D50-009', name: '둔산2동 행정복지센터', image: '/modu50m/hanbit-v1/D50-009-P2-C.jpg', key: 'D50-009-P2-C', date: null, note: '수집 원본 · 장소·입구 일치 여부 재확인 필요' },
];
