// Editorial observations refer to these exact, unmodified source images.
// They are not measurements, traversability scores, or a connected route.
const REVIEWS = {
  arts: {
    approach: {
      image: '/modu50m/naver-roadview-v1/arts-west-2026-04.jpg', kind: 'segment', title: '주차구역에서 승강기 주변까지', focus: [67, 77],
      question: '차에서 내린 뒤, 승강기까지 어떻게 이어질까요?',
      observations: [
        { label: '장애인 주차 표시', detail: '바닥에 장애인 주차구역 표시가 보입니다. 차량 옆 승하차 공간은 별도 확인이 필요합니다.', position: [49, 87] },
        { label: '승강기 구조물 앞', detail: '유리 구조물과 아래쪽 문이 보입니다. 문 앞의 작은 턱과 내부 연결은 이 사진으로 알기 어렵습니다.', position: [78, 70] },
        { label: '옆쪽 계단', detail: '승강기 옆에 계단이 보입니다. 승강기의 현재 운영 여부는 확인 전입니다.', position: [91, 72] },
      ],
      unknowns: ['승하차 공간과 승강기 사이의 연속된 이동 동선', '승강기 문턱·문 폭·운영 상태와 공연장 내부 연결'],
      connection: '서측 주차장 한 장면입니다. 남측 정면 사진까지 이어지는 이동 경로는 확인하지 않았습니다.',
    },
    threshold: {
      image: '/modu50m/naver-roadview-v1/arts-south-2026-04.jpg', kind: 'context', title: '남측 광장 · 외관 참고', focus: [50, 77],
      question: '이 전경만으로는 광장에 들어가는 지점을 알기 어려워요.',
      observations: [{ label: '광장 전경', detail: '건물 앞 포장 공간은 보이지만, 앞쪽 차량과 먼 촬영 거리 때문에 보도 경계와 진입부가 충분히 보이지 않습니다.' }],
      unknowns: ['보도에서 광장으로 진입하는 지점의 턱', '광장에서 출입문까지 이어지는 길'],
      connection: '장소를 알아보는 보조 사진입니다. 휠체어 이동 구간을 확인한 사진으로 세지 않습니다.',
    },
    doorway: {
      image: '/modu50m/naver-roadview-v2/arts-front-2026-04.png', kind: 'context', title: '정면 계단 · 외관 참고', focus: [51, 65],
      question: '계단을 거치지 않고 들어가는 길은 어디에 있을까요?',
      observations: [{ label: '정면의 계단', detail: '정면의 넓은 계단은 보입니다. 이 장면은 출입문 가까이에서 촬영한 사진이 아닙니다.' }],
      unknowns: ['계단을 거치지 않는 진입 동선', '실제 관람객 출입문 바로 앞의 바닥과 문턱'],
      connection: '정면 외관 참고 사진입니다. 서측 승강기에서 이 출입구로 연결되는지는 미확인입니다.',
    },
  },
  hanbit: {
    approach: {
      image: '/modu50m/hanbit-roadview-v2/approach.jpg', kind: 'segment', title: '정류장 옆 보도와 가로수', focus: [45, 74],
      question: '가로수와 정류장 옆으로 휠체어가 지날 공간이 보이나요?',
      observations: [
        { label: '가로수 주변', detail: '보도 안쪽에 가로수가 있습니다. 나무를 피해 지나는 부분의 실제 유효 폭은 측정하지 않았습니다.', position: [31, 71] },
        { label: '정류장 시설', detail: '정류장 시설이 보도 위에 있습니다. 시설 옆의 통과 공간을 가까이에서 확인해야 합니다.', position: [45, 62] },
        { label: '차도와 보도 경계', detail: '차도 옆 경계석이 보입니다. 내려갈 수 있는 지점은 이 한 장으로 이어서 확인하기 어렵습니다.', position: [66, 55] },
      ],
      unknowns: ['가로수·정류장 옆의 가장 좁은 통과 폭', '다음 횡단 구간까지 보도가 끊기지 않는지'],
      connection: '동측 보도의 일부입니다. 다음 사진까지의 전 구간을 촬영한 연속 경로는 아닙니다.',
    },
    threshold: {
      image: '/modu50m/hanbit-roadview-v2/threshold.jpg', kind: 'segment', title: '주차장 진입로를 건너는 지점', focus: [57, 77],
      question: '보도에서 내려가고, 건넌 뒤 다시 올라갈 수 있을까요?',
      observations: [
        { label: '보도 끝과 점자블록', detail: '점자블록과 보도 끝의 경계가 보입니다. 경계의 높이는 사진으로 측정하지 않았습니다.', position: [44, 79] },
        { label: '차량 진입로 횡단', detail: '차량 진입로 위에 횡단 표시가 있습니다. 차량과 동선이 만나는 지점입니다.', position: [69, 71] },
      ],
      unknowns: ['양쪽 보도 끝의 턱 높이와 기울기', '횡단 후 광장까지 연결되는 통과 공간'],
      connection: '주차장 진입로의 횡단 장면입니다. 건물 출입문 사진이나 통행 가능 확인 결과가 아닙니다.',
    },
    doorway: {
      image: '/modu50m/naver-roadview-v2/hanbit-plaza-2025-04.png', kind: 'segment', title: '남측 광장 앞 볼라드와 화분', focus: [50, 81],
      question: '볼라드와 화분 사이로 들어가는 공간은 충분할까요?',
      observations: [
        { label: '앞쪽 볼라드', detail: '보도에 볼라드가 줄지어 있습니다. 사이의 실제 통과 폭은 확인 전입니다.', position: [47, 90] },
        { label: '화분과 안내판', detail: '광장 앞쪽에 화분과 안내판이 있습니다. 어느 틈이 출입 동선인지 확인이 필요합니다.', position: [58, 74] },
      ],
      unknowns: ['볼라드·화분 사이의 실제 통과 폭과 진입 지점', '광장 운영 상태와 탑 출입문까지 이어지는 길'],
      connection: '앞의 동측 사진들과 떨어진 남측 장면이며 촬영 시기도 다릅니다. 세 사진을 하나의 경로로 연결하지 않습니다.',
    },
  },
  museum: {
    threshold: {
      image: '/modu50m/naver-roadview-v2/museum-approach-2026-04.png', kind: 'segment', title: '미술관 옆길의 보도와 경계', focus: [31, 75],
      question: '차도로 내려가지 않고 보도를 따라갈 수 있을까요?',
      observations: [
        { label: '왼쪽 보도', detail: '가로수 옆으로 포장된 보도가 이어져 보입니다. 나무 주변의 유효 폭은 미측정입니다.', position: [8, 81] },
        { label: '보도와 차도 경계', detail: '보도와 차도 사이 경계가 보입니다. 출입구 방향으로 건너는 지점은 이 사진에 충분히 담기지 않았습니다.', position: [25, 79] },
      ],
      unknowns: ['보도의 가장 좁은 부분과 경계석 높이', '이 보도에서 관람객 출입구까지 이어지는 경로'],
      connection: '북서측 옆길입니다. 서측 유리문 사진과의 연결 및 그 문의 관람객 이용 여부는 미확인입니다.',
    },
    approach: {
      image: '/modu50m/naver-roadview-v2/museum-west-2026-04.png', kind: 'context', title: '서측 주차 공간 · 연결 참고', focus: [60, 75],
      question: '차량에 가린 앞쪽 길과 관람객 출입구를 더 확인해야 해요.',
      observations: [{ label: '주차 공간 너머의 문', detail: '건물 옆 문과 난간은 보이지만, 앞쪽 차량 때문에 접근 구간 전체가 보이지 않습니다.' }],
      unknowns: ['이 문이 관람객용 출입구인지', '주차 공간에서 문 앞까지의 보행 연결'],
      connection: '서측 외관을 보여주는 보조 사진입니다. 다음 유리문 확대와 같은 촬영 지점입니다.',
    },
    doorway: {
      image: '/modu50m/naver-roadview-v2/museum-door-2026-04.png', kind: 'context', title: '서측 유리문 · 같은 장면 확대', focus: [50, 73],
      question: '문 가까이에서 바닥의 높이 차이와 실제 용도를 확인해야 해요.',
      observations: [
        { label: '유리문 앞 바닥', detail: '유리문 앞 바닥과 옆 경계가 보입니다. 관람객용 문인지, 문턱이 어떤지는 미확인입니다.', position: [48, 71] },
        { label: '오른쪽 난간', detail: '옆쪽에 난간이 보입니다. 난간 옆 통로의 기울기와 문까지의 연결은 별도 확인이 필요합니다.', position: [86, 71] },
      ],
      unknowns: ['관람객용 출입구 여부와 문턱·문 폭', '옆 통로의 시작과 끝, 문 앞까지의 연결'],
      connection: '서측 주차 공간과 같은 촬영 지점을 확대했습니다. 문 가까이 이동해 촬영한 새 지점이 아닙니다.',
    },
  },
};

