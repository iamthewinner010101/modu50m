import {VISIT_PREFERENCE_FIELDS} from '../utils/visitPreferences.js';

export default function VisitPreferencesFields({value,onChange}) {
  return <fieldset className="pv-personal"><legend>내 이동 조건과 귀가 준비</legend><p>아는 항목만 적어 주세요. 내 조건에 맞춰 사진을 살펴보는 메모이며 통행 가능 판정에 사용하지 않아요.</p><div className="pv-personal-fields">{VISIT_PREFERENCE_FIELDS.map(([key,label,limit])=><label key={key}>{label}{['rest','returnPlan'].includes(key)?<textarea value={value[key]||''} maxLength={limit} onChange={e=>onChange({...value,[key]:e.target.value})} placeholder={key==='rest'?'예: 오래 이동하면 중간에 그늘에서 쉬고 싶어요.':'예: 돌아오는 버스의 정류장 번호와 하차 쪽을 다시 확인할 예정이에요.'}/>:<input type={key==='visitDate'?'date':'text'} value={value[key]||''} maxLength={limit} onChange={e=>onChange({...value,[key]:e.target.value})} placeholder={key==='wheelchair'?'예: 수동·전동휠체어':key==='width'?'예: 65cm · 모르면 비워 두세요':key==='companion'?'예: 혼자 / 친구와 함께':''}/>}</label>)}</div></fieldset>;
}
