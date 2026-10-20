const QUESTIONS = {
  arrival: [
    ['내리는 쪽 보도', '선택한 하차 지점에서 같은 쪽 보도로 들어가는 공간과 턱 낮춤을 확인하고 싶어요.'],
    ['하차 후 방향', '내린 뒤 어느 방향으로 가는지 표지와 이어지는 바닥 사진을 더 보고 싶어요.'],
  ],
  crossing: [
    ['양쪽 바닥', '길을 건너거나 방향을 바꾸는 지점의 앞뒤 바닥과 턱을 확인하고 싶어요.'],
    ['차량과 만나는 곳', '보행 공간과 차량이 드나드는 곳을 구별할 수 있는 사진이 필요해요.'],
  ],
  entrance: [
    ['문턱·문 여는 방법', '방문할 출입문의 문턱, 문 여는 방법과 이용 시간을 확인하고 싶어요.'],
    ['문 앞 공간', '문까지 이어지는 바닥과 휠체어로 방향을 바꿀 공간을 확인하고 싶어요.'],
  ],
  approach: [
    ['통로의 폭·바닥', '기둥·가로수·시설물 사이 통로의 폭과 바닥 상태를 확인하고 싶어요.'],
    ['다음 지점 찾기', '다음 지점을 알아볼 표지와 꺾이는 곳의 앞뒤 사진을 더 보고 싶어요.'],
  ],
};

export function questionsForStep(route, index) {
  const step = route?.steps[index];
  if (!step) return [];
  const stage = route.placeId === 'skyroad' && step.stage === 'entrance' ? 'approach' : step.stage;
  const items = [...(QUESTIONS[stage] || QUESTIONS.approach)];
  const next = route.steps[index + 1];
  if (next && (!step.next || step.next.status === 'gap')) {
    items.push(['사이 구간 사진', `이곳에서 다음 ${String(index + 2).padStart(2, '0')}번 ${next.title}까지 이어지는 보도 사진이 필요해요.`]);
  }
  return items.map(([label, question]) => ({label, text: `[${String(index + 1).padStart(2, '0')} ${step.title}] ${question}`}));
}

export function appendPreparationQuestion(current, text, limit = 1600) {
  if (current.split('\n').some(line => line.trim() === text)) {
    return {value: current, status: 'duplicate'};
  }
  const value = `${current.trimEnd()}${current.trim() ? '\n' : ''}${text}`;
  return value.length > limit ? {value: current, status: 'full'} : {value, status: 'added'};
}

// A different scene must never inherit annotations from the main photograph.
export function observationsForPhoto(current, review) {
  return current ? current.observations || [] : review?.observations || [];
}
