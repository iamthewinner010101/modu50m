import test from 'node:test';
import assert from 'node:assert/strict';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {ARRIVAL_ROUTES} from '../data/arrivalRoutes.js';
import {journeyGallery} from '../data/journeyGallery.js';

test('한 사진을 공유하는 경사로와 출입문도 이어보기에서 마지막 구간 번호를 유지한다', () => {
  const route=ARRIVAL_ROUTES.hanbit, site=getFinalsPlace('hanbit');
  const gallery=journeyGallery(site,route);
  const entrance=gallery.filter(p=>p.stepIndex===route.steps.length-1);
  assert.ok(entrance.length>0);
  assert.match(entrance[0].stepTitle,/^07 /);
  assert.ok(gallery.some(p=>p.stepIndex===5&&p.image===entrance[0].image));
  assert.equal(new Set(gallery.filter(p=>p.stepIndex===6).map(p=>p.image)).size,entrance.length);
});

 test('과학관 갈림길 사진은 열차길부터 문까지 순서대로 보이고 같은 08번 댓글에 연결된다',()=>{
  const route=ARRIVAL_ROUTES.science,site=getFinalsPlace('science');
  const gallery=journeyGallery(site,route), group=gallery.filter(p=>p.stepIndex===7);
  assert.deepEqual(group.slice(0,7).map(p=>p.image),route.steps[7].photoOrder);
  assert.ok(group.every(p=>p.stepTitle.startsWith('08 ')));
  assert.ok(gallery.some(p=>p.stepIndex===8&&p.image==='/modu50m/route-photos-v36/science-02.jpg'));
  const plain=structuredClone(route);delete plain.steps[7].photoOrder;
  assert.deepEqual(gallery.filter(p=>p.stepIndex!==7),journeyGallery(site,plain).filter(p=>p.stepIndex!==7));
  assert.equal(route.steps[7].next.fieldVerified,false);
 });
