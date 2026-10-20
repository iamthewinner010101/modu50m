import {WHEELCHAIR_VISIT_NEEDS, visitNeedQuestion} from '../data/wheelchairVisitNeeds.js';

export function VisitNeedsShortcuts({placeId,onSelect}) {
  const needs=WHEELCHAIR_VISIT_NEEDS[placeId];
  if(!needs)return null;
  return <div className="wvn-shortcuts"><strong>이곳에서 먼저 확인할 지점</strong><div>{needs.map(need=><button key={need.step} onClick={()=>onSelect(need)}><b>{String(need.step).padStart(2,'0')}</b>{need.title}<span aria-hidden="true"> →</span></button>)}</div></div>;
}

export function SelectedVisitNeed({route,index,onAdd}) {
  const need=WHEELCHAIR_VISIT_NEEDS[route.placeId]?.find(item=>item.step===index+1);
  if(!need)return null;
  return <section className="wvn-selected" aria-label="이 지점의 사진 검토와 남은 질문"><strong>{need.title}</strong><p>{need.visible}</p><button onClick={()=>onAdd(visitNeedQuestion(route,need))}>+ 이 지점의 구체적인 질문 담기</button><small>{need.question}</small></section>;
}
