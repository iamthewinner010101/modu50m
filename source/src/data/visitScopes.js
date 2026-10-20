// Scope of the photographs we hold, not a certified accessible itinerary.
export const VISIT_SCOPES = {
  hanbit:{title:'한빛탑 · 탑 아래 출입문',destination:'한빛탑 경사로 끝 유리 출입문',boundary:'DCC종점에서 탑 아래 문까지 살펴봐요. 전망대 내부 이동은 별도 준비가 필요해요.',finish:'경사로 끝에서 문턱·열린 문 폭·여는 방법을 확인해요.'},
  arboretum:{title:'한밭수목원 · 열대식물원',destination:'열대식물원 경사판과 안쪽 출입 지점',boundary:'34740 정류장부터 열대식물원 입구까지예요. 동원·서원 산책로 전체를 다루지는 않아요.',finish:'경사판 다음 문턱과 안쪽 통과 장치 옆 휠체어 통로를 확인해요.'},
  museum:{title:'대전시립미술관 · 이름 아래 유리문',destination:'대전시립미술관 이름 아래 유리 출입문',boundary:'34730 정류장부터 경사로와 이름 아래 유리문을 살펴봐요. 04번 공원 갈림길에서 경사로 시작점까지의 연결 바닥 사진은 더 필요해요. 엘리베이터를 이용하는 별도 동선은 이 순서와 구분해요.',finish:'미술관 이름과 차양으로 문을 찾고, 경사로 끝·문 앞 바닥·열리는 폭을 비교해요.'},
  leeungno:{title:'이응노미술관 · 157번 주소판 옆 문',destination:'둔산대로 157 주소판 옆 출입문 후보',boundary:'시립미술관과 같은 34730 정류장에서 출발해도 찾아갈 문은 달라요. 사진의 157번 문이 현재 관람객 입구인지 확인해요.',finish:'157번 문을 현재 이용하는지, 문턱·자동문과 앞마당 연결을 확인해요.'},
  science:{title:'국립중앙과학관 · 미래기술관',destination:'미래기술관 간판 아래 유리문',boundary:'42930 정류장부터 미래기술관 문 앞까지 준비해요. 다른 전시관과 과학관 전체 관람 동선은 별도예요.',finish:'미래기술관 직전 보행로와 문 아래 바닥·자동문을 확인해요.'},
  oworld:{title:'대전오월드 · 매표소와 입장 통로',destination:'정문 매표소 주변 · 실제 입장 게이트 추가 확인',boundary:'정류장부터 두 횡단 구역과 매표소까지 사진을 봐요. 표를 산 뒤 통과할 휠체어 입장 게이트 사진은 더 필요해요.',finish:'매표소 다음 실제 입장 게이트의 위치·폭과 직원에게 요청할 방법을 확인해요.'},
  sungsim:{title:'성심당 본점 · 대종로480번길 15',destination:'성심당 본점 출입문 · 대종로480번길 15',boundary:'이안과 앞 20780 정류장에서 본점을 찾아가요. 케익부띠끄 등 다른 지점의 입구와 구분해요.',finish:'대기 줄에서 문까지 공간과 가려진 문턱을 가까운 사진으로 확인해요.'},
  skyroad:{title:'으능정이문화의거리 · 스카이로드',destination:'스카이로드 아래 거리 진입부',boundary:'20050 정류장 쪽 보도에서 거리로 들어가는 범위예요. 반대편 사진은 위치 비교용이며, 개별 가게 출입문은 별도 확인해요.',finish:'거리 도착 뒤 방문할 가게를 정하고, 그 가게의 문턱·출입문을 확인해요.'},
  station:{title:'대전역 · 서광장 4번문',destination:'대전역 철도역 서광장 4번문',boundary:'시내버스 12410 정류장 → 철도역 서광장 4번문을 비교해요. 도시철도 4번 계단·철도역 5번 계단과 구분하고, 문 안쪽 승강기까지의 연결 사진을 따로 살펴봐요.',finish:'노란 4번문과 문 앞 바닥을 확인하고, 안쪽 승강기로 이어지는 부분을 비교해요. 광장부터 승강기까지의 연속 사진은 아직 부족해요.'},
  terminal:{title:'대전복합터미널 · 서관 GATE 4',destination:'대전복합터미널 서관 GATE 4',boundary:'기존 미니어처는 시내버스 11830 정류장 → 서관 GATE 4 방향이에요. 고속·시외버스로 도착하는 동관 하차장과 구분해요.',finish:'서관 GATE 4의 문턱·열린 문 폭과 대합실 연결을 확인해요. GATE 2는 다른 문이에요.'},
};

export function missingConnections(route) {
  return route.steps.flatMap((step,index)=>index<route.steps.length-1&&(!step.next||step.next.status==='gap')?[{
    from:index,to:index+1,fromTitle:step.title,toTitle:route.steps[index+1].title,
    detail:step.next?.detail||'두 사진 사이의 보행 바닥과 방향을 보여 줄 자료가 더 필요해요.',
  }]:[]);
}
