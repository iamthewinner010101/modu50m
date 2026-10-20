import { ArrowDown, ArrowRight, ArrowSquareOut, Camera, Info, MagnifyingGlassPlus, MapPin } from '@phosphor-icons/react';
import { getPlaceMiniature, getMiniatureScenes } from '../data/placeMiniatures.js';
import { getPlaceReview } from '../data/wheelchairPhotoReview.js';
import { photoCaption } from '../data/previewCityPlaces.js';
import { photoProviderLabel } from '../data/previewRoadviewSelection.js';
import MobilityPhotoStrip from './MobilityPhotoStrip.jsx';
import './HanbitLocationMap.css';
import './HanbitArrivalGuide.css';
import './PlaceMiniatureOverview.css';

export default function PlaceMiniatureOverview({ site, pointIndex, onSelect, onViewPhoto }) {
  const model = getPlaceMiniature(site.id);
  const scenes = getMiniatureScenes(site);
  const current = scenes[pointIndex];
  const placeReview = getPlaceReview(site);
  const isSegment = current.review.kind === 'segment';
  const movementScenes = scenes.filter(scene => scene.review.kind === 'segment' || scene.photo.mobilityEvidence);
  const referenceUrl = model?.referenceUrl || current.photo.sourceUrl;
  return <section className="pm-overview ha-guide" aria-label={`${site.name} 미니어처와 사진 선택`}>
    <div className="ha-intro"><h2>{movementScenes.length ? '지나갈 길을 먼저, 실제 사진으로 살펴봐요.' : '미니어처에서 고르고, 실제 사진으로 살펴봐요.'}</h2><span>번호는 사진을 고르는 표시입니다. 장면마다 보도·턱·진입부를 따로 살펴보세요.</span></div>
    <div className="hm-location pm-location">
      <figure className="hm-figure pm-figure">
        <div className="hm-map-top"><span><MapPin size={16} /> {site.shortName || site.name} 미니어처</span><small>{scenes.some(scene => scene.selector) ? '번호를 눌러 사진 선택' : '장소의 모습을 알아봐요'}</small></div>
        <div className="hm-map-active" aria-hidden="true"><small>지금 보는 곳</small><strong>{current.number} {current.shortTitle}</strong></div>
        <div className="pm-model-art">
          <img className="pm-model-image" src={model.image} alt={model.alt} fetchPriority="high" />
          {scenes.filter(scene => scene.selector).map(scene => <button key={scene.id} className="hm-point hm-model-point pm-point" style={{ left: `${scene.selector[0]}%`, top: `${scene.selector[1]}%` }} aria-label={`미니어처에서 ${scene.number} ${scene.shortTitle} 사진 보기`} aria-pressed={current.id === scene.id} onClick={() => onSelect(scene.index)}><b>{scene.number}</b><span><small>{current.id === scene.id ? '지금 보는 곳' : '사진 보기'}</small>{scene.shortTitle}</span></button>)}
        </div>
        {scenes.filter(scene => scene.sameAs).map(scene => <button className="pm-related-scene" key={scene.id} aria-pressed={current.id === scene.id} aria-label={`${scene.number} ${scene.shortTitle}, ${scene.sameAs.number}과 같은 장면 확대 보기`} onClick={() => onSelect(scene.index)}><b>{scene.number}</b><span><strong>{scene.shortTitle}</strong><small>{scene.sameAs.number}과 같은 촬영 지점 · 확대 사진</small></span><MagnifyingGlassPlus size={18} /></button>)}
        <figcaption>사진 참고 AI 모형 · 번호는 사진 선택 표시이며 실제 촬영 좌표나 이동 경로가 아닙니다.</figcaption>
      </figure>
      <div className="hm-current pm-current">
        <div className="hm-current-heading" aria-live="polite" aria-atomic="true"><p><span /> 지금 보는 곳</p><h3><b>{current.number}</b>{current.shortTitle}</h3><strong>{current.review.title}</strong><p className="hm-current-note">{current.review.question}</p></div>
        <button className="hm-current-photo" onClick={onViewPhoto} aria-label={`${current.shortTitle} 실제 사진 자세히 보기`}><img src={current.photo.image} alt={`${site.name} · ${current.review.title} 실제 사진`} /><span><Camera size={16} /> {isSegment ? '이 구간의 실제 사진' : '이 장소의 실제 참고 사진'} <ArrowDown size={16} /></span></button>
        <p className="hm-credit">{photoProviderLabel(current.photo)} · {photoCaption(current.photo)}</p>
        <button className="hm-view-photo" onClick={onViewPhoto}>{isSegment ? '사진에서 장애물 자세히 보기' : '사진에서 확인할 부분 보기'}<ArrowDown size={18} /></button>
        <details className="pm-sources"><summary>사진과 모형의 출처</summary><p>{current.hint || site.coverage}</p>{current.photo.attribution && <p>{current.photo.attribution}</p>}<a href={current.photo.sourceUrl} target="_blank" rel="noreferrer">실제 사진 원본 <ArrowSquareOut size={14} /></a><a href={referenceUrl} target="_blank" rel="noreferrer">{model.referenceLabel || '모형 외관 참고 자료'} <ArrowSquareOut size={14} /></a>{current.photo.licenseUrl && <a href={current.photo.licenseUrl} target="_blank" rel="noreferrer">{current.photo.licenseLabel || '사진 이용 조건'}</a>}{model.licenseUrl && <a href={model.licenseUrl} target="_blank" rel="noreferrer">AI 모형 이용 조건 · {model.licenseLabel || 'CC BY-SA 3.0'}</a>}</details>
      </div>
    </div>
    <MobilityPhotoStrip scenes={movementScenes} currentId={current.id} onSelect={onSelect} placeId={site.id} />
    <ol className="ha-steps pm-scenes" style={{ '--scene-count': Math.min(scenes.filter(scene => !scene.mobilityPhoto).length + 1, 4) }} aria-label={`${site.name} 외관과 기존 사진`}>{scenes.filter(scene => !scene.mobilityPhoto).map(scene => <li key={scene.id}><button aria-label={`${scene.number} ${scene.shortTitle} 선택`} aria-pressed={current.id === scene.id} onClick={() => onSelect(scene.index)}><b>{scene.number}</b><div><small>{scene.sameAs ? `${scene.sameAs.number}과 같은 지점 확대` : scene.review.kind === 'segment' ? '이동 구간 일부' : '외관·장면 참고'}</small><strong>{scene.shortTitle}</strong><span>{scene.review.observations.map(item => item.label).slice(0, 2).join(' · ')}</span></div><ArrowRight className="ha-step-arrow" size={17} /></button></li>)}<li><div className="ha-step-gap pm-next-photo"><Camera size={23} /><div><strong>이어서 확인할 부분</strong><span>{placeReview.missingShots[0]}</span><small>현장 연결 확인 필요</small></div></div></li></ol>
    <p className="ha-scope"><Info size={17} /><span>{site.communityCase ? current.review.connection : placeReview.hasSegments ? '방문 전에 살펴볼 사진입니다. 사진 사이의 연결과 실제 출입문까지의 이동은 확인 전입니다.' : '현재는 주변 위치를 살펴보는 사진입니다. 보도·턱·출입문까지 이어지는 길은 추가 확인이 필요합니다.'}</span></p>
  </section>;
}
