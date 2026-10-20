export const DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA =
  'modu50m.daejeon_candidate_review_ledger.v1';

export const DAEJEON_CANDIDATE_REVIEW_LEDGER_STORAGE_KEY =
  'modu50m-daejeon-candidate-review-ledger-v1';

export const PLACE_MATCH_STATUS_OPTIONS = Object.freeze([
  { value: 'unchecked', label: '확인 전' },
  { value: 'appears_match', label: '사진상 일치로 보임' },
  { value: 'appears_mismatch', label: '사진상 불일치로 보임' },
  { value: 'uncertain', label: '판단 보류' },
]);

export const ACCESSIBILITY_STATUS_OPTIONS = Object.freeze([
  { value: 'unchecked', label: '확인 전' },
  { value: 'appears_passable', label: '화면상 통행 가능해 보임' },
  { value: 'barrier_observed', label: '장애물로 보이는 요소 관찰' },
  { value: 'uncertain', label: '판단 보류' },
]);

export const STUDENT_REVIEW_STATUS_OPTIONS = Object.freeze([
  { value: 'unchecked', label: '태윤 직접 검수 전' },
  { value: 'reviewed_by_taeyun', label: '태윤 직접 검수 기록' },
]);

export const INDEPENDENT_REVIEW_STATUS_OPTIONS = Object.freeze([
  { value: 'unchecked', label: '독립 검수 전' },
  { value: 'reviewed_by_other', label: '다른 사람의 독립 검수 기록' },
]);

export const FIELD_CHECK_STATUS_OPTIONS = Object.freeze([
  { value: 'unchecked', label: '현장 확인 전' },
  { value: 'visit_needed', label: '현장 확인 필요' },
  { value: 'visited', label: '현장 방문 기록 있음' },
]);

const STATUS_SETS = Object.freeze({
  placeMatchStatus: new Set(PLACE_MATCH_STATUS_OPTIONS.map((option) => option.value)),
  accessibilityStatus: new Set(ACCESSIBILITY_STATUS_OPTIONS.map((option) => option.value)),
  studentReviewStatus: new Set(STUDENT_REVIEW_STATUS_OPTIONS.map((option) => option.value)),
  independentReviewStatus: new Set(INDEPENDENT_REVIEW_STATUS_OPTIONS.map((option) => option.value)),
  fieldCheckStatus: new Set(FIELD_CHECK_STATUS_OPTIONS.map((option) => option.value)),
});

const STATUS_ERROR_LABELS = Object.freeze({
  placeMatchStatus: '장소 일치 상태',
  accessibilityStatus: '접근성 상태',
  studentReviewStatus: '태윤 직접 검수 상태',
  independentReviewStatus: '독립 검수 상태',
  fieldCheckStatus: '현장 확인 상태',
});

const EVIDENCE_BOUNDARY = Object.freeze({
  claim: 'human_entered_observation_not_verified_fact',
  identityVerified: false,
  automaticVerification: false,
});

const EMPTY_REVIEW = Object.freeze({
  placeMatchStatus: 'unchecked',
  placeMatchNote: '',
  accessibilityStatus: 'unchecked',
  accessibilityNote: '',
  studentReviewStatus: 'unchecked',
  studentReviewNote: '',
  independentReviewStatus: 'unchecked',
  independentReviewerName: '',
  independentReviewNote: '',
  fieldCheckStatus: 'unchecked',
  fieldVisitedOn: '',
  fieldCheckNote: '',
  generalNote: '',
});

const TEXT_LIMITS = Object.freeze({
  recordedBy: 80,
  independentReviewerName: 80,
  note: 2000,
});

function cleanText(value, maxLength = TEXT_LIMITS.note) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function resolveNow(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) throw new Error('저장 시각이 올바르지 않습니다.');
  return date.toISOString();
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getSeoulCalendarDate(timestamp) {
  return new Date(new Date(timestamp).getTime() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10);
}

