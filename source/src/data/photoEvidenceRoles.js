// Only the role of a known image is changed. No image is treated as new field evidence.
export const PHOTO_EVIDENCE_ROLES = {
  '/modu50m/route-photos-v36/terminal-02.jpg':{label:'다른 출입문 · GATE 2',detail:'목표는 서관 GATE 4예요. 이 사진으로 GATE 4의 문턱이나 통과 폭을 확인할 수 없어요.'},
  '/modu50m/route-photos-v36/terminal-03.jpg':{label:'실내 방향 참고',detail:'대합실 안쪽 비교 사진이에요. 서관 GATE 4부터 이곳까지의 연결을 확인한 사진은 아니에요.'},
  '/modu50m/route-photos-v36/skyroad-02.jpg':{label:'반대편에서 본 위치 비교',detail:'선택한 하차 보도와 구분해 보세요. 이 사진을 보러 차도를 건너가라는 안내가 아니에요.'},
  '/modu50m/route-photos-v36/arboretum-10.jpg':{label:'열대식물원 안쪽 통과 지점',detail:'밖의 경사판 사진과 함께 비교해요. 통과 장치 옆 휠체어 통로의 현재 이용 방법은 확인이 필요해요.'},
  '/modu50m/route-photos-v36/leeungno-13.jpg':{label:'다른 전면 · 입구 비교',detail:'157번 주소판 옆 출입문과 같은 문인지 확인되지 않았어요. 현재 관람객 입구를 문의해요.'},
  '/modu50m/route-photos-v36/leeungno-12.jpg':{label:'넓은 광장 참고',detail:'건물과 광장의 위치를 비교하는 사진이에요. 경사로 시작점이나 사진 사이 연결을 모두 보여 주지는 않아요.'},
  '/modu50m/route-photos-v36/hanbit-04.jpg':{label:'광장 주변 참고',detail:'통일관 옆 통로에서 탑 경사로까지 이어지는 보행 바닥을 확인한 장면은 아니에요.'},
  '/modu50m/route-photos-v36/hanbit-05.jpg':{label:'광장 주변 참고',detail:'광장 모습을 비교해요. 통로 출구부터 탑 경사로까지의 연결 사진은 추가로 필요해요.'},
  '/modu50m/route-photos-v36/science-01.jpg':{label:'정문 광장 참고',detail:'꿈나래길 자체나 꿈나래길에서 정문까지 이어지는 길을 보여 주는 사진은 아니에요.'},
  '/modu50m/bus-v32/station-blog-02.jpg':{label:'계단형 출입부 · 승강기 길 확인',detail:'계단과 에스컬레이터가 보이는 서광장 출입부예요. 휠체어로 이용할 승강기 쪽 접근로는 별도 사진으로 확인해야 해요.'},
};
export const photoEvidenceRole=photo=>photo?.evidenceRole||PHOTO_EVIDENCE_ROLES[photo?.image]||null;
