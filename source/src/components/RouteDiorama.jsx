import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ArrowCounterClockwise, ArrowsClockwise, Plus, Minus, Camera} from '@phosphor-icons/react';
import maps from '../data/routeGroundMapsV25.json';
import albums from '../data/routePhotoAlbums.js';
import {buildRouteDiorama} from '../utils/routeDiorama.js';
import RouteGroundMap from './RouteGroundMap.jsx';
import './RouteDiorama.css';

const number = i => String(i+1).padStart(2, '0');

export default function RouteDiorama({placeId, route, selected, onSelect}) {
  const hostRef=useRef(null), pins=useRef([]), leaders=useRef([]), compass=useRef(null), runtime=useRef(null);
  const [failed,setFailed]=useState(false), [ready,setReady]=useState(false);
  const map=maps[placeId], selectedRef=useRef(selected);
  useEffect(()=>{selectedRef.current=selected;runtime.current?.model.select(selected);runtime.current?.render();},[selected]);
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
    catch{queueMicrotask(()=>setFailed(true));return;}
    let alive=true,frame=0,visible=true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.90;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden','true');host.prepend(renderer.domElement);
    const scene=new THREE.Scene(),model=buildRouteDiorama(map,placeId);scene.add(model.root);
    const ambient=new THREE.HemisphereLight('#fff9e9','#a7bda9',1.5);scene.add(ambient);
    const sun=new THREE.DirectionalLight('#fff5dc',2.5);sun.position.set(-180,260,150);scene.add(sun);
    sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.35;sun.shadow.bias=-.0002;
    const extent=Math.max(model.width,model.depth)*.72;
    Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:1,far:900});sun.shadow.camera.updateProjectionMatrix();
    const fill=new THREE.DirectionalLight('#dcecee',.8);fill.position.set(200,90,-180);scene.add(fill);
    const shadowGround=new THREE.Mesh(new THREE.PlaneGeometry(model.width*4,model.depth*4),new THREE.ShadowMaterial({color:'#637868',opacity:.13}));
    shadowGround.rotation.x=-Math.PI/2;shadowGround.position.y=-5.7;shadowGround.receiveShadow=true;scene.add(shadowGround);
    const camera=new THREE.OrthographicCamera(-200,200,150,-150,.1,1800);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enablePan=false;controls.enableDamping=false;controls.minZoom=.75;controls.maxZoom=2.1;
    controls.minPolarAngle=.18;controls.maxPolarAngle=1.12;controls.enableZoom=false;
    controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
    const reset=()=>{
      const s=model.width;
      camera.position.set(s*.4,s*.73,s*.83);controls.target.set(0,placeId==='hanbit'?12:1,0);camera.zoom=1;camera.updateProjectionMatrix();controls.update();
    };
    reset();
    function projectLabels(){
      const w=host.clientWidth,h=host.clientHeight,small=w<480,boxWidth=small?85:109,boxHeight=small?45:48;
      const offsets=placeId==='hanbit'?[[32,36],[40,5],[45,-38],[-12,-52],[-40,36]]:[[-38,-34],[-18,-43],[38,-18],[42,8],[18,40]];
      const boxes=model.markers.map((m,i)=>{
        const p=m.point.clone();p.y=2;p.project(camera);
        const anchor=[(p.x+1)*w/2,(1-p.y)*h/2];
        return {anchor,x:anchor[0]+offsets[i][0],y:anchor[1]+offsets[i][1]};
      });
      for(let pass=0;pass<16;pass++){
        boxes.forEach(b=>{b.x=Math.max(boxWidth/2+8,Math.min(w-boxWidth/2-8,b.x));b.y=Math.max(70,Math.min(h-58,b.y));});
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
          const a=boxes[i],b=boxes[j],dx=b.x-a.x,dy=b.y-a.y;
          if(Math.abs(dx)<boxWidth+4&&Math.abs(dy)<boxHeight+6){const direction=dy===0?(i<j?1:-1):Math.sign(dy);const push=(boxHeight+7-Math.abs(dy))/2;a.y-=direction*push;b.y+=direction*push;}
        }
      }
      boxes.forEach((b,i)=>{
        const pin=pins.current[i],line=leaders.current[i];
        if(pin){pin.style.left=`${b.x}px`;pin.style.top=`${b.y}px`;}
        if(line){line.setAttribute('x1',b.anchor[0]);line.setAttribute('y1',b.anchor[1]);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);}
      });
      if(compass.current){const p=new THREE.Vector3(0,0,-20).project(camera),o=new THREE.Vector3().project(camera);const angle=Math.atan2(p.x-o.x,p.y-o.y)*180/Math.PI;compass.current.style.transform=`rotate(${angle}deg)`;}
    }
    function draw(){frame=0;if(!alive||!visible)return;renderer.render(scene,camera);projectLabels();}
    function render(){if(!frame&&alive)frame=requestAnimationFrame(draw);}
    function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
      const span=Math.max(model.width*.83,model.width*1.24/(w/h));camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);render();}
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)render();});intersection.observe(host);
    const contextLost=e=>{e.preventDefault();setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',contextLost);
    controls.addEventListener('change',render);
    model.select(selectedRef.current);runtime.current={model,render,reset:()=>{reset();render();},zoom:factor=>{camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.75,2.1);camera.updateProjectionMatrix();render();},rotate:()=>{const p=camera.position.clone().sub(controls.target);p.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/6);camera.position.copy(controls.target).add(p);controls.update();render();}};
    resize();queueMicrotask(()=>{if(alive)setReady(true);});
    return()=>{alive=false;cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);model.dispose();sun.shadow.dispose();shadowGround.geometry.dispose();shadowGround.material.dispose();renderer.dispose();renderer.domElement.remove();runtime.current=null;};
  },[map,placeId,failed]);
  if(failed)return <div><p className="rd-note">입체 화면을 열 수 없어 위치 지도와 사진으로 보여드려요.</p><RouteGroundMap {...{placeId,route,selected,onSelect}}/></div>;
  return <div className="rd-wrap">
    <div className={`rd-stage ${ready?'rd-ready':''}`} ref={hostRef} role="group" aria-label={`${placeId==='hanbit'?'한빛탑':'오월드'} 입체 미니어처에서 사진 선택`}>
      <div className="rd-kicker"><span>MINIATURE WALK</span><strong>가기 전에, 길을 살펴봐요.</strong></div>
      <div className="rd-compass" aria-label="북쪽 방향"><span ref={compass}>↑</span><b>N</b></div>
      {!ready&&<div className="rd-loading">미니어처를 준비하고 있어요…</div>}
      <svg className="rd-leaders" aria-hidden="true">{map.markers.map((m,i)=><line key={m.step} ref={n=>leaders.current[i]=n} className={m.steps.includes(selected)?'rd-line-active':''}/>)}</svg>
      {map.markers.map((m,i)=><button ref={n=>pins.current[i]=n} key={m.step} className="rd-pin" aria-pressed={m.steps.includes(selected)} aria-label={`입체 모형 ${m.steps.map(number).join('·')} ${m.label} 실제 사진 보기`} onClick={()=>onSelect(m.steps.includes(selected)?selected:m.step)}>
        <b>{m.steps.map(number).join('·')}</b><span>{m.label}<small><Camera size={10}/>{1+(albums[placeId]?.[route.steps[m.step].pointId]?.length||0)}장</small></span>
      </button>)}
      <div className="rd-hint">드래그해서 돌려 보기 · 번호를 눌러 사진 보기</div>
      <div className="rd-controls" role="group" aria-label="입체 모형 시점 조절">
        <button onClick={()=>runtime.current?.rotate()} aria-label="모형 30도 회전"><ArrowsClockwise size={17}/></button>
        <button onClick={()=>runtime.current?.zoom(1.18)} aria-label="모형 확대"><Plus size={17}/></button>
        <button onClick={()=>runtime.current?.zoom(1/1.18)} aria-label="모형 축소"><Minus size={17}/></button>
        <button onClick={()=>runtime.current?.reset()} aria-label="모형 처음 각도로"><ArrowCounterClockwise size={17}/></button>
      </div>
    </div>
    <div className="rd-legend"><span><i/> 실제 사진 구역</span><span><i className="rd-route"/> 관광공사 안내선</span><small>건물 형태·높이·조경은 참고 모형</small></div>
    <p className="rd-note">도로·건물의 위치는 공개 지도 좌표를 사용했어요. 길의 폭·경사·장애물은 번호를 눌러 실제 사진에서 확인해요.{placeId==='hanbit'?' 05번에는 통로 입구와 광장 비교 사진이 있어요. 사이 연결은 확인 중이에요.':''}</p>
    <div className="rd-source"><span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · 사진 구역 한국관광공사</span><a href={map.kakaoUrl} target="_blank" rel="noreferrer">지도·스카이뷰 비교 ↗</a></div>
  </div>;
}
