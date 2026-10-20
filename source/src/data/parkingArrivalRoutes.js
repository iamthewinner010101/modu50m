import arboretumParking from './arboretumParkingApproachV94.json' with {type:'json'};
import skyroadParking from './skyroadParkingApproachV77.json' with {type:'json'};
// Parking approaches reuse photographed pedestrian access points. A parking
// bay or a missing floor connection must not be invented from the illustration.
export const PARKING_APPROACHES = {
  skyroad: skyroadParking,
  hanbit: {from:2, name:'한빛탑 주차장 입구·정산소', note:'주차면은 방문할 때 고르세요. 정산소부터 통일관 옆 통로와 탑 아래 문을 비교해요.'},
  arboretum: arboretumParking,
  leeungno: {from:4, name:'둔산대공원 주차장 · 미술관 쪽 경계', head:{id:'leeungno-parking-start',title:'주차장 쪽 바닥·계단 확인',pointId:null,stage:'arrival',instruction:'주차 구역 옆 녹색 포장과 낮은 벽을 먼저 봐요. 앞마당 쪽 계단을 보행길과 구분하고, 공원 쪽 포장길 사진과 비교해요.',next:{status:'gap',detail:'주차장 쪽 바닥에서 공원 쪽 보행길까지 이어지는 접점은 사진에 보이지 않아요. 계단을 휠체어 이동선으로 잇지 않아요.',sourceUrls:['https://leeungnomuseum.or.kr/Menu.do?menuId=0402','https://m.blog.naver.com/ddooss4321/224420617761','https://lvlsh.tistory.com/38']}},pin:{anchor:[58,59],position:[48,71],label:'주차장 쪽 경계'},note:'공식 안내의 3·4번 주차장 접근 사진과 공원 보행길·앞마당·157번 문을 비교해요. 첫 연결은 사진이 부족해 선을 잇지 않아요. 특정 주차면과 무단차 출구를 확인한 경로는 아니에요.'},
  museum: {from:2, name:'둔산대공원 주차장 · 시립미술관 쪽 보행 접점', note:'시립미술관 쪽 주차장 진출입로 옆 보행 접점부터 비교해요. 면담에서 언급한 예술의전당 뒤편 주차장과 구분하며, 두 곳을 같은 출발 지점이나 연결된 길로 표시하지 않아요.'},
  science: {from:2, name:'국립중앙과학관 주차장·보행광장 접점', note:'주차장 접점 → 꿈나래길 → 내부 광장 → 미래기술관 문을 비교해요. 공식 공사 안내와 사진 촬영 시기도 확인해요.'},
  sungsim: {from:1,name:'성심당 고객주차장 · 대종로 보도 접점',miniatureLabels:{'sungsim-bus-walk':'주차장 쪽 보도'},note:'문화원 앞 고객주차장의 안내판·차량 출입부가 보이는 대종로 보도부터 시작해요. 같은 쪽 보도 → 본점 골목 → 대기 구역 → 본점 문을 비교해요. 주차면부터 보도까지의 통행을 확인한 경로는 아니에요.'},
  station: {from:4,name:'대전역 서광장2 주차장',head:{id:'station-parking-start',title:'서광장2 주차장 바닥',pointId:null,stage:'arrival',instruction:'주차장 안쪽 기둥과 차량 옆 바닥을 먼저 봐요. 주차장 앞 5번 계단형 출입부와 목적지인 서광장 4번 출입부를 구분하고, 02번 광장 사진과 비교해요.',next:{status:'gap',detail:'서광장2 주차장에서 역 앞 보행 바닥으로 나오는 연속된 사진은 부족해요. 5번 계단이나 차량 통로를 휠체어 이동선으로 잇지 않아요.',sourceUrls:['https://m.blog.naver.com/mellang_2/224228695105','https://www.letskorail.com/']},sourceNotice:{providerLabel:'주차장 방문 사진·기존 입구 자료',title:'5번 계단과 4번 출입부 구분',detail:'주차장 방문 글의 5번 쪽 계단형 출입부와 이 화면의 4번 쪽 출입부는 같은 문이 아니에요. 기존 승강기 안내와 서광장 사진을 함께 비교하며 주차장부터 연결된 무단차 길로 확정하지 않아요.',sourceUrl:'https://m.blog.naver.com/mellang_2/224228695105',sourceLabel:'서광장2 주차장 방문 글'}},pin:{anchor:[44,29],position:[50,16],label:'서광장2 주차장'},note:'서광장2 주차장 사진 → 철도역 앞 광장 → 기존 서광장 출입부 사진을 비교해요. 주차장 앞 계단을 휠체어 이동선으로 잇지 않아요. 번호는 모형 안의 근사 구역이에요.'},
  terminal: {from:4, name:'복합터미널 서관 5층 주차장', heads:[
    {id:'terminal-parking-floor',level:5,title:'서관 5층 주차장 바닥',pointId:null,stage:'arrival',instruction:'서관 5층 사진의 기둥·노란 바닥 표시·방지턱을 먼저 살펴봐요. 장애인 주차구역 사진도 함께 비교하고, 02번 승강기 쪽 기준물을 찾아요.',next:{status:'gap',detail:'주차면에서 5층 승강기 문까지의 연속된 바닥은 사진에 담기지 않았어요. 차량 통로와 보행 공간의 경계를 더 확인해야 해요.',sourceUrls:['https://www.djbusterminal.co.kr/parking01','https://www.djbusterminal.co.kr/facility_west']},sourceNotice:{providerLabel:'대전복합터미널 공식 안내',title:'서관 5~7층 주차장·승강기 위치',detail:'서관 주차장은 5~7층에 있고 공식 층별 안내는 승강기를 동쪽에 표시해요. 5층 차량 입차 통제 시간을 승강기 운영 시간으로 해석하지 않아요.',documentUrl:'https://www.djbusterminal.co.kr/facility_west',documentLabel:'공식 층별 안내도',sourceUrl:'https://www.djbusterminal.co.kr/parking01',sourceLabel:'공식 주차장 사진'}},
    {id:'terminal-parking-lift-cue',level:5,title:'승강기 쪽 ATM 표지',pointId:null,stage:'walk',instruction:'방문 글에서 5층 승강기 앞이라고 소개한 ATM·민원발급기를 찾아요. 승강기의 1층 도착 위치와 GATE 4 방향은 공식 안내도와 비교해요. 이 사진에는 승강기 문이 보이지 않아요.',next:{status:'gap',detail:'승강기 문 앞 바닥, 1층에 내리는 위치와 GATE 4까지의 실내 연결 사진은 더 필요해요. 계단이나 에스컬레이터로 이동하도록 선을 잇지 않아요.',sourceUrls:['https://www.djbusterminal.co.kr/facility_west','https://m.blog.naver.com/peony9900/224094023253']},sourceNotice:{providerLabel:'공식 안내·방문 사진',title:'5층 → 1층 층 이동 구분',detail:'공식 5층·1층 안내도의 승강기 위치를 비교해요. ATM 사진 속 2F 화살표는 매장 방향 표지예요. 특정 승강기의 운행 층과 현재 이용 상태를 확인한 결과는 아니에요.',documentUrl:'https://www.djbusterminal.co.kr/facility_west',documentLabel:'5층·1층 안내도 비교',sourceUrl:'https://m.blog.naver.com/peony9900/224094023253',sourceLabel:'ATM 위치 방문 글'}},
  ],pins:[{anchor:[51,15],position:[30,17],label:'서관 5층 주차장',steps:[0]},{anchor:[63,23],position:[77,14],label:'5층 승강기 쪽',steps:[1]}],miniatureLabels:{'terminal-bus-door':'1층 GATE 4'},stepOverrides:{'terminal-bus-door':{level:1}},note:'서관 5층 주차장 → 승강기 쪽 기준물 → 1층 GATE 4를 비교해요. 모형의 번호는 건물·층을 설명하는 근사 위치예요. 층 사이를 평면 보행선으로 잇지 않아요.'},
  oworld: {from:1, name:'오월드 주차장 앞 횡단 구역', note:'주차장 앞 첫 횡단 지점부터 매표소·정문까지 살펴봐요. 주차면과 횡단 지점 사이 바닥은 방문할 때 확인해요.'},
};