const MISSING_SHOTS = {
  arts: ['장애인 주차구역에서 승강기 앞까지, 바닥이 끊기지 않게', '승강기 문 앞의 문턱과 내부 조작부', '승강기에서 실제 관람객 출입문까지 이어지는 구간'],
  hanbit: ['정류장 옆 가장 좁은 보도와 가로수 주변', '횡단 구간 양쪽의 턱을 옆에서, 건넌 뒤 연결부까지', '광장 진입부부터 탑 출입문 앞까지 이어지는 구간'],
  museum: ['옆길 보도에서 관람객 출입구로 이어지는 전체 구간', '차량에 가리지 않은 진입부와 경사 통로의 양 끝', '실제 관람객 출입문 바로 앞의 바닥과 문턱'],
  station: ['역 앞 하차 지점부터 이용할 출입문까지의 보도', '문턱과 자동문 앞의 회전 공간', '역 안 승강기 위치·운행 안내와 승강장 연결'],
  science: ['방문할 전시관 이름과 이용 출입문을 함께', '주차·하차 지점에서 해당 전시관까지의 보도', '전시관 문 앞의 경계·경사와 문턱'],
  dongchundang: ['공원 진입부부터 마당까지 바닥이 이어지도록', '마당 포장과 좁아지는 부분을 가까이', '관람 가능한 범위와 마루·기단 앞의 높이 차이'],
  cityhall: ['시청 보도에서 실제 방문객 출입문까지의 연결', '차량 진입로 횡단부 양쪽의 경계', '민원실로 이어지는 문과 운영 안내'],
  onsen: ['족욕장 진입부의 바닥과 보도 연결', '물가·좌석 주변의 통로와 높이 차이', '가장 좁은 공간과 휠체어가 머물 자리'],
  uam: ['공원 입구부터 관람 구간까지의 포장 상태', '경사 구간의 시작·끝과 옆면', '대문·돌계단 앞에서 우회하는 길의 연결'],
  library: ['이용 출입문과 승하차 지점이 함께 보이도록', '경사 통로의 시작·끝과 문 앞 바닥', '자동문·승강기 운영 안내와 열람실 연결'],
  oworld: ['하차·주차 지점부터 실제 매표 입구까지', '대기 줄 옆 통과 공간과 바닥의 경계', '입장 게이트의 폭과 안쪽 이동 연결'],
  daecheong: ['이용할 주차장·하차 지점에서 전망 공간까지', '보도 경계와 경사진 통로의 시작·끝', '전망 공간 앞 난간·문턱과 회전 공간'],
  civic: ['실제 민원실 출입문과 건물명이 함께 보이도록', '주차·보도 진입부에서 문까지 바닥의 연결', '문 앞 근접 사진과 문턱·개방 방식'],
  subway: ['지상 승강기의 실제 위치와 역명·출구 안내', '주변 보도에서 승강기 문 앞까지의 연결', '승강기 운영 안내·문턱과 역 내부 연결'],
};

