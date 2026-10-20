import * as hanbit from './hanbitPrecinct.js';
import { ARTS_WEST_PHOTO } from './artsWestRoadview.js';
import cultural from './culturalRoadview.generated.json' with { type: 'json' };

export const HANBIT_SITE = {
  id: 'hanbit', name: '한빛탑', shortName: '한빛탑', category: '엑스포 · 상징', district: '유성구 · 엑스포과학공원',
  subtitle: '동측 접근부', version: hanbit.PRECINCT_VERSION, modelType: 'hanbit',
  checkpoints: hanbit.CHECKPOINTS, photos: hanbit.ROADVIEW, route: hanbit.ROUTE, demoRoute: hanbit.DEMO_ROUTE,
  anchor: hanbit.TOWER, landmark: [-65, 53, 0], demoLabel: [-38, 1, 84], focus: [55, 3, 15],
  sourceUrl: hanbit.TOWER.sourceUrl, geoNote: '탑 중심·촬영좌표는 지도 기준, 주변 형태는 축약 모형',
  photoArea: '한빛탑 동측 도로', coverage: '입구 방향 사진 있음 · 문 앞 근접 근거 미확보',
  officialUrl: 'https://daejeontour.co.kr/find_djt/6', thumbnail: hanbit.ROADVIEW.threshold.image,
};

const definitions = {
  museum: { name: '대전시립미술관', shortName: '시립미술관', category: '예술 · 일상', subtitle: '남측 도로·주차장 접근부', photoArea: '시립미술관 남측 도로',
    officialUrl: 'https://www.daejeon.go.kr/dma/index.do', coverage: '수목으로 입구가 가려짐 · 입구 사진 미확보',
    points: [
      ['보도와 진입부', '보도', '도로 옆 보도와 경계석이 보이나요?', '남측 도로의 사진입니다. 미술관 출입문 위치를 보여 주는 사진은 아닙니다.', '보도에서 미술관으로 이어지는 실제 보행 진입 위치를 확인하기'],
      ['나무에 가린 시야', '시야 가림', '나무와 식재가 안쪽 시설의 시야를 가리나요?', '사진에 안 보이는 것을 ‘없음’으로 판단하지 않아요. 문 위치는 이 사진으로 확인하기 어렵습니다.', '수목에 가리지 않는 방향에서 출입구와 보행 연결의 근접 근거 확보하기'],
      ['차량 통로 구분', '차량 통로', '차량용 지하 진입로와 차단 시설이 보이나요?', '차량용 주차장 진입로를 휠체어 보행 경로로 지정하지 않습니다.', '차량 통로와 분리된 보행 접근로를 확인하기'],
    ] },
  arts: { name: '대전예술의전당', shortName: '예술의전당', category: '공연 · 문화', subtitle: '서측 주차장과 남측 광장', photoArea: '서측 주차장 · 남측 도로',
    officialUrl: 'https://www.daejeon.go.kr/djac/index.do', coverage: '서측 사진은 2017년 자료 · 현재 상태와 출입구 연결 미확인',
    points: [
      ['서측 주차장', '서측 주차장', '장애인 주차 표지와 진입부의 배수로·방지턱이 보이나요?', '2017년 사진입니다. 보이는 시설의 현재 상태와 실제 출입구 연결은 확인 전입니다.', '현재 주차구역에서 실제 출입구까지의 연결과 배수로·방지턱 상태 확인하기'],
      ['광장 전경', '광장 전경', '광장 쪽에 계단 형태의 높이 변화가 보이나요?', '높이·경사 수치는 사진으로 추정하지 않아요. 별도의 무단차 접근로 유무도 미확인입니다.', '높이 변화 지점과 무단차 접근 경로 유무를 현장에서 확인하기'],
      ['출입문 방향', '출입문 방향', '건물 출입문 아래 경계를 분명히 구분할 수 있나요?', '나무와 거리 때문에 문턱·문 앞 공간을 확정할 수 없습니다.', '관람객이 실제로 사용하는 출입문과 문 앞 공간의 근접 근거 확보하기'],
    ] },
};

export function culturalToModel(anchor, {lat, lon}) {
  return [(lon-anchor.lon)*111320*Math.cos(anchor.lat*Math.PI/180)*.65, .6, -(lat-anchor.lat)*111320*.65-35];
}
function makeSite(raw) {
  const def = definitions[raw.id];
  const photos = Object.fromEntries(raw.images.map(p => [p.checkpointId, p]));
  if (raw.id === 'arts') photos.approach = ARTS_WEST_PHOTO;
  const keys = ['approach', 'threshold', 'doorway'];
  const positions = keys.map(id => culturalToModel(raw.anchor, photos[id].camera));
  const route = [[positions[0][0]-8, .6, positions[0][2]], ...positions];
  const lengths = route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[2]-route[i][2]));
  const total = lengths.reduce((a,b)=>a+b,0);
  return { ...raw, ...def, version: raw.id === 'arts' ? 'arts-roadview-v4-west' : raw.id+'-roadview-v3', modelType: raw.id, district: '서구 · 둔산대공원 권역',
    photos, route, demoRoute: [[-32,.6,50],[-32,.6,22],[-12,.6,12]],
    landmark: [0, raw.id === 'arts' ? 35 : 20, -35], demoLabel: [-62,1,26],
    focus: [positions[1][0],3,positions[1][2]],
    modelFootprint: raw.footprint.map(p=>culturalToModel(raw.anchor,p)),
    geoNote: '건물 외곽·촬영좌표는 지도 기준, 높이·조경은 축약 모형',
    thumbnail: photos[raw.id==='arts'?'approach':'doorway'].image,
    checkpoints: keys.map((id,i)=>({id,number:String(i+1).padStart(2,'0'),title:def.points[i][0],short:def.points[i][1],question:def.points[i][2],hint:def.points[i][3],next:def.points[i][4],point:positions[i],camera:photos[id].camera,progress:lengths.slice(0,i+1).reduce((a,b)=>a+b,0)/total})),
  };
}
export const PRECINCTS = [HANBIT_SITE, ...cultural.sites.map(makeSite).sort((a,b)=>a.id==='arts'?-1:b.id==='arts'?1:0)];
export const getPrecinct = id => PRECINCTS.find(p=>p.id===id) || HANBIT_SITE;
export const isRecordForSite = (record, site) => (record.placeId ?? 'hanbit') === site.id;
