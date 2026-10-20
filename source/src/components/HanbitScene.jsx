import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Plus, Minus, ArrowCounterClockwise, ArrowClockwise, CornersOut, Play, Pause, ArrowUUpLeft, Camera, WheelchairMotion, Info, MapPin, X, ArrowUpRight } from '@phosphor-icons/react';
import { buildHanbitModel } from '../utils/hanbitModel.js';
import { HANBIT_SITE } from '../data/daejeonPrecincts.js';
import { buildCulturalModel } from '../utils/culturalModel.js';
import { getPrecinctAnnotations } from '../data/precinctAnnotations.js';
import { UnlocatedFacilities } from './PrecinctMarkerInfo.jsx';
import './PrecinctMarkers.css';

export default function HanbitScene({ selectedId, onSelect, site = HANBIT_SITE, mode = 'photos', onModeChange, stageRef }) {
  const { checkpoints: CHECKPOINTS, photos: ROADVIEW } = site;
  const annotations = getPrecinctAnnotations(site.id);
  const [showAttention, setShowAttention] = useState(true), [showHubs, setShowHubs] = useState(true);
  const hubDialog = useRef(null), unlocatedDialog = useRef(null);
  const hostRef = useRef(null), runtime = useRef(null);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  const [playing, setPlaying] = useState(false), [progress, setProgress] = useState(0);
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { queueMicrotask(() => setError('이 기기에서는 3D를 열 수 없어요. 왼쪽 확인 지점과 사진·기록은 계속 사용할 수 있습니다.')); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.03;
    renderer.domElement.setAttribute('aria-label', site.name + ' 3D 축약 모형. 카메라 핀은 실제 촬영좌표. 회전·확대 버튼을 사용할 수 있습니다.');
    renderer.domElement.setAttribute('role', 'img'); host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-150, 150, 105, -105, .1, 1200);
    const initialPosition = new THREE.Vector3(240, 220, 145);
    camera.position.copy(initialPosition);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3, 0); controls.enableDamping = true; controls.dampingFactor = .09;
    controls.minZoom = .75; controls.maxZoom = 3.2; controls.minPolarAngle = .3; controls.maxPolarAngle = 1.22;
    controls.enablePan = false;
    scene.add(new THREE.HemisphereLight('#ffffff', '#a0ac96', 1.8));
    const sun = new THREE.DirectionalLight('#fff6e6', 2.2); sun.position.set(-75, 160, 90); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: .5, far: 420 });
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.normalBias = .18; sun.shadow.bias = -.0002; sun.shadow.radius = 3; scene.add(sun);
    const model = site.id === 'hanbit' ? buildHanbitModel(scene) : buildCulturalModel(scene, site);
    // The amber guide belongs only to the explicitly illustrative mode.
    const guideGeometry = new THREE.TubeGeometry(model.demoRoute, 48, .65, 6, false);
    const guideMaterial = new THREE.MeshBasicMaterial({ color: '#c18b35' });
    const demoGuide = new THREE.Mesh(guideGeometry, guideMaterial);
    demoGuide.position.y = .25; demoGuide.visible = false; model.root.add(demoGuide);
    model.chair.scale.multiplyScalar(1.8);
    model.viewArrow.setColor('#087f79');
    model.demoGuide = demoGuide;
    const state = { camera, controls, model, showAttention: true, showHubs: true, mode: 'photos', progress: 0, playing: false, nextStop: 0, focusTarget: null, frames: 0, needsRender: true, renderedProgress: -1 };
    runtime.current = state;
    const invalidate = () => { state.needsRender = true; };
    controls.addEventListener('change', invalidate);
    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      const aspect = width / height, range = Math.max(110, (site.id === 'hanbit' ? 160 : width < 500 ? 205 : 183) / aspect);
      camera.left = -range * aspect; camera.right = range * aspect; camera.top = range; camera.bottom = -range;
      camera.updateProjectionMatrix(); renderer.setSize(width, height); state.needsRender = true;
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const projected = new THREE.Vector3();
    const anchors = [...host.querySelectorAll('[data-anchor]')].map(element => ({ element, point: new THREE.Vector3(...JSON.parse(element.dataset.anchor)) }));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previous = 0, lastUI = 0;
    function contextLost(event) { event.preventDefault(); state.playing = false; setPlaying(false); setError('3D 연결이 끊겼어요. 기록을 저장한 뒤 새로고침해 주세요.'); }
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.setAnimationLoop(time => {
      // Preserve useful playback speed on low-frame-rate devices without jumping
      // across checkpoints when a background tab becomes visible again.
      const delta = Math.min((time - previous) / 1000 || 0, 1); previous = time;
      if (document.hidden) return;
      if (state.focusTarget) {
        const speed = reducedMotion.matches ? 1 : Math.min(1, delta * 5);
        controls.target.lerp(state.focusTarget.target, speed);
        camera.zoom += (state.focusTarget.zoom - camera.zoom) * speed;
        camera.updateProjectionMatrix();
        if (Math.abs(camera.zoom - state.focusTarget.zoom) < .002 && controls.target.distanceTo(state.focusTarget.target) < .03) state.focusTarget = null;
      }
      controls.update();
      if (state.playing) {
        state.progress = Math.min(state.nextStop, state.progress + delta / 17);
        if (state.progress >= state.nextStop) {
          state.playing = false; setPlaying(false);
          const point = CHECKPOINTS.find(p => Math.abs(p.progress - state.nextStop) < .001);
          if (point && state.mode === 'photos') onSelect(point.id);
        }
      }
      if (!state.needsRender && !state.playing && state.renderedProgress === state.progress && !state.focusTarget) return;
      model.cursor.visible = state.mode === 'photos' && (!model.hideTransit || !state.playing);
      model.cursor.position.copy(model.route.getPoint(state.progress)).y = 2;
      model.chair.visible = state.mode === 'demo';
      demoGuide.visible = state.mode === 'demo';
      const position = model.demoRoute.getPoint(state.mode === 'demo' ? state.progress : 0);
      model.chair.position.copy(position);
      const tangent = model.demoRoute.getTangent(state.mode === 'demo' ? Math.min(.9999, state.progress) : 0);
      model.chair.rotation.y = Math.atan2(-tangent.x, -tangent.z);
      const placedPins = [];
      for (const { element, point } of anchors) {
        if ((element.classList.contains('hb-attention-pin') && !state.showAttention) || (element.classList.contains('hb-hub-pin') && !state.showHubs)) continue;
        projected.copy(point).project(camera);
        const x = (projected.x + 1) * host.clientWidth / 2, anchorY = (1 - projected.y) * host.clientHeight / 2;
        let y = element.classList.contains('hb-map-pin') ? anchorY - 10 : anchorY;
        if (element.classList.contains('hb-hub-pin')) y -= 30;
        if (element.classList.contains('hb-map-pin')) {
          // Lift overlapping labels, not the source camera coordinates.
          const gap = element.offsetHeight + 7;
          for (let attempt = 0; attempt < 3; attempt++) {
            const collision = placedPins.find(pin => Math.abs(pin.x - x) < element.offsetWidth + 7 && Math.abs(pin.y - y) < gap);
            if (!collision) break;
            y = collision.y - gap;
          }
          placedPins.push({ x, y });
          element.style.setProperty('--hb-pin-leader', `${anchorY - y}px`);
        }
        element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
        element.style.visibility = Math.abs(projected.x) > .99 || Math.abs(projected.y) > .97 ? 'hidden' : 'visible';
      }
      model.viewArrow.visible = state.showAttention && state.mode === 'photos';
      renderer.render(scene, camera); state.frames++; state.needsRender = false; state.renderedProgress = state.progress;
      if (time - lastUI > 150 || !state.playing) {
        lastUI = time; setProgress(state.progress);
        host.dataset.progress = state.progress.toFixed(3); host.dataset.zoom = camera.zoom.toFixed(2); host.dataset.frames = String(state.frames);
      }
    });
    queueMicrotask(() => setReady(true));
    return () => { renderer.setAnimationLoop(null); observer.disconnect(); controls.removeEventListener('change', invalidate); controls.dispose(); guideGeometry.dispose(); guideMaterial.dispose(); model.dispose(); renderer.domElement.removeEventListener('webglcontextlost', contextLost); renderer.dispose(); renderer.domElement.remove(); runtime.current = null; };
  }, [onSelect, site, CHECKPOINTS]);

  useEffect(() => {
    if (!runtime.current) return;
    Object.assign(runtime.current, { showAttention, showHubs, needsRender: true });
  }, [showAttention, showHubs]);

  useEffect(() => {
    const state = runtime.current;
    if (!state || !ready) return;
    const point = CHECKPOINTS.find(p => p.id === selectedId);
    const angle = ROADVIEW[selectedId].heading * Math.PI / 180;
    state.model.viewArrow.position.set(point.point[0], 1, point.point[2]);
    state.model.viewArrow.setDirection(new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle)));
    if (state.mode === 'photos') {
      state.progress = point.progress; state.playing = false;
    }
    state.needsRender = true;
  }, [selectedId, ready, CHECKPOINTS, ROADVIEW]);
  useEffect(() => {
    const state = runtime.current;
    if (!state || !ready) return;
    state.mode = mode; state.progress = mode === 'photos' ? CHECKPOINTS.find(p => p.id === selectedId).progress : 0; state.playing = false; state.needsRender = true;
    const mid = state.model.demoRoute.getPoint(.5);
    state.focusTarget = { target: mode === 'demo' ? new THREE.Vector3(mid.x, 3, mid.z) : new THREE.Vector3(0, 3, 0), zoom: mode === 'demo' ? 1.7 : 1 };
    queueMicrotask(() => { setFocus(false); setPlaying(false); setProgress(state.progress); });
  }, [mode, ready, CHECKPOINTS, selectedId]);
  function changeMode(nextMode) { onModeChange?.(nextMode); }
  function moveCamera(action) {
    const state = runtime.current; if (!state) return;
    if (action === 'home') {
      state.camera.position.set(240, 220, 145); state.focusTarget = { target: new THREE.Vector3(0, 3, 0), zoom: 1 }; setFocus(false);
    } else if (action === 'entrance') {
      const next = !focus; setFocus(next);
      state.focusTarget = { target: next ? new THREE.Vector3(...site.focus) : new THREE.Vector3(0, 3, 0), zoom: next ? 1.8 : 1 };
    } else if (action === 'left' || action === 'right') {
      state.camera.position.sub(state.controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), action === 'left' ? -.3 : .3).add(state.controls.target);
    } else {
      state.focusTarget = null; state.camera.zoom = THREE.MathUtils.clamp(state.camera.zoom * (action === 'in' ? 1.17 : 1 / 1.17), .75, 3.2); state.camera.updateProjectionMatrix();
    }
    state.controls.update();
  }
  function playback() {
    const state = runtime.current; if (!state) return;
    if (state.playing) { state.playing = false; setPlaying(false); return; }
    if (state.progress >= .999) state.progress = 0;
    state.nextStop = state.mode === 'demo' ? 1 : CHECKPOINTS.find(p => p.progress > state.progress + .001)?.progress ?? 1;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.progress = state.nextStop; setProgress(state.progress); if (state.mode === 'photos') onSelect(CHECKPOINTS.find(p => p.progress === state.nextStop).id);
    } else { state.playing = true; setPlaying(true); }
  }
  const disabled = !ready || !!error;
  const selectedPoint = CHECKPOINTS.find(point => point.id === selectedId);
  return <section ref={stageRef} className="hb-stage" data-view-mode={mode} aria-label={site.name + ' 접근부 미니어처'}>
    <div className="hb-stage-heading"><div><span>대전 · {site.district}</span><h1>{site.shortName}<br />출입구까지, 무엇을 확인할까요?</h1><p>{mode === 'photos' ? '번호를 누르면 같은 번호의 로드뷰가 열립니다.' : '이동 조작을 보여주는 예시입니다. 실제 경로가 아닙니다.'}</p></div></div>
    <div className="hb-mode-tabs" aria-label="사진 확인과 이동 예시 구분">
      <button aria-pressed={mode === 'photos'} onClick={() => changeMode('photos')}><Camera size={20} />로드뷰 보기</button>
      <button aria-pressed={mode === 'demo'} onClick={() => changeMode('demo')}><WheelchairMotion size={21} />휠체어 이동 예시</button>
    </div>
    <div className="hb-canvas" ref={hostRef} data-place={site.id} data-mode={mode} data-attention={showAttention} data-hubs={showHubs} data-engine="three" data-ready={ready && !error}>
      {error ? <p className="hb-scene-error" role="alert">{error}</p> : <div className="hb-anchors" style={{ opacity: ready ? 1 : 0 }}>
        <button className="hb-hub-pin" data-anchor={JSON.stringify(annotations.hub.point)} aria-label={site.name + ' 주요 거점 정보'} onClick={()=>hubDialog.current.showModal()}><MapPin size={16} /><span>{site.name}</span></button>
        <span className="hb-demo-endpoint hb-demo-start" data-anchor={JSON.stringify([site.demoRoute[0][0], 24, site.demoRoute[0][2]])}>출발 · 예시</span>
        <span className="hb-demo-endpoint hb-demo-finish" data-anchor={JSON.stringify([site.demoRoute.at(-1)[0], 24, site.demoRoute.at(-1)[2]])}>도착 · 예시</span>
        {CHECKPOINTS.map(point => <button key={point.id} className={`hb-map-pin hb-attention-pin ${selectedId === point.id ? 'is-selected' : ''}`} data-anchor={JSON.stringify([point.point[0], 1, point.point[2]])} aria-label={`로드뷰 ${point.number} ${point.title} 보기`} aria-pressed={selectedId === point.id} onClick={() => { onSelect(point.id); setPlaying(false); }}><span><Camera size={16} />{point.number}</span><strong>{point.short}</strong></button>)}
      </div>}
    </div>
    <dialog className="hb-dialog hb-hub-dialog" ref={hubDialog} aria-labelledby="hb-hub-title"><div className="hb-dialog-heading"><div><span>건물 위치</span><h2 id="hb-hub-title">{annotations.hub.title}</h2></div><form method="dialog"><button aria-label="주요 거점 닫기"><X size={20} /></button></form></div><div className="hb-scope-copy"><p>{annotations.hub.note}</p><p>{site.coverage}</p><a className="hb-text-link" href={annotations.hub.sourceUrl} target="_blank" rel="noreferrer">건물 위치 출처 · OpenStreetMap<ArrowUpRight size={15} /></a><button className="hb-primary" onClick={()=>{onSelect(annotations.hub.photoId);changeMode('photos');hubDialog.current.close();}}>주변 로드뷰 보기<Camera size={18} /></button></div></dialog>
    <dialog className="hb-dialog hb-hub-dialog" ref={unlocatedDialog} aria-labelledby="hb-unlocated-title"><div className="hb-dialog-heading"><h2 id="hb-unlocated-title">현장에서 위치를 확인할 시설</h2><form method="dialog"><button aria-label="위치 미확인 닫기"><X size={20} /></button></form></div><UnlocatedFacilities site={site} /></dialog>
    <div className="hb-scene-toolbar" aria-label="3D 모형 조작">
      <button aria-label="모형 확대" title="확대" disabled={disabled} onClick={() => moveCamera('in')}><Plus size={21} /></button>
      <button aria-label="모형 축소" title="축소" disabled={disabled} onClick={() => moveCamera('out')}><Minus size={21} /></button>
      <button aria-label="처음 시점" title="처음 시점" disabled={disabled} onClick={() => moveCamera('home')}><CornersOut size={21} /></button>
      <button aria-label="왼쪽 회전" title="왼쪽 회전" disabled={disabled} onClick={() => moveCamera('left')}><ArrowCounterClockwise size={21} /></button>
      <button aria-label="오른쪽 회전" title="오른쪽 회전" disabled={disabled} onClick={() => moveCamera('right')}><ArrowClockwise size={21} /></button>
    </div>
    <div className="hb-map-bottom-tools">
      <button aria-pressed={focus} disabled={disabled} onClick={() => moveCamera('entrance')}><CornersOut size={17} />{focus ? '전체 보기' : '촬영지점 확대'}</button>
      <button onClick={()=>unlocatedDialog.current.showModal()}><Info size={17} />미확인 시설</button>
      <details className="hb-map-options"><summary>표시 설정</summary><div><button aria-pressed={showAttention} onClick={()=>setShowAttention(value=>!value)}>카메라 위치</button><button aria-pressed={showHubs} onClick={()=>setShowHubs(value=>!value)}>건물 이름</button></div></details>
    </div>
    {mode === 'photos' ? <div className="hb-photo-dock" aria-label="사진 빠른 선택">
      <p><Camera size={16} />지금 보는 사진 <strong>{selectedPoint.number} · {selectedPoint.short}</strong><span>번호 = 촬영 위치</span></p>
      <div>{CHECKPOINTS.map(point => <button key={point.id} aria-label={`사진 ${point.number} ${point.title} 선택`} aria-pressed={selectedId === point.id} onClick={()=>onSelect(point.id)}><img src={ROADVIEW[point.id].image} alt="" /><span><b>{point.number}</b>{point.short}</span></button>)}</div>
    </div> : <div className="hb-demo-controls">
      <p className="hb-demo-warning"><Info size={18} /><strong>이동 예시 · 실제 경로 아님</strong><span>출발·도착점은 시연용</span></p>
      <div className="hb-playbar">
        <button className="hb-play" aria-label={playing ? '이동 예시 일시정지' : progress >= .999 ? '이동 예시 다시 재생' : '이동 예시 재생'} disabled={disabled} onClick={playback}>{playing ? <Pause size={21} weight="fill" /> : <Play size={21} weight="fill" />}</button>
        <div className="hb-play-copy" aria-live="polite"><strong>{playing ? '휠체어 이동 중' : progress >= .999 ? '예시 도착점에 도착' : '휠체어 이동 예시'}</strong><span>{playing ? '버튼을 누르면 잠시 멈춰요' : '재생 버튼으로 움직임을 확인해요'}</span></div>
        <label className="hb-progress"><input aria-label="이동 예시 진행률" type="range" min="0" max="100" step="1" value={Math.round(progress * 100)} disabled={disabled} onChange={event => { const state = runtime.current; state.progress = Number(event.target.value) / 100; state.playing = false; state.needsRender = true; setPlaying(false); setProgress(state.progress); }} /></label><output>{Math.round(progress * 100)}%</output>
        <button className="hb-reset-play" aria-label="이동 처음부터" disabled={disabled} onClick={() => { runtime.current.progress = 0; runtime.current.playing = false; runtime.current.needsRender = true; setPlaying(false); setProgress(0); }}><ArrowUUpLeft size={21} /></button>
      </div>
    </div>}
  </section>;
}
