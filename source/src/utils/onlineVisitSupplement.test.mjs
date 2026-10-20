import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import photos from '../data/routePhotoAlbumsV40.json' with {type:'json'};
import dimensions from '../data/journeyPhotoDimensions.generated.json' with {type:'json'};
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {saveVisitProgress,readVisitProgress} from './visitProgress.js';
import {renderOfflineVisitCard,collectOfflineImages} from './offlineVisitCard.js';

test('보완 사진 23장의 출처를 보존하고 현재 동선 21장과 옛 주차장 비교 2장을 구분한다',()=>{
  assert.equal(Object.keys(photos).length,10);let total=0,active=0,retired=0;const hashes=new Set();
  for(const [place,groups] of Object.entries(photos)){
    const route=getArrivalRoute(place),gallery=journeyGallery(getFinalsPlace(place),route);
    for(const [point,items] of Object.entries(groups)){
      const step=route.steps.findIndex(s=>s.pointId===point||'step:'+s.id===point);const retiredParking=place==='museum'&&point==='bus-v32-side';
      assert.ok(step>=0||retiredParking);
      for(const p of items){
        total++;
        if(retiredParking){
          retired++;assert.ok(!gallery.some(g=>g.image===p.image),'retired parking image must not become the selected ramp');
          assert.match(p.scope,/車|차량|주차/);
        }else{active++;assert.ok(gallery.some(g=>g.stepIndex===step&&g.image===p.image));}
        assert.equal(createHash('sha256').update(readFileSync(new URL('../../public'+p.image,import.meta.url))).digest('hex'),p.sourceSha256);
        assert.ok(!hashes.has(p.sourceSha256),'same new file counted twice');hashes.add(p.sourceSha256);
        if(retiredParking)assert.equal(dimensions[p.image],undefined);else assert.ok(dimensions[p.image].width>=768);assert.match(p.sourceUrl,/^https:\/\/(map.naver.com|map.kakao.com|k-mice.visitkorea.or.kr)\//);
        assert.ok(p.scope&&p.evidenceRole.detail);assert.equal(p.fieldVerified,false);assert.equal(p.continuousRouteVerified,false);assert.equal(p.mapBindingVerified,false);
      }
    }
  }
  assert.equal(total,23);assert.equal(active,21);assert.equal(retired,2);
  assert.match(photos.terminal['bus-v32-door'][0].title,/서관 GATE 4/);
});

test('이전 기록을 읽고 이동 조건을 보관하며 오래된 창의 덮어쓰기를 막는다',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const route=getArrivalRoute('arboretum');
  storage.setItem('qa',JSON.stringify({schema:'modu50m.visit-progress.v1',placeId:'arboretum',question:'원래 질문',reviewed:[route.steps[0].id]}));
  const old=readVisitProgress(storage,'qa',route);assert.equal(old.preferences.width,'');
  const saved=saveVisitProgress(storage,'qa',route,{...old,preferences:{wheelchair:'전동',width:'65cm',returnPlan:'귀가 정류장 번호 살펴보기'}},old.raw);
  const loaded=readVisitProgress(storage,'qa',route);assert.equal(loaded.preferences.width,'65cm');assert.equal(loaded.question,'원래 질문');assert.equal(loaded.reviewed.length,1);
  assert.throws(()=>saveVisitProgress(storage,'qa',route,saved,old.raw),/다른 창/);
  assert.throws(()=>saveVisitProgress(storage,'qa',route,{...saved,preferences:{width:'가'.repeat(41)}},saved.raw),/방문 조건/);
  assert.equal(storage.getItem('qa'),saved.raw);
});

test('사진 카드에는 번호·시기·사진 역할·개인 질문이 들어가며 외부 코드는 실행되지 않는다',()=>{
  const route=getArrivalRoute('terminal'),gallery=journeyGallery(getFinalsPlace('terminal'),route);
  const images=Object.fromEntries(gallery.map(p=>[p.image,'data:image/jpeg;base64,YQ==']));
  const html=renderOfflineVisitCard({card:{placeName:'대전복합터미널',question:'<script>alert(1)</script>',preferences:{width:'65cm'},savedAt:'2026-09-30'},route,photos:gallery,images});
  assert.match(html,/서관 GATE 4/);assert.match(html,/2026-04-03/);assert.match(html,/GATE 2/);assert.match(html,/65cm/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
  assert.equal((html.match(/<img /g)||[]).length,gallery.length);assert.ok(!html.includes('<img src="http'));
  delete images[gallery[0].image];assert.throws(()=>renderOfflineVisitCard({card:{},route,photos:gallery,images}),/일부 사진/);
});

test('사진 보관은 중복 파일을 한 번만 받고 실패를 숨기지 않는다',async()=>{
  let calls=0;const input=[{image:'/a.jpg'},{image:'/a.jpg'},{image:'/b.jpg'}];
  const result=await collectOfflineImages(input,{fetchImage:async()=>{calls++;return {ok:true,blob:async()=>new Blob(['photo'],{type:'image/jpeg'})};},encode:async()=> 'data:image/jpeg;base64,YQ=='});
  assert.equal(calls,2);assert.equal(Object.keys(result).length,2);
  await assert.rejects(()=>collectOfflineImages([{image:'/missing.jpg'}],{fetchImage:async()=>({ok:false})}),/멈췄어요/);
  await assert.rejects(()=>collectOfflineImages([{image:'https://unexpected.example/photo.jpg'}]),/로컬 사진/);
});
