import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KAKAO_ROADVIEW_SDK_URL,
  ROADVIEW_ADAPTER_STATUS,
  createInitialRoadviewState,
  createKakaoRoadviewController,
  loadKakaoMapsSdk,
  reduceRoadviewState,
} from './kakaoRoadviewAdapter.js';

function createFakeSdk({ responses = [], responseDelay = 0 } = {}) {
  const calls = {
    roadviewConstructed: 0,
    clientConstructed: 0,
    nearest: [],
    setPanoId: [],
  };
  let responseIndex = 0;

  class LatLng {
    constructor(lat, lng) {
      this.lat = lat;
      this.lng = lng;
    }

    getLat() {
      return this.lat;
    }

    getLng() {
      return this.lng;
    }
  }

  class Roadview {
    constructor(container) {
      calls.roadviewConstructed += 1;
      this.container = container;
      this.panoId = null;
      this.position = null;
    }

    setPanoId(panoId, position) {
      calls.setPanoId.push({ panoId, position });
      this.panoId = panoId;
      this.position = position;
    }

    getPanoId() {
      return this.panoId;
    }

    getPosition() {
      return this.position;
    }
  }

  class RoadviewClient {
    constructor() {
      calls.clientConstructed += 1;
    }

    getNearestPanoId(position, radius, callback) {
      const response = responses[responseIndex] ?? null;
      responseIndex += 1;
      calls.nearest.push({ position, radius });
      setTimeout(() => {
        if (response?.error) {
          callback(null, response.error);
          return;
        }
        callback(response?.panoId ?? response ?? null);
      }, response?.delay ?? responseDelay);
    }
  }

  const sdk = {
    maps: {
      LatLng,
      Roadview,
      RoadviewClient,
      load(callback) {
        callback();
      },
    },
  };

  return { sdk, calls };
}

test('lazy-loads the official SDK with the Vite key and autoload=false', async () => {
  const appendedScripts = [];
  const fakeDocument = {
    createElement(tagName) {
      assert.equal(tagName, 'script');
      return { async: false, onload: null, onerror: null };
    },
    head: {
      appendChild(script) {
        appendedScripts.push(script);
        fakeGlobal.kakao = {
          maps: {
            load(callback) {
              callback();
            },
            Roadview: class Roadview {},
            RoadviewClient: class RoadviewClient {},
          },
        };
        script.onload();
      },
    },
  };
  const fakeGlobal = {};

  const sdk = await loadKakaoMapsSdk({
    appKey: 'test-key-do-not-persist',
    documentRef: fakeDocument,
    globalRef: fakeGlobal,
  });

  assert.equal(sdk, fakeGlobal.kakao);
  assert.equal(appendedScripts.length, 1);
  const scriptUrl = new URL(appendedScripts[0].src);
  assert.equal(`${scriptUrl.origin}${scriptUrl.pathname}`, KAKAO_ROADVIEW_SDK_URL);
  assert.equal(scriptUrl.searchParams.get('appkey'), 'test-key-do-not-persist');
  assert.equal(scriptUrl.searchParams.get('autoload'), 'false');
});

test('finds a nearby panorama, sets it once, and reads the SDK snapshot without verification claims', async () => {
  const { sdk, calls } = createFakeSdk({ responses: [{ panoId: 'pano-success' }] });
  const states = [];
  const controller = createKakaoRoadviewController({
    container: { id: 'roadview-container' },
    sdk,
    onStateChange: (state) => states.push(state),
  });

  const result = await controller.request('candidate-success', { lat: 36.35, lng: 127.38 });

  assert.equal(result.status, ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND);
  assert.equal(result.panoId, 'pano-success');
  assert.deepEqual(result.panoPosition, { lat: 36.35, lng: 127.38 });
  assert.deepEqual(result.verification, {
    placeMatch: 'not_verified',
    accessibility: 'not_verified',
  });
  assert.deepEqual(calls.nearest[0].position.getLat(), 36.35);
  assert.deepEqual(calls.nearest[0].position.getLng(), 127.38);
  assert.equal(calls.nearest[0].radius, 50);
  assert.equal(calls.setPanoId.length, 1);
  assert.equal(calls.setPanoId[0].panoId, 'pano-success');
  assert.equal(calls.setPanoId[0].position.getLat(), 36.35);
  assert.equal(calls.setPanoId[0].position.getLng(), 127.38);
  assert.equal(calls.roadviewConstructed, 1);
  assert.equal(calls.clientConstructed, 1);
  assert.equal(states.at(-1).status, ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND);
});

