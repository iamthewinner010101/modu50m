import {useEffect,useRef,useState} from 'react';
import {layoutPhotoMarkers} from '../utils/photoMarkerLayout.js';
import {ArrowDown,CornersOut} from '@phosphor-icons/react';
import {photoCaption} from '../data/previewCityPlaces.js';
import {photoProviderLabel} from '../data/previewRoadviewSelection.js';
import {photoSourceDescription} from '../data/routePhotoAlbums.js';
import {galleryPhoto} from '../data/journeyGallery.js';
import {photoEvidenceRole} from '../data/photoEvidenceRoles.js';
import {photoReadingPurpose} from '../data/photoReadingPlan.js';
import {observationsForPhoto} from '../utils/previsitQuestions.js';
import PhotoGalleryButton from './PhotoGalleryButton.jsx';
import PhotoRegionEditor from './PhotoRegionEditor.jsx';
import './RouteGroundMap.css';
import './RoutePhotoInspection.css';

export default function RoutePhotoInspection({placeId,photo,review,title,onViewPhoto,preferredImage,onPhotoChange,navigation,photoOrder=[],extras=[]}) {
  const gallery=photo?[{...photo,title:photo.title||title||'이 구간의 실제 사진'},...extras]:extras.map(p=>({...p,context:true}));
  if(photoOrder.length){
    const order=new Map(photoOrder.map((image,index)=>[image,index]));
    gallery.sort((a,b)=>(order.get(a.image)??Infinity)-(order.get(b.image)??Infinity));
  }
  const [photoIndex,setPhotoIndex]=useState(()=>Math.max(0,gallery.findIndex(p=>p.image===preferredImage)));
  const [observation,setObservation]=useState(0);
  const [editing,setEditing]=useState(false);
  const markButton=useRef(null);
  const imageElement=useRef(null);
  const photoElement=useRef(null);
  const [photoSize,setPhotoSize]=useState({width:0,height:0});
  const [imageLoad,setImageLoad]=useState(null);
  const [notice,setNotice]=useState(null);
  const current=photo&&gallery[photoIndex]?.image===photo.image?null:gallery[photoIndex];
  const items=observationsForPhoto(current,review);
  const active=items[Math.min(observation,items.length-1)];
  const image=current?.image||photo?.image;
  const imageStatus=imageLoad?.image===image?imageLoad.status:'loading';
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const img=imageElement.current;
      if(img?.complete)setImageLoad(previous=>previous?.image===image?previous:{image,status:img.naturalWidth?'ready':'error'});
    });
    return()=>cancelAnimationFrame(frame);
  },[image]);
  useEffect(()=>{onPhotoChange?.(image);},[image,onPhotoChange]);
  useEffect(()=>{
    const element=photoElement.current;
    if(!element)return;
    const measure=()=>{
      const {width,height}=element.getBoundingClientRect();
      setPhotoSize(previous=>previous.width===width&&previous.height===height?previous:{width,height});
    };
    const observer=new ResizeObserver(measure);observer.observe(element);measure();
    return()=>observer.disconnect();
  },[image]);
  const markers=layoutPhotoMarkers(items,photoSize.width,photoSize.height);
  const source=current?photoSourceDescription(current):null;
  const evidenceRole=photoEvidenceRole(current||photo);
  const purpose=photoReadingPurpose(gallery[photoIndex]);
  const choosePhoto=index=>{setPhotoIndex(index);setObservation(0);};
  const lightboxPhotos=gallery.map(p=>galleryPhoto({...p,title:photo&&p.image===photo.image?title:p.title},{title,observations:photo&&p.image===photo.image?review?.observations:[]}));
  const renderPhoto=()=><div ref={photoElement} className="rp-photo" data-photo-state={imageStatus}><PhotoGalleryButton photos={lightboxPhotos} index={photoIndex} preserveContentWhileLoading className="rp-photo-image" onNavigate={p=>choosePhoto(gallery.findIndex(item=>item.image===p.image))}><img ref={imageElement} src={image} alt={`${current?.title||title} 실제 사진`} onLoad={()=>setImageLoad({image,status:'ready'})} onError={()=>setImageLoad({image,status:'error'})}/></PhotoGalleryButton>{imageStatus!=='ready'&&<span className="rp-photo-state" role={imageStatus==='error'?'alert':'status'}>{imageStatus==='error'?'사진을 불러오지 못했어요. 다른 사진이나 원본 출처를 확인해 주세요.':'사진을 불러오는 중…'}</span>}{imageStatus==='ready'&&markers.some(m=>m?.shifted)&&<svg className="rp-marker-links" viewBox={`0 0 ${photoSize.width} ${photoSize.height}`} preserveAspectRatio="none" aria-hidden="true">{markers.map((m,i)=>m?.shifted&&<g key={i}><line className="rp-marker-link-outline" x1={m.anchor[0]} y1={m.anchor[1]} x2={m.center[0]} y2={m.center[1]}/><line x1={m.anchor[0]} y1={m.anchor[1]} x2={m.center[0]} y2={m.center[1]}/><circle cx={m.anchor[0]} cy={m.anchor[1]} r="3"/></g>)}</svg>}{items.map((o,i)=>markers[i]&&<button key={o.label} className="rp-dot" disabled={imageStatus!=='ready'} style={{left:`${markers[i].position[0]}%`,top:`${markers[i].position[1]}%`}} aria-label={`사진 ${String.fromCharCode(65+i)} ${o.label} 설명`} aria-pressed={observation===i} onClick={()=>setObservation(i)}>{String.fromCharCode(65+i)}</button>)}</div>;
  return <div className="rp-inspection">
    <div className="rp-top"><strong>{evidenceRole?.label||(current?.context?'주변 비교 사진':purpose.label)}</strong><span className="rp-count">사진 {photoIndex+1} / {gallery.length}</span></div>
    {gallery.some(p=>p.viewLabel)&&<div className="rp-view-choices" role="group" aria-label="보도와 입구 사진 방향 선택">{gallery.map((p,i)=>p.viewLabel&&<button key={p.image} aria-pressed={i===photoIndex} onClick={()=>{setPhotoIndex(i);setObservation(0);}}>{p.viewLabel}</button>)}</div>}
    {renderPhoto()}
    <div className="rp-photo-meta"><p className="rp-photo-credit"><span>{source?.kind||photoProviderLabel(photo)}</span><span>{source?.date||photoSourceDescription(photo).date}</span></p><PhotoGalleryButton photos={lightboxPhotos} index={photoIndex} preserveContentWhileLoading className="rp-photo-enlarge" onNavigate={p=>choosePhoto(gallery.findIndex(item=>item.image===p.image))}><CornersOut size={18}/> 크게 보기</PhotoGalleryButton></div>
    {evidenceRole&&<p className="rp-scope-cue">{evidenceRole.detail}</p>}
    {navigation}
    {gallery.length>1&&<div className="rp-gallery" role="group" aria-label="관련 현장 사진 비교">{gallery.map((p,i)=><button key={p.image} title={p.title} aria-label={`이 구간 사진 ${i+1}: ${p.title} · ${photoReadingPurpose(p).label}`} aria-pressed={i===photoIndex} onClick={()=>choosePhoto(i)}><img src={p.image} alt="" loading="lazy"/><small>{p.viewLabel||p.title}</small></button>)}</div>}
    <div className="rp-options" role="group" aria-label="이 사진의 관찰 항목">{items.map((o,i)=><button key={o.label} aria-pressed={observation===i} onClick={()=>setObservation(i)}><b>{String.fromCharCode(65+i)}</b>{o.label}</button>)}</div>
    {active&&<p className="rp-detail" role="status">{active.detail}</p>}
    <details className="rp-reading" data-purpose={purpose.kind}><summary>사진 설명·원본 출처</summary>{current&&<strong>{current.title}</strong>}<p>{purpose.cue}</p>
    {current?<p className="rp-source">{current.author||current.providerLabel||source.kind} · {source.date}{current.scope!==evidenceRole?.detail&&<small>{current.scope}</small>}{current.cameraCoordinate&&<small>촬영 위치 {current.cameraCoordinate[0].toFixed(6)}, {current.cameraCoordinate[1].toFixed(6)} · 장애물 좌표나 미니어처 번호의 실측 위치는 아니에요.</small>}{current.camera&&<small>촬영 위치 {current.camera.lat.toFixed(6)}, {current.camera.lon.toFixed(6)} · 장애물 좌표는 아니에요.</small>}<a href={current.sourceUrl} target="_blank" rel="noreferrer">{source.link}</a></p>:<p className="rp-source">{photoProviderLabel(photo)} · {photoCaption(photo)}<small>표시는 사진에서 관찰할 부분이에요. 실제 통과 가능 여부는 확인 전이에요.</small><a href={photo.sourceUrl} target="_blank" rel="noreferrer">이 사진의 원본 출처 ↗</a></p>}
    {photo&&!current&&onViewPhoto&&<button className="rp-more" onClick={onViewPhoto}>이 사진 자세히 보기·관찰 남기기 <ArrowDown size={17}/></button>}
    </details>
    <button ref={markButton} className="rp-mark-button" onClick={()=>setEditing(true)}>이 사진에서 걱정되는 곳 표시하기</button>
    {notice?.image===image&&<p className="sv-save-status" role="status">이 사진에 표시한 {notice.count}곳을 저장했어요. 위 ‘내 관찰 기록’에서 다시 열 수 있어요.</p>}
    {editing&&<PhotoRegionEditor placeId={placeId} photo={lightboxPhotos[photoIndex]} onSaved={count=>setNotice({image,count})} onClose={()=>{setEditing(false);requestAnimationFrame(()=>markButton.current?.focus({preventScroll:true}));}}/>}
  </div>;
}
