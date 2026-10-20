import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Buildings, MapTrifold, MapPin, Camera, ArrowRight, Info, Question, X, Leaf, ArrowLeft, ArrowClockwise, MagnifyingGlassPlus, CheckCircle, WarningCircle, CaretDown } from '@phosphor-icons/react';
import './CityExplorer.css';

const MiniatureScene = lazy(() => import('./MiniatureScene'));
const CityCoordinateMap = lazy(() => import('./CityCoordinateMap'));
const placeLabels = { matched: '같은 장소로 판단', mismatched: '다른 장소로 판단', uncertain: '확인 불가' };
const observationLabels = { approach: '접근 경로', threshold: '문턱·단차', doorway: '출입문 주변' };

function goToReview(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'entrance-review'); url.searchParams.set('entrance', id); url.searchParams.set('returnMode', 'city-explorer');
  url.hash = ''; window.location.assign(url);
}

export default function CityExplorer({ request, sync, actor }) {
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('entrance'));
  const [view, setView] = useState('map');
  const [showUnselected, setShowUnselected] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const dialog = useRef(null);
  const entry = entries.find(item => item.id === selectedId) ?? entries.find(item => item.selectionStatus === 'selected_pending_human_place_match') ?? entries[0];
  const photo = entry?.images[photoIndex] ?? entry?.images[0];
  const review = entry?.review;
  const currentReview = review?.evidenceVersion === entry?.evidenceVersion ? review : null;
  const selectEntry = id => { setSelectedId(id); setPhotoIndex(0); setPanelOpen(true); setShowUnselected(false); };
  const selectedPhotoSet = entry?.selectionStatus === 'selected_pending_human_place_match';
  useEffect(() => {
    if (sync.mode !== 'server') return;
    let cancelled = false;
    request('').then(result => { if (!cancelled) { setEntries(result.entries); setError(''); } })
      .catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [request, sync.mode, actor?.id, revision]);
  const connected = sync.mode === 'server';
  return <main className="cx-app">
    <header className="cx-header">
      <a className="cx-logo" href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), mode: 'city-explorer' })}`} aria-label="모두의 50m 도시 첫 화면">모두의 <strong>50<span>m</span></strong></a>
      <p className="cx-tagline">대전, 입구까지 확인하기 · <a href="?mode=hanbit">한빛탑 V1 열기</a></p>
      <div className="cx-header-actions"><span className="cx-preview-badge">{view === 'map' ? '실제 대전 좌표 · 원본 사진' : '가상 모형 · 실제 배치 아님'}</span><button aria-expanded={helpOpen} onClick={() => setHelpOpen(value => !value)}><Question size={21} />도움말</button></div>
    </header>
    <div className={`cx-workspace ${panelOpen ? '' : 'cx-panel-closed'}`}>
      <section className="cx-stage" aria-label="대전 도시 탐색">
        <Suspense fallback={<div className="cx-loading" role="status">{view === 'miniature' ? '3D 도시를 준비하고 있어요…' : '실제 지도를 준비하고 있어요…'}</div>}>
          {view === 'miniature' ? <MiniatureScene entries={entries.slice(0, 3)} selectedId={entry?.id} onSelect={selectEntry} /> : <CityCoordinateMap entries={entries} selectedId={entry?.id} photo={selectedPhotoSet || showUnselected ? photo : null} onSelect={selectEntry} />}
        </Suspense>
        <nav className="cx-view-switch" aria-label="도시 보기 방식"><button aria-pressed={view === 'map'} onClick={() => setView('map')}><MapTrifold size={21} />실제 대전 지도</button><button aria-pressed={view === 'miniature'} onClick={() => setView('miniature')}><Buildings size={21} weight="duotone" />V1 가상 모형</button></nav>
        <aside className="cx-intro"><MapPin size={28} weight="duotone" /><div><h1>{view === 'miniature' ? <>디자인 참고용 가상 도시<br />실제 대전 배치가 아닙니다.</> : <>실제 위치에서,<br />사진 근거까지.</>}</h1><p>{view === 'miniature' ? '실제 좌표·입구 확인은 실제 대전 지도에서 해 주세요. 이 모형은 공간을 임의로 배치했습니다.' : '시설 후보와 사진 촬영 위치를 함께 확인해 보세요. 지도 건물도 3D로 볼 수 있어요.'}</p><span>{entries.length}곳 · 선정 사진 {entries.filter(item => item.selectionStatus === 'selected_pending_human_place_match').reduce((count, item) => count + item.images.length, 0)}장 · 나머지는 재선정 대상</span></div></aside>
        {!panelOpen && <button className="cx-reopen" onClick={() => setPanelOpen(true)}><Camera size={20} />사진과 기록 열기</button>}
        <div className="cx-compass"><span>N</span><p>{view === 'miniature' ? <>드래그: 회전 · 휠: 확대<br />오른쪽 드래그: 이동</> : <>시설 위치와 입구 위치는 달라요.<br />사진과 함께 확인해 주세요.</>}</p></div>
      </section>
      {panelOpen && <aside className="cx-details" aria-label="선택 장소의 로드뷰 사진과 기록">
        <div className="cx-detail-heading"><span className="cx-kicker"><Camera size={16} />우리가 찾은 로드뷰</span><button className="cx-icon-button" aria-label="사진 패널 닫기" onClick={() => setPanelOpen(false)}><X size={21} /></button></div>
        {entry ? <>
          <h2>{entry.name}</h2><p className="cx-address">{entry.address}</p>
          <label className="cx-place-select">다른 장소 보기<select value={entry.id} onChange={event => selectEntry(event.target.value)}>{entries.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select><CaretDown size={16} aria-hidden="true" /></label>
          <div className={selectedPhotoSet ? 'cx-selection-note' : 'cx-selection-warning'}><strong>{selectedPhotoSet ? '기존 시각 검토에서 선정한 사진' : '대표 입구 사진 없음 · 재선정 필요'}</strong><p>{entry.selectionReason}</p><small>{selectedPhotoSet ? '사진 속 표지·입구를 관찰한 선정 결과이며 현장 확인·접근성 인증은 아닙니다.' : '수집에 성공했다는 사실만으로 해당 시설의 입구 사진으로 사용하지 않습니다.'}</small>{!selectedPhotoSet && <button aria-expanded={showUnselected} onClick={() => setShowUnselected(value => !value)}>{showUnselected ? '미확정 원본 접기' : '미확정 수집 원본 비교하기'}</button>}</div>
          {(selectedPhotoSet || showUnselected) && <>
          <figure className="cx-photo"><button aria-label={`${entry.name} ${photo.key} 사진 크게 보기`} onClick={() => dialog.current.showModal()}><img src={photo.url} alt={`${entry.name} 검수 대상 로드뷰 ${photo.key}. 장소 일치 여부는 별도 확인 필요.`} /><span className="cx-photo-zoom"><MagnifyingGlassPlus size={18} />크게 보기</span><span className="cx-photo-number">{photoIndex + 1} / {entry.images.length}</span></button><figcaption>촬영 {photo.captureDate?.slice(0, 10) || '시점 미상'} · {photo.key}</figcaption></figure>
          <div className="cx-photo-thumbs" aria-label="로드뷰 사진 선택">{entry.images.map((item, index) => <button key={item.id} aria-label={`로드뷰 사진 ${index + 1} 선택`} aria-pressed={photoIndex === index} onClick={() => setPhotoIndex(index)}><img src={item.url} alt="" /><span>{item.key}</span></button>)}</div>
          <details className="cx-source-details"><summary>촬영 위치·방향·원본 확인</summary><p>시설 후보: {entry.lat.toFixed(6)}, {entry.lng.toFixed(6)}</p><p>촬영 위치: {photo.panoLat?.toFixed(6)}, {photo.panoLng?.toFixed(6)}</p><p>후보 좌표까지 {photo.targetDistanceMeters}m · 방향 {photo.heading}°</p><p>파노라마 ID {photo.panoId}</p>{photo.roadviewUrl && <a href={photo.roadviewUrl} target="_blank" rel="noopener noreferrer">동일 파노라마를 카카오에서 확인 ↗</a>}</details>
          </>}
          <div className="cx-observation"><MapPin size={26} weight="fill" /><div><div className="cx-row"><h3>장소 일치</h3><strong>{currentReview ? placeLabels[currentReview.placeMatch] : '확인 필요'}</strong></div><p>{currentReview?.placeNote || '원래 찾던 시설·출입구가 맞는지, 표지판과 주변 모습을 보고 확인해 주세요.'}</p></div></div>
          <div className="cx-observation"><Buildings size={26} weight="fill" /><div><div className="cx-row"><h3>문턱·단차</h3><strong>{currentReview?.observations.threshold.status === 'observed' ? '사진 관찰' : '확인 불가'}</strong></div><p>{currentReview?.observations.threshold.note || '사진만으로 보이지 않는 부분은 현장에서 다시 확인해야 해요.'}</p></div></div>
          {currentReview && <details className="cx-saved-review"><summary><CheckCircle size={17} />서버 기록 v{currentReview.version} 보기</summary><p>{currentReview.recordOrigin === 'automated_qa' ? '자동 QA 기록 · 학생 수행 결과 아님' : '계정으로 작성한 사진 관찰 기록'}</p>{Object.entries(observationLabels).map(([key, label]) => <p key={key}><strong>{label}</strong> {currentReview.observations[key].note}</p>)}<p>다음 확인: {currentReview.nextAction}</p></details>}
          {review && !currentReview && <p className="cx-error">사진 근거가 바뀌었습니다. 기존 기록을 확인하고 다시 검수해 주세요.</p>}
          <button className="cx-primary" onClick={() => goToReview(entry.id)}><Camera size={23} />사진 근거·검수 기록 열기<ArrowRight size={20} /></button>
          <div className="cx-evidence-note"><Info size={20} /><p>실제 수집 사진입니다. 시설 후보 좌표이며, 출입구와 현재 이용 가능 여부는 아직 확정하지 않았습니다.</p></div>
          <div className="cx-mission"><Leaf size={28} weight="duotone" /><div><strong>모두가 함께 만드는<br />더 가까운 대전</strong><p>사진 한 장에서, 다음 확인으로.</p></div></div>
          <button className="cx-refresh" disabled={loading || !connected} onClick={() => { setLoading(true); setRevision(value => value + 1); }}><ArrowClockwise size={15} />{loading ? '기록 확인 중…' : '서버 기록 새로고침'}</button>
        </> : <div className="cx-empty"><Camera size={40} /><h2>{loading && connected ? '사진을 불러오고 있어요' : '사진 연결을 확인해 주세요'}</h2><p>{connected ? error || '서버의 원본 사진과 기록을 연결합니다.' : '서버에 연결되어야 사진 목록과 검수 기록을 가져올 수 있습니다.'}</p><button onClick={() => { setLoading(true); setRevision(value => value + 1); }}>다시 확인</button></div>}
        {error && <p className="cx-error" role="alert"><WarningCircle size={18} />{error}</p>}
      </aside>}
    </div>
    {helpOpen && <aside className="cx-help" aria-label="사용 도움말"><div><h2>이렇게 둘러보세요</h2><button className="cx-icon-button" aria-label="도움말 닫기" onClick={() => setHelpOpen(false)}><X size={21} /></button></div><p><strong>실제 대전 지도</strong> — 시설 후보 좌표와 촬영 위치입니다. 건물 3D는 지도 윤곽 기반이며 높이가 일부 추정되어 실제 외관과 같지 않습니다.</p><p><strong>V1 가상 모형</strong> — 디자인 참고용 도시이며 실제 대전 배치가 아닙니다. 휠체어 이동도 가상 시연으로 길 안내가 아닙니다.</p><p><strong>내 위치</strong> — 버튼을 누르고 브라우저에서 허용할 때만 표시합니다. 이 앱 서버에 저장하지 않습니다.</p><p><strong>사진 선정</strong> — 입구가 보이는 기존 선정 사진과 재선정할 수집 원본을 분리했습니다. 선정은 현장 확인 완료를 뜻하지 않습니다.</p><p className="cx-help-boundary">실제 지도는 인터넷 연결이 필요합니다. 촬영일과 현재 현장은 다를 수 있습니다.</p></aside>}
    <dialog className="cx-photo-dialog" ref={dialog}><form method="dialog"><button aria-label="확대 사진 닫기"><X size={22} />닫기</button></form>{photo && <><img src={photo.url} alt={`${entry.name} ${photo.key} 원본 로드뷰`} /><h2>{entry.name} · {photo.key}</h2><p>촬영 {photo.captureDate?.slice(0, 10)} · 장소·입구 일치 여부는 검수 필요</p><p className="cx-photo-id">사진 ID {photo.id}</p><div className="cx-dialog-nav"><button disabled={photoIndex === 0} onClick={() => setPhotoIndex(value => value - 1)}><ArrowLeft size={18} />이전 사진</button><button disabled={photoIndex === entry.images.length - 1} onClick={() => setPhotoIndex(value => value + 1)}>다음 사진<ArrowRight size={18} /></button></div></>}</dialog>
  </main>;
}
