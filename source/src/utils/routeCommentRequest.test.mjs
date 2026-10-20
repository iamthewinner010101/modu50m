import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, dirname, basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {readRouteComments,requestRouteComments} from './routeCommentRequest.js';
import {createRouteCommentsHandler, routeCommentCatalog} from '../../server/route-comments.mjs';

async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {await run(`http://127.0.0.1:${server.address().port}`);}
  finally {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
}

test('댓글 응답 헤더가 오지 않아도 기한 뒤 대기를 끝내며 자동으로 다시 요청하지 않는다', async () => {
  let requests = 0;
  await withServer((request, response) => {
    if (request.url === '/ready') {
      response.end('ready');
      return;
    }
    requests++;
  }, async base => {
    // Establish the local HTTP connection before measuring a stalled response.
    // Otherwise cold-start DNS/socket work can consume the deadline first.
    await (await fetch(`${base}/ready`)).text();
    const before = Date.now();
    await assert.rejects(requestRouteComments(base, {}, {timeoutMs:450}), error => error.code === 'ROUTE_COMMENTS_TIMEOUT' && /새로고침/.test(error.message));
    assert.ok(Date.now() - before < 5000);
    assert.equal(requests, 1);
  });
});

test('응답 헤더 뒤 JSON이 멈추어도 같은 기한을 적용하고 다시 불러올 수 있다', async () => {
  let requests = 0;
  await withServer((_request, response) => {
    requests++;
    response.writeHead(200, {'Content-Type':'application/json'});
    if (requests === 1) {response.flushHeaders(); response.write('{"notes":');}
    else response.end(JSON.stringify({storage:'shared-server', notes:[]}));
  }, async base => {
    await assert.rejects(requestRouteComments(base, {}, {timeoutMs:450}), {code:'ROUTE_COMMENTS_TIMEOUT'});
    assert.deepEqual(await requestRouteComments(base), {storage:'shared-server', notes:[]});
    assert.equal(requests, 2, 'Second request is an explicit refresh, not an automatic retry');
  });
});

test('저장은 끝났지만 응답이 늦으면 결과를 확정하지 않고 같은 요청 번호로 확인해 중복을 막는다', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'modu50m-comment-timeout-'));
  const handler = createRouteCommentsHandler({databasePath:join(directory, 'qa.sqlite')});
  let holdPostResponse = true, postRequests = 0, storedResolve;
  const stored = new Promise(resolve => {storedResolve = resolve;});
  try {
    await withServer((request, response) => {
      if (request.method === 'POST') {
        postRequests++;
        if (holdPostResponse) {
          holdPostResponse = false;
          response.writeHead = () => response;
          response.end = () => {storedResolve(); return response;};
        }
      }
      void handler(request, response, new URL(request.url, 'http://localhost'));
    }, async base => {
      const endpoint = `${base}/api/route-comments?place=arboretum&qa=1`;
      const initial = await fetch(endpoint);
      const cookie = initial.headers.get('set-cookie').split(';')[0];
      await initial.json();
      const step = Object.keys(routeCommentCatalog.arboretum)[0];
      const payload = Object.freeze({step, body:'[자동 점검] 이 위치의 보도 경계를 더 보고 싶어요.', nickname:'기능 점검', kind:'question', parent:null, photo:routeCommentCatalog.arboretum[step][0].image, requestKey:randomUUID()});
      const options = {method:'POST', headers:{Cookie:cookie}, body:JSON.stringify(payload)};
      const outcome = requestRouteComments(endpoint, options, {timeoutMs:900});
      const rejected = assert.rejects(outcome, error => error.code === 'ROUTE_COMMENTS_TIMEOUT' && /저장 결과를 확인하지 못/.test(error.message));
      await stored;
      await rejected;
      assert.equal(postRequests, 1, 'A timeout never resends a write');
      const readback = await requestRouteComments(endpoint, {headers:{Cookie:cookie}});
      assert.equal(readback.notes.length, 1);
      assert.equal(readback.notes[0].body, payload.body);
      assert.equal(readback.notes[0].step, step);
      assert.equal(readback.notes[0].photo, payload.photo);
      const retry = await requestRouteComments(endpoint, options);
      assert.equal(retry.id, readback.notes[0].id);
      assert.equal(retry.notes.length, 1, 'The retained request key identifies the same saved note');
      assert.deepEqual(options.body, JSON.stringify(payload));
      assert.equal((await requestRouteComments(`${base}/api/route-comments?place=arboretum`, {headers:{Cookie:cookie}})).notes.length, 0, 'Isolated QA test never creates a live note');
    });
  } finally {
    handler.close();
    const target = resolve(directory);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith('modu50m-comment-timeout-'));
    rmSync(target, {recursive:true, force:true});
  }
});

