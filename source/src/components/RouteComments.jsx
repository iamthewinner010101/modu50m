import {arrivalReferenceText} from '../data/parkingArrivalRoutes.js';
import {useId,useState} from 'react';
import {ChatCircleDots,ArrowClockwise,ArrowBendUpLeft,LinkSimple} from '@phosphor-icons/react';
import {journeyLocationUrl,questionBoardThreads} from '../utils/journeyLocation.js';
import {getArrivalRoute} from '../data/arrivalRoutes.js';
import {ROUTE_COMMENT_EXAMPLES} from '../data/routeCommentExamples.js';
import photoHashes from '../data/finalsPhotoHashes.generated.json' with {type:'json'};
import './RouteComments.css';

const labels={caution:'조심할 곳',question:'궁금한 점',tip:'알려줄 점'};
const blank=()=>({body:'',nickname:'',kind:'question',parent:null,requestKey:null,photo:null});
const date=value=>new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));

export default function RouteComments({site,route,selected,photo,comments,open,scope='step',onScopeChange,onToggle,onPhotoSelect,panelRef}){
  const step=route.steps[selected],uid=useId();
  const [drafts,setDrafts]=useState({}),[notice,setNotice]=useState(null),[expandedList,setExpandedList]=useState(null),[sharedLink,setSharedLink]=useState(null);
  const [search,setSearch]=useState(''),[questionFilter,setQuestionFilter]=useState('all');
  if(!step||!comments.enabled)return null;
  const draft=drafts[step.id]||blank(),notes=comments.notes.filter(n=>n.step===step.id);
  const message=notice?.step===step.id?notice.message:'',error=notice?.step===step.id?notice.error:'';
  const setMessage=value=>setNotice({step:step.id,message:value,error:''});
  const setError=value=>setNotice({step:step.id,message:'',error:value});
  const allRoots=comments.notes.filter(note=>!note.parent);
  const roots=questionBoardThreads(comments.notes,{step:step.id,scope,query:search,filter:questionFilter});
  const latest=notes.filter(note=>!note.parent).at(-1);
  const visibleRoots=expandedList===step.id?roots:roots.slice(-3);
  function noteLocation(note){
    const target=[route,getArrivalRoute(site.id,route.arrival==='parking'?'bus':'parking')].find(r=>r?.steps.some(s=>s.id===note.step));
    if(!target)return null;
    const index=target.steps.findIndex(s=>s.id===note.step);
    const url=journeyLocationUrl(location.href,target,index,{photo:note.photo,comments:true});
    url.searchParams.set('board','1');
    return {title:target.steps[index].title,href:url.href};
  }
  const examples=(ROUTE_COMMENT_EXAMPLES[site.id]||[]).filter(n=>n.step===step.id).map(n=>({...n,body:arrivalReferenceText(route,n.body)}));
  const patch=value=>{setDrafts(previous=>({...previous,[step.id]:{...blank(),...previous[step.id],...value,requestKey:null,photo:null}}));setMessage('');setError('');};
  const act=async action=>{setMessage('');setError('');try{await action();}catch(err){setError(err.message?.match(/[가-힣]/)?err.message:'저장 결과를 확인하지 못했어요. 글은 그대로 두었어요. 다시 불러와 확인해 주세요.');}};
  const submit=async e=>{
    e.preventDefault();
    if(!draft.body.trim())return;
    const snapshot={...draft,requestKey:draft.requestKey||crypto.randomUUID(),photo:draft.requestKey?draft.photo:photo?.image||null};
    setDrafts(previous=>({...previous,[step.id]:snapshot}));
    await act(async()=>{
      await comments.post({...snapshot,step:step.id});
      setDrafts(previous=>({...previous,[step.id]:{...blank(),nickname:snapshot.nickname}}));
      setMessage('댓글을 남겼어요. 다른 사람도 함께 볼 수 있어요.');
    });
  };
  const item=(note,reply=false)=><article key={note.id} className={`rc-note ${reply?'rc-reply':''}`}>
    <div className="rc-meta"><span className={`rc-kind rc-kind-${note.kind}`}>{labels[note.kind]}</span><strong>{note.nickname}</strong><time dateTime={note.created}>{date(note.created)}</time>{!!note.mine&&<small>내 글</small>}</div>
    {scope==='place'&&!reply&&noteLocation(note)&&<a className="rc-board-location" href={noteLocation(note).href}>{noteLocation(note).title} · 사진과 질문 보기 ↗</a>}
    <p>{note.body}</p>
    <div className="rc-actions">
      <button type="button" disabled={comments.busy||comments.status!=='ready'} aria-pressed={!!note.reacted} aria-label={`${note.body.slice(0,30)} 저도 궁금해요`} onClick={()=>act(()=>comments.react(note.id,!note.reacted))}>저도 궁금해요{note.reactions>0?` ${note.reactions}`:''}</button>
      {note.photo&&(photoHashes[note.photo]===note.photoSha?(note.step===step.id?<button type="button" onClick={()=>onPhotoSelect?.(note.photo)}>{note.photo===photo?.image?'댓글의 사진 보기':'이 댓글의 다른 사진 보기'}</button>:noteLocation(note)&&<a className="rc-board-location" href={noteLocation(note).href}>작성 당시 위치·사진 보기</a>):<small className="rc-photo-changed">작성 당시 사진이 바뀌었어요. 현재 구간 사진과 비교해 주세요.</small>)}
      {!reply&&note.step===step.id&&<button type="button" onClick={()=>{patch({parent:note.id,body:'',kind:'tip'});requestAnimationFrame(()=>panelRef.current?.querySelector('textarea')?.focus());}}><ArrowBendUpLeft size={14}/> 답글</button>}
      {!reply&&note.step!==step.id&&noteLocation(note)&&<a className="rc-board-location" href={noteLocation(note).href}>이 위치로 이동해 답글 쓰기</a>}
      {!!note.mine&&<button className="rc-delete" type="button" disabled={comments.busy} onClick={()=>act(()=>comments.remove(note.id))}>내 글 지우기</button>}
    </div>
  </article>;
  const parent=notes.find(n=>n.id===draft.parent);
  async function copyLocation(){
    const url=journeyLocationUrl(location.href,route,selected,{photo:photo?.image,comments:true}).href;
    try{await navigator.clipboard.writeText(url);setSharedLink({step:step.id,url,copied:true});}
    catch{setSharedLink({step:step.id,url,copied:false});}
  }
  if(comments.publicPreview)return <section className="rc-panel" aria-label="위치 공유 안내">
    <div className="rc-content">
      <strong>사진과 동선을 함께 살펴봐요</strong>
      <p>공유 댓글은 이 공개 화면에서 사용할 수 없어요. 개인 메모는 현재 브라우저에 저장돼요.</p>
      <div className="rc-share"><button type="button" onClick={copyLocation}><LinkSimple size={17}/> 이 위치 링크 복사</button><span>같은 위치와 사진을 다른 사람에게 보낼 수 있어요.</span></div>
      {sharedLink?.step===step.id&&<div className="rc-share-result" role="status"><label htmlFor={`${uid}-link`}>{sharedLink.copied?'위치 링크를 복사했어요.':'아래 주소를 선택해 복사해 주세요.'}</label><input id={`${uid}-link`} readOnly value={sharedLink.url} onFocus={e=>e.target.select()} aria-label="선택한 위치와 사진의 링크"/></div>}
    </div>
  </section>;
  return <section className="rc-panel" ref={panelRef} aria-label={`${String(selected+1).padStart(2,'0')} 위치 댓글`}>
    <button type="button" className="rc-toggle" aria-expanded={open} aria-controls={`${uid}-content`} onClick={onToggle}>
      <ChatCircleDots size={22}/><span><strong>{scope==='place'?`${site.name} 질문 게시판`:`${String(selected+1).padStart(2,'0')} 위치 질문·답글`} <b>{scope==='place'?allRoots.length:notes.length}</b></strong><small>{open?step.title:latest?latest.body:'궁금한 점을 남기고 다른 사람과 답을 나눕니다.'}</small></span><span className="rc-chevron">{open?'접기 −':'보기 ＋'}</span>
    </button>
    {open&&<div className="rc-content" id={`${uid}-content`}>
      <div className="rc-board-toolbar"><div role="group" aria-label="게시판 범위"><button type="button" aria-pressed={scope==='step'} onClick={()=>onScopeChange?.('step')}>현재 위치</button><button type="button" aria-pressed={scope==='place'} onClick={()=>onScopeChange?.('place')}>장소 전체 질문</button></div><label>질문 검색<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="하차 위치, 장애인 주차 등"/></label><label>글 보기<select value={questionFilter} onChange={e=>setQuestionFilter(e.target.value)}><option value="all">모든 글</option><option value="question">질문만</option><option value="unanswered">답글 없는 질문</option></select></label></div>
      <div className="rc-status"><span className={comments.status==='ready'?'rc-connected':'rc-offline'}>{comments.status==='ready'?'● 함께 보는 댓글':comments.status==='loading'?'연결 중…':'연결 확인 필요'}</span><button type="button" onClick={comments.refresh} disabled={comments.busy}><ArrowClockwise size={14}/> 새로고침</button></div>
      <div className="rc-share"><button type="button" onClick={copyLocation}><LinkSimple size={17}/> 이 위치 링크 복사</button><span>같은 번호·사진·댓글을 다시 열어요.</span></div>
      {sharedLink?.step===step.id&&<div className="rc-share-result" role="status"><label htmlFor={`${uid}-link`}>{sharedLink.copied?'위치 링크를 복사했어요.':'아래 주소를 선택해 복사해 주세요.'}</label><input id={`${uid}-link`} readOnly value={sharedLink.url} onFocus={e=>e.target.select()} aria-label="선택한 위치와 사진의 링크"/></div>}
      {comments.qa&&<p className="rc-test">기능 점검용 메모 공간 · 실제 메모와 별도로 저장돼요.</p>}
      {comments.error&&<p className="rc-error" role="alert">{comments.error}</p>}
      <form className="rc-form" onSubmit={submit}>
        <label htmlFor={`${uid}-body`}><strong>{parent?`${parent.nickname} 님에게 답글`:`${String(selected+1).padStart(2,'0')}번 ${step.title}에 질문·의견 쓰기`}</strong>{parent&&<button type="button" onClick={()=>patch({parent:null})}>답글 취소</button>}</label>
        {parent&&<blockquote className="rc-parent-preview">{parent.body}</blockquote>}
        <textarea id={`${uid}-body`} maxLength={500} rows={2} disabled={comments.busy} placeholder="여기는 조금 위험할 수도 있어요. 턱을 더 확인하고 싶어요." value={draft.body} onChange={e=>patch({body:e.target.value})}/>
        <div className="rc-kinds" role="group" aria-label="댓글 종류">{Object.entries(labels).map(([kind,label])=><button key={kind} type="button" disabled={comments.busy} aria-pressed={draft.kind===kind} onClick={()=>patch({kind})}>{label}</button>)}</div>
        <div className="rc-form-bottom"><details className="rc-name"><summary>이름 넣기 <small>선택</small></summary><label htmlFor={`${uid}-name`}>이름<input id={`${uid}-name`} maxLength={24} disabled={comments.busy} placeholder="방문 준비 중인 이웃" value={draft.nickname} onChange={e=>patch({nickname:e.target.value})}/></label></details><span>{draft.body.length}/500</span><button className="rc-submit" type="submit" disabled={comments.busy||comments.status!=='ready'||!draft.body.trim()}>{comments.busy?'저장 중…':parent?'답글 남기기':'댓글 남기기'}</button></div>
        <small className="rc-public">다른 사람도 함께 보는 의견이에요. 내 글은 이 브라우저에서 지울 수 있어요.</small>
      </form>
      {message&&<p className="rc-success" role="status">{message}</p>}{error&&<p className="rc-error" role="alert">{error}</p>}
      {visibleRoots.map(note=><div key={note.id}>{item(note)}{comments.notes.filter(n=>n.parent===note.id).map(n=>item(n,true))}</div>)}
      {roots.length>3&&<button className="rc-more" type="button" onClick={()=>setExpandedList(value=>value===step.id?null:step.id)}>{expandedList===step.id?'최근 댓글만 보기':`이전 댓글 ${roots.length-3}개 더 보기`}</button>}
      {!roots.length&&<p className="rc-empty">{search||questionFilter!=='all'?'조건에 맞는 글이 없습니다.':'아직 등록된 질문이 없습니다. 첫 질문을 남겨 주세요.'}</p>}
      {examples.length>0&&<details className="rc-examples"><summary>댓글 예시 보기</summary>{examples.map((example,i)=><div key={i}><span>사용법 예시 · 실제 방문자가 쓴 글이 아니에요</span><p>{example.body}</p><button type="button" onClick={()=>{patch({body:example.body,kind:example.kind,parent:null});panelRef.current?.querySelector('textarea')?.focus();}}>이 문장으로 작성하기</button></div>)}</details>}
    </div>}
  </section>;
}
