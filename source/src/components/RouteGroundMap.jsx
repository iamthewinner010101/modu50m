import maps from '../data/routeGroundMapsV25.json';
import albums from '../data/routePhotoAlbums.js';
import './RouteGroundMap.css';

const points = feature => feature.points.map(p=>p.join(',')).join(' ');
const number = i => String(i+1).padStart(2,'0');

export default function RouteGroundMap({placeId,route,selected,onSelect}) {
  const map=maps[placeId];
  const polygons=map.features.filter(f=>['wood','parking','water','building'].includes(f.kind));
  const lines=map.features.filter(f=>['road','path'].includes(f.kind));
  const roadWidth=f=>(f.kind==='path'?2.5:f.tags.highway==='service'?5:10)*map.scalePixelsPerMeter;
  return <div className="rg-map-wrap">
    <div className="rg-map" role="group" aria-label="실제 좌표 지도에서 사진 구역 선택">
      <svg viewBox="0 0 1100 760" aria-label="공개 좌표로 그린 도로·건물 배치" role="img">
        <rect width="1100" height="760" fill="#eef3e8"/>
        {polygons.filter(f=>f.kind!=='building').map(f=><polygon key={f.id} points={points(f)} fill={{wood:'#d8e5c9',parking:'#e1e4db',water:'#b8d9db'}[f.kind]} stroke="#ced9c8" strokeWidth="1"/>)}
        {lines.map(f=><polyline key={`border-${f.id}`} points={points(f)} fill="none" stroke={f.kind==='path'?'#e0d8c5':'#c4cec6'} strokeWidth={roadWidth(f)+3} strokeLinejoin="round" strokeLinecap="round"/>)}
        {lines.map(f=><polyline key={f.id} points={points(f)} fill="none" stroke={f.kind==='path'?'#fbf5e7':'#fffefa'} strokeWidth={roadWidth(f)} strokeLinejoin="round" strokeLinecap="round"/>)}
        {polygons.filter(f=>f.kind==='building').map(f=><polygon key={f.id} points={points(f)} fill="#d2cebb" stroke="#a9b5a2" strokeWidth="2"/>)}
        <polyline points={map.mapPath.map(p=>p.join(',')).join(' ')} fill="none" stroke="white" strokeWidth="14" strokeLinejoin="round"/>
        <polyline points={map.mapPath.map(p=>p.join(',')).join(' ')} fill="none" stroke="#128478" strokeWidth="7" strokeLinejoin="round" strokeDasharray="12 8"/>
        {map.labels.map(l=><text key={l.text} x={l.point[0]} y={l.point[1]} textAnchor="middle" className="rg-place-name">{l.text}</text>)}
        {map.markers.map(m=><g key={m.step}>
          <path d={`M${m.mapPoint.join(',')}L${m.position[0]*11},${m.position[1]*7.6}`} stroke="#487b6e" strokeWidth="2"/>
          <circle cx={m.mapPoint[0]} cy={m.mapPoint[1]} r={m.steps.includes(selected)?13:9} fill="#087a6d" stroke="white" strokeWidth="4"/>
        </g>)}
        <text x="1020" y="58" className="rg-north">↑ N</text>
        <path d={`M35 705v10h${50*map.scalePixelsPerMeter}v-10`} stroke="#3a6457" strokeWidth="3" fill="none"/>
        <text x="35" y="746" fontSize="20" fill="#3a6457">50m</text>
      </svg>
      {map.markers.map(m=><button key={m.step} className="rg-pin" style={{left:`${m.position[0]}%`,top:`${m.position[1]}%`}} aria-pressed={m.steps.includes(selected)} aria-label={`지도 ${m.steps.map(number).join('·')} ${m.label} 사진 보기`} onClick={()=>onSelect(m.steps.includes(selected)?selected:m.step)}><b>{m.steps.map(number).join('·')}</b><span>{m.label}<small>사진 {1+(albums[placeId]?.[route.steps[m.step].pointId]?.length||0)}장</small></span></button>)}
      {placeId==='hanbit'&&<button className="rg-gap" onClick={()=>onSelect(4)}>05 통로·광장 사진 비교 · 연결 확인 중</button>}
    </div>
    <div className="rg-legend"><span><i/> 공식 자료에 등록된 사진 구역</span><span><i className="rg-dash"/> 출처의 대중교통 안내선</span></div>
    <p className="rg-clarity">점은 촬영자의 GPS가 아닌 사진 속 구역의 등록 위치예요. 높이·경사와 현재 통행 상태는 사진 및 현장에서 확인해요.</p>
    <div className="rg-source"><span>도로·건물 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · 사진 구역 한국관광공사</span><a href={map.kakaoUrl} target="_blank" rel="noreferrer">카카오 지도·스카이뷰로 비교 ↗</a></div>
  </div>;
}
