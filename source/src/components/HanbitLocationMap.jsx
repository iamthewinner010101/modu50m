import { useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowSquareOut, Camera, CheckCircle, MapPin } from '@phosphor-icons/react';
import { HANBIT_ARRIVAL } from '../data/hanbitArrival.js';
import { getHanbitModelArea, HANBIT_GEOMETRY, HANBIT_MAP, projectHanbit } from '../data/hanbitModelAreas.js';
import { photoDateLabel, photoProviderLabel } from '../data/previewRoadviewSelection.js';
import { PREVIEW_MODELS } from '../data/previewModels.js';
import './HanbitLocationMap.css';

// These are photo-selection controls on an illustration, never camera coordinates.
// The separate south scene is deliberately kept outside this model.
const illustrationSelectors = { approach: [82, 73], threshold: [59, 80] };
const illustrationNotes = {
  approach: '가로수와 정류장 시설 옆으로 지나갈 공간, 차도와 보도의 경계를 살펴봐요.',
  threshold: '보도가 끝나는 턱과 차량이 드나드는 길을 살펴봐요.',
  doorway: '탑에서 남쪽으로 약 258m 떨어진 도로에서 촬영한 별도 사진이에요. 볼라드와 화분 사이 공간을 살펴봐요.',
};

const points = feature => feature.coordinates.map(([lat, lon]) => projectHanbit({ lat, lon }).join(',')).join(' ');
const features = HANBIT_GEOMETRY.features;
const buildings = features.filter(feature => feature.tags.building && feature.id !== '469022520');
const roads = features.filter(feature => feature.tags.highway);
const surfaces = features.filter(feature => feature.tags.leisure || feature.tags.landuse || ['parking', 'fountain'].includes(feature.tags.amenity));
const landmarkLabels = [{ id: '1190791842', label: '기념관' }, { id: '1190791843', label: '대전통일관' }].map(item => {
  const polygon = features.find(feature => feature.id === item.id).coordinates.slice(0, -1);
  const center = polygon.reduce((sum, [lat, lon]) => [sum[0] + lat / polygon.length, sum[1] + lon / polygon.length], [0, 0]);
  return { ...item, point: projectHanbit({ lat: center[0], lon: center[1] }) };
});

