import { useMemo, useState } from 'react';
import {
  DAEJEON_DISTRICTS,
  DAEJEON_PLACE_PLOT_BOUNDS,
  filterDaejeonPlaceCandidates,
  normalizeDaejeonPlaceCandidates,
  projectDaejeonCoordinates,
  summarizeDaejeonPlaceCandidates,
} from '../utils/daejeonPlaceMap';
import { getCandidateReviewLinks, getCoordinateLabel } from '../utils/mapLinks';
import {
  ROADVIEW_AUDIT_STATUS_META,
  ROADVIEW_AUDIT_STATUSES,
  getRenderableRoadviewImage,
} from '../utils/daejeonRoadviewAudit';
import {
  ACCESSIBILITY_STATUS_OPTIONS,
  FIELD_CHECK_STATUS_OPTIONS,
  INDEPENDENT_REVIEW_STATUS_OPTIONS,
  PLACE_MATCH_STATUS_OPTIONS,
  STUDENT_REVIEW_STATUS_OPTIONS,
  createDaejeonCandidateReviewDraft,
  createEmptyDaejeonCandidateReviewLedger,
  exportDaejeonCandidateReviewLedger,
  getDaejeonCandidateReviewStatusLabel,
  importDaejeonCandidateReviewLedger,
  loadDaejeonCandidateReviewLedger,
  persistDaejeonCandidateReviewLedger,
  saveDaejeonCandidateReview,
  summarizeDaejeonCandidateReviewLedger,
} from '../utils/daejeonCandidateReviewLedger';
import KakaoRoadviewViewer from './KakaoRoadviewViewer';
import './DaejeonPlaceCandidateMap.css';

const ALL_FILTER = 'all';
const LIST_LIMIT = 160;
const PLOT_WIDTH = 1000;
const PLOT_HEIGHT = 720;

const CATEGORY_META = Object.freeze({
  park: { label: '공원', color: '#1c9b62' },
  wheelchair_charger: { label: '전동휠체어 충전기', color: '#2378e5' },
  library: { label: '도서관', color: '#7b58cf' },
  other: { label: '기타', color: '#667085' },
});

function categoryMeta(candidate) {
  return CATEGORY_META[candidate?.category] ?? {
    label: candidate?.categoryLabel || '기타',
    color: CATEGORY_META.other.color,
  };
}

function displayDate(candidate) {
  return candidate?.basisDate || candidate?.referenceDate || '기준일 확인 필요';
}

function coordinateLabel(candidate) {
  if (candidate?.coordinateStatus === 'missing') return '제공 좌표 없음';
  if (candidate?.coordinateStatus === 'out_of_bounds') {
    return `${getCoordinateLabel(candidate)} · 대전 범위 밖`;
  }
  return getCoordinateLabel(candidate);
}

function roadviewStatusMeta(candidate) {
  return ROADVIEW_AUDIT_STATUS_META[candidate?.roadviewStatus] ?? ROADVIEW_AUDIT_STATUS_META.unchecked;
}

function auditValue(value, fallback = '미확인') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function captureTimeLabel(auditEntry) {
  const value = auditValue(auditEntry?.captureTime);
  return auditEntry?.captureTimePrecision === 'month_observed_in_browser_receipt'
    ? `${value} (관찰 월)`
    : value;
}

function initialReviewLedgerState() {
  if (typeof window === 'undefined') {
    return {
      ledger: createEmptyDaejeonCandidateReviewLedger(),
      notice: '',
      noticeTone: 'neutral',
    };
  }
  const loaded = loadDaejeonCandidateReviewLedger(window.localStorage);
  return {
    ledger: loaded.ledger,
    notice: loaded.error,
    noticeTone: loaded.error ? 'error' : 'neutral',
  };
}

