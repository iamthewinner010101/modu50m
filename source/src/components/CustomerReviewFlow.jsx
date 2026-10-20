import { useEffect, useMemo, useState } from 'react';
import CandidateMap from './CandidateMap';
import roadviewAnalysisAssets from '../data/roadviewAnalysisAssets';
import roadviewDirectionAssets from '../data/roadviewDirectionAssets.generated';
import { getAiReviewGuidance, getPhotoAiDraft } from '../utils/photoAiDraft';
import { buildCommunityProgress } from '../utils/communityProgress';
import {
  getCustomerFieldVisitCandidates,
  getCustomerPlaceMatchCandidates,
  getCustomerReadyCandidates,
} from '../utils/locationReviewGate';
import { getReviewStatus } from '../utils/report';
import { getInspectionPlan } from '../utils/scoring';

const DECISIONS = [
  {
    value: 'published',
    label: '확인했어요',
    description: '사진과 지도를 함께 확인했어요',
  },
  {
    value: 'field_check_needed',
    label: '더 확인할래요',
    description: '현장이나 다른 사진이 더 필요해요',
  },
  {
    value: 'rejected',
    label: '이 장소는 제외',
    description: '위치가 다르거나 확인하기 어려워요',
  },
];

const PLACE_MATCH_OPTIONS = ['맞아요', '아니에요', '사진만으로 모르겠어요'];
const HUMAN_DOUBLE_CHECK_OPTIONS = [
  'AI 표시와 설명이 맞아요',
  '위치는 맞지만 설명을 고쳐야 해요',
  '사진만으로 확인할 수 없어요',
];
const HUMAN_CORRECTION_OPTION = '위치는 맞지만 설명을 고쳐야 해요';
const HUMAN_UNRESOLVED_OPTION = '사진만으로 확인할 수 없어요';

function isUnresolvedHumanAnswer(answer) {
  return answer === HUMAN_UNRESOLVED_OPTION || /모르|어려|안 보여|구분하기/.test(String(answer ?? ''));
}

function CustomerHeader({ onOpenJudgeMode, onOpenCandidatePool, onOpenDaejeonCoverage }) {
  return (
    <header className="customer-header">
      <div>
        <p className="customer-kicker">모두의 50m</p>
        <h1>목적지 앞을<br />한 번 더 확인해요</h1>
        <p className="customer-intro">카카오맵 사진을 보고 목적지 앞을 차근차근 확인해요.</p>
      </div>
      <div className="customer-header-actions">
        <button type="button" className="customer-mode-link" onClick={onOpenCandidatePool}>
          둔산 후보 고르기
        </button>
        <button type="button" className="customer-mode-link" onClick={onOpenJudgeMode}>
          설명용 화면
        </button>
        {onOpenDaejeonCoverage ? (
          <button type="button" className="customer-mode-link daejeon-coverage-link" onClick={onOpenDaejeonCoverage}>
            대전 82개 행정동 현황
          </button>
        ) : null}
      </div>
    </header>
  );
}

