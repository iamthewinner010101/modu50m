import {missingConnections} from '../data/visitScopes.js';

const number=index=>String(index+1).padStart(2,'0');

export default function RoutePhotoStatus({route,photoCount,photoGaps=0,onCompare}) {
  const links=missingConnections(route);
  return <details className="jvf-route-status">
    <summary>{links.length>0?`사진 사이 확인할 곳 ${links.length}곳`:'길 사진·출처 보기'}</summary>
    <p>실제 사진 {photoCount}장 · 주변 모습 비교 포함</p>
    {route.start.direction&&<p>내릴 쪽: {route.start.direction}</p>}
    {links.length>0&&<p>중간 바닥이 보이지 않는 곳은 앞뒤 사진을 비교하고, 궁금한 점은 위치 댓글에 남겨 주세요.</p>}
    {links.length>0&&<div className="jvf-missing-links">
      <strong>사진에 안 담긴 연결부</strong>
      {links.map(link=><button type="button" key={link.from} onClick={()=>onCompare(link.from)}>
        <b>{number(link.from)} → {number(link.to)}</b>
        <span>{link.fromTitle} → {link.toTitle}<small>앞뒤 사진 비교 ↓</small></span>
      </button>)}
    </div>}
    {photoGaps>0&&<p>아직 구간 사진이 없는 곳 {photoGaps}곳</p>}
    <p className="jvf-evidence-note">방문 전 사진으로 살펴보는 순서예요. 현장에서 연속 통행을 확인한 경로는 아니에요.</p>
  </details>;
}
