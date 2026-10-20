import {useEffect,useId,useState} from 'react';
import {Car,Wheelchair,ChatCircleDots,MapPin,DownloadSimple,LinkSimple,QrCode} from '@phosphor-icons/react';
import QRCode from 'qrcode';
import {arrivalPreparationQuestions,arrivalLocationOptions,arrivalLocationLink,readArrivalLocation,journeyLocationUrl,nearbyArrivalContext} from '../utils/journeyLocation.js';
import './JourneyArrivalTools.css';

export default function JourneyArrivalTools({site,route,index,photo,onAddQuestion,onOpenBoard}) {
  const uid=useId();
  const [open,setOpen]=useState(false),[qr,setQr]=useState(null),[copy,setCopy]=useState(null);
  const [arrivalKind,setArrivalKind]=useState(()=>readArrivalLocation(location.search,site.id)?.kind||null);
  const [chosenId,setChosenId]=useState(()=>readArrivalLocation(location.search,site.id)?.id||null);
  const locationOptions=arrivalLocationOptions(arrivalKind);
  const arrivalLocation=locationOptions.find(item=>item.id===chosenId)||locationOptions.find(item=>item.placeId===site.id)||null;
  function chooseKind(kind){setArrivalKind(value=>value===kind?null:kind);setChosenId(null);}
  const url=journeyLocationUrl(location.href,route,index,{photo:photo?.image}).href;
  const context=nearbyArrivalContext(site.id);
  const questions=arrivalPreparationQuestions(route);
  useEffect(()=>{
    if(!open)return;
    let cancelled=false;
    QRCode.toDataURL(url,{width:560,margin:4,errorCorrectionLevel:'M'})
      .then(image=>{if(!cancelled)setQr({url,image});})
      .catch(()=>{if(!cancelled)setQr({url,error:'QR을 만들지 못했어요. 아래 주소를 복사해 주세요.'});});
    return()=>{cancelled=true;};
  },[open,url]);
  async function copyLink(){
    let timer;
    try{
      await Promise.race([
        navigator.clipboard.writeText(url),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('복사 대기 시간 초과')),2000);}),
      ]);
      setCopy({url,ok:true});
    }
    catch{setCopy({url,ok:false});}
    finally{clearTimeout(timer);}
  }
  return <div className="jat-tools">
    <div className="jat-location-toolbar" role="group" aria-label="하차·주차 위치와 질문">
      <button type="button" aria-pressed={arrivalKind==='taxi'} onClick={()=>chooseKind('taxi')}><Car size={20}/> 택시 하차 위치</button>
      <button type="button" aria-pressed={arrivalKind==='parking'} onClick={()=>chooseKind('parking')}><Wheelchair size={20}/> 장애인 지정주차</button>
      <button type="button" onClick={onOpenBoard}><ChatCircleDots size={20}/> 위치 공유 안내</button>
    </div>
    {arrivalKind&&<section className="jat-location-panel" aria-label={arrivalKind==='taxi'?'택시 위치 자료':'장애인 지정주차 위치 자료'}>
      <h3>{arrivalKind==='taxi'?'택시에서 내릴 곳을 살펴봅니다':'장애인 지정주차 구역을 찾습니다'}</h3>
      <label htmlFor={`${uid}-arrival-location`}>위치 자료 선택</label>
      <select id={`${uid}-arrival-location`} value={arrivalLocation?.id||''} onChange={e=>setChosenId(e.target.value)}>
        <option value="" disabled>사진·주소가 있는 장소를 선택하세요</option>
        {locationOptions.map(item=><option key={item.id} value={item.id}>{item.placeName} · {item.title}</option>)}
      </select>
      {!arrivalLocation?<p>이 장소의 등록 자료는 없습니다. 위 목록에서 위치 자료가 있는 장소를 볼 수 있습니다.</p>:<>
        <h4>{arrivalLocation.title}</h4><p className="jat-location-address"><MapPin size={17}/>{arrivalLocation.address}</p>
        {arrivalLocation.image&&<figure><div className="jat-parking-photo"><img src={arrivalLocation.image} alt={arrivalLocation.title}/><span className="jat-bay-pin" role="img" aria-label="사진 속 장애인 주차 표시" style={{left:`${arrivalLocation.focus[0]}%`,top:`${arrivalLocation.focus[1]}%`}}><Wheelchair size={24}/></span></div><figcaption>{arrivalLocation.landmark}</figcaption></figure>}
        {!arrivalLocation.image&&<p>{arrivalLocation.landmark}</p>}
        <p>{arrivalLocation.note}</p>
        <div className="jat-location-actions"><a href={`https://map.kakao.com/link/search/${encodeURIComponent(arrivalLocation.address.split(' · ')[0])}`} target="_blank" rel="noreferrer"><MapPin size={17}/> 주소로 지도 보기</a><a href={arrivalLocation.sourceUrl} target="_blank" rel="noreferrer">{arrivalLocation.sourceLabel} ↗</a>
          {arrivalLocation.placeId!==site.id&&<a href={arrivalLocationLink(location.href,arrivalLocation).href}>이 장소의 입구 사진 보기</a>}
          <button type="button" disabled={arrivalLocation.placeId!==site.id} title={arrivalLocation.placeId!==site.id?'이 장소의 입구 사진으로 이동한 뒤 메모합니다.':undefined} onClick={()=>onAddQuestion(`[${arrivalLocation.title}] ${arrivalLocation.address}. 휠체어를 내릴 공간과 실제 입구까지의 바닥을 확인하고 싶습니다.`)}>개인 메모에 담기</button>
          <button type="button" onClick={()=>{navigator.clipboard?.writeText(arrivalLocationLink(location.href,arrivalLocation).href).then(()=>setCopy({url:'arrival-location',ok:true})).catch(()=>setCopy({url:'arrival-location',ok:false}));}}>이 위치 주소 복사</button>
        </div>
        {copy?.url==='arrival-location'&&<p role="status">{copy.ok?'위치 자료를 여는 주소를 복사했습니다.':'주소를 복사하지 못했습니다.'}</p>}
        <small>출처 기준: {arrivalLocation.sourceDate||'사진 촬영일 미상'} · 자료 대조 2026.10.17</small>
      </>}
    </section>}
    {context&&<aside className="jat-context" aria-label="주변 주차장과 목적지 구분">
      <strong>인터뷰에서 알려 준 주차장을 구분합니다</strong>
      <p>{context.summary}</p>
      <span>이 화면 출발: {route.start.name} / 도착: {route.destination}</span>
      <a href={context.sourceUrl} target="_blank" rel="noreferrer">예술의전당 공식 장애인 이용 안내 ↗</a>
    </aside>}
    <div className="jat-options">
      <details className="jat-share" onToggle={e=>setOpen(e.currentTarget.open)}>
        <summary><QrCode size={19}/> 이 위치 QR·공유</summary>
        <div className="jat-share-content">
          <div className="jat-qr" aria-live="polite">
            {qr?.url===url&&qr.image?<img src={qr.image} width="280" height="280" alt={`${site.name} ${String(index+1).padStart(2,'0')}번 위치를 여는 QR코드`}/>:<p>{qr?.url===url&&qr.error?qr.error:'QR 준비 중…'}</p>}
          </div>
          <div className="jat-address">
            <strong>{site.name} · {route.arrival==='parking'?'주차장 출발':'버스 출발'} · {String(index+1).padStart(2,'0')}번</strong>
            <label htmlFor={`${uid}-url`}>같은 위치와 사진을 여는 주소</label>
            <input id={`${uid}-url`} value={url} readOnly onFocus={e=>e.currentTarget.select()}/>
            <div className="jat-actions">
              <button type="button" onClick={copyLink}><LinkSimple size={17}/> 주소 복사</button>
              {qr?.url===url&&qr.image&&<a href={qr.image} download={`모두의50m-${site.id}-${index+1}-QR.png`}><DownloadSimple size={17}/> QR 저장</a>}
            </div>
            <p role="status">{copy?.url===url?(copy.ok?'주소를 복사했어요.':'주소 칸을 선택해 복사할 수 있어요.'):'출발 방식·번호·사진을 함께 공유합니다.'}</p>
            {['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&<small>현재 주소는 이 컴퓨터의 미리보기입니다. 다른 기기에서는 공개 주소를 이용해 주세요.</small>}
          </div>
        </div>
      </details>
      <details className="jat-taxi">
        <summary><Car size={19}/> 택시에서 내릴 곳 준비</summary>
        <div className="jat-taxi-content">
          <strong>찾아갈 문: {route.destination}</strong>
          <p>버스·주차 동선과 별도로, 기사님이나 시설에 확인할 질문입니다.</p>
          <div className="jat-questions">{questions.map(item=><button key={item.label} type="button" onClick={()=>onAddQuestion(item.text)}>{item.label} 질문 담기</button>)}</div>
          <p>고른 질문은 내 방문 메모에서 수정하고 저장할 수 있어요.</p>
        </div>
      </details>
    </div>
  </div>;
}
