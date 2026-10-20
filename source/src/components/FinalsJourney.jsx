import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Pause, Play, X } from '@phosphor-icons/react';
import { getFinalsPlace, PRESENTATION_STEPS } from '../data/finalsCatalog.js';
import './FinalsExperience.css';

export { default as PlaceSceneOverview } from './PlaceMiniatureOverview.jsx';

export function FinalsOpening({ onStart }) {
  const site = getFinalsPlace('hanbit');
  return <main id="mv5-main" className="fj-opening"><div className="fj-opening-copy"><span className="fn-eyebrow">모두의 50m · 목적지 앞 마지막 길</span><h1>지도에는 도착.<br />입구까지는<br /><em>아직 질문이 남아요.</em></h1><p>가로수 옆을 지날 수 있을까?<br />보도 끝의 턱은 얼마나 높을까?<br />이 길은 실제 출입문까지 이어질까?</p><button className="fn-primary" onClick={onStart}>가고 싶은 곳 고르기 <ArrowRight size={21} /></button><small>‘50m’는 마지막 접근 구간에 집중한다는 작품명입니다.<br />아직 측정하지 않은 길을 50m로 표시하지 않습니다.</small></div><figure><img src={site.photos.approach.image} alt="한빛탑 동측 정류장 주변 실제 사진. 보도에 가로수와 정류장 시설이 보인다." /><figcaption><Camera size={18} /><div><strong>한빛탑 동측 · 정류장 주변</strong><span>카카오 로드뷰 · 2025.09.10 촬영</span></div><span>실제 사진</span></figcaption><div className="fj-opening-question">장소를 아는 것만으로<br /><strong>마지막 길도 알 수 있을까요?</strong></div></figure><div className="fj-principles"><div><b>01</b><strong>사진으로 관찰</strong><span>보이는 사실을 구체적으로</span></div><div><b>02</b><strong>모르면 남기기</strong><span>안 보이는 이유와 다음 확인</span></div><div><b>03</b><strong>같은 근거로 이어보기</strong><span>저장 · 재열기 · 수정 이력</span></div></div></main>;
}

export function PresentationBar({ step, onStep, onClose }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const clock = useRef({ elapsed: 0, started: 0 });
  useEffect(() => {
    if (!running) return;
    const state = clock.current;
    state.started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((state.elapsed + Date.now() - state.started) / 1000)), 500);
    return () => { clearInterval(timer); state.elapsed += Date.now() - state.started; };
  }, [running]);
  function resetClock() { clock.current.elapsed = 0; clock.current.started = Date.now(); setRunning(false); setSeconds(0); }
  const current = PRESENTATION_STEPS[step];
  const total = PRESENTATION_STEPS.length;
  return <aside className="fj-presenter" aria-label="발표 진행 안내"><div className="fj-presenter-top"><span>시연 가이드 <b>{step + 1} / {total}</b></span><div className={seconds >= 300 ? 'fj-time is-over' : 'fj-time'}><button aria-label={running ? '리허설 타이머 일시정지' : '리허설 타이머 시작'} onClick={() => setRunning(value => !value)}>{running ? <Pause size={16} /> : <Play size={16} />}</button><b>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</b><button onClick={resetClock}>초기화</button></div><button aria-label="시연 가이드 닫기" onClick={onClose}><X size={18} /></button></div><nav aria-label="발표 단계">{PRESENTATION_STEPS.map((item, index) => <button key={item.title} aria-current={step === index ? 'step' : undefined} onClick={() => onStep(index)}><b>{String(index + 1).padStart(2, '0')}</b>{item.title}</button>)}</nav><div className="fj-presenter-bottom"><button disabled={!step} aria-label="이전 발표 단계" onClick={() => onStep(step - 1)}><ArrowLeft size={20} /></button><p><small>권장 {current.duration} · {current.criterion}</small>{current.cue}</p><button disabled={step === total - 1} aria-label="다음 발표 단계" onClick={() => onStep(step + 1)}><ArrowRight size={20} /></button></div></aside>;
}
