import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bank, Bus, Camera, CornersOut, Eye, MapPin, Train, Tree, Buildings, X } from '@phosphor-icons/react';
import { CORE_CASES, CORE_MAP_IMAGE, getCoreCase } from '../data/coreNeighborhoods.js';
import { photoProviderLabel, photoDateLabel } from '../data/previewRoadviewSelection.js';
import HanbitArrivalGuide from './HanbitArrivalGuide.jsx';

const icons = { tourism: Tree, bus: Bus, culture: Buildings, civic: Bank, subway: Train };

function CasePhoto({ item, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);
  return <dialog className="cm-dialog" ref={ref} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-label={`${item.name} 사진과 확인할 내용`}>
    <header><div><small>{item.category} · {item.area}</small><h2>{item.name}</h2></div><button onClick={onClose} aria-label="사진 닫기"><X size={24} /></button></header>
    <img src={item.photo.image} alt={item.photoTitle} />
    <div className="cm-dialog-copy"><p>{photoProviderLabel(item.photo)} · {photoDateLabel(item.photo)} 촬영 · {item.photoTitle}</p><h3>{item.question}</h3><ul>{item.observations.map(text => <li key={text}>{text}</li>)}</ul><p><strong>다음 확인</strong> {item.next}</p><p>{item.scope}</p><a href={item.photo.sourceUrl} target="_blank" rel="noreferrer">사진 출처 열기 ↗</a></div>
  </dialog>;
}

