import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutPhotoMarkers} from './photoMarkerLayout.js';
import {ARRIVAL_ROUTES} from '../data/arrivalRoutes.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import dimensions from '../data/journeyPhotoDimensions.generated.json' with {type:'json'};

function check(markers,width,height) {
  const valid=markers.filter(Boolean);
  for(const m of valid) {
    assert.ok(m.center[0]>=22&&m.center[0]<=width-22);
    assert.ok(m.center[1]>=22&&m.center[1]<=height-22);
  }
  for(let a=0;a<valid.length;a++)for(let b=a+1;b<valid.length;b++) {
    assert.ok(Math.abs(valid[a].center[0]-valid[b].center[0])>=50-1e-6||Math.abs(valid[a].center[1]-valid[b].center[1])>=50-1e-6,'44px buttons require separation');
  }
}
test('two Skyroad buttons stay separate while original points remain exact',()=>{
  const items=[{position:[88,83]},{position:[77,86]}];
  const original=structuredClone(items),markers=layoutPhotoMarkers(items,340,255);
  check(markers,340,255);assert.deepEqual(items,original);
  markers.forEach((m,i)=>assert.deepEqual(m.anchor,[items[i].position[0]*340/100,items[i].position[1]*255/100]));
  assert.ok(markers[1].shifted);
});
test('coincident and edge points have distinct in-photo buttons without losing anchors',()=>{
  const items=[{position:[0,0]},{position:[0,0]},{position:[100,100]},{position:[100,100]}];
  const markers=layoutPhotoMarkers(items,288,144);check(markers,288,144);
  assert.deepEqual(markers.map(m=>m.anchor),[[0,0],[0,0],[288,144],[288,144]]);
});
test('resizing keeps all currently registered photo observations usable',()=>{
  let photos=0,conditions=0;
  for(const id of RECOMMENDED_PLACE_IDS)for(const photo of journeyGallery(getFinalsPlace(id),ARRIVAL_ROUTES[id])) {
    if(!photo.observations?.some(o=>o.position))continue;
    const d=dimensions[photo.image];assert.ok(d,photo.image);photos++;
    for(const width of [288,340,900]) {
      const height=width*d.height/d.width;
      check(layoutPhotoMarkers(photo.observations,width,height),width,height);conditions++;
    }
  }
  assert.ok(photos>=RECOMMENDED_PLACE_IDS.length);assert.equal(conditions,photos*3);
});
test('missing size and observations do not invent locations',()=>{
  const items=[{label:'unknown'},{position:[25,50]}];
  const markers=layoutPhotoMarkers(items,0,0);
  assert.equal(markers[0],null);assert.deepEqual(markers[1].position,[25,50]);assert.equal(markers[1].anchor,null);
});
