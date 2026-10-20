import { OBSERVATIONS } from '../data/hanbitPrecinct.js';
import { HANBIT_SITE } from '../data/daejeonPrecincts.js';

export function blankDraft(checkpointId, site = HANBIT_SITE) {
  const { checkpoints: CHECKPOINTS, photos: ROADVIEW } = site;
  return { observation: 'unknown', note: '', nextAction: CHECKPOINTS.find(p => p.id === checkpointId)?.next ?? '', photo: ROADVIEW[checkpointId] ? { ...ROADVIEW[checkpointId] } : null };
}

export function createRecord(checkpointId, draft, options = {}) {
  const site = options.site ?? HANBIT_SITE;
  const { checkpoints: CHECKPOINTS, photos: ROADVIEW, version: PRECINCT_VERSION } = site;
  if (!CHECKPOINTS.some(p => p.id === checkpointId)) throw new Error('확인 지점이 올바르지 않습니다.');
  if (!OBSERVATIONS.some(o => o.value === draft.observation)) throw new Error('관찰 상태를 선택해 주세요.');
  if (!draft.photo && draft.observation !== 'unknown') throw new Error('사진을 연결하거나 ‘모르겠어요’를 선택해 주세요.');
  const curated = draft.photo?.id === ROADVIEW[checkpointId]?.id;
  if (curated && (draft.photo.sha256 !== ROADVIEW[checkpointId].sha256 || draft.photo.image !== ROADVIEW[checkpointId].image)) throw new Error('수집 사진의 버전 또는 경로가 일치하지 않습니다.');
  if (draft.photo && !curated && (!/^data:image\/(jpeg|png|webp);base64,/.test(draft.photo.dataUrl) || !draft.photo.name || !['field', 'roadview', 'example'].includes(draft.photo.source))) throw new Error('사진 형식 또는 출처를 확인해 주세요.');
  if (!draft.nextAction.trim()) throw new Error('다음에 확인할 내용을 적어 주세요.');
  if (draft.note.length > 1000 || draft.nextAction.length > 500) throw new Error('기록이 너무 깁니다.');
  return {
    schemaVersion: 2, id: options.id ?? crypto.randomUUID(), savedAt: options.now ?? new Date().toISOString(),
    placeId: site.id, placeName: site.name, precinctVersion: PRECINCT_VERSION, checkpointId, observation: draft.observation,
    note: draft.note.trim(), nextAction: draft.nextAction.trim(), photo: curated ? structuredClone(ROADVIEW[checkpointId]) : draft.photo ? { ...draft.photo } : null,
    evidenceStatus: curated ? 'source_retrieved_pending_field' : draft.photo ? 'user_attached_unverified' : 'missing',
    geometryStatus: 'camera_georeferenced_context_schematic', accessibilityStatus: 'not_assessed',
    recordOrigin: 'local_prototype', studentEvidence: false,
  };
}

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('modu50m-hanbit-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('브라우저 저장소를 열지 못했어요. 기록을 내보내 보관해 주세요.'));
    request.onblocked = () => reject(new Error('다른 창이 저장소를 사용 중입니다. 해당 창을 닫고 다시 시도해 주세요.'));
  });
}

export async function readRecords() {
  const db = await openStore();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('records', 'readonly').objectStore('records').getAll();
      request.onsuccess = () => resolve(request.result.filter(r => [1, 2].includes(r.schemaVersion)).sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
      request.onerror = () => reject(new Error('저장한 기록을 읽지 못했어요.'));
    });
  } finally { db.close(); }
}

export async function saveRecord(record) {
  const db = await openStore();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('records', 'readwrite');
      transaction.objectStore('records').add(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error('저장하지 못했어요. 저장 공간을 확인하거나 기록을 내보내 주세요.'));
      transaction.onabort = () => reject(new Error('저장이 중단되었어요. 입력 내용은 화면에 남아 있습니다.'));
    });
  } finally { db.close(); }
}

export async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 사진을 선택해 주세요.');
  if (file.size > 12 * 1024 * 1024) throw new Error('12MB 이하의 사진을 선택해 주세요.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { id: crypto.randomUUID(), name: file.name, dataUrl: canvas.toDataURL('image/jpeg', .86), source: 'field', captureDate: '', attachedAt: new Date().toISOString(), originalSize: file.size, resized: scale < 1 };
  } finally { bitmap.close(); }
}

export function exportRecords(records) {
  const content = JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), note: '로컬 관찰 기록. 수집 원본의 ID·좌표·촬영일·해시 포함. 현장 검증·학생 수행·접근성 인증이 아닙니다.', records }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `모두의50m-대전-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
