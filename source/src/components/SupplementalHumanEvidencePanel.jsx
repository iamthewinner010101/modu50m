import { useState } from 'react';

const SECOND_REVIEW_OPTIONS = [
  { value: 'confirmed', label: '1차 판정 확인' },
  { value: 'disputed', label: '1차 판정과 불일치' },
];

const FIELD_OUTCOME_OPTIONS = [
  { value: 'barrier_confirmed', label: '현장에서 장벽 확인' },
  { value: 'no_barrier', label: '현장에는 장벽 없음' },
  { value: 'condition_changed', label: '사진과 현장 상태가 달라짐' },
];

function formatEvidenceTime(value) {
  if (!value) return '기록 대기';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

function isPastLocalDateTime(value) {
  const timestamp = Date.parse(value ?? '');
  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

function getCurrentLocalDateTimeValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('현장 사진을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

export default function SupplementalHumanEvidencePanel({
  candidate,
  review,
  actor,
  onSubmitSecondReview,
  onSubmitFieldVerification,
}) {
  const [secondDecision, setSecondDecision] = useState('confirmed');
  const [secondMemo, setSecondMemo] = useState('');
  const [fieldOutcome, setFieldOutcome] = useState('barrier_confirmed');
  const [visitedAt, setVisitedAt] = useState('');
  const [fieldMemo, setFieldMemo] = useState('');
  const [fieldPhoto, setFieldPhoto] = useState({ name: '', dataUrl: '' });
  const [busyAction, setBusyAction] = useState('');
  const [notice, setNotice] = useState({ tone: '', text: '' });

  const primary = review?.primaryReviewEvidence ?? null;
  const second = review?.secondReviewEvidence ?? null;
  const field = review?.fieldVerificationEvidence ?? null;
  const latestAllowedVisit = getCurrentLocalDateTimeValue();
  const sameReviewer = Boolean(primary?.actorId && actor?.id && primary.actorId === actor.id);
  const canSubmitSecond = Boolean(
    primary?.actorId &&
      actor?.id &&
      !sameReviewer &&
      secondMemo.trim().length >= 8 &&
      !busyAction,
  );
  const canSubmitField = Boolean(
    primary?.actorId &&
      actor?.id &&
      isPastLocalDateTime(visitedAt) &&
      fieldMemo.trim().length >= 8 &&
      fieldPhoto.name &&
      fieldPhoto.dataUrl &&
      !busyAction,
  );

  async function handleSecondReview() {
    if (!canSubmitSecond) return;
    setBusyAction('second');
    setNotice({ tone: '', text: '' });
    try {
      await onSubmitSecondReview(candidate.id, {
        decision: secondDecision,
        memo: secondMemo.trim(),
      });
      setSecondMemo('');
      setNotice({ tone: 'success', text: '서로 다른 검수자 계정의 2차 검수 증거가 저장되었습니다.' });
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || '2차 검수 증거를 저장하지 못했습니다.' });
    } finally {
      setBusyAction('');
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setFieldPhoto({ name: '', dataUrl: '' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFieldPhoto({ name: '', dataUrl: '' });
      setNotice({ tone: 'error', text: '현장 사진은 이미지 파일만 사용할 수 있습니다.' });
      return;
    }
    if (file.size > 1_800_000) {
      setFieldPhoto({ name: '', dataUrl: '' });
      setNotice({ tone: 'error', text: '현장 사진은 1.8MB 이하로 줄여 주세요.' });
      return;
    }
    try {
      setFieldPhoto({ name: file.name.slice(0, 160), dataUrl: await readImageFile(file) });
      setNotice({ tone: '', text: '' });
    } catch (error) {
      setFieldPhoto({ name: '', dataUrl: '' });
      setNotice({ tone: 'error', text: error.message });
    }
  }

  async function handleFieldVerification() {
    if (!canSubmitField) return;
    const visitDate = new Date(visitedAt);
    if (Number.isNaN(visitDate.getTime()) || visitDate.getTime() > Date.now()) {
      setNotice({ tone: 'error', text: '실제로 방문한 과거 시각을 입력해 주세요.' });
      return;
    }
    setBusyAction('field');
    setNotice({ tone: '', text: '' });
    try {
      await onSubmitFieldVerification(candidate.id, {
        outcome: fieldOutcome,
        memo: fieldMemo.trim(),
        visitedAt: visitDate.toISOString(),
        photoName: fieldPhoto.name,
        photoDataUrl: fieldPhoto.dataUrl,
      });
      setVisitedAt('');
      setFieldMemo('');
      setFieldPhoto({ name: '', dataUrl: '' });
      setNotice({ tone: 'success', text: '방문 시각, 현장 사진, 판정이 함께 저장되었습니다.' });
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || '현장 확인 증거를 저장하지 못했습니다.' });
    } finally {
      setBusyAction('');
    }
  }

  return (
    <section className="supplemental-evidence" aria-label="독립 검수와 현장 확인 증거">
      <div className="supplemental-evidence-heading">
        <div>
          <span>사람 증거 원본</span>
          <strong>누가, 언제, 무엇을 확인했는지 서버에 남깁니다</strong>
        </div>
        <em>{actor ? `${actor.displayName} · ${actor.role}` : '서버 계정 연결 대기'}</em>
      </div>

      <div className="human-evidence-status-row">
        <div className={primary ? 'complete' : 'pending'}>
          <span>1차 직접 검수</span>
          <strong>{primary ? primary.displayName : '태윤 검수 대기'}</strong>
          <small>{primary ? formatEvidenceTime(primary.reviewedAt) : '판정 저장 후 자동 기록'}</small>
        </div>
        <div className={second ? 'complete' : 'pending'}>
          <span>독립 2차 검수</span>
          <strong>{second ? second.displayName : '다른 계정 검수 대기'}</strong>
          <small>{second ? formatEvidenceTime(second.reviewedAt) : '같은 계정은 저장 불가'}</small>
        </div>
        <div className={field ? 'complete' : 'pending'}>
          <span>현장 확인</span>
          <strong>{field ? field.displayName : '현장 방문 대기'}</strong>
          <small>{field ? formatEvidenceTime(field.visitedAt) : '방문 시각과 사진 필수'}</small>
        </div>
      </div>

      <div className="supplemental-evidence-forms">
        <form onSubmit={(event) => event.preventDefault()} aria-label="독립 2차 검수 입력">
          <div className="evidence-form-title">
            <span>독립 2차 검수</span>
            <strong>1차 검수자와 다른 계정만 저장 가능</strong>
          </div>
          {second ? (
            <div className="stored-evidence-summary">
              <strong>{SECOND_REVIEW_OPTIONS.find((item) => item.value === second.decision)?.label}</strong>
              <p>{second.memo}</p>
              <small>{second.displayName} · {formatEvidenceTime(second.reviewedAt)}</small>
            </div>
          ) : (
            <>
              <label>
                <span>2차 판정</span>
                <select value={secondDecision} onChange={(event) => setSecondDecision(event.target.value)}>
                  {SECOND_REVIEW_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>독립 판단 근거</span>
                <textarea
                  rows="3"
                  value={secondMemo}
                  onChange={(event) => setSecondMemo(event.target.value)}
                  placeholder="1차 판정과 같거나 다른 이유를 8자 이상 적습니다."
                />
              </label>
              <button type="button" disabled={!canSubmitSecond} onClick={handleSecondReview}>
                {busyAction === 'second' ? '저장 중' : '2차 검수 증거 저장'}
              </button>
              <small className={sameReviewer ? 'blocking' : ''}>
                {!primary
                  ? '먼저 1차 판정을 저장해야 합니다.'
                  : sameReviewer
                    ? '현재 계정은 1차 검수자입니다. 다른 검수자 계정으로 다시 접속하세요.'
                    : '현재 계정은 1차 검수자와 다릅니다.'}
              </small>
            </>
          )}
        </form>

        <form onSubmit={(event) => event.preventDefault()} aria-label="현장 확인 입력">
          <div className="evidence-form-title">
            <span>현장 확인</span>
            <strong>실제 방문 시각, 사진, 결과를 한 묶음으로 저장</strong>
          </div>
          {field ? (
            <div className="stored-evidence-summary">
              <strong>{FIELD_OUTCOME_OPTIONS.find((item) => item.value === field.outcome)?.label}</strong>
              <p>{field.memo}</p>
              <small>{field.displayName} · 방문 {formatEvidenceTime(field.visitedAt)} · {field.photoName}</small>
            </div>
          ) : (
            <>
              <label>
                <span>현장 판정</span>
                <select value={fieldOutcome} onChange={(event) => setFieldOutcome(event.target.value)}>
                  {FIELD_OUTCOME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>실제 방문 시각</span>
                <input type="datetime-local" max={latestAllowedVisit} value={visitedAt} onChange={(event) => setVisitedAt(event.target.value)} />
              </label>
              <label>
                <span>현장 사진</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
                <small>{fieldPhoto.name || '1.8MB 이하 이미지 1장'}</small>
              </label>
              <label>
                <span>현장 판단 근거</span>
                <textarea
                  rows="3"
                  value={fieldMemo}
                  onChange={(event) => setFieldMemo(event.target.value)}
                  placeholder="사진에서 보이는 장벽과 통과 가능성을 8자 이상 적습니다."
                />
              </label>
              <button type="button" disabled={!canSubmitField} onClick={handleFieldVerification}>
                {busyAction === 'field' ? '저장 중' : '현장 확인 증거 저장'}
              </button>
              <small>현장 사진은 제출 증거 JSON과 서버 검수 기록에 포함됩니다.</small>
            </>
          )}
        </form>
      </div>

      {notice.text ? <p className={`supplemental-evidence-notice ${notice.tone}`}>{notice.text}</p> : null}
    </section>
  );
}
