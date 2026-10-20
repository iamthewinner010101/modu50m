import {useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {individualMiniaturePins} from '../data/miniatureRouteSelection.js';
import {miniatureSwipeDirection} from '../data/miniatureImageViews.js';
import {layoutPhotoMarkers} from '../utils/photoMarkerLayout.js';
import './MiniatureImageMap.css';

const number=i=>String(i+1).padStart(2,'0');
const coordinate=([x,y])=>[1024*(1-y/100),1536*x/100];

export default function MiniatureImageMap({model,steps,selected,onSelect,large=false,interaction='pan',onTurn,commentCounts,startLabel='하차'}) {
  const host=useRef(null), controller=useRef(null), pins=useRef([]);
  const latest=useRef({selected,onSelect,onTurn}),gesture=useRef(null);
  const [zoom,setZoom]=useState(1);
  const [imageError,setImageError]=useState(false);
  useEffect(()=>{latest.current={selected,onSelect,onTurn};},[selected,onSelect,onTurn]);
  const geometry=JSON.stringify(individualMiniaturePins(model.pins,steps));
  const segments=JSON.stringify(model.routeSegments||[]);
  useEffect(()=>{
    const map=L.map(host.current,{crs:L.CRS.Simple,zoomControl:false,attributionControl:false,
      scrollWheelZoom:false,zoomAnimation:false,zoomSnap:0,zoomDelta:.5,minZoom:-5,maxZoom:3,
      maxBounds:[[-400,-400],[1424,1936]],maxBoundsViscosity:.8});
    L.imageOverlay(model.image,[[0,0],[1024,1536]],{alt:model.alt,interactive:false}).on('load',()=>setImageError(false)).on('error',()=>setImageError(true)).addTo(map);
    const reset=()=>{
      // Leaflet clamps getBoundsZoom to the previous fit limits. Clear them
      // before measuring so a narrower viewport can fit the whole miniature.
      map.setMinZoom(-5).setMaxZoom(3);
      map.invalidateSize({pan:false,animate:false});
      const fit=map.getBoundsZoom([[0,0],[1024,1536]]);
      map.setMinZoom(fit).setMaxZoom(fit+2.5);
      map.setView([512,768],fit,{animate:false});
      const focus=()=>{const pin=JSON.parse(geometry).find(p=>p.steps.includes(latest.current.selected));if(pin)map.setView(coordinate(pin.anchor||pin.position),Math.min(fit+1.25,map.getMaxZoom()),{animate:false});};
      controller.current={map,reset,fit,focus};
      setZoom(1);
    };
    // Lines follow visible pavement in the illustration. Unverified connections
    // are omitted rather than drawn through buildings or lawns.
    for(const segment of JSON.parse(segments)){
      const points=segment.points.map(coordinate);
      L.polyline(points,{color:'#fffdf5',weight:7,opacity:.95,interactive:false}).addTo(map);
      L.polyline(points,{color:'#bc8626',weight:3,dashArray:'7 7',className:'lm-walking-line',interactive:false}).addTo(map);
    }
    pins.current=JSON.parse(geometry).map(pin=>{
      const anchor=coordinate(pin.anchor||pin.position);
      const leader=L.polyline([anchor,coordinate(pin.position)],{color:'#08766b',weight:1.7,dashArray:'3 5',className:'lm-leader-line',interactive:false}).addTo(map);
      if(pin.anchor){
        L.circleMarker(coordinate(pin.anchor),{radius:4,color:'white',weight:2,fillColor:'#087668',fillOpacity:1,interactive:false}).addTo(map);
      }
      const button=document.createElement('button');
      button.type='button';button.className='lm-pin';
      button.setAttribute('aria-label',`모형 ${pin.steps.map(number).join('·')} ${pin.label} 사진·안내 보기`);
      const badge=document.createElement('b'),label=document.createElement('span'),count=document.createElement('i');
      count.className='lm-comment-count';count.setAttribute('aria-hidden','true');count.hidden=true;
      badge.textContent=pin.steps.map(number).join('·');label.textContent=pin.label;
      button.append(badge,label,count);
      button.setAttribute('aria-pressed',String(pin.steps.includes(latest.current.selected)));
      L.DomEvent.disableClickPropagation(button);
      button.addEventListener('click',()=>latest.current.onSelect(pin.steps.includes(latest.current.selected)?latest.current.selected:pin.steps[0]));
      const marker=L.marker(coordinate(pin.position),{icon:L.divIcon({html:button,className:'lm-marker',iconSize:[0,0]}),keyboard:false}).addTo(map);
      return {button,count,marker,leader,anchor,position:coordinate(pin.position),label:pin.label,steps:pin.steps};
    });
    const readView=()=>{
      const size=map.getSize(),visible=[];
      for(const pin of pins.current){
        const point=map.latLngToContainerPoint(pin.position);
        pin.marker.setLatLng(pin.position);pin.leader.setLatLngs([pin.anchor,pin.position]);
        // Keep off-screen locations off-screen when the user pans or zooms.
        if(point.x>=0&&point.x<=size.x&&point.y>=0&&point.y<=size.y)
          visible.push({pin,position:[point.x*100/size.x,point.y*100/size.y]});
      }
      const layout=layoutPhotoMarkers(visible,size.x,size.y,44,10);
      layout.forEach((item,index)=>{if(!item?.center)return;
        const pin=visible[index].pin,position=map.containerPointToLatLng(item.center);
        pin.marker.setLatLng(position);pin.leader.setLatLngs([pin.anchor,position]);
      });
      const factor=2**(map.getZoom()-(controller.current?.fit??map.getZoom()));setZoom(factor);
      host.current.dataset.zoom=factor.toFixed(2);host.current.dataset.center=JSON.stringify([map.getCenter().lat,map.getCenter().lng].map(n=>Math.round(n)));
    };
    map.on('zoomend moveend',readView);
    reset();
    const resize=new ResizeObserver(reset);resize.observe(host.current);
    return()=>{resize.disconnect();map.remove();controller.current=null;pins.current=[];};
  },[model.image,model.alt,geometry,segments]);
  useEffect(()=>{const map=controller.current?.map;if(!map)return;for(const handler of [map.dragging,map.touchZoom,map.doubleClickZoom,map.keyboard]){if(interaction==='turn')handler.disable();else handler.enable();}gesture.current=null;},[interaction,model.image]);
  useEffect(()=>{pins.current.forEach(p=>p.button.setAttribute('aria-pressed',String(p.steps.includes(selected))));},[selected]);
  useEffect(()=>{pins.current.forEach(p=>{const total=p.steps.reduce((sum,i)=>sum+(commentCounts?.[i]||0),0);p.count.hidden=!total;p.count.textContent=String(total);p.button.setAttribute('aria-label',`모형 ${p.steps.map(number).join('·')} ${p.label} 사진·안내 보기${total?` · 댓글 ${total}개`:''}`);});},[commentCounts,model.image,geometry]);
  const active=steps[selected];
  const connectionGaps=steps.flatMap((step,index)=>index<steps.length-1&&(!step.next||step.next.status==='gap')?[[index,index+1]]:[]);
  const hasModelPin=model.pins.some(pin=>pin.steps.includes(selected));
  return <div className={`lm-frame ${large?'lm-large':''} ${commentCounts?'lm-with-comments':''}`}>
    <div className="lm-route-picker">
      <div className="lm-route-heading"><strong>위치 선택</strong><span>01 {startLabel} <span aria-hidden="true">→</span> {number(steps.length-1)} 입구</span></div>
      <div className="lm-all-numbers" role="group" aria-label="미니어처 전체 구간 번호">
        {steps.map((step,i)=><button key={step.id} type="button" aria-pressed={selected===i}
          aria-label={`전체 구간 ${number(i)} ${step.title} 사진·안내 보기${commentCounts?.[i]?` · 댓글 ${commentCounts[i]}개`:''}`} title={`${number(i)} ${step.title}${commentCounts?.[i]?` · 댓글 ${commentCounts[i]}개`:''}`}
          onClick={()=>onSelect(i)}><b>{number(i)}</b><span className="lm-step-label">{step.title}</span>{commentCounts?.[i]>0&&<span className="lm-number-count" aria-hidden="true">{commentCounts[i]}</span>}</button>)}
      </div>
      {!hasModelPin&&active&&<p className="lm-selected-stop">{number(selected)} 위치는 이 구도에 표시되지 않았어요. 실제 사진에서 살펴보세요.</p>}
    </div>
    <div className="lm-artwork">
    <div className="lm-canvas" ref={host} data-interaction={interaction} aria-label={interaction==='turn'?'좌우로 끌어 구도를 바꾸는 미니어처':'확대하고 움직이는 미니어처'}
      onPointerDown={e=>{if(interaction!=='turn'||e.target.closest('button'))return;if(!e.isPrimary){gesture.current=null;return;}gesture.current={x:e.clientX,y:e.clientY,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(interaction==='turn'&&start?.id===e.pointerId){const direction=miniatureSwipeDirection(e.clientX-start.x,e.clientY-start.y);if(direction)latest.current.onTurn?.(direction);}}}
      onPointerCancel={()=>{gesture.current=null;}}
      onKeyDown={e=>{if(interaction==='turn'&&e.target===e.currentTarget&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();latest.current.onTurn?.(e.key==='ArrowLeft'?-1:1);}}}/>
    {imageError&&<p className="lm-image-error" role="alert">이미지를 불러오지 못했어요. 다른 구도를 선택하거나 새로고침해 주세요.</p>}
    <span className="lm-disclaimer">지도·사진 참고 AI 모형{model.pins.length?' · 번호는 사진 구역':''}</span>
    <div className="lm-controls" role="group" aria-label="미니어처 확대와 이동">
      <button aria-label="미니어처 확대" disabled={zoom>=5.65} onClick={()=>controller.current?.map.zoomIn(.5)}>＋</button>
      <button aria-label="미니어처 축소" disabled={zoom<=1.01} onClick={()=>controller.current?.map.zoomOut(.5)}>−</button>
      <button onClick={()=>controller.current?.reset()}>처음 크기</button>
      {onTurn&&<button disabled={!hasModelPin} onClick={()=>controller.current?.focus()}>선택 구간 확대</button>}
      <output aria-label="미니어처 확대 배율">{zoom.toFixed(1)}배</output>
    </div>
    <span className="lm-hint">{interaction==='turn'?'좌우로 끌어 구도 전환':'끌어서 이동'} · {model.pins.length?'번호를 눌러 사진 보기':'아래 순서에서 사진 선택'}</span>
    </div>
    {(model.fullJourney||connectionGaps.length>0)&&<div className="lm-route-legend"><p>{model.fullJourney?<><i/> 사진을 살펴볼 순서 · 실제 통행 확인 전</>:<>번호는 사진을 살펴볼 순서 · 실제 통행 확인 전</>}</p>{connectionGaps.length>0&&<details className="lm-route-gaps"><summary>연결 사진이 부족한 곳 {connectionGaps.length}구간</summary><p>{connectionGaps.map(([a,b])=>`${number(a)} → ${number(b)}`).join(' / ')} · {model.fullJourney?'이 구간은 선을 잇지 않았어요.':'이 구간의 중간 사진이 더 필요해요.'}</p></details>}</div>}
  </div>;
}
