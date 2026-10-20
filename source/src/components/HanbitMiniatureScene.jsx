import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildHanbitMiniature, createViewDirection, disposeHanbitObject, hanbitWorld } from '../utils/hanbitMiniature.js';

export default function HanbitMiniatureScene({ selection, locations, onProjection, onUnavailable }) {
  const hostRef = useRef(null);
  const runtime = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { onUnavailable(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true'); host.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-400, 400, 345, -345, 1, 2500);
    camera.position.set(160, 820, 580); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    scene.add(new THREE.HemisphereLight('#fffdf5', '#a4b5a0', 1.65));
    const sun = new THREE.DirectionalLight('#fff4de', 2.4); sun.position.set(-280, 600, -250); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -540, right: 540, top: 540, bottom: -540, near: 1, far: 1500 });
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.normalBias = .8; sun.shadow.bias = -.0002; scene.add(sun);
    const model = buildHanbitMiniature(scene);
    const state = { renderer, camera, scene, direction: null, locations: [], model, render: () => renderer.render(scene, camera) };
    runtime.current = state;
    const projection = point => {
      const p = point.clone().project(camera);
      return [(p.x + 1) * 360, (1 - p.y) * 310];
    };
    state.project = () => onProjection({
      points: Object.fromEntries(state.locations.map(location => [location.id, projection(hanbitWorld(location.point, 2))])),
      labels: model.labels.map(label => ({ name: label.name, point: projection(label.point) })),
      north: [projection(new THREE.Vector3(0, 0, -65))[0] - projection(new THREE.Vector3())[0], projection(new THREE.Vector3(0, 0, -65))[1] - projection(new THREE.Vector3())[1]],
    });
    const resize = () => { if (!host.clientWidth || !host.clientHeight) return; renderer.setSize(host.clientWidth, host.clientHeight); state.render(); state.project(); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const contextLost = event => { event.preventDefault(); onUnavailable(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    host.dataset.ready = 'true'; host.dataset.buildings = String(model.buildingCount); host.dataset.trees = String(model.treeCount);
    return () => {
      observer.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      runtime.current = null; disposeHanbitObject(scene); model.texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [onProjection, onUnavailable]);

  useEffect(() => {
    const state = runtime.current; if (!state) return;
    if (state.direction) { state.scene.remove(state.direction); disposeHanbitObject(state.direction); }
    state.direction = createViewDirection(selection); state.scene.add(state.direction);
    state.locations = locations; state.project(); state.render();
  }, [selection, locations]);
  return <div className="hm-three-host" ref={hostRef} data-engine="three" role="img" aria-label="실제 촬영 좌표를 유지한 한빛탑 주변 3D 미니어처" />;
}
