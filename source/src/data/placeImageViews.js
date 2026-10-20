import {HANBIT_IMAGE_VIEWS} from './miniatureImageViews.js';
import {JOURNEY_MODELS,ENTRANCE_MODELS} from './journeyModels.js';
import {ARRIVAL_ROUTES} from './arrivalRoutes.js';
import additions from './placeImageViewsV35.json' with {type:'json'};
import wholeAngles from './placeFullImageViewsV71.json' with {type:'json'};

export const MINIATURE_SCOPES={hanbit:'정류장·공원 진입부·탑 광장',...Object.fromEntries(Object.entries(additions).map(([id,value])=>[id,JOURNEY_MODELS[id].fullJourney?JOURNEY_MODELS[id].scope:value.scope]))};
export const PLACE_IMAGE_VIEWS={hanbit:[HANBIT_IMAGE_VIEWS[0],...(wholeAngles.hanbit||[]),...HANBIT_IMAGE_VIEWS.slice(1)],...Object.fromEntries(Object.entries(additions).map(([id,value])=>{
  const model=JOURNEY_MODELS[id];
  const withHidden=view=>({...view,hiddenSteps:ARRIVAL_ROUTES[id].steps.flatMap((_,i)=>view.pins.some(pin=>pin.steps.includes(i))?[]:[i])});
  if(model.fullJourney){
    const entrance=ENTRANCE_MODELS[id];
    const closeup={fullJourney:false,routeSegments:[],scope:value.scope};
    return [id,[withHidden({...model,id:'original',label:'전체 동선',description:'버스 정류장부터 입구까지 한눈에'}),
      ...(wholeAngles[id]||[]).map(view=>withHidden({...model,...view})),
      withHidden({...closeup,id:'entrance-original',label:'입구 확대',description:'문 앞 바닥과 주변을 자세히',image:entrance.image,alt:entrance.alt,pins:entrance.pins}),
      ...value.views.map((v,i)=>withHidden({...v,...closeup,label:i===0?'입구 높은 시점':'입구 다른 쪽',description:'입구 주변의 준비된 다른 구도'}))]];
  }
  const whole=wholeAngles[id]||[];
  return [id,[withHidden({...model,id:'original',label:whole.length?'전체 동선':'기본 구도',description:'기존 미니어처를 그대로 살펴봐요',...(whole.length?{fullJourney:true,routeSegments:whole[0].originalRouteSegments||[]}:{})}),...whole.map(view=>withHidden({...model,...view})),...value.views.map(withHidden)]];
}))};
