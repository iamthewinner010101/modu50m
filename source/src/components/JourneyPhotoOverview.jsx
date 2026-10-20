import {Camera, ArrowDown} from '@phosphor-icons/react';
import {routeContextPhotos} from '../data/routePhotoAlbums.js';
import PhotoGalleryButton from './PhotoGalleryButton.jsx';
import {VisitNeedsShortcuts} from './WheelchairVisitNeeds.jsx';
import './JourneyPhotoOverview.css';

export default function JourneyPhotoOverview({site, route, photos, selected, onSelect, onGalleryNavigate, onNeedSelect}) {
  const photoCount=new Set(photos.map(photo=>photo.image)).size;
  return <section className="jpo-overview" aria-label="정류장부터 입구까지 사진으로 살펴보기">
    <div className="jpo-heading">
      <div><strong><Camera size={19}/> 이 방문의 사진</strong></div>
      {photos.length > 0 && <PhotoGalleryButton photos={photos} className="jpo-open" onNavigate={onGalleryNavigate}>전체 사진 보기 <span>{photoCount}장 · 주변 비교 포함</span></PhotoGalleryButton>}
    </div>
    <details className="jpo-list">
      <summary>전체 {route.steps.length}구간 사진 목록·먼저 살펴볼 지점</summary>
    <ol className="jpo-stops">
      {route.steps.map((step, index) => {
        const actual = site.photos[step.pointId];
        const context = routeContextPhotos(site.id, step);
        const thumbnail = actual || context[0];
        return <li key={step.id}><button aria-current={selected === index ? 'step' : undefined} aria-label={`${String(index + 1).padStart(2, '0')} ${step.title} 사진으로 이동`} onClick={() => onSelect(index)}>
          <b>{String(index + 1).padStart(2, '0')}</b>
          <span><strong>{step.title}</strong><small>{actual ? '구간 사진' : context.length ? '주변 사진 · 연결 확인 필요' : '구간 사진 필요'}</small></span>
          {thumbnail ? <img src={thumbnail.image} alt="" loading="lazy"/> : <Camera size={22}/>}
        </button></li>;
      })}
    </ol>
    <VisitNeedsShortcuts placeId={site.id} onSelect={need=>onNeedSelect?onNeedSelect(need):onSelect(need.step-1)}/>
    <p className="jpo-note"><ArrowDown size={15}/> 사진으로 보이지 않는 폭·경사·연결은 구간별 질문에 남겨요. 사진을 살펴본 표시와 실제 통행 확인은 달라요.</p>
    </details>
  </section>;
}
