export const VISIT_PREFERENCE_FIELDS = [
  ['visitDate','방문 예정일',40],['wheelchair','이용할 휠체어',60],
  ['width','휠체어 전체 폭 · 알고 있다면',40],['companion','동행 여부',60],
  ['rest','쉬어 갈 때 필요한 조건',240],['returnPlan','돌아갈 교통편·정류장·출구',240],
];
export function normalizeVisitPreferences(value={}) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('방문 조건을 읽지 못했어요. 이전 기록은 유지했어요.');
  return Object.fromEntries(VISIT_PREFERENCE_FIELDS.map(([key,,limit])=>{
    const text=value[key]??'';
    if(typeof text!=='string'||text.length>limit)throw Error('방문 조건이 너무 길거나 올바르지 않아요.');
    return [key,text.trim()];
  }));
}
export const visitPreferencesText=value=>VISIT_PREFERENCE_FIELDS.map(([key,label])=>`${label}: ${value?.[key]||'아직 적지 않음'}`).join('\n');
