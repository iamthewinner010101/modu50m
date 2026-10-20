import test from 'node:test';
import assert from 'node:assert/strict';
import {VISIT_SCOPES,missingConnections} from '../data/visitScopes.js';
import {getArrivalRoute,routeCoverage} from '../data/arrivalRoutes.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {TRANSPORT_ARRIVALS,arrivalCardKey,readArrivalCard,saveArrivalCard,arrivalCardText} from '../data/transportArrivals.js';
import {visitProgressKey} from './visitProgress.js';

test('10곳의 실제 자료 범위와 14개 빈 연결을 누락 없이 유지한다',()=>{
  assert.equal(Object.keys(VISIT_SCOPES).length,10);
  let count=0;
  for(const id of Object.keys(VISIT_SCOPES)){
    const route=getArrivalRoute(id),links=missingConnections(route);
    assert.equal(route.destination,VISIT_SCOPES[id].destination);
    assert.equal(links.length,routeCoverage(route).missingLinks);
    for(const link of links){assert.equal(link.to,link.from+1);assert.ok(route.steps[link.to]);}
    count+=links.length;
  }
  assert.equal(count,14);
  assert.match(getArrivalRoute('skyroad').finish,/가게/);
  assert.match(getArrivalRoute('oworld').finish,/게이트/);
});
test('다른 문과 반대편 사진은 전체 갤러리에서도 역할을 유지한다',()=>{
  const terminal=journeyGallery(getFinalsPlace('terminal'),getArrivalRoute('terminal'));
  assert.match(terminal.find(p=>p.image==='/modu50m/route-photos-v36/terminal-02.jpg').evidenceRole.label,/GATE 2/);
  const skyroad=journeyGallery(getFinalsPlace('skyroad'),getArrivalRoute('skyroad'));
  assert.match(skyroad.find(p=>p.image==='/modu50m/route-photos-v36/skyroad-02.jpg').evidenceRole.detail,/건너가라는 안내가 아니/);
});
test('대전 도착 후 카드는 기존 방문 카드와 분리되고 오래된 창은 덮어쓰지 못한다',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const oldKey=visitProgressKey('terminal',true);storage.setItem(oldKey,'existing bus route');
  const initial=readArrivalCard(storage,'terminal',true);
  const saved=saveArrivalCard(storage,'terminal',true,{arrival:'10월 1일 도착',onward:'시내버스',question:'동관에서 정류장까지?'},initial.raw);
  assert.equal(saved.continuousRouteVerified,false);assert.equal(saved.intent,'arrival');
  assert.equal(storage.getItem(oldKey),'existing bus route');
  assert.notEqual(arrivalCardKey('terminal',true),arrivalCardKey('terminal'));
  assert.equal(readArrivalCard(storage,'terminal',true).question,'동관에서 정류장까지?');
  assert.throws(()=>saveArrivalCard(storage,'terminal',true,saved,null),/다른 창/);
  assert.equal(readArrivalCard(storage,'station',true).raw,null);
});
test('도착 후 파일은 동관 출발과 출처를 포함하며 기존 정류장 경로를 뒤집지 않는다',()=>{
  const text=arrivalCardText('terminal',{arrival:'',onward:'시내버스',question:'문턱 확인'},{name:'터미널 안내',phone:'1668-3300'});
  assert.match(text,/동관 1층 하차장/);assert.match(text,/facility_east/);assert.match(text,/연속 이동은 확인 전/);
  assert.ok(TRANSPORT_ARRIVALS.station.steps.every(step=>!step.pointId));
  assert.ok(TRANSPORT_ARRIVALS.terminal.steps.every(step=>!step.pointId));
});
