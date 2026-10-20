import parkingViewOverrides from './parkingViewOverridesV94.json' with {type:'json'};
// Remap via stable step IDs, never via a photo filename or a guessed ordinal.
export function modelForArrival(model,baseRoute,route) {
  const indices=new Map(baseRoute.steps.map((s,i)=>[i,route.steps.findIndex(next=>next.id===s.id)]));
  const pins=model.pins.flatMap(pin=>{
    const steps=pin.steps.map(i=>indices.get(i)).filter(i=>i>=0);
    return steps.length?[{...pin,steps,...(steps.length===1&&route.steps[steps[0]]?.miniatureLabel?{label:route.steps[steps[0]].miniatureLabel}:{})}]:[];
  });
  if(model.fullJourney){
    // Different whole-image camera angles need their own parking anchors.
    // Override by stable route ID, keeping the photographed location identity.
    const parkingPinForView=pin=>({...pin,...(model.parkingPinOverrides?.[route.steps[pin.steps[0]]?.id]||{})});
    if(route.parkingPins)pins.unshift(...route.parkingPins.map(parkingPinForView));
    else if(route.parkingPin)pins.unshift(parkingPinForView({...route.parkingPin,steps:[0]}));
  }
  const routeSegments=(model.routeSegments||[]).flatMap(segment=>{
    const from=indices.get(segment.from),to=indices.get(segment.to??segment.from+1);
    return from>=0&&to>=0&&to===from+1&&route.steps[from]?.next?.status!=='gap'?[{...segment,from,to}]:[];
  });
  const reviewedView=route.arrival==='parking'&&model.fullJourney?parkingViewOverrides[route.placeId]?.[model.image]:null;
  const reviewedPins=reviewedView?pins.map(pin=>({...pin,...reviewedView.pins[route.steps[pin.steps[0]]?.id]})):pins;
  const reviewedSegments=reviewedView?reviewedView.segments.flatMap(segment=>{
    const from=route.steps.findIndex(s=>s.id===segment.fromStep),to=route.steps.findIndex(s=>s.id===segment.toStep);
    return from>=0&&to===from+1&&route.steps[from]?.next?.status!=='gap'?[{...segment,from,to}]:[];
  }):routeSegments;
  return {...model,pins:reviewedPins,routeSegments:reviewedSegments,...(route.arrival==='parking'?{busApproach:false,geometry:null,title:route.title,alt:`${route.start.name}에서 ${route.destination}까지 사진을 살펴볼 순서를 표시한 미니어처`}:{}),startLabel:route.start.name,endLabel:route.destination,
    distanceValue:route.arrival==='parking'?'사진 비교':model.distanceValue,
    distanceNote:route.arrival==='parking'?'주차장 접근 사진과 입구까지의 순서를 비교해요. 실측 이동 거리는 아니에요.':model.distanceNote,
    distances:route.arrival==='parking'?[]:model.distances};
}

export function individualMiniaturePins(pins,steps) {
  return pins.flatMap(pin=>pin.steps.map((step,index)=>({...pin,steps:[step],
    label:pin.steps.length>1?steps[step]?.title||pin.label:pin.label,
    position:pin.steps.length>1?[Math.max(14,Math.min(86,pin.position[0]+(index-(pin.steps.length-1)/2)*32)),pin.position[1]]:pin.position})));
}
