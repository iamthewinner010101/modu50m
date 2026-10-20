import {useRef,useState} from 'react';
import {MapPin,Camera,PencilSimple,CheckCircle,ChatCircleDots,Question,X} from '@phosphor-icons/react';

export default function FirstVisitHelp(){
  const [open,setOpen]=useState(false),trigger=useRef(null);
  const close=()=>{setOpen(false);requestAnimationFrame(()=>trigger.current?.focus());};
  return <><button ref={trigger} className="sv-help-trigger" onClick={()=>setOpen(true)}><Question size={18}/> 이용 방법</button>{open&&<dialog className="sv-help-dialog" aria-labelledby="sv-help-title" ref={node=>{if(node&&!node.open)node.showModal();}} onCancel={e=>{e.preventDefault();close();}}>
    <header><div><small>처음 이용하시나요?</small><h2 id="sv-help-title">가고 싶은 곳의 길을, 미리 살펴봐요.</h2></div><button aria-label="이용 방법 닫기" onClick={close} autoFocus><X size={22}/></button></header>
    <p>휠체어로 처음 방문할 때 궁금한 정류장·보도·입구를 실제 사진으로 비교하는 서비스예요.</p>
    <ol>{[[MapPin,'장소와 내리는 쪽을 고르세요','방문할 10곳 중 한 곳을 선택해요. 정류장 이름·번호·어느 쪽 보도인지와 찾아갈 입구를 먼저 읽어요.'],[Camera,'01번부터 사진을 살펴보세요','미니어처 번호를 누르면 그 구간의 사진과 이동 안내가 보여요. 사진의 A·B는 살펴볼 부분이에요. 다음 번호 버튼으로 순서대로 비교할 수 있어요.'],[ChatCircleDots,'같은 위치를 다른 사람에게 보내세요','‘이 위치 링크 복사’를 누르면 같은 위치와 사진을 여는 주소를 보낼 수 있어요. 공유 댓글은 이 공개 화면에서는 지원하지 않아요.'],[PencilSimple,'나만의 관찰도 표시하세요','사진 아래 표시하기를 눌러 사각형을 추가하고, 궁금하거나 걱정되는 이유를 적어요. 이 관찰은 내 브라우저에 보관해요.'],[CheckCircle,'방문 준비를 보관하세요','살펴본 구간을 체크하고 더 확인할 질문을 저장해요. ‘내 방문 메모’에 저장하고 사진과 함께 파일로 보관할 수 있어요.']].map(([Icon,title,body],i)=><li key={title}><Icon size={23}/><div><strong>{i+1}. {title}</strong><p>{body}</p></div></li>)}</ol>
    <aside><strong>사진으로 알 수 있는 만큼, 정확하게</strong><p>미니어처는 사진을 고르는 AI 참고 그림이에요. 사진이 없는 연결·실제 폭과 경사·현재 통행 여부는 별도로 확인해요. 위치 댓글은 같은 서비스에서 함께 보며, 내 관찰과 준비 카드는 이 기기·브라우저에 보관해요. 댓글과 공감은 사용자의 의견이에요.</p></aside>
    <button className="sv-help-done" onClick={close}>알겠어요, 살펴볼게요 <CheckCircle size={19}/></button>
  </dialog>}</>;
}
