import { useEffect, useState } from 'react';
import { createEmptyHumanCompletion, QNA_TOTAL } from './humanCompletion';

function readCompletion(storageKey) {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return createEmptyHumanCompletion();
    return { ...createEmptyHumanCompletion(), ...JSON.parse(saved) };
  } catch {
    return createEmptyHumanCompletion();
  }
}

export function useHumanCompletionStore(storageKey) {
  const [completion, setCompletion] = useState(() => readCompletion(storageKey));

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(completion));
  }, [completion, storageKey]);

  function addRehearsal({ startedAt, completedAt, durationSeconds }) {
    setCompletion((current) => ({
      ...current,
      presentation: {
        ...current.presentation,
        rehearsals: [
          ...(current.presentation?.rehearsals ?? []),
          {
            sequence: (current.presentation?.rehearsals?.length ?? 0) + 1,
            startedAt,
            completedAt,
            durationSeconds,
            source: 'in_app_rehearsal_timer',
          },
        ],
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function recordQna(qnaCorrect) {
    const score = Number(qnaCorrect);
    if (!Number.isInteger(score) || score < 0 || score > QNA_TOTAL) return false;
    setCompletion((current) => ({
      ...current,
      presentation: {
        ...current.presentation,
        qnaCorrect: score,
        qnaTotal: QNA_TOTAL,
        qnaRecordedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }));
    return true;
  }

  function recordOfflineDemo({ completed, notes }) {
    setCompletion((current) => ({
      ...current,
      presentation: {
        ...current.presentation,
        offlineDemoCompleted: Boolean(completed),
        offlineDemoCompletedAt: completed ? new Date().toISOString() : '',
        offlineDemoNotes: completed ? String(notes ?? '').trim() : '',
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function recordTeacherConfirmation(payload) {
    setCompletion((current) => ({
      ...current,
      teacherConfirmation: {
        confirmed: Boolean(payload.confirmed),
        teacherName: String(payload.teacherName ?? '').trim(),
        confirmedAt: payload.confirmedAt ?? '',
        reference: String(payload.reference ?? '').trim(),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function recordParticipantPhoto(payload) {
    setCompletion((current) => ({
      ...current,
      participantPhoto: {
        prepared: Boolean(payload.prepared),
        allParticipantsIncluded: Boolean(payload.allParticipantsIncluded),
        participantCount: Number(payload.participantCount),
        preparedAt: payload.preparedAt ?? '',
        fileReference: String(payload.fileReference ?? '').trim(),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function recordStudentOwnership(answers) {
    setCompletion((current) => ({
      ...current,
      studentOwnership: {
        source: 'in_app_student_ownership',
        recordedAt: new Date().toISOString(),
        answers: Object.fromEntries(
          Object.entries(answers ?? {}).map(([key, value]) => [key, String(value ?? '').trim()]),
        ),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function recordOfficialUpload(payload) {
    setCompletion((current) => ({
      ...current,
      officialUpload: {
        uploaded: Boolean(payload.uploaded),
        uploadedAt: payload.uploadedAt ?? '',
        receiptReference: String(payload.receiptReference ?? '').trim(),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  return [
    completion,
    {
      addRehearsal,
      recordQna,
      recordOfflineDemo,
      recordStudentOwnership,
      recordParticipantPhoto,
      recordTeacherConfirmation,
      recordOfficialUpload,
    },
  ];
}