function GroundMap({ current, locations, clipId }) {
  const [x, y] = current.point;
  const bearing = ((current.viewHeading % 360) + 360) % 360;
  const halfAngle = current.fov * Math.PI / 360;
  const edgeX = Math.sin(halfAngle) * 85;
  const edgeY = -Math.cos(halfAngle) * 85;
  return <svg className="hm-geographic-map" viewBox="0 0 720 620" aria-hidden="true">
    <defs><clipPath id={clipId}><rect x="20" y="35" width="680" height="550" rx="22" /></clipPath></defs>
    <rect x="20" y="43" width="680" height="550" rx="22" fill="#c9d5c8" />
    <g clipPath={`url(#${clipId})`}>
      <rect x="20" y="35" width="680" height="550" fill="#f0f2e9" />
      {surfaces.map(feature => <polygon key={feature.id} points={points(feature)} fill={feature.tags.amenity === 'fountain' ? '#b2d4d3' : feature.tags.amenity === 'parking' ? '#dddcd0' : '#dfe9d7'} stroke="#cad6c3" strokeWidth="1" />)}
      {roads.map(feature => {
        const drive = !['footway', 'path', 'pedestrian', 'steps', 'cycleway'].includes(feature.tags.highway);
        const width = drive ? feature.tags.highway === 'service' ? 7 : 21 : 3;
        return <g key={feature.id}><polyline points={points(feature)} fill="none" stroke={drive ? '#ffffff' : '#e5e1d1'} strokeWidth={width + 3} strokeLinejoin="round" /><polyline points={points(feature)} fill="none" stroke={drive ? '#b7c1bd' : '#f9f7ee'} strokeWidth={width} strokeLinejoin="round" /></g>;
      })}
      {features.filter(feature => feature.tags.natural === 'tree_row').map(feature => <polyline key={feature.id} points={points(feature)} fill="none" stroke="#9bb78c" strokeWidth="7" strokeDasharray="1 9" strokeLinecap="round" />)}
      {buildings.map(feature => <g key={feature.id}><polygon points={points(feature)} fill="#adb9ab" stroke="#a6b4a5" strokeWidth="2" /><polygon points={points(feature)} transform="translate(0 -7)" fill="#fffdf1" stroke="#c5cbbb" strokeWidth="1.5" /></g>)}
      <g transform="translate(280 215)"><ellipse rx="24" ry="12" fill="#78896b" opacity=".23" /><path d="M-13 0 L-6-80 L6-80 L13 0Z" fill="#e7ddc5" stroke="#a59d87" strokeWidth="1.5" /><path d="M0-146 L7-94 L-7-94Z" fill="#c9bfaa" /><ellipse cy="-82" rx="26" ry="9" fill="#c4bba8" stroke="#9d9887" /><ellipse cy="-88" rx="24" ry="8" fill="#faf3dd" stroke="#aca692" /><path d="M-21-88V-81M-13-92V-79M-5-94V-79M5-94V-79M13-92V-79M21-88V-81" stroke="#8ba7a2" strokeWidth="3" /></g>
      <g className="hm-map-labels"><text x="280" y="247" textAnchor="middle" className="hm-tower-name">한빛탑</text><text x="280" y="418" textAnchor="middle">물빛광장</text>{landmarkLabels.map(item => <text key={item.id} x={item.point[0]} y={item.point[1]} textAnchor="middle">{item.label}</text>)}<text x="424" y="568" textAnchor="middle">엑스포로</text><text x="564" y="430" transform="rotate(66 564 430)">엑스포로97번길</text></g>
      <g transform={`translate(${x} ${y}) rotate(${bearing})`}><path d={`M0 0 L${-edgeX} ${edgeY} A85 85 0 0 1 ${edgeX} ${edgeY} Z`} fill="#e8bd3560" stroke="#bc8f28" strokeWidth="1.5" /><path d="M0-10V-62M-7-52L0-63L7-52" stroke="#087466" strokeWidth="3" fill="none" /></g>
      {locations.map(location => <g key={location.id}><path d={`M${location.point.join(' ')} L${location.badge.join(' ')}`} stroke={location.id === current.id ? '#087466' : '#829b90'} strokeWidth="1.5" fill="none" /><circle cx={location.point[0]} cy={location.point[1]} r={location.id === current.id ? 8 : 5} fill={location.id === current.id ? '#087466' : '#f9fbf5'} stroke="#087466" strokeWidth="2" /></g>)}
    </g>
    <g transform="translate(661 75)" fill="#3f6556"><path d="M0-16L-6 5L0 1L6 5Z" /><text y="25" textAnchor="middle" fontSize="15" fontWeight="700">북</text></g>
    <g transform="translate(42 601)" stroke="#637e6e" fill="none"><path d={`M0 -5V0H${50 * HANBIT_MAP.scale}V-5`} /><text x="80" y="3" fill="#637e6e" stroke="none" fontSize="12">50m</text></g>
  </svg>;
}

