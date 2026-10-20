import parkingImageViews from '../data/parkingMiniatureViewsV77.json' with {type:'json'};
import {useMemo,useState} from 'react';
import {Bus, Camera, ArrowRight, MapPin, CornersOut} from '@phosphor-icons/react';
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {modelForArrival} from '../data/miniatureRouteSelection.js';
import {JOURNEY_MODELS} from '../data/journeyModels.js';
import {routeContextPhotos} from '../data/routePhotoAlbums.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {photoEvidenceRole} from '../data/photoEvidenceRoles.js';
import RouteGroundMap from './RouteGroundMap.jsx';
import BusApproachMap from './BusApproachMap.jsx';
import MiniatureImageMap from './MiniatureImageMap.jsx';
import MiniatureImageViews from './MiniatureImageViews.jsx';
import {PLACE_IMAGE_VIEWS,MINIATURE_SCOPES} from '../data/placeImageViews.js';
import './RouteMiniature.css';

const number = i => String(i+1).padStart(2,'0');

function LocationEvidence({model,route,onSelect}) {
  if(model.busApproach)return <details className="rm-evidence"><summary><MapPin size={16}/> 정류장·사진·동선의 근거</summary><p>{route.start.name} {route.start.code} · {route.start.direction}</p><p>전체 동선 지도는 공개 도로·건물 좌표와 사진을 비교한 검토안이에요. 사진 촬영 좌표와 보행 위치는 서로 다르며, 연결 사진이 비는 구간은 순서에서 표시해요.</p>{route.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}</details>;
  const g=model.geometry;
  if(!g)return <details className="rm-evidence"><summary><MapPin size={16}/> 모형의 범위와 사진 출처</summary><p>{model.scope}</p><p>번호는 실제 촬영 좌표가 아닌 사진을 고르는 구역 표시예요. 연결 사진이 없는 곳은 아래 순서에서 따로 살펴봐요.</p>{route.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}<p>자료 대조일 {model.sourceCheckedAt} · 촬영일과 현재 이용 상태는 사진별로 확인해요.</p></details>;
  return <details className="rm-evidence"><summary><MapPin size={16}/> 위치·거리 근거 보기</summary>
    <p>실제 위치·사진의 점은 한국관광공사 지도에 등록된 구역 위치예요. 사진을 찍은 정확한 좌표나 출입문의 좌표는 아니에요. 선은 출처가 제공한 대중교통 안내선만 표시해요. AI 미니어처의 번호는 사진을 고르는 근사 구역이에요.</p>
    <ul>{g.markers.map((m,i)=><li key={m.step}><button onClick={()=>onSelect(m.step)}>{number(m.step)} {model.mapLabels[i]}</button><span>{m.coordinate.map(n=>n.toFixed(6)).join(', ')}</span></li>)}</ul>
    <p>{model.distanceNote} {route.placeId==='hanbit'?'광장 연결과 사진 속 경사로의 방위가 확인되지 않아 탑까지 안내선을 연장하지 않았어요.':''}</p>
    <p>코스 지도 갱신일 {model.mapUpdatedAt} · 자료 대조일 {model.sourceCheckedAt} · 사진 촬영일은 별도 확인이 필요해요.</p>
    <a href={model.sourceUrl} target="_blank" rel="noreferrer">한국관광공사 원본 지도·사진 ↗</a>
    <p>2026-09-24 카카오 지도·스카이뷰 배치 대조 · 도로·건물 도형은 OpenStreetMap 공개 좌표로 그렸어요. 높이와 경사는 실측하지 않았어요.</p>
  </details>;
}

