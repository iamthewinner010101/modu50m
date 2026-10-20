import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Archive, ClockCounterClockwise, MapPin, ArrowRight, Check, Info, DownloadSimple, X, Camera } from '@phosphor-icons/react';
import { ARCHIVE, OBSERVATIONS } from '../data/hanbitPrecinct.js';
import { HANBIT_SITE, PRECINCTS, isRecordForSite } from '../data/daejeonPrecincts.js';
import { blankDraft, createRecord, readRecords, saveRecord, exportRecords } from '../utils/hanbitRecords.js';
import HanbitEvidencePanel from './HanbitEvidencePanel.jsx';
import './HanbitPrecinct.css';
import './PrecinctExperience.css';

const HanbitScene = lazy(() => import('./HanbitScene.jsx'));
const dateLabel = value => new Date(value).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function HanbitPrecinct({ site = HANBIT_SITE, onPlaceChange }) {
  const { checkpoints: CHECKPOINTS, version: PRECINCT_VERSION } = site;
  const [selectedId, setSelectedId] = useState(site.id === 'hanbit' ? 'threshold' : 'approach');
  const [viewMode, setViewMode] = useState('photos');
  const [drafts, setDrafts] = useState(() => Object.fromEntries(CHECKPOINTS.map(p => [p.id, blankDraft(p.id, site)])));
  const [records, setRecords] = useState([]), [dirtyIds, setDirtyIds] = useState([]);
  const [saving, setSaving] = useState(false), [savedIds, setSavedIds] = useState([]);
  const [error, setError] = useState(''), [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(''), [archiveIndex, setArchiveIndex] = useState(0);
  const historyRef = useRef(null), archiveRef = useRef(null), helpRef = useRef(null);
  const evidenceRef = useRef(null), stageRef = useRef(null);
  const placeDialogRef = useRef(null);
  const [pendingPlace, setPendingPlace] = useState(null);
  const point = CHECKPOINTS.find(p => p.id === selectedId), draft = drafts[selectedId];
  const archivedPhoto = ARCHIVE[archiveIndex];
  const selectPoint = useCallback(id => {
    setSelectedId(id); setViewMode('photos'); setError(''); setNotice('');
    if (window.matchMedia('(max-width: 700px)').matches) requestAnimationFrame(() => {
      evidenceRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  }, []);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = '모두의 50m · ' + site.name + ' 로드뷰';
    return () => { document.title = previousTitle; };
  }, [site]);
  useEffect(() => {
    let cancelled = false;
    readRecords().then(items => { if (!cancelled) setRecords(items.filter(record => isRecordForSite(record, site))); }).catch(err => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, [site]);
  const isDirty = dirtyIds.length > 0;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!isDirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);
  function changeDraft(id, patch) {
    setDrafts(current => ({ ...current, [id]: { ...current[id], ...patch } }));
    setDirtyIds(ids => ids.includes(id) ? ids : [...ids, id]);
    setSavedIds(ids => ids.filter(value => value !== id)); setError(''); setNotice('');
  }
  async function save() {
    const id = selectedId; setError(''); setSaving(true);
    try {
      const record = createRecord(id, drafts[id], { site }); await saveRecord(record);
      setRecords(current => [record, ...current]); setSavedIds(ids => [...new Set([...ids, id])]);
      setDirtyIds(ids => ids.filter(value => value !== id)); setNotice(`${CHECKPOINTS.find(p => p.id === id).title} 기록을 이 브라우저에 저장했어요.`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  function openRecord(record) {
    if (record.precinctVersion !== PRECINCT_VERSION) { window.alert('이 기록은 위치 정의가 다른 이전 지점 정의의 기록입니다. 메모는 이 목록에서 읽고 JSON으로 보관할 수 있습니다. 현재 지점의 검증 결과로 가져오지 않습니다.'); return; }
    if (dirtyIds.includes(record.checkpointId) && !window.confirm('이 지점의 저장하지 않은 입력을 보관된 기록으로 바꿀까요?')) return;
    setSelectedId(record.checkpointId);
    setDrafts(current => ({ ...current, [record.checkpointId]: { observation: record.observation, note: record.note, nextAction: record.nextAction, photo: record.photo } }));
    setDirtyIds(ids => ids.filter(id => id !== record.checkpointId));
    setSavedIds(ids => [...new Set([...ids, record.checkpointId])]); setError('');
    setNotice('저장한 기록을 다시 열었어요. 수정한 내용은 다시 저장해 주세요.'); historyRef.current.close();
  }
  function exportCurrent() {
    try { exportRecords([createRecord(selectedId, draft, { site })]); setNotice('현재 입력을 JSON 파일로 내보냈어요. 브라우저 저장과는 별도입니다.'); }
    catch (err) { setError(err.message); }
  }
  const recordedPoints = new Set(records.filter(r => r.precinctVersion === PRECINCT_VERSION).map(r => r.checkpointId)).size;
  function changePlace(id) {
    if (id === site.id || saving) return;
    if (isDirty) { setPendingPlace(id); placeDialogRef.current.showModal(); return; }
    onPlaceChange?.(id);
  }
  function nextPoint() {
    const index = CHECKPOINTS.findIndex(p => p.id === selectedId);
    selectPoint(CHECKPOINTS[(index + 1) % CHECKPOINTS.length].id);
  }
  return <main className="hb-app hb-v4">
    <dialog className="hb-dialog hb-place-dialog" ref={placeDialogRef} aria-labelledby="hb-place-dialog-title"><div className="hb-dialog-heading"><h2 id="hb-place-dialog-title">저장하지 않은 입력이 있어요</h2></div><div className="hb-scope-copy"><p>장소를 바꾸면 아직 저장하지 않은 메모와 선택이 사라집니다. 먼저 기록을 저장할까요?</p><div className="hb-place-dialog-actions"><button autoFocus onClick={()=>placeDialogRef.current.close()}>이어서 작성하기</button><button onClick={()=>{ placeDialogRef.current.close(); onPlaceChange?.(pendingPlace); }}>저장하지 않고 장소 변경</button></div></div></dialog>
    <header className="hb-header"><a className="hb-logo" href="?mode=hanbit" aria-label="모두의 50m 첫 화면">모두의 <strong>50<span>m</span></strong><i /></a><p>입구 앞, 아직 모르는 것을 확인하다.</p><div className="hb-header-actions"><button onClick={() => archiveRef.current.showModal()}><Archive size={19} />기존 자료</button><button onClick={() => historyRef.current.showModal()}><ClockCounterClockwise size={19} />저장 기록<span className="hb-count">{records.length}</span></button><button aria-label="이 화면의 근거와 범위" className="hb-icon-button" onClick={() => helpRef.current.showModal()}><Info size={21} /></button></div></header>
    {onPlaceChange && <nav className="hb-place-switcher" aria-label="대전 확인 장소 선택"><div className="hb-places-intro"><MapPin size={23} /><span>대전의 세 장소<small>한 번에 하나씩 확인해요</small></span></div>{PRECINCTS.map(p=><button key={p.id} className="hb-place-card" aria-label={p.name + ' 장소 선택'} aria-pressed={p.id===site.id} disabled={saving} onClick={()=>changePlace(p.id)}><strong>{p.name}</strong></button>)}</nav>}
    <div className="hb-workspace">
      <aside className="hb-route-panel" aria-label={site.name + ' 확인 지점 목록'}>
        <h2 className="hb-rail-title">{site.shortName} · 촬영 위치</h2>
        <p className="hb-rail-caption"><Camera size={16} />번호를 누르면 사진이 열려요</p>
        <ol className="hb-point-list">{CHECKPOINTS.map(p => <li key={p.id}><button aria-label={`촬영 위치 ${p.number} ${p.title}`} aria-pressed={p.id === selectedId} onClick={() => selectPoint(p.id)}><span className="hb-point-card-heading"><span className="hb-point-number">{p.number}</span><strong>{p.title}</strong><ArrowRight size={16} /></span><img src={site.photos[p.id].image} alt="" /><span className="hb-point-card-meta">{site.photos[p.id].captureDate.slice(0,4)}년 촬영{site.photos[p.id].historical ? ' · 과거 자료' : ''}{dirtyIds.includes(p.id) ? ' · 작성 중' : ''}</span></button></li>)}</ol>
        <div className="hb-left-note"><Info size={17} /><p>번호는 카메라 위치입니다.<br />위험·출입문 위치가 아닙니다.</p></div>
        <div className="hb-record-progress"><span>관찰 기록 {recordedPoints} / 3</span><small>현장 검증과 별개</small></div>
        <button className="hb-local-export" onClick={exportCurrent}><DownloadSimple size={16} />현재 입력 내보내기</button>
      </aside>
      <Suspense fallback={<section className="hb-stage hb-loading" role="status">{site.name} 미니어처를 준비하고 있어요…</section>}><HanbitScene stageRef={stageRef} site={site} selectedId={selectedId} onSelect={selectPoint} mode={viewMode} onModeChange={setViewMode} /></Suspense>
      <HanbitEvidencePanel panelRef={evidenceRef} onBackToMap={() => stageRef.current?.scrollIntoView({ block: 'start' })} site={site} onNext={nextPoint} key={selectedId} point={point} draft={draft} onChange={patch => changeDraft(selectedId, patch)} onSave={save} saving={saving} saved={savedIds.includes(selectedId)} error={error} />
    </div>
    <footer className="hb-footer"><span><span className="hb-status-dot" />모두의 50m · V4</span><p>축약 모형 · 휠체어 이동은 예시이며 실제 출발·도착 경로는 검증 전입니다.</p><button onClick={() => helpRef.current.showModal()}>근거와 범위<ArrowUpRight size={13} /></button></footer>
    <div className="hb-toast" role="status" aria-live="polite">{notice && <span><Check size={17} />{notice}</span>}</div>
    <dialog className="hb-dialog" ref={historyRef} aria-labelledby="hb-history-title"><div className="hb-dialog-heading"><div><span>이 브라우저에 보관</span><h2 id="hb-history-title">저장한 관찰 기록</h2></div><form method="dialog"><button aria-label="저장 기록 닫기"><X size={21} /></button></form></div><p className="hb-dialog-intro">저장 날짜와 관찰을 확인하고 다시 열 수 있어요. 현장 검증 결과는 아닙니다. 지금 선택한 장소의 기록만 표시합니다.</p>{loadError && <p role="alert" className="hb-error">{loadError}</p>}{records.length ? <><div className="hb-history-list">{records.map(record => <button key={record.id} onClick={() => openRecord(record)}><span><strong>{record.precinctVersion === PRECINCT_VERSION ? CHECKPOINTS.find(p => p.id === record.checkpointId)?.title : '이전 지점 정의의 기록'}</strong><small>{dateLabel(record.savedAt)} · {record.evidenceStatus === 'source_retrieved_pending_field' ? '수집 로드뷰 · 현장 확인 전' : record.photo ? '사용자 연결 사진' : '사진 없음'}</small><p>{record.note || record.nextAction}</p></span><span className="hb-history-status">{OBSERVATIONS.find(o => o.value === record.observation)?.label}<ArrowRight size={17} /></span></button>)}</div><button className="hb-primary" onClick={() => exportRecords(records)}><DownloadSimple size={18} />전체 기록 내보내기</button></> : <div className="hb-dialog-empty"><ClockCounterClockwise size={35} /><h3>아직 저장한 기록이 없어요</h3><p>확인 지점에서 관찰과 다음 확인 내용을 저장해 보세요.</p></div>}</dialog>
    <dialog className="hb-dialog hb-archive-dialog" ref={archiveRef} aria-labelledby="hb-archive-title"><div className="hb-dialog-heading"><div><span>이전 대전 생활시설 자료</span><h2 id="hb-archive-title">우리가 찾은 로드뷰</h2></div><form method="dialog"><button aria-label="기존 자료 닫기"><X size={21} /></button></form></div><div className="hb-archive-tabs" aria-label="기존 자료 장소">{ARCHIVE.map((item, index) => <button key={item.id} aria-pressed={index === archiveIndex} onClick={() => setArchiveIndex(index)}>{item.name}</button>)}</div><figure><img src={archivedPhoto.image} alt={`${archivedPhoto.name} 수집 원본. 장소와 접근성은 별도 확인 필요.`} /><figcaption><Camera size={16} />{archivedPhoto.key} · {archivedPhoto.date ? `촬영 ${archivedPhoto.date}` : '촬영일은 원본 메타데이터 확인 필요'}</figcaption></figure><h3>{archivedPhoto.name}</h3><p>{archivedPhoto.note}</p><p className="hb-archive-boundary"><Info size={17} />이 사진들은 현재 선택한 장소의 근거가 아닙니다. 해당 장소의 경로나 입구 근거로 사용하지 않습니다.</p><a className="hb-text-link" href="?mode=city-explorer">기존 실제 지도·검수 화면 열기<ArrowUpRight size={16} /></a></dialog>
    <dialog className="hb-dialog" ref={helpRef} aria-labelledby="hb-scope-title"><div className="hb-dialog-heading"><div><span>모두의 50m · {site.name}</span><h2 id="hb-scope-title">이 화면의 근거와 범위</h2></div><form method="dialog"><button aria-label="근거와 범위 닫기"><X size={21} /></button></form></div><div className="hb-scope-copy"><h3>작동하는 것</h3><p>실제 촬영좌표에 맞춘 01·02·03 선택, 수집 로드뷰 즉시 보기·확대·카카오 원본 열기, 관찰 저장·재열기·내보내기입니다. 휠체어 이동 예시는 별도 모드이며 실제 경로가 아닙니다.</p><h3>아직 확정하지 않은 것</h3><p>건물 기준점·외곽은 OpenStreetMap, 촬영좌표는 Kakao panorama 원본에서 가져와 같은 좌표계에 배치했습니다. 주변 건물 형태와 도로 폭은 축약 표현입니다. 실제 휠체어 출발점·이동 경로·이용 출입문·단차·경사와 통행 가능 여부는 아직 확정하지 않았습니다.</p><h3>사진과 저장</h3><p>선택한 장소의 로드뷰 3시점을 미리 연결했습니다. 예술의전당 01은 2017년 서측 주차장 사진이며, 다른 사진들은 2025년 9월 자료입니다. 정확한 촬영일은 각 사진에 표시합니다. 생성 이미지가 아닙니다. 원본에서 시야를 추출한 사진이며, 업로드 없이 열립니다. 기록에는 원본 번호·촬영일·좌표·사진 해시를 함께 저장합니다. 원본 360° 보기는 인터넷이 필요합니다. 사진 관찰 자체는 저장 버튼을 눌러야 보존됩니다.</p><p>이 브라우저·이 주소에서만 다시 볼 수 있습니다. 브라우저 데이터를 지우면 사라질 수 있으니 JSON 내보내기로 별도 보관해 주세요. 서버 제출·공개 업로드·현장검증 완료 처리는 하지 않습니다.</p><h3>다음 현장 조사</h3><p>로드뷰에서 남긴 확인 질문을 가지고 실제 보행 연결과 사용하는 출입문을 조사합니다. 출입문 근접 근거가 없으므로 실제 이용 출입문·문턱·문 앞 공간을 현장에서 별도로 확인합니다.</p><p><a className="hb-text-link" href={site.sourceUrl} target="_blank" rel="noreferrer">지도 위치: © OpenStreetMap contributors (ODbL)<ArrowUpRight size={14} /></a></p><p>사진: Kakao Roadview · 수집일 2026-09-17 · 촬영일은 각 원본 참조</p><p><a className="hb-text-link" href={site.officialUrl} target="_blank" rel="noreferrer">{site.name} 공식 안내<ArrowUpRight size={14} /></a></p></div></dialog>
  </main>;
}
