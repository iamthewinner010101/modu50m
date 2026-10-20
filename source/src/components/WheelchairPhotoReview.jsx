import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera, CornersOut, Eye, Info, Warning, WheelchairMotion } from '@phosphor-icons/react';
import { photoProviderLabel } from '../data/previewRoadviewSelection.js';
import { photoCaption } from '../data/previewCityPlaces.js';
import { getPhotoReview, getPlaceReview } from '../data/wheelchairPhotoReview.js';
import { HANBIT_ARRIVAL, HANBIT_OBSTACLE_GUIDANCE } from '../data/hanbitArrival.js';
import HanbitArrivalGuide from './HanbitArrivalGuide.jsx';
import { PlaceSceneOverview } from './FinalsJourney.jsx';
import { PhotoNoteEditor } from './PhotoNotebook.jsx';
import { getMiniatureScenes } from '../data/placeMiniatures.js';
import MobilityPhotoStrip from './MobilityPhotoStrip.jsx';
import { visitPurpose } from '../data/visitPreparation.js';
import LocalParticipation from './LocalParticipation.jsx';
import VisitPreparationPanel from './VisitPreparationPanel.jsx';
import { FOCUSED_VISITS } from '../data/focusedVisits.js';
import {hasJourneyModel} from '../data/journeyModels.js';
import {VISIT_SCOPES} from '../data/visitScopes.js';
import {TRANSPORT_ARRIVALS} from '../data/transportArrivals.js';
import TransportArrivalPreparation from './TransportArrivalPreparation.jsx';
import './VisitScope.css';
import './WheelchairPhotoReview.css';

