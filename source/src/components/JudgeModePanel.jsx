import { getRoadviewCapturePlan } from '../data/roadviewCapturePlan';
import { JUDGE_TOUR_CASES } from '../data/judgeTourCases';
import { getPhotoAiDraft } from '../utils/photoAiDraft';
import { getBarrierLabel } from '../utils/scoring';

const SCORE_ROWS = [
  {
    category: '우수성 및 독창성',
    points: '25점',
    current: '22점권',
    target: '24점권',
    judgeEvidence: '길 안내 자체가 아니라 생활시설 앞 마지막 30~50m의 접근성 데이터 공백을 검수 대상으로 정의',
    upgradeAction: 'Google Maps·Wheelmap과 다른 점을 실제 사례 2개로 30초 안에 설명',
  },
  {
    category: '설계와 방법론',
    points: '25점',
    current: '22점권',
    target: '24점권',
    judgeEvidence: '규칙 우선순위, 실제 비전 모델 초안, 사람 라벨링, 2차 검수를 분리',
    upgradeAction: '12건 직접 검수와 3건 독립 재검수로 판단보류·불일치 이유를 증명',
  },
  {
    category: '구현 완성도 및 활용도',
    points: '25점',
    current: '18점권',
    target: '24점권',
    judgeEvidence: '후보 12개 지도, 카카오 360도 로드뷰, 검수 저장, 보고서, JSON export',
    upgradeAction: '브라우저 전체 흐름 PASS, 현장 2곳 확인, 심사위원 저장→보고서 반영을 함께 증명',
  },
  {
    category: '발표',
    points: '25점',
    current: '17점권',
    target: '23점권',
    judgeEvidence: '8장 발표자료, 4분 시나리오, 출처 부록, 2분 이내 시연 영상과 예상 질문',
    upgradeAction: '4분 리허설 3회와 무작위 Q&A 8/10 이상을 실제 기록으로 남기고 결과 중심으로 발표',
  },
];

const ROLE_ROWS = [
  {
    owner: '태윤',
    role: '직접 검수자 / 발표자',
    job: '12개 후보를 열고, 확인 지도 체크, 장벽 라벨, 심각도, AI-사람 비교, 메모를 직접 남긴다.',
    pass: 'docs/student-review-evidence.v1.json에 12개 검수 기록이 남고 발표에서 2개 사례를 설명한다.',
  },
  {
    owner: 'AI',
    role: '사진 정성 초안 보조',
    job: '온라인 GPT-5.6 Sol은 인터넷·API 키·응답 스키마가 모두 확인될 때만 로드뷰 이미지의 보이는 신호와 한계를 JSON으로 제시한다.',
    pass: '모델·프롬프트·입력 해시가 남고, 숫자 정확도나 사람 최종 판정을 만들지 않는다.',
  },
  {
    owner: '감독/선생님',
    role: '증거 품질 관리자',
    job: '태윤이가 직접 본 증거인지, 카카오 좌표와 로드뷰 위치가 맞는지, 제출 파일이 만들어졌는지 확인한다.',
    pass: 'PENDING_STUDENT_EVIDENCE가 해소되고 verify:ready 결과가 제출 가능 상태로 바뀐다.',
  },
  {
    owner: '심사위원',
    role: '4분 발표·테스트 사용자',
    job: '문제 정의, 후보 추천, 카카오 확인 위치, 라벨 저장, 보고서 반영, 제출 자료 export를 순서대로 확인한다.',
    pass: '설명을 듣지 않아도 프로그램 안에서 무엇을 판단해야 하는지 확인할 수 있다.',
  },
];

const JUDGE_FLOW = [
  '심사 시작에서 문제, 현재 상태, 사람 증거가 필요한 이유를 본다.',
  '규칙·AI 미션에서 우선순위 규칙과 실제 비전 모델 초안을 구분한다.',
  '카카오 위치에서 좌표, 건물, 로드뷰 방향, 사진 속 확인 지점을 맞춘다.',
  '사람 검수에서 판단 항목을 채우고 후보 1개를 저장한다.',
  '근거 비교에서 AI 초안과 사람 최종 라벨이 왜 같거나 다른지 본다.',
  '분석 보고서에서 검수율, AI-사람 일치율, 반복 장벽을 확인한다.',
  '제출 자료에서 JSON/마크다운 근거와 PENDING_STUDENT_EVIDENCE 조건을 확인한다.',
];

