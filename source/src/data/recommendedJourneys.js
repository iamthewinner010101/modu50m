export const RECOMMENDED_EXPERIENCES = [
  {id:'landmark',tag:'대전의 상징',title:'한빛탑에서 대전을 만나요',description:'정류장과 횡단부를 지나, 탑 아래 문을 찾아봐요.',places:['hanbit'],cover:'hanbit',sourceUrl:'https://access.visitkorea.or.kr/ms/detail.do?cotId=b55fb417-4e5d-4810-bd9f-4e49c0c69e4e'},
  {id:'nature',tag:'자연·휴식',title:'초록 속에서 쉬어 가요',description:'열대식물원 앞마당과 왼쪽 출입문을 살펴봐요.',places:['arboretum'],cover:'arboretum',sourceUrl:'https://www.daejeon.go.kr/gar/contentsHtmlView.do?menuSeq=8029'},
  {id:'art',tag:'전시·예술',title:'보고 싶은 전시를 만나러',description:'두 미술관은 입구가 달라요. 갈 곳을 먼저 골라요.',places:['museum','leeungno'],cover:'museum',sourceUrl:'https://access.visitkorea.or.kr/cos/detail.do?cotId=bd853c05-4373-414e-8310-76d2f6fd8be3'},
  {id:'science',tag:'과학·체험',title:'궁금한 세상을 만나러',description:'국립중앙과학관 안, 미래기술관 문 앞을 살펴봐요.',places:['science'],cover:'science',sourceUrl:'https://science.go.kr/mps/cntnts/1023/moveCntnts.do'},
  {id:'family',tag:'가족·동물·정원',title:'가족과 오월드에 가요',description:'버스에서 내려 두 횡단 구역과 정문을 살펴봐요.',places:['oworld'],cover:'oworld',sourceUrl:'https://access.visitkorea.or.kr/ms/detail.do?cotId=6814a375-ed51-4a73-b84f-645e29518119'},
  {id:'oldtown',tag:'빵·원도심',title:'대전의 골목과 빵을 만나요',description:'성심당 본점과 으능정이거리를 각각 준비해요.',places:['sungsim','skyroad'],cover:'sungsim',sourceUrl:'https://sungsimdang.co.kr/31/15'},
  {id:'transport',tag:'기차·고속버스',title:'대전에 도착해 다음 길로',description:'대전역·터미널 입구 방문과, 기차·고속버스에서 내린 뒤의 이동을 나누어 준비해요.',places:['station','terminal'],cover:'station',sourceUrl:'https://www.djbusterminal.co.kr/facility_east'},
];
export const RECOMMENDED_PLACE_IDS = RECOMMENDED_EXPERIENCES.flatMap(item=>item.places);
export function matchingExperiences(query='',experience='all',placeName=id=>id) {
  const normalize=s=>s.replace(/\s+/g,'').toLocaleLowerCase('ko');
  const needle=normalize(query);
  return RECOMMENDED_EXPERIENCES.filter(item=>(experience==='all'||item.id===experience)&&normalize([item.title,item.tag,item.description,...item.places.map(placeName)].join(' ')).includes(needle));
}
