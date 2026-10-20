import { useMemo } from 'react';
import {
  SUBMISSION_TARGET,
  getEvidenceRows,
  getEvidenceSummary,
} from '../utils/evidence';
import TeamMemberManager from './TeamMemberManager';

const AUDIT_LANES = [
  {
    key: 'humanReviewRequired',
    metricKey: 'humanReviewRequiredCount',
    label: '사람 검수 필요',
    description: '사람만 답할 수 있는 질문이 남아 있습니다.',
  },
  {
    key: 'blockedData',
    metricKey: 'blockedDataCount',
    label: '보강 필요',
    description: '사람 판정 전에 지도·로드뷰 데이터 보강이 필요합니다.',
  },
  {
    key: 'autoVerified',
    metricKey: 'autoVerifiedCount',
    label: '검수 완료',
    description: '필수 판정과 근거가 모두 저장되어 사람 큐에서 제외됐습니다.',
  },
  {
    key: 'rejectedInvalid',
    metricKey: 'invalidRejectedCount',
    label: '무효 데이터',
    description: '좌표나 후보 식별자를 고친 뒤 다시 분류해야 합니다.',
  },
];

export default function DirectorReviewQueue({
  candidates,
  reviews,
  reviewTriage,
  reviewTeam,
  reviewAccount,
  selectedId,
  onSelectCandidate,
  onReviewCandidate,
  onClaimCandidate,
  onReleaseCandidate,
  onOpenEvidence,
}) {
  const evidenceRows = useMemo(() => getEvidenceRows(candidates, reviews), [candidates, reviews]);
  const evidenceSummary = getEvidenceSummary(evidenceRows);
  const humanQueue = reviewTriage?.humanReviewRequired ?? [];
  const priorityQueue = humanQueue.slice(0, 5);
  const firstPriorityRow = humanQueue[0] ?? null;
  const firstPriorityCandidate = firstPriorityRow?.candidate ?? null;
  const triageMetrics = reviewTriage?.metrics ?? {};
  const assignments = reviewTeam?.assignments ?? {};
  const currentActor = reviewTeam?.actor ?? null;
  const activeAssignments = Object.values(assignments).filter(
    (assignment) => assignment.status === 'assigned',
  );
  const assignedToMeCount = activeAssignments.filter(
    (assignment) => assignment.assigneeActorId === currentActor?.id,
  ).length;
  const remainingDirectReviewCount = Math.max(
    0,
    SUBMISSION_TARGET - evidenceSummary.directReviewCount,
  );
  const nextLessonGaps = [
    { label: '직접 검수 기록', count: evidenceSummary.directReviewCount },
    { label: '지도 기준점 확인', count: evidenceSummary.targetPointCount },
    { label: '검수 항목 체크', count: evidenceSummary.focusCheckCount },
    { label: '심각도 라벨', count: evidenceSummary.severityLabelCount },
    { label: 'AI-사람 비교 라벨', count: evidenceSummary.aiAgreementLabelCount },
    { label: '후속 검수 필요도', count: evidenceSummary.validationStateCount },
    { label: '전/후 비교 메모', count: evidenceSummary.comparisonCount },
    { label: '지도 근거 기록', count: evidenceSummary.sourceEvidenceCount },
  ].filter((item) => item.count < SUBMISSION_TARGET);
  const auditRows = [
    ...(reviewTriage?.blockedData ?? []),
    ...(reviewTriage?.autoVerified ?? []),
    ...(reviewTriage?.rejectedInvalid ?? []),
  ];

  return (
    <section
      className="director-queue-panel human-action-inbox"
      aria-label="감독 오늘 검수 큐"
      data-human-review-count={triageMetrics.humanReviewRequiredCount ?? 0}
      data-high-priority-count={triageMetrics.highPriorityCount ?? 0}
    >
      <div className="director-queue-header">
        <div>
          <p className="panel-label">감독 오늘 검수 큐 · 사람 행동 인박스</p>
          <h2>사람이 판단해야 하는 항목만 보여줍니다</h2>
          <p>
            자동 규칙이 위치·근거·저장 상태를 먼저 확인합니다. 감독 화면에는 질문에 답하고
            판정을 저장해야 하는 후보만 남으며, 완료 항목은 감사 기록으로 이동합니다.
          </p>
        </div>
        <div className="director-queue-status">
          <span>사람 행동 남음</span>
          <strong>{triageMetrics.humanReviewRequiredCount ?? 0}</strong>
          <small>전체 {triageMetrics.totalCandidateCount ?? candidates.length}개 중</small>
        </div>
      </div>

      <div className="director-today-focus-card" aria-label="감독 오늘 1순위 후보">
        <div className="director-today-focus-main">
          <span>감독 오늘 1순위</span>
          <strong>
            {firstPriorityCandidate
              ? `${firstPriorityRow.priority} · ${firstPriorityCandidate.name}`
              : '사람이 처리할 후보가 없습니다'}
          </strong>
          <p>
            {firstPriorityRow
              ? `${firstPriorityRow.primaryReason} · 검수 조건 ${firstPriorityRow.metRequirementCount}/${firstPriorityRow.totalRequirementCount} · 남은 조건 ${firstPriorityRow.missingRequirementCount}개`
              : '자동 분류 결과를 감사 기록에서 확인할 수 있습니다.'}
          </p>
        </div>
        <div className="director-today-focus-reason">
          <span>먼저 보는 이유</span>
          <strong>{firstPriorityRow?.question ?? '현재 사람 판단 대기 없음'}</strong>
        </div>
        <button
          type="button"
          className="director-today-focus-action"
          disabled={!firstPriorityCandidate}
          onClick={() => firstPriorityCandidate && onReviewCandidate(firstPriorityCandidate.id)}
        >
          1순위 판단 기준 열기
        </button>
      </div>

      <div className="director-queue-metrics" aria-label="감독 검수 현황">
        <div>
          <strong>{triageMetrics.humanReviewRequiredCount ?? 0}</strong>
          <span>사람 검수 필요</span>
        </div>
        <div>
          <strong>{triageMetrics.blockedDataCount ?? 0}</strong>
          <span>데이터 보강 필요</span>
        </div>
        <div>
          <strong>{triageMetrics.autoVerifiedCount ?? 0}</strong>
          <span>자동 처리 완료</span>
        </div>
        <div>
          <strong>{triageMetrics.oldestQueueAgeLabel ?? '검수 시작 전'}</strong>
          <span>가장 오래 대기</span>
        </div>
      </div>

      <div className="director-status-lanes" aria-label="감독 상태 구분판">
        <div className="director-status-lanes-header">
          <span>감독 상태 구분판</span>
          <strong>기본 목록은 사람 검수 필요 상태만 표시합니다</strong>
        </div>
        <div className="director-status-lane-grid">
          {AUDIT_LANES.map((lane) => (
            <article className={`director-status-lane ${lane.key}`} key={lane.key}>
              <div>
                <span>{lane.label}</span>
                <strong>{triageMetrics[lane.metricKey] ?? 0}</strong>
                <p>{lane.description}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="director-field-check-note">
          현장 확인 필요 상태는 P0 사람 검수로 다시 올라오며 자동 완료로 처리하지 않습니다.
        </p>
      </div>

      <div className="director-next-lesson-card" aria-label="감독 다음 수업 행동">
        <div className="director-next-lesson-main">
          <span>다음 수업 행동</span>
          <strong>
            {humanQueue.length === 0
              ? '사람 인박스가 비었습니다. 제출 근거를 내보내 확인합니다.'
              : `태윤이 직접 검수 ${remainingDirectReviewCount}개를 순서대로 채웁니다`}
          </strong>
          <p>
            위의 1순위부터 지도 기준점과 카카오 로드뷰를 확인하고, 심각도·AI 비교·근거
            메모를 저장합니다. 한 후보의 필수 조건이 모두 채워지면 이 목록에서 자동으로
            빠집니다.
          </p>
        </div>
        <div className="director-next-lesson-checks" aria-label="다음 수업 부족 조건">
          <span>검수 조건 · 남은 조건</span>
          <ul>
            {nextLessonGaps.slice(0, 4).map((item) => (
              <li key={item.label}>
                {item.label} {item.count}/{SUBMISSION_TARGET}
              </li>
            ))}
            {nextLessonGaps.length === 0 && <li>앱 기록 기준 부족 조건 없음</li>}
          </ul>
        </div>
        <div className="director-next-lesson-actions">
          <button
            type="button"
            className="director-next-lesson-start"
            disabled={!firstPriorityCandidate}
            onClick={() => firstPriorityCandidate && onReviewCandidate(firstPriorityCandidate.id)}
          >
            태윤이 직접 검수 시작
          </button>
          <button
            type="button"
            className="director-next-lesson-evidence"
            onClick={onOpenEvidence}
          >
            제출 자료에서 import 확인
          </button>
        </div>
      </div>

      <div className="director-human-queue-heading">
        <div>
          <span>사람 검수 필요</span>
          <strong>{humanQueue.length}개</strong>
        </div>
        <p>위치 위험 P0를 먼저, 증거 보강 P1을 다음에 처리합니다.</p>
      </div>

      <div className="director-team-strip" aria-label="검수 팀 작업 배정">
        <div>
          <span>검수 팀 작업 배정</span>
          <strong>
            {currentActor
              ? `${currentActor.displayName} · 내 작업 ${assignedToMeCount}개`
              : 'SaaS 서버에서 담당자 배정을 사용할 수 있습니다'}
          </strong>
        </div>
        <p>전체 배정 {activeAssignments.length}개 · 미배정 {Math.max(0, humanQueue.length - activeAssignments.length)}개</p>
        {reviewTeam?.error && <small role="alert">{reviewTeam.error}</small>}
      </div>

      <TeamMemberManager account={reviewAccount} team={reviewTeam} />

      <div className="director-queue-list" aria-label="오늘 감독 우선 검수 후보">
        {humanQueue.map((row, index) => {
          const { candidate } = row;
          const assignment = assignments[candidate.id] ?? null;
          const assignedToMe = assignment?.assigneeActorId === currentActor?.id;
          const assignmentBusy = reviewTeam?.claimingCandidateId === candidate.id;
          return (
            <article
              key={candidate.id}
              className={`director-queue-item ${selectedId === candidate.id ? 'selected' : ''}`}
              data-candidate-id={candidate.id}
              data-triage-decision={row.decision}
              data-triage-priority={row.priority}
              data-assignee-actor-id={assignment?.assigneeActorId ?? ''}
              data-assignment-status={assignment?.status ?? 'unassigned'}
            >
              <div className="director-queue-main">
                <div>
                  <span className={`director-priority-badge ${row.priority.toLowerCase()}`}>
                    {row.priority}
                  </span>
                  <span className="director-queue-type human-required">사람 판단 필요</span>
                  {index < priorityQueue.length && <span className="director-priority-order">우선 {index + 1}</span>}
                  <strong>{candidate.name}</strong>
                  <small>{candidate.locationVerification?.coordinateContext ?? candidate.address}</small>
                </div>
                <p className="director-human-question">{row.question}</p>
                <p>
                  {row.primaryReason} · {row.reasonDetail || row.missingLabel} · 검수 조건{' '}
                  {row.metRequirementCount}/{row.totalRequirementCount} · 남은 조건{' '}
                  {row.missingRequirementCount}개
                </p>
                <small className="director-required-action">해야 할 일: {row.requiredAction}</small>
                <div className={`director-assignment-state ${assignment ? 'assigned' : 'unassigned'}`}>
                  <span>담당자</span>
                  <strong>{assignment?.assigneeDisplayName ?? '미배정'}</strong>
                  <small>{assignment ? '같은 조직의 모든 화면에 공유됩니다.' : '맡기 전에는 누구의 작업도 아닙니다.'}</small>
                </div>
              </div>
              <div className="director-queue-actions">
                <button
                  type="button"
                  className="director-claim-action"
                  disabled={
                    !currentActor ||
                    assignmentBusy ||
                    Boolean(assignment && !assignedToMe)
                  }
                  onClick={() => {
                    if (!assignment) onClaimCandidate(candidate.id);
                    else if (assignedToMe) onReleaseCandidate(candidate.id);
                  }}
                >
                  {assignmentBusy
                    ? '배정 중'
                    : !currentActor
                      ? 'SaaS 배정'
                      : !assignment
                        ? '내가 맡기'
                        : assignedToMe
                          ? '내 작업 해제'
                          : `${assignment.assigneeDisplayName} 담당`}
                </button>
                <button
                  type="button"
                  className="director-queue-primary"
                  onClick={() => onReviewCandidate(candidate.id)}
                >
                  판단 기준 보기
                </button>
                <button
                  type="button"
                  className="director-queue-secondary"
                  onClick={() => onSelectCandidate(candidate.id)}
                >
                  {selectedId === candidate.id ? '선택됨' : '지도에서 선택'}
                </button>
              </div>
            </article>
          );
        })}

        {humanQueue.length === 0 && (
          <div className="director-queue-empty" role="status">
            <strong>사람이 처리할 항목이 없습니다</strong>
            <p>완료·데이터 보강·무효 항목은 아래 자동 분류 감사 기록에서 확인합니다.</p>
          </div>
        )}
      </div>

      <details className="director-audit-disclosure">
        <summary>
          자동 분류 감사 기록 보기
          <span>{auditRows.length}개</span>
        </summary>
        <p>
          이 영역은 감독의 기본 할 일 목록이 아닙니다. 자동 완료, 데이터 보강, 무효 판정의
          이유와 후속 행동만 보관합니다.
        </p>
        <div className="director-audit-list">
          {auditRows.map((row) => (
            <article key={`${row.decision}-${row.candidate.id}`} data-candidate-id={row.candidate.id}>
              <div>
                <span>{row.decision}</span>
                <strong>{row.candidate.name}</strong>
              </div>
              <p>{row.primaryReason}</p>
              <small>{row.requiredAction}</small>
            </article>
          ))}
          {auditRows.length === 0 && <p>현재 감사 기록 항목이 없습니다.</p>}
        </div>
      </details>
    </section>
  );
}