const PLACE_QUESTIONS = {
  station: '역 앞에서 승강장까지, 계단 없이 어떻게 이어질까요?',
  science: '내가 방문할 전시관의 출입문은 어디일까요?',
  dongchundang: '공원에서 마당까지, 바닥은 어떻게 이어질까요?',
  cityhall: '민원실에 가려면 어느 출입문을 확인해야 할까요?',
  onsen: '족욕장 옆까지 다가가고 머물 공간이 있을까요?',
  uam: '공원 안의 경사와 계단을 피하는 길이 이어질까요?',
  library: '열람실로 들어가는 실제 출입문을 확인해 볼까요?',
  oworld: '하차한 곳에서 매표·입장 게이트까지 어떻게 갈까요?',
  daecheong: '주차 지점에서 전망 공간까지 바닥이 이어질까요?',
};

export function getPhotoReview(site, pointId) {
  const mobility = site.mobilityReviews?.[pointId];
  const mobilityPhoto = site.photos[pointId];
  if (mobility && mobility.image === mobilityPhoto?.image && mobility.photoId === (mobilityPhoto.id ?? null) && mobility.sourceSha256 === mobilityPhoto.sourceSha256) {
    return { ...mobility, fieldVerified: false, continuousRouteVerified: false };
  }
  if (!mobility && site.communityCase && pointId === 'scene' && site.sceneReview?.image === site.photos[pointId]?.image) return site.sceneReview;
  const photo = site.photos[pointId];
  const review = REVIEWS[site.id]?.[pointId];
  if (!mobility && !site.referenceOnly && review?.image === photo?.image) return { ...review, fieldVerified: false, continuousRouteVerified: false };
  return {
    kind: 'context', title: site.checkpoints.find(point => point.id === pointId)?.title || '외관 참고', focus: [50, 50],
    question: site.accessQuestion || PLACE_QUESTIONS[site.id] || '이 사진은 장소를 알아보는 참고 자료예요.',
    observations: [{ label: '사진에 담긴 범위', detail: site.referenceOnly || site.originalReferenceOnly ? (site.checkpoints.find(point => point.id === pointId)?.hint || site.coverage) : '이 사진에 대한 보도·턱·출입문 연결 검토가 없습니다. 외관만으로 휠체어 이동 가능 여부를 판단하지 않습니다.' }],
    unknowns: site.missingShots || ['도착 지점에서 출입구까지 이어지는 보도', '경계의 턱·경사와 출입문 앞 연결'],
    connection: '이동 구간을 보여주는 사진을 추가로 확보해야 합니다.',
    fieldVerified: false, continuousRouteVerified: false,
  };
}

export function getPlaceReview(site) {
  const segmentIds = site.checkpoints.filter(point => getPhotoReview(site, point.id).kind === 'segment').map(point => point.id);
  return {
    segmentIds, hasSegments: segmentIds.length > 0,
    label: segmentIds.length ? '이동 구간 일부' : Object.values(site.photos).some(photo => photo.mobilityEvidence) ? '주변 사진 · 연결 확인 전' : '이동 사진 준비 중',
    continuousRouteVerified: false, entranceVerified: false,
    missingShots: site.missingShots || MISSING_SHOTS[site.id] || ['정류장 또는 주차 지점에서 출입구까지 이어지는 보도', '보도 경계와 경사로의 시작·끝', '출입문 바로 앞의 바닥·문턱과 문 전체'],
  };
}

export function getDefaultReviewIndex(site) {
  const index = site.checkpoints.findIndex(point => getPhotoReview(site, point.id).kind === 'segment');
  const reviewedIndex = site.checkpoints.findIndex(point => site.photos[point.id]?.mobilityEvidence);
  return index < 0 ? Math.max(reviewedIndex, 0) : index;
}
