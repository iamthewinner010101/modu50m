import { WheelchairMotion, Info } from '@phosphor-icons/react';
import { getPrecinctAnnotations } from '../data/precinctAnnotations.js';

export function WheelchairInspection({ site, point }) {
  const attention = getPrecinctAnnotations(site.id).attention.find(item => item.checkpointId === point.id);
  return <section className="hb-inspection" aria-label="휠체어 이용 시 확인할 항목">
    <div><WheelchairMotion size={20} /><span>휠체어 체크 {point.number}<strong>{attention.title}</strong></span><small>판정 전</small></div>
    <ul>{attention.checks.map(text => <li key={text}>{text}</li>)}</ul>
    <p>확인할 질문입니다. 시설의 유무·수치·통행 가능 여부를 확정한 결과가 아닙니다.</p>
  </section>;
}

export function UnlocatedFacilities({ site }) {
  return <div className="hb-unlocated-content">
    <p><Info size={16} />현재 자료로 정확한 위치를 확정하지 못해 지도에는 핀을 찍지 않았습니다. 시설이 없다는 뜻은 아닙니다.</p>
    <ul>{getPrecinctAnnotations(site.id).unlocated.map(item => <li key={item.id}><strong>{item.title}<span>위치 미확인</span></strong><small>{item.action}</small></li>)}</ul>
  </div>;
}
