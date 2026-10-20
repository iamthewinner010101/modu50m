export const REHEARSAL_TARGET = 3;
export const REHEARSAL_MIN_SECONDS = 225;
export const REHEARSAL_MAX_SECONDS = 240;
export const QNA_TARGET = 8;
export const QNA_TOTAL = 10;
export const STUDENT_OWNERSHIP_MIN_CHARS = 20;
export const STUDENT_OWNERSHIP_CHECKPOINTS = [
  { key: 'problemScope', label: '왜 문제 범위를 마지막 30~50m로 좁혔는가' },
  { key: 'ruleScoreBoundary', label: '규칙 점수를 AI 확률이나 안전 점수로 부르지 않는 이유' },
  { key: 'aiAbstention', label: 'AI 판단보류를 사람 검수로 보내는 이유' },
  { key: 'codeAndCase', label: '직접 설명할 코드 경로와 대표 불일치 사례' },
];
export const STUDENT_OWNERSHIP_TARGET = STUDENT_OWNERSHIP_CHECKPOINTS.length;

function isValidPastDate(value) {
  const timestamp = Date.parse(value ?? '');
  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

export function createEmptyHumanCompletion() {
  return {
    schema: 'modu50m.human_completion_evidence.v1',
    presentation: {
      rehearsals: [],
      qnaCorrect: null,
      qnaTotal: QNA_TOTAL,
      qnaRecordedAt: '',
      offlineDemoCompleted: false,
      offlineDemoCompletedAt: '',
      offlineDemoNotes: '',
    },
    participantPhoto: {
      prepared: false,
      allParticipantsIncluded: false,
      participantCount: null,
      preparedAt: '',
      fileReference: '',
    },
    studentOwnership: {
      source: '',
      recordedAt: '',
      answers: Object.fromEntries(STUDENT_OWNERSHIP_CHECKPOINTS.map(({ key }) => [key, ''])),
    },
    teacherConfirmation: {
      confirmed: false,
      teacherName: '',
      confirmedAt: '',
      reference: '',
    },
    officialUpload: {
      uploaded: false,
      uploadedAt: '',
      receiptReference: '',
    },
    updatedAt: '',
  };
}

export function getHumanCompletionSummary(value) {
  const completion = value ?? createEmptyHumanCompletion();
  const presentation = completion.presentation ?? {};
  const validRehearsals = Array.isArray(presentation.rehearsals)
    ? presentation.rehearsals.filter(
        (run) =>
          Number.isFinite(Number(run?.durationSeconds)) &&
          Number(run.durationSeconds) >= 0 &&
          isValidPastDate(run?.startedAt) &&
          isValidPastDate(run?.completedAt) &&
          run?.source === 'in_app_rehearsal_timer',
      )
    : [];
  const latestRuns = validRehearsals.slice(-REHEARSAL_TARGET);
  const passingRehearsalCount = latestRuns.filter(
    (run) =>
      Number(run.durationSeconds) >= REHEARSAL_MIN_SECONDS &&
      Number(run.durationSeconds) <= REHEARSAL_MAX_SECONDS,
  ).length;
  const rehearsalReady =
    latestRuns.length === REHEARSAL_TARGET && passingRehearsalCount === REHEARSAL_TARGET;
  const hasQnaScore = presentation.qnaCorrect !== null && presentation.qnaCorrect !== '';
  const qnaCorrect = hasQnaScore ? Number(presentation.qnaCorrect) : Number.NaN;
  const qnaReady =
    Number.isInteger(qnaCorrect) &&
    qnaCorrect >= QNA_TARGET &&
    qnaCorrect <= QNA_TOTAL &&
    Number(presentation.qnaTotal) === QNA_TOTAL &&
    isValidPastDate(presentation.qnaRecordedAt);
  const offlineDemoReady = Boolean(
    presentation.offlineDemoCompleted &&
      isValidPastDate(presentation.offlineDemoCompletedAt) &&
      presentation.offlineDemoNotes?.trim().length >= 8,
  );
  const presentationReady = rehearsalReady && qnaReady && offlineDemoReady;

  const participantPhoto = completion.participantPhoto ?? {};
  const participantCount = Number(participantPhoto.participantCount);
  const participantPhotoReady = Boolean(
    participantPhoto.prepared &&
      participantPhoto.allParticipantsIncluded &&
      Number.isInteger(participantCount) &&
      participantCount >= 1 &&
      participantCount <= 3 &&
      isValidPastDate(participantPhoto.preparedAt) &&
      participantPhoto.fileReference?.trim().length >= 4,
  );

  const studentOwnership = completion.studentOwnership ?? {};
  const studentOwnershipAnswers = studentOwnership.answers ?? {};
  const studentOwnershipAnswerCount = STUDENT_OWNERSHIP_CHECKPOINTS.filter(
    ({ key }) => String(studentOwnershipAnswers[key] ?? '').trim().length >= STUDENT_OWNERSHIP_MIN_CHARS,
  ).length;
  const studentOwnershipReady = Boolean(
    studentOwnership.source === 'in_app_student_ownership' &&
      isValidPastDate(studentOwnership.recordedAt) &&
      studentOwnershipAnswerCount === STUDENT_OWNERSHIP_TARGET,
  );

  const teacher = completion.teacherConfirmation ?? {};
  const teacherConfirmationReady = Boolean(
    teacher.confirmed &&
      teacher.teacherName?.trim() &&
      isValidPastDate(teacher.confirmedAt) &&
      teacher.reference?.trim().length >= 4,
  );

  const upload = completion.officialUpload ?? {};
  const officialUploadReady = Boolean(
    upload.uploaded &&
      isValidPastDate(upload.uploadedAt) &&
      upload.receiptReference?.trim().length >= 4,
  );
  const officialSubmissionReady =
    presentationReady &&
    studentOwnershipReady &&
    participantPhotoReady &&
    teacherConfirmationReady &&
    officialUploadReady;

  return {
    validRehearsalCount: validRehearsals.length,
    consecutivePassingRehearsalCount: passingRehearsalCount,
    rehearsalReady,
    qnaCorrect: Number.isInteger(qnaCorrect) ? qnaCorrect : null,
    qnaReady,
    offlineDemoReady,
    presentationReady,
    studentOwnershipAnswerCount,
    studentOwnershipReady,
    participantPhotoReady,
    teacherConfirmationReady,
    officialUploadReady,
    officialSubmissionReady,
  };
}
