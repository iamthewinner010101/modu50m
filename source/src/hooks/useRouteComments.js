import {useCallback,useEffect,useRef,useState} from 'react';
import {ROUTE_COMMENT_EXAMPLES} from '../data/routeCommentExamples.js';
import {readRouteComments,requestRouteComments} from '../utils/routeCommentRequest.js';

export default function useRouteComments(place){
  const publicPreview=import.meta.env.VITE_PUBLIC_PREVIEW==='true';
  const enabled=!!ROUTE_COMMENT_EXAMPLES[place];
  const [state,setState]=useState({notes:[],status:publicPreview?'static':'loading',error:'',updated:null});
  const sequence=useRef(0),writing=useRef(false);
  const [busy,setBusy]=useState(false);
  const qa=new URLSearchParams(window.location.search).get('qa')==='1';
  const endpoint=useCallback((suffix='')=>`/api/route-comments${suffix}?${new URLSearchParams({place,...(qa?{qa:'1'}:{})})}`,[place,qa]);
  const request=useCallback((suffix='',options={})=>(options.method||'GET')==='GET'
    ?readRouteComments(endpoint(suffix)):requestRouteComments(endpoint(suffix),options),[endpoint]);
  const refresh=useCallback(async()=>{
    if(publicPreview||!enabled||writing.current)return;
    const seq=++sequence.current;
    try{
      const data=await request();
      if(data.storage!=='shared-server')throw new Error('공유 서버를 확인하지 못했어요.');
      if(sequence.current===seq)setState({notes:data.notes,status:'ready',error:'',updated:new Date()});
    }catch(error){
      if(sequence.current===seq)setState(previous=>({...previous,status:'unavailable',error:error.code==='ROUTE_COMMENTS_TIMEOUT'?error.message:'댓글을 불러오지 못했어요. 새로고침을 눌러 주세요.'}));
    }
  },[enabled,request]);
  const invalidate=useCallback(()=>{sequence.current++;},[]);
  useEffect(()=>{
    if(publicPreview||!enabled)return;
    const first=setTimeout(()=>void refresh(),0);
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},20000);
    const visible=()=>{if(document.visibilityState==='visible')void refresh();};
    document.addEventListener('visibilitychange',visible);
    return()=>{clearTimeout(first);clearInterval(timer);document.removeEventListener('visibilitychange',visible);invalidate();};
  },[enabled,refresh,invalidate]);
  const mutate=async(suffix,method,body)=>{
    if(writing.current)throw new Error('저장 중이에요. 잠시 기다려 주세요.');
    writing.current=true;setBusy(true);const seq=++sequence.current;
    try{
      const data=await request(suffix,{method,...(body?{body:JSON.stringify(body)}:{})});
      if(sequence.current===seq)setState({notes:data.notes,status:'ready',error:'',updated:new Date()});
      return data;
    }finally{writing.current=false;setBusy(false);}
  };
  return {...state,enabled,busy,qa,refresh,publicPreview,
    post:body=>mutate('','POST',body),
    react:(id,active)=>mutate(`/${id}/reaction`,'PUT',{active}),
    remove:id=>mutate(`/${id}`,'DELETE'),
  };
}
