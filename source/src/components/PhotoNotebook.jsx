import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, DownloadSimple, FloppyDisk, Notebook, PencilSimple, TrayArrowDown } from '@phosphor-icons/react';
import { photoCaption } from '../data/previewCityPlaces.js';
import { FINALS_PLACES } from '../data/finalsCatalog.js';
import { exportNotes, importNotes, MATCH_LABELS, readNotes, saveNote, sceneEvidence, STATUS_LABELS, validatePacket } from '../utils/photoNotebook.js';
import './FinalsExperience.css';
import { ParticipationArchive } from './LocalParticipation.jsx';
import SavedJourneyNotes from './SavedJourneyNotes.jsx';

const dateLabel = value => new Date(value).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const empty = subject => ({ subject, placeMatch: '', status: '', observation: '', nextAction: '', reviewer: '' });
function draftKey(evidence) { return `modu50m-draft:${new URLSearchParams(location.search).get('qa') === '1' ? 'qa:' : ''}${evidence.key}:${evidence.sha256}`; }
function readDraft(evidence) { try { return JSON.parse(sessionStorage.getItem(draftKey(evidence))) || null; } catch { return null; } }

function RecordCard({ record, onEdit, onRecords }) {
  return <article className="fn-record-card" tabIndex={-1}>
    <div className="fn-record-heading"><CheckCircle size={28} weight="fill" /><div><small>이 브라우저에 저장된 사진 관찰</small><h3>{record.evidence.placeName}</h3></div><b>v{record.version}</b></div>
    <div className="fn-record-scene"><img src={record.evidence.image} alt={record.evidence.title} /><div><strong>{record.note.subject}</strong><p>{record.evidence.title}</p><span>{STATUS_LABELS[record.note.status]}</span></div></div>
    <dl><div><dt>장소·방향 확인</dt><dd>{MATCH_LABELS[record.note.placeMatch]}</dd></div><div><dt>보이는 사실 · 모르는 이유</dt><dd>{record.note.observation}</dd></div><div className="fn-next"><dt>다음 사람이 확인할 일</dt><dd>{record.note.nextAction}</dd></div></dl>
    <p className="fn-meta">{dateLabel(record.savedAt)} · {record.note.reviewer || '별칭 미입력'} · {record.origin === 'imported_file' ? '가져온 기록' : record.origin === 'automated_qa' ? '자동 검사 기록' : '직접 입력한 기록'}</p>
    <div className="fn-actions">{onEdit && <button onClick={onEdit}><PencilSimple size={17} /> 이어서 수정</button>}<button onClick={() => exportNotes([record])}><DownloadSimple size={17} /> 기록 파일</button>{onRecords && <button onClick={onRecords}>기록함 <ArrowRight size={17} /></button>}</div>
    <details className="fn-history"><summary>수정 이력 {record.history.length}개 · 출처 보기</summary><a href={record.evidence.sourceUrl} target="_blank" rel="noreferrer">원본 사진 출처 ↗</a><ol>{record.history.toReversed().map(item => <li key={item.version}><b>v{item.version} · {dateLabel(item.savedAt)}</b><p>{STATUS_LABELS[item.note.status]} · {item.note.observation}</p><p>다음 확인: {item.note.nextAction}</p></li>)}</ol><p>사진 식별값 SHA-256</p><code>{record.evidence.sha256}</code></details>
  </article>;
}

