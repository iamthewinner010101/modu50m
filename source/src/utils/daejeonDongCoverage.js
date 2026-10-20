export const DAEJEON_DONG_STATUS_ORDER = Object.freeze([
  'source_frame',
  'candidate',
  'photo_draft',
  'student_review',
  'independent_review',
  'field_confirmation',
  'needs_recheck',
]);

export const DAEJEON_DONG_STATUS_DEFINITIONS = Object.freeze({
  source_frame: Object.freeze({
    key: 'source_frame',
    label: '공식 목록 확인',
    compactLabel: '공식 목록',
    tone: 'source',
    description: '공식 자료에서 행정동 이름·소속 구·코드를 확인한 단계입니다.',
  }),
  candidate: Object.freeze({
    key: 'candidate',
    label: '후보',
    compactLabel: '후보',
    tone: 'candidate',
    description: '그 행정동 안에서 검수할 장소 후보를 연결한 단계입니다.',
  }),
  photo_draft: Object.freeze({
    key: 'photo_draft',
    label: '사진 초안',
    compactLabel: '사진 초안',
    tone: 'photo',
    description: '사진에서 볼 신호를 초안으로 정리한 단계입니다.',
  }),
  student_review: Object.freeze({
    key: 'student_review',
    label: '학생 검수',
    compactLabel: '학생 검수',
    tone: 'student',
    description: '학생이 근거를 보고 직접 확인할 단계입니다.',
  }),
  independent_review: Object.freeze({
    key: 'independent_review',
    label: '독립 검수',
    compactLabel: '독립 검수',
    tone: 'independent',
    description: '다른 검수자가 같은 근거를 다시 확인할 단계입니다.',
  }),
  field_confirmation: Object.freeze({
    key: 'field_confirmation',
    label: '현장 확인',
    compactLabel: '현장',
    tone: 'field',
    description: '현장에서 확인한 근거가 기록된 단계입니다.',
  }),
  needs_recheck: Object.freeze({
    key: 'needs_recheck',
    label: '재확인 필요',
    compactLabel: '재확인',
    tone: 'recheck',
    description: '이름·근거·상태 중 하나를 다시 확인해야 합니다.',
  }),
});

const STATUS_ALIASES = new Map([
  ['source_frame', 'source_frame'],
  ['source-frame', 'source_frame'],
  ['sourceframe', 'source_frame'],
  ['source', 'source_frame'],
  ['official_list', 'source_frame'],
  ['official-list', 'source_frame'],
  ['official_list_confirmed', 'source_frame'],
  ['official-list-confirmed', 'source_frame'],
  ['출처', 'source_frame'],
  ['출처프레임', 'source_frame'],
  ['출처 프레임', 'source_frame'],
  ['공식목록', 'source_frame'],
  ['공식 목록', 'source_frame'],
  ['공식목록확인', 'source_frame'],
  ['공식 목록 확인', 'source_frame'],
  ['candidate', 'candidate'],
  ['후보', 'candidate'],
  ['후보등록', 'candidate'],
  ['후보 등록', 'candidate'],
  ['photo_draft', 'photo_draft'],
  ['photo-draft', 'photo_draft'],
  ['photodraft', 'photo_draft'],
  ['photo', 'photo_draft'],
  ['사진', 'photo_draft'],
  ['사진초안', 'photo_draft'],
  ['사진 초안', 'photo_draft'],
  ['student_review', 'student_review'],
  ['student-review', 'student_review'],
  ['studentreview', 'student_review'],
  ['student_review_pending', 'student_review'],
  ['학생', 'student_review'],
  ['학생검수', 'student_review'],
  ['학생 검수', 'student_review'],
  ['학생검토', 'student_review'],
  ['학생 검토', 'student_review'],
  ['independent_review', 'independent_review'],
  ['independent-review', 'independent_review'],
  ['independentreview', 'independent_review'],
  ['independent_review_pending', 'independent_review'],
  ['독립', 'independent_review'],
  ['독립검수', 'independent_review'],
  ['독립 검수', 'independent_review'],
  ['독립재검수', 'independent_review'],
  ['독립 재검수', 'independent_review'],
  ['field_confirmation', 'field_confirmation'],
  ['field-confirmation', 'field_confirmation'],
  ['fieldconfirmation', 'field_confirmation'],
  ['field_check', 'field_confirmation'],
  ['field-check', 'field_confirmation'],
  ['field', 'field_confirmation'],
  ['현장', 'field_confirmation'],
  ['현장확인', 'field_confirmation'],
  ['현장 확인', 'field_confirmation'],
  ['needs_recheck', 'needs_recheck'],
  ['needs-recheck', 'needs_recheck'],
  ['needsrecheck', 'needs_recheck'],
  ['recheck', 'needs_recheck'],
  ['needs_check', 'needs_recheck'],
  ['확인필요', 'needs_recheck'],
  ['확인 필요', 'needs_recheck'],
  ['재확인', 'needs_recheck'],
  ['재확인필요', 'needs_recheck'],
  ['재확인 필요', 'needs_recheck'],
]);

