import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WHEELCHAIR_VISIT_NEEDS,tripPreparationQuestions,visitNeedQuestion} from '../data/wheelchairVisitNeeds.js';
import {RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import {ARRIVAL_ROUTES} from '../data/arrivalRoutes.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {journeyGallery} from '../data/journeyGallery.js';
import dimensions from '../data/journeyPhotoDimensions.generated.json' with {type:'json'};
import {prepareGalleryPhotos} from './photoGalleryData.js';

test('all 10 places have three route-matched review points; selected evidence belongs to its step',()=>{
  for(const id of RECOMMENDED_PLACE_IDS){
    const route=ARRIVAL_ROUTES[id],needs=WHEELCHAIR_VISIT_NEEDS[id],photos=journeyGallery(getFinalsPlace(id),route);
    assert.equal(needs.length,3,id);
    for(const need of needs){
      assert.ok(route.steps[need.step-1],`${id}/${need.step}`);
      assert.ok(visitNeedQuestion(route,need).includes(route.steps[need.step-1].title));
      if(need.image)assert.ok(photos.some(p=>p.stepIndex===need.step-1&&p.image===need.image),`${id}: wrong-step evidence`);
    }
    assert.ok(tripPreparationQuestions(route)[0].text.includes(route.start.name));
    assert.ok(tripPreparationQuestions(route)[1].text.includes(route.destination));
  }
});

test('all real route photos open without waiting for image probes',async()=>{
  const photos=RECOMMENDED_PLACE_IDS.flatMap(id=>journeyGallery(getFinalsPlace(id),ARRIVAL_ROUTES[id]));
  let probes=0;
  const data=await prepareGalleryPhotos(photos,dimensions,()=>{probes++;throw new Error('must not probe');});
  assert.equal(probes,0);
  assert.equal(data.length,141);
  assert.ok(data.every(p=>p.width>0&&p.height>0&&!p.loadFailed));
});

test('one broken new image keeps its route number/source and does not prevent the next photo',async()=>{
  const photos=[{image:'/broken.jpg',title:'01',sourceUrl:'https://example.com/1',stepIndex:0},{image:'/ok.jpg',title:'02',stepIndex:1}];
  const data=await prepareGalleryPhotos(photos,{'/ok.jpg':{width:1600,height:900}},async()=>{throw new Error('offline');});
  assert.equal(data.length,2);
  assert.equal(data[0].loadFailed,true);
  assert.equal(data[0].sourceUrl,photos[0].sourceUrl);
  assert.equal(data[0].stepIndex,0);
  assert.equal(data[1].src,'/ok.jpg');
  assert.equal(data[1].width,1600);
});

test('new valid photo preserves portrait aspect ratio',async()=>{
  const data=await prepareGalleryPhotos([{image:'/new.jpg'}],{},async()=>({width:800,height:1200}));
  assert.equal(data[0].height/data[0].width,1.5);
});