export default function CoreNeighborhoodMap({ selectedId, onChange, onSelect, onAllPlaces, placeCount }) {
  const item = getCoreCase(selectedId);
  const isHanbitArrival = item.id === 'tourism' || item.id === 'bus';
  const [photoOpen, setPhotoOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const panel = useRef(null);
  function choose(id) { onChange(id); }
  function chooseOnMap(place) {
    choose(place.id);
    if (place.id === 'tourism' || place.id === 'bus') onSelect('hanbit', 'approach');
  }
  function openCase() {
    if (item.placeId) onSelect(item.placeId, item.pointId);
    else onSelect(item.id, 'scene');
  }
  return <main id="mv5-main" className="cm-main">
    <div className="cm-heading">
      <div><p className="cm-eyebrow"><MapPin size={15} weight="fill" /> 대전 · 도룡–만년–둔산</p><h1><span>도착하기 전,</span> <em>마지막 길</em>을 만나요.</h1><p>미니어처에서 장소를 찾고, 실제 사진에서 휠체어가 지나갈 길을 살펴보세요.</p></div>
      <button className="cm-all-link" onClick={onAllPlaces}>대전 {placeCount}곳 모두 보기 <ArrowRight size={17} /></button>
    </div>

    <div className="cm-categories" role="group" aria-label="대표 시설 유형 선택">{CORE_CASES.map(place => {
      const Icon = icons[place.id];
      return <button key={place.id} aria-pressed={item.id === place.id} onClick={() => choose(place.id)}><Icon size={23} weight={item.id === place.id ? 'fill' : 'regular'} /><span>{place.category}</span><small>{place.number}</small></button>;
    })}</div>

    <div className="cm-workspace">
      <section className="cm-map" aria-label="대전 핵심 지역 미니어처">
        <div className="cm-map-head"><span><i /> 도룡·만년의 문화관광에서 둔산의 일상까지</span><button aria-pressed={showLabels} onClick={() => setShowLabels(value => !value)}>{showLabels ? '이름 숨기기' : '이름 보이기'}</button></div>
        <div className={`cm-map-art ${showLabels ? '' : 'cm-labels-hidden'}`}>
          <img className="cm-base" src={CORE_MAP_IMAGE} alt="한빛탑과 갑천, 문화예술단지, 둔산의 생활권을 축약한 AI 미니어처 개념도. 번호는 사례 선택 위치이며 실제 출입구 좌표가 아닙니다." />
          <span className="cm-area cm-area-north">도룡 · 엑스포</span><span className="cm-area cm-area-mid">만년 · 문화예술</span><span className="cm-area cm-area-south">둔산 · 생활권</span>
          {CORE_CASES.map(place => <button key={place.id} className={`cm-pin ${item.id === place.id ? 'is-selected' : ''}`} style={{ left: `${place.pin[0]}%`, top: `${place.pin[1]}%` }} aria-label={`지도에서 ${place.name} 선택`} aria-pressed={item.id === place.id} onClick={() => chooseOnMap(place)}><b>{place.number}</b><span>{place.shortName || place.name}</span></button>)}
        </div>
        <div className="cm-map-key" role="group" aria-label="지도 번호와 장소">{CORE_CASES.map(place => <button key={place.id} aria-pressed={item.id === place.id} onClick={() => chooseOnMap(place)}><b>{place.number}</b>{place.shortName || place.name}</button>)}</div>
        <p className="cm-map-note">지역 관계를 축약한 AI 개념 모형 · 번호는 장소 선택용 · 실제 길은 사진에서 확인해요.</p>
        <button className="cm-mobile-photo-jump" onClick={() => isHanbitArrival ? onSelect('hanbit', 'approach') : panel.current?.scrollIntoView({ behavior: 'instant', block: 'start' })}>{isHanbitArrival ? '버스 도착 후 장애물 살펴보기' : `${item.name} 사진 보기`} <ArrowRight size={17} /></button>
      </section>

      <aside className={`cm-case ${isHanbitArrival ? 'cm-arrival-case' : ''}`} ref={panel} aria-label={isHanbitArrival ? '한빛탑 방문 단계 선택' : '선택한 시설의 실제 사진'}>
        {isHanbitArrival ? <HanbitArrivalGuide compact onSelectPoint={pointId => onSelect('hanbit', pointId)} /> : <>
        <div className="cm-case-top"><span className="cm-case-number">{item.number}</span><div><p>{item.category} · {item.area.split(' · ')[0]}</p><h2>{item.name}</h2></div><span className="cm-photo-tag"><Camera size={15} /> 사진</span></div>
        <button className="cm-photo-button" onClick={() => setPhotoOpen(true)} aria-label={`${item.name} 사진 확대`}><img src={item.photo.image} alt={item.photoTitle} /><span><CornersOut size={16} /> 확대</span></button>
        <div className="cm-case-body"><div className="cm-photo-credit"><span>{photoProviderLabel(item.photo)}</span><span>{photoDateLabel(item.photo)} 촬영</span></div><p className="cm-photo-title">{item.photoTitle}</p><h3>{item.question}</h3><p className="cm-observation"><Eye size={18} /><span>{item.observations[0]}</span></p><div className="cm-next"><b>다음으로 확인할 것</b><p>{item.next}</p></div><button className="cm-open" onClick={openCase}>사진과 확인할 내용 보기 <ArrowRight size={18} /></button><p className="cm-case-status">{item.status} · 현장 확인 전</p></div>
        </>}
      </aside>
    </div>

    <section className="cm-story" aria-label="모두의 50m가 보여주는 것"><div><small>모두의 50m가 연결하는 정보</small><h2>한 사람의 관찰이,<br />다음 사람의 출발점으로.</h2></div><article><span>01</span><h3>어디를 볼까요?</h3><p>모형과 시설 유형으로<br />살펴볼 장소를 찾습니다.</p></article><article><span>02</span><h3>무엇이 보이나요?</h3><p>실제 사진을 확대해<br />보도·턱·문 앞을 살펴봅니다.</p></article><article><span>03</span><h3>기록을 이어봐요.</h3><p>모르는 이유와 다음 확인을 저장하고,<br />같은 사진에서 다시 검토합니다.</p></article></section>
    {photoOpen && <CasePhoto item={item} onClose={() => setPhotoOpen(false)} />}
  </main>;
}
