import previousMaps from '../data/busApproachMapsV31.json';
import updatedMaps from '../data/busApproachMapsV32.json';
import './BusApproachMap.css';

const points = ps => ps.map(p=>p.join(',')).join(' ');
const maps = {...previousMaps,...updatedMaps};
const number = i => String(i+1).padStart(2,'0');

export default function BusApproachMap({placeId,route,selected,onSelect}) {
  const map=maps[placeId];
  if(!map)return null;
  const active=map.markers[selected];
  return <div className="ba-overview">
    <div className="ba-start"><span>BUS <b>{route.start.code}</b></span><div><strong>{route.start.name}에서 시작</strong><small>{route.start.direction}</small></div><button onClick={()=>onSelect(0)} aria-label="버스 정류장 첫 사진 보기">01 사진 보기 ↗</button></div>
    <div className="ba-map" role="group" aria-label="버스 정류장부터 입구까지 전체 위치">
      <svg viewBox="0 0 1100 760" aria-label="버스 정류장과 입구 사이의 지도 및 확인할 지점">
        <defs><pattern id={`grid-${placeId}`} width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#dce7da" strokeWidth=".7"/></pattern></defs>
        <rect width="1100" height="760" fill="#edf3e8"/>
        <rect width="1100" height="760" fill={`url(#grid-${placeId})`}/>
        {map.features.filter(f=>!['road','path'].includes(f.kind)).map(f=><polygon key={f.id} points={points(f.points)} fill={{building:'#d6d0bb',parking:'#dbe0d4',wood:'#d3e2c6',water:'#b4d5d6'}[f.kind]} stroke={f.kind==='building'?'#adae98':'#d0dac9'} strokeWidth="1.5"/>)}
        {map.features.filter(f=>['road','path'].includes(f.kind)).map(f=><polyline key={f.id} points={points(f.points)} fill="none" stroke={f.kind==='path'?'#fff9ed':'#fcfcf6'} strokeWidth={(f.kind==='path'?3:f.tags.highway==='service'?5:10)*map.scalePixelsPerMeter} strokeLinejoin="round"/>)}
        <polyline points={points(map.mapPath)} fill="none" stroke="#fff" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={points(map.mapPath)} fill="none" stroke="#b38b3b" strokeWidth="6" strokeDasharray="10 9" strokeLinejoin="round" strokeLinecap="round"/>
        {map.markers.map(m=><g key={m.step} role="button" tabIndex={0} aria-label={`동선 지도 ${number(m.step)} ${m.label}`} aria-pressed={selected===m.step} className="ba-marker" onClick={()=>onSelect(m.step)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(m.step);}}}>
          <circle cx={m.mapPoint[0]} cy={m.mapPoint[1]} r={selected===m.step?35:29} fill={selected===m.step?'#006b60':m.hasPhoto?'#fff':'#fff7de'} stroke="#087b6c" strokeWidth={selected===m.step?5:3}/>
          <text x={m.mapPoint[0]} y={m.mapPoint[1]+8} textAnchor="middle" fill={selected===m.step?'#fff':'#075e55'} fontSize="24" fontWeight="800">{number(m.step)}</text>
        </g>)}
        <text x="1000" y="54" fontSize="25" fill="#517064">↑ 북</text>
        <path d={`M40 690v12h${50*map.scalePixelsPerMeter}v-12`} stroke="#587966" fill="none" strokeWidth="3"/>
        <text x="40" y="738" fontSize="22" fill="#587966">50m · 지도 축척</text>
      </svg>
      {active&&<div className="ba-active" aria-live="polite"><b>{number(selected)}</b><div><small>지금 살펴보는 위치</small><strong>{active.label}</strong></div></div>}
    </div>
    <div className="ba-key"><span><i/>번호를 누르면 해당 구간 사진</span><span><i className="ba-dashed"/>방문 전 검토할 동선 · 통행 미확인</span></div>
    <p className="ba-note">정류장은 공개 좌표, 나머지 점은 지도·사진으로 비교한 구역이에요. 점선 전체를 휠체어로 통과할 수 있는지는 확인 전이에요.</p>
    <div className="ba-links"><a href={route.start.sourceUrl} target="_blank" rel="noreferrer">정류장 위치 근거 ↗</a><a href={map.kakaoUrl} target="_blank" rel="noreferrer">카카오 지도에서 위치 비교 ↗</a><small>도로·건물 © OpenStreetMap</small></div>
  </div>;
}