function savedTimeLabel(value) {
  if (!value) return '저장 기록 없음';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '저장 시각 확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function StatusSelect({ label, value, options, onChange, testId }) {
  return (
    <label>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-testid={testId}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function CandidateReviewLedgerForm({ candidate, savedEntry, onSave }) {
  const [draft, setDraft] = useState(() => createDaejeonCandidateReviewDraft(candidate, savedEntry));
  const [error, setError] = useState('');

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function submitReview(event) {
    event.preventDefault();
    try {
      onSave(draft);
      setError('');
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  const review = savedEntry?.review ?? createDaejeonCandidateReviewDraft(candidate);

  return (
    <section
      className="daejeon-place-map__review-ledger"
      aria-label={`${candidate.name} 사람 검수 기록`}
      data-testid="daejeon-candidate-review-ledger-form"
      data-review-candidate-id={candidate.id}
      data-review-revision={savedEntry?.revision ?? 0}
      data-review-place-status={review.placeMatchStatus}
      data-review-accessibility-status={review.accessibilityStatus}
      data-review-student-status={review.studentReviewStatus}
      data-review-independent-status={review.independentReviewStatus}
      data-review-field-status={review.fieldCheckStatus}
    >
      <header>
        <div>
          <span>후보별 사람 검수 원장</span>
          <h4>보고 판단한 내용을 직접 기록해요</h4>
          <p>
            아래 상태는 자동 판정이나 신원 인증 결과가 아닙니다. 폼을 작성하고 ‘이 후보 기록 저장’을
            누른 경우에만 이 브라우저에 관찰 기록으로 남습니다.
          </p>
        </div>
        <div className="daejeon-place-map__review-revision">
          <strong>revision {savedEntry?.revision ?? 0}</strong>
          <small>{savedTimeLabel(savedEntry?.savedAt)}</small>
        </div>
      </header>

      <div className="daejeon-place-map__review-readback" aria-label="현재 저장된 검수 상태">
        <span>
          장소
          <strong>{getDaejeonCandidateReviewStatusLabel(PLACE_MATCH_STATUS_OPTIONS, review.placeMatchStatus)}</strong>
        </span>
        <span>
          접근성
          <strong>{getDaejeonCandidateReviewStatusLabel(ACCESSIBILITY_STATUS_OPTIONS, review.accessibilityStatus)}</strong>
        </span>
        <span>
          태윤 검수
          <strong>{getDaejeonCandidateReviewStatusLabel(STUDENT_REVIEW_STATUS_OPTIONS, review.studentReviewStatus)}</strong>
        </span>
        <span>
          독립 검수
          <strong>{getDaejeonCandidateReviewStatusLabel(INDEPENDENT_REVIEW_STATUS_OPTIONS, review.independentReviewStatus)}</strong>
        </span>
        <span>
          현장
          <strong>{getDaejeonCandidateReviewStatusLabel(FIELD_CHECK_STATUS_OPTIONS, review.fieldCheckStatus)}</strong>
        </span>
      </div>

      <form onSubmit={submitReview}>
        <div className="daejeon-place-map__review-form-grid">
          <div className="daejeon-place-map__review-field-group">
            <StatusSelect
              label="① 장소·입구 일치"
              value={draft.placeMatchStatus}
              options={PLACE_MATCH_STATUS_OPTIONS}
              onChange={(value) => updateDraft('placeMatchStatus', value)}
              testId="daejeon-place-match-status"
            />
            <label>
              <span>무엇을 보고 판단했나요?</span>
              <textarea
                value={draft.placeMatchNote}
                onChange={(event) => updateDraft('placeMatchNote', event.target.value)}
                placeholder="예: 표지판 이름은 같지만 입구가 나무에 가려져 판단을 보류했다."
                required={draft.placeMatchStatus !== 'unchecked'}
                minLength={draft.placeMatchStatus !== 'unchecked' ? 8 : undefined}
              />
            </label>
          </div>

          <div className="daejeon-place-map__review-field-group">
            <StatusSelect
              label="② 화면에서 본 접근성"
              value={draft.accessibilityStatus}
              options={ACCESSIBILITY_STATUS_OPTIONS}
              onChange={(value) => updateDraft('accessibilityStatus', value)}
              testId="daejeon-accessibility-status"
            />
            <label>
              <span>보이는 것과 안 보이는 것을 적어 주세요.</span>
              <textarea
                value={draft.accessibilityNote}
                onChange={(event) => updateDraft('accessibilityNote', event.target.value)}
                placeholder="예: 경사로는 보이지만 폭과 기울기는 사진만으로 알 수 없다."
                required={draft.accessibilityStatus !== 'unchecked'}
                minLength={draft.accessibilityStatus !== 'unchecked' ? 8 : undefined}
              />
            </label>
          </div>

          <div className="daejeon-place-map__review-field-group student">
            <StatusSelect
              label="③ 태윤 직접 검수"
              value={draft.studentReviewStatus}
              options={STUDENT_REVIEW_STATUS_OPTIONS}
              onChange={(value) => updateDraft('studentReviewStatus', value)}
              testId="daejeon-student-review-status"
            />
            <label>
              <span>태윤이가 직접 알게 된 점</span>
              <textarea
                value={draft.studentReviewNote}
                onChange={(event) => updateDraft('studentReviewNote', event.target.value)}
                placeholder="내가 직접 비교한 내용과 아직 확실하지 않은 점을 내 말로 적는다."
                required={draft.studentReviewStatus === 'reviewed_by_taeyun'}
                minLength={draft.studentReviewStatus === 'reviewed_by_taeyun' ? 10 : undefined}
              />
            </label>
          </div>

          <div className="daejeon-place-map__review-field-group independent">
            <StatusSelect
              label="④ 다른 사람의 독립 검수"
              value={draft.independentReviewStatus}
              options={INDEPENDENT_REVIEW_STATUS_OPTIONS}
              onChange={(value) => updateDraft('independentReviewStatus', value)}
              testId="daejeon-independent-review-status"
            />
            <label>
              <span>검수자 이름</span>
              <input
                type="text"
                value={draft.independentReviewerName}
                onChange={(event) => updateDraft('independentReviewerName', event.target.value)}
                placeholder="태윤 외 검수자"
                required={draft.independentReviewStatus === 'reviewed_by_other'}
              />
            </label>
            <label>
              <span>독립 검수 메모</span>
              <textarea
                value={draft.independentReviewNote}
                onChange={(event) => updateDraft('independentReviewNote', event.target.value)}
                placeholder="먼저 다른 사람의 결과를 보지 않고 확인한 내용과 차이를 적는다."
                required={draft.independentReviewStatus === 'reviewed_by_other'}
                minLength={draft.independentReviewStatus === 'reviewed_by_other' ? 10 : undefined}
              />
            </label>
          </div>

          <div className="daejeon-place-map__review-field-group field">
            <StatusSelect
              label="⑤ 현장 확인"
              value={draft.fieldCheckStatus}
              options={FIELD_CHECK_STATUS_OPTIONS}
              onChange={(value) => updateDraft('fieldCheckStatus', value)}
              testId="daejeon-field-check-status"
            />
            <label>
              <span>현장 방문일</span>
              <input
                type="date"
                value={draft.fieldVisitedOn}
                onChange={(event) => updateDraft('fieldVisitedOn', event.target.value)}
                required={draft.fieldCheckStatus === 'visited'}
                disabled={draft.fieldCheckStatus !== 'visited'}
              />
            </label>
            <label>
              <span>현장 확인 근거</span>
              <textarea
                value={draft.fieldCheckNote}
                onChange={(event) => updateDraft('fieldCheckNote', event.target.value)}
                placeholder="방문해 확인한 내용과 사진 파일명 등을 적는다."
                required={draft.fieldCheckStatus === 'visited'}
                minLength={draft.fieldCheckStatus === 'visited' ? 10 : undefined}
              />
            </label>
          </div>
        </div>

        <div className="daejeon-place-map__review-save-row">
          <label>
            <span>이번 기록 저장자</span>
            <input
              type="text"
              value={draft.recordedBy}
              onChange={(event) => updateDraft('recordedBy', event.target.value)}
              placeholder="예: 허태윤"
              minLength={2}
              required
              data-testid="daejeon-review-recorded-by"
            />
            <small>로컬 자기기입이며 계정으로 신원을 인증한 기록은 아닙니다.</small>
          </label>
          <label>
            <span>추가 메모</span>
            <textarea
              value={draft.generalNote}
              onChange={(event) => updateDraft('generalNote', event.target.value)}
              placeholder="다음에 다시 확인할 질문이나 조사 아이디어"
            />
          </label>
          <button type="submit" data-testid="daejeon-review-save-button">이 후보 기록 저장</button>
        </div>
        {error ? <p className="daejeon-place-map__review-error" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}

export default function DaejeonPlaceCandidateMap({
  candidateData = null,
  auditData = null,
  regionBridgeData = null,
}) {
  const candidates = useMemo(
    () => normalizeDaejeonPlaceCandidates(candidateData, auditData, regionBridgeData),
    [candidateData, auditData, regionBridgeData],
  );
  const summary = useMemo(
    () => summarizeDaejeonPlaceCandidates(candidates, regionBridgeData),
    [candidates, regionBridgeData],
  );
  const [category, setCategory] = useState(ALL_FILTER);
  const [district, setDistrict] = useState(ALL_FILTER);
  const [administrativeDongCode, setAdministrativeDongCode] = useState(ALL_FILTER);
  const [roadviewStatus, setRoadviewStatus] = useState(ALL_FILTER);
  const [query, setQuery] = useState('');
  const [roadviewLightboxOpen, setRoadviewLightboxOpen] = useState(false);
  const [reviewLedgerState, setReviewLedgerState] = useState(initialReviewLedgerState);
  const [selectedId, setSelectedId] = useState(() => (
    candidates.find((candidate) => candidate.coordinateValid)?.id ?? candidates[0]?.id ?? ''
  ));
  const visibleCandidates = useMemo(
    () => filterDaejeonPlaceCandidates(candidates, {
      category,
      district,
      query,
      roadviewStatus,
      administrativeDongCode,
    }),
    [candidates, category, district, query, roadviewStatus, administrativeDongCode],
  );
  const plottedCandidates = useMemo(
    () => projectDaejeonCoordinates(visibleCandidates),
    [visibleCandidates],
  );
  const selectedCandidate = visibleCandidates.find((candidate) => candidate.id === selectedId)
    ?? plottedCandidates[0]
    ?? visibleCandidates[0]
    ?? null;
  const selectedLinks = selectedCandidate?.coordinateValid
    ? getCandidateReviewLinks(selectedCandidate)
    : null;
  const selectedProjectedCandidate = plottedCandidates.find((candidate) => candidate.id === selectedCandidate?.id)
    ?? null;
  const selectedRoadviewImage = getRenderableRoadviewImage(selectedCandidate?.roadviewAudit);
  const selectedRoadviewCapture = selectedCandidate?.roadviewAudit?.capture ?? null;
  const categoryOptions = Object.entries(summary.categoryCounts)
    .sort(([left], [right]) => left.localeCompare(right, 'ko'));
  const administrativeDongOptions = useMemo(() => (
    Array.isArray(regionBridgeData?.administrativeCoverage)
      ? regionBridgeData.administrativeCoverage.filter((dong) => (
        district === ALL_FILTER || dong.district === district
      ))
      : []
  ), [district, regionBridgeData]);
  const selectedAdministrativeDong = administrativeDongOptions.find(
    (dong) => dong.code === administrativeDongCode,
  ) ?? null;
  const reviewLedgerSummary = useMemo(
    () => summarizeDaejeonCandidateReviewLedger(reviewLedgerState.ledger),
    [reviewLedgerState.ledger],
  );
  const selectedReviewEntry = selectedCandidate
    ? reviewLedgerState.ledger.entries[selectedCandidate.id] ?? null
    : null;

  function focusCandidate(candidate) {
    setRoadviewLightboxOpen(false);
    setSelectedId(candidate.id);
  }

  function saveSelectedCandidateReview(draft) {
    const nextLedger = saveDaejeonCandidateReview(
      reviewLedgerState.ledger,
      selectedCandidate,
      draft,
    );
    const persistedLedger = persistDaejeonCandidateReviewLedger(window.localStorage, nextLedger);
    setReviewLedgerState({
      ledger: persistedLedger,
      notice: `${selectedCandidate.name} 관찰 기록을 revision ${persistedLedger.entries[selectedCandidate.id].revision}로 저장했습니다.`,
      noticeTone: 'success',
    });
  }

  function downloadReviewLedger() {
    try {
      const json = exportDaejeonCandidateReviewLedger(reviewLedgerState.ledger);
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `모두의50m_대전후보_사람검수원장_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setReviewLedgerState((current) => ({
        ...current,
        notice: `검수 기록 ${reviewLedgerSummary.savedCandidateCount}건을 JSON으로 내보냈습니다.`,
        noticeTone: 'success',
      }));
    } catch (error) {
      setReviewLedgerState((current) => ({
        ...current,
        notice: `검수 원장을 내보내지 못했습니다: ${error.message}`,
        noticeTone: 'error',
      }));
    }
  }

  async function importReviewLedger(event) {
    const input = event.currentTarget;
    const [file] = input.files ?? [];
    if (!file) return;
    try {
      const json = await file.text();
      const validCandidateIds = new Set(candidates.map((candidate) => candidate.id));
      const importedLedger = importDaejeonCandidateReviewLedger(json, validCandidateIds);
      const persistedLedger = persistDaejeonCandidateReviewLedger(window.localStorage, importedLedger);
      setReviewLedgerState({
        ledger: persistedLedger,
        notice: `${Object.keys(persistedLedger.entries).length}개 후보의 검수 원장을 가져왔습니다. 가져오기는 기존 로컬 원장을 교체합니다.`,
        noticeTone: 'success',
      });
    } catch (error) {
      setReviewLedgerState((current) => ({
        ...current,
        notice: `가져오기를 중단했습니다. 기존 원장은 그대로입니다: ${error.message}`,
        noticeTone: 'error',
      }));
    } finally {
      input.value = '';
    }
  }

  return (
    <section
      className="daejeon-place-map"
      data-testid="daejeon-place-candidate-map"
      data-map-provider="offline-wgs84"
      data-map-kind="offline-coordinate-plot"
      data-source-row-count={summary.sourceRowCount}
      data-coordinate-count={summary.coordinateValidCount}
      data-coordinate-missing-count={summary.coordinateMissingCount}
      data-coordinate-out-of-bounds-count={summary.coordinateOutOfBoundsCount}
      data-roadview-checked-count={summary.roadviewCheckedCount}
      data-roadview-audit-total-count={summary.roadviewEligibleCount}
      data-roadview-audit-completed-count={summary.roadviewCompletedCount}
      data-roadview-audit-remaining-count={summary.roadviewRemainingCount}
      data-roadview-audit-verified-count={summary.roadviewVerifiedCount}
      data-roadview-audit-human-review-count={summary.roadviewHumanReviewCount}
      data-place-match-verified-count={summary.placeMatchVerifiedCount}
      data-accessibility-verified-count={summary.accessibilityVerifiedCount}
      data-review-ledger-saved-count={reviewLedgerSummary.savedCandidateCount}
      data-review-ledger-student-count={reviewLedgerSummary.studentReviewedCount}
      data-review-ledger-independent-count={reviewLedgerSummary.independentReviewedCount}
      data-review-ledger-field-visited-count={reviewLedgerSummary.fieldVisitedCount}
      data-administrative-dong-candidate-count={summary.regionCoverage.matchedAdministrativeDongCount ?? 0}
      data-administrative-dong-candidate-total={summary.regionCoverage.expectedAdministrativeDongCount ?? 0}
      data-administrative-dong-candidate-coverage-percent={summary.regionCoverage.administrativeDongCoveragePercent ?? 0}
      data-administrative-dong-relation-count={summary.regionCoverage.relatedAdministrativeDongCount ?? 0}
      data-administrative-dong-exact-count={summary.regionCoverage.exactAdministrativeDongCount ?? 0}
      data-inline-roadview-administrative-dong-count={summary.regionCoverage.inlineRoadviewAdministrativeDongCount ?? 0}
      aria-label="대전 공식 장소 후보 좌표 지도"
    >
      <header className="daejeon-place-map__header">
        <div>
          <span>대전 전역 · 실제 좌표 층</span>
          <h2>공식 장소 후보를 지도에서 찾고 로드뷰로 확인해요</h2>
          <p>
            공공데이터의 좌표를 한꺼번에 표시했습니다. 점을 누르면 같은 화면 안에서 공식 카카오
            360도 로드뷰를 요청하고, 연결 여부와 남은 확인 항목을 함께 보여 줍니다.
          </p>
        </div>
        <div className="daejeon-place-map__total">
          <strong>{summary.coordinateValidCount.toLocaleString()}</strong>
          <span>지도에 표시한 좌표</span>
          <small>
            공식 후보 원천행 {summary.sourceRowCount.toLocaleString()}개 중 · 범위 밖 {summary.coordinateOutOfBoundsCount}개
          </small>
        </div>
      </header>

      <section className="daejeon-place-map__evidence-strip" aria-label="후보 좌표와 검수 증거 구분">
        <article>
          <span>공식 후보 원천행</span>
          <strong>{summary.sourceRowCount.toLocaleString()}</strong>
          <small>데이터셋 사이 중복 제거 전</small>
        </article>
        <article>
          <span>유효 좌표</span>
          <strong>{summary.coordinateValidCount.toLocaleString()}</strong>
          <small>지도 점으로 표시 · 범위 밖 {summary.coordinateOutOfBoundsCount}개 제외</small>
        </article>
        <article className="needs-check">
          <span>로드뷰 요청 처리</span>
          <strong>{summary.roadviewCheckedCount.toLocaleString()}</strong>
          <small>파노라마·장소 일치 확인과는 별도</small>
        </article>
        <article className="needs-check">
          <span>장소·입구 일치 확인</span>
          <strong>{summary.placeMatchVerifiedCount.toLocaleString()}</strong>
          <small>사진과 목적지 대조 전</small>
        </article>
        <article className="needs-check">
          <span>접근성 확인</span>
          <strong>{summary.accessibilityVerifiedCount.toLocaleString()}</strong>
          <small>자동 안전 판정 아님</small>
        </article>
      </section>

      <section className="daejeon-place-map__region-strip" aria-label="공식 후보의 행정동 연결 상태">
        <article>
          <span>행정동 관계 연결</span>
          <strong>
            {summary.regionCoverage.matchedAdministrativeDongCount ?? 0}/
            {summary.regionCoverage.expectedAdministrativeDongCount ?? '—'}
          </strong>
          <small>
            법정동 토큰과 행정안전부 관계표 기준 · 다중 관할 보존 ·
            {' '}정확한 좌표 귀속 아님 · {summary.regionCoverage.administrativeDongCoveragePercent ?? 0}%
          </small>
        </article>
        <article>
          <span>단일 행정동 직접 연결 · 후보가 있는 동</span>
          <strong>
            {summary.regionCoverage.exactAdministrativeDongCount ?? 0}/
            {summary.regionCoverage.expectedAdministrativeDongCount ?? '—'}
          </strong>
          <small>
            단일 연결 후보 {summary.regionCoverage.candidateRegionMatchedCount ?? 0}행 ·
            {' '}관계 연결 {summary.regionCoverage.candidateRegionRelatedCount ?? 0}행 ·
            {' '}다중 관할 {summary.regionCoverage.candidateRegionAmbiguousCount ?? 0}행 ·
            {' '}미연결 {summary.regionCoverage.candidateRegionUnmatchedCount ?? 0}행
          </small>
        </article>
        <article className="needs-check">
          <span>인라인 로드뷰 캡처 행정동</span>
          <strong>
            {summary.regionCoverage.inlineRoadviewAdministrativeDongCount ?? 0}/
            {summary.regionCoverage.expectedAdministrativeDongCount ?? '—'}
          </strong>
          <small>현재 저장된 실제 캡처 기준 · 링크·파노라마·장소 일치와 별도</small>
        </article>
        <article className="needs-check">
          <span>장소·입구 일치 / 접근성</span>
          <strong>
            {summary.regionCoverage.placeMatchVerifiedAdministrativeDongCount ?? 0}/
            {summary.regionCoverage.accessibilityVerifiedAdministrativeDongCount ?? 0}
          </strong>
          <small>사람 확인 전에는 후보·미확인으로 유지</small>
        </article>
      </section>

      <section className="daejeon-place-map__audit-strip" aria-label="로드뷰 검수 원장 상태">
        <article>
          <span>로드뷰 검수 대상</span>
          <strong>{summary.roadviewEligibleCount.toLocaleString()}</strong>
          <small>대전 범위 안 원천행 · 범위 밖 1행 제외</small>
        </article>
        <article>
          <span>처리된 원천행</span>
          <strong>{summary.roadviewCompletedCount.toLocaleString()}</strong>
          <small>파노라마 없음·사람 대기·완료 포함</small>
        </article>
        <article className="needs-check">
          <span>남은 미검수</span>
          <strong>{summary.roadviewRemainingCount.toLocaleString()}</strong>
          <small>아직 공개 확인을 실행하지 않은 행</small>
        </article>
        <article className="verified">
          <span>검증 완료</span>
          <strong>{summary.roadviewVerifiedCount.toLocaleString()}</strong>
          <small>장소·출입구·사람 증거가 모두 있어야 증가</small>
        </article>
        <div className="daejeon-place-map__status-list" aria-label="로드뷰 상태별 건수">
          {ROADVIEW_AUDIT_STATUSES.map((status) => {
            const meta = ROADVIEW_AUDIT_STATUS_META[status];
            return (
              <button
                type="button"
                key={status}
                className={roadviewStatus === status ? 'active' : ''}
                onClick={() => setRoadviewStatus((current) => (current === status ? ALL_FILTER : status))}
                data-roadview-status-filter={status}
              >
                <i style={{ backgroundColor: meta.color }} />
                <span>{meta.label}</span>
                <strong>{summary.roadviewStatusCounts[status].toLocaleString()}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="daejeon-place-map__human-ledger-strip"
        aria-label="후보별 사람 검수 기록 집계"
        data-testid="daejeon-review-ledger-summary"
      >
        <header>
          <div>
            <span>태윤 연구 기록 · 이 브라우저에만 저장</span>
            <strong>사람 검수 원장</strong>
            <small>
              로드뷰 연결이나 AI 결과로 자동 증가하지 않습니다. 후보를 직접 보고 폼에서 저장한 기록만 셉니다.
            </small>
          </div>
          <div className="daejeon-place-map__ledger-actions">
            <button type="button" onClick={downloadReviewLedger} data-testid="daejeon-review-ledger-export">
              검수 원장 JSON 내보내기
            </button>
            <label>
              검수 원장 JSON 가져오기
              <input
                type="file"
                accept="application/json,.json"
                onChange={importReviewLedger}
                data-testid="daejeon-review-ledger-import"
              />
            </label>
          </div>
        </header>
        <div className="daejeon-place-map__ledger-counts">
          <article><span>저장한 후보</span><strong>{reviewLedgerSummary.savedCandidateCount}</strong><small>/ {summary.roadviewEligibleCount}</small></article>
          <article><span>장소 판단 기록</span><strong>{reviewLedgerSummary.placeMatchObservedCount}</strong><small>관찰 · 검증 아님</small></article>
          <article><span>접근성 관찰 기록</span><strong>{reviewLedgerSummary.accessibilityObservedCount}</strong><small>화면 관찰</small></article>
          <article><span>태윤 직접 검수 기록</span><strong>{reviewLedgerSummary.studentReviewedCount}</strong><small>자기기입</small></article>
          <article><span>독립 검수 기록</span><strong>{reviewLedgerSummary.independentReviewedCount}</strong><small>신원 인증 아님</small></article>
          <article><span>현장 방문 기록</span><strong>{reviewLedgerSummary.fieldVisitedCount}</strong><small>필요 {reviewLedgerSummary.fieldVisitNeededCount}</small></article>
        </div>
        {reviewLedgerState.notice ? (
          <p className={`daejeon-place-map__ledger-notice ${reviewLedgerState.noticeTone}`} aria-live="polite">
            {reviewLedgerState.notice}
          </p>
        ) : null}
      </section>

      <p className="daejeon-place-map__boundary-note">
        중요한 구분: 로드뷰 버튼이 있다는 것은 ‘그 좌표 주변 화면을 요청할 수 있다’는 뜻입니다.
        실제 로드뷰 존재 여부, 촬영 방향, 출입구 일치, 휠체어 통행 가능 여부는 사람이 별도로 확인해야 합니다.
        {' '}행별 데이터 기준일도 {summary.oldestBasisDate}~{summary.newestBasisDate}로 섞여 있어 현재 상태를 다시 확인해야 합니다.
      </p>

      <section className="daejeon-place-map__filters" aria-label="장소 후보 검색과 필터">
        <label>
          <span>장소 찾기</span>
          <input
            type="search"
            value={query}
            placeholder="예: 동광공원, 둔산, 충전기"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>종류</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value={ALL_FILTER}>전체 {summary.sourceRowCount.toLocaleString()}개</option>
            {categoryOptions.map(([key, count]) => (
              <option value={key} key={key}>
                {CATEGORY_META[key]?.label ?? key} {count.toLocaleString()}개
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>자치구</span>
          <select value={district} onChange={(event) => {
            setDistrict(event.target.value);
            setAdministrativeDongCode(ALL_FILTER);
          }}>
            <option value={ALL_FILTER}>대전 전체</option>
            {DAEJEON_DISTRICTS.map((districtName) => (
              <option value={districtName} key={districtName}>
                {districtName} {(summary.districtCounts[districtName] ?? 0).toLocaleString()}개
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>행정동 관계</span>
          <select
            value={administrativeDongCode}
            onChange={(event) => setAdministrativeDongCode(event.target.value)}
            data-testid="daejeon-administrative-dong-filter"
          >
            <option value={ALL_FILTER}>행정동 전체 {administrativeDongOptions.length}개</option>
            {administrativeDongOptions.map((dong) => (
              <option value={dong.code} key={dong.code}>
                {dong.district} {dong.name} · 관계 {dong.candidateCount} / 단일 {dong.exactCandidateCount}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>로드뷰 상태</span>
          <select value={roadviewStatus} onChange={(event) => setRoadviewStatus(event.target.value)}>
            <option value={ALL_FILTER}>상태 전체 {summary.roadviewEligibleCount.toLocaleString()}개</option>
            {ROADVIEW_AUDIT_STATUSES.map((status) => (
              <option value={status} key={status}>
                {ROADVIEW_AUDIT_STATUS_META[status].label} {summary.roadviewStatusCounts[status].toLocaleString()}개
              </option>
            ))}
          </select>
        </label>
        <div className="daejeon-place-map__filter-result" role="status">
          <span>현재 조건</span>
          <strong>{plottedCandidates.length.toLocaleString()}개 좌표</strong>
          <small>
            {selectedAdministrativeDong
              ? `${selectedAdministrativeDong.district} ${selectedAdministrativeDong.name} · 단일 ${selectedAdministrativeDong.exactCandidateCount} · 다중관할 ${selectedAdministrativeDong.ambiguousCandidateCount}`
              : `지도 제외 ${Math.max(visibleCandidates.length - plottedCandidates.length, 0).toLocaleString()}개`}
          </small>
        </div>
      </section>

      <div className="daejeon-place-map__workspace">
        <div className="daejeon-place-map__canvas-column">
          <div className="daejeon-place-map__plot-label">
            <strong>오프라인 WGS84 좌표도</strong>
            <small>실제 행정경계·도로선이 아닌 상대 위치 지도</small>
          </div>
          <svg
            className="daejeon-place-map__canvas"
            viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
            role="img"
            aria-label={`대전 장소 후보 ${plottedCandidates.length}개 실제 좌표 분포`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="daejeon-plot-background" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#eaf2ff" />
                <stop offset="52%" stopColor="#f2f7f4" />
                <stop offset="100%" stopColor="#fff8e9" />
              </linearGradient>
              <filter id="daejeon-point-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#14223a" floodOpacity="0.26" />
              </filter>
            </defs>
            <rect width={PLOT_WIDTH} height={PLOT_HEIGHT} rx="26" fill="url(#daejeon-plot-background)" />
            <g className="daejeon-place-map__coordinate-grid" aria-hidden="true">
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                <line key={`vertical-${ratio}`} x1={PLOT_WIDTH * ratio} y1="0" x2={PLOT_WIDTH * ratio} y2={PLOT_HEIGHT} />
              ))}
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                <line key={`horizontal-${ratio}`} x1="0" y1={PLOT_HEIGHT * ratio} x2={PLOT_WIDTH} y2={PLOT_HEIGHT * ratio} />
              ))}
            </g>
            <g className="daejeon-place-map__axis-labels" aria-hidden="true">
              <text x="24" y="38">북 · {DAEJEON_PLACE_PLOT_BOUNDS.maxLat.toFixed(2)}°N</text>
              <text x="24" y={PLOT_HEIGHT - 22}>남 · {DAEJEON_PLACE_PLOT_BOUNDS.minLat.toFixed(2)}°N</text>
              <text x={PLOT_WIDTH - 24} y="38" textAnchor="end">동 · {DAEJEON_PLACE_PLOT_BOUNDS.maxLng.toFixed(2)}°E</text>
              <text x={PLOT_WIDTH - 24} y={PLOT_HEIGHT - 22} textAnchor="end">서 · {DAEJEON_PLACE_PLOT_BOUNDS.minLng.toFixed(2)}°E</text>
            </g>
            <g className="daejeon-place-map__candidate-points">
              {plottedCandidates.map((candidate) => {
                const meta = categoryMeta(candidate);
                const statusMeta = roadviewStatusMeta(candidate);
                const isSelected = candidate.id === selectedCandidate?.id;
                const x = (candidate.plotX / 100) * PLOT_WIDTH;
                const y = (candidate.plotY / 100) * PLOT_HEIGHT;
                return (
                  <circle
                    key={candidate.id}
                    className={isSelected ? 'selected' : ''}
                    data-candidate-marker="true"
                    data-candidate-id={candidate.id}
                    data-category={candidate.category}
                    data-roadview-status={candidate.roadviewStatus}
                    cx={x}
                    cy={y}
                    r={isSelected ? 9 : 5.5}
                    fill={statusMeta.color}
                    onClick={() => focusCandidate(candidate)}
                  >
                    <title>{meta.label} · {candidate.name} · {statusMeta.label} · {getCoordinateLabel(candidate)}</title>
                  </circle>
                );
              })}
            </g>
            {selectedProjectedCandidate ? (
              <g className="daejeon-place-map__selected-crosshair" aria-hidden="true">
                <line
                  x1={(selectedProjectedCandidate.plotX / 100) * PLOT_WIDTH}
                  y1="52"
                  x2={(selectedProjectedCandidate.plotX / 100) * PLOT_WIDTH}
                  y2={PLOT_HEIGHT - 52}
                />
                <line
                  x1="52"
                  y1={(selectedProjectedCandidate.plotY / 100) * PLOT_HEIGHT}
                  x2={PLOT_WIDTH - 52}
                  y2={(selectedProjectedCandidate.plotY / 100) * PLOT_HEIGHT}
                />
              </g>
            ) : null}
          </svg>
          <div className="daejeon-place-map__legend" aria-label="지도 점 색상">
            {Object.entries(CATEGORY_META).filter(([key]) => summary.categoryCounts[key]).map(([key, meta]) => (
              <span key={key}><i style={{ backgroundColor: meta.color }} />{meta.label}</span>
            ))}
            <small>위·경도를 고정 범위에 투영 · 필터를 바꿔도 점 위치 유지</small>
          </div>
        </div>

        <aside className="daejeon-place-map__list" aria-label="조건에 맞는 장소 후보 목록">
          <header>
            <div>
              <span>후보 목록</span>
              <strong>{visibleCandidates.length.toLocaleString()}개</strong>
            </div>
            <small>
              {visibleCandidates.length > LIST_LIMIT
                ? `빠른 표시를 위해 앞 ${LIST_LIMIT}개 · 검색하면 좁혀집니다`
                : '현재 조건 전체'}
            </small>
          </header>
          <div className="daejeon-place-map__list-scroll">
            {visibleCandidates.slice(0, LIST_LIMIT).map((candidate) => {
              const meta = categoryMeta(candidate);
              const statusMeta = roadviewStatusMeta(candidate);
              return (
                <button
                  type="button"
                  className={candidate.id === selectedCandidate?.id ? 'selected' : ''}
                  key={candidate.id}
                  aria-pressed={candidate.id === selectedCandidate?.id}
                  onClick={() => focusCandidate(candidate)}
                  data-review-revision={reviewLedgerState.ledger.entries[candidate.id]?.revision ?? 0}
                >
                  <i style={{ backgroundColor: meta.color }} />
                  <span>
                    <small>{meta.label} · {candidate.district || '자치구 확인 필요'}</small>
                    <strong>{candidate.name}</strong>
                    <em>{candidate.address || '주소 확인 필요'}</em>
                    {reviewLedgerState.ledger.entries[candidate.id] ? (
                      <small className="daejeon-place-map__list-review-chip">
                        사람 검수 원장 r{reviewLedgerState.ledger.entries[candidate.id].revision}
                      </small>
                    ) : null}
                  </span>
                  <b
                    className="daejeon-place-map__status-badge"
                    style={{ '--status-color': statusMeta.color }}
                    title={statusMeta.description}
                    data-roadview-status={candidate.roadviewStatus}
                  >
                    {statusMeta.shortLabel}
                  </b>
                </button>
              );
            })}
            {visibleCandidates.length === 0 ? (
              <p className="daejeon-place-map__empty">조건에 맞는 장소가 없습니다. 검색어나 필터를 바꿔 보세요.</p>
            ) : null}
          </div>
        </aside>
      </div>

      <section className="daejeon-place-map__selected" aria-label="선택한 장소와 로드뷰 확인">
        {selectedCandidate ? (
          <>
            <div className="daejeon-place-map__selected-heading">
              <span style={{ '--candidate-color': categoryMeta(selectedCandidate).color }}>
                {categoryMeta(selectedCandidate).label} · {selectedCandidate.district || '자치구 확인 필요'}
              </span>
              <h3>{selectedCandidate.name}</h3>
              <p>{selectedCandidate.address || '주소 확인 필요'}</p>
            </div>
            <dl>
              <div>
                <dt>공식 자료 기준일</dt>
                <dd>{displayDate(selectedCandidate)}</dd>
              </div>
              <div>
                <dt>원천 레코드</dt>
                <dd>{selectedCandidate.sourceRecordId}</dd>
              </div>
              <div>
                <dt>좌표</dt>
                <dd>{coordinateLabel(selectedCandidate)}</dd>
              </div>
              <div>
                <dt>현재 증거 단계</dt>
                <dd>{roadviewStatusMeta(selectedCandidate).label}</dd>
              </div>
              <div>
                <dt>행정동 관계</dt>
                <dd>
                  {selectedCandidate.administrativeDongMatches?.length > 0
                    ? selectedCandidate.administrativeDongMatches.map((dong) => dong.name).join(', ')
                    : '주소로 확인하지 못함'}
                </dd>
              </div>
              <div>
                <dt>좌표 중복 관계</dt>
                <dd>{selectedCandidate.coordinateDuplicateCount > 1
                  ? `같은 좌표 원천행 ${selectedCandidate.coordinateDuplicateCount}개 공유`
                  : '고유 좌표 원천행'}</dd>
              </div>
            </dl>
            <div
              className="daejeon-place-map__roadview-card"
              data-roadview-inline-state={selectedRoadviewImage ? 'stored_image' : 'live_sdk_or_unavailable'}
              data-roadview-static-fallback={selectedRoadviewImage ? 'stored_image' : 'image_unavailable'}
            >
              <div>
                <span>다음 확인</span>
                <strong>{roadviewStatusMeta(selectedCandidate).label}</strong>
                <p>{roadviewStatusMeta(selectedCandidate).description}</p>
                <KakaoRoadviewViewer
                  candidate={selectedCandidate}
                  review={selectedReviewEntry?.review ?? null}
                  storedImage={selectedRoadviewImage}
                  onExpandStoredImage={selectedRoadviewImage
                    ? () => setRoadviewLightboxOpen(true)
                    : null}
                />
                {selectedCandidate.roadviewAudit ? (
                  <div className="daejeon-place-map__audit-readback" data-audit-readback="true">
                    <span>원장 readback</span>
                    <p>pano ID: {auditValue(selectedCandidate.roadviewAudit.panoId)}</p>
                    <p>촬영시점: {captureTimeLabel(selectedCandidate.roadviewAudit)}</p>
                    <p>파노라마 좌표: {selectedCandidate.roadviewAudit.panoLat !== null && selectedCandidate.roadviewAudit.panoLng !== null
                      ? `${selectedCandidate.roadviewAudit.panoLat}, ${selectedCandidate.roadviewAudit.panoLng}`
                      : '미확인'}</p>
                    <p>후보와 거리: {selectedCandidate.roadviewAudit.distanceMeters === null
                      ? '미확인'
                      : `${selectedCandidate.roadviewAudit.distanceMeters}m`}</p>
                    <p>장소·출입구 일치: {selectedCandidate.roadviewAudit.placeMatch?.verified ? '확인' : '사람 확인 대기'}</p>
                    <p>사람 확인 사유: {selectedCandidate.roadviewAudit.humanReview?.reasons?.join(', ') || '없음'}</p>
                    <p>이미지 유형: {selectedRoadviewCapture?.imageKind === 'full_kakao_ui_capture' ? '전체 Kakao UI 캡처' : auditValue(selectedRoadviewCapture?.imageKind)}</p>
                    <p>이미지 출처: {auditValue(selectedRoadviewCapture?.imageSource)}</p>
                    <p>이미지 SHA-256: {auditValue(selectedCandidate.roadviewAudit.capture?.imageSha256)}</p>
                  </div>
                ) : (
                  <p>좌표 주변의 가장 가까운 로드뷰가 열릴 수 있어, 실제 장소와 같은지 먼저 확인해야 합니다.</p>
                )}
              </div>
              {selectedLinks ? (
                <div className="daejeon-place-map__actions">
                  <a href={selectedLinks.kakaoMap} target="_blank" rel="noreferrer">카카오맵 위치 보기 · 보조</a>
                  <a className="primary" href={selectedLinks.kakaoRoadview} target="_blank" rel="noreferrer">
                    카카오 로드뷰 열기 · 보조
                  </a>
                </div>
              ) : (
                <p className="daejeon-place-map__no-coordinate">
                  {selectedCandidate.coordinateStatus === 'out_of_bounds'
                    ? '공식 원천 좌표가 대전 경계 밖으로 보여 지도·로드뷰 링크에서 제외했습니다.'
                    : '좌표가 없어 지도·로드뷰 링크를 만들지 않았습니다.'}
                </p>
              )}
            </div>
            <CandidateReviewLedgerForm
              key={`${selectedCandidate.id}:${selectedReviewEntry?.revision ?? 0}`}
              candidate={selectedCandidate}
              savedEntry={selectedReviewEntry}
              onSave={saveSelectedCandidateReview}
            />
          </>
        ) : (
          <p className="daejeon-place-map__empty">표시할 후보 원자료를 불러오지 못했습니다.</p>
        )}
      </section>

      {roadviewLightboxOpen && selectedRoadviewImage ? (
        <div
          className="daejeon-place-map__roadview-lightbox"
          onClick={(event) => {
            if (event.target === event.currentTarget) setRoadviewLightboxOpen(false);
          }}
        >
          <section
            className="daejeon-place-map__roadview-lightbox-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedCandidate.name} 로드뷰 크게 보기`}
          >
            <header>
              <div>
                <span>카카오 로드뷰 캡처 크게 보기</span>
                <h3>{selectedCandidate.name}</h3>
              </div>
              <button type="button" autoFocus onClick={() => setRoadviewLightboxOpen(false)}>
                닫기
              </button>
            </header>
            <div className="daejeon-place-map__roadview-lightbox-stage" data-roadview-overlay="none">
              <img src={selectedRoadviewImage} alt={`${selectedCandidate.name} 검수용 카카오 로드뷰 캡처 확대`} />
            </div>
            <footer>
              출처 {selectedRoadviewCapture?.imageKind === 'full_kakao_ui_capture' ? '전체 Kakao UI 캡처' : auditValue(selectedRoadviewCapture?.imageSource)} ·
              {' '}pano ID {auditValue(selectedCandidate.roadviewAudit?.panoId)} · 촬영시점 {captureTimeLabel(selectedCandidate.roadviewAudit)} ·
              {' '}이미지 SHA-256 {auditValue(selectedRoadviewCapture?.imageSha256)}
            </footer>
          </section>
        </div>
      ) : null}

      <footer className="daejeon-place-map__footer">
        <p>
          좌표도는 공식 WGS84 값을 고정 범위에 투영한 오프라인 지도이며 실제 행정경계·도로선을 뜻하지 않습니다.
          화면 안 로드뷰는 카카오 지도 Web JavaScript SDK로 반경 50m의 가장 가까운 촬영점을 요청하며,
          점은 시설 대표 좌표이지 출입구 좌표라고 단정하지 않습니다. 외부 링크는 원본 대조용 보조 수단입니다.
        </p>
      </footer>
    </section>
  );
}
