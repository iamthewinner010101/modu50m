import { useRef, useState } from 'react';
import { ArrowUpRight, MagnifyingGlassPlus, FloppyDisk, ArrowRight, CheckCircle, Info, FileText, Eye, ClipboardText, PencilSimple, CaretDown, ArrowUUpLeft } from '@phosphor-icons/react';
import { OBSERVATIONS } from '../data/hanbitPrecinct.js';
import { HANBIT_SITE } from '../data/daejeonPrecincts.js';
import { getPrecinctAnnotations } from '../data/precinctAnnotations.js';

export default function HanbitEvidencePanel({ point, draft, onChange, onSave, saving, saved, error, site = HANBIT_SITE, onNext, panelRef, onBackToMap }) {
  const imageDialog = useRef(null);
  const [failedImage, setFailedImage] = useState('');
  const source = site.photos[point.id];
  const photo = draft.photo || source;
  const isCollected = photo.id === source.id;
  const imageUrl = photo.dataUrl || photo.image;
  const unavailable = failedImage === imageUrl;
  const attention = getPrecinctAnnotations(site.id).attention.find(item => item.checkpointId === point.id);
  const isWest = isCollected && photo.id === 'arts-west-1078611219';
  return <aside ref={panelRef} className="hb-evidence" aria-label="사진 근거와 관찰 기록" data-selected-photo={point.id}>
    <button className="hb-back-map" onClick={onBackToMap}><ArrowUUpLeft size={18} />지도에서 다른 지점 보기</button>
    <header className="hb-photo-heading" aria-live="polite">
      <span className="hb-photo-number">{point.number}</span>
      <div><h2>{point.title}</h2><p>{site.name} · 촬영 위치 {point.number}</p></div>
    </header>
    <figure className="hb-evidence-photo">
      <button aria-label="로드뷰 사진 크게 보기" disabled={unavailable} onClick={() => imageDialog.current.showModal()}>
        {!unavailable && <img src={imageUrl} alt={site.name + ' · ' + point.title + ' · ' + (isCollected ? '카카오 로드뷰 수집 사진' : '이전 기록 사진')} onError={() => setFailedImage(imageUrl)} />}
        <span className="hb-photo-zoom-hint"><MagnifyingGlassPlus size={19} />크게 보기</span>
      </button>
      <figcaption><span>{isCollected ? photo.captureDate.replaceAll('-', '.') + ' 촬영' : '이전 기록 · 출처 확인 필요'}</span><strong>{photo.historical ? '과거 자료 · 현재 상태 미확인' : 'Kakao Roadview'}</strong></figcaption>
    </figure>
    {unavailable && <p className="hb-error" role="alert">사진을 불러오지 못했습니다. 카카오 원본에서 확인해 주세요.</p>}
    <div className="hb-roadview-actions"><button onClick={() => imageDialog.current.showModal()} disabled={unavailable}><MagnifyingGlassPlus size={19} />사진 크게 보기</button><a href={source.sourceUrl} target="_blank" rel="noreferrer">카카오 360° 열기<ArrowUpRight size={19} /></a></div>
    <p className="hb-photo-format">지금은 원본에서 추출한 사진입니다. 360° 회전은 카카오에서 열립니다.</p>
    <div className="hb-evidence-columns">
      <section><h3><Eye size={19} />{isWest ? '사진에 보이는 것' : '사진에서 살펴볼 것'}</h3>{isWest ? <ul><li>장애인 전용주차 표지</li><li>진입부 배수로</li><li>방지턱과 차단 시설</li></ul> : <p>{point.question}</p>}</section>
      <section><h3><ClipboardText size={19} />현장에서 확인할 것</h3><ul>{attention.checks.map(item => <li key={item}>{item}</li>)}</ul></section>
    </div>
    <p className="hb-evidence-warning"><Info size={19} />현재 통행 가능 여부는 미확인입니다.</p>
    <details className="hb-disclosure" open={!!error || undefined}>
      <summary><PencilSimple size={20} />관찰 기록 남기기{saved && <CheckCircle size={18} />}<CaretDown size={18} /></summary>
      <div className="hb-disclosure-body">
        <p className="hb-photo-hint">{point.hint}</p>
        {!isCollected && <button className="hb-photo-replace" onClick={() => onChange({ photo: { ...source }, observation: 'unknown', note: '' })}>이번에 찾은 로드뷰로 전환</button>}
        <fieldset className="hb-observation"><legend>사진에서 확인</legend><p>{point.question}</p><div>{OBSERVATIONS.map(option => <button type="button" key={option.value} aria-pressed={draft.observation === option.value} className={draft.observation === option.value ? 'is-selected' : ''} onClick={() => onChange({ observation: option.value })}>{option.label}</button>)}</div></fieldset>
        <label className="hb-field"><span>관찰 메모 <small>선택</small></span><textarea rows="2" maxLength="1000" value={draft.note} placeholder="보이는 것과 모르는 것을 나눠 적어요." onChange={event => onChange({ note: event.target.value })} /></label>
        <label className="hb-field"><span>다음 확인</span><textarea rows="2" maxLength="500" value={draft.nextAction} onChange={event => onChange({ nextAction: event.target.value })} /></label>
        {error && <p className="hb-error" role="alert">{error}</p>}
        <button className="hb-primary" onClick={onSave} disabled={saving || unavailable}>{saved ? <CheckCircle size={19} /> : <FloppyDisk size={19} />}{saving ? '저장 중…' : saved ? '저장했어요 · 다시 저장' : '관찰 기록 저장'}</button>
        <p className="hb-storage-note">이 브라우저에 저장 · 현장 검증 결과와 별개</p>
      </div>
    </details>
    <details className="hb-disclosure"><summary><FileText size={20} />출처 정보<CaretDown size={18} /></summary><div className="hb-disclosure-body hb-source-card"><dl><div><dt>제공</dt><dd>{source.provider}</dd></div><div><dt>촬영일</dt><dd>{source.captureDate}</dd></div><div><dt>원본 번호</dt><dd>{source.panoId}</dd></div><div><dt>카메라 좌표</dt><dd>{source.camera.lat.toFixed(6)}, {source.camera.lon.toFixed(6)}</dd></div></dl><p>{site.coverage}</p><p>카메라 좌표는 위험요소나 출입문 좌표가 아닙니다.</p></div></details>
    {onNext && <button className="hb-next-point" onClick={onNext}>다음 사진 확인<ArrowRight size={18} /></button>}
    <dialog className="hb-dialog hb-image-dialog" ref={imageDialog} aria-label={point.title + ' 로드뷰 확대'}><form method="dialog"><button className="hb-close-dialog">닫기</button></form><h2>{point.number} · {point.title}</h2><img src={imageUrl} alt={point.title + ' 로드뷰 확대'} /><p>{isCollected ? 'Kakao Roadview · 촬영 ' + source.captureDate + ' · panorama ' + source.panoId : photo.name}</p><p>{point.hint}</p><a className="hb-text-link" href={source.sourceUrl} target="_blank" rel="noreferrer">카카오 원본에서 360° 둘러보기<ArrowUpRight size={16} /></a></dialog>
  </aside>;
}
