import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera, CaretRight, CheckSquare, Compass, CornersOut, Eye, Images, Info, MapPin, Minus, Plus, Stack, WheelchairMotion, X } from '@phosphor-icons/react';
import { PREVIEW_PRECINCTS as LEGACY_PRECINCTS, photoProviderLabel, photoDateLabel } from '../data/previewRoadviewSelection.js';
import { photoCaption } from '../data/previewCityPlaces.js';
import { FINALS_PLACES, getFinalsPlace as getPrecinct, PRESENTATION_STEPS } from '../data/finalsCatalog.js';
import { NotebookCollection } from './PhotoNotebook.jsx';
import { FinalsOpening, PresentationBar } from './FinalsJourney.jsx';
import { getPlaceMiniature } from '../data/placeMiniatures.js';
import { countPhotos } from '../data/finalsDiscovery.js';
import routePhotoAlbums from '../data/routePhotoAlbums.js';
import DaejeonCityOverview from './DaejeonCityOverview.jsx';
import FocusedPlaces from './FocusedPlaces.jsx';
import CoreNeighborhoodMap from './CoreNeighborhoodMap.jsx';
import { getCoreCase } from '../data/coreNeighborhoods.js';
import WheelchairPhotoReview from './WheelchairPhotoReview.jsx';
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {readJourneyLocation} from '../utils/journeyLocation.js';
import {RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import {journeyGallery} from '../data/journeyGallery.js';
import { focusStartPoint, FOCUSED_VISITS } from '../data/focusedVisits.js';
import { getDefaultReviewIndex, getPlaceReview } from '../data/wheelchairPhotoReview.js';
import './DaejeonVisualPreview.css';
import './CoreNeighborhoodMap.css';
import FirstVisitHelp from './FirstVisitHelp.jsx';
import './ServicePolish.css';

// Presentation assets and pin locations are deliberately schematic, not geospatial data.
const OVERVIEW = '/modu50m/visual-preview-v1/daejeon-miniature.png';
const PLACE_PINS = { hanbit: [69, 24], arts: [24, 60], museum: [59, 76] };
const PLACE_COPY = {
  hanbit: '대전의 상징, 한빛탑 주변을 살펴보세요.',
  arts: '공연을 만나기 전, 건물 주변부터 살펴보세요.',
  museum: '전시를 만나기 전, 접근 환경을 살펴보세요.',
};
const PHOTO_COUNT = countPhotos([...FINALS_PLACES,...Object.values(routePhotoAlbums).map(groups=>({photos:Object.values(groups).flat()}))]);
const REPRESENTATIVE_PHOTOS = new Set(RECOMMENDED_PLACE_IDS.flatMap(id=>['bus','parking'].flatMap(arrival=>journeyGallery(getPrecinct(id),getArrivalRoute(id,arrival)).map(photo=>photo.image)))).size;
const MOVEMENT_PLACE_COUNT = FINALS_PLACES.filter(site => getPlaceReview(site).hasSegments).length;

function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);
  return <dialog className="mv5-dialog" ref={ref} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-label={title}>
    <div className="mv5-dialog-head"><h2>{title}</h2><button type="button" aria-label="닫기" onClick={onClose}><X size={24} /></button></div>
    {children}
  </dialog>;
}

