import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, MapPin, Trash } from '@phosphor-icons/react';
maplibregl.setWorkerUrl(workerUrl);

export default function CityCoordinateMap({ entries, selectedId, onSelect, photo }) {
  const host = useRef(null), runtime = useRef(null), markers = useRef([]);
  const onSelectRef = useRef(onSelect);
  const [status, setStatus] = useState('지도를 불러오는 중…');
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [manual, setManual] = useState(false);
  const [ready, setReady] = useState(false);
  const [tilted, setTilted] = useState(false);
  const manualRef = useRef(false), userMarker = useRef(null);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let map;
    try { map = new maplibregl.Map({ container: host.current, style: 'https://tiles.openfreemap.org/styles/bright', center: [127.3869223, 36.3509395], zoom: 16, attributionControl: true }); }
    catch { queueMicrotask(() => setStatus('이 기기에서 실제 지도를 시작하지 못했습니다. 3D 모형의 사진 목록을 이용해 주세요.')); return; }
    runtime.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');
    const deadline = setTimeout(() => setStatus('지도 로딩이 지연되고 있습니다. 인터넷 연결을 확인하고 다시 열어 주세요.'), 20000);
    map.on('load', () => {
      clearTimeout(deadline);
      const building = map.getStyle().layers.find(layer => layer['source-layer'] === 'building');
      if (building) map.addLayer({ id: 'cx-buildings', type: 'fill-extrusion', source: building.source, 'source-layer': 'building', minzoom: 14,
        paint: { 'fill-extrusion-color': '#e0e5e5', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 5], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .86 }, layout: { visibility: 'none' } });
      setReady(true); setStatus('실제 대전 지도 · 시설 후보 좌표이며 입구 확정 아님'); host.current.dataset.loaded = 'true';
    });
    map.on('moveend', () => { if (host.current) { const center = map.getCenter(); host.current.dataset.center = `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`; host.current.dataset.pitch = map.getPitch().toFixed(1); } });
    map.on('error', () => setStatus('일부 지도 자료를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));
    map.on('click', event => {
      if (!manualRef.current) return;
      setPosition({ lng: event.lngLat.lng, lat: event.lngLat.lat, source: 'manual' }); setManual(false); manualRef.current = false;
      setStatus('직접 지정한 위치입니다. 실제 GPS 위치가 아닙니다.');
    });
    const observer = new ResizeObserver(() => map.resize()); observer.observe(host.current);
    return () => { clearTimeout(deadline); observer.disconnect(); map.remove(); runtime.current = null; userMarker.current = null; };
  }, []);
  useEffect(() => {
    if (!ready || !runtime.current) return;
    markers.current.forEach(marker => marker.remove());
    markers.current = entries.map(entry => {
      const element = document.createElement('button'); element.className = 'cx-map-pin'; element.textContent = entry.name;
      element.setAttribute('aria-label', `${entry.name} 지도에서 선택`); element.setAttribute('aria-pressed', String(entry.id === selectedId));
      element.addEventListener('click', event => { event.stopPropagation(); onSelectRef.current(entry.id); });
      return new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat([entry.lng, entry.lat]).addTo(runtime.current);
    });
    return () => markers.current.forEach(marker => marker.remove());
  }, [entries, selectedId, ready]);
  useEffect(() => {
    if (!ready || !runtime.current) return;
    const entry = entries.find(item => item.id === selectedId) ?? entries[0];
    if (entry) runtime.current.easeTo({ center: [entry.lng, entry.lat], zoom: 16, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650 });
  }, [selectedId, entries, ready]);
  useEffect(() => {
    if (!ready || !runtime.current) return;
    const map = runtime.current;
    if (map.getLayer('cx-buildings')) map.setLayoutProperty('cx-buildings', 'visibility', tilted ? 'visible' : 'none');
    map.easeTo({ pitch: tilted ? 55 : 0, bearing: tilted ? -25 : 0, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 });
  }, [tilted, ready]);
  useEffect(() => {
    if (!ready || !runtime.current) return;
    if (userMarker.current) { userMarker.current.remove(); userMarker.current = null; }
    if (position) {
      const element = document.createElement('div'); element.className = 'cx-user-location'; element.textContent = position.source === 'manual' ? '직접 지정 위치' : '내 위치';
      userMarker.current = new maplibregl.Marker({ element }).setLngLat([position.lng, position.lat]).addTo(runtime.current);
      runtime.current.easeTo({ center: [position.lng, position.lat], zoom: 14, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650 });
    }
  }, [position, ready]);
  useEffect(() => {
    if (!ready || !runtime.current || !Number.isFinite(photo?.panoLat) || !Number.isFinite(photo?.panoLng)) return;
    const element = document.createElement('div'); element.className = 'cx-photo-location'; element.textContent = `촬영 지점 · ${photo.key}`;
    const marker = new maplibregl.Marker({ element, anchor: 'top' }).setLngLat([photo.panoLng, photo.panoLat]).addTo(runtime.current);
    return () => marker.remove();
  }, [photo, ready]);
  const locate = () => {
    if (!navigator.geolocation) { setStatus('위치 확인을 지원하지 않는 브라우저입니다. 직접 지정해 주세요.'); return; }
    setLocating(true); setStatus('브라우저에서 위치 사용을 허용하면 이 화면에만 표시합니다.');
    navigator.geolocation.getCurrentPosition(result => {
      if (!runtime.current) return;
      setPosition({ lng: result.coords.longitude, lat: result.coords.latitude, accuracy: result.coords.accuracy, source: 'device' });
      setLocating(false); setStatus(`내 위치 · 기기 추정 오차 약 ${Math.round(result.coords.accuracy)}m · 서버 저장 안 함`);
    }, error => { if (!runtime.current) return; setLocating(false); setStatus(error.code === 1 ? '위치 권한이 허용되지 않았습니다. 직접 지정도 가능합니다.' : '현재 위치를 확인하지 못했습니다. 직접 지정해 주세요.'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };
  return <>
    <div className="cx-coordinate-map" ref={host} aria-label="실제 좌표 지도" />
    <div className="cx-map-actions">
      <button aria-pressed={tilted} disabled={!ready} onClick={() => { setTilted(value => !value); setStatus(!tilted ? '지도 건물 윤곽 기반 3D · 높이 일부 추정 · 실사나 정밀 모형 아님' : '실제 대전 평면 지도 · 시설 후보 좌표'); }}>{tilted ? '평면으로 보기' : '지도 건물 3D 보기'}</button>
      <button disabled={!ready || locating} onClick={locate}><Crosshair size={18} />{locating ? '위치 확인 중…' : '내 위치 표시'}</button>
      <button aria-pressed={manual} disabled={!ready} onClick={() => { manualRef.current = !manual; setManual(!manual); setStatus(!manual ? '지도에서 위치를 클릭해 주세요. 이 화면에만 표시됩니다.' : '직접 지정을 취소했습니다.'); }}><MapPin size={18} />위치 직접 지정</button>
      {position && <button onClick={() => { setPosition(null); setStatus('위치 표시를 지웠습니다. 서버에 저장된 위치는 없습니다.'); }}><Trash size={18} />위치 지우기</button>}
    </div>
    <div className="cx-map-status" role="status">{status}</div>
  </>;
}
