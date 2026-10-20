import maps from './routeGroundMapsV25.json' with {type:'json'};

export const HANBIT_MAP = maps.hanbit;
export const MODEL_BOUNDS = [180, 90, 1050, 655];
export const mapToWorld = ([x,z], height=0) => [(x-615)/HANBIT_MAP.scalePixelsPerMeter,height,(z-372.5)/HANBIT_MAP.scalePixelsPerMeter];
export function geoToMap({lat,lon}) {
  const p=HANBIT_MAP.projection;
  return [p.ox+(lon-p.lon0)*111320*Math.cos(p.lat0*Math.PI/180)*p.scale,p.oy-(lat-p.lat0)*111320*p.scale];
}
export function nearestOnLine(point,line) {
  let best={distance:Infinity,point:null};
  for(let i=1;i<line.length;i++) {
    const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    const q=[a[0]+dx*t,a[1]+dy*t],d=Math.hypot(q[0]-point[0],q[1]-point[1]);
    if(d<best.distance)best={distance:d,point:q};
  }
  return best;
}
const way=id=>HANBIT_MAP.features.find(f=>f.id===id).points;
// Photo-area pins are separate from street-camera coordinates. The initial
// five viewing areas are attached to mapped footways, never to the car camera.
const sidewalk=way('1232664189');
export const HANBIT_STOPS = [
  {point:nearestOnLine(HANBIT_MAP.markers[0].mapPoint,sidewalk).point,short:'정류장 옆 보도',surface:'sidewalk',way:'1232664189',note:'정류장 시설과 가로수 사이 보도. 하차 때 넘는 경계는 사진에서 확인해요.'},
  {point:sidewalk[1],short:'진입로 앞 횡단부',surface:'sidewalk',way:'1232664189',note:'같은 쪽 보도에서 공원 진입부를 살펴봐요. 큰 도로 반대편으로 건너는 안내가 아니에요.'},
  {point:way('1525820813')[1],short:'주차장 진입 구역',surface:'crossing',way:'1525820813',note:'주차장 안의 횡단 표시 구역. 차단기와 차량 통행을 사진에서 구분해요.'},
  {point:way('1525820813')[4],short:'통일관 앞 연결부',surface:'crossing',way:'1525820813',note:'사진 속 낮은 연결판·보도 경계를 비교해요. 현재 이용 가능한 연결인지는 확인 전이에요.'},
  {point:nearestOnLine([612,358.7],way('1533149665')).point,short:'건물 아래 통로',surface:'covered-footway',way:'1533149665',note:'네이버 거리뷰에 보이는 통로와 지도상의 보행로를 비교했어요. 통로 전체 바닥은 사진 공백이 있어요.'},
  {point:HANBIT_MAP.markers[4].mapPoint,short:'탑 경사로 사진 구역',surface:'photo-area',note:'한국관광공사에 등록된 입구 사진 구역이에요. 경사로의 정확한 시작점·방위는 확인 전이에요.'},
  {point:HANBIT_MAP.markers[4].mapPoint,short:'유리문 사진',surface:'photo-area',note:'06번과 같은 사진에서 문을 살펴봐요. 별도의 촬영 좌표나 확정된 출입문 좌표가 아니에요.'},
];
export const HANBIT_SEGMENTS = [
  {id:'stop-sidewalk',way:'1232664189',kind:'mapped',points:[HANBIT_STOPS[0].point,sidewalk[2],sidewalk[1],sidewalk[0]]},
  {id:'sidewalk-corner',way:'1525816333',kind:'mapped',points:way('1525816333').slice(0,2)},
  {id:'parking-crossings',way:'1525820813',kind:'mapped',points:way('1525820813')},
  {id:'covered-passage',way:'1533149665',kind:'gap',points:[...way('1533149665')].reverse()},
  {id:'plaza-footway',way:'1387596270',kind:'gap',points:way('1387596270')},
  {id:'entrance-photo-area',kind:'approximate',points:[way('1387596270').at(-1),HANBIT_STOPS[5].point]},
];
export const HANBIT_REFERENCE_IMAGES = {
  0:'/modu50m/hanbit-roadview-v2/approach.jpg',
  1:'/modu50m/hanbit-roadview-v2/threshold.jpg',
  3:'/modu50m/route-photos-v27/naver-hanbit-face-1.jpg',
  4:'/modu50m/route-photos-v27/naver-hanbit-face-3.jpg',
};
export const HANBIT_3D_SOURCES = {
  checkedAt:'2026-09-25',
  geometry:HANBIT_MAP.sourceUrl,
  kakao:'https://map.kakao.com/?map_type=TYPE_MAP&map_attribute=ROADVIEW&panoid=1200671583&pan=273&tilt=-3&zoom=0',
  naver:'https://map.naver.com/p?c=17.00,0,0,0,adh&p=7hgOawWAJM318_4BCOVfVw,270,0,90,Float',
  area: 'https://access.visitkorea.or.kr/ms/detail.do?cotId=b55fb417-4e5d-4810-bd9f-4e49c0c69e4e',
  heightsMeasured:false,continuousRouteVerified:false,doorCoordinateVerified:false,
};