export function parkingArrivalRoute(route) {
  const option=PARKING_APPROACHES[route?.placeId];
  if(!option)return null;
  const heads=option.heads||(option.head?[option.head]:[]);
  const originalSteps=route.steps.slice(option.from);
  const sourceNumbers=Object.fromEntries(originalSteps.map((s,i)=>[String(option.from+i+1).padStart(2,'0'),String(i+heads.length+1).padStart(2,'0')]));
  const context={sourceNumbers};
  const steps=[...heads,...originalSteps.map(s=>({...s,...(option.stepOverrides?.[s.id]||{}),...(option.miniatureLabels?.[s.id]?{miniatureLabel:option.miniatureLabels[s.id]}:{}),instruction:arrivalReferenceText(context,option.stepOverrides?.[s.id]?.instruction??s.instruction),next:s.next?{...s.next,detail:arrivalReferenceText(context,s.next.detail)}:s.next,sourceNotice:s.sourceNotice?{...s.sourceNotice,detail:arrivalReferenceText(context,s.sourceNotice.detail)}:s.sourceNotice}))];
  return {...route,arrival:'parking',sourceNumbers,title:`주차장에서 ${option.destination||route.destination}까지`,destination:option.destination||route.destination,finish:option.finish||route.finish,start:{name:option.name,type:'parking-reference',...(option.startCoordinate?{coordinate:option.startCoordinate}: {})},steps,sources:[...(route.sources||[]),...(option.sources||[])],
    approachNote:option.note,parkingPin:option.pin||null,parkingPins:option.pins||null,
    gaps:steps.slice(0,-1).filter(s=>!s.next||s.next.status==='gap').map(s=>s.next?.detail||'다음 위치까지 연결 사진 필요')};
}

export function arrivalReferenceText(route,text) {
  if(typeof text!=='string'||!route.sourceNumbers)return text;
  return text.replace(/(?<!\d)(\d{2})번/g,(whole,value)=>route.sourceNumbers[value]?`${route.sourceNumbers[value]}번`:whole);
}
