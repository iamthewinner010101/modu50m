import evidence from './hanbitLocations.generated.json' with { type: 'json' };

export const HANBIT_MAP = { width: 720, height: 620, scale: 1.3, origin: [280, 215], lat: 36.376638, lon: 127.3880554 };
export const HANBIT_GEOMETRY = evidence.map;
// Shared local metric projection for BOTH ground features and panorama origins.
// North stays up. Building heights and the tower symbol are illustrative.
export function projectHanbit({ lat, lon }) {
  const east = (lon - HANBIT_MAP.lon) * 111320 * Math.cos(HANBIT_MAP.lat * Math.PI / 180);
  const north = (lat - HANBIT_MAP.lat) * 111320;
  return [HANBIT_MAP.origin[0] + east * HANBIT_MAP.scale, HANBIT_MAP.origin[1] - north * HANBIT_MAP.scale];
}
export function hanbitDistance(a, b) {
  const rad = value => value * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const HANBIT_MODEL_AREAS = {
  approach: { badge: [625, 345], area: '동측 엑스포로97번길 · 정류장 주변', direction: '북서쪽', note: '도로에서 북서쪽 보도를 바라본 사진이에요. 표식은 카메라 위치이며, 정류장 시설은 사진 안에서 확인해요.' },
  threshold: { badge: [625, 210], area: '동측 엑스포로97번길 · 차량 진입로', direction: '서쪽', note: '01 촬영점에서 북쪽으로 약 40m 떨어진 곳이에요. 도로에서 서쪽의 차량 진입로를 바라봐요.' },
  doorway: { badge: [120, 535], area: '남측 엑스포로 · 별도 광장 장면', direction: '북쪽', note: '탑에서 남쪽으로 직선 약 258m 떨어진 도로에서 북쪽 광장을 바라봐요. 동측 두 사진과 다른 지점이에요.' },
};

export const getHanbitModelArea = (pointId, photo) => {
  const area = HANBIT_MODEL_AREAS[pointId];
  const source = evidence.locations[pointId];
  // A replacement photo or a changed viewing direction must never inherit this pin.
  if (!area || !source || source.photo !== photo?.image || source.panoId !== String(photo.panoId)
    || source.sha256 !== photo.sha256 || source.viewHeading !== photo.heading || source.fov !== photo.fov) return null;
  const point = projectHanbit(source.camera);
  return { ...area, ...source, point, position: [point[0] / HANBIT_MAP.width * 100, point[1] / HANBIT_MAP.height * 100] };
};
