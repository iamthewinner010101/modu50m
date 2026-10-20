import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ArrowCounterClockwise,ArrowClockwise,ArrowsOut,Camera,Eye,MapPin} from '@phosphor-icons/react';
import {buildHanbitJourney} from '../utils/buildHanbitJourney.js';
import {HANBIT_STOPS,HANBIT_REFERENCE_IMAGES,HANBIT_3D_SOURCES,mapToWorld,geoToMap} from '../data/hanbitJourney3d.js';
import './HanbitJourney3D.css';

const number=i=>String(i+1).padStart(2,'0');
const LANDMARKS=[{name:'한빛탑',point:[348.37,354.54],height:76},{name:'기념관',point:[573,250],height:23},{name:'대전통일관',point:[610,465],height:23},{name:'엑스포로97번길 · 차도',point:[994,568],height:1}];

export default function HanbitJourney3D({route,selected,onSelect,photo,onPhotoSelect,large=false}) {
  const host=useRef(null),runtime=useRef(null),pinRefs=useRef([]),lineRefs=useRef([]),nameRefs=useRef([]),cameraPin=useRef(null),northRef=useRef(null),angleRef=useRef(null);
  const latest=useRef({selected,photo});
  const [error,setError]=useState(''),[ready,setReady]=useState(false),[reveal,setReveal]=useState(false);
  useEffect(()=>{latest.current={selected,photo};if(runtime.current){runtime.current.model.select(selected);runtime.current.model.setPhoto(photo);runtime.current.dirty=true;}},[selected,photo]);
  useEffect(()=>{if(runtime.current){runtime.current.model.revealPaths(reveal);runtime.current.dirty=true;}},[reveal]);
  useEffect(()=>{
    const element=host.current;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}
    catch{queueMicrotask(()=>setError('이 기기에서는 3D를 열지 못했어요. 아래 번호로 사진을 계속 살펴볼 수 있어요.'));return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-label','한빛탑 정류장부터 입구 사진 구역까지 회전하는 3D 모형');
    renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;element.prepend(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#eee8dc');
    const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environmentTarget=pmrem.fromScene(environment,.04);
    scene.environment=environmentTarget.texture;scene.environmentIntensity=.32;environment.dispose();pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#fffcf1','#7c8066',.8));
    const sun=new THREE.DirectionalLight('#fff2dc',3.4);sun.position.set(-90,190,95);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-175,right:175,top:160,bottom:-160,near:1,far:460});sun.shadow.mapSize.set(4096,4096);sun.shadow.normalBias=.12;sun.shadow.bias=-.0001;sun.shadow.radius=2;scene.add(sun);
    const fill=new THREE.DirectionalLight('#d6ecf0',.5);fill.position.set(100,80,-120);scene.add(fill);
    const camera=new THREE.OrthographicCamera(-180,180,120,-120,.1,1600);
    const start=new THREE.Vector3(240,290,310),target=new THREE.Vector3(0,12,0);camera.position.copy(start);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.12;
    controls.enablePan=false;controls.minZoom=.85;controls.maxZoom=2.8;controls.minPolarAngle=.13;controls.maxPolarAngle=1.22;
    controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
    controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
    const model=buildHanbitJourney(scene);model.select(latest.current.selected);model.setPhoto(latest.current.photo);
    const targetBuffer=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:Math.min(4,renderer.capabilities.maxSamples)});
    const composer=new EffectComposer(renderer,targetBuffer),renderPass=new RenderPass(scene,camera),ao=new SSAOPass(scene,camera,1,1,12),output=new OutputPass();
    ao.kernelRadius=2.8;ao.minDistance=.00008;ao.maxDistance=.022;composer.addPass(renderPass);composer.addPass(ao);composer.addPass(output);
    const state={camera,controls,model,dirty:true,rotate:null,reset:null,top:null,zoom:null};runtime.current=state;
    const invalidate=()=>{state.dirty=true;};controls.addEventListener('change',invalidate);
    const stopInertia=()=>{controls.enableDamping=false;controls.update();controls.enableDamping=true;};
    const move=(angle)=>{stopInertia();const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();state.dirty=true;};
    state.rotate=move;
    state.reset=()=>{stopInertia();controls.target.copy(target);camera.position.copy(start);camera.zoom=1;camera.updateProjectionMatrix();controls.update();state.dirty=true;};
    state.top=()=>{stopInertia();camera.position.copy(controls.target).add(new THREE.Vector3(.1,410,25));camera.zoom=1;camera.updateProjectionMatrix();controls.update();state.dirty=true;};
    state.zoom=factor=>{camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.85,2.8);camera.updateProjectionMatrix();state.dirty=true;};
    function resize(){const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;const a=w/h,r=Math.max(116,163/a);Object.assign(camera,{left:-r*a,right:r*a,top:r,bottom:-r});camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);state.dirty=true;}
    const observer=new ResizeObserver(resize);observer.observe(element);resize();controls.update();
    const project=(point,height=1)=>{const p=new THREE.Vector3(...mapToWorld(point,height)).project(camera);return {x:(p.x+1)*element.clientWidth/2,y:(1-p.y)*element.clientHeight/2,z:p.z};};
    function labels(){
      const width=element.clientWidth,height=element.clientHeight,placed=[];
      // Screen labels remain upright while their leader endpoints stay attached
      // to world coordinates. Never move geographic points to avoid a collision.
      HANBIT_STOPS.forEach((stop,i)=>{
        const node=pinRefs.current[i],leader=lineRefs.current[i];if(!node||!leader)return;
        const p=project(stop.point,1.5),w=node.offsetWidth,h=node.offsetHeight;
        let x=THREE.MathUtils.clamp(p.x, w/2+8,width-w/2-8),y=THREE.MathUtils.clamp(p.y-35,h/2+8,height-h/2-12);
        for(let n=0;n<18;n++){
          if(!placed.some(q=>Math.abs(q.x-x)<(q.w+w)/2+5&&Math.abs(q.y-y)<(q.h+h)/2+7))break;
          const ring=Math.floor(n/4)+1,side=n%4;
          x=THREE.MathUtils.clamp(p.x+(side===0?-1:side===1?1:0)*(w+9)*ring,w/2+8,width-w/2-8);
          y=THREE.MathUtils.clamp(p.y-35+(side===2?-1:side===3?1:0)*(h+10)*ring,h/2+8,height-h/2-12);
        }
        node.style.left=`${x}px`;node.style.top=`${y}px`;node.style.visibility='visible';
        leader.setAttribute('x1',String(THREE.MathUtils.clamp(p.x,2,width-2)));leader.setAttribute('y1',String(THREE.MathUtils.clamp(p.y,2,height-2)));leader.setAttribute('x2',String(x));leader.setAttribute('y2',String(y));
        placed.push({x,y,w,h});
      });
      LANDMARKS.forEach((l,i)=>{const node=nameRefs.current[i];if(!node)return;const p=project(l.point,l.height);node.style.left=`${THREE.MathUtils.clamp(p.x,55,width-55)}px`;node.style.top=`${THREE.MathUtils.clamp(p.y,16,height-20)}px`;});
      const cp=cameraPin.current,photoNow=latest.current.photo;
      if(cp&&photoNow?.camera&&Number.isFinite(photoNow.viewHeading??photoNow.heading)){
        const p=project(geoToMap(photoNow.camera),2);cp.style.left=`${THREE.MathUtils.clamp(p.x,28,width-28)}px`;cp.style.top=`${THREE.MathUtils.clamp(p.y,25,height-25)}px`;
      }
      const a=project([615,372.5]),b=project([615,272.5]);if(northRef.current)northRef.current.style.transform=`rotate(${Math.atan2(b.x-a.x,-(b.y-a.y))*180/Math.PI}deg)`;
      const degrees=Math.round(((controls.getAzimuthalAngle()*180/Math.PI)%360+360)%360);element.dataset.azimuth=String(degrees);element.dataset.zoom=camera.zoom.toFixed(2);element.dataset.elevation=String(Math.round(90-controls.getPolarAngle()*180/Math.PI));
      if(angleRef.current)angleRef.current.textContent=`${degrees}°`;
    }
    function key(event){if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move((event.key==='ArrowLeft'?-1:1)*Math.PI/12);}if(event.key==='Home'){event.preventDefault();state.reset();}}
    renderer.domElement.addEventListener('keydown',key);
    const lost=e=>{e.preventDefault();setError('3D 연결이 끊겼어요. 새로고침하면 다시 열 수 있어요. 사진 선택은 계속 사용할 수 있어요.');};renderer.domElement.addEventListener('webglcontextlost',lost);
    renderer.setAnimationLoop(()=>{if(document.hidden)return;controls.update();if(!state.dirty)return;labels();ao.enabled=!fadingMode();composer.render();state.dirty=false;});
    function fadingMode(){return model.root.children.some(o=>o.material?.transparent&&o.material?.opacity===.22);}
    queueMicrotask(()=>setReady(true));
    return()=>{renderer.setAnimationLoop(null);observer.disconnect();controls.removeEventListener('change',invalidate);controls.dispose();model.dispose();ao.dispose();output.dispose();renderPass.dispose();composer.dispose();environmentTarget.dispose();sun.shadow.dispose();renderer.domElement.removeEventListener('keydown',key);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.domElement.remove();runtime.current=null;};
  },[]);
  const stop=HANBIT_STOPS[selected],cameraKnown=Boolean(photo?.camera&&Number.isFinite(photo?.viewHeading??photo?.heading));
  const reference=HANBIT_REFERENCE_IMAGES[selected];
  return <section className={`hj3d ${large?'hj3d-large':''}`} aria-label="한빛탑 정류장부터 입구까지 3D 미니어처">
    <div className="hj3d-heading"><div><span>한 곳을 끝까지 살펴보기</span><strong>정류장부터 탑 입구 사진까지</strong></div><span className="hj3d-badge">360° 회전</span></div>
    <div className="hj3d-instructions">모형을 <b>좌우로 드래그</b>해 돌려보세요. 번호를 누르면 그 구간의 사진이 나와요.</div>
    <div className="hj3d-toolbar" role="group" aria-label="전체 미니어처 회전과 확대">
      <button onClick={()=>runtime.current?.rotate(-Math.PI/4)} aria-label="전체 모형 왼쪽으로 45도 회전"><ArrowCounterClockwise size={18}/>왼쪽</button>
      <button onClick={()=>runtime.current?.rotate(Math.PI/4)} aria-label="전체 모형 오른쪽으로 45도 회전"><ArrowClockwise size={18}/>오른쪽</button>
      <button onClick={()=>runtime.current?.reset()}><ArrowsOut size={17}/>전체 보기</button>
      <button onClick={()=>runtime.current?.top()}>위에서 보기</button>
      <button onClick={()=>runtime.current?.zoom(1.2)} aria-label="3D 모형 확대">＋</button><button onClick={()=>runtime.current?.zoom(1/1.2)} aria-label="3D 모형 축소">−</button>
      <button className="hj3d-reveal" aria-pressed={reveal} onClick={()=>setReveal(v=>!v)}><Eye size={17}/>건물 너머 길 보기</button>
    </div>
    <div className="hj3d-stage" ref={host} aria-busy={!ready&&!error}>
      <svg className="hj3d-leaders" aria-hidden="true">{HANBIT_STOPS.map((_,i)=><line key={i} ref={node=>{lineRefs.current[i]=node;}} className={selected===i?'is-active':''}/>)}</svg>
      {LANDMARKS.map((l,i)=><span key={l.name} className="hj3d-landmark" ref={node=>{nameRefs.current[i]=node;}}>{l.name}</span>)}
      {HANBIT_STOPS.map((s,i)=><button key={i} ref={node=>{pinRefs.current[i]=node;}} className={`hj3d-pin ${s.surface==='photo-area'?'hj3d-area':''}`} aria-label={`3D 구간 ${number(i)} ${s.short}`} aria-pressed={selected===i} onClick={()=>onSelect(i)}><b>{number(i)}</b><span>{s.short}</span></button>)}
      <span className="hj3d-camera-pin" ref={cameraPin} hidden={!cameraKnown}><Camera size={15}/>촬영 위치</span>
      <div className="hj3d-compass" aria-label="회전하는 모형의 북쪽"><span ref={northRef}>↑</span>북</div>
      <div className="hj3d-angle">회전 <output ref={angleRef} aria-label="3D 회전 각도">0°</output></div>
      {!ready&&!error&&<p className="hj3d-loading" role="status">정류장부터 입구까지 3D를 준비하고 있어요…</p>}
      {error&&<p className="hj3d-error" role="alert">{error}</p>}
    </div>
    <div className="hj3d-legend"><span><i className="hj3d-road"/>차도</span><span><i className="hj3d-walk"/>보도·횡단 구역</span><span><i className="hj3d-trail"/>지도 속 보행선</span><span><i className="hj3d-gap"/>연결 확인 필요</span></div>
    <div className="hj3d-numbers" role="group" aria-label="3D 전체 구간 번호">{route.steps.map((s,i)=><button key={s.id} aria-pressed={selected===i} aria-label={`전체 구간 ${number(i)} ${s.title}`} onClick={()=>onSelect(i)}>{number(i)}</button>)}</div>
    <div className="hj3d-selected" aria-live="polite"><div><b>{selected>=0?number(selected):'—'}</b><div><small>지금 살펴보는 구간</small><strong>{stop?.short||'번호를 선택해요'}</strong></div></div><p>{stop?.note}</p>
      {reference&&photo?.image!==reference&&<button onClick={()=>onPhotoSelect?.(reference)}><Camera size={16}/>이 구간 거리뷰와 촬영 방향 보기</button>}
      <p className="hj3d-camera-note">{cameraKnown?<><Camera size={14}/>파란 표시는 촬영 위치·방향이에요. 휠체어의 이동 위치가 아니에요.</>:<>현재 사진의 정확한 촬영 위치·방향은 표시하지 않아요.</>}</p>
    </div>
    <details className="hj3d-sources"><summary><MapPin size={15}/>위치를 어떻게 맞췄나요?</summary><p>도로·건물 배치와 보행선은 공개 지도 좌표를 사용하고 카카오·네이버의 실제 사진과 비교했어요. 번호는 사진을 고르는 구역이며 실측 지점이 아니에요. 건물 높이·길의 폭·나무와 조경은 모형 표현입니다. 06·07은 같은 입구 사진 구역이고, 문 좌표와 경사로 방위는 확인 전이에요.</p><p>점선을 모두 이어 휠체어로 통행할 수 있다는 뜻은 아니에요. 연결 자료가 부족한 부분은 황토색으로 표시했어요.</p><a href={HANBIT_3D_SOURCES.kakao} target="_blank" rel="noreferrer">카카오 · 진입로 로드뷰 ↗</a><a href={HANBIT_3D_SOURCES.naver} target="_blank" rel="noreferrer">네이버 · 통일관 앞 거리뷰 ↗</a><a href={HANBIT_3D_SOURCES.area} target="_blank" rel="noreferrer">한국관광공사 · 정류장·입구 사진 ↗</a><small>도로·건물 © OpenStreetMap · 좌표 자료 2026.09.24 / 거리뷰 메타데이터 대조 2026.09.25</small></details>
  </section>;
}