export default function DaejeonVisualPreview() {
  const [placeId, setPlaceId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('place');
    return FINALS_PLACES.some(place => place.id === requested) ? requested : 'hanbit';
  });
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('view');
    if (requested === 'precinct' && params.has('place') && !LEGACY_PRECINCTS.some(place => place.id === params.get('place'))) return 'city';
    return ['focus', 'core', 'detail', 'precinct', 'city', 'story', 'notebook'].includes(requested) ? requested : 'focus';
  });
  const [coreId, setCoreId] = useState(() => getCoreCase(new URLSearchParams(window.location.search).get('focus')).id);
  const detail = view === 'detail';
  const [pointIndex, setPointIndex] = useState(() => {
    const initialSite = getPrecinct(placeId);
    const params = new URLSearchParams(window.location.search);
    const arrival = params.get('arrival') === 'parking' ? 'parking' : 'bus';
    const route = getArrivalRoute(placeId, arrival) || getArrivalRoute(placeId);
    const location = readJourneyLocation(window.location.search, route);
    const requested = route?.steps[location?.index]?.pointId || params.get('point') || (arrival === 'parking' ? route?.steps[0]?.pointId : null);
    const found = initialSite.checkpoints.findIndex(checkpoint => checkpoint.id === requested);
    return found >= 0 ? found : FOCUSED_VISITS[initialSite.id] ? initialSite.checkpoints.findIndex(p=>p.id===focusStartPoint(initialSite)) : getDefaultReviewIndex(initialSite);
  });
  const [zoom, setZoom] = useState(1);
  const [modal, setModal] = useState(null);
  const [recordRevision, setRecordRevision] = useState(0);
  const [presenter, setPresenter] = useState(false);
  const [presentStep, setPresentStep] = useState(0);
  const panelRef = useRef(null);
  const site = getPrecinct(placeId);
  const point = site.checkpoints[pointIndex];
  const photo = site.photos[point.id];
  const model = getPlaceMiniature(placeId);
  const caption = photoCaption(photo);
  const provider = photoProviderLabel(photo);

  useEffect(() => {
    const prior = document.title;
    document.title = '모두의50m · 가고 싶은 곳, 마지막 길부터 함께 살펴봐요';
    return () => { document.title = prior; };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'visual-preview');
    url.searchParams.set('view', view);
    url.searchParams.set('place', placeId);
    url.searchParams.set('focus', coreId);
    url.searchParams.set('point', site.checkpoints[pointIndex].id);
    window.history.replaceState(null, '', url);
  }, [view, placeId, coreId, pointIndex, site]);

  function selectPlace(id, openDetail = false, requestedPoint = null) {
    const url = new URL(window.location.href);
    ['step', 'routePhoto', 'comments', 'arrival'].forEach(key => url.searchParams.delete(key));
    window.history.replaceState(null, '', url);
    const nextSite = getPrecinct(id);
    const requestedIndex = nextSite.checkpoints.findIndex(checkpoint => checkpoint.id === requestedPoint);
    setPlaceId(id); setPointIndex(requestedIndex >= 0 ? requestedIndex : FOCUSED_VISITS[nextSite.id] ? nextSite.checkpoints.findIndex(p=>p.id===focusStartPoint(nextSite)) : getDefaultReviewIndex(nextSite)); setView(openDetail ? 'detail' : 'precinct'); setZoom(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function selectPhoto(index, scroll = false) {
    setPointIndex(index);
    if (scroll && window.matchMedia('(max-width: 980px)').matches) panelRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function goOverview() { setView('focus'); setZoom(1); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function goAllPlaces() { setView('city'); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function goNotebook() { setView('notebook'); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function presentationStep(index) {
    const next = PRESENTATION_STEPS[index];
    setPresentStep(index);
    if (next.point) selectPlace(next.place || 'hanbit', true, next.point);
    else { setView(next.view); window.scrollTo({ top: 0, behavior: 'instant' }); }
  }
  useEffect(() => {
    if (!presenter) return;
    const {anchor,anchorSelector} = PRESENTATION_STEPS[presentStep];
    if (!anchor&&!anchorSelector) return;
    // Lazy images in closed sections may never decode until the visitor opens them.
    // The current DOM target is ready; do not hold the presentation on hidden images.
    const frame=requestAnimationFrame(() => {
      const target=anchor?document.getElementById(anchor):document.querySelector(anchorSelector);
      for(let parent=target?.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [presenter, presentStep, view]);

  return <div className={`mv5 ${presenter ? 'has-presenter' : ''}`}>
    <a href="#mv5-main" className="mv5-skip">본문으로 이동</a>
    <header className="mv5-header">
      <button className="mv5-logo" onClick={goOverview} aria-label="모두의 50m 처음 방문 준비 보기">모두의 <strong>50m<span>.</span></strong></button>
      <p className="mv5-tagline">가고 싶은 곳,<br /><strong>마지막 길부터 함께 살펴봐요.</strong></p>
      <div className="mv5-header-right"><FirstVisitHelp/><span className="mv5-count"><Images size={20} /> 대표 {RECOMMENDED_PLACE_IDS.length}곳 사진 <b>{REPRESENTATIVE_PHOTOS}</b></span><button className="fn-header-present" aria-pressed={presenter} onClick={() => { setPresenter(value => !value); if (!presenter) presentationStep(0); }}>5분 시연 가이드</button><button className="mv5-icon-button" aria-label="작품 안내" onClick={() => setModal('about')}><Info size={23} /></button></div>
    </header>
    {new URLSearchParams(location.search).get('qa') === '1' && <div className="fn-qa">자동 검사 전용 저장 공간 · 실제 사용자 기록과 분리됨</div>}

    <nav className="cm-navigation" aria-label="지도 보기 선택">
      <button aria-pressed={view === 'focus'} onClick={goOverview}><MapPin size={17} /> 처음 방문 준비</button>
      <button aria-pressed={view === 'city'} onClick={goAllPlaces}>다른 장소 자료</button>
      <button aria-pressed={view === 'core'} onClick={() => setView('core')}>핵심 지역 지도</button>
      <button aria-pressed={view === 'notebook'} onClick={goNotebook}>내 관찰 기록</button>
      <span>{detail ? `${site.name} · 실제 사진 살펴보기` : '장소 선택 → 사진 관찰 → 기록하고 이어보기'}</span>
    </nav>

    {view === 'focus' ? <FocusedPlaces onSelect={(id, pointId) => selectPlace(id, true, pointId)} onArchive={goAllPlaces} /> : view === 'story' ? <FinalsOpening onStart={() => presenter ? presentationStep(1) : goOverview()} /> : view === 'notebook' ? <NotebookCollection revision={recordRevision} onOpen={(id, pointId) => selectPlace(id, true, pointId)} /> : view === 'core' ? <CoreNeighborhoodMap selectedId={coreId} onChange={setCoreId} onSelect={(id, pointId) => selectPlace(id, true, pointId)} onAllPlaces={goAllPlaces} placeCount={FINALS_PLACES.length} /> : view === 'city' ? <DaejeonCityOverview onSelect={id => selectPlace(id, true)} /> : detail ? <WheelchairPhotoReview key={site.id} site={site} pointIndex={pointIndex} onSelectPhoto={selectPhoto} onOpenPhoto={() => setModal('photo')} onBack={goOverview} onRecords={goNotebook} onSaved={() => setRecordRevision(value => value + 1)} /> : <main id="mv5-main" className="mv5-layout">
      <aside className="mv5-sidebar" aria-label={detail ? '사진 목록' : '장소 목록'}>
        <div className="mv5-sidebar-title"><h2>{detail ? '사진으로 살펴볼 곳' : '어디로 가볼까요?'}</h2><p>{detail ? '번호를 누르면 사진이 바뀝니다.' : '장소를 골라 사진을 확인하세요.'}</p></div>
        <div className="mv5-side-cards">{detail ? site.checkpoints.map((checkpoint, index) => <button key={checkpoint.id} className={`mv5-point-card ${pointIndex === index ? 'is-selected' : ''}`} aria-pressed={pointIndex === index} onClick={() => selectPhoto(index, true)}>
          <div className="mv5-card-heading"><span className="mv5-number">{checkpoint.number}</span><strong>{checkpoint.title}</strong><CaretRight size={16} /></div>
          <img src={site.photos[checkpoint.id].image} alt={`${site.shortName} ${checkpoint.title} 실제 사진`} />
          <small><Camera size={13} /> {photoDateLabel(site.photos[checkpoint.id])} · {photoProviderLabel(site.photos[checkpoint.id])}</small>
        </button>) : LEGACY_PRECINCTS.map((place, index) => <button key={place.id} className={`mv5-place-card ${placeId === place.id ? 'is-selected' : ''}`} aria-pressed={placeId === place.id} onClick={() => selectPlace(place.id)}>
          <img src={place.thumbnail} alt={`${place.name} 주변 실제 사진`} />
          <div className="mv5-place-card-content"><small>0{index + 1} <span>{place.category}</span></small><strong>{place.name}</strong><span className="mv5-card-link"><Camera size={14} /> 주변 사진 3장 <CaretRight size={14} /></span></div>
        </button>)}</div>
        <div className="mv5-sidebar-note"><WheelchairMotion size={24} /><p>가까운 한 구간부터,<br /><strong>내게 필요한 정보를.</strong></p></div>
      </aside>

      <section className="mv5-stage" aria-label="미니어처 지도">
        <div className="mv5-stage-intro">
          <div className="mv5-breadcrumb"><span>대전</span><CaretRight size={12} /><span>{detail ? site.district : '엑스포 · 둔산 문화권역'}</span>{detail && <><CaretRight size={12} /><span>{site.shortName}</span></>}</div>
          <div className="mv5-title-row"><div><h1>{detail ? (site.referenceOnly ? site.name : '주변부터, 사진으로 먼저.') : '대전, 가까운 곳부터.'}</h1><p>{detail ? site.description || `${site.name} 주변의 사진을 한 장씩 살펴보세요.` : '익숙한 장소도, 가기 전에 한 번 더 살펴보세요.'}</p></div><span className="mv5-step-label">{detail ? '02' : '01'}<small> / 02</small></span></div>
          <div className="mv5-stage-actions">{detail ? <button className="mv5-back-button" onClick={goOverview}><ArrowLeft size={17} /> 대전 전체 보기</button> : <span className="mv5-overview-hint"><MapPin size={18} /> 지도 위 장소를 눌러보세요</span>}<span className="mv5-model-label"><Stack size={16} /> 미니어처 시안</span></div>
        </div>

        <div className="mv5-map-window">
          <div className="mv5-map-art" style={{ transform: `scale(${zoom})` }}>
            <img className="mv5-miniature" src={detail ? model.image : OVERVIEW} alt={detail ? model.alt : '한빛탑, 갑천, 엑스포다리, 한밭수목원과 예술의전당·시립미술관을 표현한 AI 미니어처 개념도. 정확한 축척의 지도가 아닙니다.'} />
            {detail ? model.photoPins.map(([x, y], index) => <button key={index} className={`mv5-pin mv5-photo-pin ${pointIndex === index ? 'is-selected' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${site.checkpoints[index].number} ${site.checkpoints[index].title} 사진 보기`} aria-pressed={pointIndex === index} onClick={() => selectPhoto(index, true)}><span className="mv5-pin-icon"><MapPin size={55} weight="fill" /><b>{site.checkpoints[index].number}</b></span>{pointIndex === index && <span className="mv5-pin-title">{site.checkpoints[index].short || site.checkpoints[index].title}</span>}</button>) : LEGACY_PRECINCTS.map(place => <button key={place.id} className={`mv5-pin mv5-place-pin ${placeId === place.id ? 'is-selected' : ''}`} style={{ left: `${PLACE_PINS[place.id][0]}%`, top: `${PLACE_PINS[place.id][1]}%` }} aria-label={`지도에서 ${place.name} 선택`} aria-pressed={placeId === place.id} onClick={() => selectPlace(place.id, detail)}><span className="mv5-pin-icon"><MapPin size={48} weight="fill" /><Camera size={18} weight="bold" /></span><span className="mv5-pin-title">{place.name}<small>사진 3장</small></span></button>)}
            {!detail && <><span className="mv5-landmark mv5-river">갑천</span><span className="mv5-landmark mv5-garden">한밭수목원</span><span className="mv5-landmark mv5-bridge">엑스포다리</span></>}
          </div>
          <div className="mv5-zoom-controls"><button aria-label="미니어처 확대" disabled={zoom >= 1.3} onClick={() => setZoom(value => Math.min(1.3, +(value + .1).toFixed(1)))}><Plus size={20} /></button><button aria-label="미니어처 축소" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, +(value - .1).toFixed(1)))}><Minus size={20} /></button><button aria-label="미니어처 배율 초기화" onClick={() => setZoom(1)}><CornersOut size={19} /></button></div>
          <span className="mv5-map-note">{detail ? '사진 참고 AI 모형 · 축척은 근사 · 번호는 실제 촬영 위치가 아닙니다' : 'AI 개념 모형 · 건물 형태와 핀 위치는 예시'}</span>
        </div>

        <div className="mv5-stage-bottom">{detail ? <div className="mv5-filmstrip" aria-label="사진 빠른 선택">{site.checkpoints.map((checkpoint, index) => <button key={checkpoint.id} className={pointIndex === index ? 'is-selected' : ''} aria-label={`아래 목록 ${checkpoint.number} ${checkpoint.title}`} aria-pressed={pointIndex === index} onClick={() => selectPhoto(index, true)}><img src={site.photos[checkpoint.id].image} alt="" /><span><b>{checkpoint.number}</b>{checkpoint.title}</span></button>)}</div> : <div className="mv5-selection-card"><span className="mv5-selection-icon"><MapPin size={27} weight="duotone" /></span><div><small>선택한 장소</small><h2>{site.name}</h2><p>{PLACE_COPY[placeId]}</p></div><button className="mv5-primary" onClick={() => { setView('detail'); setZoom(1); }}>사진 살펴보기 <ArrowRight size={18} /></button></div>}</div>
      </section>

      <aside className="mv5-evidence" ref={panelRef} aria-label="선택한 실제 사진">
        <div className="mv5-evidence-eyebrow"><span><Camera size={16} /> {photo.mobilityEvidence ? '실제 이동 구간 사진' : '실제 참고 사진'}</span><span>{pointIndex + 1} / {site.checkpoints.length}</span></div>
        <div className="mv5-photo-heading"><span className="mv5-number">{point.number}</span><div><h2>{point.title}</h2><p><MapPin size={13} /> {site.name}</p><small className="mv5-coverage">{site.coverage}</small></div></div>
        <button className={`mv5-main-photo ${site.referenceOnly ? 'mv6-reference-photo' : ''}`} aria-label={`${point.title} 사진 크게 보기`} onClick={() => setModal('photo')}><img src={photo.image} alt={`${site.name} ${point.title}. ${point.hint}`} /><span><CornersOut size={16} /> 크게 보기</span></button>
        <div className="mv5-photo-meta"><span>{caption}</span><span>{provider}</span></div>
        {photo.attribution && <p className="mv6-attribution">{photo.attribution}{photo.licenseUrl && <> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.licenseLabel || '이용 조건'} ↗</a></>}</p>}
        <div className="mv5-photo-actions"><button onClick={() => setModal('photo')}><CornersOut size={17} /> 사진 확대</button><a href={photo.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${provider} 원본 열기`}><Compass size={18} /> 원본 사진 출처 <ArrowUpRight size={15} /></a></div>
        <div className="mv5-observation"><h3><Eye size={20} /> 이 사진에서 살펴볼 것</h3><p>{point.question}</p>{point.features && <div className="mv5-feature-tags">{point.features.map(feature => <span key={feature}>{feature}</span>)}</div>}</div>
        <div className="mv5-field-check"><h3><CheckSquare size={20} /> 방문 전, 한 번 더 확인</h3><p>{point.next}</p></div>
        <div className="mv5-caution"><Info size={18} /><p>{photo.historical ? '과거 사진입니다. 현재 상태와 통행 가능 여부는 확인 전입니다.' : '사진만으로 현재 통행 가능 여부를 확정할 수 없어요.'}</p></div>
        {site.checkpoints.length > 1 && <button className="mv5-next-photo" onClick={() => selectPhoto((pointIndex + 1) % site.checkpoints.length)}><span>다음 사진 살펴보기<small>{site.checkpoints[(pointIndex + 1) % site.checkpoints.length].title}</small></span><ArrowRight size={20} /></button>}
      </aside>
    </main>}
    <footer className="mv5-footer"><span><MapPin size={14} weight="fill" /> 모두의 50m <i /> 휠체어로 가기 전, 마지막 길</span><span>공개 사진과 안내로 방문 준비 · 현재 통행 여부는 추가 확인</span></footer>
    {presenter && <PresentationBar step={presentStep} onStep={presentationStep} onClose={() => setPresenter(false)} />}

    {modal && <Modal title={modal === 'photo' ? `${site.name} · ${point.title}` : '모두의 50m · 이용 안내'} onClose={() => setModal(null)}>{modal === 'photo' ? <>
      <img className="mv5-modal-photo" src={photo.image} alt={`${site.name} ${point.title} 확보한 사진 확대`} />
      <p className="mv5-modal-caption">{caption} · {provider} · {photo.captureMethod === 'visible-browser-screenshot-clip' ? '거리뷰 화면 일부 캡처 · ' : ''}현재 통행 가능 여부 미확인</p>
      {photo.attribution && <p className="mv6-attribution">{photo.attribution}{photo.licenseUrl && <> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.licenseLabel || '이용 조건'} ↗</a></>}</p>}
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{provider} {site.referenceOnly ? '사진 출처' : '원본 장면'} 열기 ↗</a>
    </> : <div className="mv5-about">
      <h2>가고 싶은 곳, 길부터 미리 살펴봐요.</h2>
      <p>장소를 고르고, 미니어처 번호를 눌러 정류장부터 입구까지의 실제 사진을 살펴보세요. 관찰한 점은 개인 메모에 남기고, 위치 링크를 다른 사람에게 보낼 수 있습니다.</p>
      <p>미니어처는 전체 위치와 순서를 이해하는 참고 모형입니다. 바닥과 문 앞의 세부 모습은 실제 사진으로 확인해 주세요.</p>
      <details><summary>전체 자료의 범위·사진 출처·보관 방법</summary>
      <p>{FINALS_PLACES.length}곳의 상세 모형은 실제 외관 사진을 참고해 AI로 만든 근사 표현입니다. 모형 번호는 사진 선택 버튼이며 실제 촬영 좌표나 출입구 위치를 나타내지 않습니다. 전체 도시 모형은 지역 선택용 개념도입니다. 한빛탑·오월드에는 공개 도로·건물 좌표와 공식 사진 구역을 표시한 위치 지도가 있으며, 카카오 지도·스카이뷰와 배치를 대조했습니다. 높이와 경사는 실측하지 않았습니다.</p>
      <p>대표 {RECOMMENDED_PLACE_IDS.length}곳의 버스·주차장 동선에 실제 참고 사진 {REPRESENTATIVE_PHOTOS}개를 연결했습니다. 같은 이미지 경로는 한 번 셉니다. 별도로 보관한 기존 장소 자료까지 포함하면 사진은 {PHOTO_COUNT}장이고, {MOVEMENT_PLACE_COUNT}곳에 길을 살펴볼 사진이 있습니다. 거리뷰와 공개 현장 사진에서 보도·횡단 지점·진입부를 비교합니다. 외관 참고와 이동 구간을 구분하며, 모르는 촬영일을 게시일로 대신하지 않습니다.</p>
      <p>내 관찰 기록과 방문 준비 카드는 이 브라우저에 저장됩니다. 이 공개 화면에서는 여러 사람이 함께 쓰는 댓글·답글·공감을 제공하지 않습니다. 예시 메모는 실제 이용자 경험과 구분해 표시합니다. 자동 길찾기나 통행 가능 판정 기능은 아닙니다.</p>
      <p>모형 외관 참고: {FINALS_PLACES.map((place, index) => <span key={place.id}>{index > 0 && ' · '}<a href={getPlaceMiniature(place.id).referenceUrl || Object.values(place.photos)[0].sourceUrl} target="_blank" rel="noreferrer">{place.name} ↗</a></span>)}</p>
      <p>대전역 사진: *Youngjin · 신탄진역 사진: Integral. 두 역의 모형은 해당 사진을 참고한 AI 재구성이며 동일한 <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a> 조건으로 제공합니다. 각 사진의 촬영 시기와 이용 조건은 상세 출처에 표시합니다.</p>
      </details>
    </div>}</Modal>}
  </div>;
}
