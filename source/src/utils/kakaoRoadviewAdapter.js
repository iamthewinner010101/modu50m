const DEFAULT_SEARCH_RADIUS = 50;
const DEFAULT_VERIFICATION = Object.freeze({
  placeMatch: 'not_verified',
  accessibility: 'not_verified',
});

export const KAKAO_ROADVIEW_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';

export const ROADVIEW_ADAPTER_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  REQUESTING: 'requesting',
  PANORAMA_FOUND: 'panorama_found',
  NO_PANORAMA: 'no_panorama',
  ERROR: 'error',
  STALE: 'stale',
});

const SDK_PROMISES = new WeakMap();

export class KakaoRoadviewAdapterError extends Error {
  constructor(code) {
    super(code);
    this.name = 'KakaoRoadviewAdapterError';
    this.code = code;
  }
}

function adapterError(code) {
  return new KakaoRoadviewAdapterError(code);
}

function getDefaultDocument() {
  return typeof document === 'undefined' ? null : document;
}

function getDefaultGlobal() {
  if (typeof window !== 'undefined') return window;
  return globalThis;
}

function readViteAppKey() {
  try {
    return String(import.meta.env?.VITE_KAKAO_JAVASCRIPT_KEY ?? '').trim();
  } catch {
    return '';
  }
}

function resolveKakaoSdk(globalRef) {
  const candidate = globalRef?.kakao ?? globalRef;
  return candidate?.maps ? candidate : null;
}

function clonePosition(position) {
  return position ? { lat: position.lat, lng: position.lng } : null;
}

function cloneVerification() {
  return {
    placeMatch: DEFAULT_VERIFICATION.placeMatch,
    accessibility: DEFAULT_VERIFICATION.accessibility,
  };
}

function normalizeCandidateId(candidateId) {
  if (candidateId === null || candidateId === undefined || candidateId === '') return null;
  return String(candidateId);
}

function normalizePanoId(panoId) {
  if (panoId === null || panoId === undefined || panoId === '') return null;
  if (typeof panoId === 'number') return Number.isFinite(panoId) ? panoId : null;
  if (typeof panoId === 'string') return panoId.trim() || null;
  return null;
}

function asFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeRoadviewPosition(position) {
  if (!position) return null;

  try {
    const lat = typeof position.getLat === 'function'
      ? position.getLat()
      : position.lat ?? position.latitude ?? position.y;
    const lng = typeof position.getLng === 'function'
      ? position.getLng()
      : position.lng ?? position.longitude ?? position.x;
    const normalizedLat = asFiniteNumber(lat);
    const normalizedLng = asFiniteNumber(lng);

    if (normalizedLat === null || normalizedLng === null) return null;
    if (normalizedLat < -90 || normalizedLat > 90) return null;
    if (normalizedLng < -180 || normalizedLng > 180) return null;
    return { lat: normalizedLat, lng: normalizedLng };
  } catch {
    return null;
  }
}

export function createInitialRoadviewState() {
  return {
    status: ROADVIEW_ADAPTER_STATUS.IDLE,
    requestId: 0,
    candidateId: null,
    requestedPosition: null,
    panoId: null,
    panoPosition: null,
    errorCode: null,
    errorMessage: null,
    verification: cloneVerification(),
  };
}

export const createRoadviewState = createInitialRoadviewState;

function isStaleCompletion(state, action) {
  return Number.isFinite(action.requestId)
    && Number.isFinite(state.requestId)
    && action.requestId !== state.requestId;
}

