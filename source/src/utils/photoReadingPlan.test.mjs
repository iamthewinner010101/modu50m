import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {photoReadingPurpose,nextPhotoConnection} from '../data/photoReadingPlan.js';
import {ARRIVAL_ROUTES} from '../data/arrivalRoutes.js';
import {routeContextPhotos,photoSourceDescription} from '../data/routePhotoAlbums.js';
import additions from '../data/routePhotoAlbumsV42.json' with {type:'json'};
import photoHashes from '../data/finalsPhotoHashes.generated.json' with {type:'json'};
import {RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import {journeyProjectStats} from '../data/journeyProjectStats.js';

test('judge-facing totals count actual representative assets, not duplicate gallery entries',()=>{
  // This helper counts bus galleries and PLACE_IMAGE_VIEWS. Parking-only
  // photographs and the two dedicated Skyroad parking views are separate.
  assert.deepEqual(journeyProjectStats(),{places:10,steps:58,photos:212,models:48});
});

test('all 10 journeys offer each adjacent pair once and no invented final step',()=>{
  let count=0;
  for(const id of RECOMMENDED_PLACE_IDS){
    const route=ARRIVAL_ROUTES[id];
    route.steps.forEach((step,i)=>{
      const next=nextPhotoConnection(route,i);
      if(i===route.steps.length-1)assert.equal(next,null);
      else{assert.equal(next.to,i+1);assert.equal(next.title,route.steps[i+1].title);assert.equal(next.detail,step.next?.detail);count++;}
    });
  }
  assert.equal(count,48);
  assert.equal(nextPhotoConnection(null,0),null);
});
test('photo roles preserve unknown and comparison scopes without labelling them as a verified path',()=>{
  assert.equal(photoReadingPurpose({context:true}).kind,'context');
  assert.equal(photoReadingPurpose({image:'/modu50m/route-photos-v36/terminal-02.jpg'}).kind,'context');
  assert.match(photoReadingPurpose({image:'/modu50m/route-photos-v36/terminal-02.jpg'}).cue,/GATE 4/);
  assert.equal(photoReadingPurpose({readingPurpose:{kind:'unknown',cue:'bad'}}).kind,'scene');
  assert.equal(photoReadingPurpose({readingPurpose:{kind:'landmark',cue:'표지를 찾아요.'}}).label,'위치·방향 찾기');
  const surface=photoReadingPurpose({readingPurpose:{kind:'surface',cue:'바닥 이음새를 살펴봐요.'},continuousRouteVerified:false});
  assert.equal(surface.label,'바닥·입구 살펴보기');
  assert.equal(surface.cue,'바닥 이음새를 살펴봐요.');
});
test('dreamwalk first photo shows its own named location, not the separate entrance plaza',()=>{
  const step=ARRIVAL_ROUTES.science.steps.find(s=>s.id==='science-bus-gate');
  const photos=routeContextPhotos('science',step);
  assert.equal(photos[0].image,'/modu50m/route-photos-v44/science-dreamwalk-path-entry.jpg');
  assert.equal(photos[0].continuousRouteVerified,false);
  assert.match(photoSourceDescription(photos[0]).date,/게시 2026-07-23 · 촬영일 미상/);
});
test('accepted original assets retain provenance and a file hash usable by shared photo notes',()=>{
  const photos=Object.values(additions.science).flat();
  assert.equal(photos.length,3);
  for(const photo of photos){
    const hash=createHash('sha256').update(readFileSync(new URL(`../../public${photo.image}`,import.meta.url))).digest('hex');
    assert.equal(hash,photo.sha256);
    assert.equal(photoHashes[photo.image],hash);
    assert.ok(photo.sourceUrl.startsWith('https://blog.naver.com/storydaejeon/'));
    assert.equal(photo.capturedAt,undefined);
  }
});


test('official outdoor floor views keep their dated source and selected route binding',()=>{
  for(const [index,name] of [[4,'leeungno-official-parking-stairs-201910.jpg'],[6,'leeungno-official-door-open-floor-201910.jpg']]){
    const image='/modu50m/route-photos-v44/'+name;const step=ARRIVAL_ROUTES.leeungno.steps[index];
    // Point-bound photos are assembled through the same production gallery.
    const group=index===4?'bus-v32-side':'research-a-02';
    const source=JSON.parse(readFileSync(new URL('../data/routePhotoAlbumsV44.json',import.meta.url),'utf8')).leeungno[group];
    const photo=source.find(p=>p.image===image);assert.ok(photo);assert.equal(step.pointId,group);
    assert.equal(photoSourceDescription(photo).date,'촬영 2019-10');
    assert.equal(photo.captureDatePrecision,'month');assert.equal(photo.continuousRouteVerified,false);
    assert.equal(photo.cameraLocationVerified,false);assert.equal(photo.fieldVerified,false);
    assert.equal(photoHashes[image],createHash('sha256').update(readFileSync(new URL('../../public'+image,import.meta.url))).digest('hex'));
    assert.ok(photo.sourceUrl.startsWith('https://artsandculture.google.com/streetview/'));
  }
});
