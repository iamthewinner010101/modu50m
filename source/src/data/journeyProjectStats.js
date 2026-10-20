import {RECOMMENDED_PLACE_IDS} from './recommendedJourneys.js';
import {ARRIVAL_ROUTES} from './arrivalRoutes.js';
import {getFinalsPlace} from './finalsCatalog.js';
import {journeyGallery} from './journeyGallery.js';
import {PLACE_IMAGE_VIEWS} from './placeImageViews.js';

export function journeyProjectStats() {
  return {
    places: RECOMMENDED_PLACE_IDS.length,
    steps: RECOMMENDED_PLACE_IDS.reduce((total,id)=>total+ARRIVAL_ROUTES[id].steps.length,0),
    photos: new Set(RECOMMENDED_PLACE_IDS.flatMap(id=>journeyGallery(getFinalsPlace(id),ARRIVAL_ROUTES[id]).map(photo=>photo.image))).size,
    models: new Set(RECOMMENDED_PLACE_IDS.flatMap(id=>PLACE_IMAGE_VIEWS[id].map(view=>view.image))).size,
  };
}