export function reduceRoadviewState(previousState, action = {}) {
  const state = previousState ?? createInitialRoadviewState();

  switch (action.type) {
    case 'sdk_loading':
      return {
        ...state,
        status: ROADVIEW_ADAPTER_STATUS.LOADING,
        errorCode: null,
        errorMessage: null,
      };
    case 'sdk_ready':
      return {
        ...state,
        status: ROADVIEW_ADAPTER_STATUS.READY,
        errorCode: null,
        errorMessage: null,
      };
    case 'request_started':
      return {
        ...state,
        status: ROADVIEW_ADAPTER_STATUS.REQUESTING,
        requestId: Number.isFinite(action.requestId) ? action.requestId : state.requestId + 1,
        candidateId: normalizeCandidateId(action.candidateId),
        requestedPosition: clonePosition(normalizeRoadviewPosition(action.position)),
        panoId: null,
        panoPosition: null,
        errorCode: null,
        errorMessage: null,
        verification: cloneVerification(),
      };
    case 'panorama_found':
      if (isStaleCompletion(state, action)) return state;
      return {
        ...state,
        status: ROADVIEW_ADAPTER_STATUS.PANORAMA_FOUND,
        panoId: normalizePanoId(action.panoId),
        panoPosition: clonePosition(normalizeRoadviewPosition(action.panoPosition)),
        errorCode: null,
        errorMessage: null,
        verification: cloneVerification(),
      };
    case 'no_panorama':
      if (isStaleCompletion(state, action)) return state;
      return {
        ...state,
        status: ROADVIEW_ADAPTER_STATUS.NO_PANORAMA,
        panoId: null,
        panoPosition: null,
        errorCode: null,
        errorMessage: null,
        verification: cloneVerification(),
      };
    case 'error':
      if (isStaleCompletion(state, action)) return state;
      return {
        ...state,
        status: ROADVIEW_ADAPTER_STATUS.ERROR,
        panoId: null,
        panoPosition: null,
        errorCode: typeof action.errorCode === 'string' && action.errorCode
          ? action.errorCode
          : 'unknown_error',
        errorMessage: null,
        verification: cloneVerification(),
      };
    case 'reset':
      return createInitialRoadviewState();
    default:
      return state;
  }
}

function buildSdkUrl(appKey) {
  const url = new URL(KAKAO_ROADVIEW_SDK_URL);
  url.searchParams.set('appkey', appKey);
  url.searchParams.set('autoload', 'false');
  return url.toString();
}

function waitForMapsLoad(kakao, globalRef) {
  const maps = kakao?.maps;
  if (!maps || typeof maps.load !== 'function') return Promise.resolve(kakao);

  return new Promise((resolve, reject) => {
    try {
      maps.load(() => {
        const loadedSdk = resolveKakaoSdk(globalRef) ?? kakao;
        if (loadedSdk?.maps) {
          resolve(loadedSdk);
          return;
        }
        reject(adapterError('sdk_bootstrap_failed'));
      });
    } catch {
      reject(adapterError('sdk_bootstrap_failed'));
    }
  });
}

export async function loadKakaoMapsSdk({
  appKey = readViteAppKey(),
  documentRef = getDefaultDocument(),
  globalRef = getDefaultGlobal(),
} = {}) {
  const loadedSdk = resolveKakaoSdk(globalRef);
  if (loadedSdk) return waitForMapsLoad(loadedSdk, globalRef);

  const normalizedAppKey = String(appKey ?? '').trim();
  if (!normalizedAppKey) throw adapterError('missing_javascript_key');
  if (!documentRef?.createElement) throw adapterError('sdk_document_unavailable');

  const cachedPromise = SDK_PROMISES.get(documentRef);
  if (cachedPromise) return cachedPromise;

  const promise = new Promise((resolve, reject) => {
    let script;
    try {
      script = documentRef.createElement('script');
      script.async = true;
      script.src = buildSdkUrl(normalizedAppKey);
      script.onload = () => {
        const sdk = resolveKakaoSdk(globalRef);
        if (!sdk) {
          reject(adapterError('sdk_global_unavailable'));
          return;
        }
        waitForMapsLoad(sdk, globalRef).then(resolve, reject);
      };
      script.onerror = () => reject(adapterError('sdk_load_failed'));

      const parent = documentRef.head ?? documentRef.body ?? documentRef.documentElement;
      if (!parent?.appendChild) {
        reject(adapterError('sdk_document_unavailable'));
        return;
      }
      parent.appendChild(script);
    } catch {
      reject(adapterError('sdk_load_failed'));
    }
  });

  SDK_PROMISES.set(documentRef, promise);
  try {
    return await promise;
  } catch (error) {
    SDK_PROMISES.delete(documentRef);
    throw error instanceof KakaoRoadviewAdapterError
      ? error
      : adapterError('sdk_load_failed');
  }
}

