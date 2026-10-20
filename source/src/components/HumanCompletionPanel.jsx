import { useEffect, useRef, useState } from 'react';
import {
  getHumanCompletionSummary,
  QNA_TARGET,
  QNA_TOTAL,
  REHEARSAL_MAX_SECONDS,
  REHEARSAL_MIN_SECONDS,
  REHEARSAL_TARGET,
  STUDENT_OWNERSHIP_CHECKPOINTS,
  STUDENT_OWNERSHIP_MIN_CHARS,
  STUDENT_OWNERSHIP_TARGET,
} from '../utils/humanCompletion';

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDateTime(value) {
  if (!value) return '기록 대기';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
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

export default function HumanCompletionPanel({ completion, actions }) {
  const [timerStartedAt, setTimerStartedAt] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [qnaScore, setQnaScore] = useState(
    completion.presentation?.qnaCorrect === null ? '' : String(completion.presentation?.qnaCorrect ?? ''),
  );
  const [offlineConfirmed, setOfflineConfirmed] = useState(false);
  const [offlineNotes, setOfflineNotes] = useState('');
  const [ownershipAnswers, setOwnershipAnswers] = useState(() =>
    Object.fromEntries(
      STUDENT_OWNERSHIP_CHECKPOINTS.map(({ key }) => [
        key,
        completion.studentOwnership?.answers?.[key] ?? '',
      ]),
    ),
  );
  const [photoForm, setPhotoForm] = useState({
    prepared: Boolean(completion.participantPhoto?.prepared),
    allParticipantsIncluded: Boolean(completion.participantPhoto?.allParticipantsIncluded),
    participantCount: completion.participantPhoto?.participantCount ?? '',
    preparedAt: '',
    fileReference: completion.participantPhoto?.fileReference ?? '',
  });
  const [teacherForm, setTeacherForm] = useState({
    confirmed: Boolean(completion.teacherConfirmation?.confirmed),
    teacherName: completion.teacherConfirmation?.teacherName ?? '',
    confirmedAt: '',
    reference: completion.teacherConfirmation?.reference ?? '',
  });
  const [uploadForm, setUploadForm] = useState({
    uploaded: Boolean(completion.officialUpload?.uploaded),
    uploadedAt: '',
    receiptReference: completion.officialUpload?.receiptReference ?? '',
  });
  const startedTimestampRef = useRef(0);
  const summary = getHumanCompletionSummary(completion);
  const rehearsals = completion.presentation?.rehearsals ?? [];
  const latestRuns = rehearsals.slice(-REHEARSAL_TARGET);
  const latestAllowedDateTime = getCurrentLocalDateTimeValue();
  const parsedQnaScore = Number(qnaScore);
  const qnaCanSave =
    qnaScore !== '' &&
    Number.isInteger(parsedQnaScore) &&
    parsedQnaScore >= 0 &&
    parsedQnaScore <= QNA_TOTAL;

  useEffect(() => {
    if (!timerStartedAt) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedTimestampRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [timerStartedAt]);

  function startTimer() {
    const now = new Date();
    startedTimestampRef.current = now.getTime();
    setTimerStartedAt(now.toISOString());
    setElapsedSeconds(0);
  }

  function stopTimer() {
    if (!timerStartedAt) return;
    const completedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - startedTimestampRef.current) / 1000),
    );
    actions.addRehearsal({
      startedAt: timerStartedAt,
      completedAt: completedAt.toISOString(),
      durationSeconds,
    });
    setTimerStartedAt('');
    setElapsedSeconds(0);
  }

  function recordQna() {
    if (!qnaCanSave) return;
    actions.recordQna(qnaScore);
  }

  function recordOfflineDemo() {
    if (!offlineConfirmed || offlineNotes.trim().length < 8) return;
    actions.recordOfflineDemo({ completed: true, notes: offlineNotes });
    setOfflineConfirmed(false);
    setOfflineNotes('');
  }

  function recordTeacher() {
    if (
      !teacherForm.confirmed ||
      !teacherForm.teacherName.trim() ||
      !isPastLocalDateTime(teacherForm.confirmedAt) ||
      teacherForm.reference.trim().length < 4
    ) return;
    actions.recordTeacherConfirmation({
      ...teacherForm,
      confirmedAt: new Date(teacherForm.confirmedAt).toISOString(),
    });
  }

  function recordParticipantPhoto() {
    const participantCount = Number(photoForm.participantCount);
    if (
      !photoForm.prepared ||
      !photoForm.allParticipantsIncluded ||
      !Number.isInteger(participantCount) ||
      participantCount < 1 ||
      participantCount > 3 ||
      !isPastLocalDateTime(photoForm.preparedAt) ||
      photoForm.fileReference.trim().length < 4
    ) return;
    actions.recordParticipantPhoto({
      ...photoForm,
      participantCount,
      preparedAt: new Date(photoForm.preparedAt).toISOString(),
    });
  }

  function recordStudentOwnership() {
    if (!ownershipCanSave) return;
    actions.recordStudentOwnership(ownershipAnswers);
  }

  function recordUpload() {
    if (
      !uploadForm.uploaded ||
      !isPastLocalDateTime(uploadForm.uploadedAt) ||
      uploadForm.receiptReference.trim().length < 4
    ) return;
    actions.recordOfficialUpload({
      ...uploadForm,
      uploadedAt: new Date(uploadForm.uploadedAt).toISOString(),
    });
  }

  const teacherCanSave = Boolean(
    teacherForm.confirmed &&
      teacherForm.teacherName.trim() &&
      isPastLocalDateTime(teacherForm.confirmedAt) &&
      teacherForm.reference.trim().length >= 4,
  );
  const participantCount = Number(photoForm.participantCount);
  const photoCanSave = Boolean(
    photoForm.prepared &&
      photoForm.allParticipantsIncluded &&
      Number.isInteger(participantCount) &&
      participantCount >= 1 &&
      participantCount <= 3 &&
      isPastLocalDateTime(photoForm.preparedAt) &&
      photoForm.fileReference.trim().length >= 4,
  );
  const ownershipCanSave = STUDENT_OWNERSHIP_CHECKPOINTS.every(
    ({ key }) => ownershipAnswers[key].trim().length >= STUDENT_OWNERSHIP_MIN_CHARS,
  );
  const uploadCanSave = Boolean(
    uploadForm.uploaded &&
      isPastLocalDateTime(uploadForm.uploadedAt) &&
      uploadForm.receiptReference.trim().length >= 4,
  );

  return (
    <section className="human-completion-panel" aria-label="발표와 공식 제출 사람 증거">
      <header>
        <div>
          <span>사람 완료 증거</span>
          <strong>발표 연습부터 공식 업로드까지 실제 기록만 반영</strong>
        </div>
        <em>{summary.officialSubmissionReady ? '공식 제출 증거 PASS' : 'PENDING'}</em>
      </header>

      <div className="human-completion-status">
        <div className={summary.rehearsalReady ? 'ready' : 'pending'}>
          <span>4분 발표</span>
          <strong>{summary.consecutivePassingRehearsalCount}/{REHEARSAL_TARGET}</strong>
          <small>최근 3회 모두 03:45~04:00</small>
        </div>
        <div className={summary.qnaReady ? 'ready' : 'pending'}>
          <span>무작위 Q&A</span>
          <strong>{summary.qnaCorrect ?? 0}/{QNA_TOTAL}</strong>
          <small>{QNA_TARGET}개 이상 정답</small>
        </div>
        <div className={summary.offlineDemoReady ? 'ready' : 'pending'}>
          <span>오프라인 시연</span>
          <strong>{summary.offlineDemoReady ? 'PASS' : '0/1'}</strong>
          <small>대표 사례 3건·새 브라우저</small>
        </div>
        <div className={summary.studentOwnershipReady ? 'ready' : 'pending'}>
          <span>학생 소유권</span>
          <strong>{summary.studentOwnershipAnswerCount}/{STUDENT_OWNERSHIP_TARGET}</strong>
          <small>태윤의 설계 선택·코드 설명</small>
        </div>
        <div className={summary.participantPhotoReady ? 'ready' : 'pending'}>
          <span>참가자 사진</span>
          <strong>{summary.participantPhotoReady ? 'PASS' : 'PENDING'}</strong>
          <small>팀원 전원·인원·파일 참조</small>
        </div>
        <div className={summary.teacherConfirmationReady ? 'ready' : 'pending'}>
          <span>지도교사 확인</span>
          <strong>{summary.teacherConfirmationReady ? 'PASS' : 'PENDING'}</strong>
          <small>교사명·시각·확인 참조</small>
        </div>
        <div className={summary.officialUploadReady ? 'ready' : 'pending'}>
          <span>공식 업로드</span>
          <strong>{summary.officialUploadReady ? 'PASS' : 'PENDING'}</strong>
          <small>업로드 시각·접수 참조</small>
        </div>
      </div>

      <div className="rehearsal-recorder">
        <div className="rehearsal-clock" aria-live="polite">
          <span>발표 타이머</span>
          <strong>{formatDuration(elapsedSeconds)}</strong>
          <small>합격 구간 {formatDuration(REHEARSAL_MIN_SECONDS)}~{formatDuration(REHEARSAL_MAX_SECONDS)}</small>
        </div>
        <button type="button" onClick={timerStartedAt ? stopTimer : startTimer}>
          {timerStartedAt ? '발표 종료·기록' : '발표 시작'}
        </button>
        <ol aria-label="최근 발표 연습 기록">
          {latestRuns.map((run) => {
            const passed =
              run.durationSeconds >= REHEARSAL_MIN_SECONDS &&
              run.durationSeconds <= REHEARSAL_MAX_SECONDS;
            return (
              <li key={`${run.sequence}-${run.completedAt}`} className={passed ? 'ready' : 'pending'}>
                <span>{run.sequence}회</span>
                <strong>{formatDuration(run.durationSeconds)}</strong>
                <small>{passed ? '시간 PASS' : '시간 범위 밖'} · {formatDateTime(run.completedAt)}</small>
              </li>
            );
          })}
          {latestRuns.length === 0 ? <li className="pending"><strong>발표 기록 대기</strong></li> : null}
        </ol>
      </div>

      <div className="student-ownership-recorder">
        <header>
          <div>
            <strong>태윤의 설계 선택 4문항</strong>
            <small>각 답변을 자기 말로 {STUDENT_OWNERSHIP_MIN_CHARS}자 이상 작성</small>
          </div>
          <em>{summary.studentOwnershipReady ? '4/4 PASS' : `${summary.studentOwnershipAnswerCount}/4 PENDING`}</em>
        </header>
        <div>
          {STUDENT_OWNERSHIP_CHECKPOINTS.map(({ key, label }) => (
            <label key={key}>
              <span>{label}</span>
              <textarea
                rows="2"
                value={ownershipAnswers[key]}
                onChange={(event) => setOwnershipAnswers((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
        </div>
        <button type="button" disabled={!ownershipCanSave} onClick={recordStudentOwnership}>태윤 설계 설명 저장</button>
      </div>

      <div className="human-completion-forms">
        <form onSubmit={(event) => event.preventDefault()}>
          <strong>Q&A와 오프라인 시연</strong>
          <label>
            <span>무작위 Q&A 정답 수</span>
            <input type="number" min="0" max={QNA_TOTAL} value={qnaScore} onChange={(event) => setQnaScore(event.target.value)} />
          </label>
          <button type="button" disabled={!qnaCanSave} onClick={recordQna}>Q&A 점수 기록</button>
          <label className="completion-checkbox">
            <input type="checkbox" checked={offlineConfirmed} onChange={(event) => setOfflineConfirmed(event.target.checked)} />
            <span>인터넷 없이 대표 사례 3건과 새 브라우저 90초 시연을 직접 완료함</span>
          </label>
          <label>
            <span>시연 결과 메모</span>
            <textarea rows="2" value={offlineNotes} onChange={(event) => setOfflineNotes(event.target.value)} />
          </label>
          <button type="button" disabled={!offlineConfirmed || offlineNotes.trim().length < 8} onClick={recordOfflineDemo}>오프라인 시연 기록</button>
        </form>

        <form onSubmit={(event) => event.preventDefault()}>
          <strong>참가자 사진</strong>
          <label className="completion-checkbox">
            <input type="checkbox" checked={photoForm.prepared} onChange={(event) => setPhotoForm((current) => ({ ...current, prepared: event.target.checked }))} />
            <span>본인 확인용 참가자 사진 파일을 실제 준비함</span>
          </label>
          <label className="completion-checkbox">
            <input type="checkbox" checked={photoForm.allParticipantsIncluded} onChange={(event) => setPhotoForm((current) => ({ ...current, allParticipantsIncluded: event.target.checked }))} />
            <span>팀원 전원이 사진에 포함됐는지 확인함</span>
          </label>
          <label>
            <span>사진에 포함된 참가자 수</span>
            <input type="number" min="1" max="3" value={photoForm.participantCount} onChange={(event) => setPhotoForm((current) => ({ ...current, participantCount: event.target.value }))} />
          </label>
          <label>
            <span>파일 준비 확인 시각</span>
            <input type="datetime-local" max={latestAllowedDateTime} value={photoForm.preparedAt} onChange={(event) => setPhotoForm((current) => ({ ...current, preparedAt: event.target.value }))} />
          </label>
          <label>
            <span>사진 파일 참조</span>
            <input value={photoForm.fileReference} onChange={(event) => setPhotoForm((current) => ({ ...current, fileReference: event.target.value }))} placeholder="예: participant-photo-taeyun.jpg" />
          </label>
          <button type="button" disabled={!photoCanSave} onClick={recordParticipantPhoto}>참가자 사진 준비 저장</button>
        </form>

        <form onSubmit={(event) => event.preventDefault()}>
          <strong>지도교사 확인</strong>
          <label className="completion-checkbox">
            <input type="checkbox" checked={teacherForm.confirmed} onChange={(event) => setTeacherForm((current) => ({ ...current, confirmed: event.target.checked }))} />
            <span>지도교사가 제출 패키지를 실제로 확인함</span>
          </label>
          <label>
            <span>지도교사 이름</span>
            <input value={teacherForm.teacherName} onChange={(event) => setTeacherForm((current) => ({ ...current, teacherName: event.target.value }))} />
          </label>
          <label>
            <span>확인 시각</span>
            <input type="datetime-local" max={latestAllowedDateTime} value={teacherForm.confirmedAt} onChange={(event) => setTeacherForm((current) => ({ ...current, confirmedAt: event.target.value }))} />
          </label>
          <label>
            <span>확인 참조</span>
            <input value={teacherForm.reference} onChange={(event) => setTeacherForm((current) => ({ ...current, reference: event.target.value }))} placeholder="확인서 파일명 또는 서명 위치" />
          </label>
          <button type="button" disabled={!teacherCanSave} onClick={recordTeacher}>지도교사 확인 저장</button>
        </form>

        <form onSubmit={(event) => event.preventDefault()}>
          <strong>공식 업로드</strong>
          <label className="completion-checkbox">
            <input type="checkbox" checked={uploadForm.uploaded} onChange={(event) => setUploadForm((current) => ({ ...current, uploaded: event.target.checked }))} />
            <span>공식 접수 페이지 업로드와 제출 완료 화면을 직접 확인함</span>
          </label>
          <label>
            <span>업로드 완료 시각</span>
            <input type="datetime-local" max={latestAllowedDateTime} value={uploadForm.uploadedAt} onChange={(event) => setUploadForm((current) => ({ ...current, uploadedAt: event.target.value }))} />
          </label>
          <label>
            <span>접수 참조</span>
            <input value={uploadForm.receiptReference} onChange={(event) => setUploadForm((current) => ({ ...current, receiptReference: event.target.value }))} placeholder="접수번호 또는 완료 화면 파일명" />
          </label>
          <button type="button" disabled={!uploadCanSave} onClick={recordUpload}>공식 업로드 증거 저장</button>
        </form>
      </div>
    </section>
  );
}