export default function HanbitLocationMap({ site, selectedPoint, onSelectPoint, onViewPhoto }) {
  const clipId = useId();
  const [view, setView] = useState('miniature');
  const step = HANBIT_ARRIVAL.steps.find(item => item.id === selectedPoint);
  const photo = site.photos[selectedPoint];
  const current = useMemo(() => getHanbitModelArea(selectedPoint, photo), [selectedPoint, photo]);
  const locations = useMemo(() => HANBIT_ARRIVAL.steps.filter(item => !item.missing).flatMap(item => {
    const location = getHanbitModelArea(item.id, site.photos[item.id]);
    return location ? [{ ...location, ...item }] : [];
  }), [site]);
  if (!current || !step) return null;
  const isMiniature = view === 'miniature';
  const model = PREVIEW_MODELS.hanbit;
  const south = locations.find(item => item.id === 'doorway');
  const map = <GroundMap current={{ ...current, id: selectedPoint }} locations={locations} clipId={clipId} />;
  return <section className="hm-location" aria-label="한빛탑 모형과 실제 촬영 위치">
    <figure className="hm-figure">
      <div className="hm-map-top"><span><MapPin size={16} /> {isMiniature ? '한빛탑 주변 미니어처' : '실제 좌표로 보는 한빛탑 주변'}</span><small>{isMiniature ? '사진 참고 모형' : <><CheckCircle size={14} /> 촬영 위치 확인</>}</small></div>
      <div className="hm-view-tools" role="group" aria-label="모형과 실제 위치 선택"><button onClick={() => setView('miniature')} aria-pressed={isMiniature}>미니어처</button><button onClick={() => setView('map')} aria-pressed={!isMiniature}>실제 위치 지도</button><span>{isMiniature ? '번호를 눌러 사진 구간 선택' : '점은 촬영 위치 · 부채꼴은 보는 방향'}</span></div>
      <div className="hm-map-active" aria-hidden="true"><small>지금 보는 곳</small><strong>{step.number} {step.title}</strong></div>
      {isMiniature ? <>
        <div className="hm-illustration">
          <img className="hm-model-image" src={model.image} alt={model.alt} fetchPriority="high" />
          {locations.filter(item => illustrationSelectors[item.id]).map(item => {
            const position = illustrationSelectors[item.id];
            return <button key={item.id} className="hm-point hm-model-point" style={{ left: `${position[0]}%`, top: `${position[1]}%` }} aria-label={`미니어처에서 ${item.number} ${item.title} 보기`} aria-pressed={selectedPoint === item.id} onClick={() => onSelectPoint(item.id)}><b>{item.number}</b><span><small>{selectedPoint === item.id ? '지금 보는 곳' : '사진 보기'}</small>{item.title}</span></button>;
          })}
        </div>
        {south && <button className="hm-south-scene" aria-label="03 남측 광장 앞 별도 사진 보기" aria-pressed={selectedPoint === 'doorway'} onClick={() => onSelectPoint('doorway')}><b>03</b><img src={site.photos.doorway.image} alt="" /><span><strong>남측 광장 앞</strong><small>탑에서 남쪽 약 258m · 별도로 살펴볼 사진</small></span><ArrowRight size={19} /></button>}
        <figcaption>사진 참고 AI 모형 · 번호는 구간 선택 표시입니다. 정확한 촬영 위치는 ‘실제 위치 지도’에서 확인하세요.</figcaption>
      </> : <>
        <div className="hm-map-art">{map}
          {locations.map(item => <button key={item.id} className={`hm-point ${item.badge[0] > 500 ? 'hm-point-right' : 'hm-point-left'}`} style={{ left: `${item.badge[0] / HANBIT_MAP.width * 100}%`, top: `${item.badge[1] / HANBIT_MAP.height * 100}%` }} aria-label={`실제 위치 지도에서 ${item.number} ${item.title} 보기`} aria-pressed={selectedPoint === item.id} onClick={() => onSelectPoint(item.id)}><b>{item.number}</b><span><small>{selectedPoint === item.id ? '지금 보는 곳' : '사진 보기'}</small>{item.title}</span></button>)}
        </div>
        <div className="hm-map-key"><span><i /> 사진을 촬영한 위치</span><span><i /> 사진을 바라보는 방향</span></div>
        <figcaption>점은 촬영 좌표, 번호표까지의 선은 위치를 가리킵니다. 건물 모습은 이해를 돕는 표현입니다. <a href={HANBIT_GEOMETRY.licenseUrl} target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></figcaption>
      </>}
    </figure>
    <div className="hm-current">
      <div className="hm-current-heading" aria-live="polite" aria-atomic="true"><p><span /> 지금 보는 곳</p><h3><b>{step.number}</b>{step.title}</h3><strong>{current.area}</strong>{!isMiniature && <p className="hm-direction">{current.direction}을 바라보는 사진</p>}<p className="hm-current-note">{isMiniature ? illustrationNotes[selectedPoint] : current.note}</p></div>
      <button className="hm-current-photo" aria-label={`${step.title} 실제 사진의 장애물 보기`} onClick={onViewPhoto}><img src={photo.image} alt={`${current.area} 실제 사진`} /><span><Camera size={16} /> 이 구간의 실제 사진 <ArrowDown size={16} /></span></button>
      <p className="hm-credit">{photoProviderLabel(photo)} · {photoDateLabel(photo)} 촬영</p>
      <button className="hm-view-photo" onClick={onViewPhoto}>사진에서 장애물 자세히 보기 <ArrowDown size={18} /></button>
      {!isMiniature && <details className="hm-evidence"><summary>위치 확인 근거 보기</summary><p>{photoProviderLabel(photo)} 원본의 촬영 위치 정보를 대조했습니다.</p><dl><dt>촬영 좌표</dt><dd>{current.camera.lat.toFixed(6)}, {current.camera.lon.toFixed(6)}</dd><dt>사진 방향</dt><dd>{((current.viewHeading % 360 + 360) % 360).toFixed(1)}° · 북쪽 0° 기준</dd><dt>대조일</dt><dd>{current.checkedAt.slice(0, 10)}</dd></dl><a href={current.sourceUrl} target="_blank" rel="noreferrer">지도에서 원본 사진 열기 <ArrowSquareOut size={14} /></a><p>촬영 좌표는 지도 제공사의 값입니다. 장애물의 정확한 좌표·실제 통과 폭·하차 정류장과 연결 동선은 현장 확인 전입니다.</p><a href={model.referenceUrl} target="_blank" rel="noreferrer">모형 외관 참고 출처 <ArrowSquareOut size={14} /></a></details>}
    </div>
  </section>;
}
