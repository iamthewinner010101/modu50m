import { useEffect, useMemo, useState } from 'react';
import { buildAuditExportCsv, buildAuditExportJson } from '../utils/auditExport';

const ACTION_LABELS = {
  REVIEW_CREATED: '첫 판정 저장',
  REVIEW_UPDATED: '판정 수정',
  REVIEWS_RESET: '검수 초기화',
  ASSIGNMENT_CREATED: '담당 배정',
  ASSIGNMENT_RELEASED: '담당 해제',
  ASSIGNMENT_COMPLETED: '담당 완료',
};

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

function describeChange(event) {
  if (event.action === 'REVIEW_CREATED' || event.action === 'REVIEW_UPDATED') {
    const beforeStatus = event.before?.status ?? '미작성';
    const afterStatus = event.after?.status ?? '미작성';
    const severity = event.after?.severity ? ` · 심각도 ${event.after.severity}` : '';
    return `${beforeStatus} -> ${afterStatus}${severity}`;
  }
  const beforeStatus = event.before?.status ?? '없음';
  const afterStatus = event.after?.status ?? '없음';
  return `${beforeStatus} -> ${afterStatus}`;
}

export default function AuditExportPanel({ audit, candidates }) {
  const [candidateId, setCandidateId] = useState('');
  const [action, setAction] = useState('');
  const candidateNames = useMemo(
    () => Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate.name])),
    [candidates],
  );

  useEffect(() => {
    if (audit.enabled && (audit.status === 'idle' || audit.status === 'stale')) {
      audit.loadAuditEvents();
    }
  }, [audit]);

  const exportSource = {
    tenant: audit.tenant,
    filters: audit.filters,
    events: audit.events,
  };
  const tenantSlug = audit.tenant?.slug ?? 'workspace';

  function applyFilters() {
    audit.loadAuditEvents({ candidateId, action, limit: 200 });
  }

  return (
    <section
      className="audit-export-panel"
      aria-label="기관 감사 이력과 내보내기"
      data-audit-status={audit.status}
      data-audit-event-count={audit.eventCount}
      data-audit-tenant={tenantSlug}
    >
      <div className="audit-export-heading">
        <div>
          <span>기관 운영 증거</span>
          <h3>누가, 언제, 무엇을 바꿨는지 확인</h3>
          <p>현재 기관의 배정과 판정 변경만 조회하며 다른 기관 기록은 섞이지 않습니다.</p>
        </div>
        <div className="audit-export-count">
          <strong>{audit.eventCount}</strong>
          <span>조회 이벤트</span>
        </div>
      </div>

      {!audit.enabled ? (
        <p className="audit-export-empty">SaaS 서버로 실행하면 기관 감사 이력을 조회할 수 있습니다.</p>
      ) : (
        <>
          <div className="audit-filter-bar">
            <label>
              후보
              <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
                <option value="">전체 후보</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.id} · {candidate.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              변경 종류
              <select value={action} onChange={(event) => setAction(event.target.value)}>
                <option value="">전체 변경</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={applyFilters} disabled={audit.status === 'loading'}>
              {audit.status === 'loading' ? '조회 중' : '필터 적용'}
            </button>
          </div>

          {audit.error && <p className="audit-export-error" role="alert">{audit.error}</p>}

          <div className="audit-event-list" aria-label="기관 감사 이벤트">
            {audit.events.slice(0, 8).map((event) => (
              <article key={event.id} data-audit-action={event.action} data-candidate-id={event.candidateId ?? ''}>
                <div>
                  <span>{ACTION_LABELS[event.action] ?? event.action}</span>
                  <strong>{event.candidateId ? `${event.candidateId} · ${candidateNames[event.candidateId] ?? '후보'}` : '기관 전체'}</strong>
                </div>
                <p>{describeChange(event)}</p>
                <small>{event.actorDisplayName} · {new Date(event.createdAt).toLocaleString('ko-KR')}</small>
              </article>
            ))}
            {audit.status === 'loaded' && audit.events.length === 0 && (
              <p className="audit-export-empty">선택한 조건의 감사 이벤트가 없습니다.</p>
            )}
          </div>

          <div className="audit-export-actions">
            <button
              type="button"
              data-audit-download="json"
              disabled={audit.status !== 'loaded'}
              onClick={() => downloadTextFile(
                `modu50m-audit-${tenantSlug}.json`,
                buildAuditExportJson(exportSource),
                'application/json',
              )}
            >
              감사 JSON 다운로드
            </button>
            <button
              type="button"
              data-audit-download="csv"
              disabled={audit.status !== 'loaded'}
              onClick={() => downloadTextFile(
                `modu50m-audit-${tenantSlug}.csv`,
                buildAuditExportCsv(exportSource),
                'text/csv',
              )}
            >
              감사 CSV 다운로드
            </button>
            <small>{audit.loadedAt ? `마지막 조회 ${new Date(audit.loadedAt).toLocaleString('ko-KR')}` : '조회 전'}</small>
          </div>
        </>
      )}
    </section>
  );
}
