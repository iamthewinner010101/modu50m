import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowsOutCardinal,Swap} from '@phosphor-icons/react';
import MiniatureImageMap from './MiniatureImageMap.jsx';
import {nextMiniatureView,prepareMiniatureViews} from '../data/miniatureImageViews.js';
import './MiniatureImageViews.css';

export default function MiniatureImageViews({model,views,viewId,onViewChange,steps,selected,onSelect,large,placeName,scopeLabel,onShowRoute,commentCounts,startLabel}){
  const [interaction,setInteraction]=useState('pan'),[imageReady,setImageReady]=useState({}),[retry,setRetry]=useState(0);
  const view=views.find(v=>v.id===viewId)||views[0];
  const ready=Object.fromEntries(views.map(v=>[v.id,imageReady[v.image]]));
  useEffect(()=>{
    let disposed=false;
    prepareMiniatureViews(views,(image,loaded)=>setImageReady(previous=>({...previous,[image]:loaded})),{cancelled:()=>disposed});
    return()=>{disposed=true;};
  },[views,retry]);
  const turn=direction=>{const next=nextMiniatureView(views,view.id,direction);if(ready[next])onViewChange(next);};
  const original=views.find(v=>v.id==='original')||views[0];
  const outside=selected>=0&&!original.pins.some(pin=>pin.steps.includes(selected));
  const unavailable=selected>=0&&!view.pins.some(pin=>pin.steps.includes(selected));
  const occluded=(view.occludedConnections||[]).flatMap(([from,to])=>{const a=steps.findIndex(s=>s.id===from),b=steps.findIndex(s=>s.id===to);return a>=0&&b===a+1?[`${String(a+1).padStart(2,'0')} → ${String(b+1).padStart(2,'0')}`]:[];});
  const alternate=views.find(v=>v.fullJourney&&v.id!==view.id);
  return <section className="miv" aria-label={`${placeName} 미니어처 이미지 둘러보기`} data-view={view.id} data-full-journey={!!view.fullJourney}>
    <div className="miv-angle-heading"><strong>다른 각도 보기</strong><span>{views.length}개 구도 · 현재 {view.label}</span></div>
    <div className="miv-angle-tabs" role="group" aria-label="미니어처 이미지 구도 선택">{views.map(v=><button type="button" key={v.id} onClick={()=>onViewChange(v.id)} aria-pressed={v.id===view.id} disabled={!ready[v.id]} aria-label={`${v.label} 미니어처 보기`}><img src={v.image} alt="" loading="lazy" decoding="async"/><span><b>{v.label}</b><small>{ready[v.id]?v.description:ready[v.id]===false?'불러오기 실패':'준비 중'}</small></span></button>)}</div>
    {views.some(v=>imageReady[v.image]===false)&&<div className="miv-hidden"><p>일부 구도를 불러오지 못했어요. 현재 사진과 위치 선택은 계속 사용할 수 있어요.</p><button type="button" onClick={()=>setRetry(value=>value+1)}>다른 각도 다시 불러오기</button></div>}
    {model.fullJourney&&!view.fullJourney&&<div className="miv-journey-summary"><small>입구 주변 구도</small><button onClick={()=>onViewChange('original')}>전체 동선으로 돌아가기</button></div>}
    {unavailable&&<div className="miv-hidden"><p><strong>{String(selected+1).padStart(2,'0')} {steps[selected]?.title}</strong>{outside?' · 이 미니어처의 범위 밖 구간이에요. 전체 동선 지도와 실제 사진으로 이어서 살펴봐요.':' 구역은 이 각도에 위치를 표시하지 않았어요. 선택한 실제 사진은 그대로 볼 수 있어요.'}</p>{outside?onShowRoute&&<button onClick={onShowRoute}>선택 구간을 전체 동선 지도에서 보기</button>:<button onClick={()=>onViewChange('original')}>선택 구역이 보이는 기본 구도로</button>}</div>}
    <MiniatureImageMap model={{...model,...view}} steps={steps} selected={selected} onSelect={onSelect} large={large} interaction={interaction} onTurn={turn} commentCounts={commentCounts} startLabel={startLabel}/>
    {occluded.length>0&&alternate&&<div className="miv-hidden miv-occluded"><p><strong>{occluded.join(" / ")}</strong>은 지붕 뒤에 가려져 있어요. 전체 다른 각도에서 이어서 살펴보세요.</p><button type="button" onClick={()=>onViewChange(alternate.id)} disabled={!ready[alternate.id]}>전체 다른 각도에서 보기</button></div>}
    <details className="miv-view-options"><summary>끌기 방식·모형 범위 <span>이동·확대 / 구도 바꾸기</span></summary>
    <div className="miv-navigation"><div role="group" aria-label="미니어처 끌기 방식"><button aria-pressed={interaction==='pan'} onClick={()=>setInteraction('pan')}><ArrowsOutCardinal size={17}/>이동·확대</button><button aria-pressed={interaction==='turn'} onClick={()=>setInteraction('turn')}><Swap size={17}/>구도 바꾸기</button></div><div className="miv-turn-buttons"><button aria-label="이전 미니어처 구도" onClick={()=>turn(-1)} disabled={!ready[nextMiniatureView(views,view.id,-1)]}><ArrowLeft size={17}/></button><strong aria-live="polite">{view.label}</strong><button aria-label="다음 미니어처 구도" onClick={()=>turn(1)} disabled={!ready[nextMiniatureView(views,view.id,1)]}><ArrowRight size={17}/></button></div></div>
    <p className="miv-help">{interaction==='pan'?'그림을 끌어 이동하고 ＋·− 또는 두 손가락으로 확대해요.':'그림을 좌우로 끌면 준비된 다른 구도로 바뀌어요. ←·→ 버튼도 사용할 수 있어요.'}</p>
    {scopeLabel&&<p className="miv-scope"><span>그림에 담은 곳 · <b>{view.scope||scopeLabel}</b></span>{onShowRoute&&<button onClick={onShowRoute}>지도와 위치 비교 <ArrowRight size={14}/></button>}</p>}
    <p className="miv-note">사진 선택을 돕는 AI 참고 모형이에요. 준비된 {views.length}개 구도를 바꿔 보며, 실제 바닥·경사·연결은 현장 사진과 비교해요.</p>
    </details>
  </section>;
}
