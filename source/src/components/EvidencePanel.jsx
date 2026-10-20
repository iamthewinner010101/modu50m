import { useMemo, useState } from 'react';
import {
  buildPresentationEvidenceMarkdown,
  buildSubmissionEvidenceMarkdown,
  buildStudentReviewEvidenceJson,
  getEvidenceRows,
  getReviewQueue,
  getEvidenceSummary,
  FIELD_VERIFICATION_TARGET,
  SECOND_REVIEW_TARGET,
  SUBMISSION_TARGET,
} from '../utils/evidence';
import { getHumanCompletionSummary } from '../utils/humanCompletion';
import { getBarrierLabel } from '../utils/scoring';
import AuditExportPanel from './AuditExportPanel';
import HumanCompletionPanel from './HumanCompletionPanel';

function getMemoSnippet(memo) {
  if (!memo?.trim()) return '메모 대기';
  return memo.length > 36 ? `${memo.slice(0, 36)}...` : memo;
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function EvidencePanel({
  candidates,
  reviews,
  selectedId,
  onSelectCandidate,
  onReviewCandidate,
  audit,
  humanCompletion,
  humanCompletionActions,
}) {
  const [exportMode, setExportMode] = useState(null);
  const evidenceRows = useMemo(() => getEvidenceRows(candidates, reviews), [candidates, reviews]);
  const reviewQueue = useMemo(
    () => getReviewQueue(candidates, reviews, candidates.length),
    [candidates, reviews],
  );
  const exportMarkdown = useMemo(() => buildSubmissionEvidenceMarkdown(evidenceRows), [evidenceRows]);
  const exportPresentation = useMemo(() => buildPresentationEvidenceMarkdown(evidenceRows), [evidenceRows]);
  const exportJson = useMemo(
    () => buildStudentReviewEvidenceJson(candidates, reviews, humanCompletion),
    [candidates, reviews, humanCompletion],
  );
  const exportValue = exportMode === 'json' ? exportJson : exportMode === 'ppt' ? exportPresentation : exportMarkdown;
  const {
    severityLabelCount,
    aiAgreementLabelCount,
    validationStateCount,
    comparisonCount,
    sourceEvidenceCount,
    primaryAttributionCount,
    independentSecondReviewCount,
    fieldVerificationCount,
    ready: reviewEvidenceReady,
  } = getEvidenceSummary(evidenceRows);
  const humanCompletionSummary = getHumanCompletionSummary(humanCompletion);
  const ready = reviewEvidenceReady && humanCompletionSummary.presentationReady;
  const remainingReviewCount = Math.max(0, SUBMISSION_TARGET - primaryAttributionCount);
  const missingImportChecks = [
    { label: '서버 귀속 직접 검수', count: primaryAttributionCount, target: SUBMISSION_TARGET },
    { label: '심각도 라벨', count: severityLabelCount, target: SUBMISSION_TARGET },
    { label: 'AI 비교 라벨', count: aiAgreementLabelCount, target: SUBMISSION_TARGET },
    { label: '후속 검수 필요도', count: validationStateCount, target: SUBMISSION_TARGET },
    { label: '전/후 비교 메모', count: comparisonCount, target: SUBMISSION_TARGET },
    { label: '지도 근거 기록', count: sourceEvidenceCount, target: SUBMISSION_TARGET },
    { label: '독립 2차 검수', count: independentSecondReviewCount, target: SECOND_REVIEW_TARGET },
    { label: '현장 사진 확인', count: fieldVerificationCount, target: FIELD_VERIFICATION_TARGET },
    { label: '발표·Q&A·오프라인 시연', count: humanCompletionSummary.presentationReady ? 1 : 0, target: 1 },
  ].filter((item) => item.count < item.target);
  const firstImportQueueRow = reviewQueue[0] ?? null;
  const firstImportCandidate = firstImportQueueRow?.candidate ?? null;
  const importGateLabel = ready ? 'import 실행 가능' : '직접 검수 먼저 · 사람 증거 보강';
  const importGateDetail = ready
    ? '검수 JSON을 내려받은 뒤 dry-run과 --apply를 차례로 실행합니다.'
    : missingImportChecks[0]
      ? `${missingImportChecks[0].label} ${missingImportChecks[0].count}/${missingImportChecks[0].target}부터 채워야 합니다.`
      : '사람 완료 증거를 확인해야 import 대상 파일로 인정됩니다.';
  const labelSetCount = Math.min(
    severityLabelCount,
    aiAgreementLabelCount,
    validationStateCount,
    comparisonCount,
  );

  function handleReadinessAction() {
    if (ready) {
      downloadTextFile('student-review-evidence.v1.json', exportJson, 'application/json');
      return;
    }
    if (firstImportCandidate && onReviewCandidate) {
      onReviewCandidate(firstImportCandidate.id);
      return;
    }
    if (firstImportCandidate) onSelectCandidate(firstImportCandidate.id);
  }

  return (
    <section className="panel evidence-panel">
      <div className="panel-title-row">
        <span className="panel-label">제출 증거 준비도</span>
        <span className={`status-pill ${ready ? 'published' : 'field_check_needed'}`}>
          {ready ? '기준 충족' : '수업 중 보강'}
        </span>
      </div>

      <div className={`submission-readiness-hero ${ready ? 'ready' : 'pending'}`}>
        <div className="submission-readiness-score">
          <span>사람 검수 증거</span>
          <strong>{primaryAttributionCount}/{SUBMISSION_TARGET}</strong>
          <p>
            {ready
              ? '12개 후보의 사람 검수 기록이 모였습니다. JSON 검증 뒤 제출 자료로 고정하세요.'
              : `제출 전 태윤이가 직접 확인하고 저장할 후보가 ${remainingReviewCount}개 남았습니다.`}
          </p>
        </div>
        <ul className="submission-readiness-checks" aria-label="제출 준비 체크">
          <li className={primaryAttributionCount >= SUBMISSION_TARGET ? 'ready' : 'pending'}>
            <span aria-hidden="true">{primaryAttributionCount >= SUBMISSION_TARGET ? '✓' : '1'}</span>
            <div><strong>서버 귀속 직접 판정</strong><small>{primaryAttributionCount}/{SUBMISSION_TARGET}</small></div>
          </li>
          <li className={labelSetCount >= SUBMISSION_TARGET ? 'ready' : 'pending'}>
            <span aria-hidden="true">{labelSetCount >= SUBMISSION_TARGET ? '✓' : '2'}</span>
            <div><strong>라벨·비교 메모</strong><small>{labelSetCount}/{SUBMISSION_TARGET}</small></div>
          </li>
          <li className={sourceEvidenceCount >= SUBMISSION_TARGET ? 'ready' : 'pending'}>
            <span aria-hidden="true">{sourceEvidenceCount >= SUBMISSION_TARGET ? '✓' : '3'}</span>
            <div><strong>지도 근거 기록</strong><small>{sourceEvidenceCount}/{SUBMISSION_TARGET}</small></div>
          </li>
          <li className={independentSecondReviewCount >= SECOND_REVIEW_TARGET ? 'ready' : 'pending'}>
            <span aria-hidden="true">{independentSecondReviewCount >= SECOND_REVIEW_TARGET ? '✓' : '4'}</span>
            <div><strong>독립 2차 검수</strong><small>{independentSecondReviewCount}/{SECOND_REVIEW_TARGET}</small></div>
          </li>
          <li className={fieldVerificationCount >= FIELD_VERIFICATION_TARGET ? 'ready' : 'pending'}>
            <span aria-hidden="true">{fieldVerificationCount >= FIELD_VERIFICATION_TARGET ? '✓' : '5'}</span>
            <div><strong>현장 사진 확인</strong><small>{fieldVerificationCount}/{FIELD_VERIFICATION_TARGET}</small></div>
          </li>
        </ul>
        <button type="button" className="submission-primary-action" onClick={handleReadinessAction}>
          {ready ? '검수 JSON 다운로드' : '첫 미검수 후보 열기'}
        </button>
      </div>

      <div className="evidence-summary">
        <div>
          <strong>{primaryAttributionCount}</strong>
          <span>서버 귀속 직접 검수</span>
        </div>
        <div>
          <strong>{labelSetCount}</strong>
          <span>완성 라벨 세트</span>
        </div>
        <div>
          <strong>{sourceEvidenceCount}</strong>
          <span>지도 근거 기록</span>
        </div>
        <div>
          <strong>{SUBMISSION_TARGET}</strong>
          <span>제출 기준</span>
        </div>
      </div>

      <HumanCompletionPanel completion={humanCompletion} actions={humanCompletionActions} />

      <details className="submission-tool-disclosure" open={ready}>
        <summary>검수 JSON 가져오기와 제출 도구</summary>
        <div className="student-evidence-import-card" aria-label="학생 12개 검수 증거 import 흐름">
        <div className="student-evidence-import-header">
          <div>
            <span>학생 12개 검수 증거 import</span>
            <strong>{ready ? 'import 검증 대기' : `${remainingReviewCount}개 더 필요`}</strong>
            <p>
              감독은 다음 수업에서 태윤이가 직접 저장한 검수 JSON을 받아
              docs/student-review-evidence.v1.json으로 import한 뒤 검증합니다.
            </p>
          </div>
          <div className={`student-evidence-import-status ${ready ? 'ready' : 'pending'}`}>
            <span>현재 수집</span>
            <strong>{primaryAttributionCount}/{SUBMISSION_TARGET}</strong>
          </div>
        </div>

        <div className="student-import-runbook" aria-label="감독 import 실행판">
          <div className="student-import-runbook-main">
            <span>감독 import 실행판</span>
            <strong>{importGateLabel}</strong>
            <p>{importGateDetail}</p>
          </div>
          <div className="student-import-runbook-file">
            <span>예상 다운로드 파일</span>
            <strong>student-review-evidence.v1.json</strong>
            <small>목표 반영 위치: docs/student-review-evidence.v1.json</small>
          </div>
          <div className="student-import-runbook-commands">
            <span>실행 순서</span>
            <code>npm run import:evidence -- "&lt;downloaded-json-path&gt;"</code>
            <code>npm run import:evidence -- "&lt;downloaded-json-path&gt;" --apply</code>
            <code>npm run verify:ready</code>
          </div>
          <div className="student-import-runbook-actions">
            <button
              type="button"
              className="student-import-runbook-primary"
              disabled={!ready && !firstImportCandidate}
              onClick={handleReadinessAction}
            >
              {ready ? '검수 JSON 바로 다운로드' : '부족 후보 검수 열기'}
            </button>
            <button
              type="button"
              className="student-import-runbook-secondary"
              onClick={() => downloadTextFile('student-review-evidence.v1.json', exportJson, 'application/json')}
            >
              현재 JSON 내려받기
            </button>
          </div>
        </div>

        <div className="student-evidence-import-steps">
          <div>
            <span>1</span>
            <strong>검수 JSON 다운로드</strong>
            <p>이 탭의 검수 JSON 다운로드 버튼으로 student-review-evidence.v1.json을 저장합니다.</p>
          </div>
          <div>
            <span>2</span>
            <strong>dry-run으로 구조 확인</strong>
            <code>npm run import:evidence -- "&lt;downloaded-json-path&gt;"</code>
          </div>
          <div>
            <span>3</span>
            <strong>검증 파일로 반영</strong>
            <code>npm run import:evidence -- "&lt;downloaded-json-path&gt;" --apply</code>
          </div>
          <div>
            <span>4</span>
            <strong>제출 증거 검증</strong>
            <code>npm run validate:submission</code>
          </div>
        </div>

        <div className="student-evidence-import-target">
          <span>검증 파일 위치</span>
          <strong>docs/student-review-evidence.v1.json</strong>
          <p>
            verify:ready가 PENDING_STUDENT_EVIDENCE이면 앱 문제가 아니라 실제 12개 직접 검수 증거가 아직 부족하다는 뜻입니다.
          </p>
        </div>

        {missingImportChecks.length > 0 && (
          <div className="student-evidence-missing" aria-label="다음 수업 보강 조건">
            <span>다음 수업 보강 조건</span>
            <ul>
              {missingImportChecks.slice(0, 9).map((item) => (
                <li key={item.label}>
                  {item.label} {item.count}/{item.target}
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>
      </details>

      {!ready && (
        <details className="review-queue-disclosure">
          <summary>미검수·보강 후보 {reviewQueue.length}개 목록 보기</summary>
          <div className="review-queue" aria-label="12개 검수 세션 진행표">
          <h3>12개 검수 세션 진행표</h3>
          <p className="review-queue-note">
            감독은 이 목록으로 남은 후보 전체를 확인하고, 수업 중 바로 라벨링 검수 화면을 열어 12개 직접 검수 증거를 채웁니다.
          </p>
          <ul>
            {reviewQueue.map(({ candidate, score, barrierLabel, queueType, missingLabel, metRequirementCount, totalRequirementCount, missingRequirementCount }) => (
              <li key={candidate.id}>
                <div>
                  <span>{candidate.name}</span>
                  <small>
                    AI {score}점 · {barrierLabel}
                  </small>
                  <small>
                    검수 조건 {metRequirementCount}/{totalRequirementCount} · 남은 조건 {missingRequirementCount}개
                  </small>
                  <small>
                    {queueType}
                    {missingLabel ? `: ${missingLabel}` : ''}
                  </small>
                </div>
                <button
                  type="button"
                  className={selectedId === candidate.id ? 'selected' : ''}
                  aria-label={`${candidate.name} 라벨링 검수 열기`}
                  onClick={() => {
                    if (onReviewCandidate) {
                      onReviewCandidate(candidate.id);
                      return;
                    }
                    onSelectCandidate(candidate.id);
                  }}
                >
                  {queueType === '보강 필요' ? '보강 검수 열기' : '라벨링 검수 열기'}
                </button>
              </li>
            ))}
          </ul>
          </div>
        </details>
      )}

      <ul className="evidence-list">
        {evidenceRows.slice(0, 5).map(({ candidate, review, statusLabel, sourceLabel, score, severityLabel, aiAgreementLabel, validationStatusLabel }) => (
          <li key={candidate.id}>
            <span>{candidate.name}</span>
            <small>
              {score}점 · {statusLabel} ·{' '}
              {getBarrierLabel(review?.barrierType ?? candidate.defaultBarrierType)}
            </small>
            <small>
              라벨: {severityLabel} · {aiAgreementLabel} · {validationStatusLabel}
            </small>
            <small>확인 지도: {sourceLabel}</small>
            <em>{getMemoSnippet(review?.memo)}</em>
          </li>
        ))}
        {evidenceRows.length === 0 && (
          <li>
            <span>검수 기록 대기</span>
            <small>후보를 선택하고 검수 상태를 저장하면 여기에 쌓입니다.</small>
          </li>
        )}
      </ul>

      <p className="muted evidence-doc">
        증거 체크리스트 기준: docs/submission-evidence-checklist.md
      </p>

      <AuditExportPanel audit={audit} candidates={candidates} />

      <div className="evidence-export-actions">
        <button
          className="evidence-export-button"
          type="button"
          onClick={() => setExportMode((mode) => (mode === 'markdown' ? null : 'markdown'))}
        >
          {exportMode === 'markdown' ? '제출 기록 접기' : '제출 기록 펼치기'}
        </button>
        <button
          className="evidence-export-button secondary"
          type="button"
          onClick={() => setExportMode((mode) => (mode === 'json' ? null : 'json'))}
        >
          {exportMode === 'json' ? '검수 JSON 접기' : '검수 JSON 펼치기'}
        </button>
        <button
          className="evidence-export-button secondary"
          type="button"
          onClick={() => setExportMode((mode) => (mode === 'ppt' ? null : 'ppt'))}
        >
          {exportMode === 'ppt' ? 'PPT 원고 접기' : 'PPT 원고 펼치기'}
        </button>
        <button
          className="evidence-export-button secondary"
          type="button"
          onClick={() =>
            downloadTextFile('student-review-evidence.v1.json', exportJson, 'application/json')
          }
        >
          검수 JSON 다운로드
        </button>
        <button
          className="evidence-export-button secondary"
          type="button"
          onClick={() =>
            downloadTextFile('submission-evidence.md', exportMarkdown, 'text/markdown')
          }
        >
          제출 기록 다운로드
        </button>
        <button
          className="evidence-export-button secondary"
          type="button"
          onClick={() =>
            downloadTextFile('presentation-evidence.ppt.md', exportPresentation, 'text/markdown')
          }
        >
          PPT 발표 근거 다운로드
        </button>
      </div>

      {exportMode && (
        <textarea
          className="evidence-export-textarea"
          aria-label={exportMode === 'json' ? '검수 JSON' : exportMode === 'ppt' ? 'PPT 발표 근거 원고' : '제출 기록 마크다운'}
          readOnly
          value={exportValue}
          onFocus={(event) => event.target.select()}
        />
      )}
    </section>
  );
}
