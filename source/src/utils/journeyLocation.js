// A photo may appear at several stops. Keep the stop ID as well as the image.
export function readJourneyLocation(search, route) {
  if (!route) return null;
  const params = new URLSearchParams(search);
  if (params.get('place') !== route.placeId) return null;
  const index = route.steps.findIndex(step => step.id === params.get('step'));
  if (index < 0) return null;
  return {index, photo: params.get('routePhoto'), comments: params.get('comments') === '1'};
}

export function journeyLocationUrl(href, route, index, {photo, comments = false} = {}) {
  if (!route?.steps[index]) throw new Error('선택한 위치를 확인하지 못했어요.');
  const url = new URL(href);
  url.searchParams.set('mode', 'visual-preview');
  url.searchParams.set('view', 'detail');
  url.searchParams.set('place', route.placeId);
  if(route.arrival==='parking')url.searchParams.set('arrival','parking');
  else url.searchParams.delete('arrival');
  url.searchParams.set('step', route.steps[index].id);
  if (route.steps[index].pointId) url.searchParams.set('point', route.steps[index].pointId);
  else url.searchParams.delete('point');
  if (photo) url.searchParams.set('routePhoto', photo);
  else url.searchParams.delete('routePhoto');
  if (comments) url.searchParams.set('comments', '1');
  else url.searchParams.delete('comments');
  // QA links must retain their isolated store, even after sharing or reloading.
  return url;
}

export function requestedJourneyPhoto(location, gallery) {
  if (!location?.photo) return null;
  const photo = gallery.find(item => item.stepIndex === location.index && item.image === location.photo);
  return photo ? {image: photo.image, stepIndex: location.index} : null;
}

export function arrivalPreparationQuestions(route) {
  return [
    {label:'내릴 위치',text:`[택시 하차 준비] ${route.destination}에 갈 때, 문과 연결되는 하차 위치와 휠체어를 내릴 공간을 확인하고 싶어요.`},
    {label:'차단기·보행 출구',text:`[택시 하차 준비] ${route.destination} 주변 차량 출입·차단기 운영과, 차에서 내린 뒤 이용할 보행 출구를 확인하고 싶어요.`},
    {label:'입구까지 바닥',text:`[택시 하차 준비] 실제 하차 지점부터 ${route.destination}까지 이어지는 바닥·경사로·문턱 사진을 보고 싶어요.`},
  ];
}

export function nearbyArrivalContext(placeId) {
  if(!['museum','leeungno','arts'].includes(placeId))return null;
  return {
    summary:'면담에서 알려 준 곳은 대전예술의전당 뒤편 주차장입니다. 미술관·이응노미술관 쪽 출발 지점, 공공자료의 택시승강장과는 구분합니다. 택시에서 내릴 자리와 들어갈 문은 기사님·시설에 문의합니다.',
    sourceUrl:'https://www.daejeon.go.kr/djac/djacContentsHtmlView.do?menuSeq=6770',
    sourceCheckedAt:'2026-10-16',
    evidenceKind:'interview-venue-clarification',
  };
}

// Address records and photographed bays are separate from the walking routes.
export const ARRIVAL_LOCATIONS = [
  {id:'museum-taxi-stop',placeId:'museum',kind:'taxi',title:'예술의전당 정류장 근처 택시승강장',
    placeName:'대전시립미술관 주변',address:'대전광역시 서구 둔산대로 155',
    landmark:'공공자료에 등록된 승강장 주소입니다. 면담에서 들은 예술의전당 뒤편 주차장과 구분해 봅니다.',
    sourceUrl:'https://www.data.go.kr/data/15077249/fileData.do',sourceLabel:'대전광역시 택시승강장 현황',sourceDate:'2020-12-31',
    note:'휠체어를 내릴 공간과 차량 정차 위치는 기사님과 함께 정합니다. 가까운 입구 사진도 함께 살펴보세요.'},
  {id:'terminal-taxi-stop',placeId:'terminal',kind:'taxi',title:'삼성디지털프라자 앞 택시승강장',
    placeName:'대전복합터미널 주변',address:'대전광역시 동구 동서대로 1684',
    landmark:'공공자료의 승강장 주소와 터미널 서관 주소(1689)를 구분해서 봅니다.',
    sourceUrl:'https://www.data.go.kr/data/15077249/fileData.do',sourceLabel:'대전광역시 택시승강장 현황',sourceDate:'2020-12-31',
    note:'승강장에서 서관 입구까지 도로를 건너는지와 휠체어를 내릴 공간을 기사님에게 확인합니다.'},
  {id:'skyroad-accessible-bay',placeId:'skyroad',kind:'parking',title:'고객주차장 정산실 옆 장애인 지정주차 구역',
    placeName:'스카이로드',address:'대전광역시 중구 중교로 79-1',
    landmark:'회색 정산실 왼쪽, 파란 주차 표지 아래 흰색 휠체어 표시를 찾습니다.',
    image:'/modu50m/route-photos-v77/skyroad-lot-f2.png',focus:[41,56],
    sourceUrl:'https://map.naver.com/p?c=17.0,0,0,0,adh&p=_JXHKMGIh7KH59jzLpgfww,0.0,10.0,80.0,Float',
    sourceLabel:'네이버 거리뷰 원본',sourceDate:'2023-08-01',
    stepId:'skyroad-parking-floor',note:'주차면 옆 차량 통로와 차단기, 골목으로 나가는 방향을 함께 살펴봅니다.'},
  {id:'terminal-accessible-bay',placeId:'terminal',kind:'parking',title:'서관 장애인 지정주차 구역',
    placeName:'대전복합터미널',address:'대전광역시 동구 동서대로 1689 · 서관 주차장',
    landmark:'기둥 옆 파란 바닥과 흰색 휠체어 표시, 사선으로 비워 둔 공간을 찾습니다.',
    image:'/modu50m/mobility-v21/terminal-v21-research-c-02-94783564.jpg',focus:[40,66],
    sourceUrl:'https://www.djbusterminal.co.kr/parking01',sourceLabel:'대전복합터미널 공식 주차 안내',sourceDate:null,
    stepId:'terminal-parking-floor',note:'공식 사진에 보이는 구역입니다. 사진의 촬영 층과 현재 빈자리는 주차장에 확인합니다.'},
];

export function arrivalLocationOptions(kind) {
  return ARRIVAL_LOCATIONS.filter(item=>item.kind===kind);
}

export function readArrivalLocation(search,placeId) {
  const id=new URLSearchParams(search).get('arrivalLocation');
  return ARRIVAL_LOCATIONS.find(item=>item.id===id&&item.placeId===placeId)||null;
}

export function arrivalLocationLink(href,item) {
  if(!ARRIVAL_LOCATIONS.some(record=>record.id===item?.id))throw new Error('위치 자료를 확인해 주세요.');
  const url=new URL(href);
  for(const key of ['step','point','routePhoto','comments','board'])url.searchParams.delete(key);
  url.searchParams.set('mode','visual-preview');url.searchParams.set('view','detail');
  url.searchParams.set('place',item.placeId);url.searchParams.set('arrival','parking');
  url.searchParams.set('arrivalLocation',item.id);
  return url;
}

export function questionBoardThreads(notes,{step,scope='step',query='',filter='all'}={}) {
  const search=query.trim().toLowerCase();
  return notes.filter(note=>!note.parent&&(scope==='place'||note.step===step))
    .filter(note=>(!search||`${note.body} ${note.nickname}`.toLowerCase().includes(search))&&
      (filter==='all'||note.kind==='question'&&(filter!=='unanswered'||!notes.some(reply=>reply.parent===note.id))));
}
