import {RECOMMENDED_EXPERIENCES} from './recommendedJourneys.js';
export const VISITOR_COPY={
  hanbit:{title:'한빛탑',description:'대전의 상징을 만나러, 정류장에서 탑 아래 문까지.',aliases:'엑스포 물빛광장 한빛탑'},
  arboretum:{title:'한밭수목원 · 열대식물원',description:'정류장에서 열대식물원 입구까지. 동원·서원 산책로는 별도로 준비해요.',aliases:'식물원 수목원 열대'},
  museum:{title:'대전시립미술관',description:'보고 싶은 전시 앞에서, 보도와 경사로를 살펴봐요.',aliases:'시립 미술관 전시'},
  leeungno:{title:'이응노미술관',description:'작품을 만나기 전, 앞마당과 유리문을 살펴봐요.',aliases:'이응노 고암 미술관'},
  science:{title:'국립중앙과학관 · 미래기술관',description:'넓은 과학관 안, 찾아갈 전시관은 미래기술관이에요.',aliases:'과학관 미래기술관 국립 중앙'},
  oworld:{title:'대전오월드',description:'가족과 함께, 버스에서 내려 횡단 구역과 정문으로.',aliases:'오월드 동물원 정원'},
  sungsim:{title:'성심당 본점',description:'빵을 만나러 가는 길, 대기 줄과 문 앞 공간.',aliases:'성심당 본점 빵'},
  skyroad:{title:'으능정이문화의거리',description:'대전의 원도심, 횡단 지점과 가게 앞 보행 공간.',aliases:'으능정이 스카이로드 은행동 문화의거리'},
  station:{title:'대전역',description:'시내버스에서 서광장으로, 또는 기차로 도착한 뒤. 이용 목적을 나누어 준비해요.',aliases:'대전역 기차 철도 KTX 도착 승강장'},
  terminal:{title:'대전복합터미널',description:'서관 GATE 4 방문과 동관 하차 후 이동을 구분해요.',aliases:'고속터미널 복합터미널 시외버스 고속버스 도착 하차장 동관 서관'},
};
const normalize=s=>s.replace(/\s+/g,'').toLocaleLowerCase('ko');
export function visitorPlaces(query='',experience='all'){
  const needle=normalize(query);
  return RECOMMENDED_EXPERIENCES.filter(e=>experience==='all'||e.id===experience).flatMap(e=>e.places.map(id=>({id,...VISITOR_COPY[id],experience:e}))).filter(p=>normalize([p.title,p.description,p.aliases,p.experience.tag].join(' ')).includes(needle));
}
