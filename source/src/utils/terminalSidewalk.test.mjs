import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {getPhotoReview} from '../data/wheelchairPhotoReview.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {observationsForPhoto} from './previsitQuestions.js';
import {sceneEvidence} from './photoNotebook.js';
import sources from '../../public/route-photos-v41/sources.json' with {type:'json'};

test('서관 보도 기본 사진은 교체되고 차도 중앙의 이전 표시는 다른 사진에 남지 않는다',()=>{
  const site=getFinalsPlace('terminal'),review=getPhotoReview(site,'bus-v32-walk');
  assert.equal(site.photos['bus-v32-walk'].image,'/modu50m/route-photos-v41/kakao-1201601985-h265.jpg');
  assert.equal(review.sourceSha256,site.photos['bus-v32-walk'].sourceSha256);
  assert.equal(review.kind,'segment');assert.equal(review.observations.length,3);
  for(const point of ['bus-v32-walk','bus-v32-door'])assert.equal(sceneEvidence(site,point).sha256,site.photos[point].sourceSha256);
  const gallery=journeyGallery(site,getArrivalRoute('terminal'));
  const old=gallery.find(p=>p.image==='/modu50m/bus-v32/terminal-westwalk-350.jpg');
  assert.equal(old.stepIndex,3);assert.deepEqual(observationsForPhoto(old,review),[]);
  assert.match(old.evidenceRole.label,/방향 참고/);
  assert.ok(gallery.filter(p=>p.stepIndex===3).every(p=>p.viewLabel));
});

test('추가 사진 6장은 파일·출처·구간이 일치하고 게시일을 촬영일로 바꾸지 않는다',()=>{
  const gallery=journeyGallery(getFinalsPlace('terminal'),getArrivalRoute('terminal'));
  assert.equal(sources.length,6);
  for(const p of sources){
    assert.equal(createHash('sha256').update(readFileSync(new URL('../../public'+p.image,import.meta.url))).digest('hex'),p.sourceSha256);
    const actual=gallery.find(x=>x.image===p.image);assert.ok(actual);
    assert.equal(actual.stepIndex,p.provider==='blog'||p.image.includes('1973')?4:3);
    assert.deepEqual(actual.observations,p.observations);
    assert.equal(p.continuousRouteVerified,false);assert.equal(p.fieldVerified,false);
    if(p.provider==='blog'){assert.ok(p.publishedAt);assert.ok(!p.captureDate&&!p.capturedAt);}
  }
  const close=gallery.find(p=>p.image==='/modu50m/route-photos-v41/tistory-0.jpg');
  assert.match(close.credit,/게시 2023-06-20 · 촬영일 미상/);
  assert.match(close.title,/GATE 4/);
});