const GUARDRAILS = [
  '대상 보장 아님: 대회 결과는 심사위원 평가와 경쟁작 수준에 따라 달라진다.',
  '현재 앱은 길찾기 서비스가 아니라 접근성 후보 데이터를 만드는 검수 시스템이다.',
  'AI는 최종 판정자가 아니며, 최종 판단은 태윤이의 직접 검수 기록과 지도교사 확인으로 닫는다.',
  '실제 보행 안전 안내로 쓰기 전에는 현장 확인과 더 큰 데이터 검증이 필요하다.',
];

const START_STEPS = [
  ['이유 확인', '왜 사람 판단이 필요한지 reason code를 확인합니다.'],
  ['위치 확인', '좌표 주변 실제 지명과 로드뷰 장면을 맞춥니다.'],
  ['판정 저장', '통과, 현장 확인, 제외 중 하나를 저장해 인박스에서 내립니다.'],
];

function getReadinessCopy(report) {
  const reviewedCount = report?.reviewedCount ?? 0;
  const total = report?.total ?? 12;
  const remaining = Math.max(total - reviewedCount, 0);

  if (reviewedCount >= total) {
    return {
      state: '사람 증거 일부 반영',
      score: '목표 95/100 · 아직 미확정',
      note: '직접 검수 12건만으로 95점을 확정하지 않습니다. 독립 재검수 3건, 현장 2곳, 4분 리허설 3회, Q&A, 참가자 사진, 지도교사 확인과 공식 업로드가 더 필요합니다.',
    };
  }

  return {
    state: 'PENDING_STUDENT_EVIDENCE',
    score: '현재 79/100 내부 추정',
    note: `구조와 화면은 시연 가능하지만 태윤이 직접 검수 증거 ${remaining}개가 더 필요합니다. 공식 4×25의 구현·발표 점수는 실제 사람 증거와 리허설 전에는 올리지 않습니다.`,
  };
}

