import test from 'node:test';

import assert from 'node:assert/strict';

import {ARRIVAL_ROUTES,PARKING_ROUTES,buildWalkingTopology,walkingConnection,walkingNodeId} from '../data/arrivalRoutes.js';
import {createMiniatureImageLoader,prepareMiniatureViews} from '../data/miniatureImageViews.js';

import {ARRIVAL_STEP_GUIDES,arrivalStepGuide} from '../data/arrivalStepGuides.js';

import {missingConnections} from '../data/visitScopes.js';



test('all bus and parking steps have cues keyed to their stable route IDs',()=>{
  assert.equal(Object.keys(ARRIVAL_STEP_GUIDES).length,10);
  const distinct=new Set();let busCount=0,parkingCount=0;
  for(const [id,cues] of Object.entries(ARRIVAL_STEP_GUIDES)){
    const routes=[ARRIVAL_ROUTES[id],PARKING_ROUTES[id]].filter(Boolean);
    const expected=new Set(routes.flatMap(route=>route.steps.map(step=>step.id)));
    assert.deepEqual(Object.keys(cues).sort(),[...expected].sort(),id);
    for(const route of routes)route.steps.forEach((step,index)=>{
      const guide=arrivalStepGuide(route,index);
      for(const key of ['direction','landmark','inspect'])assert.ok(guide[key]?.trim(),`${id}/${step.id}/${key}`);
      assert.equal(guide.total,route.steps.length);
      assert.equal(guide.number,String(index+1).padStart(2,'0'));
      assert.equal(guide.next,route.steps[index+1]||null);
      distinct.add(id+'/'+step.id);
      if(route.arrival==='parking')parkingCount++;else busCount++;
    });
  }
  assert.equal(busCount,58);assert.equal(parkingCount,44);assert.equal(distinct.size,70);
});

test('guide preserves connection uncertainty and chosen entrance without upgrading evidence',()=>{

  let gaps=0;

  for(const id of Object.keys(ARRIVAL_STEP_GUIDES)){

    const route=ARRIVAL_ROUTES[id],before=JSON.stringify(route);

    for(const link of missingConnections(route)){

      const guide=arrivalStepGuide(route,link.from);

      assert.equal(guide.connection,route.steps[link.from].next||null);

      gaps++;

    }

    const last=arrivalStepGuide(route,route.steps.length-1);

    assert.equal(last.next,null);

    assert.equal(last.finish,route.finish);

    assert.equal(route.continuousRouteVerified,false);

    assert.equal(JSON.stringify(route),before);

  }

  // Current seven gaps come from reviewed route data, replacing the old fourteen.

  assert.equal(gaps,7);

  assert.deepEqual(Object.keys(ARRIVAL_STEP_GUIDES).map(id=>ARRIVAL_ROUTES[id]).flatMap(route=>missingConnections(route).map(link=>route.steps[link.from].id)).sort(),['parking-ramp','museum-bus-corner','leeungno-bus-south','science-bus-walk','science-bus-gate','science-bus-plaza','station-bus-square'].sort());

});



test('station, terminal and science cues retain their exact destination distinctions',()=>{

  assert.match(ARRIVAL_STEP_GUIDES.station['station-bus-door'].landmark,/도시철도 4번 계단/);

  assert.match(ARRIVAL_STEP_GUIDES.station['station-bus-door'].inspect,/계단.*실내 승강기/);

  assert.match(ARRIVAL_STEP_GUIDES.terminal['terminal-bus-door'].landmark,/GATE 4/);

  assert.match(ARRIVAL_STEP_GUIDES.science['science-bus-door'].landmark,/미래기술관/);

  assert.match(ARRIVAL_STEP_GUIDES.sungsim['sungsim-bus-door'].direction,/480번길 15/);

});



test('missing or out-of-range selections render no guide',()=>{

  assert.equal(arrivalStepGuide(null,0),null);

  assert.equal(arrivalStepGuide(ARRIVAL_ROUTES.hanbit,-1),null);

  assert.equal(arrivalStepGuide(ARRIVAL_ROUTES.hanbit,7),null);

});

test('walking topology preserves shared locations and all 82 evidence records without metre claims',()=>{
  const graph=buildWalkingTopology();
  assert.deepEqual(graph.counts,{places:10,journeys:20,stages:102,locations:70,connections:82,
    evidenceCounts:{'map-reviewed':46,'source-described':15,'same-scene':4,gap:17}});
  const nodes=new Map(graph.nodes.map(node=>[node.id,node]));
  assert.equal(nodes.size,70);
  for(const link of graph.links){
    assert.ok(nodes.has(link.from)&&nodes.has(link.to));
    assert.equal(nodes.get(link.from).placeId,nodes.get(link.to).placeId);
    assert.equal(link.measuredDistanceM,null);assert.equal(link.coordinateAccuracyM,null);
    assert.equal(link.traversalVerified,false);
  }
  for(const journey of graph.journeys){
    assert.equal(journey.links.length,journey.nodes.length-1);
    journey.links.forEach((id,index)=>{
      const link=graph.links.find(item=>item.id===id);
      assert.equal(link.from,journey.nodes[index]);assert.equal(link.to,journey.nodes[index+1]);
    });
    const last=nodes.get(journey.nodes.at(-1));
    assert.ok(last.occurrences.some(item=>item.routeId===journey.id&&item.destination===journey.destination));
  }
  const door=nodes.get(walkingNodeId('station','station-bus-door'));
  assert.equal(door.occurrences.length,2);
  assert.match(door.occurrences[0].destination,/4번/);
  const terminal=walkingConnection(PARKING_ROUTES.terminal,1);
  assert.equal(terminal.kind,'level-change');assert.equal(terminal.fromLevel,5);assert.equal(terminal.toLevel,1);
  assert.equal(terminal.status,'gap');
  assert.equal(walkingConnection(PARKING_ROUTES.terminal,-1),null);
  assert.equal(walkingConnection(PARKING_ROUTES.terminal,0.5),null);
});

test('angle preparation waits for decoding, uses URL identity, and retries failure',async()=>{
  const images=[];
  const load=createMiniatureImageLoader({createImage:()=>{
    const image={decode:()=>image.decoded};
    image.decoded=new Promise(resolve=>image.finishDecode=resolve);
    images.push(image);return image;
  },timeoutMs:1000});
  const first=load('/hanbit/original.png');
  assert.equal(load('/hanbit/original.png'),first);assert.equal(images.length,1);
  let done=false;first.then(()=>done=true);
  images[0].onload();await Promise.resolve();assert.equal(done,false);
  images[0].finishDecode();await first;assert.equal(done,true);
  const other=load('/museum/original.png');assert.equal(images.length,2);
  images[1].onerror();await assert.rejects(other,/LOAD_FAILED/);
  const retry=load('/museum/original.png');assert.equal(images.length,3);
  images[2].onload();images[2].finishDecode();await retry;
  assert.equal(images[2].onload,null);assert.equal(images[2].onerror,null);
});

test('cancelled angle preparation does not update another place or launch more images',async()=>{
  let stopped=false;const pending=[],updates=[];
  const work=prepareMiniatureViews([0,1,2,3,4].map(i=>({image:`/${i}.png`})),
    (...item)=>updates.push(item),{cancelled:()=>stopped,load:()=>new Promise(resolve=>pending.push(resolve))});
  assert.equal(pending.length,2);stopped=true;pending.forEach(resolve=>resolve(true));await work;
  assert.equal(pending.length,2);assert.deepEqual(updates,[]);
});

