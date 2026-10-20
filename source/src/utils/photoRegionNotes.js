import hashes from '../data/finalsPhotoHashes.generated.json' with {type:'json'};

export function regionEvidence(placeId,photo) {
  const sha256=photo.sourceSha256||hashes[photo.image];
  if(!placeId||!photo.image||!photo.sourceUrl||!/^[a-f0-9]{64}$/.test(sha256||''))throw new Error('사진 근거를 확인하지 못했어요.');
  return {placeId,image:photo.image,sourceUrl:photo.sourceUrl,sha256};
}
export const regionKey=(evidence,qa=false)=>`modu50m.photo-regions.v1.${qa?'qa.':''}${evidence.placeId}.${encodeURIComponent(evidence.image)}.${evidence.sha256}`;
export function rectangleAnnotation({id,rect,reason=''}) {
  const {x,y,w,h}=rect;
  return {id,bodies:reason?[{id:`${id}-reason`,annotation:id,purpose:'commenting',value:reason}]:[],
    target:{annotation:id,selector:{type:'RECTANGLE',geometry:{x,y,w,h,bounds:{minX:x,minY:y,maxX:x+w,maxY:y+h}}}}};
}
export function annotationRegion(annotation) {
  if(annotation?.target?.selector?.type!=='RECTANGLE')throw new Error('사각형으로 표시해 주세요.');
  if(annotation.target.selector.geometry.rot)throw new Error('회전하지 않은 사각형으로 표시해 주세요.');
  const {x,y,w,h}=annotation.target.selector.geometry;
  return {id:annotation.id,rect:{x,y,w,h},reason:annotation.bodies.find(b=>b.purpose==='commenting')?.value||''};
}
export function validateRegions(marks,size) {
  if(!Number.isSafeInteger(size?.width)||!Number.isSafeInteger(size?.height)||size.width<1||size.height<1)throw new Error('사진 크기를 확인하지 못했어요.');
  if(!Array.isArray(marks)||marks.length>30)throw new Error('사진 한 장에 최대 30곳까지 표시할 수 있어요.');
  const ids=new Set();
  return marks.map(mark=>{
    const {id,rect,reason}=mark||{}, {x,y,w,h}=rect||{};
    if(typeof id!=='string'||!id||id.length>100||ids.has(id))throw new Error('표시 번호가 올바르지 않아요.');
    ids.add(id);
    if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<1||h<1||x+w>size.width+.5||y+h>size.height+.5)throw new Error('사진 안쪽에 사각형을 그려 주세요.');
    if(typeof reason!=='string'||!reason.trim()||reason.length>500)throw new Error('표시한 곳마다 걱정되는 이유를 적어 주세요. (500자 이내)');
    return {id,rect:{x,y,w,h},reason:reason.trim()};
  });
}
export function parseRegions(raw,evidence,size) {
  if(!raw)return {revision:0,marks:[]};
  const packet=JSON.parse(raw);
  if(packet.schema!=='modu50m.photo-regions.v1'||!Number.isSafeInteger(packet.revision)||packet.revision<1||
    ['placeId','image','sourceUrl','sha256'].some(key=>packet.evidence?.[key]!==evidence[key])||
    packet.size?.width!==size.width||packet.size?.height!==size.height)throw new Error('저장된 표시와 현재 사진의 근거가 달라요. 이전 기록을 덮어쓰지 않았어요.');
  return {...packet,marks:validateRegions(packet.marks,size)};
}
export function saveRegions(storage,key,evidence,size,annotations,previousRaw) {
  const before=storage.getItem(key);
  if(before!==previousRaw)throw new Error('다른 창에서 표시가 바뀌었어요. 이 창을 다시 열어 최신 기록을 확인해 주세요.');
  const current=parseRegions(before,evidence,size);
  const packet={schema:'modu50m.photo-regions.v1',revision:current.revision+1,evidence,size,
    marks:validateRegions(annotations.map(annotationRegion),size),savedAt:new Date().toISOString(),fieldVerified:false};
  const raw=JSON.stringify(packet);storage.setItem(key,raw);
  if(storage.getItem(key)!==raw)throw new Error('저장 결과를 확인하지 못했어요. 다시 열어 확인해 주세요.');
  return {packet,raw};
}