test('서버가 보낸 입력 오류와 손상된 응답을 구분하고 빠른 정상 응답을 보존한다', async () => {
  await withServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/invalid') {response.writeHead(400); response.end(JSON.stringify({error:'같은 위치를 선택해 주세요.'}));}
    else if (request.url === '/broken') response.end('{broken');
    else response.end(JSON.stringify({id:'saved', notes:[]}));
  }, async base => {
    await assert.rejects(requestRouteComments(`${base}/invalid`), {message:'같은 위치를 선택해 주세요.'});
    await assert.rejects(requestRouteComments(`${base}/broken`), {message:'댓글 서버의 응답을 확인하지 못했어요.'});
    assert.deepEqual(await requestRouteComments(base), {id:'saved', notes:[]});
  });
});

test('최신 AbortSignal 정적 기능이 없어도 실제 HTTP 댓글을 읽고 응답 지연을 끝낸다', async () => {
  const original = Object.fromEntries(['timeout','any'].map(name => [name,Object.getOwnPropertyDescriptor(AbortSignal,name)]));
  let requests = 0;
  try {
    for (const name of ['timeout','any']) Object.defineProperty(AbortSignal,name,{value:undefined,configurable:true});
    await withServer((request,response) => {
      requests++;
      if (request.url === '/waiting') return;
      response.setHeader('Content-Type','application/json');
      response.end(JSON.stringify({storage:'shared-server',notes:[]}));
    }, async base => {
      const caller = new AbortController();
      const seen = [];
      const fetchImpl = (url,options) => {seen.push(options.signal); return fetch(url,options);};
      assert.deepEqual(await requestRouteComments(base,{signal:caller.signal},{fetchImpl,timeoutMs:450}),{storage:'shared-server',notes:[]});
      caller.abort();
      await new Promise(resolve => setTimeout(resolve,500));
      assert.equal(seen[0].aborted,false,'Finished reads no longer retain the deadline or caller listener');
      await assert.rejects(requestRouteComments(`${base}/waiting`,{},{timeoutMs:450}),{code:'ROUTE_COMMENTS_TIMEOUT'});
      assert.equal(requests,2,'One completed read and one stalled read, without an automatic retry');
    });
  } finally {for (const [name,descriptor] of Object.entries(original)) Object.defineProperty(AbortSignal,name,descriptor);}
});

test('이미 취소한 요청은 서버에 보내지 않고 JSON 중 취소도 시간 초과와 구분한다', async () => {
  let requests = 0, startedResolve;
  const started = new Promise(resolve => {startedResolve = resolve;});
  await withServer((_request,response) => {
    requests++;
    response.writeHead(200,{'Content-Type':'application/json'});
    response.flushHeaders();
    response.write('{"notes":');
    startedResolve();
  }, async base => {
    const stopped = new AbortController();
    stopped.abort();
    await assert.rejects(requestRouteComments(base,{signal:stopped.signal}),error => error.name === 'AbortError' && error.code !== 'ROUTE_COMMENTS_TIMEOUT');
    assert.equal(requests,0);
    const caller = new AbortController();
    const pending = requestRouteComments(base,{signal:caller.signal},{timeoutMs:5000});
    const rejected = assert.rejects(pending,error => error.name === 'AbortError' && error.code !== 'ROUTE_COMMENTS_TIMEOUT');
    await started;
    caller.abort();
    await rejected;
    assert.equal(requests,1);
  });
});

test('첫 댓글 읽기만 늦으면 한 번 다시 읽어 연결하고 쓰기 요청은 보내지 않는다', async () => {
  const methods = [];
  await withServer((request,response) => {
    methods.push(request.method);
    if (methods.length === 1) return;
    response.setHeader('Content-Type','application/json');
    response.end(JSON.stringify({storage:'shared-server',notes:[]}));
  }, async base => {
    const before = Date.now();
    assert.deepEqual(await readRouteComments(base,{timeoutMs:450}),{storage:'shared-server',notes:[]});
    assert.deepEqual(methods,['GET','GET']);
    assert.ok(Date.now()-before < 5000);
  });
});

test('댓글 읽기 재연결도 늦으면 두 번에서 끝내고 입력 오류는 다시 요청하지 않는다', async () => {
  const requests = [];
  await withServer((request,response) => {
    requests.push(request.url);
    if (request.url === '/waiting') return;
    response.writeHead(400,{'Content-Type':'application/json'});
    response.end(JSON.stringify({error:'같은 위치를 선택해 주세요.'}));
  }, async base => {
    await assert.rejects(readRouteComments(`${base}/waiting`,{timeoutMs:450}),{code:'ROUTE_COMMENTS_TIMEOUT'});
    assert.deepEqual(requests,['/waiting','/waiting']);
    await assert.rejects(readRouteComments(`${base}/invalid`),{message:'같은 위치를 선택해 주세요.'});
    assert.deepEqual(requests,['/waiting','/waiting','/invalid']);
  });
});
