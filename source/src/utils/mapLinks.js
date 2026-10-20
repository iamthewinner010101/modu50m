const APP_NAME = 'modu50m';

function fixedCoord(value) {
  return Number(value).toFixed(5);
}

function encodedName(candidate) {
  return encodeURIComponent(`${candidate.name} 검수 지점`);
}

export function getReviewPoint(candidate) {
  return {
    lat: Number(candidate.reviewPoint?.lat ?? candidate.lat),
    lng: Number(candidate.reviewPoint?.lng ?? candidate.lng),
  };
}

export function getRoadviewPoint(candidate) {
  const reviewPoint = getReviewPoint(candidate);

  return {
    lat: Number(candidate.roadviewPoint?.lat ?? reviewPoint.lat),
    lng: Number(candidate.roadviewPoint?.lng ?? reviewPoint.lng),
  };
}

export function getCandidateReviewLinks(candidate) {
  const point = getReviewPoint(candidate);
  const roadviewPoint = getRoadviewPoint(candidate);
  const lat = fixedCoord(point.lat);
  const lng = fixedCoord(point.lng);
  const roadviewLat = fixedCoord(roadviewPoint.lat);
  const roadviewLng = fixedCoord(roadviewPoint.lng);
  const name = encodedName(candidate);

  return {
    naverMap: `https://map.naver.com/p/search/${name}?c=${lng},${lat},18,0,0,0,dh`,
    naverApp: `nmap://place?lat=${lat}&lng=${lng}&name=${name}&appname=${APP_NAME}`,
    naverIntent: `intent://place?lat=${lat}&lng=${lng}&name=${name}&appname=${APP_NAME}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`,
    kakaoMap: `https://map.kakao.com/link/map/${name},${lat},${lng}`,
    kakaoRoadview: `https://map.kakao.com/link/roadview/${roadviewLat},${roadviewLng}`,
    kakaoRoadviewMobile: `https://m.map.kakao.com/scheme/roadView?p=${roadviewLat},${roadviewLng}`,
    googleMap: `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`,
  };
}

export function getCoordinateLabel(candidate) {
  const point = getReviewPoint(candidate);
  return `${fixedCoord(point.lat)}, ${fixedCoord(point.lng)}`;
}

export function getRoadviewCoordinateLabel(candidate) {
  const point = getRoadviewPoint(candidate);
  return `${fixedCoord(point.lat)}, ${fixedCoord(point.lng)}`;
}
