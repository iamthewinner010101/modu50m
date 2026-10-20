import locations from './routeMiniaturesV24.json' with {type:'json'};
import artwork from './routeArtworkV26.json' with {type:'json'};
import recommendations from './routeModelsV30.json' with {type:'json'};
import busJourneys from './routeModelsV31.json' with {type:'json'};
import transportJourneys from './routeModelsV32.json' with {type:'json'};
import fullRouteMiniatures from './fullRouteMiniaturesV38.json' with {type:'json'};
import hanbitPassage from './hanbitPassageModelV46.json' with {type:'json'};
import {ARRIVAL_ROUTES} from './arrivalRoutes.js';

export const ENTRANCE_MODELS = {...Object.fromEntries(Object.entries(locations).map(([id,model])=>[id,{...model,...artwork[id]}])),...recommendations,...busJourneys,...transportJourneys};
export const JOURNEY_MODELS = Object.fromEntries(Object.entries(ENTRANCE_MODELS).map(([id,model])=>{
  const merged={...model,...fullRouteMiniatures[id],...(id==='hanbit'?hanbitPassage:{})};
  const route=ARRIVAL_ROUTES[id];
  // The route owns photo evidence status. An older illustration must not keep
  // reporting gaps after new source photographs have been reviewed.
  const connectionGaps=route.steps.slice(0,-1).flatMap((step,index)=>
    !step.next||step.next.status==='gap'?[[index,index+1]]:[]);
  return [id,{...merged,connectionGaps,
    ...(merged.routeSegments?{routeSegments:merged.routeSegments.filter(segment=>
      route.steps[segment.from]?.next&&route.steps[segment.from].next.status!=='gap')}:{}),
  }];
}));
export const hasJourneyModel = id => Boolean(JOURNEY_MODELS[id]);