function normalizeStatusInput(value) {
  if (value && typeof value === 'object') {
    return value.key ?? value.code ?? value.status ?? value.value ?? value.label ?? '';
  }
  return value ?? '';
}

function canonicalizeStatus(value) {
  return String(normalizeStatusInput(value))
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '_')
    .replace(/-+/g, '_');
}

export function normalizeDongStatus(value) {
  const canonicalValue = canonicalizeStatus(value);
  if (!canonicalValue) return null;
  return STATUS_ALIASES.get(canonicalValue)
    ?? STATUS_ALIASES.get(canonicalValue.replace(/_/g, ''))
    ?? (DAEJEON_DONG_STATUS_DEFINITIONS[canonicalValue] ? canonicalValue : null);
}

export function getStatusDefinition(status) {
  const key = normalizeDongStatus(status) ?? 'needs_recheck';
  return DAEJEON_DONG_STATUS_DEFINITIONS[key];
}

function firstText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function firstIdentifier(...values) {
  return values.find((value) => (
    typeof value === 'string' || typeof value === 'number'
  )) ?? null;
}

function asFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function resolveRecords(input) {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== 'object') return [];
  if (Array.isArray(input.dongs)) return input.dongs;
  if (Array.isArray(input.items)) return input.items;
  if (Array.isArray(input.administrativeDongs)) return input.administrativeDongs;
  if (Array.isArray(input.records)) return input.records;
  if (input.data && typeof input.data === 'object') return resolveRecords(input.data);
  return [];
}

function resolveExpectedCount(input, fallback) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fallback;
  const value = firstIdentifier(input.expectedCount, input.totalCount, input.total);
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : fallback;
}

function resolveStatusTrail(item, primaryStatus) {
  const trailInputs = [
    ...(Array.isArray(item.statusTrail) ? item.statusTrail : []),
    ...(Array.isArray(item.statuses) ? item.statuses : []),
    ...(Array.isArray(item.workflowStatuses) ? item.workflowStatuses : []),
  ];
  const trail = trailInputs
    .map(normalizeDongStatus)
    .filter(Boolean);
  if (primaryStatus && !trail.includes(primaryStatus)) trail.unshift(primaryStatus);
  return [...new Set(trail)];
}

export function normalizeDongRecord(item, index = 0, { defaultStatus = 'needs_recheck' } = {}) {
  const source = item && typeof item === 'object' ? item : {};
  const sourceId = firstIdentifier(
    source.id,
    source.code,
    source.dongId,
    source.administrativeDongCode,
  );
  const id = sourceId === null || sourceId === '' ? `unkeyed-${index + 1}` : String(sourceId);
  const name = firstText(
    source.name,
    source.dongName,
    source.administrativeDongName,
    source.label,
  );
  const district = firstText(source.district, source.gu, source.sigungu, source.districtName);
  const explicitStatus = normalizeDongStatus(
    source.status
      ?? source.coverageStatus
      ?? source.workflowStatus
      ?? source.primaryStatus,
  );
  const status = explicitStatus ?? normalizeDongStatus(defaultStatus) ?? 'needs_recheck';
  const statusTrail = resolveStatusTrail(source, status);
  const position = source.position && typeof source.position === 'object'
    ? {
        x: asFiniteNumber(source.position.x),
        y: asFiniteNumber(source.position.y),
      }
    : null;

  return {
    ...source,
    id,
    sourceId: sourceId === null || sourceId === '' ? null : String(sourceId),
    name,
    district,
    status,
    statusTrail,
    hasSourceId: sourceId !== null && sourceId !== '',
    hasName: Boolean(name),
    position,
  };
}

