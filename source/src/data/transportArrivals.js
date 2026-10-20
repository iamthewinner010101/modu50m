export const TRANSPORT_ARRIVALS = {
  station:{title:'기차로 대전에 도착한 뒤',start:'내 열차가 도착하는 대전역 승강장',summary:'승강장에서 내린 뒤, 엘리베이터와 출구를 거쳐 다음 교통편까지 준비해요.',evidence:'현재 가진 미니어처·거리 사진은 시내버스에서 서광장으로 오는 방향이에요. 승강장부터 밖으로 나가는 연속 사진은 아직 확보하지 못했어요.',sourceUrl:'https://www.korail.com/intro',sourceLabel:'코레일 공식 안내',
    steps:[
      {id:'platform',title:'내릴 승강장과 도움 요청',question:'도착 열차·시간에 맞춰 내릴 승강장과 휠체어 승하차 지원 신청 방법을 확인하고 싶어요.'},
      {id:'lift',title:'승강장 → 엘리베이터 → 대합실',question:'내릴 승강장의 엘리베이터 위치·운행 상태와 대합실까지의 이동 방향을 확인하고 싶어요.'},
      {id:'exit',title:'다음 교통편에 맞는 출구',question:'내가 탈 시내 교통편에 맞는 동광장·서광장 출구와 대합실에서 그 문까지의 길을 확인하고 싶어요.'},
      {id:'transfer',title:'출구 → 보도 → 다음 교통편',question:'선택한 출구에서 실제 탑승 정류장·지하철 엘리베이터·택시 승차 위치까지의 보도, 횡단 양끝과 도움 요청 방법을 확인하고 싶어요.'},
    ]},
  terminal:{title:'고속·시외버스로 대전에 도착한 뒤',start:'복합터미널 동관 1층 하차장',summary:'동관에서 내린 뒤, 이용할 시내 교통편에 맞는 출입문과 보도를 찾아봐요.',evidence:'공식 동관 시설 안내는 1층을 하차장으로 안내해요. 기존 미니어처의 서관 GATE 4와 출발 위치가 달라요.',sourceUrl:'https://www.djbusterminal.co.kr/facility_east',sourceLabel:'터미널 공식 동관 안내',
    map:{image:'/modu50m/arrival-reference/terminal-east-1f.svg',sourceLabel:'공식 안내도 원본 ↗',title:'대전복합터미널 동관 1층 안내도',stepTitle:'건물 배치를 보는 공식 안내도',credit:'대전복합터미널 · 안내도 기준 2026년 1월 · 웹 확인 2026-09-30',sourceUrl:'https://www.djbusterminal.co.kr/facility_east',scope:'상단은 터미널 하차장, 하단은 서관 승차장 방향이에요. 안내도 번호는 매장 번호이며 우리 동선 번호와 달라요. 폭·경사·현재 이동 연결을 측정한 지도는 아니에요.',observations:[]},
    steps:[
      {id:'alighting',title:'동관 하차장에서 내리기',question:'도착할 버스의 휠체어 하차 방법과 실제 하차 위치, 내려서 실내로 들어갈 보행 공간을 확인하고 싶어요.'},
      {id:'help',title:'동관 안에서 위치 확인',question:'동관 1층 관광 안내소나 직원에게 도움을 받을 수 있는 위치, 이용할 화장실과 그곳까지의 길을 확인하고 싶어요.'},
      {id:'exit',title:'이용할 교통편 쪽 출입문',question:'다음 교통편에 맞는 동관 출입문과 문턱·열린 문 폭을 확인하고 싶어요. 서관으로 이동해야 한다면 이용할 통로·엘리베이터를 별도로 확인하고 싶어요.'},
      {id:'transfer',title:'문 밖 보도 → 실제 탑승 위치',question:'동관 문에서 실제 탑승할 시내버스 정류장이나 택시 위치까지 보도·턱 낮춤·횡단 양끝을 보여 주는 사진을 확인하고 싶어요.'},
    ]},
};
export const arrivalCardKey=(id,qa=false)=>`modu50m.arrival-card.v1.${qa?'qa.':''}${id}`;
export function readArrivalCard(storage,id,qa=false) {
  const raw=storage.getItem(arrivalCardKey(id,qa));
  if(!raw)return {raw:null,arrival:'',onward:'아직 정하지 않았어요',question:''};
  const c=JSON.parse(raw);
  if(c.schema!=='modu50m.arrival-card.v1'||c.placeId!==id||!['arrival','onward','question'].every(k=>typeof c[k]==='string'))throw Error('이전 도착 준비 카드를 읽지 못했어요. 덮어쓰지 않고 파일 보관을 이용할 수 있어요.');
  return {...c,raw};
}
export function saveArrivalCard(storage,id,qa,card,previousRaw) {
  if(!TRANSPORT_ARRIVALS[id])throw Error('도착 준비 대상 장소를 확인해 주세요.');
  if(storage.getItem(arrivalCardKey(id,qa))!==previousRaw)throw Error('다른 창에서 카드가 바뀌었어요. 새로고침 후 최신 내용을 확인해 주세요.');
  if(!['arrival','onward','question'].every(k=>typeof card[k]==='string')||card.question.length>1600||card.arrival.length>200||card.onward.length>200)throw Error('입력 길이를 확인해 주세요.');
  const packet={schema:'modu50m.arrival-card.v1',placeId:id,intent:'arrival',arrival:card.arrival,onward:card.onward,question:card.question,savedAt:new Date().toISOString(),continuousRouteVerified:false};
  const raw=JSON.stringify(packet);storage.setItem(arrivalCardKey(id,qa),raw);
  if(storage.getItem(arrivalCardKey(id,qa))!==raw)throw Error('저장 결과를 확인하지 못했어요. 카드 파일을 보관해 주세요.');
  return {...packet,raw};
}
export function arrivalCardText(id,card,contact) {
  const trip=TRANSPORT_ARRIVALS[id];
  return `모두의50m · 대전 도착 후 준비 카드\n${trip.title}\n\n출발: ${trip.start}\n내 도착 정보: ${card.arrival||'아직 입력하지 않았어요'}\n다음 교통편: ${card.onward}\n\n더 확인할 질문\n${card.question||'아직 적지 않았어요.'}\n\n사진·자료 범위\n${trip.evidence}\n확인할 순서: ${trip.steps.map(s=>s.title).join(' → ')}\n\n문의: ${contact.name}${contact.phone?` ${contact.phone}`:''}\n${trip.sourceLabel}: ${trip.sourceUrl}\n\n승강장·하차장부터 시내 교통편까지의 연속 이동은 확인 전입니다. 현장 조사나 실제 문의 결과를 대신하지 않습니다.\n`;
}