export default function WheelchairPhotoReview({ site, pointIndex, onSelectPhoto, onOpenPhoto, onBack, onRecords, onSaved }) {
  const [focusIndex, setFocusIndex] = useState(0);
  const [magnified, setMagnified] = useState(false);
  const [markers, setMarkers] = useState(true);
  const [hasRoutePhoto, setHasRoutePhoto] = useState(true);
  const [intent,setIntent]=useState(()=>new URLSearchParams(location.search).get('arrival')===site.id?'arrival':'visit');
  const arrivalMode=Boolean(TRANSPORT_ARRIVALS[site.id])&&intent==='arrival';
  const scope=VISIT_SCOPES[site.id];
  function chooseIntent(value){
    setIntent(value);
    const url=new URL(location.href);
    if(value==='arrival')url.searchParams.set('arrival',site.id);else url.searchParams.delete('arrival');
    history.replaceState(null,'',url);
  }
  const detailReview=useRef(null);
  const streamlined=hasJourneyModel(site.id);
  const photoCard = useRef(null);
  const observationPanel = useRef(null);
  const selectionTrigger = useRef(null);
  const isHanbit = site.id === 'hanbit';
  const focusedVisit = FOCUSED_VISITS[site.id];
  const point = site.checkpoints[pointIndex];
  const photo = site.photos[point.id];
  const review = getPhotoReview(site, point.id);
  const placeReview = getPlaceReview(site);
  const provider = photoProviderLabel(photo);
  const selection = site.checkpoints.map((checkpoint, index) => ({ checkpoint, index, review: getPhotoReview(site, checkpoint.id) }))
    .sort((a, b) => Number(b.review.kind === 'segment') - Number(a.review.kind === 'segment'));
  const selectedObservation = review.observations[Math.min(focusIndex, review.observations.length - 1)];
  const guidance = selectedObservation.effect && selectedObservation.check
    ? selectedObservation
    : isHanbit && selectedObservation.position ? HANBIT_OBSTACLE_GUIDANCE[selectedObservation.label] : null;
  const arrivalIndex = HANBIT_ARRIVAL.steps.findIndex(step => step.id === point.id);
  const nextArrival = isHanbit && arrivalIndex >= 0 ? HANBIT_ARRIVAL.steps[arrivalIndex + 1] : null;
  const extraScenes = isHanbit ? getMiniatureScenes(site).filter(scene => scene.mobilityPhoto) : [];
  const nextScene = selection[selection.findIndex(item => item.index === pointIndex) + 1];
  useEffect(() => {
    const trigger = selectionTrigger.current;
    if (trigger && !trigger.isConnected) {
      document.querySelector(`[data-mobility-photo="${site.id}/${point.id}"]`)?.focus({ preventScroll: true });
    }
    selectionTrigger.current = null;
  }, [site.id, point.id]);
  function selectPhoto(index) {
    selectionTrigger.current = document.activeElement;
    setFocusIndex(0); setMagnified(false); setMarkers(true); onSelectPhoto(index);
  }
  function selectArrival(pointId, scrollToPhoto = false) {
    const index = site.checkpoints.findIndex(checkpoint => checkpoint.id === pointId);
    if (index < 0) return;
    selectPhoto(index);
    if (scrollToPhoto) photoCard.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function selectObstacle(index) {
    setFocusIndex(index);
    if (isHanbit && window.matchMedia('(max-width: 1050px)').matches) observationPanel.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
  }
  function revealReview(record=false){
    if(detailReview.current)detailReview.current.open=true;
    requestAnimationFrame(()=>{const target=record?document.getElementById('fn-editor'):photoCard.current;target?.scrollIntoView({behavior:'instant',block:'start'});});
  }
  const obstacleDetails = <><p className="wr-observation-detail" role="status">{selectedObservation.detail}</p>{guidance && <div className="wr-impact"><p><b>이동할 때 생각할 점</b>{guidance.effect}</p><p><b>확인할 내용</b>{guidance.check}</p></div>}</>;

  return <main id="mv5-main" className={`wr-review ${isHanbit ? 'wr-arrival-review' : ''} ${streamlined?'sv-review':''}`}>
    <div className="wr-heading">
      <div className={streamlined?"jvf-heading-main":undefined}><button className="wr-back" onClick={onBack} aria-label="대표 장소 보기"><ArrowLeft size={20}/><span>대표 장소 보기</span></button><div className="wr-eyebrow"><WheelchairMotion size={21} /> 가고 싶은 곳, 마지막 길부터 함께 살펴봐요.</div><h1>{arrivalMode?TRANSPORT_ARRIVALS[site.id].title:scope?.title||(isHanbit?'한빛탑 방문 준비':site.name)}</h1>{streamlined&&!arrivalMode?<details className="jvf-visit-scope"><summary><span>방문 범위</span><Info size={19}/></summary><p className="vp-purpose">{visitPurpose(site)}</p>{scope&&<p className="vscope-boundary">{scope.boundary}</p>}</details>:<><p className="vp-purpose">{arrivalMode?TRANSPORT_ARRIVALS[site.id].summary:visitPurpose(site)}</p>{scope&&!arrivalMode&&<p className="vscope-boundary">{scope.boundary}</p>}</>}</div>
      <div className="wr-heading-actions"><div className="wr-status"><b>사진으로 방문 준비</b><span>현재 통행 여부는 추가 확인</span></div>{!streamlined&&(!focusedVisit || hasRoutePhoto) && <button className="fn-primary" onClick={() => revealReview(true)}>이 사진에 기록 남기기</button>}</div>
    </div>

    {!focusedVisit && <details className="vp-sequence"><summary>방문 전에 살펴볼 순서 · 출발지 → 주변 길 → 문 앞</summary><h2>세 부분을 나누어 살펴봐요.</h2><p>아래는 확인할 순서예요. 사진 사이를 이어 주는 실제 이동 경로는 아직 확인하지 않았어요.</p><ol><li><b>1 · 어디에서 내려서 갈까요?</b><span>이용할 정류장·지하철 출구 또는 주차장을 먼저 정해요.</span><small>버스 노선·하차 위치와 이 사진까지의 연결은 별도 확인</small></li><li><b>2 · 주변 길을 살펴봐요</b><span>지금 보는 사진: {review.title}</span><small>{review.kind === 'segment' ? '사진에 담긴 보도·바닥·진입부 일부를 관찰해요.' : '외관 참고 사진이에요. 이동 구간 사진이 더 필요해요.'}</small></li><li><b>3 · 문 앞까지 이어질까요?</b><span>{placeReview.missingShots[0]}</span><small>이 구간 사진이 더 필요해요 · 문까지 연결 확인 전</small></li></ol></details>}

    {TRANSPORT_ARRIVALS[site.id]&&<div className="ta-modes" role="group" aria-label="대전역·터미널 이용 목적"><button aria-pressed={!arrivalMode} onClick={()=>chooseIntent('visit')}>{site.id==='station'?'시내버스에서 서광장으로':'시내버스에서 건물 입구로'}<small>{site.id==='station'?'12410 정류장 → 서광장 출입부':'11830 정류장 → 서관 GATE 4'} · 미니어처와 사진</small></button><button aria-pressed={arrivalMode} onClick={()=>chooseIntent('arrival')}>대전에 도착한 뒤<small>{site.id==='station'?'열차 승강장 → 다음 교통편':'동관 하차장 → 다음 교통편'} · 별도 방문 준비</small></button></div>}
    {TRANSPORT_ARRIVALS[site.id]&&<div hidden={!arrivalMode}><TransportArrivalPreparation key={`arrival/${site.id}`} placeId={site.id}/></div>}
    {focusedVisit && <div hidden={arrivalMode}><VisitPreparationPanel key={`preparation/${site.id}`} site={site} pointIndex={pointIndex} onSelect={selectPhoto} onViewPhoto={()=>revealReview()} onRecord={()=>revealReview(true)} onPhotoAvailabilityChange={setHasRoutePhoto} /></div>}

    {isHanbit && !focusedVisit && !point.mobilityPhoto && <><HanbitArrivalGuide selectedPoint={point.id} entrancePhotoId={extraScenes[0]?.id} onSelectPoint={selectArrival} onViewPhoto={() => photoCard.current?.scrollIntoView({ behavior: 'instant', block: 'start' })} /><MobilityPhotoStrip scenes={extraScenes} currentId={point.id} onSelect={selectPhoto} placeId={site.id} /></>}
    {!focusedVisit && (!isHanbit || point.mobilityPhoto) && <PlaceSceneOverview site={site} pointIndex={pointIndex} onSelect={selectPhoto} onViewPhoto={() => photoCard.current?.scrollIntoView({ behavior: 'instant', block: 'start' })} />}

    {!placeReview.hasSegments && <div className="wr-empty-notice"><Camera size={26} /><div><h2>이동할 길이 보이는 사진이 더 필요해요.</h2><p>현재는 외관 참고 자료만 있습니다. 위 미니어처와 아래 실제 사진으로 장소를 살펴보고, 보도·턱·문 앞 연결은 추가로 확인해야 합니다.</p></div></div>}

    {!arrivalMode&&(!focusedVisit || hasRoutePhoto) && <details ref={detailReview} className="sv-deep-review" open={!streamlined}><summary>이 사진의 자세한 관찰·공감·방문 경험 기록</summary><div className="wr-workspace">
      <section className="wr-photo-column" aria-label="휠체어 이동 구간 사진">
        {!isHanbit && <div className="wr-photo-tabs" role="group" aria-label="살펴볼 사진 선택">{selection.map(({ checkpoint, index, review: item }) => <button key={checkpoint.id} aria-pressed={pointIndex === index} className={pointIndex === index ? 'is-selected' : ''} onClick={() => selectPhoto(index)}><span>{item.kind === 'segment' ? '이동 구간 일부' : '보조 · 외관 참고'}</span><strong>{item.title}</strong></button>)}</div>}
        <div className="wr-photo-card" id="wr-photo-stage" ref={photoCard}>
          <div className="wr-photo-title"><span><Camera size={17} /> {provider}</span><span>{photoCaption(photo)}</span></div>
          <h2>{review.title}</h2>
          {review.observations.some(item => item.position) && <div className="wr-obstacle-legend"><span><Warning size={16} weight="fill" /> 살펴볼 지점 {review.observations.filter(item => item.position).length}곳</span><span>{review.observations.filter(item => item.position).map((_, index) => String.fromCharCode(65 + index)).join('·')}를 눌러 설명 보기</span></div>}
          {photo.mobilityEvidence && <p className="wr-marker-note">{photo.scope}{photo.sameViewpointAs ? ' 같은 촬영 지점에서 방향을 달리한 사진입니다.' : ''}</p>}
          <div className={`wr-photo-frame ${magnified ? 'is-magnified' : ''}`}>
            <div className="wr-photo-layer" style={{ transformOrigin: `${review.focus[0]}% ${review.focus[1]}%` }}>
              <img src={photo.image} alt={`${site.name}. ${review.title}. ${review.observations.map(item => item.detail).join(' ')}`} />
              {markers && review.observations.map((item, index) => item.position && <button key={item.label} className={`wr-marker ${isHanbit ? 'wr-obstacle-marker' : ''} ${focusIndex === index ? 'is-selected' : ''}`} style={{ left: `${item.position[0]}%`, top: `${item.position[1]}%` }} aria-label={`${String.fromCharCode(65 + index)} ${item.label} 설명 보기`} aria-pressed={focusIndex === index} onClick={() => selectObstacle(index)}>{String.fromCharCode(65 + index)}</button>)}
            </div>
            {magnified && <span className="wr-crop-label">길 주변 확대 · 원본 일부</span>}
          </div>
          <div className="wr-image-tools">
            {!site.referenceOnly && <button aria-pressed={magnified} onClick={() => setMagnified(value => !value)}><Eye size={17} /> {magnified ? '전체 장면 보기' : '길 주변 확대'}</button>}
            {review.observations.some(item => item.position) && <button aria-pressed={markers} onClick={() => setMarkers(value => !value)}>{markers ? '관찰 표시 숨기기' : '관찰 표시 보이기'}</button>}
            <button onClick={onOpenPhoto}><CornersOut size={17} /> 원본 사진 확대</button>
          </div>
          {review.observations.some(item => item.position) && <p className="wr-marker-note">A·B·C는 사진에서 살펴볼 위치입니다. 이동 경로나 통과 가능 표시가 아닙니다.</p>}
          <section className={`wr-observed ${isHanbit ? 'wr-mobile-obstacles' : ''}`} ref={observationPanel}><h3><Eye size={20} /> {isHanbit ? '사진에서 보인 장애물·주의 지점' : '사진에서 보이는 것'}</h3><div className="wr-observation-list">{review.observations.map((item, index) => <button key={item.label} aria-pressed={focusIndex === index} className={focusIndex === index ? 'is-selected' : ''} onClick={() => setFocusIndex(index)}><b>{item.position ? String.fromCharCode(65 + index) : '·'}</b><span>{item.label}</span></button>)}</div>{obstacleDetails}</section>
          <div className="wr-source"><span>{photo.attribution || `${provider} · 거리뷰 화면 일부 캡처`}{photo.licenseUrl && <> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.licenseLabel || '이용 조건'} ↗</a></>}</span><a href={photo.sourceUrl} target="_blank" rel="noreferrer">{provider} {site.referenceOnly ? '출처' : '원본'} <ArrowUpRight size={14} /></a></div>
        </div>
        {isHanbit && !focusedVisit && nextArrival && <div className="wr-next-arrival">{nextArrival.missing && extraScenes.length ? <button onClick={() => selectPhoto(extraScenes[0].index)}><span>입구 주변 사진도 살펴봐요<strong>{extraScenes[0].number} {extraScenes[0].shortTitle}</strong></span><ArrowRight size={22} /></button> : nextArrival.missing ? <div><b>04 입구까지의 연결은 아직 확인 전이에요.</b><p>광장 진입부에서 한빛탑 출입문까지 이어지는 사진이 필요합니다.</p></div> : <button onClick={() => selectArrival(nextArrival.id, true)}><span>다음 단계 살펴보기<strong>{nextArrival.number} {nextArrival.title}</strong></span><ArrowRight size={22} /></button>}</div>}
        <div className="wr-connection"><Info size={19} /><p>{review.connection}</p></div>
        {!isHanbit && nextScene && <div className="wr-next-arrival"><button onClick={() => { selectPhoto(nextScene.index); photoCard.current?.scrollIntoView({ behavior: 'instant', block: 'start' }); }}><span>다른 장면과 비교하기<strong>{nextScene.review.title}</strong></span><ArrowRight size={22} /></button></div>}
      </section>

      <aside className="wr-checks" aria-label="사진 관찰과 추가 확인">
        {isHanbit && <section className="wr-desktop-obstacles"><h3><Warning size={20} /> 사진에서 보인 장애물·주의 지점</h3><p className="wr-obstacle-help">사진이나 아래 항목을 누르면 설명이 바뀝니다.</p><div className="wr-observation-list">{review.observations.map((item, index) => <button key={item.label} aria-pressed={focusIndex === index} className={focusIndex === index ? 'is-selected' : ''} onClick={() => setFocusIndex(index)}><b>{String.fromCharCode(65 + index)}</b><span>{item.label}</span></button>)}</div>{obstacleDetails}<span className="wr-obstacle-status">사진 관찰 · 현재 통과 가능 여부 확인 전</span></section>}
        <div className="wr-question"><span>이 장면에서 생각할 질문</span><h2>{review.question}</h2></div>
        <section className="wr-unknown"><h3>아직 알 수 없는 것</h3><ul>{review.unknowns.map(item => <li key={item}>{item}</li>)}</ul><p>사진만으로 폭·높이·기울기를 측정하거나 현재 통행 가능 여부를 확정하지 않아요.</p></section>
        <section className="wr-next-shots"><h3><Camera size={20} /> 이어서 확인할 부분</h3><p>사진에서 보이지 않는 사이 구간과 현재 상태를 확인해요.</p><ol>{placeReview.missingShots.map(item => <li key={item}>{item}</li>)}</ol><div className="wr-entrance-gap"><b>사진 사이의 이동 연결 확인 전</b><span>사진 확보와 실제 통과 가능 확인은 서로 달라요.</span></div></section>
      </aside>
    </div>
    <PhotoNoteEditor key={`${site.id}/${point.id}`} site={site} point={point} review={review} onRecords={onRecords} onSaved={onSaved} />
    <LocalParticipation key={`participation/${site.id}/${point.id}`} site={site} point={point} subject={selectedObservation.label} /></details>}
  </main>;
}
