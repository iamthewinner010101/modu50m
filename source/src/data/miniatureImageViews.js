// Each image has its own illustration coordinates. These are photo-selection
// areas, never surveyed camera, obstacle or door coordinates.
import hanbitPassage from './hanbitPassageModelV46.json' with {type:'json'};

export const HANBIT_IMAGE_VIEWS=[
  {id:'original',label:'기본 구도',description:'흰 기둥 통로를 실제 사진과 비교한 미니어처',...hanbitPassage},
  {id:'high',hiddenSteps:[4],label:'높은 시점',description:'건물 사이와 광장을 위에서 살펴봐요',image:'/modu50m/miniature-views-v34/hanbit-high.png',alt:'같은 한빛탑 미니어처를 높은 시점에서 다시 그린 참고 그림. 원형 광장과 건물 사이의 배치를 살펴보는 구도.',pins:[
    {steps:[0],label:'DCC종점',anchor:[82.1,72],position:[87.5,83]},
    {steps:[1],label:'입구 앞 횡단',anchor:[80.2,47.3],position:[91.5,49]},
    {steps:[2],label:'공원 입구',anchor:[75.5,46.5],position:[76,35]},
    {steps:[3],label:'통일관 앞',anchor:[61,46.3],position:[66,58]},
    {steps:[5,6],label:'탑 경사로 구역',anchor:[31.5,52],position:[24,63]},
  ]},
  {id:'reverse',label:'반대편 시점',description:'광장 쪽에서 건물의 다른 면을 살펴봐요',image:'/modu50m/miniature-views-v34/hanbit-reverse.png',alt:'같은 모형을 반대편에서 다시 그린 AI 참고 그림. 실제 뒷면을 촬영한 사진이 아니며 입구 위치는 이 구도에 표시하지 않음.',hiddenSteps:[4,5,6],pins:[
    {steps:[0],label:'DCC종점',anchor:[33.5,12.5],position:[50,8]},
    {steps:[1],label:'입구 앞 횡단',anchor:[26.2,25.8],position:[11,37]},
    {steps:[2],label:'공원 입구',anchor:[34.8,29.6],position:[30,20]},
    {steps:[3],label:'통일관 앞',anchor:[42,33.5],position:[49,34]},
  ]},
];

export function nextMiniatureView(views,current,direction){const i=Math.max(0,views.findIndex(v=>v.id===current));return views[(i+(direction<0?-1:1)+views.length)%views.length].id;}
export function miniatureSwipeDirection(dx,dy){return Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.5?(dx<0?1:-1):0;}

// Cache by URL, not by view IDs shared between places. Failed loads can retry.
export function createMiniatureImageLoader({createImage=()=>new Image(),maxEntries=12,timeoutMs=15000}={}) {
  const cache=new Map();
  return imageUrl=>{
    if(cache.has(imageUrl)){
      const previous=cache.get(imageUrl);cache.delete(imageUrl);cache.set(imageUrl,previous);
      return previous;
    }
    const work=new Promise((resolve,reject)=>{
      const image=createImage();let finished=false;
      const finish=error=>{
        if(finished)return;finished=true;clearTimeout(timer);image.onload=null;image.onerror=null;
        if(error)reject(error);else resolve(true);
      };
      const timer=setTimeout(()=>finish(new Error('MINIATURE_IMAGE_TIMEOUT')),timeoutMs);
      image.decoding='async';
      image.onload=async()=>{try{if(image.decode)await image.decode();finish();}catch(error){finish(error);}};
      image.onerror=()=>finish(new Error('MINIATURE_IMAGE_LOAD_FAILED'));
      image.src=imageUrl;
    });
    cache.set(imageUrl,work);
    work.catch(()=>{if(cache.get(imageUrl)===work)cache.delete(imageUrl);});
    if(cache.size>maxEntries)cache.delete(cache.keys().next().value);
    return work;
  };
}
export const loadMiniatureImage=createMiniatureImageLoader();

// At most two full-size images load/decode at once.
export async function prepareMiniatureViews(views,onReady,{load=loadMiniatureImage,cancelled=()=>false}={}) {
  let next=0;
  const worker=async()=>{
    while(next<views.length&&!cancelled()){
      const view=views[next++];
      let ready=true;try{await load(view.image);}catch{ready=false;}
      if(!cancelled())onReady(view.image,ready);
    }
  };
  await Promise.all([worker(),worker()]);
}