function EvidenceCandidatePicker({ candidates, selectedId, onSelectCandidate, allCandidateCount }) {
  return (
    <section className="customer-evidence-picker" aria-label="확인할 장소 선택">
      <div>
        <span>지금 근거가 준비된 장소</span>
        <strong>{candidates.length}곳</strong>
        <small>나머지 {Math.max(0, allCandidateCount - candidates.length)}곳은 맞지 않는 사진을 빼고 다시 찾는 중이에요.</small>
      </div>
      <label>
        <span>확인할 장소</span>
        <select value={selectedId} onChange={(event) => onSelectCandidate(event.target.value)}>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name} · {candidate.locationVerification?.fieldVisitPlan ? '현장 확인 필요' : 'AI→사람 재확인'}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function PlaceMatchReview({
  candidate,
  evidenceCandidates,
  allCandidateCount,
  reviews,
  onSelectCandidate,
  onChangeReview,
  onOpenJudgeMode,
  onOpenCandidatePool,
  onOpenDaejeonCoverage,
  roadviewVisionRun,
  onAnalyzeRoadview,
}) {
  const evidence = candidate.locationVerification?.placeMatchEvidence ?? {};
  const matchChecks = evidence.matchChecks ?? [];
  const accessibilityObservationGuide = evidence.accessibilityObservationGuide ?? [];
  const fallbackObservationRegions = accessibilityObservationGuide.map((item) => ({
    ...item.region,
    label: item.area,
    humanCheck: item.question,
  }));
  const savedDoubleCheck = reviews?.[candidate.id]?.roadviewAiHumanDoubleCheck ?? {};
  const [placeMatchAnswers, setPlaceMatchAnswers] = useState(savedDoubleCheck.placeMatchAnswers ?? {});
  const [humanDoubleCheckAnswers, setHumanDoubleCheckAnswers] = useState(
    savedDoubleCheck.humanDoubleCheckAnswers ?? {},
  );
  const [correctionNotes, setCorrectionNotes] = useState(savedDoubleCheck.correctionNotes ?? {});
  const [saved, setSaved] = useState(false);
  const photoDraft = getPhotoAiDraft(candidate, roadviewVisionRun?.result ?? null);
  const approvedOnlineResult = photoDraft.available;
  const aiResultRejected = roadviewVisionRun?.status === 'loaded' && !approvedOnlineResult;
  const aiUnavailable = roadviewVisionRun?.status === 'error' || aiResultRejected;
  const aiAttemptFinished = approvedOnlineResult || aiUnavailable;
  const humanDoubleCheckItems = approvedOnlineResult
    ? photoDraft.attentionRegions.map((region, index) => ({
        id: `ai-region-${index + 1}`,
        area: region.label,
        question: region.humanCheck,
        options: HUMAN_DOUBLE_CHECK_OPTIONS,
        nextEvidenceAction:
          photoDraft.humanCheckpoints[index] ??
          photoDraft.nextEvidenceAction?.evidenceNeeded ??
          '같은 위치를 다른 각도의 카카오 로드뷰나 현장에서 다시 확인해요.',
      }))
    : aiUnavailable
      ? accessibilityObservationGuide
      : [];
  const attentionRegions = approvedOnlineResult
    ? photoDraft.attentionRegions
    : aiUnavailable
      ? fallbackObservationRegions
      : [];
  const allPlaceChecksAnswered = matchChecks.length > 0 && matchChecks.every(
    (_, index) => placeMatchAnswers[`place-${index + 1}`],
  );
  const allHumanChecksAnswered = humanDoubleCheckItems.length > 0 && humanDoubleCheckItems.every(
    (item) => humanDoubleCheckAnswers[item.id],
  );
  const correctionNotesComplete = humanDoubleCheckItems.every((item) => (
    humanDoubleCheckAnswers[item.id] !== HUMAN_CORRECTION_OPTION ||
    String(correctionNotes[item.id] ?? '').trim().length >= 4
  ));
  const answeredHumanCount = humanDoubleCheckItems.filter(
    (item) => humanDoubleCheckAnswers[item.id],
  ).length;
  const unresolvedPlaceCount = matchChecks.filter(
    (_, index) => {
      const answer = placeMatchAnswers[`place-${index + 1}`];
      return Boolean(answer && answer !== '맞아요');
    },
  ).length;
  const unresolvedHumanItems = humanDoubleCheckItems.filter(
    (item) => isUnresolvedHumanAnswer(humanDoubleCheckAnswers[item.id]),
  );
  const unresolvedCount = unresolvedPlaceCount + unresolvedHumanItems.length;
  const fieldFollowUpRequired = unresolvedCount > 0;
  const readyToSave = (
    aiAttemptFinished &&
    allPlaceChecksAnswered &&
    allHumanChecksAnswered &&
    correctionNotesComplete
  );
  const captureDate = evidence.captureDate
    ? new Date(evidence.captureDate).toLocaleDateString('ko-KR')
    : '촬영일 확인 필요';

  function handleHumanAnswer(itemId, answer) {
    setSaved(false);
    setHumanDoubleCheckAnswers((current) => ({ ...current, [itemId]: answer }));
  }

  function handleSave() {
    if (!readyToSave) return;
    const nextEvidenceActions = [
      ...(unresolvedPlaceCount > 0
        ? ['카카오 장소명과 같은 지점의 최신 로드뷰 또는 현장 사진으로 장소를 다시 확인해요.']
        : []),
      ...unresolvedHumanItems.map((item) => item.nextEvidenceAction),
      ...(photoDraft.nextEvidenceAction?.evidenceNeeded
        ? [`${photoDraft.nextEvidenceAction.evidenceNeeded} · ${photoDraft.nextEvidenceAction.verifier}`]
        : []),
    ];
    onChangeReview(candidate.id, {
      roadviewAiHumanDoubleCheck: {
        status: 'recorded_pending_human_review',
        source: 'online_ai_then_person_double_check',
        aiRunStatus: approvedOnlineResult ? 'loaded' : 'error',
        approvedOnlineResult,
        provider: photoDraft.provenance?.provider ?? '',
        model: photoDraft.provenance?.model ?? '',
        responseId: photoDraft.provenance?.responseId ?? '',
        inputSha256: photoDraft.provenance?.inputSha256 ?? evidence.imageSha256,
        placeId: evidence.placeId,
        placeMatchAnswers,
        humanDoubleCheckAnswers,
        correctionNotes,
        unresolvedCount,
        fieldFollowUpRequired,
        nextEvidenceActions: [...new Set(nextEvidenceActions)].slice(0, 8),
        humanEvidenceStatus: 'pending',
        savedAt: new Date().toISOString(),
      },
    });
    setSaved(true);
  }

  return (
    <main className="customer-app-shell" data-customer-flow="simple" data-customer-state="place-match-review">
      <CustomerHeader
        onOpenJudgeMode={onOpenJudgeMode}
        onOpenCandidatePool={onOpenCandidatePool}
        onOpenDaejeonCoverage={onOpenDaejeonCoverage}
      />

      <EvidenceCandidatePicker
        candidates={evidenceCandidates}
        selectedId={candidate.id}
        onSelectCandidate={onSelectCandidate}
        allCandidateCount={allCandidateCount}
      />

      <section className="customer-place-match-intro">
        <span>1 · 온라인 AI 사전 확인</span>
        <h2>AI가 카카오 로드뷰를 먼저 확인해요</h2>
        <p>정확한 장소 ID와 이미지 해시가 맞는 사진만 보냅니다. 로컬 AI는 사용하지 않아요.</p>
      </section>

      <div className={`customer-ai-spot-control ${roadviewVisionRun?.status ?? 'idle'}`}>
        <button
          type="button"
          disabled={!onAnalyzeRoadview || roadviewVisionRun?.status === 'loading'}
          onClick={() => onAnalyzeRoadview(
            candidate.id,
            roadviewAnalysisAssets[candidate.id]?.directionKey ?? 'focus',
          )}
        >
          {roadviewVisionRun?.status === 'loading'
            ? 'AI가 로드뷰를 확인하는 중…'
            : approvedOnlineResult
              ? '온라인 AI 다시 확인하기'
              : '온라인 AI가 로드뷰 먼저 보기'}
        </button>
        <p role="status" aria-live="polite">
          {approvedOnlineResult
            ? `AI가 다시 볼 위치 ${photoDraft.attentionRegions.length}곳을 표시했어요. 이제 사람이 같은 사진을 확인합니다.`
            : aiUnavailable
              ? `${roadviewVisionRun?.error ?? '온라인 결과가 현재 사진과 일치하지 않아 사용하지 않았어요.'} 로컬 AI로 대신하지 않고 사람 검수로 넘겼어요.`
              : roadviewVisionRun?.status === 'loading'
                ? '온라인 GPT-5.6 Sol이 사진에서 보이는 사실과 모르는 부분을 나누고 있어요.'
                : 'AI 확인을 먼저 실행하면 사람 재검수가 열려요.'}
        </p>
      </div>

      <CandidateMap
        candidates={[candidate]}
        selectedId={candidate.id}
        onSelectCandidate={() => {}}
        attentionRegions={attentionRegions}
        attentionKind={approvedOnlineResult ? 'ai' : 'observation_guide'}
        showLocationVerification={false}
      />

      <section className="customer-place-match-source" aria-label="카카오 장소 근거">
        <span>카카오 장소명</span>
        <strong>{evidence.placeName}</strong>
        <p>{evidence.address}</p>
        <small>장소 ID {evidence.placeId} · 로드뷰 촬영 {captureDate}</small>
      </section>

      <section className={`customer-ai-result ${approvedOnlineResult ? 'available' : aiUnavailable ? 'unavailable' : 'waiting'}`}>
        <span>{approvedOnlineResult ? 'AI가 본 것과 못 본 것' : aiUnavailable ? 'AI 확인 불가' : 'AI 결과 대기'}</span>
        {approvedOnlineResult ? (
          <>
            <h2>보이는 사실만 먼저 적었어요</h2>
            <ul>{photoDraft.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
            <h3>왜 AI가 확정하지 못했나요?</h3>
            <ul>{photoDraft.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul>
            <p><strong>다음 증거</strong> {photoDraft.nextEvidenceAction?.evidenceNeeded ?? '사람이 같은 사진을 다시 확인해요.'}</p>
          </>
        ) : aiUnavailable ? (
          <>
            <h2>AI가 이 사진을 확인하지 못했어요</h2>
            <p>{roadviewVisionRun?.error ?? '결과가 현재 후보의 장소·이미지 근거와 맞지 않았어요.'}</p>
            <p>결과를 만들지 않고, 아래의 사람용 관찰 기준으로 같은 사진을 직접 확인합니다.</p>
          </>
        ) : (
          <p>아직 AI가 사진을 보지 않았어요. 위 버튼으로 사전 확인을 시작하세요.</p>
        )}
      </section>

      <section
        className={`customer-accessibility-preview ${aiAttemptFinished ? 'enabled' : 'locked'}`}
        aria-labelledby="accessibility-preview-title"
      >
        <header>
          <span>2 · 사람 더블체크</span>
          <h2 id="accessibility-preview-title">사람이 같은 사진을 다시 확인해요</h2>
          <p>
            AI 표시가 정확한 위치인지 먼저 확인하고, 틀리면 고치세요. 모르면 그대로 남겨 현장 확인으로 넘깁니다.
          </p>
        </header>

        {!aiAttemptFinished ? (
          <p className="customer-accessibility-lock-note">AI 확인을 먼저 실행하면 사람 재검수가 열려요.</p>
        ) : null}

        <div className="customer-double-check-flow" aria-label="AI와 사람 더블체크 순서">
          <span className={aiAttemptFinished ? 'done' : 'current'}>1. AI가 먼저 관찰</span>
          <span className={aiAttemptFinished ? 'current' : ''}>2. 사람이 다시 확인</span>
          <span>3. 미해결만 추가 증거</span>
        </div>

        <fieldset className="customer-place-match-checks" disabled={!aiAttemptFinished} aria-label="사진과 장소 일치 재확인">
          <legend>먼저 같은 장소가 맞는지 확인해요</legend>
          {matchChecks.map((item, index) => {
            const itemId = `place-${index + 1}`;
            return (
              <div className="customer-place-match-question" key={item}>
                <strong><small>{index + 1}</small>{item}</strong>
                <div>
                  {PLACE_MATCH_OPTIONS.map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name={`place-match-${candidate.id}-${itemId}`}
                        value={option}
                        checked={placeMatchAnswers[itemId] === option}
                        onChange={() => {
                          setSaved(false);
                          setPlaceMatchAnswers((current) => ({ ...current, [itemId]: option }));
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          <p>장소 일치 확인도 근거 확인일 뿐이에요. 접근 가능 여부와 안전은 아직 판단하지 않아요.</p>
        </fieldset>

        <div className="customer-accessibility-question-list">
          {humanDoubleCheckItems.map((item, index) => (
            <fieldset className="customer-accessibility-question" disabled={!aiAttemptFinished} key={item.id}>
              <legend>
                <small>{index + 1}</small>
                <span>
                  <em>{item.area}</em>
                  <strong>{item.question}</strong>
                </span>
              </legend>
              <div>
                {item.options.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`human-double-check-${candidate.id}-${item.id}`}
                      value={option}
                      checked={humanDoubleCheckAnswers[item.id] === option}
                      onChange={() => handleHumanAnswer(item.id, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {humanDoubleCheckAnswers[item.id] === HUMAN_CORRECTION_OPTION ? (
                <label className="customer-ai-correction-note">
                  <span>어떻게 고칠까요?</span>
                  <textarea
                    rows="2"
                    value={correctionNotes[item.id] ?? ''}
                    onChange={(event) => {
                      setSaved(false);
                      setCorrectionNotes((current) => ({ ...current, [item.id]: event.target.value }));
                    }}
                    placeholder="예: 원은 계단이 아니라 오른쪽 나무를 가리켜요."
                  />
                </label>
              ) : null}
              <p><strong>다음 확인</strong>{item.nextEvidenceAction}</p>
            </fieldset>
          ))}
        </div>

        <aside className="customer-photo-only-limit">
          <strong>사진으로 확정할 수 없는 것</strong>
          <p>{evidence.photoOnlyLimit}</p>
        </aside>
        <strong className="customer-accessibility-count" aria-live="polite">
          사람 재검수 {answeredHumanCount}/{humanDoubleCheckItems.length} · 미해결 {unresolvedCount}개
        </strong>
      </section>

      <section className="customer-follow-up-box" aria-label="미해결 항목의 다음 증거">
        <span>3 · 추가 증거</span>
        <h2>그래도 모르면 로드뷰를 더 보거나 현장에서 확인해요</h2>
        <p>사람도 ‘모르겠어요’를 고른 항목만 다음 사진·지도·현장 측정 목록으로 저장합니다.</p>
      </section>

      <button
        type="button"
        className="customer-place-match-save"
        disabled={!readyToSave}
        onClick={handleSave}
      >
        AI와 사람 재검수 기록 저장
      </button>
      <p className="customer-save-notice" role="status" aria-live="polite">
        {saved
          ? fieldFollowUpRequired
            ? `저장했어요. 미해결 ${unresolvedCount}개를 추가 로드뷰·현장 확인으로 넘겼어요. 최종 판정은 PENDING이에요.`
            : '저장했어요. AI 표시와 사람 재검수를 기록했지만 최종 접근성·안전 판정은 PENDING이에요.'
          : ''}
      </p>
    </main>
  );
}

function FieldVisitReview({
  candidate,
  evidenceCandidates,
  allCandidateCount,
  reviews,
  onSelectCandidate,
  onChangeReview,
  onOpenJudgeMode,
  onOpenCandidatePool,
  onOpenDaejeonCoverage,
}) {
  const plan = candidate.locationVerification?.fieldVisitPlan ?? {};
  const checkpoints = plan.checkpoints ?? [];
  const savedDraft = reviews?.[candidate.id]?.fieldVisitDraft ?? {};
  const [arrivalChecks, setArrivalChecks] = useState(savedDraft.arrivalChecks ?? {});
  const [checkpointAnswers, setCheckpointAnswers] = useState(savedDraft.checkpointAnswers ?? {});
  const [measurements, setMeasurements] = useState(savedDraft.measurements ?? {});
  const [measurementReasons, setMeasurementReasons] = useState(savedDraft.measurementReasons ?? {});
  const [photoRecords, setPhotoRecords] = useState(savedDraft.photoRecords ?? {});
  const [saveNotice, setSaveNotice] = useState('');
  const completedArrivalCount = (plan.arrivalChecks ?? []).filter((item) => arrivalChecks[item]).length;
  const completedCheckpointCount = checkpoints.filter((checkpoint) => {
    const answer = checkpointAnswers[checkpoint.id];
    const measurementUnavailable = checkpoint.measurementUnavailableOptions?.includes(answer);
    const measurementRecorded = measurementUnavailable
      ? String(measurementReasons[checkpoint.id] ?? '').trim().length > 0
      : String(measurements[checkpoint.id] ?? '').trim().length > 0;

    return answer && measurementRecorded && photoRecords[checkpoint.id]?.name;
  }).length;

  function handlePhotoChange(checkpointId, file) {
    setSaveNotice('');
    setPhotoRecords((current) => ({
      ...current,
      [checkpointId]: file
        ? {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          }
        : null,
    }));
  }

  function handleSaveDraft() {
    onChangeReview(candidate.id, {
      fieldVisitDraft: {
        status: completedCheckpointCount === checkpoints.length &&
          completedArrivalCount === (plan.arrivalChecks ?? []).length
          ? 'recorded_pending_human_evidence_review'
          : 'in_progress',
        source: 'person_entered_field_draft',
        humanEvidenceStatus: 'pending',
        placeId: plan.placeId,
        arrivalChecks,
        checkpointAnswers,
        measurements,
        measurementReasons,
        photoRecords,
        savedAt: new Date().toISOString(),
      },
    });
    setSaveNotice('이 기기에 임시 저장했어요. 접근성 판정은 아직 PENDING이에요.');
  }

  return (
    <main className="customer-app-shell" data-customer-flow="simple" data-customer-state="field-visit">
      <CustomerHeader
        onOpenJudgeMode={onOpenJudgeMode}
        onOpenCandidatePool={onOpenCandidatePool}
        onOpenDaejeonCoverage={onOpenDaejeonCoverage}
      />

      <EvidenceCandidatePicker
        candidates={evidenceCandidates}
        selectedId={candidate.id}
        onSelectCandidate={onSelectCandidate}
        allCandidateCount={allCandidateCount}
      />

      <section className="customer-field-intro">
        <span>현장 확인 카드</span>
        <h2>로드뷰로 안 보이면 현장에서 확인해요</h2>
        <p>같은 장소를 보여 주는 로드뷰가 없어 온라인 AI를 실행하지 않았어요. 맞지 않는 사진을 대신 넣지 않고, 카카오 장소 핀에서 마지막 30~50m를 직접 확인합니다.</p>
      </section>

      <section className="customer-field-place" aria-label="세이브존 카카오 장소와 길찾기">
        <div>
          <span>카카오 장소</span>
          <strong>{plan.placeName}</strong>
          <p>{plan.address}</p>
          <small>장소 ID {plan.placeId}</small>
        </div>
        <div className="customer-field-map-actions">
          <a href={plan.mapUrl} target="_blank" rel="noreferrer">카카오맵에서 위치 보기</a>
          <a className="primary" href={plan.directionsUrl} target="_blank" rel="noreferrer">카카오맵 길찾기</a>
        </div>
      </section>

      <section className="customer-field-start">
        <span>도착하면 먼저</span>
        <strong>{plan.startPoint}</strong>
        <div className="customer-field-arrival-checks">
          {(plan.arrivalChecks ?? []).map((item) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={Boolean(arrivalChecks[item])}
                onChange={(event) => {
                  setSaveNotice('');
                  setArrivalChecks((current) => ({ ...current, [item]: event.target.checked }));
                }}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <small>도착 확인 {completedArrivalCount}/{(plan.arrivalChecks ?? []).length}</small>
      </section>

      <section className="customer-field-kit" aria-label="현장 준비물">
        <strong>가져갈 것</strong>
        <div>{(plan.bring ?? []).map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="customer-field-checkpoints" aria-labelledby="field-checkpoints-title">
        <header>
          <span>현장에서 이 순서로</span>
          <h2 id="field-checkpoints-title">네 지점을 측정하고 촬영해요</h2>
        </header>
        <ol>
          {checkpoints.map((checkpoint) => (
            <li key={checkpoint.id}>
              <small>{checkpoint.order}</small>
              <div>
                <span>{checkpoint.location}</span>
                <strong>{checkpoint.question}</strong>
                <fieldset>
                  <legend>하나를 선택해요</legend>
                  {checkpoint.options.map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name={`field-answer-${checkpoint.id}`}
                        value={option}
                        checked={checkpointAnswers[checkpoint.id] === option}
                        onChange={() => {
                          setSaveNotice('');
                          setCheckpointAnswers((current) => ({ ...current, [checkpoint.id]: option }));
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
                {checkpoint.measurementUnavailableOptions?.includes(checkpointAnswers[checkpoint.id]) ? (
                  <label className="customer-field-no-measurement">
                    <span><b>측정 불가 이유</b>무리해서 재지 말고, 왜 측정하지 못했는지 적어요.</span>
                    <textarea
                      rows="2"
                      value={measurementReasons[checkpoint.id] ?? ''}
                      onChange={(event) => {
                        setSaveNotice('');
                        setMeasurementReasons((current) => ({ ...current, [checkpoint.id]: event.target.value }));
                      }}
                      placeholder="예: 차량이 계속 지나가 안전하게 줄자를 펼 수 없었어요."
                      aria-label={`${checkpoint.order}번 지점 측정 불가 이유`}
                    />
                    <small>이 경우도 완료 판정이 아니라 PENDING 기록으로 저장돼요.</small>
                  </label>
                ) : (
                  <label className="customer-field-measurement">
                    <span><b>측정</b>{checkpoint.measurement.label}</span>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step={checkpoint.measurement.unit === 'm' ? '0.1' : '1'}
                        inputMode="decimal"
                        value={measurements[checkpoint.id] ?? ''}
                        onChange={(event) => {
                          setSaveNotice('');
                          setMeasurements((current) => ({ ...current, [checkpoint.id]: event.target.value }));
                        }}
                        aria-label={`${checkpoint.measurement.label} ${checkpoint.measurement.unit}`}
                      />
                      <em>{checkpoint.measurement.unit}</em>
                    </div>
                  </label>
                )}
                <label className="customer-field-photo">
                  <span><b>사진</b>{checkpoint.photoInstruction}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => handlePhotoChange(checkpoint.id, event.target.files?.[0] ?? null)}
                    aria-label={`${checkpoint.order}번 지점 사진 선택`}
                  />
                  <small>{photoRecords[checkpoint.id]?.name ?? '아직 선택한 사진이 없어요'}</small>
                </label>
              </div>
            </li>
          ))}
        </ol>
        <strong className="customer-field-progress" aria-live="polite">
          객관식·측정 또는 불가 이유·사진까지 기록한 지점 {completedCheckpointCount}/{checkpoints.length}
        </strong>
      </section>

      <aside className="customer-field-safety">
        <strong>안전하게 확인해요</strong>
        <p>{plan.visitSafety}</p>
      </aside>

      <section className="customer-field-pending" aria-label="현장 증거 상태">
        <span>PENDING · 아직 현장 증거가 없어요</span>
        <strong>사진 4장과 측정 기록이 있어야 검토 가능</strong>
        <p>{plan.completionRule}</p>
        <p>사진 파일은 휴대폰 사진첩에도 보관하세요. 이 화면에는 파일명과 입력값만 임시 저장됩니다.</p>
      </section>

      <button type="button" className="customer-field-save" onClick={handleSaveDraft}>
        현장 기록 임시 저장
      </button>
      <p className="customer-save-notice" role="status" aria-live="polite">{saveNotice}</p>
    </main>
  );
}

export default function CustomerReviewFlow({
  candidates,
  selectedId,
  reviews,
  onSelectCandidate,
  onChangeReview,
  onOpenJudgeMode,
  onOpenCandidatePool,
  onOpenDaejeonCoverage,
  reviewTeam,
  reviewAudit,
  roadviewVisionRun,
  onAnalyzeRoadview,
}) {
  const [saveNotice, setSaveNotice] = useState('');
  const customerReadyCandidates = useMemo(() => getCustomerReadyCandidates(candidates), [candidates]);
  const placeMatchCandidates = useMemo(() => getCustomerPlaceMatchCandidates(candidates), [candidates]);
  const fieldVisitCandidates = useMemo(() => getCustomerFieldVisitCandidates(candidates), [candidates]);
  const evidenceCandidates = useMemo(
    () => [...placeMatchCandidates, ...fieldVisitCandidates],
    [fieldVisitCandidates, placeMatchCandidates],
  );
  const evidenceCandidate = evidenceCandidates.find((candidate) => candidate.id === selectedId)
    ?? evidenceCandidates[0];
  const selectedIndex = Math.max(0, customerReadyCandidates.findIndex((candidate) => candidate.id === selectedId));
  const selectedCandidate = customerReadyCandidates[selectedIndex] ?? customerReadyCandidates[0];
  const currentReview = reviews[selectedCandidate?.id] ?? {};
  const currentStatus = selectedCandidate ? getReviewStatus(selectedCandidate, currentReview) : 'unreviewed';
  const currentMemo = currentReview.memo ?? '';
  const currentFocusChecks = currentReview.focusChecks ?? {};
  const inspectionPlan = selectedCandidate ? getInspectionPlan(selectedCandidate) : null;
  const directionAsset = selectedCandidate ? roadviewDirectionAssets[selectedCandidate.id] : null;
  const photoDraft = selectedCandidate
    ? getPhotoAiDraft(selectedCandidate, roadviewVisionRun?.result ?? null)
    : null;
  const aiGuidance = getAiReviewGuidance(photoDraft, directionAsset);
  const focusItems = inspectionPlan?.humanCheckFocus.slice(0, 3) ?? [];
  const checkedFocusCount = focusItems.filter((focus) => currentFocusChecks[focus]).length;
  const allFocusItemsChecked = focusItems.length > 0 && checkedFocusCount === focusItems.length;
  const selectedDecisionAllowed = DECISIONS.some((decision) => decision.value === currentStatus);
  const saveRequirementsMet = (
    allFocusItemsChecked &&
    selectedDecisionAllowed &&
    currentMemo.trim().length > 0
  );
  const nextCandidate = customerReadyCandidates[(selectedIndex + 1) % customerReadyCandidates.length];
  const completedCount = useMemo(
    () => customerReadyCandidates.filter((candidate) => reviews[candidate.id]?.stepChecks?.decisionSaved).length,
    [customerReadyCandidates, reviews],
  );
  const progress = useMemo(
    () => Math.round((completedCount / Math.max(customerReadyCandidates.length, 1)) * 100),
    [customerReadyCandidates.length, completedCount],
  );
  const community = useMemo(() => buildCommunityProgress({
    events: reviewAudit?.events ?? [],
    actorId: reviewTeam?.actor?.id ?? '',
    actorDisplayName: reviewTeam?.actor?.displayName ?? '나',
  }), [reviewAudit?.events, reviewTeam?.actor?.displayName, reviewTeam?.actor?.id]);

  useEffect(() => {
    if (reviewAudit?.enabled && ['idle', 'stale'].includes(reviewAudit.status)) {
      reviewAudit.loadAuditEvents({ limit: 200 });
    }
  }, [reviewAudit]);

  if (!selectedCandidate && evidenceCandidate?.locationVerification?.fieldVisitPlan) {
    return (
      <FieldVisitReview
        key={evidenceCandidate.id}
        candidate={evidenceCandidate}
        evidenceCandidates={evidenceCandidates}
        allCandidateCount={candidates.length}
        reviews={reviews}
        onSelectCandidate={onSelectCandidate}
        onChangeReview={onChangeReview}
        onOpenJudgeMode={onOpenJudgeMode}
        onOpenCandidatePool={onOpenCandidatePool}
        onOpenDaejeonCoverage={onOpenDaejeonCoverage}
      />
    );
  }

  if (!selectedCandidate && evidenceCandidate) {
    return (
      <PlaceMatchReview
        key={evidenceCandidate.id}
        candidate={evidenceCandidate}
        evidenceCandidates={evidenceCandidates}
        allCandidateCount={candidates.length}
        reviews={reviews}
        onSelectCandidate={onSelectCandidate}
        onChangeReview={onChangeReview}
        onOpenJudgeMode={onOpenJudgeMode}
        onOpenCandidatePool={onOpenCandidatePool}
        onOpenDaejeonCoverage={onOpenDaejeonCoverage}
        roadviewVisionRun={roadviewVisionRun}
        onAnalyzeRoadview={onAnalyzeRoadview}
      />
    );
  }

  if (!selectedCandidate) {
    return (
      <main className="customer-app-shell" data-customer-flow="simple" data-customer-state="empty">
        <CustomerHeader
          onOpenJudgeMode={onOpenJudgeMode}
          onOpenCandidatePool={onOpenCandidatePool}
          onOpenDaejeonCoverage={onOpenDaejeonCoverage}
        />
        <section className="customer-empty-state" aria-label="확인 가능한 장소 없음">
          <span>장소 준비 중</span>
          <h2>지금 확인할 수 있는 장소가 없어요</h2>
          <p>사진과 위치가 확인된 장소만 이 화면에 보여드려요.</p>
        </section>
      </main>
    );
  }

  function handleDecision(value) {
    setSaveNotice('');
    onChangeReview(selectedCandidate.id, { status: value });
  }

  function handleFocusCheck(focus, checked) {
    setSaveNotice('');
    onChangeReview(selectedCandidate.id, {
      focusChecks: {
        ...currentFocusChecks,
        [focus]: checked,
      },
    });
  }

  function handleSaveAndNext() {
    if (!saveRequirementsMet) return;

    onChangeReview(selectedCandidate.id, {
      validationStatus: !currentReview.validationStatus || currentReview.validationStatus === 'not_started'
        ? 'single_review'
        : currentReview.validationStatus,
      stepChecks: {
        ...(currentReview.stepChecks ?? {}),
        decisionSaved: true,
      },
    });
    setSaveNotice(`${selectedCandidate.name} 메모를 저장했어요.`);
    if (nextCandidate && nextCandidate.id !== selectedCandidate.id) {
      onSelectCandidate(nextCandidate.id);
    }
  }

  return (
    <main className="customer-app-shell" data-customer-flow="simple">
      <CustomerHeader
        onOpenJudgeMode={onOpenJudgeMode}
        onOpenCandidatePool={onOpenCandidatePool}
        onOpenDaejeonCoverage={onOpenDaejeonCoverage}
      />

      <section className="customer-progress" aria-label={`확인 진행 ${completedCount}/${customerReadyCandidates.length}`}>
        <div>
          <span>확인한 장소</span>
          <strong>{completedCount}<small> / {customerReadyCandidates.length}</small></strong>
        </div>
        <div className="customer-progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="customer-community-card" aria-label="내 기여와 품질 랭킹">
        <div className="customer-community-summary">
          <div>
            <span>내 기여</span>
            <strong>{community.myProgress.points}<small>점</small></strong>
          </div>
          <p>
            {community.myProgress.rank
              ? `최근 7일 품질 기여 ${community.myProgress.rank}위`
              : '직접 검수부터 기록돼요'}
          </p>
        </div>
        <div className="customer-badge-row" aria-label="기여 배지">
          {community.myProgress.badges.map((badge) => (
            <span className={badge.earned ? 'earned' : 'locked'} key={badge.key} title={badge.description}>
              {badge.earned ? '●' : '○'} {badge.label}
            </span>
          ))}
        </div>
        <div className="customer-quality-ranking">
          <strong>최근 7일 품질 기여</strong>
          {community.rankings.length > 0 ? (
            <ol>
              {community.rankings.slice(0, 3).map((contributor) => (
                <li key={contributor.actorId}>
                  <small>{contributor.rank}</small>
                  <span>{contributor.displayName}</span>
                  <strong>{contributor.points}점</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p>계정으로 직접 검수하면 여기에서 노력이 보여요.</p>
          )}
          <small>{community.qualityRule}</small>
        </div>
      </section>

      <section className="customer-step customer-place-step" aria-labelledby="place-step-title">
        <div className="customer-step-heading">
          <span>1</span>
          <div>
            <h2 id="place-step-title">어디를 확인할까요?</h2>
            <p>장소를 고르면 카카오 로드뷰가 보여요.</p>
          </div>
        </div>
        <label className="customer-place-select">
          <span>장소 선택</span>
          <select value={selectedCandidate.id} onChange={(event) => onSelectCandidate(event.target.value)}>
            {customerReadyCandidates.map((candidate, index) => (
              <option key={candidate.id} value={candidate.id}>
                {index + 1}. {candidate.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="customer-step" aria-labelledby="map-step-title">
        <div className="customer-step-heading">
          <span>2</span>
          <div>
            <h2 id="map-step-title">사진을 보고 3가지를 체크해요</h2>
            <p>아래 위치와 방향을 보고, 각 항목을 찾아본 뒤 체크하세요.</p>
          </div>
        </div>
        <div className={`customer-ai-spot-control ${roadviewVisionRun?.status ?? 'idle'}`}>
          <button
            type="button"
            disabled={!onAnalyzeRoadview || roadviewVisionRun?.status === 'loading'}
            onClick={() => onAnalyzeRoadview(
              selectedCandidate.id,
              roadviewAnalysisAssets[selectedCandidate.id]?.directionKey ?? 'focus',
            )}
          >
            {roadviewVisionRun?.status === 'loading' ? 'AI가 사진을 보는 중…' : 'AI로 볼 곳 찾기'}
          </button>
          <p role="status" aria-live="polite">
            {roadviewVisionRun?.status === 'loaded'
              ? `온라인 AI가 ${photoDraft.attentionRegions.length}곳을 표시했어요. AI 표시가 정확한 위치인지 먼저 확인하세요.`
              : roadviewVisionRun?.status === 'error'
                ? roadviewVisionRun.error
                : '인터넷과 승인된 온라인 AI가 연결될 때만 원을 표시해요.'}
          </p>
        </div>
        <CandidateMap
          candidates={customerReadyCandidates}
          reviews={reviews}
          selectedId={selectedCandidate.id}
          onSelectCandidate={onSelectCandidate}
          attentionRegions={photoDraft.attentionRegions}
          showLocationVerification={false}
        />

        <fieldset className="customer-observation-card" aria-label="사진 관찰 체크리스트">
          <legend>이 방향에서 무엇을 볼까요?</legend>
          <div className="customer-observation-location">
            <span>사진에서 찾을 곳</span>
            <strong>{selectedCandidate.detailedLocation ?? selectedCandidate.address}</strong>
          </div>
          <p className="customer-direction-note">
            후보 좌표 방향은 장벽 위치가 아니라 살펴볼 방향이에요.
          </p>
          <div className="customer-observation-list">
            {focusItems.map((focus, index) => (
              <label className="customer-observation-option" key={focus}>
                <input
                  type="checkbox"
                  checked={Boolean(currentFocusChecks[focus])}
                  onChange={(event) => handleFocusCheck(focus, event.target.checked)}
                />
                <span>
                  <small>{index + 1}</small>
                  <strong>{focus}</strong>
                  <em>살펴봤어요</em>
                </span>
              </label>
            ))}
          </div>
          <div className="customer-observation-footer">
            <p>
              체크는 문제가 있다는 뜻이 아니라, 그 항목을 사진에서 찾아봤다는 뜻이에요.
              안 보이거나 가려졌어도 살펴본 뒤 체크하고 3단계에서 알려주세요.
            </p>
            <strong aria-live="polite">살펴본 항목 {checkedFocusCount}/{focusItems.length}</strong>
          </div>
        </fieldset>

        <aside className="customer-ai-guidance" aria-label="AI 판단보류와 사람 검수 안내">
          <div className="customer-ai-guidance-header">
            <div>
              <span>AI 상태</span>
              <strong>{aiGuidance.stateLabel}</strong>
            </div>
          </div>

          <div className="customer-ai-reason-block">
            <h3>AI가 바로 답하지 못한 이유</h3>
            <p>{aiGuidance.summary}</p>
            <ul>
              {aiGuidance.reasons.slice(0, 3).map((reason) => (
                <li key={reason.reasonCode}>
                  <strong>{reason.title}</strong>
                  <span>{reason.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="customer-human-next-actions">
            <h3>사람이 다음에 할 일</h3>
            <ol>
              {aiGuidance.nextActions.map((action, index) => (
                <li key={action}>
                  <small>{index + 1}</small>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
            <p><strong>주의</strong> {aiGuidance.cautions[0]}</p>
          </div>

        </aside>
      </section>

      <section className="customer-step customer-decision-step" aria-labelledby="decision-step-title">
        <div className="customer-step-heading">
          <span>3</span>
          <div>
            <h2 id="decision-step-title">확인한 내용을 남겨요</h2>
            <p>가장 가까운 답 하나를 골라주세요.</p>
          </div>
        </div>

        <div className="customer-decision-guide" aria-label="판단 선택 도움">
          <p><strong>장벽을 판단할 근거가 보임</strong><span>확인했어요</span></p>
          <p><strong>가림·각도·사진 부족</strong><span>더 확인할래요</span></p>
          <p><strong>장벽이 없거나 다른 장소·방향</strong><span>이 장소는 제외</span></p>
        </div>

        <div className="customer-decision-options" role="group" aria-label="확인 결과">
          {DECISIONS.map((decision) => (
            <button
              type="button"
              key={decision.value}
              className={currentStatus === decision.value ? 'selected' : ''}
              aria-pressed={currentStatus === decision.value}
              onClick={() => handleDecision(decision.value)}
            >
              <strong>{decision.label}</strong>
              <span>{decision.description}</span>
            </button>
          ))}
        </div>

        <label className="customer-memo">
          <span>한 줄 메모</span>
          <textarea
            rows="2"
            value={currentMemo}
            onChange={(event) => onChangeReview(selectedCandidate.id, { memo: event.target.value })}
            placeholder="예: 입구 앞 턱이 사진에서 가려져 있어요"
          />
        </label>

        <button
          type="button"
          className="customer-save-button"
          disabled={!saveRequirementsMet}
          onClick={handleSaveAndNext}
        >
          저장하고 다음 장소
        </button>
        {!saveRequirementsMet ? (
          <p className="customer-save-help">위 3가지를 모두 살펴보고 답과 메모를 남기면 저장할 수 있어요.</p>
        ) : null}
        <p className="customer-human-boundary">최종 판단은 사람이 해요.</p>
        <p className="customer-save-notice" role="status" aria-live="polite">{saveNotice}</p>
      </section>
    </main>
  );
}
