// An inspection sequence, not a verified walking route or a bus itinerary.
export const HANBIT_ARRIVAL = {
  mode: '버스', destination: '한빛탑', continuousRouteVerified: false,
  boardingStopVerified: false, entranceVerified: false,
  steps: [
    { id: 'approach', number: '01', title: '정류장 주변', action: '버스에서 내린 뒤', targets: '가로수 · 정류장 시설 · 보도 경계', status: '사진으로 살펴보기' },
    { id: 'threshold', number: '02', title: '진입로 횡단', action: '차량 진입로를 건널 때', targets: '보도 끝의 턱 · 차량과 만나는 곳', status: '사진으로 살펴보기' },
    { id: 'doorway', number: '03', title: '남측 광장 앞', action: '남쪽 도로에서 바라보기', targets: '볼라드 · 화분 · 안내판', status: '별도 남측 사진' },
    { id: 'entrance-gap', number: '04', title: '한빛탑 입구 연결', action: '입구에 닿기까지', targets: '이어지는 바닥 · 문 앞의 턱', status: '연결 사진 필요', missing: true },
  ],
};

// Matched by label only after getPhotoReview has matched the exact source image.
export const HANBIT_OBSTACLE_GUIDANCE = {
  '가로수 주변': { effect: '나무를 피해 지나갈 때 휠체어가 쓸 수 있는 폭이 좁아질 수 있어요.', check: '나무 옆 가장 좁은 부분의 통과 폭을 확인해요.' },
  '정류장 시설': { effect: '정류장 시설 옆을 지나거나 방향을 바꿀 공간이 필요해요.', check: '실제 하차 위치와 시설 옆 통로가 이어지는지 확인해요.' },
  '차도와 보도 경계': { effect: '높이 차이가 있으면 보도에서 내려가거나 올라가기 어려울 수 있어요.', check: '횡단 지점의 낮아진 보도와 양쪽 턱을 가까이에서 확인해요.' },
  '보도 끝과 점자블록': { effect: '보도가 끝나는 곳의 높이 차이는 휠체어 바퀴에 걸릴 수 있어요.', check: '양쪽 경계의 턱 높이와 기울기를 확인해요.' },
  '차량 진입로 횡단': { effect: '보도를 따라가던 중 차량이 드나드는 길과 만나게 돼요.', check: '양쪽 시야와 건넌 뒤 보도 연결을 확인해요.' },
  '앞쪽 볼라드': { effect: '기둥 사이의 간격에 따라 휠체어가 지나갈 공간이 달라져요.', check: '이용할 진입 지점과 볼라드 사이의 실제 폭을 확인해요.' },
  '화분과 안내판': { effect: '시설물을 피해 방향을 바꾸거나 돌아갈 공간이 필요할 수 있어요.', check: '화분 옆 통로에서 실제 출입문까지 이어지는 길을 확인해요.' },
};
