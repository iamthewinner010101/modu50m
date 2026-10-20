import entries from './arrivalRoutesV23.json' with { type: 'json' };
import recommendations from './arrivalRoutesV30.json' with { type: 'json' };
import busJourneys from './arrivalRoutesV31.json' with { type: 'json' };
import transportJourneys from './arrivalRoutesV32.json' with { type: 'json' };
import {parkingArrivalRoute} from './parkingArrivalRoutes.js';
import {VISIT_SCOPES} from './visitScopes.js';
import {routeContextPhotos} from './routePhotoAlbums.js';
import {RECOMMENDED_PLACE_IDS} from './recommendedJourneys.js';

const routes = {...Object.fromEntries(entries.map(route => [route.placeId, route])), ...recommendations, ...busJourneys, ...transportJourneys};
export const ARRIVAL_ROUTES = Object.fromEntries(Object.entries(routes).map(([id,route])=>[id,VISIT_SCOPES[id]?{...route,destination:VISIT_SCOPES[id].destination,finish:VISIT_SCOPES[id].finish}:route]));
export const PARKING_ROUTES=Object.fromEntries(Object.entries(ARRIVAL_ROUTES).map(([id,route])=>[id,parkingArrivalRoute(route)]).filter(([,route])=>route));
export const getArrivalRoute = (id,arrival='bus') => (arrival==='parking'?PARKING_ROUTES[id]:arrival==='bus'?ARRIVAL_ROUTES[id]:null)||null;
export function routeCoverage(route) {
  if (!route) return { photos: 0, missingPhotos: 0, missingLinks: 0, sourceLinks: 0 };
  const edges = route.steps.slice(0, -1);
  return {
    photos: new Set(route.steps.map(step => step.pointId).filter(Boolean)).size,
    // Surrounding photos do not verify a route connection.
    missingPhotos: route.steps.filter(step => !step.pointId && !routeContextPhotos(route.placeId, step).length).length,
    missingLinks: edges.filter(step => !step.next || step.next.status === 'gap').length,
    sourceLinks: edges.filter(step => step.next?.status === 'source-described').length,
  };
}
export function routeStartPoint(site) {
  return getArrivalRoute(site.id)?.steps.find(step => step.pointId && site.photos[step.pointId])?.pointId;
}
export function routeConnectionLabel(edge) {
  if (edge?.status === 'map-reviewed') return '지도·사진에서 다음 위치 비교';
  return edge?.status === 'source-described' ? '출처에서 연결 안내' : edge?.status === 'same-scene' ? '같은 사진 안에서 이어보기' : '사이 구간 확인 필요';
}

// Topology records explicit adjacency, not intersections inferred from the map
// or the miniature. Coordinates remain map candidates; none are surveyed.
export function walkingNodeId(placeId, stepId) {
  return `${placeId}:${stepId}`;
}

export function walkingConnection(route, index) {
  if (!route || !Number.isInteger(index) || index < 0 || index >= route.steps.length - 1) return null;
  const from = route.steps[index], to = route.steps[index + 1];
  const arrival = route.arrival === 'parking' ? 'parking' : 'bus';
  const status = from.next?.status || 'gap';
  const levelChange = Number.isFinite(from.level) && Number.isFinite(to.level) && from.level !== to.level;
  return {
    id: `${route.placeId}/${arrival}/${from.id}/${to.id}`,
    from: walkingNodeId(route.placeId, from.id), to: walkingNodeId(route.placeId, to.id),
    routeId: `${route.placeId}/${arrival}`, index, status,
    kind: levelChange ? 'level-change' : 'photo-sequence',
    fromLevel: from.level ?? null, toLevel: to.level ?? null,
    detail: from.next?.detail || '두 지점 사이의 바닥 사진이 더 필요해요.',
    sources: [...(from.next?.sourceUrls || [])],
    // A drawing or a short map segment cannot establish a measured metre.
    measuredDistanceM: null, coordinateAccuracyM: null, traversalVerified: false,
  };
}

export function buildWalkingTopology(placeIds = RECOMMENDED_PLACE_IDS) {
  const nodes = new Map(), links = [], journeys = [];
  for (const placeId of placeIds) {
    for (const arrival of ['bus', 'parking']) {
      const route = getArrivalRoute(placeId, arrival);
      if (!route) continue;
      const journey = {id: `${placeId}/${arrival}`, placeId, arrival, start: route.start.name,
        destination: route.destination, nodes: [], links: []};
      route.steps.forEach((step, index) => {
        const id = walkingNodeId(placeId, step.id);
        if (!nodes.has(id)) nodes.set(id, {id, placeId, stepId: step.id, title: step.title,
          pointId: step.pointId || null, coordinate: step.coordinate || null,
          coordinateKind: step.coordinateKind || (step.coordinate ? 'map-area-candidate' : 'unknown'),
          coordinateAccuracyM: null, level: step.level ?? null, occurrences: []});
        nodes.get(id).occurrences.push({routeId: journey.id, index, number: String(index + 1).padStart(2, '0'),
          title: step.title, destination: index === route.steps.length - 1 ? route.destination : null});
        journey.nodes.push(id);
        const link = walkingConnection(route, index);
        if (link) { links.push(link); journey.links.push(link.id); }
      });
      journeys.push(journey);
    }
  }
  const evidenceCounts = Object.fromEntries(['map-reviewed','source-described','same-scene','gap'].map(status =>
    [status, links.filter(link => link.status === status).length]));
  return {schema: 'modu50m.walking-topology.v1', nodes: [...nodes.values()], links, journeys,
    counts: {places: new Set(journeys.map(journey => journey.placeId)).size, journeys: journeys.length,
      stages: journeys.reduce((sum, journey) => sum + journey.nodes.length, 0), locations: nodes.size,
      connections: links.length, evidenceCounts},
    coordinateSystem: 'WGS84 latitude-longitude candidates; illustration anchors are separate',
    surveyedOneMetreAccuracy: false, continuousRouteVerified: false};
}
