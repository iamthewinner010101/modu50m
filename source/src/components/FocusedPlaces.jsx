import { useState } from 'react';
import { ArrowRight, Camera, MapPin, MagnifyingGlass } from '@phosphor-icons/react';
import { FINALS_PLACES, getFinalsPlace } from '../data/finalsCatalog.js';
import { getPlaceMiniature } from '../data/placeMiniatures.js';
import { RESEARCH_PLACE_IDS, FOCUSED_VISITS, focusStartPoint } from '../data/focusedVisits.js';
import { getArrivalRoute, routeCoverage } from '../data/arrivalRoutes.js';
import './FocusedVisits.css';
import RecommendedPlaces from './RecommendedPlaces.jsx';
import {JOURNEY_MODELS} from '../data/journeyModels.js';
const groups = [
  {name:'전체', ids:RESEARCH_PLACE_IDS},
  {name:'문화·나들이', ids:RESEARCH_PLACE_IDS.slice(0,8)},
  {name:'도서관·생활·복지', ids:RESEARCH_PLACE_IDS.slice(8,16)},
  {name:'역·정류장', ids:RESEARCH_PLACE_IDS.slice(16)},
];
export default function FocusedPlaces({ onSelect, onArchive }) {
  const [group,setGroup] = useState('전체');
  const [search,setSearch] = useState('');
  const ids = groups.find(g=>g.name===group).ids.filter(id=>{
    const site=getFinalsPlace(id),visit=FOCUSED_VISITS[id];
    return `${site.name} ${visit.category} ${visit.reason}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  return <main id="mv5-main" className="fv-home">
    <RecommendedPlaces onSelect={onSelect}/>
    <details className="fv-more-places"><summary>여행 중 필요한 역·도서관·생활시설도 살펴볼까요?</summary>
    <div className="fv-collection-heading"><div><p className="fv-eyebrow">방문 준비를 일상으로</p><h2>기존 23곳의 사진 자료</h2><p>공연장부터 주민센터, 버스정류장까지. 필요한 시설도 함께 찾아봐요.</p></div><button onClick={onArchive}>전체 {FINALS_PLACES.length}곳 자료 <ArrowRight size={17} /></button></div>
    <div className="fv-discovery"><div className="fv-filters" role="group" aria-label="방문할 시설 유형">{groups.map(g=><button key={g.name} aria-pressed={group===g.name} onClick={()=>setGroup(g.name)}>{g.name}<span>{g.ids.length}</span></button>)}</div><label className="fv-search"><MagnifyingGlass size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="가고 싶은 장소 찾기" aria-label="23곳에서 장소 찾기"/></label></div>
    <p className="fv-result-count" role="status">{ids.length}곳 · 사진 속 구간을 모형과 함께 살펴볼 수 있어요.</p>
    <div className="fv-grid">{ids.map(id=>{
      const site=getFinalsPlace(id),visit=FOCUSED_VISITS[id],model=JOURNEY_MODELS[id]||visit.angle||getPlaceMiniature(id);
      const selectedPhoto=site.photos[visit.angle?.referencePoint||focusStartPoint(site)];
      const route=getArrivalRoute(id),coverage=routeCoverage(route);
      return <button className="fv-place-card" key={id} onClick={()=>onSelect(id,focusStartPoint(site))} aria-label={`${site.name} 처음 방문 준비`}>
        <div className="fv-card-model"><img src={model.image} alt={model.alt} loading="lazy"/><span>{String(RESEARCH_PLACE_IDS.indexOf(id)+1).padStart(2,'0')}</span><div className="fv-card-photo"><img src={selectedPhoto.image} alt="" loading="lazy"/><span><Camera size={11}/> 실제 사진</span></div></div>
        <div className="fv-card-copy"><small>{visit.category}</small><h3>{site.name}</h3><p>{visit.reason}</p>{route&&<div className="ar-card-route"><span>{route.start.name}</span><ArrowRight size={14}/><span>{route.destination}</span><small>순서 속 사진 {coverage.photos}장 · 연결 자료 공백 {coverage.missingLinks}곳</small></div>}<div className="fv-card-coverage">{visit.steps.map((s,i)=><span key={s.label} className={s.points.length?'has-photo':'needs-photo'}>{i+1} {s.label}<b>{s.points.length?'관련 사진':'사진 필요'}</b></span>)}</div><footer><span><Camera size={15}/> 실제 사진 {site.checkpoints.length}장</span><strong>내린 곳부터 보기 <ArrowRight size={17}/></strong></footer></div>
      </button>;
    })}</div>
    {!ids.length&&<div className="fv-empty"><p>이 이름으로 찾은 장소가 없어요.</p><button onClick={()=>{setSearch('');setGroup('전체');}}>23곳 모두 보기</button></div>}
    <a className="fv-research-link" href="/modu50m/research-v23/index.html">새로 찾은 사진과 입구까지 남은 연결 보기 <ArrowRight size={18}/></a>
    </details>
    <p className="fv-home-note"><MapPin size={18}/> 사진은 촬영 당시의 모습입니다. 사진이 없는 연결 구간과 현재 확인이 필요한 내용은 각 장소에서 알려 드려요.</p>
  </main>;
}
