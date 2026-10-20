import {useState} from 'react';
import {ArrowRight,Camera,ChatCircle,MagnifyingGlass,ArrowUpRight} from '@phosphor-icons/react';
import {RECOMMENDED_EXPERIENCES,RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import {visitorPlaces} from '../data/visitorPlaces.js';
import {getPlaceMiniature} from '../data/placeMiniatures.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {focusStartPoint} from '../data/focusedVisits.js';
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {journeyGallery} from '../data/journeyGallery.js';
import './RecommendedPlaces.css';

const HOME_CAPTIONS = {
  hanbit:'대전의 상징, 탑 아래 입구까지',
  arboretum:'초록을 만나러, 열대식물원 입구까지',
  museum:'전시를 만나기 전, 경사로와 문 앞',
  leeungno:'작품을 만나기 전, 앞마당과 문 앞',
  science:'과학을 만나러, 미래기술관 입구까지',
  oworld:'동물과 정원을 만나러, 정문 매표소까지',
  sungsim:'빵을 만나러, 본점의 대기 줄과 문 앞',
  skyroad:'원도심을 즐기러, 스카이로드 진입부까지',
  station:'대전의 첫 만남, 서광장 쪽 출입문까지',
  terminal:'여행을 준비하며, 서관 GATE 4까지',
};

// The home shows recognizable landmarks. The detail view keeps the full route.
// Photo counts come from the same gallery used on the destination screen.
const HOME_PLACES = Object.fromEntries(RECOMMENDED_PLACE_IDS.map(id=>{
  const place=getFinalsPlace(id),route=getArrivalRoute(id);
  return [id,{
    model:getPlaceMiniature(id),
    photoCount:new Set(journeyGallery(place,route).map(photo=>photo.image)).size,
  }];
}));

export default function RecommendedPlaces({onSelect}) {
  const [query,setQuery]=useState(''),[experience,setExperience]=useState('all');
  const cards=visitorPlaces(query,experience);
  const open=id=>onSelect(id,focusStartPoint(getFinalsPlace(id)));
  return <section className="rj-discovery rj-landmark-home" aria-label="관심사로 고르는 대전 첫 방문">
    <div className="rj-hero">
      <div className="rj-hero-copy">
        <h1>가고 싶은 대전,<br/><em>길부터 미리 살펴봐요.</em></h1>
        <p>휠체어를 타거나 이동이 불편한 분들이<br className="rj-desktop-break"/> 처음 가는 길을 준비할 수 있도록 돕습니다.</p>
        <a href="#recommended-places" className="rj-start">가고 싶은 곳 고르기 <ArrowRight size={19}/></a>
        <span className="rj-hero-note">정류장부터 입구까지 · 실제 사진과 개인 메모</span>
      </div>
      <button className="rj-hero-model" onClick={()=>open('hanbit')} aria-label="한빛탑 미니어처로 방문 준비 시작">
        <img src={HOME_PLACES.hanbit.model.image} alt="한빛탑의 첨탑과 원형 전망대, 옆 전시관을 표현한 미니어처" width="1536" height="1024" fetchPriority="high"/>
        <span className="rj-model-label">한빛탑부터 살펴보기 <ArrowUpRight size={18}/></span>
      </button>
    </div>
    <ol className="rj-process" aria-label="방문 준비 방법">
      <li><b>01</b><span>가고 싶은 장소 고르기</span></li>
      <li><b>02</b><span>번호를 눌러 길 사진 보기</span></li>
      <li><b>03</b><span>개인 메모와 위치 링크로 이어보기</span></li>
    </ol>
    <div className="rj-section-heading" id="recommended-places" tabIndex={-1}>
      <div><h2>어디에 가고 싶으세요?</h2><p>건물 미니어처를 고르면, 그곳으로 가는 길을 살펴볼 수 있어요.</p></div>
      <label className="rj-search"><MagnifyingGlass size={19}/><input type="search" aria-label="추천 장소 검색" placeholder="장소 이름으로 찾아보세요" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    </div>
    <div className="rj-filters" role="group" aria-label="여행 관심사"><button aria-pressed={experience==='all'} onClick={()=>setExperience('all')}>모두 보기</button>{RECOMMENDED_EXPERIENCES.map(item=><button key={item.id} aria-pressed={experience===item.id} onClick={()=>setExperience(item.id)}>{item.tag}</button>)}</div>
    <p className="rj-result" role="status">{query?`‘${query}’ 검색 결과 · `:''}{cards.length}곳{cards.length===RECOMMENDED_PLACE_IDS.length?' · 대전의 명소와 주요 시설':''}</p>
    <div className="rj-grid">{cards.map(item=>{
      const {model,photoCount}=HOME_PLACES[item.id];
      const name=item.title.split(' · ')[0];
      return <article key={item.id} className="rj-card" data-place={item.id}>
        <button className="rj-card-image" onClick={()=>open(item.id)} aria-label={`${item.title} 미니어처와 실제 사진 보기`}>
          <img src={model.image} alt={`${name}의 대표 건물과 주변 모습을 표현한 미니어처`} width="1536" height="1024" loading="lazy"/>
          <span>{item.experience.tag}</span>
        </button>
        <div className="rj-card-body">
          <h3>{name}</h3><p>{HOME_CAPTIONS[item.id]}</p>
          <span className="rj-card-photo-count"><Camera size={16} aria-hidden="true"/> 실제 사진 {photoCount}장</span>
          <div className="rj-destinations"><button onClick={()=>open(item.id)} aria-label={`${item.title} 방문 준비`}><strong>가는 길 미리보기</strong><ArrowRight size={20}/></button></div>
        </div>
      </article>;
    })}</div>
    {!cards.length&&<div className="fv-empty"><p>조건에 맞는 추천 장소가 없어요.</p><button onClick={()=>{setQuery('');setExperience('all');}}>추천 장소 모두 보기</button></div>}
    <div className="rj-evidence-note"><ChatCircle size={24}/><p><strong>“여기는 조금 조심해야 할 것 같아요.”</strong><span>길 사진을 보고 떠오른 질문이나 의견을 개인 메모에 남겨 보세요. 위치 링크를 보내면 다른 사람도 같은 사진을 살펴볼 수 있어요.</span></p></div>
    <p className="rj-miniature-note">미니어처는 장소를 알아보기 위한 모형입니다. 길의 세부 모습은 실제 사진으로 살펴보세요.</p>
  </section>;
}
