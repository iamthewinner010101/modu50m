export const JUDGE_TOUR_CASES = [
  {
    candidateId: 'L50-005',
    type: '규칙-모델 불일치',
    question: '규칙은 차량 동선 교차를, 비전 모델은 입구 문턱 후보를 제시했습니다. 사람은 실제 초점을 다시 맞춰야 합니다.',
  },
  {
    candidateId: 'L50-001',
    type: '모델 보류',
    question: '비전 모델은 장면을 설명했지만 장벽 유형은 unknown으로 보류했습니다. 위치 충돌도 함께 확인해야 합니다.',
  },
  {
    candidateId: 'L50-006',
    type: '근거 거리 경고',
    question: '사용 파노라마가 후보 좌표에서 약 62.8m 떨어져 있어 사진만으로 결론 내리지 않고 현장 확인으로 넘깁니다.',
  },
];
