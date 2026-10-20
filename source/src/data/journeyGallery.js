import albums,{routeContextPhotos,photoSourceDescription} from './routePhotoAlbums.js';
import {photoCaption} from './previewCityPlaces.js';
import {photoProviderLabel} from './previewRoadviewSelection.js';
import {getPhotoReview} from './wheelchairPhotoReview.js';
import {photoEvidenceRole} from './photoEvidenceRoles.js';

export function galleryPhoto(photo,{title,observations=[],stepIndex=null,context=false}={}) {
  return {...photo,title:photo.title||title,observations:photo.observations||observations,stepIndex,context,evidenceRole:photoEvidenceRole(photo),
    credit:photo.author?`${photo.author} · ${photoSourceDescription(photo).date}`:photo.retrievedAt?`${photoSourceDescription(photo).kind} · ${photoSourceDescription(photo).date}`:`${photoProviderLabel(photo)} · ${photoCaption(photo)}`,
    scope:photo.scope||'사진에 보이는 부분을 살펴봐요. 현재 통과 가능 여부는 추가 확인이 필요해요.'};
}

export function journeyGallery(site,route) {
  const seen=new Set(), photos=[];
  route.steps.forEach((step,stepIndex)=>{
    const base=site.photos[step.pointId];
    const group=base?[galleryPhoto(base,{title:step.title,observations:getPhotoReview(site,step.pointId).observations}),...(albums[site.id]?.[step.pointId]||[]).map(p=>galleryPhoto(p))]:routeContextPhotos(site.id,step).map(p=>galleryPhoto(p));
    if(step.photoOrder?.length){
      const order=new Map(step.photoOrder.map((image,index)=>[image,index]));
      group.sort((a,b)=>(order.get(a.image)??Infinity)-(order.get(b.image)??Infinity));
    }
    for(const photo of group){
      // One photo can show two consecutive checkpoints. Keep both route numbers.
      const key=`${stepIndex}:${photo.image}`;
      if(seen.has(key))continue;
      seen.add(key);
      photos.push({...photo,stepIndex,context:!step.pointId,stepTitle:`${String(stepIndex+1).padStart(2,'0')} ${step.title}`});
    }
  });
  return photos;
}
