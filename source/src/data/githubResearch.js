export const githubResearchSummary = {
  status: 'PASS_WITH_STUDENT_EVIDENCE_PENDING',
  scope: 'AI 후보 추천, 사람 라벨링 검수, 시민참여 접근성 데이터',
  m1PacketPath:
    'D:/Codex/shared-context/keychron_m_key_router/chains/github_research_apply_goal/topic-f23265105ea1-f2326510/M1_RESEARCH_PACKET.v1.json',
  m2PacketPath:
    'D:/Codex/shared-context/keychron_m_key_router/chains/github_research_apply_goal/topic-f23265105ea1-f2326510/M2_APPLY_PACKET.v1.json',
  note:
    '현재 MVP는 공개 GitHub/논문 사례의 전체 코드를 복제하지 않고, VLM 미션 가이드·사람 검수·후속 검수 필요도·독립 2차 증거·데이터 모델만 좁게 반영합니다.',
  blocker:
    '제출 준비 PASS는 태윤이가 직접 검수한 student-review-evidence.v1.json이 들어온 뒤 확인합니다.',
};

export const githubResearchReferences = [
  {
    name: 'Project Sidewalk',
    repo: 'ProjectSidewalk/SidewalkWebpage',
    url: 'https://github.com/ProjectSidewalk/SidewalkWebpage',
    fit: '매우 높음',
    pattern: '원격 시민참여로 보도 접근성 문제를 찾고 기록하는 구조',
    apply: '후보 지점 클릭 -> 검수 지점 확인 -> 사람 라벨링 저장 흐름을 참고합니다.',
  },
  {
    name: 'RampNet',
    repo: 'ProjectSidewalk/RampNet',
    url: 'https://github.com/ProjectSidewalk/RampNet',
    fit: '매우 높음',
    pattern: '대규모 거리사진 후보 생성과 threshold 조정, 수동 gold set 필요성을 보여주는 구조',
    apply: '모델 학습은 넣지 않고, AI 후보 점수와 사람 검수 기준을 분리해야 한다는 근거로 씁니다.',
  },
  {
    name: 'VLM-guided annotation',
    repo: 'Project Sidewalk research',
    url: 'https://arxiv.org/abs/2602.09216',
    fit: '보조 근거',
    pattern: 'AI가 정답을 고르는 대신 사람이 봐야 할 위치와 질문을 안내하는 Human-in-the-loop 방식',
    apply: '라벨링 검수 화면의 미션 카드와 지식형 Q&A 안내로 반영합니다.',
  },
  {
    name: 'LabelAId',
    repo: 'makeabilitylab/LabelAId',
    url: 'https://arxiv.org/html/2403.09810v1',
    fit: '보조 근거',
    pattern: '사람이 라벨링할 때 AI가 보조 피드백을 주어 품질을 높이는 Human-in-the-loop 사례',
    apply: 'AI가 사람 판단을 대신하는 근거가 아니라, 채택 답변 기준과 독립 2차 검수 필요도를 안내하는 보조 사례로만 씁니다.',
  },
  {
    name: 'OpenSidewalks Schema',
    repo: 'OpenSidewalks/OpenSidewalks-Schema',
    url: 'https://github.com/OpenSidewalks/OpenSidewalks-Schema',
    fit: '높음',
    pattern: '보도, 횡단, 경계석, curb ramp를 점과 선 데이터로 구조화',
    apply: '현재는 후보 점 데이터로 시작하고, 나중에 보행 네트워크로 확장할 수 있음을 보여줍니다.',
  },
  {
    name: 'Wheelmap / accessibility.cloud',
    repo: 'sozialhelden/accessibility-cloud',
    url: 'https://github.com/sozialhelden/accessibility-cloud',
    fit: '중간~높음',
    pattern: '시민이 접근성 정보를 보태고 표준화된 접근성 데이터로 공유',
    apply: '시민참여 공로 표시와 접근성 데이터 확장 방향의 참고 사례로만 둡니다.',
  },
];

export const githubApplyBoundaries = [
  '현재 MVP에는 공개 저장소 전체 코드를 들여오지 않고, 구조와 데이터 모델만 좁게 참고합니다.',
  '컴퓨터비전 모델 학습, 로드뷰 이미지 대량 수집, 전국 자동 구축은 현재 MVP에 넣지 않습니다.',
  'AI 표현은 “정답 판정”이 아니라 “우선 검수 후보 추천”으로 유지합니다.',
  '완성형 휠체어 내비게이션은 향후 확장 방향으로만 설명합니다.',
];
