import visitsV22 from './focusedVisitsV22.json' with {type:'json'};
import miniaturesV22 from './approachMiniaturesV22.json' with {type:'json'};
import { getArrivalRoute, routeStartPoint } from './arrivalRoutes.js';
import visitsV30 from './focusedVisitsV30.json' with {type:'json'};
// Photo coverage is distinct from route or entrance verification.
export const RESEARCH_PLACE_IDS = ['museum','arts','leeungno','arboretum','science','oworld','ppuri','jangtaesan','library','dunsan1','civic','cityhall','happywelfare','wolpyeonglib','dunsanlib','yuseongwelfare','subway','govstation','station','seodaejeon','terminal','govbus','sintanjin'];
export const FOCUS_PLACE_IDS = ['hanbit', ...RESEARCH_PLACE_IDS, 'sungsim', 'skyroad'];
const step = (label, title, points, question) => ({ label, title, points, question });
const kto = cot => `https://access.visitkorea.or.kr/ms/detail.do?cotId=${cot}`;
const BASE_VISITS = {
  hanbit: {
    category: '버스 · 관광', purpose: '버스에서 내려 한빛탑 입구를 찾는 날',
    reason: '정류장·횡단부·경사로 사진을 비교할 수 있어요.',
    start: '공개 자료의 DCC종점 · 현재 번호와 운행 방향 확인 필요',
    destination: '탑 아래 유리 출입문 · 현재 이용 문 확인 필요',
    sourceUrl: kto('b55fb417-4e5d-4810-bd9f-4e49c0c69e4e'), sourceLabel: '한국관광공사 위치·편의시설 자료',
    checkedAt: '2026-09-23', finding: '출처의 DCC종점·횡단부 위치 표시와 원본 사진 3장을 대조했어요. 위치 표시는 시설의 위치이며 촬영 좌표가 아니에요.',
    steps: [
      step('내리는 곳', 'DCC종점 주변', ['research-stop'], '현재 정류장 표지와 운행 방향이 같은가요?'),
      step('보도에 들어가기', '가로수 옆 보도', ['approach'], '차에서 내린 곳과 보도 사이의 턱 낮춤은 어디인가요?'),
      step('방향·횡단 살피기', '공원 입구 앞 횡단부', ['research-crossing', 'threshold'], '건너편에서 광장으로 이어지는 길이 보이나요?'),
      step('입구 찾기', '탑 앞 경사로와 문', ['mobility-01'], '경사로 끝에서 실제 사용할 문까지 어떻게 이어지나요?'),
    ],
    gap: '횡단부에서 광장·탑 경사로까지, 경사로 끝에서 문턱까지의 연결 사진이 더 필요해요.',
    angle: { image: '/modu50m/visual-preview-v21/hanbit-entrance-angle.png', label: '경사로·문 앞 구도', referencePoint: 'mobility-01', alt: '한빛탑 실제 경사로 사진을 참고한 입구 주변 AI 미니어처. 형태는 근사이며 실측 도면이 아닙니다.' },
  },
  dunsan1: {
    category: '주차 · 생활', purpose: '처음 민원실을 찾아가는 날',
    reason: '주차 구역과 붉은 경사 통로를 함께 살펴봐요.',
    start: '센터 앞 주차·하차 구역 · 승하차 위치 미확인', destination: '민원실 유리문 · 현재 개방 방식 미확인',
    sourceUrl: 'https://map.kakao.com/?map_type=TYPE_MAP&map_attribute=ROADVIEW&panoid=1200996512&pan=263.19740871345994&tilt=0&zoom=0', sourceLabel: '민원실 앞 카카오 원본 장면',
    checkedAt: '2026-09-23', finding: '기존 거리뷰와 2025년 게시된 서구 공식 방문 사진 3장을 대조했어요. 가까운 문 앞에서 매트·금속 경계·안내판을 볼 수 있어요. 실제 연결과 현재 배치는 추가 확인해야 해요.',
    steps: [
      step('내리는 곳', '주차·하차 구역', ['mobility-v20-02'], '차 문을 열고 내릴 공간과 보도 연결은 어디인가요?'),
      step('보도에 들어가기', '주차장과 앞마당 접점', ['research-b-01'], '볼라드와 점자블록 사이에서 경사 통로까지 어떻게 이어지나요?'),
      step('방향·경사 살피기', '오른쪽 붉은 경사 통로', ['mobility-v20-01'], '통로 시작과 끝의 높이 차이는 어떤가요?'),
      step('입구 찾기', '민원실 문과 바닥 경계', ['research-b-02', 'mobility-v20-01'], '문 앞 매트·금속 경계·안내판을 살펴보고, 현재 문턱과 개방 방식을 확인해요.'),
    ], gap: '주차 구역에서 경사 통로 시작까지의 연속 연결과 문 앞의 실제 높이 차·통과 폭이 더 필요해요.',
    angle: { image: '/modu50m/visual-preview-v21/dunsan1-ramp-angle.png', label: '오른쪽 경사 통로 구도', referencePoint: 'mobility-v20-01', alt: '둔산1동 민원실의 오른쪽 경사 통로를 가까이 보는 AI 미니어처. 실제 사진을 참고한 근사 표현입니다.' },
  },
  museum: {
    category: '문화 · 전시', purpose: '보고 싶은 전시를 만나러 가는 날',
    reason: '서측 보도와 이름이 보이는 출입문을 비교해요.',
    start: '하차 정류장·주차 위치 선정 전', destination: '미술관 이름이 보이는 문 · 서측 사진과 연결 확인 필요',
    sourceUrl: kto('16128884-a91d-4455-95bb-200e8f5ac024'), sourceLabel: '한국관광공사 미술관 편의정보', checkedAt: '2026-09-23',
    finding: '공식 편의정보와 2016년 게시된 외부 경사로·승강기 사진을 추가로 확인했어요. 과거 사진의 시설이 현재 어떻게 이어지고 운영되는지는 더 확인해야 해요.',
    steps: [step('내리는 곳','출발 지점 선정 전',[],'정류장 방향 또는 주차 후 보도로 들어가는 곳을 확인해요.'),step('보도에 들어가기','서측 주차 공간',['approach'],'주차 차량 옆으로 보도가 이어지나요?'),step('방향 살피기','옆길과 외부 경사로',['threshold','research-a-01'],'두 사진의 위치 관계와 현재 경사로 상태를 더 확인해요.'),step('입구 찾기','출입문·외부 승강기',['mobility-01','research-a-02'],'출입문과 과거 승강기 사진을 비교하고 현재 사용할 입구를 확인해요.')],
    gap:'서측 보도 사진에서 공식 출입문 사진까지 이어지는 연결이 비어 있어요.',
  },
  library: {
    category:'교육 · 도서관', purpose:'처음 도서관에서 책을 빌리는 날', reason:'외관만으로는 알 수 없는 입구 정보를 찾아봐요.',
    start:'하차·주차 지점 선정 전', destination:'현재 사용할 계단 없는 출입구 확인 전',
    sourceUrl:'https://www.daejeon.go.kr/drh/board/boardNormalView.do?boardId=normal_0189&menuSeq=1632&ntatcSeq=1503425570',sourceLabel:'대전시 도서관 공개 자료',checkedAt:'2026-09-23',
    finding:'공식 리모델링 완료 안내와 2026년 게시된 본관 앞 광장 사진을 확인했어요. 게시 연도는 촬영일이 아니며, 계단 없는 출입구와 하차 지점부터의 연결은 아직 알 수 없어요.',
    contextPoint:'research-b-01',
    steps:[step('내리는 곳','하차·주차 위치',[],'출입구와 이어지는 출발 지점을 찾아야 해요.'),step('보도에 들어가기','보도 진입부',[],'턱 낮춤과 보도 접점 사진이 필요해요.'),step('방향 살피기','계단 없는 접근로',[],'현재 사용할 경사로·승강기 연결을 확인해요.'),step('입구 찾기','이용할 출입문',[],'정면 사진은 보조 자료이며 문 앞 이동 사진은 없어요.')],
    gap:'정면과 앞 광장 사진이 있어요. 계단을 거치지 않는 출입구와 하차 지점부터 이어지는 사진이 더 필요해요.',
  },
  subway: {
    category:'교통 · 지하철', purpose:'계단 출구와 승강기 위치를 구분하는 날',reason:'2번 출구 근처 승강기와 8번 계단 출구를 구분해요.',
    start:'공식 안내의 2번 출구 근처 지상 승강기', destination:'지상 승강기 문과 보도가 만나는 곳',
    modelScope:'전체 모형은 8번 계단 출구예요. 사진 속 구간 탭에서는 2번 출구 근처 승강기와 그 참고 사진을 함께 볼 수 있어요.',
    sourceUrl:'https://www.djtc.kr/kor/stationInfo.do?menuIdx=38&station_code=1111',sourceLabel:'대전교통공사 시청역 정보',checkedAt:'2026-09-23',
    finding:'공식 교통약자 안내의 2번 출구 근처 승강기와 2021년 스테이션뷰 장면을 대조했어요. 원본 타일을 그대로 이어 문 앞 사진을 확보했어요. 기존 8번 계단 출구와는 다른 곳이며 현재 운영 상태는 확인 전이에요.',
    relatedUrl:'http://station.kric.go.kr/v2/altmInfoSys/index.do?areCd=05&lnCd=1&railOprIsttCd=DJ&prprStinCd=0870',relatedLabel:'공식 역 정보에 연결된 교통약자 이동경로',
    steps:[step('내리는 곳','2번 출구 근처 승강기',['research-c-01'],'지상 승강기 위치와 현재 운영 안내를 확인해요.'),step('보도에 들어가기','승강기 앞 보도 접점',['research-c-01'],'같은 사진의 난간 끝과 보도 재료 경계를 살펴봐요.'),step('방향 살피기','8번 계단 출구와 구분',['scene','mobility-01'],'서로 다른 출구의 참고 사진이에요. 두 지점의 연결을 확인한 경로가 아니에요.'),step('입구 찾기','지상 승강기 문',['research-c-01'],'같은 사진의 문과 호출 버튼을 살펴봐요. 실제 문턱·폭·운영은 추가 확인이 필요해요.')],
    gap:'2021년 지상 승강기 사진을 확보했어요. 현재 운영 상태와 하차 지점부터 승강기까지의 연속 사진은 더 확인해야 해요.',
  },
  arboretum: {
    category:'공원 · 산책',purpose:'나무 사이에서 쉬어 가고 싶은 날',reason:'흙·자갈과 목재 데크의 바닥 차이를 살펴봐요.',
    start:'공개 자료의 장애인 주차 구역 · 구체 위치 추가 확인',destination:'이용할 동원·서원 입구 확인 전',
    modelScope:'모형은 동원 장미원 모습이에요. 주차 구역·열대식물원 사진과의 실제 위치 관계는 추가 확인이 필요해요.',
    sourceUrl:kto('81cc7479-c010-4bdd-9a29-3121bb578cb8'),sourceLabel:'한국관광공사 수목원 편의정보',checkedAt:'2026-09-23',
    finding:'2025년 게시된 공식 자료에서 주차 구역·건물 옆 보행로·열대식물원 목재 길을 확보했어요. 각각 다른 장면이며 정확한 구역 관계와 현재 바닥 상태는 추가 확인이 필요해요.',
    steps:[step('내리는 곳','장애인 주차 구역',['research-a-01'],'사진 속 주차 구역의 정확한 위치와 갈 입구를 맞춰 봐요.'),step('보도에 들어가기','건물 옆 보행로',['research-a-02'],'주차 구역에서 이 보행로로 들어오는 접점은 더 확인해요.'),step('바닥 살피기','흙·자갈과 데크',['mobility-01','mobility-02','research-a-03'],'서로 다른 구역의 바닥 참고 사진이에요. 하나의 동선으로 잇지 않아요.'),step('입구 찾기','동원·서원 입구',[],'방문할 구역 이름과 실제 입구 사진을 맞춰야 해요.')],
    gap:'산책길 사진을 하나의 연속 동선으로 잇기 전에 구역·입구와의 위치 관계를 확인해야 해요.',
  },
};
export const FOCUSED_VISITS = Object.fromEntries(FOCUS_PLACE_IDS.map(id => {
  const visit = {...BASE_VISITS[id], ...visitsV22[id], ...visitsV30[id]};
  if(id==='station')Object.assign(visit,{category:'버스·철도',purpose:'버스에서 내려 대전역 철도역 입구를 찾는 날',reason:'서광장 횡단부와 철도역 유리문을 사진으로 비교해요.',modelScope:'철도역과 서광장 모형이에요. 도시철도 승강기는 별도의 보조 사진으로 구분해요.'});
  if(id==='terminal')Object.assign(visit,{category:'버스·고속터미널',purpose:'버스에서 내려 복합터미널 서관을 찾는 날',reason:'11830 정류장에서 서관 1층 대합실 입구까지 살펴봐요.'});
  if (miniaturesV22[id] && !visitsV30[id]?.angle) visit.angle = miniaturesV22[id];
  const route = getArrivalRoute(id);
  if (route) {
    visit.start = route.start.name;
    visit.destination = route.destination;
    visit.gap = route.gaps.join(' ');
    if(route.start.code){
      visit.finding=route.summary;
      visit.sourceUrl=route.start.sourceUrl;
      visit.sourceLabel=`${route.start.name} ${route.start.code} 정류장 위치`;
      visit.checkedAt=route.checkedAt;
      visit.steps=[
        step('내리는 곳',route.start.name,[],'정류장 번호와 도로의 어느 쪽인지 맞춰 봐요.'),
        step('보도로 이동', '정류장에서 이어지는 보도',[],'하차 지점에서 다음 보도까지 바닥을 살펴봐요.'),
        step('방향·갈림길','횡단·회전·진입 지점',[],'다음 표식과 방향을 실제 사진에서 확인해요.'),
        step('입구 찾기',route.destination,[],'실제 사용할 문과 문 앞 바닥을 살펴봐요.'),
      ];
    }
    const stageIndex = {arrival:0, approach:1, crossing:2, entrance:3};
    visit.steps = visit.steps.map((step,index) => ({...step, points:[...new Set([...step.points, ...route.steps.filter(s=>stageIndex[s.stage]===index && s.pointId).map(s=>s.pointId)])]}));
  }
  return [id, visit];
}));
export function coveredSteps(site) { return FOCUSED_VISITS[site.id]?.steps.filter(s => s.points.some(id => site.photos[id])).length || 0; }
export function focusStartPoint(site) { const visit=FOCUSED_VISITS[site.id]; return routeStartPoint(site) || visit?.angle?.referencePoint || visit?.contextPoint || visit?.steps.flatMap(s=>s.points).find(id=>site.photos[id]) || site.checkpoints[0].id; }