export function normalizeDaejeonDongCoverage(input, { expectedCount = 82, defaultStatus = 'needs_recheck' } = {}) {
  const records = resolveRecords(input);
  const resolvedExpectedCount = resolveExpectedCount(input, expectedCount);
  const dongs = records.map((item, index) => normalizeDongRecord(item, index, { defaultStatus }));
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input.source : null;
  const hasAuthoritativeRecords = Boolean(
    input && typeof input === 'object' && !Array.isArray(input)
      ? input.hasAuthoritativeRecords ?? source?.authoritative
      : false,
  );

  return {
    dongs,
    expectedCount: resolvedExpectedCount,
    hasRecords: dongs.length > 0,
    hasAuthoritativeRecords,
    sourceLabel: firstText(
      input && typeof input === 'object' && !Array.isArray(input) ? input.sourceLabel : '',
      source?.label,
      source?.title,
    ),
    sourceUrl: firstText(source?.url),
    sourceRetrievedAt: firstText(source?.retrievedAt),
    codeSourceUrl: firstText(source?.codeSource?.articleUrl),
    sourceEffectiveDate: firstText(source?.codeSource?.effectiveDate),
    geometryKind: firstText(
      input && typeof input === 'object' && !Array.isArray(input) ? input.geometryKind : '',
      input && typeof input === 'object' && !Array.isArray(input) ? input.geometry?.kind : '',
    ),
    reconciliation: input && typeof input === 'object' && !Array.isArray(input)
      ? input.reconciliation ?? null
      : null,
  };
}

function normalizeAdministrativeDongLink(item, index = 0) {
  const source = item && typeof item === 'object' ? item : {};
  const code = firstIdentifier(
    source.code,
    source.id,
    source.administrativeDongCode,
  );
  return {
    code: code === null || code === '' ? `unkeyed-administrative-${index + 1}` : String(code),
    name: firstText(source.name, source.administrativeDongName, source.label),
  };
}

function resolveLegalDongRecords(input) {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== 'object') return [];
  if (Array.isArray(input.legalDongs)) return input.legalDongs;
  if (Array.isArray(input.dongs)) return input.dongs;
  if (Array.isArray(input.records)) return input.records;
  if (input.data && typeof input.data === 'object') return resolveLegalDongRecords(input.data);
  return [];
}

export function normalizeLegalDongRecord(item, index = 0, { defaultStatus = 'needs_recheck' } = {}) {
  const normalized = normalizeDongRecord(item, index, { defaultStatus });
  const source = item && typeof item === 'object' ? item : {};
  const administrativeDongInputs = Array.isArray(source.administrativeDongs)
    ? source.administrativeDongs
    : [];
  const administrativeDongs = administrativeDongInputs
    .map(normalizeAdministrativeDongLink)
    .filter((link, linkIndex, links) => (
      links.findIndex((candidate) => candidate.code === link.code) === linkIndex
    ));

  return {
    ...normalized,
    unitType: 'legal_dong',
    administrativeDongs,
    administrativeDongCount: administrativeDongs.length,
    spansMultipleAdministrativeDongs: administrativeDongs.length > 1,
  };
}

