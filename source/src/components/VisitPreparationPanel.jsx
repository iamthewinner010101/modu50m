import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowSquareOut, ArrowRight, Bus, Camera, Check, DownloadSimple, MapPin, ChatCircleDots } from '@phosphor-icons/react';
import { FOCUSED_VISITS } from '../data/focusedVisits.js';
import { getPlaceMiniature } from '../data/placeMiniatures.js';
import { photoCaption } from '../data/previewCityPlaces.js';
import { photoProviderLabel } from '../data/previewRoadviewSelection.js';
import { getPhotoReview } from '../data/wheelchairPhotoReview.js';
import { getArrivalRoute } from '../data/arrivalRoutes.js';
import ArrivalRouteStrip, { ArrivalRouteNext } from './ArrivalRouteStrip.jsx';
import './FocusedVisits.css';
import RouteMiniature from './RouteMiniature.jsx';
import {hasJourneyModel} from '../data/journeyModels.js';
import RoutePhotoInspection from './RoutePhotoInspection.jsx';
import routePhotoAlbums, {routeContextPhotos} from '../data/routePhotoAlbums.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {prepareMiniatureViews} from '../data/miniatureImageViews.js';
import JourneyPhotoOverview from './JourneyPhotoOverview.jsx';
import JourneyConnectionReview from './JourneyConnectionReview.jsx';
import RoutePhotoStatus from './RoutePhotoStatus.jsx';
import {SelectedVisitNeed} from './WheelchairVisitNeeds.jsx';
import {tripPreparationQuestions} from '../data/wheelchairVisitNeeds.js';
import {VISIT_CONTACTS,CONTACT_SOURCE_CHECKED_AT} from '../data/visitContacts.js';
import {appendPreparationQuestion, questionsForStep} from '../utils/previsitQuestions.js';
import {readVisitProgress,saveVisitProgress,visitProgressKey} from '../utils/visitProgress.js';
import {normalizeVisitPreferences,visitPreferencesText} from '../utils/visitPreferences.js';
import {collectOfflineImages,renderOfflineVisitCard} from '../utils/offlineVisitCard.js';
import VisitPreferencesFields from './VisitPreferencesFields.jsx';
import useRouteComments from '../hooks/useRouteComments.js';
import RouteComments from './RouteComments.jsx';
import ArrivalStepGuide from './ArrivalStepGuide.jsx';
import JourneyArrivalTools from './JourneyArrivalTools.jsx';
import {nextPhotoConnection} from '../data/photoReadingPlan.js';
import {readJourneyLocation, journeyLocationUrl, requestedJourneyPhoto} from '../utils/journeyLocation.js';
import './JourneyReadability.css';
import './JourneyVisualFlow.css';
import './JourneyInteraction.css';

const hasRouteMiniature=hasJourneyModel;

function focusRoutePhoto() {
  requestAnimationFrame(() => {
    const heading=document.querySelector('.fv-real-photo .fv-photo-heading');
    heading?.scrollIntoView({block:'start',behavior:'instant'});
    heading?.focus({preventScroll:true});
  });
}

