export const ROADVIEW_AUDIT_STATUSES = Object.freeze([
  'unchecked',
  'panorama_found',
  'no_panorama',
  'mismatch',
  'needs_human_review',
  'verified',
]);

export const ROADVIEW_AUDIT_STATUS_META = Object.freeze({
  unchecked: {
    label: '미검수',
    shortLabel: '미검수',
    color: '#8b97a8',
    description: '아직 공식 읽기 전용 확인을 실행하지 않았습니다.',
  },
  panorama_found: {
    label: '파노라마 확인',
    shortLabel: '파노라마',
    color: '#2878d5',
    description: '요청 결과에서 pano ID를 확인했지만 장소 일치는 확정하지 않았습니다.',
  },
  no_panorama: {
    label: '파노라마 없음',
    shortLabel: '없음',
    color: '#bd6d29',
    description: '공식 좌표 링크의 공개 결과에서 pano ID를 받지 못했습니다.',
  },
  mismatch: {
    label: '장소 불일치',
    shortLabel: '불일치',
    color: '#c33f58',
    description: '확인된 장면과 후보 장소가 맞지 않는다는 근거가 기록되었습니다.',
  },
  needs_human_review: {
    label: '사람 확인 대기',
    shortLabel: '사람 대기',
    color: '#8b56c9',
    description: '파노라마 증거는 있으나 장소·출입구 일치에 사람 확인이 필요합니다.',
  },
  verified: {
    label: '검증 완료',
    shortLabel: '완료',
    color: '#1b9b67',
    description: '필수 장소·출입구 일치와 사람 확인 증거가 모두 기록되었습니다.',
  },
});

const STATUS_SET = new Set(ROADVIEW_AUDIT_STATUSES);

export function isRoadviewAuditStatus(value) {
  return STATUS_SET.has(value);
}

function firstText(...values) {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value?.trim() ?? '';
}

function resolveAuditEntries(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.entries)) return input.entries;
  if (Array.isArray(input?.records)) return input.records;
  return [];
}

export function createRoadviewAuditIndex(input) {
  return new Map(
    resolveAuditEntries(input)
      .map((entry) => [firstText(entry?.candidateId, entry?.id), entry])
      .filter(([candidateId]) => candidateId),
  );
}

export function getRoadviewAuditEntry(input, candidateId) {
  return createRoadviewAuditIndex(input).get(candidateId) ?? null;
}

function fallbackStatus(candidate) {
  if (isRoadviewAuditStatus(candidate?.roadviewStatus)) return candidate.roadviewStatus;
  if (candidate?.roadviewStatus === 'checked') return 'needs_human_review';
  return 'unchecked';
}

export function resolveRoadviewAuditStatus(candidate, auditEntry = null) {
  const status = auditEntry?.status ?? fallbackStatus(candidate);
  return isRoadviewAuditStatus(status) ? status : 'unchecked';
}

export function isLocalRoadviewImagePath(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !/^https?:/i.test(value);
}

export function getRenderableRoadviewImage(auditEntry) {
  const capture = auditEntry?.capture;
  if (capture?.imageStored !== true) return null;
  if (!isLocalRoadviewImagePath(capture.imagePath)) return null;
  if (typeof capture.imageSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(capture.imageSha256)) return null;
  return capture.imagePath;
}

export function summarizeRoadviewAudit(candidates = []) {
  const statusCounts = Object.fromEntries(ROADVIEW_AUDIT_STATUSES.map((status) => [status, 0]));
  let eligibleCount = 0;
  let completedCount = 0;
  let verifiedCount = 0;
  let humanReviewCount = 0;

  for (const candidate of candidates) {
    const eligible = candidate.coordinateValid && candidate.roadviewEligible !== false;
    if (!eligible) continue;
    const status = resolveRoadviewAuditStatus(candidate, candidate.roadviewAudit);
    statusCounts[status] += 1;
    eligibleCount += 1;
    if (status !== 'unchecked') completedCount += 1;
    if (status === 'verified') verifiedCount += 1;
    if (status === 'needs_human_review') humanReviewCount += 1;
  }

  return {
    eligibleCount,
    completedCount,
    remainingCount: Math.max(eligibleCount - completedCount, 0),
    verifiedCount,
    humanReviewCount,
    statusCounts,
  };
}
