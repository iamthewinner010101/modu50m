import {useRef,useState} from 'react';
import {ArrowRight,Camera,Notebook} from '@phosphor-icons/react';
import {RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {readVisitProgress,visitProgressKey} from '../utils/visitProgress.js';
import {regionEvidence,regionKey,parseRegions} from '../utils/photoRegionNotes.js';
import PhotoRegionEditor from './PhotoRegionEditor.jsx';

function readSaved(){
  const visits=[],photos=[],errors=[],qa=new URLSearchParams(location.search).get('qa')==='1';
  for(const id of RECOMMENDED_PLACE_IDS){
    const site=getFinalsPlace(id),route=getArrivalRoute(id);
    try{const p=readVisitProgress(localStorage,visitProgressKey(id,qa),route);if(p.savedAt)visits.push({...p,site,route});}catch(error){errors.push(`${site.name}: ${error.message}`);}
    for(const photo of journeyGallery(site,route)){
      try{
        const evidence=regionEvidence(id,photo),raw=localStorage.getItem(regionKey(evidence,qa));
        if(!raw)continue;
        const saved=JSON.parse(raw),valid=parseRegions(raw,evidence,saved.size);
        if(valid.marks.length)photos.push({site,photo,...valid});
      }catch(error){errors.push(`${site.name} 사진: ${error.message}`);}
    }
  }
  return {visits:visits.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)),photos:photos.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)),errors};
}
export default function SavedJourneyNotes({onOpen}){
  const [saved,setSaved]=useState(readSaved),[editing,setEditing]=useState(null);
  const editorTrigger=useRef(null);
  return <section className="sv-saved" aria-label="나의 방문 준비와 사진 표시"><div className="sv-saved-title"><div><small>내가 준비한 대전</small><h2>방문 준비와 사진 표시</h2><p>이 기기·브라우저에 저장한 내용이에요. 같은 사진을 다시 열어 이어서 살펴보세요.</p></div><button onClick={()=>setSaved(readSaved())}>준비 내용 다시 읽기</button></div>
    {saved.errors.length>0&&<p role="alert">일부 기록을 읽지 못했어요. 기존 기록은 그대로 보관했어요. {saved.errors[0]}</p>}
    <h3><Notebook size={20}/> 나의 준비 카드 <b>{saved.visits.length}</b></h3>
    <div className="sv-saved-grid">{saved.visits.map(({site,route,reviewed,question})=><article key={site.id}><strong>{site.name}</strong><span>사진을 살펴본 구간 {reviewed.length} / {route.steps.length}</span><p>{question||'더 확인할 질문을 이어서 적어 보세요.'}</p><button onClick={()=>onOpen(site.id,route.steps.find(s=>!reviewed.includes(s.id)&&s.pointId)?.pointId||route.steps[0].pointId)}>방문 준비 이어보기 <ArrowRight size={17}/></button></article>)}</div>
    {!saved.visits.length&&<p className="sv-empty-hint">아직 저장한 준비 카드가 없어요. 장소에서 사진을 살펴보고 체크하거나 질문을 저장하면 여기에 모여요.</p>}
    <h3><Camera size={20}/> 걱정되는 곳을 표시한 사진 <b>{saved.photos.length}</b></h3>
    <div className="sv-saved-grid">{saved.photos.map(item=><article key={`${item.site.id}/${item.photo.image}`}><img src={item.photo.image} alt={`${item.site.name} ${item.photo.title}`} loading="lazy"/><small>{item.site.name} · 표시 {item.marks.length}곳</small><strong>{item.photo.title}</strong><p>{item.marks.map(m=>m.reason).join(' · ')}</p><button onClick={event=>{editorTrigger.current=event.currentTarget;setEditing(item);}}>이 사진의 표시 다시 열기 <ArrowRight size={17}/></button></article>)}</div>
    {!saved.photos.length&&<p className="sv-empty-hint">사진의 ‘걱정되는 곳 표시하기’에서 사각형과 이유를 저장해 보세요. 로드뷰와 방문 사진 모두 다시 열 수 있어요.</p>}
    {editing&&<PhotoRegionEditor key={editing.photo.image} placeId={editing.site.id} photo={editing.photo} onSaved={()=>setSaved(readSaved())} onClose={()=>{setEditing(null);setSaved(readSaved());requestAnimationFrame(()=>editorTrigger.current?.focus({preventScroll:true}));}}/>}
  </section>;
}