test('turns a null nearest-pano response into no_panorama and reuses SDK instances', async () => {
  const { sdk, calls } = createFakeSdk({ responses: [null, { panoId: 'pano-second' }] });
  const controller = createKakaoRoadviewController({
    container: { id: 'roadview-container' },
    sdk,
  });

  const missing = await controller.request('candidate-missing', { lat: 36.35, lng: 127.38 });
  const found = await controller.request('candidate-found', { lat: 36.36, lng: 127.39 });

  assert.equal(missing.status, ROADVIEW_ADAPTER_STATUS.NO_PANORAMA);
  assert.equal(missing.panoId, null);
  assert.equal(found.status, ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND);
  assert.equal(found.panoId, 'pano-second');
  assert.equal(calls.roadviewConstructed, 1);
  assert.equal(calls.clientConstructed, 1);
  assert.deepEqual(calls.setPanoId.map(({ panoId }) => panoId), ['pano-second']);
});

test('does not let a stale candidate response replace the latest request', async () => {
  const { sdk, calls } = createFakeSdk({
    responses: [
      { panoId: 'pano-stale', delay: 30 },
      { panoId: 'pano-current', delay: 0 },
    ],
  });
  const controller = createKakaoRoadviewController({
    container: { id: 'roadview-container' },
    sdk,
  });

  const stalePromise = controller.request('candidate-old', { lat: 36.35, lng: 127.38 });
  await new Promise((resolve) => setTimeout(resolve, 1));
  const currentPromise = controller.request('candidate-current', { lat: 36.36, lng: 127.39 });
  const [stale, current] = await Promise.all([stalePromise, currentPromise]);

  assert.equal(stale.status, ROADVIEW_ADAPTER_STATUS.STALE);
  assert.equal(stale.stale, true);
  assert.equal(stale.candidateId, 'candidate-old');
  assert.equal(current.status, ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND);
  assert.equal(controller.getState().candidateId, 'candidate-current');
  assert.equal(controller.getState().panoId, 'pano-current');
  assert.deepEqual(calls.setPanoId.map(({ panoId }) => panoId), ['pano-current']);
});

test('turns an SDK callback error into a bounded error result without exposing the raw error', async () => {
  const { sdk } = createFakeSdk({ responses: [{ error: new Error('private SDK detail') }] });
  const controller = createKakaoRoadviewController({
    container: { id: 'roadview-container' },
    sdk,
  });

  const result = await controller.request('candidate-error', { lat: 36.35, lng: 127.38 });

  assert.equal(result.status, ROADVIEW_ADAPTER_STATUS.ERROR);
  assert.equal(result.errorCode, 'nearest_pano_failed');
  assert.equal(result.errorMessage, null);
  assert.equal(JSON.stringify(result).includes('private SDK detail'), false);
});

test('state helpers are deterministic and ignore an out-of-date completion', () => {
  const initial = createInitialRoadviewState();
  const requesting = reduceRoadviewState(initial, {
    type: 'request_started',
    requestId: 2,
    candidateId: 'candidate-current',
    position: { lat: 36.35, lng: 127.38 },
  });
  const staleCompletion = reduceRoadviewState(requesting, {
    type: 'panorama_found',
    requestId: 1,
    panoId: 'pano-stale',
  });

  assert.equal(initial.status, ROADVIEW_ADAPTER_STATUS.IDLE);
  assert.equal(requesting.status, ROADVIEW_ADAPTER_STATUS.REQUESTING);
  assert.deepEqual(staleCompletion, requesting);
});
