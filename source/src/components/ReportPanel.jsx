import { getAiAgreementLabel, getSeverityLabel, getStatusLabel } from '../utils/report';
import { getBarrierLabel } from '../utils/scoring';
import GitHubResearchPanel from './GitHubResearchPanel';

const STATUS_ORDER = ['published', 'field_check_needed', 'rejected', 'unreviewed'];
const SEVERITY_ORDER = ['high', 'medium', 'low', 'field_check_needed', 'unknown'];
const AI_AGREEMENT_ORDER = ['match', 'partial', 'mismatch', 'hold', 'unknown'];
const LEARNING_STAGE_LABELS = {
  CANDIDATE: '규칙 후보',
  SHADOW: '그림자 평가',
  PROMOTED: '승격됨',
  ROLLED_BACK: '롤백됨',
};

export default function ReportPanel({
  report,
  feedbackLearning,
  reviewTriage,
  learningAction = {},
  canManageRules = false,
  onPromoteRule,
  onRollbackRule,
  nextCandidate,
  onReset,
  onReviewCandidate,
  onOpenEvidence,
}) {
  const remainingCount = Math.max(0, report.total - report.reviewedCount);
  const isReviewComplete = remainingCount === 0;
  const learningMetrics = feedbackLearning?.metrics ?? {};
  const learningRules = feedbackLearning?.rules ?? [];
  const triageMetrics = reviewTriage?.metrics ?? {};

  function handlePrimaryAction() {
    if (!isReviewComplete && nextCandidate) {
      onReviewCandidate(nextCandidate.id);
      return;
    }
    onOpenEvidence();
  }

  return (
    <section className="panel report-panel">
      <div className="panel-title-row">
        <span className="panel-label">사람 검수 기반 자동 보고서</span>
        <button className="text-button" type="button" onClick={onReset}>
          검수 초기화
        </button>
      </div>

      <div className="report-readiness-hero">
        <div className="report-readiness-copy">
          <span>사람 검수 진행률</span>
          <strong>{report.reviewedCount}/{report.total}</strong>
          <p>
            {isReviewComplete
              ? '모든 후보에 사람 판정이 저장됐습니다. 제출 증거를 마지막으로 확인하세요.'
              : `AI 결과는 초안입니다. 사람이 직접 확인할 후보가 ${remainingCount}개 남았습니다.`}
          </p>
        </div>
        <div className="report-progress-block">
          <div
            className="report-progress-track"
            role="progressbar"
            aria-label="사람 검수 진행률"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={report.reviewedRate}
          >
            <span style={{ width: `${report.reviewedRate}%` }} />
          </div>
          <small>{report.reviewedRate}% 완료</small>
        </div>
        <button className="report-primary-action" type="button" onClick={handlePrimaryAction}>
          {isReviewComplete ? '제출 자료 확인' : '다음 후보 검수'}
        </button>
      </div>

      <div className="report-summary">
        <div>
          <strong>{report.reviewedRate}%</strong>
          <span>검수 완료율</span>
        </div>
        <div>
          <strong>{report.reviewedCount}</strong>
          <span>사람 검수 후보</span>
        </div>
        <div>
          <strong>{report.total}</strong>
          <span>전체 후보</span>
        </div>
        <div>
          <strong>{report.aiHumanMatchRate}%</strong>
          <span>AI·사람 판단 일치율</span>
        </div>
      </div>

      <section
        className="feedback-learning-section"
        aria-label="사람 피드백 자기개선 루프"
        data-learning-status={feedbackLearning?.status ?? 'WAITING_FOR_HUMAN_FEEDBACK'}
        data-human-feedback-count={learningMetrics.humanFeedbackCount ?? 0}
        data-automated-qa-count={learningMetrics.automatedQaFeedbackCount ?? 0}
        data-shadow-rule-count={learningMetrics.shadowRuleCount ?? 0}
        data-promoted-rule-count={learningMetrics.promotedRuleCount ?? 0}
        data-rolled-back-rule-count={learningMetrics.rolledBackRuleCount ?? 0}
        data-evidence-revalidation-count={triageMetrics.evidenceRevalidationCount ?? 0}
      >
        <div className="feedback-learning-heading">
          <div>
            <span>사람 피드백 자기개선 루프</span>
            <h3>판정을 모으되, 검증 전에는 자동 규칙을 바꾸지 않습니다</h3>
          </div>
          <strong className={(learningMetrics.humanFeedbackCount ?? 0) > 0 ? 'active' : 'waiting'}>
            {(learningMetrics.promotedRuleCount ?? 0) > 0
              ? '승격 규칙 적용 중'
              : (learningMetrics.humanFeedbackCount ?? 0) > 0
                ? '학습 후보 축적 중'
                : '사람 피드백 대기'}
          </strong>
        </div>

        <div className="feedback-learning-pipeline" role="list" aria-label="자기개선 단계">
          <div role="listitem">
            <span>1. 판정 기록</span>
            <strong>{learningMetrics.decisionRecordCount ?? 0}</strong>
          </div>
          <div role="listitem">
            <span>2. 사람 입력</span>
            <strong>{learningMetrics.humanFeedbackCount ?? 0}</strong>
          </div>
          <div role="listitem">
            <span>3. 그림자 평가</span>
            <strong>{learningMetrics.shadowRuleCount ?? 0}</strong>
          </div>
          <div role="listitem">
            <span>4. 감독 승격</span>
            <strong>{learningMetrics.promotedRuleCount ?? 0}</strong>
          </div>
        </div>

        <div className="feedback-learning-guardrail">
          <div>
            <span>다음 검증 행동</span>
            <strong>{feedbackLearning?.nextAction ?? '사람 판정을 기다립니다.'}</strong>
          </div>
          <p>
            자동 QA {learningMetrics.automatedQaFeedbackCount ?? 0}건과 출처 미확인 {learningMetrics.legacyUnverifiedCount ?? 0}건은
            규칙 승격 근거에서 제외했습니다. 거짓 자동 통과 {learningMetrics.falseAutoPassCount ?? 0}건,
            근거 변경 재검수 {triageMetrics.evidenceRevalidationCount ?? 0}건, 롤백 {learningMetrics.rolledBackRuleCount ?? 0}건.
          </p>
        </div>

        {(learningAction.notice || learningAction.error) && (
          <p className={`feedback-rule-action-message ${learningAction.error ? 'error' : 'success'}`} role="status">
            {learningAction.error || learningAction.notice}
          </p>
        )}

        <details className="feedback-learning-rules">
          <summary>규칙 후보별 근거 보기</summary>
          <div>
            {learningRules.map((rule) => (
              <article key={rule.reasonCode} data-learning-stage={rule.stage}>
                <div>
                  <span>{rule.priority} · {rule.reasonCode}</span>
                  <strong>{rule.label}</strong>
                </div>
                <div>
                  <span>{LEARNING_STAGE_LABELS[rule.stage] ?? rule.stage}</span>
                  <strong>{rule.humanFeedbackCount}/5</strong>
                </div>
                <p>{rule.promotionBlocker}</p>
                {canManageRules && (rule.promotionEligible || rule.rollbackEligible) && (
                  <div className="feedback-rule-actions">
                    {rule.promotionEligible && (
                      <button
                        type="button"
                        disabled={learningAction.actionReasonCode === rule.reasonCode}
                        onClick={() => onPromoteRule?.(rule.reasonCode, rule.version ?? 0)}
                      >
                        큐 우선순위에 승격
                      </button>
                    )}
                    {rule.rollbackEligible && (
                      <button
                        type="button"
                        className="rollback"
                        disabled={learningAction.actionReasonCode === rule.reasonCode}
                        onClick={() => onRollbackRule?.(rule.reasonCode, rule.version ?? 0)}
                      >
                        규칙 롤백
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </details>
      </section>

      <div className="report-focus-grid">
        <section className="report-visual-card" aria-label="후보 상태 분포">
          <div className="report-card-heading">
            <span>후보 상태 분포</span>
            <small>사람이 저장한 판정 기준</small>
          </div>
          <div className="report-status-bars">
            {STATUS_ORDER.map((status) => {
              const count = report.statusCounts[status] ?? 0;
              const percentage = report.total > 0 ? Math.round((count / report.total) * 100) : 0;
              return (
                <div className={`report-status-row status-${status}`} key={status}>
                  <div>
                    <span>{getStatusLabel(status)}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="report-status-track" aria-hidden="true">
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="report-visual-card" aria-label="우선 확인 후보">
          <div className="report-card-heading">
            <span>우선 확인 후보</span>
            <small>AI 위험도 순, 최종 판정은 사람</small>
          </div>
          <ol className="report-risk-preview">
            {report.topRiskCandidates.map((candidate, index) => (
              <li key={candidate.id}>
                <span className="report-rank-number">{index + 1}</span>
                <span>{candidate.name}</span>
                <strong>{candidate.score}점</strong>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <details className="report-detail-disclosure">
        <summary>세부 분석과 연구 근거 보기</summary>
        <div className="report-detail-grid">
          <div className="report-section">
            <h3>심각도 라벨 분포</h3>
            <ul className="compact-list">
              {SEVERITY_ORDER.map((severity) => (
                <li key={severity}>
                  <span>{getSeverityLabel(severity)}</span>
                  <strong>{report.severityCounts[severity] ?? 0}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="report-section">
            <h3>AI·사람 비교 라벨</h3>
            <ul className="compact-list">
              {AI_AGREEMENT_ORDER.map((agreement) => (
                <li key={agreement}>
                  <span>{getAiAgreementLabel(agreement)}</span>
                  <strong>{report.aiAgreementCounts[agreement] ?? 0}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="report-section">
            <h3>장벽 유형 TOP3</h3>
            <ul className="compact-list">
              {report.topBarrierTypes.map((item) => (
                <li key={item.type}>
                  <span>{getBarrierLabel(item.type)}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="report-section">
            <h3>시설 유형별 반복 패턴</h3>
            <ul className="compact-list">
              {report.topFacilityPatterns.map((item) => (
                <li key={item.facilityType}>
                  <span>{item.facilityType} · {item.topBarrierLabel}</span>
                  <strong>{item.topBarrierCount}/{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="demo-script">
          <h3>30초 시연 흐름</h3>
          <p>
            후보 선택, AI 추천 이유 확인, 네이버·카카오·구글 지도 링크로 위치 검증,
            사람 판정 저장, 보고서 수치 변화 순서로 보여주면 됩니다.
          </p>
        </div>

        <GitHubResearchPanel />
      </details>
    </section>
  );
}