export function readRoadviewSnapshot(roadview, fallbackPanoId = null) {
  let panoId = normalizePanoId(fallbackPanoId);
  let panoPosition = null;

  if (typeof roadview?.getPanoId === 'function') {
    try {
      panoId = normalizePanoId(roadview.getPanoId()) ?? panoId;
    } catch {
      // A snapshot is best-effort; the adapter still returns the callback pano ID.
    }
  }
  if (typeof roadview?.getPosition === 'function') {
    try {
      panoPosition = normalizeRoadviewPosition(roadview.getPosition());
    } catch {
      panoPosition = null;
    }
  }

  return { panoId, panoPosition };
}

function normalizeSdk(value) {
  const sdk = value?.kakao ?? value;
  return sdk?.maps ? sdk : null;
}

function parseRequestArgs(candidateIdOrRequest, maybePosition) {
  if (maybePosition !== undefined || candidateIdOrRequest === null || typeof candidateIdOrRequest !== 'object') {
    return { candidateId: candidateIdOrRequest, position: maybePosition };
  }

  return {
    candidateId: candidateIdOrRequest.candidateId ?? candidateIdOrRequest.id ?? null,
    position: candidateIdOrRequest.position ?? candidateIdOrRequest,
  };
}

function makeResult(state, overrides = {}) {
  const result = {
    status: state.status,
    requestId: state.requestId,
    candidateId: state.candidateId,
    requestedPosition: clonePosition(state.requestedPosition),
    panoId: state.panoId,
    panoPosition: clonePosition(state.panoPosition),
    errorCode: state.errorCode,
    errorMessage: null,
    verification: cloneVerification(),
    stale: false,
    state: {
      ...state,
      requestedPosition: clonePosition(state.requestedPosition),
      panoPosition: clonePosition(state.panoPosition),
      verification: cloneVerification(),
    },
  };

  return { ...result, ...overrides };
}

function makeStaleResult({ requestId, candidateId, position, state }) {
  return makeResult(state, {
    status: ROADVIEW_ADAPTER_STATUS.STALE,
    requestId,
    candidateId: normalizeCandidateId(candidateId),
    requestedPosition: clonePosition(position),
    panoId: null,
    panoPosition: null,
    errorCode: null,
    stale: true,
  });
}