export default function JudgeModePanel({ candidates, report, reviewTriage, onOpenTab, onReviewCandidate, onOpenCandidateTab }) {
  const readiness = getReadinessCopy(report);
  const triageMetrics = reviewTriage?.metrics ?? {};
  const topHumanRow = reviewTriage?.humanReviewRequired?.[0];
  const topCandidate = topHumanRow?.candidate ?? report?.topRiskCandidates?.[0] ?? candidates?.[0];
  const offlineCases = JUDGE_TOUR_CASES.map((caseDefinition) => {
    const candidate = candidates.find((item) => item.id === caseDefinition.candidateId);
    const capturePlan = getRoadviewCapturePlan(candidate);
    const modelDraft = getPhotoAiDraft(candidate);
    return { ...caseDefinition, candidate, capturePlan, modelDraft };
  }).filter((item) => item.candidate);

  return (
    <section className="judge-mode-panel" aria-label="심사위원 대상 모드">
      <section className="judge-offline-cases" aria-label="인터넷 없이 확인하는 대표 사례 3건">
        <header>
          <div>
            <span>90초 직접 검증 · 오프라인에서는 AI 분석 차단</span>
            <h3>대표 사례 3건을 순서대로 눌러 보세요</h3>
          </div>
          <p>규칙-모델 불일치 → 모델 보류 → 거리 경고를 3번 클릭으로 이어서 확인합니다.</p>
        </header>
        <div className="judge-offline-case-list">
          {offlineCases.map(({ type, question, candidate, capturePlan, modelDraft }, index) => (
            <article
              className="judge-offline-case"
              key={candidate.id}
              data-offline-case={candidate.id}
              data-judge-tour-order={index + 1}
            >
              <img src={capturePlan?.image} alt={`${candidate.name} 로드뷰 근거`} />
              <div className="judge-offline-case-copy">
                <span><b>{index + 1}</b>{type}</span>
                <strong>{candidate.id} · {candidate.name}</strong>
                <p>{question}</p>
                <small>
                  규칙 {getBarrierLabel(candidate.defaultBarrierType)} · 비전 AI {modelDraft.barrierLabel}({modelDraft.confidenceLabel}) · 사람 판단 대기
                </small>
                <em>{modelDraft.signals[0] ?? candidate.locationVerification?.reason}</em>
              </div>
              <div className="judge-offline-case-actions">
                <button type="button" onClick={() => onOpenCandidateTab(candidate.id, 'proof')}>사례 {index + 1} 검증</button>
                <button type="button" className="secondary" onClick={() => onOpenCandidateTab(candidate.id, 'review')}>사람 검수</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="judge-hero">
        <div className="judge-start-copy">
          <p className="panel-label">심사위원 대상 모드 · 사람 행동 인박스</p>
          <h2>{triageMetrics.humanReviewRequiredCount ?? report?.total ?? 12}개만 사람이 확인합니다</h2>
          <p>
            자동 검사가 정상 항목을 정리하고, 위치·근거·현장 판단이 필요한 후보만 보여 줍니다.
          </p>
          <ol className="judge-start-steps">
            {START_STEPS.map(([title, description], index) => (
              <li key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="judge-primary-actions">
            <button type="button" className="primary" onClick={() => topCandidate && onReviewCandidate(topCandidate.id)}>
              1순위 사람 검수
            </button>
            <button type="button" onClick={() => onOpenTab('ai')}>자동 분류 근거 보기</button>
          </div>
        </div>
        <div className="judge-readiness-card" aria-label="현재 제출 준비 상태">
          <span>{readiness.state}</span>
          <strong>{triageMetrics.humanReviewRequiredCount ?? report?.total ?? 12}</strong>
          <small>사람 행동 필요</small>
          <p>
            {topHumanRow
              ? `${topHumanRow.priority} · ${topHumanRow.primaryReason}. ${topHumanRow.requiredAction}`
              : '현재 사람 검수 필요 항목이 없습니다. 자동 처리 감사 로그를 확인할 수 있습니다.'}
          </p>
          <div className="judge-human-boundary">최종 판단은 사람이 합니다</div>
        </div>
      </div>

      <div className="judge-metric-strip" aria-label="심사위원이 바로 볼 핵심 지표">
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

      <details className="judge-detail-disclosure">
        <summary>심사 근거와 역할 자세히 보기</summary>
        <section className="judge-section" aria-label="코드페어 점수별 보강표">
          <h3>2026 공식 4×25 · 95점 내부 목표 보강 기준</h3>
          <div className="judge-score-table">
            {SCORE_ROWS.map((row) => (
              <article key={row.category} className="judge-score-row">
                <div><span>{row.points}</span><strong>{row.category}</strong></div>
                <p>현재 {row.current} → 목표 {row.target}</p>
                <p>{row.judgeEvidence}</p>
                <em>{row.upgradeAction}</em>
              </article>
            ))}
          </div>
        </section>
        <section className="judge-section" aria-label="역할 부여와 완료 기준">
          <div className="judge-role-grid">
            {ROLE_ROWS.map((row) => (
              <article key={row.owner} className="judge-role-card">
                <span>{row.owner}</span><strong>{row.role}</strong><p>{row.job}</p><small>{row.pass}</small>
              </article>
            ))}
          </div>
        </section>
        <h3>심사위원 공식 4분 발표·테스트</h3>
        <ol className="judge-flow-list">
          {JUDGE_FLOW.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="judge-action-row">
          <button type="button" onClick={() => onOpenTab('map')}>카카오 확인 위치 보기</button>
          <button type="button" onClick={() => onOpenTab('proof')}>AI-사람 근거 비교</button>
          <button type="button" onClick={() => onOpenTab('evidence')}>제출 증거 확인</button>
        </div>
        <ul className="judge-guardrail-list">
          {GUARDRAILS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  );
}
