import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ArrowClockwise, ArrowCounterClockwise, ArrowsOut, Minus, Plus, Play, Pause, Wheelchair, MapPin, House, Camera } from '@phosphor-icons/react';
import { buildMiniatureCity, MINIATURE_POINTS, DEMO_ROUTE } from '../utils/miniatureCity';

export default function MiniatureScene({ entries, selectedId, onSelect }) {
  const container = useRef(null);
  const runtime = useRef(null);
  const [error, setError] = useState('');
  const [autoRotate, setAutoRotate] = useState(false);
  const [moving, setMoving] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = container.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { queueMicrotask(() => setError('이 기기에서 3D를 시작하지 못했습니다. 정지 그림과 실제 지도는 이용할 수 있습니다.')); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor('#e7eee9'); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.32;
    renderer.domElement.setAttribute('aria-label', '대전 미니어처 3D 모형. 드래그로 회전, 휠로 확대, 오른쪽 드래그로 이동');
    renderer.domElement.setAttribute('tabindex', '0');
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-130, 130, 130, -130, .1, 1200);
    const startPosition = new THREE.Vector3(172, 198, 217);
    camera.position.copy(startPosition);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0); controls.enableDamping = true; controls.dampingFactor = .09;
    controls.minZoom = .55; controls.maxZoom = 4; controls.minPolarAngle = .12; controls.maxPolarAngle = Math.PI / 2.25;
    controls.autoRotateSpeed = .45;
    scene.add(new THREE.HemisphereLight('#ffffff', '#8b9680', 2.25));
    const sun = new THREE.DirectionalLight('#fff7e8', 3.4); sun.position.set(-80, 180, 110); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -230, right: 230, top: 230, bottom: -230, near: .5, far: 500 });
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.normalBias = .35; scene.add(sun);
    const city = buildMiniatureCity(scene);
    const path = new THREE.CurvePath();
    for (let i = 1; i < DEMO_ROUTE.length; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...DEMO_ROUTE[i - 1]), new THREE.Vector3(...DEMO_ROUTE[i])));
    const state = { camera, controls, progress: 0, moving: false, frames: 0, city, reset: () => { camera.position.copy(startPosition); camera.zoom = 1; controls.target.set(0, 0, 0); camera.updateProjectionMatrix(); controls.update(); } };
    runtime.current = state;
    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      const range = width < 600 ? 162 : 123;
      camera.left = -range * width / height; camera.right = range * width / height; camera.top = range; camera.bottom = -range;
      camera.updateProjectionMatrix(); renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
    let previous = 0;
    const projected = new THREE.Vector3();
    const anchor = (element, point) => {
      projected.copy(point).project(camera);
      element.style.transform = `translate(-50%, -100%) translate(${(projected.x + 1) * host.clientWidth / 2}px, ${(1 - projected.y) * host.clientHeight / 2}px)`;
      element.style.visibility = Math.abs(projected.x) > 1.2 || Math.abs(projected.y) > 1.2 || projected.z > 1 ? 'hidden' : 'visible';
    };
    const onContextLost = event => { event.preventDefault(); setError('3D 연결이 끊겼습니다. 페이지를 새로고침하거나 실제 지도를 이용해 주세요.'); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.setAnimationLoop(time => {
      const delta = Math.min((time - previous) / 1000 || 0, .05); previous = time;
      if (document.hidden) return;
      controls.update(delta);
      if (state.moving) state.progress = (state.progress + delta / 18) % 1;
      host.querySelectorAll('[data-point]').forEach(element => anchor(element, new THREE.Vector3(...MINIATURE_POINTS[Number(element.dataset.point)])));
      host.querySelectorAll('[data-landmark]').forEach(element => anchor(element, element.dataset.landmark === 'tower' ? new THREE.Vector3(30, 52, -61) : new THREE.Vector3(-49, 20, -35)));
      const avatar = host.querySelector('[data-avatar]');
      if (avatar) anchor(avatar, path.getPoint(state.progress));
      renderer.render(scene, camera); state.frames++;
      if (state.frames % 20 === 0) {
        host.dataset.frames = String(state.frames); host.dataset.camera = camera.position.toArray().map(n => n.toFixed(2)).join(',');
        host.dataset.zoom = camera.zoom.toFixed(2); host.dataset.progress = state.progress.toFixed(3);
      }
    });
    host.dataset.buildings = String(city.buildingCount);
    queueMicrotask(() => setReady(true));
    return () => { renderer.setAnimationLoop(null); resizeObserver.disconnect(); controls.dispose(); city.dispose(); renderer.domElement.removeEventListener('webglcontextlost', onContextLost); renderer.dispose(); renderer.domElement.remove(); runtime.current = null; };
  }, []);
  useEffect(() => { if (runtime.current) runtime.current.controls.autoRotate = autoRotate; }, [autoRotate, ready]);
  useEffect(() => { if (runtime.current) runtime.current.moving = moving; }, [moving, ready]);
  const changeCamera = action => {
    const state = runtime.current; if (!state) return;
    if (action === 'home') { state.reset(); setAutoRotate(false); return; }
    if (action === 'left' || action === 'right') {
      state.camera.position.sub(state.controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), action === 'left' ? -.3 : .3).add(state.controls.target);
    } else { state.camera.zoom = THREE.MathUtils.clamp(state.camera.zoom * (action === 'in' ? 1.2 : 1 / 1.2), .55, 4); state.camera.updateProjectionMatrix(); }
    state.controls.update();
  };
  return <>
    <div className="cx-scene" ref={container} data-engine="three" data-ready={ready && !error}>
      {error ? <div className="cx-static-fallback"><img src="/modu50m/city-explorer/daejeon-miniature-reference-v1.png" alt="대전 미니어처 정지 참고 이미지" /><p role="alert">{error}</p></div> : <div className="cx-anchors">
        <span className="cx-landmark" data-landmark="tower">한빛탑 <small>미니어처</small></span>
        <span className="cx-landmark" data-landmark="bridge">엑스포다리</span>
        {entries.map((entry, index) => <button key={entry.id} data-point={index} className={`cx-pin ${entry.id === selectedId ? 'is-selected' : ''}`} onClick={() => onSelect(entry.id)} aria-label={`${entry.name} 로드뷰 사진 열기`} aria-pressed={entry.id === selectedId}>
          <span>{index === 1 ? <Camera size={19} weight="fill" /> : <MapPin size={19} weight="fill" />}{entry.name}</span><i /></button>)}
        <div className="cx-avatar" data-avatar><span><Wheelchair size={31} weight="bold" /></span><strong>이동 시연 · 가상 위치</strong></div>
      </div>}
    </div>
    <div className="cx-scene-tools" aria-label="3D 모형 조작">
      <button title="처음 시점" aria-label="처음 시점" disabled={!ready || !!error} onClick={() => changeCamera('home')}><House size={21} /></button>
      <button title="확대" aria-label="모형 확대" disabled={!ready || !!error} onClick={() => changeCamera('in')}><Plus size={21} /></button>
      <button title="축소" aria-label="모형 축소" disabled={!ready || !!error} onClick={() => changeCamera('out')}><Minus size={21} /></button>
      <button title="왼쪽으로 회전" aria-label="왼쪽으로 회전" disabled={!ready || !!error} onClick={() => changeCamera('left')}><ArrowCounterClockwise size={21} /></button>
      <button title="오른쪽으로 회전" aria-label="오른쪽으로 회전" disabled={!ready || !!error} onClick={() => changeCamera('right')}><ArrowClockwise size={21} /></button>
    </div>
    <div className="cx-motion-controls">
      <button aria-pressed={autoRotate} disabled={!ready || !!error} onClick={() => setAutoRotate(value => !value)}><ArrowsOut size={18} />{autoRotate ? '회전 멈추기' : '도시 자동 회전'}</button>
      <button aria-pressed={moving} disabled={!ready || !!error} onClick={() => setMoving(value => !value)}>{moving ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}{moving ? '이동 멈추기' : '휠체어 이동 시연'}</button>
    </div>
    <div className="cx-model-note">대전에서 영감을 받은 3D 모형 · 핀·경로는 개념 배치이며 길 안내가 아닙니다.</div>
  </>;
}