export function PhotoNoteEditor({ site, point, review, onRecords, onSaved }) {
  const evidence = sceneEvidence(site, point.id);
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(() => readDraft(evidence) || empty(review.observations[0]?.label || review.title));
  const [stage, setStage] = useState('form');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  useEffect(() => {
    let active = true;
    readNotes(evidence.key).then(saved => {
      if (!active) return;
      setRecord(saved);
      if (saved && !readDraft(evidence)) { setDraft(saved.note); setStage('card'); }
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // The parent keys this editor to the exact scene. Do not replace input on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidence.key]);
  function change(key, value) {
    const next = { ...draft, [key]: value };
    if (key === 'placeMatch' && value !== 'scene' && next.status === 'observed') next.status = 'unknown';
    setDraft(next); setNotice('');
    try { sessionStorage.setItem(draftKey(evidence), JSON.stringify(next)); } catch { setError('임시 입력을 보관하지 못했습니다. 화면을 떠나기 전에 기록을 저장해 주세요.'); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const origin = new URLSearchParams(location.search).get('qa') === '1' ? 'automated_qa' : 'user_input';
      const saved = await saveNote(evidence, draft, record?.version || 0, origin);
      setRecord(saved); setDraft(saved.note); setStage('card'); setConflict(false);
      try { sessionStorage.removeItem(draftKey(evidence)); } catch { /* Durable record already exists. */ }
      setNotice(`저장한 기록을 다시 읽었습니다. v${saved.version} · 새로고침해도 남습니다.`); onSaved?.();
      requestAnimationFrame(() => document.querySelector('#fn-editor .fn-record-card')?.focus());
    } catch (err) { setError(err.message); setConflict(err.code === 'CONFLICT'); }
    finally { setBusy(false); }
  }
  async function reload() {
    try { const latest = await readNotes(evidence.key); setRecord(latest); setStage('card'); setError(''); setConflict(false); setNotice('최신 저장 기록을 열었습니다. 임시 입력은 이 탭에 남겨 두었습니다.'); }
    catch (err) { setError(err.message); }
  }
  return <section id="fn-editor" className="fn-editor" aria-label="이 사진의 관찰 기록">
    <div className="fn-editor-intro"><span className="fn-eyebrow"><Notebook size={18} /> 관찰을 다음 사람에게</span><h2>보이는 것부터,<br />내 말로 남겨요.</h2><p>사진에서 알게 된 것과 아직 모르는 이유를 나누면 다음 확인이 구체적이 됩니다.</p><div className="fn-context"><img src={evidence.image} alt="현재 기록할 원본 사진" /><strong>{site.name}</strong><span>{review.title}</span><small>{photoCaption(site.photos[point.id])}</small></div><p className="fn-storage-note">이 기기·이 브라우저에 저장됩니다. 다른 기기로 옮길 때는 기록 파일을 내려받으세요. 브라우저 데이터를 지우면 기록도 삭제됩니다.</p></div>
    <div className="fn-editor-body">
      {loading && <p role="status">이 사진의 기록을 불러오는 중…</p>}
      {error && <p role="alert" className="fn-error">{error}</p>}
      {notice && <p role="status" className="fn-success">{notice}</p>}
      {conflict && <button className="fn-primary" onClick={reload}>최신 저장 기록 비교</button>}
      {stage === 'card' && record ? <RecordCard record={record} onEdit={() => { setDraft(readDraft(evidence) || record.note); setStage('form'); setNotice(''); }} onRecords={onRecords} /> : <form onSubmit={save}>
        <fieldset disabled={loading || busy}><legend>이 사진에 대한 나의 관찰</legend>
          <label>살펴본 부분<input required maxLength={180} value={draft.subject} onChange={event => change('subject', event.target.value)} placeholder="예: 가로수 옆으로 지나는 공간" /></label>
          <label>장소·방향 확인<select required value={draft.placeMatch} onChange={event => change('placeMatch', event.target.value)}><option value="">사진과 장소 안내를 보고 선택하세요</option>{Object.entries(MATCH_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <div className="fn-status-options" role="group" aria-label="사진에서 확인한 상태">{Object.entries(STATUS_LABELS).map(([id, label]) => <button type="button" key={id} aria-pressed={draft.status === id} disabled={id === 'observed' && draft.placeMatch !== 'scene'} onClick={() => change('status', id)}>{label}</button>)}</div>
          <label>걱정되는 점과 이유 · 보이는 사실 또는 모르는 이유<textarea required maxLength={1600} rows={3} value={draft.observation} onChange={event => change('observation', event.target.value)} placeholder="예: 가로수 옆 통로가 좁아 보여 걱정돼요. 사진으로는 실제 폭을 알기 어려워요." /></label>
          <label>다음에 무엇을 확인하면 좋을까요?<textarea required maxLength={1600} rows={2} value={draft.nextAction} onChange={event => change('nextAction', event.target.value)} placeholder="어디에서 무엇을 촬영하거나 측정할지 적어 주세요." /></label>
          <label>작성자 별칭 <span className="fn-optional">선택</span><input maxLength={60} value={draft.reviewer} onChange={event => change('reviewer', event.target.value)} placeholder="실명 없이 별칭으로 남길 수 있어요" /></label>
          <p className="fn-form-note">통과 가능 여부를 인증하는 기록이 아닙니다. 사진에서 직접 확인한 내용만 적어 주세요.</p>
          <div className="fn-actions"><button className="fn-primary" disabled={busy || loading || conflict} type="submit"><FloppyDisk size={19} /> {busy ? '저장 후 다시 읽는 중…' : record ? `수정 기록 저장 · v${record.version + 1}` : '관찰 기록 저장'}</button>{record && <button type="button" onClick={() => setStage('card')}>저장된 기록 보기</button>}</div>
        </fieldset>
      </form>}
    </div>
  </section>;
}

export function NotebookCollection({ onOpen, revision }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [opened, setOpened] = useState(null);
  const [packet, setPacket] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { let active = true; readNotes().then(items => { if (active) { setRecords(items.sort((a, b) => b.savedAt.localeCompare(a.savedAt))); setError(''); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [revision, refresh]);
  async function selectFile(event) {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    setError(''); setPacket(null);
    try { if (file.size > 5_000_000) throw new Error('5MB 이하의 기록 파일을 선택해 주세요.'); const parsed = JSON.parse(await file.text()); const valid = validatePacket(parsed); setPacket({ parsed, count: valid.length, names: valid.map(item => item.evidence.placeName) }); }
    catch (err) { setError(err instanceof SyntaxError ? '읽을 수 없는 JSON 파일입니다.' : err.message); }
  }
  async function confirmImport() {
    setBusy(true); setError('');
    try { const count = await importNotes(packet.parsed); setPacket(null); setNotice(`${count}개 기록을 가져왔습니다. 파일에 담긴 관찰이며 현장 확인 완료로 바뀌지 않습니다.`); setRefresh(value => value + 1); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const filtered = records.filter(record => filter === 'all' || (filter === 'unknown' ? record.note.status !== 'observed' : record.evidence.placeId === filter));
  const selected = records.find(record => record.key === opened);
  return <main id="mv5-main" className="fn-collection">
    <SavedJourneyNotes onOpen={onOpen}/>
    <details className="sv-deep-review"><summary>자세한 관찰 기록·가져오기·방문 경험</summary>
    <div className="fn-collection-title"><div><span className="fn-eyebrow">MY FIELD NOTES</span><h1>한 사람의 관찰이,<br />다음 확인의 시작이 됩니다.</h1><p>같은 사진을 다시 열고, 근거와 수정 이유를 이어서 남겨요.</p></div><div className="fn-record-count"><b>{records.length}</b><span>저장한 사진 기록</span></div></div>
    <div className="fn-collection-tools"><select aria-label="관찰 기록 필터" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">모든 기록</option><option value="unknown">잘 보이지 않음 · 확인 불가</option>{FINALS_PLACES.filter(site => records.some(record => record.evidence.placeId === site.id)).map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</select><button onClick={() => setRefresh(value => value + 1)}>저장소에서 다시 읽기</button><button disabled={!records.length} onClick={() => exportNotes(records)}><DownloadSimple size={18} /> 전체 기록 내보내기</button><label className="fn-file-button"><TrayArrowDown size={18} /> 기록 파일 가져오기<input type="file" accept=".json,application/json" onChange={selectFile} /></label></div>
    <p className="fn-storage-note">이 브라우저에 저장된 기록입니다. 파일은 다른 기기의 같은 버전 앱에서 가져올 수 있습니다. 기존 기록이 있는 사진은 자동으로 덮어쓰지 않습니다.</p>
    {error && <p role="alert" className="fn-error">{error}</p>}{notice && <p role="status" className="fn-success">{notice}</p>}
    {packet && <div className="fn-import"><h2>가져올 기록 {packet.count}개</h2><p>{packet.names.join(' · ')}</p><div className="fn-actions"><button className="fn-primary" disabled={busy} onClick={confirmImport}>확인한 파일 저장</button><button disabled={busy} onClick={() => setPacket(null)}>취소</button></div></div>}
    {loading ? <p role="status">기록을 불러오는 중…</p> : !records.length ? <div className="fn-empty"><Notebook size={48} weight="duotone" /><h2>아직 저장한 관찰이 없어요.</h2><p>실제 사진 한 장에서 시작해 보세요.<br />모르는 이유도 다음 사람에게 도움이 됩니다.</p><button className="fn-primary" onClick={() => onOpen('hanbit', 'approach')}>한빛탑 사진에서 기록 시작 <ArrowRight size={18} /></button></div> : <div className="fn-collection-layout"><div className="fn-record-list">{filtered.map(record => <button className="fn-saved-row" aria-pressed={opened === record.key} key={record.key} onClick={() => setOpened(record.key)}><img src={record.evidence.image} alt="" /><div><small>{record.evidence.placeName} · v{record.version}</small><strong>{record.note.subject}</strong><span>{STATUS_LABELS[record.note.status]} · {dateLabel(record.savedAt)}</span></div><ArrowRight size={18} /></button>)}{!filtered.length && <p>이 조건의 기록이 없습니다.</p>}</div><div>{selected ? <><RecordCard record={selected} /><button className="fn-primary fn-reopen" onClick={() => onOpen(selected.evidence.placeId, selected.evidence.pointId)}>이 사진에서 재검토하기 <ArrowRight size={18} /></button></> : <div className="fn-select-note"><Notebook size={38} /><h2>기록을 골라 다시 살펴보세요.</h2><p>사진 출처와 그동안의 수정 이력도 함께 열립니다.</p></div>}</div></div>}
    <ParticipationArchive onOpen={onOpen} />
    </details>
  </main>;
}
