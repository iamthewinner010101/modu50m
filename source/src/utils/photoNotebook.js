import hashes from '../data/finalsPhotoHashes.generated.json' with { type: 'json' };
import { FINALS_PLACES } from '../data/finalsCatalog.js';

export const NOTEBOOK_SCHEMA = 'modu50m.photo-notebook.v1';
export const MAX_NOTEBOOK_RECORDS = FINALS_PLACES.reduce((sum, place) => sum + place.checkpoints.length, 0);
export const STATUS_LABELS = { observed: '사진에서 보여요', unclear: '가려지거나 멀어요', unknown: '이 사진으로 모르겠어요' };
export const MATCH_LABELS = { scene: '표시된 장면을 살펴봤어요', uncertain: '장소·방향을 더 확인해야 해요', mismatch: '다른 장소·방향 같아요' };

export function sceneEvidence(site, pointId) {
  const photo = site.photos[pointId];
  const point = site.checkpoints.find(item => item.id === pointId);
  if (!photo || !point || !hashes[photo.image]) throw new Error('사진 근거를 찾지 못했습니다. 화면을 다시 열어 주세요.');
  return { key: `${site.id}/${pointId}`, placeId: site.id, placeName: site.name, pointId, title: point.title,
    image: photo.image, sha256: hashes[photo.image], sourceUrl: photo.sourceUrl,
    captureDate: photo.captureDate || null, provider: photo.providerLabel || photo.provider || '사진 출처',
    entranceVerified: false, fieldVerified: false };
}
function clean(value, label, max = 1600, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`${label}을(를) 작성해 주세요. (최대 ${max}자)`);
  return value.trim();
}
export function normalizeNote(input) {
  if (!input || !Object.hasOwn(MATCH_LABELS, input.placeMatch)) throw new Error('장소·방향 확인을 선택해 주세요.');
  if (!Object.hasOwn(STATUS_LABELS, input.status)) throw new Error('사진에서 확인한 상태를 선택해 주세요.');
  if (input.placeMatch !== 'scene' && input.status === 'observed') throw new Error('장소·방향이 불확실하면 관찰 상태를 ‘모르겠어요’로 바꿔 주세요.');
  return { placeMatch: input.placeMatch, status: input.status,
    subject: clean(input.subject, '살펴본 부분', 180), observation: clean(input.observation, '보이는 사실 또는 모르는 이유'),
    nextAction: clean(input.nextAction, '다음 확인'), reviewer: clean(input.reviewer || '', '작성자 별칭', 60, false),
  };
}
export function verifyEvidence(evidence) {
  const site = FINALS_PLACES.find(item => item.id === evidence?.placeId);
  if (!site?.photos[evidence?.pointId]) throw new Error('현재 목록에 없는 장소·사진입니다.');
  const current = sceneEvidence(site, evidence.pointId);
  if (current.key !== evidence.key || current.image !== evidence.image || current.sha256 !== evidence.sha256 || current.sourceUrl !== evidence.sourceUrl) {
    throw new Error('사진 근거가 현재 자료와 다릅니다. 다른 사진의 기록을 덮어쓸 수 없습니다.');
  }
  return current;
}
export function validatePacket(packet) {
  if (packet?.schema !== NOTEBOOK_SCHEMA || !Array.isArray(packet.records) || !packet.records.length || packet.records.length > MAX_NOTEBOOK_RECORDS) throw new Error('모두의 50m 기록 파일이 아닙니다.');
  const seen = new Set();
  return packet.records.map(record => {
    const evidence = verifyEvidence(record.evidence);
    if (seen.has(evidence.key)) throw new Error('같은 사진의 기록이 중복되어 있습니다.');
    seen.add(evidence.key);
    if (!Array.isArray(record.history) || !record.history.length || record.history.length > 1000) throw new Error('수정 이력이 없는 기록입니다.');
    let previous = 0;
    const history = record.history.map(item => {
      if (!Number.isSafeInteger(item.version) || item.version !== previous + 1 || typeof item.savedAt !== 'string' || !Number.isFinite(Date.parse(item.savedAt))) throw new Error('수정 이력의 순서 또는 시간이 올바르지 않습니다.');
      previous = item.version;
      return { version: item.version, savedAt: item.savedAt, note: normalizeNote(item.note), origin: 'imported_file' };
    });
    const latest = history.at(-1);
    return { key: evidence.key, evidence, version: latest.version, savedAt: latest.savedAt, note: latest.note, history, origin: 'imported_file' };
  });
}
function database() {
  return new Promise((resolve, reject) => {
    const qa = typeof location !== 'undefined' && new URLSearchParams(location.search).get('qa') === '1';
    const req = indexedDB.open(`modu50m-photo-notebook-v1${qa ? '-qa' : ''}`, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('records', { keyPath: 'key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error('이 브라우저의 저장 공간을 열 수 없습니다. 입력을 복사해 보관해 주세요.'));
    req.onblocked = () => reject(new Error('이전 창을 닫은 뒤 다시 열어 주세요.'));
  });
}
export async function readNotes(key) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly');
    const req = key ? tx.objectStore('records').get(key) : tx.objectStore('records').getAll();
    tx.oncomplete = () => { db.close(); resolve(req.result || (key ? null : [])); };
    tx.onerror = () => { db.close(); reject(new Error('저장된 기록을 읽지 못했습니다. 다시 열기를 눌러 주세요.')); };
  });
}
export async function saveNote(evidence, input, expectedVersion, origin = 'user_input') {
  const verified = verifyEvidence(evidence);
  const note = normalizeNote(input);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new Error('저장 버전을 다시 확인해 주세요.');
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    const store = tx.objectStore('records');
    let failure;
    const req = store.get(evidence.key);
    req.onsuccess = () => {
      const before = req.result;
      if ((before?.version || 0) !== expectedVersion) { failure = new Error('다른 창에서 기록이 바뀌었습니다. 입력은 남아 있습니다. 최신 기록을 다시 확인해 주세요.'); failure.code = 'CONFLICT'; tx.abort(); return; }
      if (before && before.evidence.sha256 !== evidence.sha256) { failure = new Error('사진이 변경되었습니다. 이전 근거와 새 사진을 먼저 비교해 주세요.'); tx.abort(); return; }
      const revision = { version: expectedVersion + 1, savedAt: new Date().toISOString(), note, origin };
      store.put({ key: evidence.key, evidence: verified, ...revision, history: [...(before?.history || []), revision] });
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(failure || new Error('저장하지 못했습니다. 저장 공간이 충분한지 확인해 주세요. 입력은 남아 있습니다.')); };
  });
  // Independent transaction: only a successful readback is presented as saved.
  const result = await readNotes(evidence.key);
  if (!result || result.version < expectedVersion + 1) throw new Error('저장 결과를 다시 읽지 못했습니다. 재저장 전 기록함을 확인해 주세요.');
  return result;
}
export async function importNotes(packet) {
  const records = validatePacket(packet);
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    const store = tx.objectStore('records');
    let conflict = false;
    for (const record of records) {
      const req = store.get(record.key);
      req.onsuccess = () => { if (req.result) { conflict = true; tx.abort(); } else store.add(record); };
    }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error(conflict ? '이미 저장된 사진이 포함되어 있어 가져오기를 취소했습니다. 기존 기록은 그대로 남아 있습니다.' : '파일을 저장하지 못했습니다. 기존 기록은 그대로 남아 있습니다.')); };
  });
  return records.length;
}
export function exportNotes(records) {
  const packet = { schema: NOTEBOOK_SCHEMA, exportedAt: new Date().toISOString(), scope: 'photo_observation_only', records };
  const url = URL.createObjectURL(new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `모두의50m-관찰기록-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
