import { ArrowRight, Camera, MapPin } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { routeCoverage, routeConnectionLabel, walkingConnection, walkingNodeId } from '../data/arrivalRoutes.js';
import {routeContextPhotos} from '../data/routePhotoAlbums.js';
import {journeyGallery} from '../data/journeyGallery.js';
import './ArrivalRouteStrip.css';
import {arrivalStepGuide} from '../data/arrivalStepGuides.js';

export default function ArrivalRouteStrip({ route, site, selected, onSelect }) {
  const coverage = routeCoverage(route);
  const photoCount = new Set(journeyGallery(site, route).map(photo => photo.image)).size;
  const sequence = useRef(null);
  useEffect(() => {
    const list=sequence.current, active=list?.children[selected];
    if (!active || !list) return;
    const bounds=list.getBoundingClientRect(), item=active.getBoundingClientRect();
    if (item.left<bounds.left || item.right>bounds.right) list.scrollLeft+=item.left-bounds.left-3;
  }, [selected]);
  return <div className="ar-journey" id="arrival-route" aria-label="내린 곳부터 입구까지 사진 순서">
    <div className="ar-heading"><div><p className="fv-eyebrow">입구 사진 전에, 여기까지 오는 길부터</p><h2>{route.title}</h2></div><span>{route.steps.length}구간 · 실제 참고 사진 {photoCount}장{coverage.missingLinks>0?` · 사진 사이 확인 ${coverage.missingLinks}곳`:''}</span></div>
    <div className="ar-endpoints"><div><small>{route.start.type==='bus-stop'?'버스에서 내리는 정류장':'내리거나 출발할 곳'}</small><strong><MapPin size={16}/>{route.start.name}{route.start.code?` · ${route.start.code}`:''}</strong>{route.start.direction&&<small>{route.start.direction}</small>}</div><ArrowRight size={20}/><div><small>찾아갈 입구</small><strong>{route.destination}</strong></div></div>
    <p className="ar-how">01번 출발 지점부터 번호 순서로 살펴봐요. 사진에서 보도·갈림길·출입문을 확인하고, 다음 버튼으로 이어 볼 수 있어요. 두 번호 사이의 사진이 부족한 곳은 따로 표시해요.</p>
    <ol className="ar-steps" ref={sequence}>{route.steps.map((step, index) => {
      const photo = step.pointId && site.photos[step.pointId];
      const context = routeContextPhotos(site.id,step);
      const thumbnail = photo || context[0];
      return <li key={step.id} data-walking-node={walkingNodeId(route.placeId,step.id)} data-walking-link={walkingConnection(route,index)?.id} className={index < route.steps.length - 1 && (!step.next || step.next.status === 'gap') ? 'ar-gap-edge' : 'ar-source-edge'}>
        <button onClick={() => onSelect(index)} aria-pressed={selected === index} aria-label={`${index + 1}단계 ${step.title}`}>
          <div className="ar-thumb">{thumbnail ? <img src={thumbnail.image} alt="" loading="lazy"/> : <span><Camera size={24}/>사진 필요</span>}<b>{String(index + 1).padStart(2, '0')}</b></div>
          <strong>{step.title}</strong><small>{photo ? '실제 사진 보기' : context.length?`주변 사진 ${context.length}장 비교`:'필요한 장면 살펴보기'}</small>
        </button>
        {index < route.steps.length - 1 && <span className="ar-edge-label">{routeConnectionLabel(step.next)}</span>}
      </li>;
    })}</ol>
    <details className="ar-sources"><summary>사진으로 확인한 범위 보기</summary><p>{route.summary || '인터넷 사진과 공개 안내를 대조해 정리했어요. 현장에서 하차부터 입구까지 이동을 확인한 경로는 아니에요.'}</p><ul>{route.gaps.map(gap => <li key={gap}>{gap}</li>)}</ul><div>{route.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div><small>자료 대조: {route.checkedAt || '2026-09-23'} · 촬영 시점과 현재 상태는 사진별로 확인해요.</small></details>
  </div>;
}

export function ArrivalRouteNext({ route, selected, onSelect, onFinish, compact=false }) {
  const step = route.steps[selected];
  if (!step) return null;
  const next = route.steps[selected + 1];
  const connection = walkingConnection(route,selected);
  const nextGuide=arrivalStepGuide(route,selected+1);
  if(compact)return <div className={`ar-next jvf-next ${next && (!step.next || step.next.status==='gap')?'ar-next-gap':''}`}>
    <div className="jvf-next-actions">
      {selected>0&&<button className="ar-previous" aria-label={`이전 ${String(selected).padStart(2,'0')}번 사진 보기`} onClick={()=>onSelect(selected-1)}>←</button>}
      {next?<button className="jvf-next-primary" onClick={()=>onSelect(selected+1)}><span><small>다음 {String(selected+2).padStart(2,'0')}번 사진</small><strong>{next.title}</strong></span><ArrowRight size={22}/></button>:onFinish&&<button className="jvf-next-primary" onClick={onFinish}><span><small>마지막 {String(selected+1).padStart(2,'0')}번 · {route.destination}</small><strong>나의 방문 준비 정리하기</strong></span><ArrowRight size={22}/></button>}
    </div>
    {next?<details data-walking-link={connection.id} data-evidence-status={connection.status}><summary>{step.next?.status==='gap'?'중간 바닥이 안 보여요 · 살펴보기':'두 지점의 연결 근거'}</summary><p><strong>{String(selected+1).padStart(2,'0')} {step.title} → {String(selected+2).padStart(2,'0')} {next.title}</strong></p>{connection.kind==='level-change'&&<p>{connection.fromLevel}층 → {connection.toLevel}층 이동이에요. 승강기 문과 도착 층을 따로 살펴봐요.</p>}<p>{connection.detail}</p><p>{nextGuide.direction}</p></details>:<p className="jvf-finish">{route.finish||'문턱과 문 여는 방법까지 살펴봐요.'}</p>}
  </div>;
  return <div className={`ar-next ${next && (!step.next || step.next.status === 'gap') ? 'ar-next-gap' : ''}`}>
    {next ? <><small>{routeConnectionLabel(step.next)}</small><strong>다음 {String(selected+2).padStart(2,'0')} · {next.title}</strong><p>{nextGuide.direction}</p><div className="ar-navigation">{selected>0&&<button className="ar-previous" onClick={()=>onSelect(selected-1)}>← 이전 {String(selected).padStart(2,'0')}번</button>}<button onClick={() => onSelect(selected + 1)}>다음 {String(selected+2).padStart(2,'0')}번 사진 보기 <ArrowRight size={17}/></button></div><details><summary>두 지점 사이 연결 근거</summary><p>{step.next?.detail||'두 지점 사이의 바닥과 이동 방향을 보여 주는 사진이 더 필요해요.'}</p></details></> : <><small>마지막 {String(selected+1).padStart(2,'0')}번 · 찾아갈 입구</small><strong>{route.destination}</strong><p>{route.finish||'문턱과 문 여는 방법까지 확인해요.'}</p>{selected>0&&<button className="ar-previous" onClick={()=>onSelect(selected-1)}>← 이전 {String(selected).padStart(2,'0')}번 사진 보기</button>}</>}
    {!next&&onFinish&&<button onClick={onFinish}>나의 방문 준비 정리하기 <ArrowRight size={17}/></button>}
  </div>;
}
