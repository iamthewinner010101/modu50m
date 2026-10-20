import { lazy, Suspense, useMemo, useState } from 'react';
import CandidateMap from './components/CandidateMap';
import CitizenReviewWorkbench from './components/CitizenReviewWorkbench';
import CustomerReviewFlow from './components/CustomerReviewFlow';
import DunsanCandidatePool from './components/DunsanCandidatePool';
import AccountAccessPanel from './components/AccountAccessPanel';
import CandidatePanel from './components/CandidatePanel';
import DirectorReviewQueue from './components/DirectorReviewQueue';
import DaejeonDongCoverageMap from './components/DaejeonDongCoverageMap';
import DaejeonPlaceCandidateMap from './components/DaejeonPlaceCandidateMap';
import DaejeonReviewExperience from './components/DaejeonReviewExperience';
import EntranceReviewWorkspace from './components/EntranceReviewWorkspace';
const CityExplorer = lazy(() => import('./components/CityExplorer'));
const HanbitPrecinct = lazy(() => import('./components/DaejeonPrecinctExplorer'));
import EvidenceComparePanel from './components/EvidenceComparePanel';
import EvidencePanel from './components/EvidencePanel';
import HumanReviewFlow from './components/HumanReviewFlow';
import JudgeModePanel from './components/JudgeModePanel';
import ReportPanel from './components/ReportPanel';
import ReviewPanel from './components/ReviewPanel';
import rawCandidates from './data/candidates.json';
import daejeonCoverageData from './data/daejeonAdministrativeDongs.generated.json';
import daejeonLegalCoverageData from './data/daejeonLegalDongs.generated.json';
import daejeonPlaceCandidates from './data/daejeonPlaceCandidates.generated.json';
import daejeonCandidateRegionBridge from './data/daejeonCandidateRegionBridge.generated.json';
import daejeonPlaceCandidateSources from './data/daejeonPlaceCandidateSources.json';
import daejeonRoadviewAudit from './data/daejeonRoadviewAudit.generated.json';
import dunsanCandidatePool from './data/dunsanCandidatePool.json';
import dunsanSixReview from './data/dunsanSixReview20260724.json';
import astraRoadviewImageSelections from './data/astraRoadviewImageSelections';
import { JUDGE_TOUR_CASES } from './data/judgeTourCases';
import locationVerification from './data/locationVerification.generated.json';
import { generateReport, getReviewStatus, getStatusLabel } from './utils/report';
import { buildFeedbackLearningState, buildHumanReviewTriage } from './utils/reviewTriage';
import { getCandidateEvidenceVersion } from './utils/evidence';
import { useHumanCompletionStore } from './utils/useHumanCompletionStore';
import { useReviewStore } from './utils/useReviewStore';
import './App.css';
import './TossRedesign.css';
import './HumanReviewFlow.css';

const candidates = rawCandidates.map((candidate) => ({
  ...candidate,
  locationVerification: locationVerification.candidates[candidate.id] ?? null,
  roadviewImageSelection: astraRoadviewImageSelections[candidate.id] ?? null,
}));

const daejeonEvidenceSnapshot = daejeonCoverageData.evidenceSnapshot ?? {};
const daejeonEvidenceCounts = {
  sourceFrame: {
    count: Array.isArray(daejeonCoverageData.dongs) ? daejeonCoverageData.dongs.length : 0,
    total: daejeonCoverageData.expectedCount ?? 82,
    note: '공식 행정동 이름·코드 목록',
  },
  candidate: {
    count: daejeonEvidenceSnapshot.dunsanCandidatePoolCount
      ?? (Array.isArray(dunsanCandidatePool) ? dunsanCandidatePool.length : 0),
    note: '둔산 파일럿 후보 · 82개 동 연결 전',
  },
  photoObservation: {
    count: daejeonEvidenceSnapshot.savedPhotoObservationCount
      ?? (Number.isFinite(dunsanSixReview.reviewCount) ? dunsanSixReview.reviewCount : 0),
    note: `저장된 사진 관찰 · 관찰 지점 ${daejeonEvidenceSnapshot.savedObservationPointCount ?? dunsanSixReview.observationCount ?? 0}개 · 자격 검수 전`,
  },
  studentReview: {
    count: daejeonEvidenceSnapshot.taeyunQualifiedReviewCount ?? 0,
    note: '태윤 직접 검수 증거 없음',
  },
  independentReview: {
    count: daejeonEvidenceSnapshot.independentReviewCount ?? 0,
    note: '독립 재검수 증거 없음',
  },
  fieldConfirmation: {
    count: daejeonEvidenceSnapshot.fieldConfirmedCount ?? 0,
    note: `현장 확인 완료 증거 없음 · 추가 확인 요청 ${dunsanSixReview.fieldFollowupCount ?? 0}건`,
  },
};

