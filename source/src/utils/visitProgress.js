import {normalizeVisitPreferences} from './visitPreferences.js';
export const visitProgressKey=(placeId,qa=false)=>`modu50m.visit-progress.v1.${qa?'qa.':''}${placeId}`;

export function readVisitProgress(storage,key,route){
  const raw=storage.getItem(key);
  if(!raw)return {raw:null,reviewed:[],question:'',savedAt:null};
  const p=JSON.parse(raw);
  if(p.schema!=='modu50m.visit-progress.v1'||p.placeId!==route.placeId||!Array.isArray(p.reviewed)||typeof p.question!=='string')throw Error('저장한 준비 내용을 읽지 못했어요. 이전 기록을 덮어쓰지 않았어요.');
  return {raw,reviewed:p.reviewed.filter(id=>route.steps.some(s=>s.id===id)),question:p.question,savedAt:p.savedAt,preferences:normalizeVisitPreferences(p.preferences)};
}

export function saveVisitProgress(storage,key,route,{reviewed,question,preferences},previousRaw){
  if(storage.getItem(key)!==previousRaw)throw Error('다른 창에서 준비 내용이 바뀌었어요. 새로고침 후 최신 내용을 확인해 주세요.');
  if(typeof question!=='string'||question.length>1600)throw Error('질문은 1,600자 이내로 적어 주세요.');
  const ids=[...new Set(reviewed)].filter(id=>route.steps.some(s=>s.id===id));
  const packet={schema:'modu50m.visit-progress.v1',placeId:route.placeId,reviewed:ids,question:question.trim(),preferences:normalizeVisitPreferences(preferences),savedAt:new Date().toISOString(),fieldVerified:false,continuousRouteVerified:false};
  const raw=JSON.stringify(packet);storage.setItem(key,raw);
  if(storage.getItem(key)!==raw)throw Error('저장 결과를 확인하지 못했어요. 내용을 복사해 보관해 주세요.');
  return {...packet,raw};
}
