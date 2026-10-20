import {useState} from 'react';
import {missingConnections} from '../data/visitScopes.js';
import {routeConnectionLabel} from '../data/arrivalRoutes.js';
import {photoSourceDescription} from '../data/routePhotoAlbums.js';
import {connectionReviewIndex} from '../data/photoReadingPlan.js';
import PhotoGalleryButton from './PhotoGalleryButton.jsx';
import './JourneyConnectionReview.css';

const number=i=>String(i+1).padStart(2,'0');
export default function JourneyConnectionReview({route,photos=[],selected=0,onSelect,onAdd,onComment,panelRef,request}) {
  const [choice,setChoice]=useState(null);
  const [images,setImages]=useState({});
  const links=missingConnections(route);
  const current=connectionReviewIndex(route,selected,request,choice);
  const from=route.steps[current],to=route.steps[current+1];
  if(!from||!to)return null;
  const selectedPhoto=index=>{const group=photos.filter(p=>p.stepIndex===index);return group.find(p=>p.image===images[index])||group[0];};
  function choose(index){setChoice({at:selected,index,request:request?.serial});}
  return <details className="jcr-panel" ref={panelRef}>
    <summary>두 번호 사이 길을 사진으로 비교하기 <span>{route.steps.length-1}개 연결{links.length>0?` · 자료 부족 ${links.length}개`:''}</span></summary>
    <p>같은 건물·표지·바닥이 다음 사진에도 보이는지 비교해요. 촬영 위치와 시기가 다를 수 있어요.</p>
    <label className="jcr-select">비교할 두 번호<select value={current} onChange={e=>choose(Number(e.target.value))}>{route.steps.slice(0,-1).map((s,i)=><option key={s.id} value={i}>{number(i)} {s.title} → {number(i+1)} {route.steps[i+1].title}</option>)}</select></label>
    {links.length>0&&<div className="jcr-gaps"><strong>자료가 더 필요한 연결</strong>{links.map(link=><button key={link.from} aria-pressed={current===link.from} onClick={()=>choose(link.from)}>{number(link.from)} → {number(link.to)}</button>)}</div>}
    <div className="jcr-pair">{[current,current+1].map(index=>{
      const group=photos.filter(p=>p.stepIndex===index);
      const active=selectedPhoto(index);
      return <section key={route.steps[index].id} aria-label={`${number(index)} 비교 사진`}>
        <h3><b>{number(index)}</b>{route.steps[index].title}</h3>
        {active?<><PhotoGalleryButton className="jcr-image" photos={group} index={group.indexOf(active)}><img src={active.image} alt={active.title} loading="lazy"/><span>사진 크게 보기 ↗</span></PhotoGalleryButton>
          <p className="jcr-credit">{photoSourceDescription(active).date}</p><strong className="jcr-title">{active.title}</strong>
          {group.length>1&&<div className="jcr-thumbs" aria-label="비교할 사진 선택">{group.map((p,i)=><button key={p.image} aria-label={`${number(index)} 비교 사진 ${i+1}: ${p.title}`} aria-pressed={p===active} onClick={()=>setImages({...images,[index]:p.image})}><img src={p.image} alt="" loading="lazy"/>{i+1}</button>)}</div>}
          <p className="jcr-role">{active.evidenceRole?.detail||active.scope}</p><a href={active.sourceUrl} target="_blank" rel="noreferrer">사진 출처·다른 방향 보기 ↗</a>
        </>:<p>이 번호에 맞는 사진이 아직 없어요.</p>}
        <button className="jcr-step" onClick={()=>onSelect(index)}>{number(index)} 번호의 미니어처·설명 보기</button>
      </section>;
    })}</div>
    <div className="jcr-connection"><strong>{routeConnectionLabel(from.next)}</strong><p>{from.next?.detail||'앞뒤 사진 사이의 바닥을 보여 줄 자료가 더 필요해요.'}</p>{from.pointId&&from.pointId===to.pointId&&<p>두 번호가 같은 원본 사진을 사용해요. 다른 각도로 촬영한 사진 두 장이 아니에요.</p>}<div className="jcr-actions">{onComment&&<button className="jcr-ask" onClick={()=>onComment(current,selectedPhoto(current)?.image)}>{number(current)} → {number(current+1)} 사이 길 질문하기</button>}<button onClick={()=>onAdd(`[연결 ${number(current)}→${number(current+1)}] ${from.title}에서 ${to.title}까지 보행 바닥·갈림길·가려진 부분을 더 확인하고 싶어요.`)}>내 준비 메모에 담기</button></div>{onComment&&<small className="jcr-ask-note">질문은 {number(current)}번 위치 댓글에 남겨요. 지금 비교한 {number(current)}번 사진을 함께 엽니다.</small>}</div>
    <nav aria-label="이전·다음 연결"><button disabled={current===0} onClick={()=>choose(current-1)}>← 이전 연결</button><button disabled={current===route.steps.length-2} onClick={()=>choose(current+1)}>다음 연결 →</button></nav>
  </details>;
}