function loadCard(key) {
  try { const item=JSON.parse(localStorage.getItem(key)); return item?.version===1 && typeof item.question==='string' ? item.question : ''; } catch { return ''; }
}
export default function VisitPreparationPanel(props) {
  const [arrival,setArrival]=useState(()=>new URLSearchParams(location.search).get('arrival')==='parking'&&getArrivalRoute(props.site.id,'parking')?'parking':'bus');
  return <VisitPreparationContent {...props} key={`${props.site.id}/${arrival}`} arrival={arrival} onArrivalChange={setArrival}/>;
}
function VisitPreparationContent({site,pointIndex,onSelect,onViewPhoto,onRecord,onPhotoAvailabilityChange,arrival,onArrivalChange}) {
  const visit=FOCUSED_VISITS[site.id], point=site.checkpoints[pointIndex], photo=site.photos[point.id];
  const review=getPhotoReview(site,point.id);
  const route=getArrivalRoute(site.id,arrival);
  const parkingRoute=getArrivalRoute(site.id,'parking');
  const [initialSnapshot]=useState(()=>readJourneyLocation(location.search,route));
  const initialLocation=useRef(initialSnapshot);
  const contact=VISIT_CONTACTS[site.id];
  const polished=hasRouteMiniature(site.id)&&Boolean(route);
  const connectionRef=useRef(null);
  const [comparisonRequest,setComparisonRequest]=useState(null);
  const journeyPhotos=useMemo(()=>hasRouteMiniature(site.id)&&route?journeyGallery(site,route):[],[site,route]);
  const photoGaps=route?.steps.filter((_,index)=>!journeyPhotos.some(p=>p.stepIndex===index)).length||0;
  const [journeySelection,setJourneySelection]=useState(()=>requestedJourneyPhoto(initialSnapshot,journeyPhotos));
  const [routeSelection,setRouteSelection]=useState(()=>initialSnapshot ? {pointId:point.id,index:initialSnapshot.index} : route && !route.steps[0]?.pointId ? {pointId:point.id,index:0} : null);
  const routeIndex=routeSelection?.pointId===point.id ? routeSelection.index : (route?.steps.findIndex(s=>s.pointId===point.id) ?? -1);
  const routeStep=route?.steps[routeIndex];
  useEffect(()=>{
    let disposed=false;
    // Decode only the primary photo on each adjacent step. Selection remains
    // independent of prefetch completion or a missing network response.
    const adjacent=[routeIndex-1,routeIndex+1].flatMap(index=>{
      const photo=journeyPhotos.find(item=>item.stepIndex===index);
      return photo?[{image:photo.image}]:[];
    });
    prepareMiniatureViews(adjacent,()=>{},{cancelled:()=>disposed});
    return()=>{disposed=true;};
  },[journeyPhotos,routeIndex]);
  const comments=useRouteComments(site.id);
  const commentsPanel=useRef(null);
  const [commentsSelection,setCommentsSelection]=useState(()=>initialSnapshot?.comments ? route.steps[initialSnapshot.index].id : null);
  const [commentsScope,setCommentsScope]=useState(()=>new URLSearchParams(location.search).get('board')==='1'?'place':'step');
  const commentCounts=comments.enabled&&route?Object.fromEntries(route.steps.map((step,index)=>[index,comments.notes.filter(note=>note.step===step.id).length])):undefined;
  function openComments(all=false){
    if(!routeStep)return;
    setCommentsScope(all===true?'place':'step');
    setCommentsSelection(routeStep.id);
    requestAnimationFrame(()=>{
      commentsPanel.current?.scrollIntoView({block:'start',behavior:'instant'});
      commentsPanel.current?.querySelector('textarea')?.focus({preventScroll:true});
    });
  }
  function openConnectionComments(index,image){
    if(!comments.enabled||!Number.isInteger(index)||index<0||index>=route.steps.length-1)return;
    selectRoute(index);
    if(image)setJourneySelection({image,stepIndex:index});
    setCommentsSelection(route.steps[index].id);
    requestAnimationFrame(()=>{
      commentsPanel.current?.scrollIntoView({block:'start',behavior:'instant'});
      commentsPanel.current?.querySelector('textarea')?.focus({preventScroll:true});
    });
  }
  const nextConnection=nextPhotoConnection(route,routeIndex);
  const contextPhotos=routeContextPhotos(site.id,routeStep);
  function compareConnection(index){
    if(!Number.isInteger(index)||index<0||index>=route.steps.length-1)return;
    setComparisonRequest(previous=>({index,at:routeIndex,serial:(previous?.serial||0)+1}));
    requestAnimationFrame(()=>{
      const panel=connectionRef.current;
      if(!panel)return;
      panel.open=true;
      panel.scrollIntoView({block:'start',behavior:'instant'});
      panel.querySelector('summary')?.focus({preventScroll:true});
    });
  }
  const [inspection,setInspection]=useState(()=>requestedJourneyPhoto(initialSnapshot,journeyPhotos));
  const inspectPhoto=useCallback(image=>setInspection(previous=>previous?.stepIndex===routeIndex&&previous.image===image?previous:{stepIndex:routeIndex,image}),[routeIndex]);
  const routePhotos=routeStep?.photoOrder?.length?journeyPhotos.filter(p=>p.stepIndex===routeIndex):routeStep?(routeStep.pointId?[site.photos[routeStep.pointId],...(routePhotoAlbums[site.id]?.[routeStep.pointId]||[])]:contextPhotos):[photo,...(routePhotoAlbums[site.id]?.[point.id]||[])];
  const visibleRoutePhoto=(inspection?.stepIndex===routeIndex&&routePhotos.find(p=>p?.image===inspection.image))||routePhotos[0];
  useEffect(()=>{
    if(!polished||!routeStep)return;
    const url=journeyLocationUrl(location.href,route,routeIndex,{photo:visibleRoutePhoto?.image,comments:commentsSelection===routeStep.id});
    if(url.href!==location.href)history.replaceState(null,'',url);
  },[polished,route,routeStep,routeIndex,visibleRoutePhoto?.image,commentsSelection]);
  useEffect(()=>{
    if(!initialLocation.current?.comments)return;
    initialLocation.current={...initialLocation.current,comments:false};
    requestAnimationFrame(()=>commentsPanel.current?.scrollIntoView({block:'start',behavior:'instant'}));
  },[]);
  const model=getPlaceMiniature(site.id);
  const [stageSelection,setStageSelection]=useState(null);
  const stageIndex=stageSelection?.pointId===point.id ? stageSelection.index : visit.steps.findIndex(s=>s.points.includes(point.id));
  const [angleSelection,setAngleSelection]=useState(null);
  const angle=angleSelection?.pointId===point.id ? angleSelection.value : visit.angle?.referencePoint===point.id?'approach':'overview';
  const setAngle=value=>setAngleSelection({pointId:point.id,value});
  const qa=new URLSearchParams(location.search).get('qa')==='1';
  const storageKey=`modu50m.visit-card.v1.${qa?'qa.':''}${site.id}`;
  const progressKey=visitProgressKey(site.id,qa)+(arrival==='parking'?'.parking':'');
  const [progress,setProgress]=useState(()=>{try{return route?readVisitProgress(localStorage,progressKey,route):{reviewed:[],raw:null};}catch(error){return {reviewed:[],raw:null,error:error.message};}});
  const [question,setQuestion]=useState(()=>progress.savedAt?progress.question:loadCard(storageKey));
  const [feedback,setFeedback]=useState('');
  const [preferences,setPreferences]=useState(()=>normalizeVisitPreferences(progress.preferences));
  const [exporting,setExporting]=useState(false);
  const stage=visit.steps[stageIndex];
  const hasPhoto=routeStep ? routeStep.pointId===point.id : !stage || stage.points.includes(point.id);
  useEffect(()=>onPhotoAvailabilityChange?.(hasPhoto),[hasPhoto,onPhotoAvailabilityChange]);
  const angleImage=hasPhoto && angle==='approach' && visit.angle;
  const activeImage=angleImage?visit.angle:model;
  const matched=angleImage && visit.angle.referencePoint===point.id;
  function selectApproach() {
    setRouteSelection(null);
    const index=site.checkpoints.findIndex(p=>p.id===visit.angle.referencePoint);
    setStageSelection(null);
    setAngleSelection({pointId:visit.angle.referencePoint,value:'approach'});
    if(index>=0)onSelect(index);
  }
  function selectStage(index) {
    const next=site.checkpoints.findIndex(p=>visit.steps[index].points.includes(p.id));
    setRouteSelection({pointId:next>=0?site.checkpoints[next].id:point.id,index:-1});
    setStageSelection({pointId:next>=0?site.checkpoints[next].id:point.id,index});
    if(next>=0)onSelect(next);
  }
  function changeArrival(value) {
    if(value===arrival)return;
    const nextRoute=getArrivalRoute(site.id,value);
    if(!nextRoute)return;
    const first=nextRoute.steps[0];
    // The remounted route reads its initial selection from the URL.
    // Set the new start before remounting, so an old door cannot blank its photo.
    history.replaceState(null,'',journeyLocationUrl(location.href,nextRoute,0,{photo:site.photos[first.pointId]?.image}));
    onArrivalChange(value);setComparisonRequest(null);setCommentsSelection(null);setJourneySelection(null);setStageSelection(null);
    const index=site.checkpoints.findIndex(p=>p.id===first.pointId);
    setRouteSelection({pointId:index>=0?site.checkpoints[index].id:point.id,index:0});
    if(index>=0)onSelect(index);
  }
  function selectRoute(index) {
    setComparisonRequest(null);
    setCommentsSelection(null);
    setJourneySelection(null);
    const next=site.checkpoints.findIndex(p=>p.id===route.steps[index].pointId);
    const selectedPoint=next>=0?site.checkpoints[next].id:point.id;
    setRouteSelection({pointId:selectedPoint,index});
    setStageSelection(null);
    if(next>=0)onSelect(next);
  }
  function cardData() { return {version:1,placeId:site.id,placeName:site.name,start:route?[route.start.name,route.start.code,route.start.direction].filter(Boolean).join(' · '):visit.start,destination:route?.destination||visit.destination,question:question.trim(),preferences,remaining:route?.gaps?.length?route.gaps.join('\n'):visit.gap,sourceUrl:visit.sourceUrl,checkedAt:route?.checkedAt||visit.checkedAt||null,photoPoints:site.checkpoints.map(p=>p.id),routeSteps:route?.steps||[],routeSources:route?.sources||[],continuousRouteVerified:false,savedAt:new Date().toISOString()}; }
  function addQuestion(text) {
    const result=appendPreparationQuestion(question,text);
    if(result.status==='added'){
      setQuestion(result.value);
      requestAnimationFrame(()=>{const card=document.getElementById('visit-preparation-card');if(card){card.open=true;card.scrollIntoView({block:'start',behavior:'instant'});card.querySelector('textarea')?.focus({preventScroll:true});}});
    }
    setFeedback(result.status==='added'?'구간 번호와 질문을 준비 카드에 추가했어요. 카드에서 저장해 주세요.':result.status==='duplicate'?'같은 질문이 이미 준비 카드에 있어요.':'질문이 1,600자를 넘어 추가하지 않았어요. 카드 내용을 정리해 주세요.');
  }
  function save() {
    if(polished){persistProgress(progress.reviewed);return;}
    try { localStorage.setItem(storageKey,JSON.stringify(cardData())); setFeedback('이 브라우저에 준비 카드를 저장했어요.'); } catch {setFeedback('저장 공간을 사용할 수 없어요. 아래 파일 보관을 이용해 주세요.');}
  }
  async function copyInquiry() {
    const c=cardData();
    const text=`휠체어로 ${c.placeName} 방문을 준비하고 있습니다.\n출발 후보: ${c.start}\n찾아갈 입구: ${c.destination}\n\n확인하고 싶은 내용\n${c.question||'현재 이용할 수 있는 출입문과 보행 연결, 문턱·통과 폭·문 여는 방법을 알고 싶습니다.'}\n\n내 이동 조건\n${visitPreferencesText(preferences)}\n문의처: ${contact?.name||c.placeName}${contact?.phone?` ${contact.phone}`:''}\n${contact?.url||c.sourceUrl}`;
    try{await navigator.clipboard.writeText(text);setFeedback('문의 문장을 복사했어요. 내 조건과 방문일을 덧붙여 사용하세요. 문의가 전송된 것은 아니에요.');}
    catch{setFeedback('복사를 사용할 수 없어요. 준비 카드의 질문을 선택해 복사하거나 카드 파일 보관을 이용해 주세요.');}
  }
  function persistProgress(reviewed){
    if(progress.error){setFeedback(progress.error);return;}
    try{const saved=saveVisitProgress(localStorage,progressKey,route,{reviewed,question,preferences},progress.raw);setProgress(saved);setFeedback('준비 내용을 이 브라우저에 저장했어요. 다시 열어도 이어볼 수 있어요.');}catch(error){setFeedback(error.message);}
  }
  function toggleReviewed(){
    if(!routeStep)return;
    persistProgress(progress.reviewed.includes(routeStep.id)?progress.reviewed.filter(id=>id!==routeStep.id):[...progress.reviewed,routeStep.id]);
  }
  function download() {
    const c=cardData();
    const sequence=c.routeSteps.map((s,i)=>`${progress.reviewed.includes(s.id)?'[사진 살펴봄]':'[아직 살펴보기 전]'} ${i+1}. ${s.title}${s.pointId?'':routeContextPhotos(site.id,s).length?' [주변 참고 사진 · 연결 확인 필요]':' [사진 필요]'}\n${s.instruction}${s.next?`\n다음 지점까지: ${s.next.detail}`:''}`).join('\n\n');
    const sources=c.routeSources.map(s=>`${s.title}: ${s.url}`).join('\n')||c.sourceUrl;
    const body=`모두의50m · 나의 첫 방문 준비 카드\n\n장소: ${c.placeName}\n출발 후보: ${c.start}\n입구 후보: ${c.destination}\n\n사진으로 살펴볼 순서\n${sequence||'장소의 실제 사진과 남은 질문을 함께 확인해요.'}\n\n내 이동 조건과 귀가 준비\n${visitPreferencesText(c.preferences)}\n\n내가 더 확인할 질문\n${c.question||'아직 적지 않았어요.'}\n\n마지막으로 확인할 것\n${route?.finish||c.destination}\n\n남은 연결 확인\n${c.remaining}\n\n방문 전 문의\n${contact?.name||c.placeName}${contact?.phone?` ${contact.phone}`:''}\n${contact?.url||c.sourceUrl}\n\n출처\n${sources}\n자료 대조일: ${c.checkedAt||'미기록'}\n카드 저장일: ${c.savedAt}\n\n사진 관찰을 위한 준비 카드입니다. 현재 통행이나 연속 이동 확인을 뜻하지 않습니다.\n`;
    const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a'); a.href=url;a.download=`모두의50m-${site.name}-방문준비.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setFeedback('준비 카드 파일을 만들었어요.');
  }
  async function downloadPhotoCard() {
    if(exporting)return;
    const c=cardData();
    setExporting(true);setFeedback('사진을 담은 방문 카드를 준비해요.');
    try {
      const images=await collectOfflineImages(journeyPhotos,{onProgress:(done,total)=>setFeedback(`사진 보관 준비 ${done} / ${total}장`)});
      const html=renderOfflineVisitCard({card:c,route,photos:journeyPhotos,images,reviewed:progress.reviewed});
      const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download=`모두의50m-${site.name}-사진포함-방문준비.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setFeedback('사진과 글을 담은 HTML 파일을 만들었어요. 다른 PC에서도 인터넷 없이 열어 볼 수 있어요.');
    } catch(error){setFeedback(error.message||'사진 파일을 준비하지 못했어요. 글 카드로 보관할 수 있어요.');}
    finally{setExporting(false);}
  }
  const routeNavigation=polished&&routeStep?<><ArrivalRouteNext compact={polished} route={route} selected={routeIndex} onSelect={index=>{selectRoute(index);focusRoutePhoto();}} onFinish={polished?()=>{const card=document.getElementById('visit-preparation-card');if(card){card.open=true;card.scrollIntoView({block:'start',behavior:'instant'});card.querySelector('textarea')?.focus({preventScroll:true});}}:undefined}/>{polished&&nextConnection&&<section className="sv-photo-connection" aria-label="다음 번호까지 길 이어보기"><button onClick={()=>compareConnection(routeIndex)}>{nextConnection.label} 두 지점 사진 비교 <ArrowDown size={17}/></button></section>}</>:null;
  const preparationCard=<details className="fv-prep-card jvf-compact-card" id="visit-preparation-card">
    <summary><span>내 방문 메모 <small>나만 보기</small></span>{polished&&<small>사진 확인 {progress.reviewed.length}/{route.steps.length}</small>}</summary>
    <label htmlFor={`fv-question-${site.id}`}>기억할 것 · 더 확인할 질문</label>
    <textarea id={`fv-question-${site.id}`} rows={2} value={question} maxLength={1600} onChange={e=>{setQuestion(e.target.value);setFeedback('아직 저장하지 않은 메모가 있어요.');}} placeholder="예: 02번 횡단 지점의 턱을 더 확인하고 싶어요."/>
    <div className="fv-card-actions"><button onClick={save}><Check size={17}/> 메모 저장</button>{polished&&<button onClick={downloadPhotoCard} disabled={exporting}><DownloadSimple size={17}/>{exporting?'준비 중…':'사진과 함께 보관'}</button>}</div>
    <p role="status">{feedback||(progress.savedAt?'저장한 내용을 불러왔어요.':'내 브라우저에만 저장돼요.')}</p>
    <details className="jvf-card-options"><summary>이동 조건·다른 저장 방법</summary>{polished&&<VisitPreferencesFields value={preferences} onChange={value=>{setPreferences(value);setFeedback('아직 저장하지 않은 이동 조건이 있어요.');}}/>}<button className="jvf-text-download" onClick={download}><DownloadSimple size={17}/> 글 파일로 보관</button></details>
  </details>;
  return <section className={`fv-preparation ${polished?'sv-preparation jvf-preparation':''}`} aria-label={`${site.name} 처음 방문 준비`}>
    {polished&&<div className="jvf-arrival-switch" role="group" aria-label="출발 위치 선택"><button type="button" aria-pressed={arrival==='bus'} onClick={()=>changeArrival('bus')}><Bus size={19}/> 버스정류장 → 입구</button>{parkingRoute&&<button type="button" aria-pressed={arrival==='parking'} onClick={()=>changeArrival('parking')}>주차장 → 입구</button>}</div>}
    {polished&&routeStep&&<JourneyArrivalTools site={site} route={route} index={routeIndex} photo={visibleRoutePhoto} onAddQuestion={addQuestion} onOpenBoard={()=>openComments(true)}/>}
    {polished&&route.approachNote&&<p className="jvf-approach-note">{route.approachNote}</p>}
    {polished?<><div className="sv-route-intro"><button type="button" className="jvf-endpoint jvf-endpoint-link" aria-label={`01 ${arrival==='parking'?'주차장 출발':'하차'} 위치 ${route.start.name} 사진 보기`} onClick={()=>{selectRoute(0);focusRoutePhoto();}}><Bus size={25}/><div><small>{arrival==='parking'?'01 주차장 출발 지점':'01 버스에서 내리는 곳'}</small><strong>{route.start.name}{route.start.code?` · ${route.start.code}`:''}</strong>{route.start.direction&&<small className="jvf-stop-direction">{route.start.direction}</small>}</div></button><ArrowRight className="sv-route-arrow" size={23}/><button type="button" className="jvf-endpoint jvf-endpoint-link" aria-label={`${String(route.steps.length).padStart(2,'0')} 마지막 입구 ${route.destination} 사진 보기`} onClick={()=>{selectRoute(route.steps.length-1);focusRoutePhoto();}}><MapPin size={25}/><div><small>{String(route.steps.length).padStart(2,'0')} 방문할 입구</small><strong>{route.destination}</strong></div></button><RoutePhotoStatus route={route} photoCount={new Set(journeyPhotos.map(p=>p.image)).size} photoGaps={photoGaps} onCompare={compareConnection}/></div>{progress.error&&<p className="sv-save-status" role="alert">{progress.error}</p>}</>:route&&<ArrivalRouteStrip route={route} site={site} selected={routeIndex} onSelect={selectRoute}/>}
    {!polished&&<details className="ar-question-bank" open={!route}><summary>하차·보도·방향·입구별 사진 모음</summary>
    <div className={`fv-prep-heading ${route?'ar-question-heading':''}`}><div><p className="fv-eyebrow">첫 방문을 준비하는 네 가지 질문</p>{!route&&<h2>{visit.purpose}</h2>}</div><span>사진 확인 · 연결은 추가 확인</span></div>
    <ol className="fv-step-list">{visit.steps.map((s,index)=><li key={s.label}><button aria-pressed={stageIndex===index} onClick={()=>selectStage(index)}><b>{String(index+1).padStart(2,'0')}</b><span><small>{s.label}</small><strong>{s.title}</strong><em>{s.points.length?'관련 사진 보기':'추가 사진 필요'}</em></span></button></li>)}</ol>
    <p className="fv-sequence-note">{route?'아래 네 칸은 질문별 사진 모음이에요. 이동 순서와 사진 사이의 연결은 위 번호에서 살펴봐요.':'01–04는 확인할 질문의 순서예요. 서로 다른 사진을 하나의 이동 경로로 잇지는 않았어요.'}</p>
    </details>}
    <div className="fv-media">
      {hasRouteMiniature(site.id) && route ? <RouteMiniature site={site} route={route} selected={routeIndex} onSelect={selectRoute} photo={visibleRoutePhoto} commentCounts={commentCounts}/> : <aside className="fv-model"><div className="fv-model-title"><MapPin size={17}/><strong>{angleImage?'사진 속 구간 미니어처':'장소 전체 미니어처'}</strong><span>AI 모형</span></div><div className="fv-model-tabs" role="group" aria-label="미니어처 구도 선택">{visit.angle && <button aria-pressed={Boolean(angleImage)} onClick={selectApproach}>사진 속 구간</button>}<button aria-pressed={!angleImage} onClick={()=>setAngle('overview')}>장소 전체</button></div><img src={activeImage.image} alt={activeImage.alt}/><div className="fv-pair-label"><span className={matched?'is-matched':''}/>{matched?'지금 보는 실제 사진을 참고했어요.':'전체 모습과 현재 사진의 구역을 구분해요.'}</div>{(angleImage?visit.angle.scope:visit.modelScope) && <p className="fv-model-scope">{angleImage?visit.angle.scope:visit.modelScope}</p>}<p>사진을 참고한 AI 근사 모형이에요. 바닥의 높이·폭·경사와 가려진 부분은 실제 사진 및 추가 확인으로 살펴봐요.</p>{visit.angle && !matched && <button className="fv-reference" onClick={selectApproach}>구간 모형과 참고 사진 함께 보기 <ArrowDown size={15}/></button>}<dl><dt>출발 후보</dt><dd>{visit.start}</dd><dt>찾아볼 입구</dt><dd>{visit.destination}</dd></dl></aside>}
      <section className="fv-real-photo"><div className="fv-photo-heading" tabIndex={-1} aria-live="polite">{polished&&routeStep?<><div className="jvf-current-place"><b className="jvf-step-number" aria-hidden="true">{String(routeIndex+1).padStart(2,'0')}</b><div><span>{routeIndex===0?(arrival==='parking'?'주차장 출발':'내리는 곳'):routeIndex===route.steps.length-1?'마지막 입구':'지금 보는 곳'} · {routeIndex+1}/{route.steps.length}</span><h3>{routeStep.title}</h3></div><div className="jvf-photo-actions">{comments.enabled&&<button className="jvf-comment-shortcut" onClick={openComments} aria-label={`${String(routeIndex+1).padStart(2,'0')} 위치 공유 안내 보기`}><ChatCircleDots size={19}/> 위치 공유</button>}<button className="jvf-back-model" onClick={()=>document.querySelector('.rm-model')?.scrollIntoView({block:'start',behavior:'instant'})}>미니어처 ↑</button></div></div><ArrivalStepGuide route={route} index={routeIndex}/></>:<><span><Camera size={18}/> 지금 살펴볼 곳</span><h3>{stage?.title||point.title}</h3><p>{routeStep?.instruction||stage?.question||point.question}</p></>}</div>
        {hasPhoto?<>{hasRouteMiniature(site.id)?<RoutePhotoInspection photoOrder={routeStep?.photoOrder} navigation={routeNavigation} placeId={site.id} onPhotoChange={inspectPhoto} preferredImage={journeySelection?.stepIndex===routeIndex?journeySelection.image:undefined} key={`${point.id}/${routeIndex}/${journeySelection?.image||''}`} photo={photo} review={review} title={routeStep?.title||point.title} onViewPhoto={onViewPhoto} extras={routeStep?.photoOrder?.length?routePhotos.filter(p=>p.image!==photo.image):(routePhotoAlbums[site.id]?.[point.id]||[])}/>:<><button className="fv-photo-open" onClick={onViewPhoto} aria-label={`${point.title} 관찰 표시와 설명 보기`}><img src={photo.image} alt={`${site.name} · ${point.title} 실제 원본 사진`} /><span>사진에서 확인할 부분 보기 <ArrowDown size={17} /></span></button><p className="fv-photo-credit">{photoProviderLabel(photo)} · {photoCaption(photo)} <a href={photo.sourceUrl} target="_blank" rel="noreferrer">원본 출처 ↗</a></p></>}</>:contextPhotos.length?<><RoutePhotoInspection photoOrder={routeStep?.photoOrder} navigation={routeNavigation} placeId={site.id} onPhotoChange={inspectPhoto} preferredImage={journeySelection?.stepIndex===routeIndex?journeySelection.image:undefined} key={`${routeStep.id}/${journeySelection?.image||''}`} title={routeStep.title} extras={contextPhotos}/></>:<div className="fv-photo-gap"><Camera size={36}/><strong>이 부분을 보여줄 사진이 아직 없어요.</strong><p>{routeStep?.instruction||stage?.question}</p><span>다른 장면으로 연결을 추측하지 않고, 필요한 사진을 표시해 두었어요.</span></div>}
        {polished&&routeStep&&<RouteComments site={site} route={route} selected={routeIndex} photo={visibleRoutePhoto} comments={comments} open={commentsSelection===routeStep.id} scope={commentsScope} onScopeChange={setCommentsScope} onToggle={()=>setCommentsSelection(value=>value===routeStep.id?null:routeStep.id)} panelRef={commentsPanel} onPhotoSelect={image=>{setJourneySelection({image,stepIndex:routeIndex});focusRoutePhoto();}}/>}
        {polished&&routeStep&&<ArrivalStepGuide route={route} index={routeIndex} variant="details"/>}
        {!polished&&routeStep&&<ArrivalRouteNext compact={polished} route={route} selected={routeIndex} onSelect={index=>{selectRoute(index);focusRoutePhoto();}} onFinish={polished?()=>{const card=document.getElementById('visit-preparation-card');if(card){card.open=true;card.scrollIntoView({block:'start',behavior:'instant'});card.querySelector('textarea')?.focus({preventScroll:true});}}:undefined}/>}
        {polished&&routeStep&&<details className="sv-step-extras"><summary>이 위치의 구체적인 질문·내 기록</summary>
          <SelectedVisitNeed route={route} index={routeIndex} onAdd={addQuestion}/>
          <section className="pv-questions" aria-label="이 구간에서 더 확인할 질문"><strong>사진을 봐도 궁금한 점이 있나요?</strong><p>아래에서 고르면 구간 번호와 함께 준비 카드에 추가돼요. 내게 필요한 내용으로 바꿀 수 있어요.</p><div>{questionsForStep(route,routeIndex).map(item=><button key={item.label} onClick={()=>addQuestion(item.text)}>+ {item.label}</button>)}</div><a href="#visit-preparation-card">추가한 질문 저장 ↓</a></section>
        </details>}
        {polished&&routeStep&&<div className="sv-review-check"><label><input type="checkbox" checked={progress.reviewed.includes(routeStep.id)} disabled={Boolean(progress.error)} onChange={toggleReviewed}/><span>이 구간 사진을 살펴봤어요<small>내가 살펴본 표시예요. 실제 통행 확인과는 달라요.</small></span></label><p role="status">{feedback}</p></div>}
        {!routeStep && stage?.points.length>1 && <div className="fv-view-points">{stage.points.map(id=>{const index=site.checkpoints.findIndex(p=>p.id===id);return index<0?null:<button key={id} aria-pressed={point.id===id} onClick={()=>onSelect(index)}>{site.checkpoints[index].title}</button>;})}</div>}
      </section>
    </div>
    {preparationCard}
    {polished&&<JourneyPhotoOverview site={site} route={route} photos={journeyPhotos} selected={routeIndex} onSelect={index=>{selectRoute(index);focusRoutePhoto();}} onNeedSelect={need=>{selectRoute(need.step-1);if(need.image)setJourneySelection({image:need.image,stepIndex:need.step-1});focusRoutePhoto();}} onGalleryNavigate={p=>{selectRoute(p.stepIndex);setJourneySelection({image:p.image,stepIndex:p.stepIndex});focusRoutePhoto();}}/>}
    {polished&&<JourneyConnectionReview panelRef={connectionRef} request={comparisonRequest} route={route} photos={journeyPhotos} selected={routeIndex} onSelect={index=>{selectRoute(index);focusRoutePhoto();}} onAdd={addQuestion} onComment={comments.enabled?openConnectionComments:undefined}/>}
    {polished&&<details className="sv-route-details"><summary>정류장부터 입구까지 전체 순서·연결 근거</summary><ArrivalRouteStrip route={route} site={site} selected={routeIndex} onSelect={selectRoute}/></details>}
    {!polished&&hasPhoto && <div className="fv-observe-preview"><strong>이 사진에서 살펴볼 것</strong><div>{review.observations.slice(0,3).map(item=><span key={item.label}>{item.label}</span>)}</div><button onClick={onRecord}>사진에 관찰 기록 남기기 <ArrowDown size={16}/></button></div>}
    {!polished&&<div className="fv-contact-strip" role="group" aria-label="이 장소의 모든 실제 사진">{site.checkpoints.map((p,index)=><button key={p.id} onClick={()=>onSelect(index)} aria-pressed={pointIndex===index}><img src={site.photos[p.id].image} alt="" loading="lazy"/><span>{p.title}</span></button>)}</div>}
    <div className="fv-evidence-row"><div className="fv-gap-summary"><strong>이어서 확인할 연결</strong><p>{visit.gap}</p></div><details className="fv-source-check"><summary>인터넷 자료에서 확인한 내용</summary><p>{visit.finding||'현재 자료는 외관 참고 범위입니다. 이동할 길과 출입문 사진은 추가 조사가 필요합니다.'}</p>{visit.checkedAt&&<small>자료 대조: {visit.checkedAt} · 사진 촬영일과 달라요.</small>}<a href={visit.sourceUrl} target="_blank" rel="noreferrer">{visit.sourceLabel} <ArrowSquareOut size={14}/></a>{visit.relatedUrl&&<a href={visit.relatedUrl} target="_blank" rel="noreferrer">{visit.relatedLabel} <ArrowSquareOut size={14}/></a>}</details></div>
    {polished&&<details className="jvf-visit-tools"><summary>방문 정보·문의처</summary>
    {polished&&<section className="pv-questions wvn-trip" aria-label="방문 전체를 준비할 질문"><strong>입구까지 살펴봤다면, 방문 전체도 준비해요</strong><p>필요한 질문을 골라 아래 카드에 담으세요. 휠체어 종류·크기, 혼자 이동하는지 등 내 조건을 덧붙일 수 있어요. 확인된 답변은 아직 없어요.</p><div>{tripPreparationQuestions(route).map(item=><button key={item.label} onClick={()=>addQuestion(item.text)}>+ {item.label}</button>)}</div></section>}
    {polished&&contact&&<section className="wvn-contact" aria-label="방문 전 문의할 곳"><div><strong>준비한 질문으로 방문 전 확인해요</strong><p>{contact.name}</p><small>아래 공개 안내를 {CONTACT_SOURCE_CHECKED_AT}에 확인했어요. 실제 문의·통행 확인은 아직 하지 않았어요.</small>{contact.note&&<small>{contact.note}</small>}</div><div className="wvn-contact-actions">{contact.phone&&<a href={`tel:${contact.phone}`} aria-label={`${contact.name} ${contact.phone} 전화하기`}>{contact.phone} 전화</a>}<a href={contact.url} target="_blank" rel="noreferrer">{contact.source} ↗</a><button onClick={copyInquiry}>내 질문을 문의 문장으로 복사</button><a href="#visit-preparation-card">내 방문 메모 ↓</a></div><p role="status">{feedback}</p></section>}
    </details>}
  </section>;
}
