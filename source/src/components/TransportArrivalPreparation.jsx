import {useState} from 'react';
import {TRANSPORT_ARRIVALS,readArrivalCard,saveArrivalCard,arrivalCardText} from '../data/transportArrivals.js';
import {VISIT_CONTACTS} from '../data/visitContacts.js';
import {appendPreparationQuestion} from '../utils/previsitQuestions.js';
import PhotoGalleryButton from './PhotoGalleryButton.jsx';

export default function TransportArrivalPreparation({placeId}) {
  const trip=TRANSPORT_ARRIVALS[placeId],contact=VISIT_CONTACTS[placeId];
  const qa=new URLSearchParams(location.search).get('qa')==='1';
  const [stored,setStored]=useState(()=>{try{return readArrivalCard(localStorage,placeId,qa);}catch(e){return {error:e.message,arrival:'',onward:'아직 정하지 않았어요',question:''};}});
  const [card,setCard]=useState(stored),[feedback,setFeedback]=useState('');
  function change(key,value){setCard(c=>({...c,[key]:value}));setFeedback('저장하지 않은 변경이 있어요.');}
  function add(text){const result=appendPreparationQuestion(card.question,text);if(result.status==='added')change('question',result.value);setFeedback(result.status==='added'?'도착 후 준비 카드에 질문을 추가했어요. 아래에서 저장해 주세요.':result.status==='duplicate'?'이미 담은 질문이에요.':'질문이 1,600자를 넘어 추가하지 않았어요.');}
  function save(){try{const saved=saveArrivalCard(localStorage,placeId,qa,card,stored.raw);setStored(saved);setFeedback('도착 후 준비 카드를 저장했어요. 시내버스에서 입구까지의 준비 기록과 따로 보관돼요.');}catch(e){setFeedback(e.message);}}
  async function copy(){try{await navigator.clipboard.writeText(arrivalCardText(placeId,card,contact));setFeedback('도착 후 이동을 문의할 문장을 복사했어요. 문의가 전송된 것은 아니에요.');}catch{setFeedback('복사를 사용할 수 없어요. 카드 파일을 보관해 주세요.');}}
  function download(){const url=URL.createObjectURL(new Blob([arrivalCardText(placeId,card,contact)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`모두의50m-${placeId}-대전도착후-준비.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setFeedback('도착 후 준비 카드 파일을 만들었어요.');}
  return <section className="ta-preparation" aria-label="대전 도착 후 이동 준비"><div className="ta-heading"><p className="fv-eyebrow">처음 도착한 대전, 여기서부터 준비해요</p><h2>{trip.title}</h2><p>{trip.summary}</p><strong>출발 · {trip.start}</strong><p className="ta-evidence">{trip.evidence}</p><a href={trip.sourceUrl} target="_blank" rel="noreferrer">{trip.sourceLabel} ↗</a></div>
    <div className={`ta-layout ${trip.map?'has-map':''}`}>
      {trip.map&&<figure className="ta-map"><img src={trip.map.image} alt="동관 1층 공식 배치도. 위쪽은 하차장, 아래쪽은 서관 방향. 매장 번호와 휠체어 동선 번호는 다릅니다."/><figcaption><strong>동관 1층 · 공식 배치도</strong><p>{trip.map.scope}</p><small>{trip.map.credit}</small></figcaption><PhotoGalleryButton photos={[trip.map]}>안내도 확대해서 보기 ↗</PhotoGalleryButton></figure>}
      <div className="ta-stages"><h3>내가 확인할 네 단계</h3><p>아래는 확인할 순서예요. 사진으로 검증한 이동 경로는 아직 아니에요.</p><ol>{trip.steps.map((step,i)=><li key={step.id}><b>{String(i+1).padStart(2,'0')}</b><div><h4>{step.title}</h4><p>{step.question}</p><button onClick={()=>add(`[도착 후 ${String(i+1).padStart(2,'0')}] ${step.question}`)}>이 질문 담기</button></div></li>)}</ol></div>
    </div>
    <section className="ta-card" aria-label="나의 도착 후 준비 카드"><h3>나의 도착 후 준비 카드</h3><p>시내버스 → 건물 입구 카드와 따로 저장돼요. 도착 정보와 다음 교통편을 정하면 문의할 위치도 구체적이 돼요.</p><div className="ta-fields"><label>내 도착 정보<input value={card.arrival} maxLength={200} placeholder={placeId==='station'?'예: 방문일, 도착 시간, 열차번호':'예: 방문일, 도착 시간, 출발 터미널'} onChange={e=>change('arrival',e.target.value)}/></label><label>이어서 이용할 교통편<select value={card.onward} onChange={e=>change('onward',e.target.value)}>{['아직 정하지 않았어요','시내버스','지하철','택시·이동지원 차량','동행 차량'].map(item=><option key={item}>{item}</option>)}</select></label></div><label>도착 후 더 확인할 질문<textarea maxLength={1600} value={card.question} onChange={e=>change('question',e.target.value)} placeholder="위의 질문을 담거나, 내가 필요한 도움을 적어 보세요."/></label><div className="fv-card-actions"><button onClick={save} disabled={Boolean(stored.error)}>도착 후 카드 저장</button><button onClick={copy}>문의 문장 복사</button><button onClick={download}>도착 후 카드 파일 보관</button></div><p role="status">{stored.error||feedback||(stored.savedAt?'저장한 도착 후 준비 내용을 불러왔어요.':'입력한 내용은 이 기기·브라우저에 저장해요.')}</p><div className="ta-contact"><strong>{contact.name}</strong>{contact.phone&&<a href={`tel:${contact.phone}`}>{contact.phone} 전화</a>}<a href={trip.sourceUrl} target="_blank" rel="noreferrer">공식 안내에서 문의할 곳 찾기 ↗</a></div></section>
  </section>;
}
