import test from 'node:test';
import assert from 'node:assert/strict';
import {ARRIVAL_ROUTES,PARKING_ROUTES,getArrivalRoute} from '../data/arrivalRoutes.js';
import {RECOMMENDED_PLACE_IDS} from '../data/recommendedJourneys.js';
import {getFinalsPlace} from '../data/finalsCatalog.js';
import {journeyGallery} from '../data/journeyGallery.js';
import {ARRIVAL_LOCATIONS,arrivalLocationOptions,arrivalLocationLink,readArrivalLocation,questionBoardThreads,arrivalPreparationQuestions,nearbyArrivalContext,readJourneyLocation, journeyLocationUrl, requestedJourneyPhoto} from './journeyLocation.js';
import {existsSync} from 'node:fs';

test('택시승강장 2곳과 장애인 지정주차 사진 2곳을 서로 다른 자료로 제공한다',()=>{
  assert.equal(arrivalLocationOptions('taxi').length,2);
  assert.equal(arrivalLocationOptions('parking').length,2);
  assert.equal(arrivalLocationOptions('unknown').length,0);
  assert.equal(ARRIVAL_LOCATIONS.find(item=>item.id==='skyroad-accessible-bay').sourceDate,'2023-08-01');
  for(const item of ARRIVAL_LOCATIONS){
    assert.ok(item.address&&item.title&&item.sourceUrl.startsWith('https://'));
    if(item.kind==='taxi'){assert.equal(item.sourceDate,'2020-12-31');assert.equal(item.focus,undefined);}
    else{const publicPath=item.image.replace(/^\/modu50m/,'');assert.ok(existsSync(new URL(`../../public${publicPath}`,import.meta.url))||existsSync(new URL(`../../..${publicPath}`,import.meta.url)));assert.ok(item.focus.every(n=>n>=0&&n<=100));}
  }
});

test('위치 자료 링크는 기존 단계·사진을 섞지 않고 별도 항목을 복원한다',()=>{
  for(const item of ARRIVAL_LOCATIONS){
    const url=arrivalLocationLink('http://localhost/?qa=1&place=hanbit&step=tower-door&routePhoto=old&comments=1',item);
    assert.equal(url.searchParams.get('qa'),'1');
    assert.equal(url.searchParams.get('place'),item.placeId);
    assert.equal(readArrivalLocation(url.search,item.placeId)?.id,item.id);
    assert.equal(readArrivalLocation(url.search,'not-the-place'),null);
    assert.equal(url.searchParams.has('step'),false);
    assert.equal(url.searchParams.has('routePhoto'),false);
  }
  assert.equal(readArrivalLocation('?arrivalLocation=unknown','museum'),null);
  assert.throws(()=>arrivalLocationLink('http://localhost/',{id:'unknown'}));
});

test('장소 게시판은 다른 단계의 질문과 답글 없는 질문을 구별한다',()=>{
  const notes=[{id:'a',step:'one',kind:'question',body:'택시 하차 위치',nickname:'이웃'},
    {id:'b',step:'two',kind:'question',body:'장애인 주차구역',nickname:'이웃'},
    {id:'c',step:'two',kind:'tip',body:'알려줄 점',nickname:'이웃'},
    {id:'r',step:'one',kind:'tip',body:'답글',parent:'a',nickname:'이웃'}];
  assert.deepEqual(questionBoardThreads(notes,{step:'one'}).map(n=>n.id),['a']);
  assert.deepEqual(questionBoardThreads(notes,{scope:'place'}).map(n=>n.id),['a','b','c']);
  assert.deepEqual(questionBoardThreads(notes,{scope:'place',filter:'question'}).map(n=>n.id),['a','b']);
  assert.deepEqual(questionBoardThreads(notes,{scope:'place',filter:'unanswered'}).map(n=>n.id),['b']);
  assert.deepEqual(questionBoardThreads(notes,{scope:'place',query:' 주차 '}).map(n=>n.id),['b']);
  assert.deepEqual(questionBoardThreads(notes,{scope:'place',query:'없는 검색'}),[]);
});

test('대표 10곳의 모든 구간·사진·댓글 링크를 같은 구간으로 다시 읽는다', () => {
  let stops = 0;
  for (const id of RECOMMENDED_PLACE_IDS) {
    const route = ARRIVAL_ROUTES[id], gallery = journeyGallery(getFinalsPlace(id), route);
    route.steps.forEach((step, index) => {
      const photos = gallery.filter(photo => photo.stepIndex === index);
      assert.ok(photos.length, `${id} ${step.id} 사진`);
      for (const photo of photos) {
        const url = journeyLocationUrl('http://localhost:8810/?qa=1&old=value', route, index, {photo:photo.image, comments:true});
        const location = readJourneyLocation(url.search, route);
        assert.equal(location.index, index);
        assert.equal(location.comments, true);
        assert.equal(url.searchParams.get('qa'), '1');
        assert.deepEqual(requestedJourneyPhoto(location, gallery), {image:photo.image, stepIndex:index});
        if (step.pointId) assert.equal(url.searchParams.get('point'), step.pointId);
        else assert.equal(url.searchParams.has('point'), false);
      }
      stops++;
    });
  }
  assert.equal(stops, 58);
});

