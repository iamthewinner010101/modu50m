import { verifyEvidence } from './photoNotebook.js';

export const PARTICIPATION_SCHEMA = 'modu50m.local-participation.v1';
export const PARTICIPATION_LABELS = { empathy: '같은 지점에 공감', visit: '직접 방문한 경험', change: '달라진 모습 알리기' };
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_ENTRIES = 300;
const text = (value, label, max = 1600) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label}을 작성해 주세요. (최대 ${max}자)`);
  return value.trim();
};
export function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function normalizeParticipation(input) {
  if (!Object.hasOwn(PARTICIPATION_LABELS, input?.kind)) throw new Error('참여 종류를 선택해 주세요.');
  const evidence = verifyEvidence(input.evidence);
  const subject = text(input.subject, '사진에서 살펴본 지점', 180);
  if (input.kind === 'empathy') {
    if (typeof input.active !== 'boolean') throw new Error('공감 선택을 확인해 주세요.');
    return { kind: input.kind, evidence, subject, active: input.active };
  }
  const date = input.visitDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > localDate()) throw new Error('직접 방문한 날짜를 확인해 주세요.');
  if (!input.photo || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(input.photo.dataUrl || '') || !/^[a-f0-9]{64}$/.test(input.photo.sha256 || '') || !Number.isInteger(input.photo.bytes) || input.photo.bytes <= 0 || input.photo.bytes > MAX_PHOTO_BYTES || input.photo.dataUrl.length > MAX_PHOTO_BYTES * 1.34 + 100) throw new Error('직접 찍은 JPG·PNG·WebP 사진 한 장을 넣어 주세요. (3MB 이하)');
  return { kind: input.kind, evidence, subject, visitDate: date,
    experience: text(input.experience, '직접 겪은 일과 구체적인 이유'), nextAction: text(input.nextAction, '다음에 확인할 일'),
    photo: { dataUrl: input.photo.dataUrl, sha256: input.photo.sha256, bytes: input.photo.bytes },
    userReportedVisit: true, fieldVerified: false, entranceVerified: false };
}
export async function prepareVisitPhoto(file) {
  if (!file || file.size > MAX_PHOTO_BYTES || !file.size) throw new Error('3MB 이하 사진 한 장을 골라 주세요.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const str = (a, b) => String.fromCharCode(...bytes.slice(a, b));
  const mime = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
    : bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10' ? 'image/png'
      : str(0, 4) === 'RIFF' && str(8, 12) === 'WEBP' ? 'image/webp' : null;
  if (!mime) throw new Error('JPG·PNG·WebP 사진을 골라 주세요.');
  const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
  if (!bitmap.width || !bitmap.height) throw new Error('사진을 읽지 못했습니다.');
  bitmap.close();
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
  const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('사진을 읽지 못했습니다.')); reader.readAsDataURL(new Blob([bytes], { type: mime })); });
  return { bytes: bytes.length, sha256, dataUrl };
}
function database() {
  return new Promise((resolve, reject) => {
    const qa = typeof location !== 'undefined' && new URLSearchParams(location.search).get('qa') === '1';
    const req = indexedDB.open(`modu50m-participation-v1${qa ? '-qa' : ''}`, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('entries', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = req.onblocked = () => reject(new Error('참여 기록 저장 공간을 열지 못했습니다.'));
  });
}
export async function readParticipation() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly'); const req = tx.objectStore('entries').getAll();
    tx.oncomplete = () => { db.close(); resolve(req.result || []); };
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error('참여 기록을 읽지 못했습니다.')); };
  });
}
export const empathyId = (evidence, subject) => `empathy:${evidence.key}:${encodeURIComponent(subject)}`;
export async function saveParticipation(input, expectedVersion = 0) {
  const entry = normalizeParticipation(input);
  const id = entry.kind === 'empathy' ? empathyId(entry.evidence, entry.subject) : crypto.randomUUID();
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new Error('저장 버전을 다시 확인해 주세요.');
  const origin = new URLSearchParams(location.search).get('qa') === '1' ? 'automated_qa' : 'user_input';
  const record = { ...entry, id, version: expectedVersion + 1, savedAt: new Date().toISOString(), origin };
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite'); const store = tx.objectStore('entries'); let failure;
    const req = store.get(id);
    req.onsuccess = () => {
      if ((req.result?.version || 0) !== expectedVersion) { failure = '다른 창에서 공감 표시가 바뀌었습니다. 저장된 참여 다시 읽기를 눌러 주세요.'; tx.abort(); return; }
      const count = store.count(); count.onsuccess = () => {
        if (!req.result && count.result >= MAX_ENTRIES) { failure = '이 브라우저의 참여 기록 한도에 도달했습니다. 기록 파일을 보관해 주세요.'; tx.abort(); } else store.put(record);
      };
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error(failure || '저장하지 못했습니다. 입력은 남아 있습니다. 저장 공간을 확인해 주세요.')); };
  });
  const result = (await readParticipation()).find(item => item.id === id);
  if (!result || result.version < record.version) throw new Error('저장 결과를 읽지 못했습니다. 다시 저장하기 전에 저장된 참여 다시 읽기를 눌러 주세요.');
  return result;
}
export function exportParticipation(entries) {
  const packet = { schema: PARTICIPATION_SCHEMA, scope: 'local_user_reports_not_accessibility_verification', exportedAt: new Date().toISOString(), entries };
  const url = URL.createObjectURL(new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `모두의50m-참여기록-${localDate()}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