function normalizeReview(review = {}) {
  const normalized = {
    placeMatchStatus: cleanText(review.placeMatchStatus, 40) || EMPTY_REVIEW.placeMatchStatus,
    placeMatchNote: cleanText(review.placeMatchNote),
    accessibilityStatus: cleanText(review.accessibilityStatus, 40) || EMPTY_REVIEW.accessibilityStatus,
    accessibilityNote: cleanText(review.accessibilityNote),
    studentReviewStatus: cleanText(review.studentReviewStatus, 40) || EMPTY_REVIEW.studentReviewStatus,
    studentReviewNote: cleanText(review.studentReviewNote),
    independentReviewStatus:
      cleanText(review.independentReviewStatus, 40) || EMPTY_REVIEW.independentReviewStatus,
    independentReviewerName: cleanText(
      review.independentReviewerName,
      TEXT_LIMITS.independentReviewerName,
    ),
    independentReviewNote: cleanText(review.independentReviewNote),
    fieldCheckStatus: cleanText(review.fieldCheckStatus, 40) || EMPTY_REVIEW.fieldCheckStatus,
    fieldVisitedOn: cleanText(review.fieldVisitedOn, 10),
    fieldCheckNote: cleanText(review.fieldCheckNote),
    generalNote: cleanText(review.generalNote),
  };

  if (normalized.placeMatchStatus === 'unchecked') normalized.placeMatchNote = '';
  if (normalized.accessibilityStatus === 'unchecked') normalized.accessibilityNote = '';
  if (normalized.studentReviewStatus === 'unchecked') normalized.studentReviewNote = '';
  if (normalized.independentReviewStatus === 'unchecked') {
    normalized.independentReviewerName = '';
    normalized.independentReviewNote = '';
  }
  if (normalized.fieldCheckStatus !== 'visited') normalized.fieldVisitedOn = '';
  if (normalized.fieldCheckStatus === 'unchecked') normalized.fieldCheckNote = '';

  return normalized;
}

function validateReview(review, recordedBy, { savedAt = null } = {}) {
  const errors = [];
  const cleanRecordedBy = cleanText(recordedBy, TEXT_LIMITS.recordedBy);

  if (cleanRecordedBy.length < 2) errors.push('이번 기록 저장자 이름을 두 글자 이상 입력해 주세요.');

  Object.entries(STATUS_SETS).forEach(([field, allowed]) => {
    if (!allowed.has(review[field])) errors.push(`${STATUS_ERROR_LABELS[field]} 값이 올바르지 않습니다.`);
  });

  if (review.placeMatchStatus !== 'unchecked' && review.placeMatchNote.length < 8) {
    errors.push('장소 일치 판단 근거를 8자 이상 적어 주세요.');
  }
  if (review.accessibilityStatus !== 'unchecked' && review.accessibilityNote.length < 8) {
    errors.push('접근성 관찰 근거를 8자 이상 적어 주세요.');
  }
  if (review.studentReviewStatus === 'reviewed_by_taeyun' && review.studentReviewNote.length < 10) {
    errors.push('태윤 직접 검수 메모를 10자 이상 태윤의 말로 적어 주세요.');
  }
  if (
    review.studentReviewStatus === 'reviewed_by_taeyun'
    && !['태윤', '허태윤'].includes(cleanRecordedBy.replaceAll(' ', ''))
  ) {
    errors.push('태윤 직접 검수 기록의 저장자는 태윤 또는 허태윤으로 입력해 주세요.');
  }
  if (review.independentReviewStatus === 'reviewed_by_other') {
    if (review.independentReviewerName.length < 2) {
      errors.push('독립 검수자 이름을 두 글자 이상 입력해 주세요.');
    }
    if (review.independentReviewNote.length < 10) {
      errors.push('독립 검수 메모를 10자 이상 적어 주세요.');
    }
    if (review.independentReviewerName.replaceAll(' ', '').includes('태윤')) {
      errors.push('독립 검수자는 태윤과 다른 사람이어야 합니다.');
    }
  }
  if (review.fieldCheckStatus === 'visited') {
    if (!isCalendarDate(review.fieldVisitedOn)) errors.push('현장 방문일을 날짜 형식으로 입력해 주세요.');
    if (
      isCalendarDate(review.fieldVisitedOn)
      && savedAt
      && review.fieldVisitedOn > getSeoulCalendarDate(savedAt)
    ) {
      errors.push('현장 방문일은 저장 시각보다 미래일 수 없습니다.');
    }
    if (review.fieldCheckNote.length < 10) {
      errors.push('현장 확인 메모를 10자 이상 적고 사진 파일명 같은 근거를 남겨 주세요.');
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));
  return cleanRecordedBy;
}

function candidateSnapshot(candidate) {
  return {
    name: cleanText(candidate?.name, 200),
    sourceRecordId: cleanText(candidate?.sourceRecordId, 200),
    lat: Number.isFinite(Number(candidate?.lat)) ? Number(candidate.lat) : null,
    lng: Number.isFinite(Number(candidate?.lng)) ? Number(candidate.lng) : null,
  };
}

function assertLedgerShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('검수 원장 JSON 객체가 필요합니다.');
  }
  if (value.schema !== DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA) {
    throw new Error(`지원하지 않는 검수 원장 형식입니다: ${value.schema ?? 'schema 없음'}`);
  }
  if (!value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) {
    throw new Error('검수 원장 entries 객체가 없습니다.');
  }
}

function normalizeImportedHistory(history, candidateId) {
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error(`${candidateId}: 명시적 저장 이력이 없습니다.`);
  }

  return history.map((event, index) => {
    const revision = Number(event?.revision);
    const savedAt = event?.savedAt;
    const savedBy = cleanText(event?.savedBy, TEXT_LIMITS.recordedBy);
    const review = normalizeReview(event?.review);
    if (event?.action !== 'explicit_form_save') {
      throw new Error(`${candidateId}: 명시적 폼 저장이 아닌 이력이 포함되어 있습니다.`);
    }
    if (!Number.isInteger(revision) || revision !== index + 1) {
      throw new Error(`${candidateId}: 저장 이력 revision이 연속적이지 않습니다.`);
    }
    if (!isIsoTimestamp(savedAt)) throw new Error(`${candidateId}: 저장 이력 시각이 올바르지 않습니다.`);
    validateReview(review, savedBy, { savedAt });
    return {
      revision,
      action: 'explicit_form_save',
      savedAt: new Date(savedAt).toISOString(),
      savedBy,
      review,
    };
  });
}

