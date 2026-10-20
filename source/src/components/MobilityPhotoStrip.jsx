import { Camera } from '@phosphor-icons/react';
import { photoCaption } from '../data/previewCityPlaces.js';
import './PlaceMiniatureOverview.css';

export default function MobilityPhotoStrip({ scenes, currentId, onSelect, placeId }) {
  if (!scenes.length) return null;
  return <section className="pm-movement" aria-label="실제 이동 구간 사진 모음">
    <div className="pm-movement-heading"><h3><Camera size={20} /> 방문 전에 살펴볼 실제 사진 <b>{scenes.length}장</b></h3><p>이동 구간 일부 {scenes.filter(scene => scene.review.kind === 'segment').length}장 · 주변 참고 {scenes.filter(scene => scene.review.kind !== 'segment').length}장</p></div>
    <div className="pm-movement-list">{scenes.map(scene => <button key={scene.id} data-mobility-photo={`${placeId}/${scene.id}`} onClick={() => onSelect(scene.index)} aria-pressed={currentId === scene.id} aria-label={`${scene.number} ${scene.shortTitle} 이동 사진 선택`}>
      <div><img src={scene.photo.image} alt="" loading="lazy" /><b>{scene.number}</b></div>
      <span><small>{scene.photo.sourceRouteOrder ? `공식 자료의 이동 순서 ${scene.photo.sourceRouteOrder}` : scene.photo.sameViewpointAs ? '같은 촬영 지점 · 다른 방향' : scene.review.kind === 'context' ? '주변 위치 참고 · 연결 확인 전' : scene.photo.viewLabel || '이동 구간 일부'}</small><strong>{scene.shortTitle}</strong><em>{photoCaption(scene.photo)}</em></span>
    </button>)}</div>
    <p className="pm-movement-note">서로 다른 장면을 모아 살펴보는 사진집입니다. 사진 사이의 길과 현재 통행 가능 여부는 별도로 확인해야 합니다.</p>
  </section>;
}