export function normalizeDaejeonLegalDongCoverage(
  input,
  { expectedCount = 177, defaultStatus = 'needs_recheck' } = {},
) {
  const records = resolveLegalDongRecords(input);
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input.source : null;
  const configuredExpectedCount = input && typeof input === 'object' && !Array.isArray(input)
    ? firstIdentifier(input.expectedLegalDongCount, input.expectedCount, input.totalCount)
    : null;
  const resolvedExpectedCount = typeof configuredExpectedCount === 'number'
    && Number.isFinite(configuredExpectedCount)
    && configuredExpectedCount >= 0
    ? Math.trunc(configuredExpectedCount)
    : expectedCount;
  const configuredRelationCount = input && typeof input === 'object' && !Array.isArray(input)
    ? firstIdentifier(input.expectedRelationCount, input.relationCount)
    : null;

  return {
    dongs: records.map((item, index) => normalizeLegalDongRecord(item, index, { defaultStatus })),
    expectedCount: resolvedExpectedCount,
    expectedRelationCount: typeof configuredRelationCount === 'number'
      && Number.isFinite(configuredRelationCount)
      && configuredRelationCount >= 0
      ? Math.trunc(configuredRelationCount)
      : null,
    hasRecords: records.length > 0,
    hasAuthoritativeRecords: Boolean(
      input && typeof input === 'object' && !Array.isArray(input)
        ? input.hasAuthoritativeRecords ?? source?.authoritative
        : false,
    ),
    sourceLabel: firstText(
      input && typeof input === 'object' && !Array.isArray(input) ? input.sourceLabel : '',
      source?.label,
      source?.title,
    ),
    sourceUrl: firstText(source?.articleUrl, source?.url),
    sourceRetrievedAt: firstText(source?.retrievedAt),
    sourceEffectiveDate: firstText(source?.effectiveDate),
    geometryKind: firstText(
      input && typeof input === 'object' && !Array.isArray(input) ? input.geometryKind : '',
      input && typeof input === 'object' && !Array.isArray(input) ? input.geometry?.kind : '',
    ),
    reconciliation: input && typeof input === 'object' && !Array.isArray(input)
      ? input.reconciliation ?? null
      : null,
  };
}

export function summarizeDaejeonRegionRelations(legalDongs) {
  const records = Array.isArray(legalDongs) ? legalDongs : [];
  const relationKeys = new Set();
  const linkedAdministrativeDongCodes = new Set();
  let multiAdministrativeLegalDongCount = 0;

  records.forEach((dong) => {
    const links = Array.isArray(dong?.administrativeDongs) ? dong.administrativeDongs : [];
    if (links.length > 1) multiAdministrativeLegalDongCount += 1;
    links.forEach((link) => {
      const administrativeCode = String(link?.code ?? '').trim();
      if (!administrativeCode) return;
      linkedAdministrativeDongCodes.add(administrativeCode);
      relationKeys.add(`${administrativeCode}:${dong?.id ?? ''}`);
    });
  });

  return {
    legalDongCount: records.length,
    relationCount: relationKeys.size,
    linkedAdministrativeDongCount: linkedAdministrativeDongCodes.size,
    multiAdministrativeLegalDongCount,
  };
}

export function summarizeDaejeonDongCoverage(dongs, expectedCount = 82) {
  const records = Array.isArray(dongs) ? dongs : [];
  const counts = Object.fromEntries(DAEJEON_DONG_STATUS_ORDER.map((status) => [status, 0]));
  const stageCounts = Object.fromEntries(DAEJEON_DONG_STATUS_ORDER.map((status) => [status, 0]));
  let namedCount = 0;

  records.forEach((dong) => {
    const status = normalizeDongStatus(dong?.status) ?? 'needs_recheck';
    counts[status] += 1;
    const trail = Array.isArray(dong?.statusTrail) && dong.statusTrail.length > 0
      ? dong.statusTrail
      : [status];
    [...new Set(trail.map(normalizeDongStatus).filter(Boolean))].forEach((stage) => {
      stageCounts[stage] += 1;
    });
    if (typeof dong?.name === 'string' && dong.name.trim()) namedCount += 1;
  });

  const total = typeof expectedCount === 'number' && Number.isFinite(expectedCount) && expectedCount >= 0
    ? Math.trunc(expectedCount)
    : records.length;
  const loadedCount = records.length;
  const remainingCount = Math.max(total - loadedCount, 0);

  return {
    total,
    loadedCount,
    namedCount,
    remainingCount,
    counts,
    stageCounts,
    knownStatusCount: loadedCount - counts.needs_recheck,
    needsRecheckCount: counts.needs_recheck,
    completionPercent: total > 0 ? Math.min(Math.round((loadedCount / total) * 100), 100) : 0,
  };
}

export function groupDaejeonDongsByDistrict(dongs) {
  const groups = new Map();
  (Array.isArray(dongs) ? dongs : []).forEach((dong) => {
    const district = typeof dong?.district === 'string' ? dong.district.trim() : '';
    const key = district || '__missing_district__';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: district || '자치구 정보 대기',
        dongs: [],
      });
    }
    groups.get(key).dongs.push(dong);
  });
  return [...groups.values()];
}
