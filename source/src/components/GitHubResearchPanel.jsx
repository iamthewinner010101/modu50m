import {
  githubApplyBoundaries,
  githubResearchReferences,
  githubResearchSummary,
} from '../data/githubResearch';

export default function GitHubResearchPanel() {
  return (
    <div className="github-research-panel" aria-label="GitHub 조사 적용 근거">
      <div className="research-panel-header">
        <div>
          <span className="panel-label">GitHub 조사 적용</span>
          <h3>왜 AI 후보 추천 + 사람 라벨링 검수 구조인가</h3>
        </div>
        <strong className="research-status">{githubResearchSummary.status}</strong>
      </div>

      <p>
        공개 GitHub 사례를 보면 접근성 문제를 한 번에 자동 판정하기보다, 사람이 거리 이미지와
        현장을 검수하고 AI가 후보 추천과 라벨 품질을 돕는 구조가 많이 사용됩니다. 그래서 이
        MVP도 AI를 정답 판정자가 아니라 먼저 확인할 후보를 줄여 주는 보조 역할로 둡니다.
      </p>

      <div className="research-source-note">
        <strong>M1/M2 적용 경계</strong>
        <p>{githubResearchSummary.note}</p>
        <p>{githubResearchSummary.blocker}</p>
      </div>

      <div className="research-reference-list">
        {githubResearchReferences.slice(0, 4).map((reference) => (
          <article className="research-reference-card" key={reference.repo}>
            <div>
              <strong>{reference.name}</strong>
              <span>{reference.fit}</span>
            </div>
            <p>{reference.pattern}</p>
            <small>{reference.apply}</small>
            <a href={reference.url} target="_blank" rel="noreferrer">
              {reference.repo}
            </a>
          </article>
        ))}
      </div>

      <div className="research-boundary-box">
        <strong>현재 MVP에 적용한 경계</strong>
        <ul>
          {githubApplyBoundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