test('다른 장소·없는 구간·다른 구간의 사진을 위치 링크로 받아들이지 않는다', () => {
  const route = ARRIVAL_ROUTES.hanbit;
  assert.equal(readJourneyLocation('?place=arboretum&step=research-stop', route), null);
  assert.equal(readJourneyLocation('?place=hanbit&step=missing', route), null);
  const gallery = journeyGallery(getFinalsPlace('hanbit'), route);
  assert.equal(requestedJourneyPhoto({index:0, photo:'https://outside.example/photo.jpg'}, gallery), null);
  const unrelated = gallery.find(photo => !gallery.some(first => first.stepIndex === 0 && first.image === photo.image));
  assert.equal(requestedJourneyPhoto({index:0, photo:unrelated.image}, gallery), null);
  assert.throws(() => journeyLocationUrl('http://localhost/', route, -1));
});

test('같은 사진을 쓰는 한빛탑 경사로·출입문 링크의 마지막 번호를 구분한다', () => {
  const route = ARRIVAL_ROUTES.hanbit, gallery = journeyGallery(getFinalsPlace('hanbit'), route);
  const photo = gallery.find(item => item.stepIndex === 6 && gallery.some(other => other.stepIndex === 5 && other.image === item.image));
  assert.ok(photo);
  const ramp = journeyLocationUrl('http://localhost/', route, 5, {photo:photo.image});
  const door = journeyLocationUrl('http://localhost/', route, 6, {photo:photo.image});
  assert.notEqual(ramp.href, door.href);
  assert.equal(readJourneyLocation(door.search, route).index, 6);
});

test('20개 버스·주차 구성은 유지하고 없는 택시 경로를 버스 경로로 반환하지 않는다',()=>{
  let steps=0;
  for(const id of RECOMMENDED_PLACE_IDS){
    assert.equal(getArrivalRoute(id,'bus'),ARRIVAL_ROUTES[id]);
    assert.equal(getArrivalRoute(id,'parking'),PARKING_ROUTES[id]);
    assert.equal(getArrivalRoute(id,'taxi'),null);
    assert.equal(getArrivalRoute(id,'unknown'),null);
    steps+=ARRIVAL_ROUTES[id].steps.length+PARKING_ROUTES[id].steps.length;
  }
  assert.equal(steps,102);
});

test('예술의전당 뒤편 주차장 의견은 시설 구분으로 남기고 미술관 주차 경로와 합치지 않는다',()=>{
  assert.match(nearbyArrivalContext('museum').summary,/면담에서 알려 준 곳은 대전예술의전당 뒤편 주차장/);
  assert.match(nearbyArrivalContext('museum').summary,/공공자료의 택시승강장과는 구분/);
  assert.equal(nearbyArrivalContext('arboretum'),null);
  assert.match(PARKING_ROUTES.museum.start.name,/시립미술관 쪽/);
  assert.match(PARKING_ROUTES.museum.approachNote,/같은 출발 지점이나 연결된 길로 표시하지/);
});

test('택시 준비 질문은 목적지별 문의이며 가짜 경로·주차 기록을 생성하지 않는다',()=>{
  for(const id of RECOMMENDED_PLACE_IDS){
    const route=ARRIVAL_ROUTES[id],before=JSON.stringify(route);
    const questions=arrivalPreparationQuestions(route);
    assert.equal(questions.length,3);
    assert.ok(questions.every(item=>item.text.includes(route.destination)&&item.text.startsWith('[택시 하차 준비]')));
    assert.equal(JSON.stringify(route),before);
  }
});

test('주차장 마지막 단계의 QR 대상 링크는 사진과 출발 방식, 검사 격리를 유지한다',()=>{
  for(const id of RECOMMENDED_PLACE_IDS){
    const route=PARKING_ROUTES[id],index=route.steps.length-1;
    const gallery=journeyGallery(getFinalsPlace(id),route),photo=gallery.find(p=>p.stepIndex===index);
    const url=journeyLocationUrl('https://modu50m.vercel.app/?qa=1',route,index,{photo:photo.image});
    assert.equal(url.searchParams.get('arrival'),'parking');
    assert.equal(url.searchParams.get('qa'),'1');
    assert.equal(readJourneyLocation(url.search,route).index,index);
    assert.equal(requestedJourneyPhoto(readJourneyLocation(url.search,route),gallery).image,photo.image);
  }
});