export function createKakaoRoadviewController({
  container = null,
  appKey = readViteAppKey(),
  documentRef = getDefaultDocument(),
  globalRef = getDefaultGlobal(),
  sdk = null,
  loadSdk = null,
  searchRadius = DEFAULT_SEARCH_RADIUS,
  onStateChange = () => {},
} = {}) {
  let state = createInitialRoadviewState();
  let disposed = false;
  let nextRequestId = 0;
  let readyPromise = null;
  let maps = null;
  let roadview = null;
  let roadviewClient = null;

  function publish(action) {
    if (disposed) return state;
    const nextState = reduceRoadviewState(state, action);
    state = nextState;
    try {
      onStateChange({
        ...state,
        requestedPosition: clonePosition(state.requestedPosition),
        panoPosition: clonePosition(state.panoPosition),
        verification: cloneVerification(),
      });
    } catch {
      // Consumer callbacks must not break the bounded SDK adapter.
    }
    return state;
  }

  function getState() {
    return {
      ...state,
      requestedPosition: clonePosition(state.requestedPosition),
      panoPosition: clonePosition(state.panoPosition),
      verification: cloneVerification(),
    };
  }

  async function ensureReady() {
    if (disposed) throw adapterError('controller_disposed');
    if (roadview && roadviewClient && maps) {
      return { maps, roadview, roadviewClient };
    }
    if (readyPromise) return readyPromise;

    publish({ type: 'sdk_loading' });
    readyPromise = (async () => {
      const loadedSdk = normalizeSdk(sdk)
        ?? normalizeSdk(loadSdk ? await loadSdk({ appKey, documentRef, globalRef }) : null)
        ?? (loadSdk ? null : await loadKakaoMapsSdk({ appKey, documentRef, globalRef }));
      const resolvedSdk = normalizeSdk(loadedSdk);
      const loadedMaps = resolvedSdk?.maps;

      if (!loadedMaps
        || typeof loadedMaps.LatLng !== 'function'
        || typeof loadedMaps.Roadview !== 'function'
        || typeof loadedMaps.RoadviewClient !== 'function') {
        throw adapterError('sdk_api_unavailable');
      }
      if (disposed) throw adapterError('controller_disposed');

      maps = loadedMaps;
      roadview = new maps.Roadview(container);
      roadviewClient = new maps.RoadviewClient();
      publish({ type: 'sdk_ready' });
      return { maps, roadview, roadviewClient };
    })();

    try {
      return await readyPromise;
    } catch (error) {
      readyPromise = null;
      throw error instanceof KakaoRoadviewAdapterError
        ? error
        : adapterError('sdk_initialization_failed');
    }
  }

  async function request(candidateIdOrRequest, maybePosition) {
    const parsed = parseRequestArgs(candidateIdOrRequest, maybePosition);
    const candidateId = normalizeCandidateId(parsed.candidateId);
    const position = normalizeRoadviewPosition(parsed.position);
    const requestId = ++nextRequestId;

    if (disposed) {
      return makeResult(state, {
        status: ROADVIEW_ADAPTER_STATUS.ERROR,
        requestId,
        candidateId,
        requestedPosition: clonePosition(position),
        errorCode: 'controller_disposed',
      });
    }

    publish({
      type: 'request_started',
      requestId,
      candidateId,
      position,
    });

    if (!position) {
      publish({ type: 'error', requestId, errorCode: 'invalid_position' });
      return makeResult(state);
    }

    let resources;
    try {
      resources = await ensureReady();
    } catch (error) {
      if (requestId !== nextRequestId || disposed) {
        return makeStaleResult({ requestId, candidateId, position, state });
      }
      publish({
        type: 'error',
        requestId,
        errorCode: error?.code ?? 'sdk_initialization_failed',
      });
      return makeResult(state);
    }

    if (requestId !== nextRequestId || disposed) {
      return makeStaleResult({ requestId, candidateId, position, state });
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (nextResult) => {
        if (settled) return;
        settled = true;
        resolve(nextResult);
      };
      const finishError = (errorCode) => {
        publish({ type: 'error', requestId, errorCode });
        finish(makeResult(state));
      };
      const handleNearestPano = (panoId, responseError = null) => {
        if (requestId !== nextRequestId || disposed) {
          finish(makeStaleResult({ requestId, candidateId, position, state }));
          return;
        }
        if (responseError) {
          finishError('nearest_pano_failed');
          return;
        }
        if (panoId === null || panoId === undefined || panoId === '') {
          publish({ type: 'no_panorama', requestId });
          finish(makeResult(state));
          return;
        }

        try {
          // The official Kakao contract requires the requested LatLng together
          // with the panorama ID so the scene has its coordinate context.
          const sdkPosition = new resources.maps.LatLng(position.lat, position.lng);
          resources.roadview.setPanoId(panoId, sdkPosition);
          const snapshot = readRoadviewSnapshot(resources.roadview, panoId);
          publish({
            type: 'panorama_found',
            requestId,
            panoId: snapshot.panoId,
            panoPosition: snapshot.panoPosition,
          });
          finish(makeResult(state));
        } catch {
          finishError('set_pano_failed');
        }
      };

      try {
        const nearestPanoId = resources.roadviewClient?.getNearestPanoId;
        if (typeof nearestPanoId !== 'function') {
          finishError('nearest_pano_unavailable');
          return;
        }
        const sdkPosition = new resources.maps.LatLng(position.lat, position.lng);
        nearestPanoId.call(
          resources.roadviewClient,
          sdkPosition,
          Number.isFinite(Number(searchRadius)) && Number(searchRadius) > 0
            ? Number(searchRadius)
            : DEFAULT_SEARCH_RADIUS,
          handleNearestPano,
        );
      } catch {
        finishError('nearest_pano_failed');
      }
    });
  }

  function reset() {
    if (disposed) return getState();
    nextRequestId += 1;
    publish({ type: 'reset' });
    return getState();
  }

  function relayout() {
    if (disposed || typeof roadview?.relayout !== 'function') return false;
    try {
      roadview.relayout();
      return true;
    } catch {
      return false;
    }
  }

  function dispose() {
    disposed = true;
    nextRequestId += 1;
    readyPromise = null;
  }

  return {
    ensureReady,
    getState,
    request,
    requestRoadview: request,
    relayout,
    reset,
    dispose,
  };
}