export default function RouteMiniature({site,route,selected,onSelect,photo,commentCounts}) {
  const baseRoute=getArrivalRoute(site.id);
  const dedicatedParkingViews=route.arrival==='parking'?parkingImageViews[site.id]:null;
  const model=useMemo(()=>dedicatedParkingViews?{...dedicatedParkingViews[0],title:route.title,startLabel:route.start.name,endLabel:route.destination}:modelForArrival(JOURNEY_MODELS[site.id],baseRoute,route),[site.id,baseRoute,route,dedicatedParkingViews]);
  const contextPhotos=step=>routeContextPhotos(site.id,step);
  const imageViews=useMemo(()=>dedicatedParkingViews?.map(v=>({...v,title:route.title,startLabel:route.start.name,endLabel:route.destination}))||PLACE_IMAGE_VIEWS[site.id]?.map(v=>({...modelForArrival(v,baseRoute,route),...(route.arrival==='parking'&&v.id==='original'?{description:'주차장 출발 지점부터 입구까지 한눈에'}:{})})),[site.id,baseRoute,route,dedicatedParkingViews]);
  const photoCount=new Set(journeyGallery(site,route).map(p=>p.image)).size;
  const [view,setView]=useState(imageViews?'journey':model.busApproach?'bus':'journey');
  const [expanded,setExpanded]=useState(false);
  const [imageView,setImageView]=useState('original');
  const active=route.steps[selected];
  const expandedPhoto=photo||(active?.pointId&&site.photos[active.pointId])||contextPhotos(active)[0];
  const activeTitle=active?.title||expandedPhoto?.title||expandedPhoto?.name||'선택한 구역 사진';
  const expandedRole=photoEvidenceRole(expandedPhoto);
  const isJourney=view==='journey';
  const isMap=view==='map';
  const isBus=view==='bus';
  const select=i=>{
    onSelect(i);
    if(!expanded&&window.matchMedia('(max-width:760px)').matches)requestAnimationFrame(()=>{
      const heading=document.querySelector('.fv-real-photo .fv-photo-heading');
      heading?.scrollIntoView({block:'start',behavior:'instant'});
      heading?.focus({preventScroll:true});
    });
  };
  const art=(large=false)=>imageViews?<MiniatureImageViews model={model} views={imageViews} viewId={imageView} onViewChange={setImageView} steps={route.steps} selected={selected} onSelect={select} large={large} placeName={site.name} scopeLabel={MINIATURE_SCOPES[site.id]} startLabel={route.arrival==='parking'?'주차장':'하차'} onShowRoute={model.busApproach?()=>setView('bus'):undefined} commentCounts={commentCounts}/>:<MiniatureImageMap model={model} steps={route.steps} selected={selected} onSelect={select} large={large} commentCounts={commentCounts}/>;
  const busMap=()=><BusApproachMap placeId={site.id} route={route} selected={selected} onSelect={select}/>;
  return <aside className="rm-model" aria-label={`${site.name} 방문 준비 미니어처`}>
    <div className="rm-heading"><span><Bus size={18}/> {route.arrival==='parking'?'주차장에서 입구까지':'버스에서 내려 입구까지'}</span><small>위치 선택 → 실제 사진 → 살펴볼 곳</small></div>
    {!imageViews&&<div className="rm-trip"><strong>{model.startLabel}</strong><ArrowRight size={16}/><strong>{model.endLabel}</strong></div>}
    <div className="rm-tools" role="group" aria-label="동선 미니어처 보기 방식">
      <button aria-pressed={isJourney} onClick={()=>setView('journey')}>{model.fullJourney?'전체 동선 미니어처':imageViews?'미니어처 둘러보기':'미니어처'}</button>
      {model.busApproach&&<button aria-pressed={isBus} onClick={()=>setView('bus')}>지도와 위치 비교</button>}
      {model.geometry&&<button aria-pressed={isMap} onClick={()=>setView('map')}>실제 위치·사진</button>}
      <button className="rm-expand" onClick={()=>setExpanded(true)} aria-label={isMap||isBus?'위치 지도 크게 보기':'미니어처 크게 보기'}><CornersOut size={17}/></button>
    </div>
    {isBus?busMap():isMap?<RouteGroundMap placeId={site.id} route={route} selected={selected} onSelect={select}/>:art()}
    <details className="sv-model-details"><summary>전체 순서·위치 근거 · {route.steps.length}구간 · 사진 {photoCount}장</summary>
      <div className="rm-distance"><div><small>{model.distanceLabel}</small><strong>{model.distanceValue}</strong></div><p>{model.distanceNote}</p></div>
      <div className="rm-sequence" role="group" aria-label="전체 동선에서 사진 구간 선택">{route.steps.map((s,i)=><div className="rm-stop" key={s.id}>
        <button aria-pressed={selected===i} className={!s.pointId?'rm-missing':''} onClick={()=>select(i)}><b>{number(i)}</b><span>{s.title}</span>{!s.pointId?<em>{contextPhotos(s).length?'주변 사진 비교':'사진 필요'}</em>:<Camera size={13}/>}</button>
        {i<route.steps.length-1&&<span className={`rm-leg ${s.next?.status==='gap'?'rm-leg-gap':''}`}><ArrowRight size={12}/>{number(i+1)} · {model.distances?.[i]!=null?`약 ${model.distances[i]}m`:s.next?.status==='same-scene'?'같은 사진':s.next?.status==='gap'?'연결 확인 필요':s.next?.status==='map-reviewed'?'지도 비교 순서':'출처 안내 순서'}</span>}
      </div>)}</div>
      <div className={`rm-current ${!active?.pointId?'rm-current-gap':''}`} aria-live="polite"><span>{active?`${number(selected)} 지금 보는 구간`:'보조 사진 선택 중'}</span><strong>{active?.title||'번호를 눌러 이동 순서를 살펴봐요'}</strong></div>
    {!isMap&&!isBus&&!imageViews&&<p className="rm-caption">{model.scope||'번호를 누르면 해당 구역의 실제 사진을 볼 수 있어요. 모형과 표시는 근사 표현이며, 실제 위치·사진에서 좌표를 비교해요.'} 바닥 폭·경사·장애물은 실제 사진에서 살펴봐요.</p>}
    <LocationEvidence model={model} route={route} selected={selected} onSelect={select}/>
    </details>
    {expanded&&<dialog className="rm-dialog" ref={node=>{if(node&&!node.open)node.showModal();}} onCancel={()=>setExpanded(false)} aria-label={`${site.name} 전체 동선 미니어처 확대`}>
      <header><strong>{model.title}</strong><button onClick={()=>setExpanded(false)} autoFocus>닫기 ×</button></header>
      {isBus?busMap():isMap?<RouteGroundMap placeId={site.id} route={route} selected={selected} onSelect={select}/>:art(true)}
      <div className="rm-dialog-photo">{expandedPhoto?<><img src={expandedPhoto.image} alt={`${activeTitle} 실제 사진`}/><div><small>{selected>=0?number(selected):'보조 사진'} {active?.pointId?'실제 사진':'주변 사진 · 연결 확인 중'}</small><strong>{activeTitle}</strong><p>{active?.instruction}</p><a href={expandedPhoto.sourceUrl} target="_blank" rel="noreferrer">사진 원본 출처 ↗</a></div></>:<p>번호를 누르면 해당 지점의 실제 사진을 볼 수 있어요. 사진이 없는 연결 구간은 추가 확인이 필요해요.</p>}</div>
      {expandedRole&&<p className="rp-evidence-role"><strong>{expandedRole.label}</strong><span>{expandedRole.detail}</span></p>}
      <p className="rm-caption">{isMap||isBus?'공개 좌표 위치 지도':'사진 참고 AI 근사 모형'} · {model.distanceNote}</p>
    </dialog>}
  </aside>;
}
