import { ArrowRight, Bus, Camera, Info, MapPin } from '@phosphor-icons/react';
import { HANBIT_ARRIVAL } from '../data/hanbitArrival.js';
import { getCityPlace } from '../data/previewCityPlaces.js';
import HanbitLocationMap from './HanbitLocationMap.jsx';
import './HanbitArrivalGuide.css';

export default function HanbitArrivalGuide({ compact = false, selectedPoint, entrancePhotoId, onSelectPoint, onViewPhoto }) {
  const site = getCityPlace('hanbit');
  return <section className={`ha-guide ${compact ? 'ha-compact' : ''}`} aria-label="한빛탑 버스 방문 안내">
    <div className="ha-intro"><p><Bus size={18} weight="fill" /> 버스로 도착 <ArrowRight size={14} /> <MapPin size={16} /> 한빛탑</p><h2>{compact ? '내린 뒤, 입구까지의 장애물은?' : '버스에서 내린 뒤, 이런 지점을 살펴봐요.'}</h2><span>{compact ? '단계를 누르면 실제 사진의 장애물 표시를 볼 수 있어요.' : '01–04는 살펴볼 단계, 사진의 A·B·C는 장애물·주의 지점입니다. 표시를 눌러 설명을 확인하세요.'}</span></div>
    {!compact && <HanbitLocationMap site={site} selectedPoint={selectedPoint} onSelectPoint={onSelectPoint} onViewPhoto={onViewPhoto} />}
    <ol className="ha-steps" aria-label="버스 도착 후 살펴볼 단계">{HANBIT_ARRIVAL.steps.map(step => <li key={step.id} className={step.missing ? 'ha-missing' : ''}>
      {step.missing && entrancePhotoId ? <button onClick={() => onSelectPoint(entrancePhotoId)} aria-label="04 탑 입구 앞 경사로 사진 보기"><b>04</b><div><small>공개 현장 사진 추가</small><strong>탑 입구 앞 경사로</strong><span>볼라드 · 기울기 · 문 앞 바닥</span><em>앞 사진들과 연결 확인 전</em></div><ArrowRight className="ha-step-arrow" size={17} /></button> : step.missing ? <div className="ha-step-gap"><b>{step.number}</b><div><strong>{step.title}</strong><span>{step.targets}</span><small><Camera size={13} /> {step.status}</small></div></div> : <button onClick={() => onSelectPoint(step.id)} aria-label={`${step.number} ${step.title} 장애물 살펴보기`} aria-pressed={selectedPoint === step.id}>
        {compact && <img src={site.photos[step.id].image} alt="" />}<b>{step.number}</b><div><small>{step.action}</small><strong>{step.title}</strong><span>{step.targets}</span>{step.id === 'doorway' && <em>동측 사진과 떨어진 남측 장면</em>}</div><ArrowRight className="ha-step-arrow" size={17} />
      </button>}
    </li>)}</ol>
    <p className="ha-scope"><Info size={17} /><span><strong>방문 전 살펴볼 순서예요.</strong> 사진 사이의 실제 연결과 하차 정류장은 확인 전입니다.</span></p>
  </section>;
}
