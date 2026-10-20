import { useEffect, useState } from 'react';
import './EntranceReviewWorkspace.css';

const labels = { approach: '접근 경로', threshold: '문턱·단차', doorway: '출입문 주변' };
const placeLabels = { matched: '같은 장소·입구로 판단', mismatched: '다른 장소·입구', uncertain: '일치 여부 확인 불가' };

function createDraft(entry, saved) {
  return saved?.evidenceVersion === entry.evidenceVersion ? structuredClone(saved) : {
    evidenceVersion: entry.evidenceVersion, placeMatch: '', placeNote: '', entranceLabel: '',
    placeImageIds: [entry.images[0].id], nextAction: '',
    observations: Object.fromEntries(Object.keys(labels).map(key => [key, { status: 'unknown', note: '', imageIds: [entry.images[0].id] }])),
  };
}

function EvidenceCard({ entry, review, history }) {
  const download = () => {
    const blob = new Blob([JSON.stringify({ schema: 'modu50m.evidence_handoff.v1', entry, review, history }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `${entry.id}-v${review.version}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="er-card">
    <p className="er-eyebrow">03 / 근거 전달</p><h2>다음 사람이 이어 볼 수 있는 기록</h2>
    <p>{entry.name} · {review.entranceLabel}</p>
    <dl><dt>장소 판단</dt><dd>{placeLabels[review.placeMatch]} — {review.placeNote}</dd>
      {Object.entries(labels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{review.observations[key].status === 'unknown' ? '확인 불가' : '사진 관찰'} — {review.observations[key].note}<small>근거: {review.observations[key].imageIds.join(', ')}</small></dd></div>)}
      <dt>다음 확인 작업</dt><dd>{review.nextAction}</dd><dt>저장 정보</dt><dd>v{review.version} · {review.updatedAt}<small>작성 계정: {review.updatedBy} · {review.recordOrigin}</small></dd></dl>
    <p className="er-boundary">사진 관찰 기록입니다. 접근 가능 인증, 학생 직접 수행, 현장 확인 완료를 뜻하지 않습니다.</p>
    <button type="button" onClick={download}>근거 카드 JSON 내려받기</button>
    <details><summary>수정 이력 {history.length}개 (최근 100개)</summary><ol>{history.map(item => <li key={item.version}>v{item.version} · {item.updatedAt} · {placeLabels[item.placeMatch]}<p>{item.nextAction}</p></li>)}</ol></details>
  </section>;
}

function ReviewEditor({ initial, request, readOnly, onBack, onSaved }) {
  const [detail, setDetail] = useState(initial);
  const [draft, setDraft] = useState(() => createDraft(initial.entry, initial.review));
  const [stage, setStage] = useState('review');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState(null);
  const [notice, setNotice] = useState('');
  const entry = detail.entry;
  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const changePlace = (value) => setDraft(current => ({ ...current, placeMatch: value,
    observations: Object.fromEntries(Object.entries(current.observations).map(([key, item]) => [key, { ...item, status: value === 'matched' ? item.status : 'unknown' }])) }));
  const changeObservation = (key, field, value) => setDraft(current => ({ ...current,
    observations: { ...current.observations, [key]: { ...current.observations[key], [field]: value } } }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await request(`/${entry.id}/review`, { method: 'PUT', body: JSON.stringify({
        expectedVersion: detail.review?.version ?? 0,
        review: { ...draft, recordOrigin: new URLSearchParams(window.location.search).get('qa') === '1' ? 'automated_qa' : 'user_input' },
      }) });
      // Keep the acknowledged version even if the subsequent independent read fails.
      setDetail(result); onSaved();
      const readback = await request(`/${entry.id}`);
      setDetail(readback); setDraft(createDraft(entry, readback.review)); setStage('card');
      setNotice(`서버 저장 후 다시 읽기 완료 · v${readback.review.version}`);
    } catch (err) { setError(err.message); setConflict(err.status === 409); }
    finally { setBusy(false); }
  }
  async function inspectLatest() {
    setBusy(true);
    try { setLatest(await request(`/${entry.id}`)); } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <>
    <nav className="er-toolbar" aria-label="검수 단계">
      <button disabled={busy} onClick={onBack}>목록으로</button>
      <button aria-pressed={stage === 'review'} onClick={() => setStage('review')}>사진 검수</button>
      <button disabled={!detail.review} aria-pressed={stage === 'card'} onClick={() => setStage('card')}>저장된 근거 카드</button>
    </nav>
    {error && <p role="alert" className="er-error">{error}</p>}
    {notice && <p role="status" className="er-notice">{notice}</p>}
    {conflict && <div className="er-card"><p>현재 입력은 남아 있습니다. 자동 덮어쓰기는 하지 않습니다.</p><button disabled={busy} onClick={inspectLatest}>최신 기록 비교</button>
      {latest && <><pre>{JSON.stringify(latest.review, null, 2)}</pre><button onClick={() => { setDetail(latest); setDraft(createDraft(latest.entry, latest.review)); setConflict(false); setLatest(null); setError(''); }}>내 입력을 버리고 최신 기록으로 다시 작성</button></>}</div>}
    {stage === 'card' && detail.review ? <EvidenceCard entry={entry} review={detail.review} history={detail.history} /> : <div className="er-workbench">
      <section className="er-card"><p className="er-eyebrow">02 / 사진 근거</p><h2>{entry.name}</h2><p>{entry.address}</p>
        <p className="er-muted">시설 후보 좌표이며 특정 출입구 좌표는 아직 미확정입니다.</p>
        {entry.images.map(image => <figure key={image.id}><img src={image.url} alt={`${entry.name} 로드뷰 ${image.key} — 장소 일치 여부는 검수 필요`} />
          <figcaption>{image.key} · 촬영 {image.captureDate?.slice(0, 10) || '시점 미상'}<small>사진 ID {image.id}</small><details><summary>원본 해시·출처</summary><code>{image.sha256}</code><small>{image.sourcePath}</small></details></figcaption></figure>)}
      </section>
      <form className="er-card" onSubmit={save}><p className="er-eyebrow">사람의 판단 / v{detail.review?.version ?? 0}</p><h2>보이는 것과 모르는 것 나누기</h2>
        {detail.review && detail.review.evidenceVersion !== entry.evidenceVersion && <p className="er-boundary">사진 근거가 바뀌어 새 검수가 필요합니다. 이전 기록은 근거 카드에 보존하고, 입력란은 비웠습니다.</p>}
        <p className="er-muted">촬영 시점의 사진입니다. 사진만으로 경사·폭을 실측하거나 현재 접근 가능 여부를 확정하지 마세요.</p>
        <fieldset disabled={busy || readOnly}><legend>장소·입구 확인</legend>
          <label>장소 일치 여부<select required value={draft.placeMatch} onChange={event => changePlace(event.target.value)}><option value="">선택해 주세요</option>{Object.entries(placeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>출입구 위치 또는 미확정 이유<input required maxLength={180} value={draft.entranceLabel} onChange={event => update('entranceLabel', event.target.value)} placeholder="예: 도로 쪽 출입구 후보, 표지판 확인 필요" /></label>
          <label>장소 판단 근거<textarea required maxLength={1200} value={draft.placeNote} onChange={event => update('placeNote', event.target.value)} /></label>
          <label>장소 판단 사진<select value={draft.placeImageIds[0]} onChange={event => update('placeImageIds', [event.target.value])}>{entry.images.map(image => <option key={image.id} value={image.id}>{image.key}</option>)}</select></label>
        </fieldset>
        {Object.entries(labels).map(([key, label]) => <fieldset key={key} disabled={busy || readOnly}><legend>{label}</legend>
          <label>{label} 상태<select value={draft.observations[key].status} onChange={event => changeObservation(key, 'status', event.target.value)}><option value="unknown">확인 불가</option><option disabled={draft.placeMatch !== 'matched'} value="observed">사진에서 관찰</option></select></label>
          <label>{label} 관찰 또는 확인 불가 이유<textarea required maxLength={1200} value={draft.observations[key].note} onChange={event => changeObservation(key, 'note', event.target.value)} /></label>
          <label>{label} 근거 사진<select value={draft.observations[key].imageIds[0]} onChange={event => changeObservation(key, 'imageIds', [event.target.value])}>{entry.images.map(image => <option key={image.id} value={image.id}>{image.key}</option>)}</select></label>
        </fieldset>)}
        <label>다음 확인 작업<textarea required disabled={busy || readOnly} maxLength={1200} value={draft.nextAction} onChange={event => update('nextAction', event.target.value)} placeholder="누가 무엇을 다시 확인하면 되는지 구체적으로 작성" /></label>
        <p className="er-boundary">임시 입력은 자동 저장되지 않습니다. 저장 전 목록으로 가면 입력이 사라집니다.</p>
        <button className="er-primary" type="submit" disabled={busy || readOnly || conflict}>{busy ? '서버 확인 중…' : readOnly ? '읽기 전용 계정' : '서버에 저장하고 근거 카드 보기'}</button>
      </form>
    </div>}
  </>;
}

export default function EntranceReviewWorkspace({ request, sync, actor, onBack, initialEntranceId, backLabel = '대전 전체 후보' }) {
  const [catalog, setCatalog] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (sync.mode !== 'server') return;
    let cancelled = false;
    request('').then(result => { if (!cancelled) { setCatalog(result); setError(''); } })
      .catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [request, sync.mode, actor?.id, revision]);
  useEffect(() => {
    if (!initialEntranceId || sync.mode !== 'server') return;
    let cancelled = false;
    request(`/${encodeURIComponent(initialEntranceId)}`).then(result => { if (!cancelled) setDetail(result); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [initialEntranceId, request, sync.mode, actor?.id]);
  async function open(entry) {
    setLoading(true); setError('');
    try { setDetail(await request(`/${entry.id}`)); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  const qa = new URLSearchParams(window.location.search).get('qa') === '1';
  return <main className="er-app">
    <header className="er-header"><div><p className="er-eyebrow">모두의 50m / 본선 준비</p><h1>입구를 확인하고, 근거를 남깁니다.</h1><p>사진 → 장소 판단 → 관찰·확인 불가 → 다음 확인 작업</p></div><button onClick={onBack}>{backLabel}</button></header>
    <p className="er-boundary">{qa ? '자동 QA 전용 · 실사용·학생 수행 결과에 포함하지 않음' : '연결 표본 · 대전 전체 검수 완료를 의미하지 않음'} · 외부 AI 호출 없음</p>
    {sync.mode !== 'server' && <p role="status" className="er-error">서버 연결이 필요합니다. {sync.detail} 로컬 임시 저장으로 완료 처리하지 않습니다.</p>}
    {error && <p role="alert" className="er-error">{error}</p>}
    {detail ? <ReviewEditor key={detail.entry.id} initial={detail} request={request} readOnly={actor?.role === 'read_only'} onBack={() => { setDetail(null); setLoading(true); setRevision(value => value + 1); }} onSaved={() => setRevision(value => value + 1)} /> : <section>
      <div className="er-toolbar"><h2>01 / 연결된 검수 목록</h2><button disabled={loading || sync.mode !== 'server'} onClick={() => { setLoading(true); setRevision(value => value + 1); }}>서버 목록 새로고침</button></div>
      {loading && <p role="status">서버에서 불러오는 중…</p>}
      <div className="er-grid">{catalog?.entries.map(entry => <article className="er-card" key={entry.id}>
        <p className="er-boundary">{entry.selectionStatus === 'selected_pending_human_place_match' ? '기존 선정 사진 · 사람의 장소 확인 필요' : '미확정 수집 원본 · 대표 입구 사진 아님'}</p>
        <img className="er-thumb" src={entry.images[0].url} alt={`${entry.name} 검수 대상 사진`} /><h3>{entry.name}</h3><p>{entry.address}</p>
        <p className="er-status">{entry.review ? `${placeLabels[entry.review.placeMatch]} · v${entry.review.version}` : '검수 전 · 입구 미확정'}</p>
        <small>원천 후보 {entry.alias}<br />사진 {entry.images.length}장 · 학생·현장 증거 승격 없음</small>
        <button className="er-primary" disabled={loading} onClick={() => open(entry)}>사진과 기록 열기</button>
      </article>)}</div>
    </section>}
  </main>;
}