const DEFAULT_SELECTED_ID = candidates[0]?.id ?? '';
const DEFAULT_REVIEW_SELECTED_ID = candidates.some((candidate) => candidate.id === 'L50-002')
  ? 'L50-002'
  : DEFAULT_SELECTED_ID;

const CITIZEN_REVIEW_IDS = ['L50-002', 'L50-003', 'L50-004', 'L50-005', 'L50-006', 'L50-007'];
const citizenReviewCandidates = CITIZEN_REVIEW_IDS
  .map((candidateId) => candidates.find((candidate) => candidate.id === candidateId))
  .filter(Boolean);
const CITIZEN_REVIEW_STORAGE_KEY = 'modu50m-citizen-one-frame-reviews-v1';

function loadCitizenReviews() {
  if (typeof window === 'undefined') return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(CITIZEN_REVIEW_STORAGE_KEY) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

const JUDGE_STEPS = [
  {
    key: 'judge',
    number: '01',
    label: '심사 시작',
    title: '마지막 50m, 사람이 확인합니다',
    description: '규칙이 후보 순서를 정하고, 비전 AI가 사진 신호 초안을 만듭니다.',
  },
  {
    key: 'ai',
    number: '02',
    label: '규칙·AI 미션',
    title: '규칙과 AI가 먼저 정리했어요',
    description: '확인이 필요한 후보부터 보여드리되, 점수를 정답처럼 사용하지 않습니다.',
  },
  {
    key: 'map',
    number: '03',
    label: '카카오 위치',
    title: '카카오에서 이 지점을 확인하세요',
    description: '좌표, 주변 건물, 로드뷰 방향을 차례로 맞춰 봅니다.',
  },
  {
    key: 'review',
    number: '04',
    label: '사람 검수',
    title: '사람이 최종 판단합니다',
    description: '사진과 지도를 보고 통과, 현장 확인, 제외 중 한 상태를 선택합니다.',
  },
  {
    key: 'proof',
    number: '05',
    label: '근거 비교',
    title: 'AI와 사람의 판단을 비교해요',
    description: '같은 근거를 보고 어디에서 판단이 달라졌는지 확인합니다.',
  },
  {
    key: 'report',
    number: '06',
    label: '분석 보고서',
    title: '검수 결과를 한눈에 봅니다',
    description: '저장한 사람 판정만 보고서 수치에 반영됩니다.',
  },
  {
    key: 'evidence',
    number: '07',
    label: '제출 자료',
    title: '제출 전 마지막으로 확인하세요',
    description: '빠진 사람 증거를 채워야 제출 자료를 만들 수 있습니다.',
  },
];

const VALID_TABS = new Set(JUDGE_STEPS.map((step) => step.key));

function getInitialTab() {
  if (typeof window === 'undefined') return 'judge';
  const hashTab = window.location.hash.replace('#', '');
  return VALID_TABS.has(hashTab) ? hashTab : 'judge';
}

function getInitialViewMode() {
  if (typeof window === 'undefined') return 'customer';
  const requestedMode = new URLSearchParams(window.location.search).get('mode');
  if (
    requestedMode === 'judge'
    || requestedMode === 'candidates'
    || requestedMode === 'review'
    || requestedMode === 'daejeon'
    || requestedMode === 'daejeon-review'
    || requestedMode === 'entrance-review'
    || requestedMode === 'city-explorer'
    || requestedMode === 'hanbit'
    || requestedMode === 'classic'
  ) {
    return requestedMode;
  }
  return 'customer';
}

function openViewMode(nextMode) {
  if (typeof window === 'undefined') return;
  const nextUrl = new URL(window.location.href);
  if (nextMode === 'judge') {
    nextUrl.searchParams.set('mode', 'judge');
    nextUrl.hash = 'judge';
  } else if (nextMode === 'candidates') {
    nextUrl.searchParams.set('mode', 'candidates');
    nextUrl.hash = '';
  } else if (nextMode === 'review') {
    nextUrl.searchParams.set('mode', 'review');
    nextUrl.hash = '';
  } else if (nextMode === 'daejeon') {
    nextUrl.searchParams.set('mode', 'daejeon');
    nextUrl.hash = '';
  } else if (nextMode === 'daejeon-review') {
    nextUrl.searchParams.set('mode', 'daejeon-review');
    nextUrl.hash = '';
  } else if (nextMode === 'entrance-review') {
    nextUrl.searchParams.set('mode', 'entrance-review');
    nextUrl.hash = '';
  } else if (nextMode === 'city-explorer') {
    nextUrl.searchParams.set('mode', 'city-explorer');
    nextUrl.hash = '';
  } else if (nextMode === 'classic') {
    nextUrl.searchParams.set('mode', 'classic');
    nextUrl.hash = '';
  } else {
    nextUrl.searchParams.delete('mode');
    nextUrl.hash = '';
  }
  window.location.assign(nextUrl.toString());
}

function ReviewApp({ viewMode }) {
  const [selectedId, setSelectedId] = useState(
    viewMode === 'review' || viewMode === 'customer' || viewMode === 'classic'
      ? DEFAULT_REVIEW_SELECTED_ID
      : DEFAULT_SELECTED_ID,
  );
  const [citizenReviews, setCitizenReviews] = useState(loadCitizenReviews);
  const [reviews, setReview, resetReviews, reviewSync, reviewTeam, reviewAccount, reviewAudit, reviewLearning] =
    useReviewStore('last50m-reviews-v1');
  const [humanCompletion, humanCompletionActions] = useHumanCompletionStore(
    'modu50m-human-completion-evidence-v1',
  );
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [roadviewVisionRuns, setRoadviewVisionRuns] = useState({});

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0],
    [selectedId],
  );
  const citizenCandidateIndex = Math.max(
    0,
    citizenReviewCandidates.findIndex((candidate) => candidate.id === selectedCandidate?.id),
  );
  const citizenCandidate = citizenReviewCandidates[citizenCandidateIndex]
    ?? citizenReviewCandidates[0]
    ?? selectedCandidate;
  const report = useMemo(() => generateReport(candidates, reviews), [reviews]);
  const feedbackRuleStates = useMemo(
    () => Object.fromEntries(
      (reviewLearning.feedbackLearning?.rules ?? []).map((rule) => [rule.reasonCode, rule]),
    ),
    [reviewLearning.feedbackLearning],
  );
  const reviewTriage = useMemo(
    () => buildHumanReviewTriage(candidates, reviews, { ruleStates: feedbackRuleStates }),
    [reviews, feedbackRuleStates],
  );
  const feedbackLearning = useMemo(
    () => buildFeedbackLearningState(candidates, reviews, { ruleStates: feedbackRuleStates }),
    [reviews, feedbackRuleStates],
  );
  const activeStep = JUDGE_STEPS.find((step) => step.key === activeTab) ?? JUDGE_STEPS[0];
  const currentReview = reviews[selectedCandidate?.id];
  const nextReviewCandidate = reviewTriage.humanReviewRequired[0]?.candidate ?? candidates[0];
  const showMap = ['ai', 'map', 'review'].includes(activeTab);
  const judgeTourIndex = JUDGE_TOUR_CASES.findIndex(({ candidateId }) => candidateId === selectedCandidate?.id);
  const judgeTour = judgeTourIndex >= 0
    ? {
        cases: JUDGE_TOUR_CASES,
        currentIndex: judgeTourIndex,
        onOpenCase: (candidateId) => handleOpenCandidateTab(candidateId, 'proof'),
        onReturn: () => openTab('judge'),
      }
    : null;
  const readinessLabel = report.reviewedCount >= report.total
    ? '앱 검수 12/12 기록 있음'
    : 'PENDING_STUDENT_EVIDENCE';
  const assignedToMeCount = Object.values(reviewTeam.assignments ?? {}).filter(
    (assignment) =>
      assignment.assigneeActorId === reviewTeam.actor?.id && assignment.status === 'assigned',
  ).length;
  const teamAssignmentCount = Object.keys(reviewTeam.assignments ?? {}).length;
  const completedAssignmentCount = Object.values(reviewTeam.assignments ?? {}).filter(
    (assignment) => assignment.status === 'completed',
  ).length;

  function openTab(nextTab) {
    if (!VALID_TABS.has(nextTab)) return;
    setActiveTab(nextTab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${nextTab}`);
    }
  }

  function handleReviewCandidate(candidateId) {
    setSelectedId(candidateId);
    openTab('review');
  }

  function handleOpenCandidateTab(candidateId, nextTab) {
    setSelectedId(candidateId);
    openTab(nextTab);
  }

  function handleReviewChange(candidateId, patch) {
    const candidate = candidates.find((item) => item.id === candidateId);
    return setReview(candidateId, {
      ...patch,
      evidenceVersion: getCandidateEvidenceVersion(candidate),
    });
  }

  async function handleAnalyzeRoadview(candidateId, directionKey) {
    setRoadviewVisionRuns((current) => ({
      ...current,
      [candidateId]: { status: 'loading', result: null, error: '', code: '' },
    }));
    try {
      const response = await reviewTeam.analyzeRoadview(candidateId, directionKey);
      setRoadviewVisionRuns((current) => ({
        ...current,
        [candidateId]: {
          status: 'loaded',
          result: response.analysis,
          error: '',
          code: '',
        },
      }));
      return true;
    } catch (error) {
      setRoadviewVisionRuns((current) => ({
        ...current,
        [candidateId]: {
          status: 'error',
          result: null,
          error: error.message || '온라인 비전 분석을 실행하지 못했습니다.',
          code: error.code || 'ONLINE_VISION_UNAVAILABLE',
        },
      }));
      return false;
    }
  }

  function handleSaveCitizenReview(payload) {
    setCitizenReviews((current) => {
      const next = {
        ...current,
        [payload.candidateId]: payload,
      };
      window.localStorage.setItem(CITIZEN_REVIEW_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleNextCitizenCandidate() {
    if (!citizenReviewCandidates.length) return;
    const nextIndex = (citizenCandidateIndex + 1) % citizenReviewCandidates.length;
    setSelectedId(citizenReviewCandidates[nextIndex].id);
  }

  if (reviewAccount.authMode === 'account' && reviewAccount.status !== 'authenticated') {
    return <AccountAccessPanel account={reviewAccount} />;
  }

  if (viewMode === 'entrance-review') {
    const returnToCity = new URLSearchParams(window.location.search).get('returnMode') === 'city-explorer';
    return <EntranceReviewWorkspace request={reviewTeam.requestEntranceApi} sync={reviewSync}
      actor={reviewTeam.actor} initialEntranceId={new URLSearchParams(window.location.search).get('entrance')}
      backLabel={returnToCity ? '3D 도시로 돌아가기' : '대전 전체 후보'}
      onBack={() => openViewMode(returnToCity ? 'city-explorer' : 'daejeon-review')} />;
  }

  if (viewMode === 'city-explorer') {
    return <Suspense fallback={<p role="status">대전 미니어처를 준비하고 있어요…</p>}>
      <CityExplorer request={reviewTeam.requestEntranceApi} sync={reviewSync} actor={reviewTeam.actor} />
    </Suspense>;
  }

  if (viewMode === 'customer') {
    return (
      <CitizenReviewWorkbench
        key={citizenCandidate?.id}
        candidate={citizenCandidate}
        candidateIndex={citizenCandidateIndex}
        candidateCount={citizenReviewCandidates.length}
        review={citizenReviews[citizenCandidate?.id]}
        roadviewVisionRun={roadviewVisionRuns[citizenCandidate?.id] ?? null}
        onAnalyzeRoadview={handleAnalyzeRoadview}
        onOpenCoverage={() => openViewMode('daejeon-review')}
        onSave={handleSaveCitizenReview}
        onNext={handleNextCitizenCandidate}
      />
    );
  }

  if (viewMode === 'classic') {
    return (
      <CustomerReviewFlow
        candidates={candidates}
        selectedId={selectedCandidate?.id}
        reviews={reviews}
        onSelectCandidate={setSelectedId}
        onChangeReview={handleReviewChange}
        onOpenJudgeMode={() => openViewMode('judge')}
        onOpenCandidatePool={() => openViewMode('candidates')}
        onOpenDaejeonCoverage={() => openViewMode('daejeon')}
        reviewTeam={reviewTeam}
        reviewAudit={reviewAudit}
        roadviewVisionRun={roadviewVisionRuns[selectedCandidate.id] ?? null}
        onAnalyzeRoadview={handleAnalyzeRoadview}
      />
    );
  }

  if (viewMode === 'review') {
    return (
      <HumanReviewFlow
        key={selectedCandidate?.id}
        candidates={candidates}
        selectedId={selectedCandidate?.id}
        reviews={reviews}
        onSelectCandidate={setSelectedId}
        onChangeReview={handleReviewChange}
        reviewSync={reviewSync}
        roadviewVisionRun={roadviewVisionRuns[selectedCandidate.id] ?? null}
        onAnalyzeRoadview={handleAnalyzeRoadview}
      />
    );
  }

  return (
    <main
      className="app-shell judge-app-shell"
      data-selected-candidate-id={selectedCandidate?.id ?? ''}
      data-selected-candidate-name={selectedCandidate?.name ?? ''}
      data-human-review-count={reviewTriage.metrics.humanReviewRequiredCount}
      data-auto-verified-count={reviewTriage.metrics.autoVerifiedCount}
      data-blocked-data-count={reviewTriage.metrics.blockedDataCount}
      data-invalid-rejected-count={reviewTriage.metrics.invalidRejectedCount}
      data-human-feedback-count={feedbackLearning.metrics.humanFeedbackCount}
      data-automated-qa-feedback-count={feedbackLearning.metrics.automatedQaFeedbackCount}
      data-shadow-rule-count={feedbackLearning.metrics.shadowRuleCount}
      data-promoted-rule-count={feedbackLearning.metrics.promotedRuleCount}
      data-rolled-back-rule-count={feedbackLearning.metrics.rolledBackRuleCount}
      data-evidence-revalidation-count={reviewTriage.metrics.evidenceRevalidationCount ?? 0}
      data-promoted-rule-applied-count={reviewTriage.metrics.promotedRuleAppliedCount ?? 0}
      data-storage-mode={reviewSync.mode}
      data-storage-status={reviewSync.status}
      data-actor-id={reviewTeam.actor?.id ?? ''}
      data-actor-role={reviewTeam.actor?.role ?? ''}
      data-assigned-to-me-count={assignedToMeCount}
      data-team-assignment-count={teamAssignmentCount}
      data-completed-assignment-count={completedAssignmentCount}
      data-account-type={reviewTeam.actor?.accountType ?? 'demo'}
    >
      <header className="judge-topbar">
        <div className="judge-brand-block">
          <p className="project-kicker">2026 한국코드페어 심사 제출판</p>
          <div className="judge-title-row">
            <h1>모두의 50m</h1>
            <span>규칙 우선순위 + 비전 AI + 사람 검수</span>
          </div>
          <p>
            생활필수시설 앞 마지막 30~50m의 후보를 규칙으로 정렬하고 비전 AI가 사진 신호 초안을 만들며,
            사람이 지도와 로드뷰 근거를 확인해 접근성 데이터로 남깁니다.
          </p>
        </div>

        <div className="judge-topbar-status" aria-label="현재 심사 제출 준비 상태">
          <span className={report.reviewedCount >= report.total ? 'ready' : 'pending'}>{readinessLabel}</span>
          <strong>{report.reviewedCount}/{report.total}</strong>
          <small>태윤 직접 검수 기록</small>
          <p>AI는 정성 초안을 만들고, 최종 판단은 사람이 합니다.</p>
          <button type="button" className="customer-mode-link" onClick={() => openViewMode('review')}>
            12곳 쉬운 검수
          </button>
          <button type="button" className="customer-mode-link" onClick={() => openViewMode('daejeon')}>
            대전 82개 행정동 현황
          </button>
          <div
            className={`review-storage-state ${reviewSync.mode} ${reviewSync.status}`}
            role="status"
            aria-live="polite"
          >
            <span>{reviewSync.label}</span>
            <small>{reviewSync.tenantName || reviewSync.detail}</small>
            {reviewTeam.actor && (
              <small>
                {reviewTeam.actor.displayName} · {reviewTeam.actor.role} · 내 작업 {assignedToMeCount}개
              </small>
            )}
            {reviewTeam.actor?.accountType === 'password' && (
              <button type="button" className="account-logout-button" onClick={reviewAccount.logoutAccount}>
                로그아웃
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="judge-principle-strip" aria-label="작품 문제 방법 경계">
        <div>
          <span>문제</span>
          <strong>기존 지도에 부족한 마지막 50m 접근성 정보</strong>
        </div>
        <div>
          <span>방법</span>
          <strong>규칙 후보 정렬 → 비전 AI 초안 → 지도 확인 → 사람 라벨 저장</strong>
        </div>
        <div>
          <span>경계</span>
          <strong>길찾기 완성품이나 자동 안전 판정이 아닙니다</strong>
        </div>
      </section>

      <nav className="naver-nav judge-screen-nav" aria-label="심사위원 7단계 화면">
        {JUDGE_STEPS.map((step) => (
          <button
            type="button"
            key={step.key}
            className={`naver-nav-item judge-screen-tab ${activeTab === step.key ? 'active' : ''}`}
            onClick={() => openTab(step.key)}
            data-screen={step.key}
          >
            <span className="judge-screen-number">{step.number}</span>
            <span className="naver-nav-label">{step.label}</span>
          </button>
        ))}
      </nav>

      <section className="screen-stage-banner screen-stage-banner-top" data-active-screen={activeTab}>
        <span>{activeStep.number}</span>
        <div>
          <strong>{activeStep.title}</strong>
          <p>{activeStep.description}</p>
        </div>
      </section>

      <section className={`workspace-grid judge-workspace ${showMap ? '' : 'full-stage'}`} aria-label="이동장벽 후보 검수 작업 공간">
        {showMap ? (
          <div className="map-column">
            <CandidateMap
              candidates={candidates}
              reviews={reviews}
              selectedId={selectedCandidate?.id}
              onSelectCandidate={setSelectedId}
              showCandidateList={activeTab === 'ai'}
            />
          </div>
        ) : null}

        <aside className="inspector-column">
          {showMap ? (
            <div className="panel selected-candidate-header compact" data-candidate-id={selectedCandidate?.id ?? ''}>
            <div>
              <span className="panel-label">프로젝트 가설 후보</span>
              <h2>{selectedCandidate?.name ?? '후보를 선택해 주세요'}</h2>
              <p className="muted">{selectedCandidate?.locationVerification?.coordinateContext ?? selectedCandidate?.address ?? ''}</p>
            </div>
            {selectedCandidate ? (
              <div className="selected-candidate-statuses">
                <span className={`location-status-pill ${selectedCandidate.locationVerification?.status ?? 'place_match_required'}`}>
                  {selectedCandidate.locationVerification?.statusLabel ?? '시설명 확인 필요'}
                </span>
                <span className={`status-pill ${getReviewStatus(selectedCandidate, currentReview)}`}>
                  {getStatusLabel(getReviewStatus(selectedCandidate, currentReview))}
                </span>
              </div>
            ) : null}
            </div>
          ) : null}

          <div className="tab-content-area">
            {activeTab === 'judge' && (
              <JudgeModePanel
                candidates={candidates}
                report={report}
                reviewTriage={reviewTriage}
                onOpenTab={openTab}
                onReviewCandidate={handleReviewCandidate}
                onOpenCandidateTab={handleOpenCandidateTab}
              />
            )}
            {activeTab === 'ai' && (
              <CandidatePanel candidate={selectedCandidate} review={currentReview} mode="ai" />
            )}
            {activeTab === 'map' && (
              <CandidatePanel candidate={selectedCandidate} review={currentReview} mode="map" />
            )}
            {activeTab === 'review' && (
              <ReviewPanel
                key={selectedCandidate.id}
                candidate={selectedCandidate}
                candidates={candidates}
                review={currentReview}
                reviews={reviews}
                report={report}
                onChangeReview={handleReviewChange}
                onReviewCandidate={handleReviewCandidate}
                onOpenReport={() => openTab('report')}
                onOpenEvidence={() => openTab('evidence')}
                actor={reviewTeam.actor}
                onSubmitSecondReview={reviewTeam.submitSecondReview}
                onSubmitFieldVerification={reviewTeam.submitFieldVerification}
                roadviewVisionRun={roadviewVisionRuns[selectedCandidate.id] ?? null}
                onAnalyzeRoadview={handleAnalyzeRoadview}
              />
            )}
            {activeTab === 'proof' && (
              <EvidenceComparePanel
                candidate={selectedCandidate}
                review={currentReview}
                judgeTour={judgeTour}
                onOpenReview={() => openTab('review')}
                onOpenReport={() => openTab('report')}
                roadviewVisionResult={roadviewVisionRuns[selectedCandidate.id]?.result ?? null}
              />
            )}
            {activeTab === 'report' && (
              <ReportPanel
                report={report}
                feedbackLearning={feedbackLearning}
                reviewTriage={reviewTriage}
                learningAction={reviewLearning}
                canManageRules={reviewSync.mode === 'server' && reviewTeam.actor?.role === 'supervisor'}
                onPromoteRule={reviewLearning.promoteFeedbackRule}
                onRollbackRule={reviewLearning.rollbackFeedbackRule}
                nextCandidate={nextReviewCandidate}
                onReset={resetReviews}
                onReviewCandidate={handleReviewCandidate}
                onOpenEvidence={() => openTab('evidence')}
              />
            )}
            {activeTab === 'evidence' && (
              <EvidencePanel
                candidates={candidates}
                reviews={reviews}
                selectedId={selectedCandidate?.id}
                onSelectCandidate={setSelectedId}
                onReviewCandidate={handleReviewCandidate}
                audit={reviewAudit}
                humanCompletion={humanCompletion}
                humanCompletionActions={humanCompletionActions}
              />
            )}
          </div>
        </aside>
      </section>

      {activeTab === 'judge' ? (
        <div className="director-queue-below">
          <DirectorReviewQueue
            candidates={candidates}
            reviews={reviews}
            reviewTriage={reviewTriage}
            reviewTeam={reviewTeam}
            reviewAccount={reviewAccount}
            selectedId={selectedCandidate?.id}
            onSelectCandidate={setSelectedId}
            onReviewCandidate={handleReviewCandidate}
            onClaimCandidate={reviewTeam.claimCandidate}
            onReleaseCandidate={reviewTeam.releaseCandidate}
            onOpenEvidence={() => openTab('evidence')}
          />
        </div>
      ) : null}
    </main>
  );
}

export default function App() {
  const viewMode = getInitialViewMode();
  if (viewMode === 'hanbit') {
    return <Suspense fallback={<p role="status">한빛탑 미니어처를 준비하고 있어요…</p>}><HanbitPrecinct /></Suspense>;
  }
  if (viewMode === 'daejeon-review') {
    return (
      <DaejeonReviewExperience
        onBack={() => openViewMode('customer')}
        onOpenDetailedCoverage={() => openViewMode('daejeon')}
      />
    );
  }
  if (viewMode === 'daejeon') {
    return (
      <main className="daejeon-coverage-screen">
        <header className="daejeon-coverage-screen__topbar">
          <div>
            <p className="project-kicker">모두의 50m · 조사 현황</p>
            <h1>대전 82개 행정동 · 177개 법정동 · 실제 장소 후보 지도</h1>
            <p>지역 목록, 공식 장소 좌표, 로드뷰 확인, 사람 검수 증거를 섞지 않고 한 화면에서 확인합니다.</p>
          </div>
          <button type="button" className="customer-mode-link" onClick={() => openViewMode('daejeon-review')}>
            대전 확인 목록으로 돌아가기
          </button>
        </header>
        <DaejeonDongCoverageMap
          coverageData={daejeonCoverageData}
          legalCoverageData={daejeonLegalCoverageData}
          candidateSourceData={daejeonPlaceCandidateSources}
          expectedCount={82}
          evidenceCounts={daejeonEvidenceCounts}
        />
        <DaejeonPlaceCandidateMap
          candidateData={daejeonPlaceCandidates}
          auditData={daejeonRoadviewAudit}
          regionBridgeData={daejeonCandidateRegionBridge}
        />
      </main>
    );
  }
  if (viewMode === 'candidates') {
    return <DunsanCandidatePool onBack={() => openViewMode('customer')} />;
  }
  return <ReviewApp viewMode={viewMode} />;
}
