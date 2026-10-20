import { useRef, useState } from 'react';
import { ArrowRight, Camera, CornersOut, MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import { CITY_OVERVIEW } from '../data/previewModels.js';
import { FINALS_PLACES } from '../data/finalsCatalog.js';
import { getPlaceMiniature } from '../data/placeMiniatures.js';
import { DISTRICT_NAMES, SPACE_TYPES, countPhotos, filterFinalsPlaces, spaceTypeFor } from '../data/finalsDiscovery.js';
import { getPlaceReview } from '../data/wheelchairPhotoReview.js';
import './DaejeonCityOverview.css';

const DISTRICT_COPY = {
  유성구: '과학과 엑스포, 쉬어 가는 풍경', 서구: '공연과 전시, 일상 속 공공 공간',
  중구: '오래된 건축과 오늘의 문화', 동구: '여행의 시작과 언덕 위 풍경', 대덕구: '기차역에서 정원과 옛 마당까지',
};

export default function DaejeonCityOverview({ onSelect }) {
  const [district, setDistrict] = useState('전체');
  const [spaceType, setSpaceType] = useState('전체');
  const [query, setQuery] = useState('');
  const [onlySegments, setOnlySegments] = useState(false);
  const collection = useRef(null);
  const segmentPlaceCount = FINALS_PLACES.filter(place => getPlaceReview(place).hasSegments).length;
  const districtCount = name => FINALS_PLACES.filter(place => name === '전체' || place.district === name).length;
  const places = filterFinalsPlaces({ district, spaceType, query, onlySegments });
  const number = place => String(FINALS_PLACES.indexOf(place) + 1).padStart(2, '0');
  const clearFilters = () => { setDistrict('전체'); setSpaceType('전체'); setQuery(''); setOnlySegments(false); };
  function chooseRegion(name) {
    setDistrict(name);
    setSpaceType('전체'); setQuery(''); setOnlySegments(false);
    collection.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    collection.current?.focus({ preventScroll: true });
  }
  return <main id="mv5-main" className="mv5-city mv18-city">
    <div className="mv5-city-heading">
      <div><p className="mv18-eyebrow">대전의 다섯 지역 · {FINALS_PLACES.length}개의 공간</p><h1>가고 싶은 곳,<br />마지막 길부터 함께 살펴봐요.</h1><p>휠체어로 외출하기 전, 실제 사진에서 보도와 입구 주변을 살펴보고 궁금한 점을 남겨요.</p></div>
      <div className="mv18-city-total"><b>{FINALS_PLACES.length}<small>곳</small></b><span>미니어처와 실제 사진<br />같은 방식으로 관찰하고 기록해요.</span></div>
    </div>
    <div className="mv18-map-workspace">
      <section className="mv5-city-scene" aria-label="지역을 고르는 대전 미니어처">
        <div className="mv18-map-heading"><span><MapPin size={16} /> 지역을 눌러 장소를 모아 보세요</span><a href={CITY_OVERVIEW.image} target="_blank" rel="noreferrer" aria-label="전체 도시 모형 크게 보기"><CornersOut size={18} /></a></div>
        <div className="mv5-city-art">
          <img className="mv5-city-image" src={CITY_OVERVIEW.image} alt={CITY_OVERVIEW.alt} />
          {CITY_OVERVIEW.districtLabels.map(area => <button key={area.name} className="mv18-district-pin" style={{ left: area.position[0] + '%', top: area.position[1] + '%' }} aria-label={'모형에서 ' + area.name + ' ' + districtCount(area.name) + '곳 모아 보기'} aria-pressed={district === area.name} aria-controls="mv18-places" onClick={() => chooseRegion(area.name)}><span>{area.name}</span><b>{districtCount(area.name)}<small>곳</small></b></button>)}
        </div>
        <div className="mv5-city-map-caption"><span>지역 선택용 AI 개념 모형 · 정확한 위치와 이동 경로는 표시하지 않습니다.</span><a href={CITY_OVERVIEW.referenceUrl} target="_blank" rel="noreferrer">행정구역 참고 ↗</a></div>
      </section>
      <aside className="mv18-district-guide" aria-label="지역별 공간 안내">
        <p className="mv18-eyebrow">어느 지역으로 가볼까요?</p><h2>가까운 곳부터,<br />하나씩 살펴봐요.</h2>
        <div className="mv18-district-list">{DISTRICT_NAMES.map(name => <button key={name} aria-pressed={district === name} aria-controls="mv18-places" onClick={() => chooseRegion(name)}><span><b>{name}</b><small>{DISTRICT_COPY[name]}</small></span><strong>{districtCount(name)}<small>곳</small><ArrowRight size={16} /></strong></button>)}</div>
        <button className="mv18-start-photo" onClick={() => onSelect('hanbit')}><span>먼저 길이 보이는 사진부터<small>한빛탑 보도와 진입로 살펴보기</small></span><ArrowRight size={20} /></button>
      </aside>
    </div>
    <section ref={collection} id="mv18-places" className="mv18-collection" tabIndex={-1} aria-label="장소별 미니어처 모음">
      <div className="mv5-city-collection-heading"><div><p className="mv18-eyebrow">미니어처에서 실제 사진으로</p><h2>{district === '전체' ? '대전의 모든 공간' : district + '의 공간'}</h2></div><p>모형 {FINALS_PLACES.length}곳 · 실제 사진 {countPhotos(FINALS_PLACES)}장</p></div>
      <div className="mv6-city-toolbar">
        <div className="mv6-district-filters" role="group" aria-label="지역별 장소 선택">{['전체', ...DISTRICT_NAMES].map(name => <button key={name} aria-pressed={district === name} className={district === name ? 'is-selected' : ''} onClick={() => setDistrict(name)}>{name}<span>{districtCount(name)}</span></button>)}</div>
        <label className="mv6-city-search"><MagnifyingGlass size={18} /><input type="search" aria-label="장소 이름 검색" placeholder="장소 이름 또는 시설 유형" value={query} onChange={event => setQuery(event.target.value)} /></label>
      </div>
      <div className="mv18-space-filters" role="group" aria-label="시설 유형 선택">{SPACE_TYPES.map(type => <button key={type} aria-pressed={spaceType === type} onClick={() => setSpaceType(type)}>{type}</button>)}</div>
      <div className="mv18-results-bar"><p role="status">{district} · {spaceType === '전체' ? '모든 시설' : spaceType} · <b>{places.length}곳</b>{query.trim() && ' · “' + query.trim() + '”'}</p><label><input type="checkbox" checked={onlySegments} onChange={event => setOnlySegments(event.target.checked)} />이동 구간 사진 있는 곳만 ({segmentPlaceCount})</label></div>
      <div className="mv5-city-model-list mv18-model-list">{places.map(place => <button key={place.id} className="mv5-city-model-card" aria-label={'목록에서 ' + place.name + ' 사진 살펴보기 · ' + getPlaceReview(place).label} onClick={() => onSelect(place.id)}>
        <div className="mv5-city-model-image"><img src={getPlaceMiniature(place.id).image} alt={getPlaceMiniature(place.id).alt} loading="lazy" decoding="async" /><span>{number(place)}</span></div>
        <div className="mv5-city-model-copy"><small>{place.district} · {spaceTypeFor(place)}</small><strong>{place.name}</strong><span className={getPlaceReview(place).hasSegments ? 'wr-has-segment' : 'wr-needs-segment'}><i />{getPlaceReview(place).label}</span><span className="mv18-card-footer"><Camera size={15} /> {place.referenceOnly ? '외관 참고' : '실제 사진'} {place.checkpoints.length}장<ArrowRight size={19} /></span></div>
      </button>)}</div>
      {places.length === 0 && <div className="mv6-empty"><p>조건에 맞는 장소가 없어요.</p><button onClick={clearFilters}>모든 조건 초기화</button></div>}
      <p className="mv5-city-collection-note"><MapPin size={17} /><span>이동 구간 일부 {segmentPlaceCount}곳 · 이동 사진 준비 중 {FINALS_PLACES.length - segmentPlaceCount}곳. 미니어처는 장소를 알아보는 참고 표현이며, 출입문까지 이어지는 경로는 모두 확인 전입니다.</span></p>
    </section>
  </main>;
}