function normalizeImportedEntry(key, entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${key}: 검수 기록 객체가 올바르지 않습니다.`);
  }
  if (entry.candidateId !== key) throw new Error(`${key}: 후보 ID와 기록 키가 다릅니다.`);

  const candidateId = cleanText(entry.candidateId, 240);
  const savedAt = entry.savedAt;
  const savedBy = cleanText(entry.savedBy, TEXT_LIMITS.recordedBy);
  const review = normalizeReview(entry.review);
  const history = normalizeImportedHistory(entry.history, candidateId);
  const revision = Number(entry.revision);

  validateReview(review, savedBy, { savedAt });
  if (!Number.isInteger(revision) || revision !== history.length) {
    throw new Error(`${candidateId}: 현재 revision과 저장 이력이 일치하지 않습니다.`);
  }
  if (!isIsoTimestamp(savedAt)) throw new Error(`${candidateId}: 최근 저장 시각이 올바르지 않습니다.`);
  if (history.at(-1).savedAt !== new Date(savedAt).toISOString()) {
    throw new Error(`${candidateId}: 최근 저장 시각과 마지막 이력이 일치하지 않습니다.`);
  }
  if (JSON.stringify(history.at(-1).review) !== JSON.stringify(review)) {
    throw new Error(`${candidateId}: 현재 상태와 마지막 저장 이력이 일치하지 않습니다.`);
  }

  return {
    candidateId,
    candidate: {
      name: cleanText(entry.candidate?.name, 200),
      sourceRecordId: cleanText(entry.candidate?.sourceRecordId, 200),
      lat: Number.isFinite(Number(entry.candidate?.lat)) ? Number(entry.candidate.lat) : null,
      lng: Number.isFinite(Number(entry.candidate?.lng)) ? Number(entry.candidate.lng) : null,
    },
    review,
    revision,
    savedAt: new Date(savedAt).toISOString(),
    savedBy,
    evidenceBoundary: { ...EVIDENCE_BOUNDARY },
    history,
  };
}

export function createEmptyDaejeonCandidateReviewLedger() {
  return {
    schema: DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA,
    updatedAt: null,
    evidenceBoundary: { ...EVIDENCE_BOUNDARY },
    entries: {},
  };
}

export function createDaejeonCandidateReviewDraft(candidate, entry = null) {
  return {
    candidateId: candidate?.id ?? '',
    recordedBy: entry?.savedBy ?? '',
    ...normalizeReview(entry?.review ?? EMPTY_REVIEW),
  };
}

export function saveDaejeonCandidateReview(ledger, candidate, draft, options = {}) {
  if (!candidate?.id) throw new Error('저장할 후보 ID가 없습니다.');
  const review = normalizeReview(draft);
  const savedAt = resolveNow(options.now);
  const savedBy = validateReview(review, draft?.recordedBy, { savedAt });
  const previous = ledger?.entries?.[candidate.id] ?? null;
  const revision = (Number(previous?.revision) || 0) + 1;
  const history = Array.isArray(previous?.history) ? previous.history : [];
  const event = {
    revision,
    action: 'explicit_form_save',
    savedAt,
    savedBy,
    review,
  };
  const entry = {
    candidateId: candidate.id,
    candidate: candidateSnapshot(candidate),
    review,
    revision,
    savedAt,
    savedBy,
    evidenceBoundary: { ...EVIDENCE_BOUNDARY },
    history: [...history, event],
  };

  return {
    schema: DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA,
    updatedAt: savedAt,
    evidenceBoundary: { ...EVIDENCE_BOUNDARY },
    entries: {
      ...(ledger?.entries ?? {}),
      [candidate.id]: entry,
    },
  };
}

export function importDaejeonCandidateReviewLedger(raw, validCandidateIds = null) {
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error('검수 원장 JSON을 읽을 수 없습니다.');
  }
  assertLedgerShape(parsed);

  const entries = {};
  for (const [candidateId, entry] of Object.entries(parsed.entries)) {
    if (validCandidateIds && !validCandidateIds.has(candidateId)) {
      throw new Error(`현재 후보 목록에 없는 ID가 포함되어 있습니다: ${candidateId}`);
    }
    entries[candidateId] = normalizeImportedEntry(candidateId, entry);
  }

  const updatedAt = parsed.updatedAt;
  if (updatedAt !== null && updatedAt !== undefined && !isIsoTimestamp(updatedAt)) {
    throw new Error('검수 원장의 최근 저장 시각이 올바르지 않습니다.');
  }

  return {
    schema: DAEJEON_CANDIDATE_REVIEW_LEDGER_SCHEMA,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
    evidenceBoundary: { ...EVIDENCE_BOUNDARY },
    entries,
  };
}

export function loadDaejeonCandidateReviewLedger(
  storage,
  storageKey = DAEJEON_CANDIDATE_REVIEW_LEDGER_STORAGE_KEY,
) {
  try {
    const raw = storage?.getItem?.(storageKey);
    return {
      ledger: raw ? importDaejeonCandidateReviewLedger(raw) : createEmptyDaejeonCandidateReviewLedger(),
      error: '',
    };
  } catch (error) {
    return {
      ledger: createEmptyDaejeonCandidateReviewLedger(),
      error: `저장된 검수 원장을 불러오지 못했습니다. 원본은 덮어쓰지 않았습니다: ${error.message}`,
    };
  }
}

export function persistDaejeonCandidateReviewLedger(
  storage,
  ledger,
  storageKey = DAEJEON_CANDIDATE_REVIEW_LEDGER_STORAGE_KEY,
) {
  if (!storage?.setItem) throw new Error('이 브라우저에서는 로컬 저장소를 사용할 수 없습니다.');
  const normalized = importDaejeonCandidateReviewLedger(ledger);
  storage.setItem(storageKey, JSON.stringify(normalized));
  return normalized;
}

export function exportDaejeonCandidateReviewLedger(ledger, options = {}) {
  const normalized = importDaejeonCandidateReviewLedger(ledger);
  return JSON.stringify({
    ...normalized,
    exportedAt: resolveNow(options.now),
  }, null, 2);
}

export function summarizeDaejeonCandidateReviewLedger(ledger) {
  const entries = Object.values(ledger?.entries ?? {});
  return {
    savedCandidateCount: entries.length,
    placeMatchObservedCount: entries.filter(
      (entry) => entry.review?.placeMatchStatus !== 'unchecked',
    ).length,
    accessibilityObservedCount: entries.filter(
      (entry) => entry.review?.accessibilityStatus !== 'unchecked',
    ).length,
    studentReviewedCount: entries.filter(
      (entry) => entry.review?.studentReviewStatus === 'reviewed_by_taeyun',
    ).length,
    independentReviewedCount: entries.filter(
      (entry) => entry.review?.independentReviewStatus === 'reviewed_by_other',
    ).length,
    fieldVisitNeededCount: entries.filter(
      (entry) => entry.review?.fieldCheckStatus === 'visit_needed',
    ).length,
    fieldVisitedCount: entries.filter(
      (entry) => entry.review?.fieldCheckStatus === 'visited',
    ).length,
  };
}

export function getDaejeonCandidateReviewStatusLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? '확인 전';
}
