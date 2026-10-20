import {useEffect,useRef,useState} from 'react';
import {createImageAnnotator} from '@annotorious/annotorious';
import '@annotorious/annotorious/annotorious.css';
import {regionEvidence,regionKey,rectangleAnnotation,parseRegions,saveRegions} from '../utils/photoRegionNotes.js';
import './PhotoRegionEditor.css';

export default function PhotoRegionEditor({placeId,photo,onClose,onSaved}) {
  const image=useRef(null),instance=useRef(null),baseline=useRef(null),size=useRef(null),changed=useRef(false);
  const [selected,setSelected]=useState(null),[reason,setReason]=useState(''),[marks,setMarks]=useState([]);
  const [ready,setReady]=useState(false),[dirty,setDirty]=useState(false),[drawing,setDrawing]=useState(false),[message,setMessage]=useState('');
  const evidence=regionEvidence(placeId,photo),qa=new URLSearchParams(location.search).get('qa')==='1';
  const key=regionKey(evidence,qa);
  const refresh=()=>setMarks(instance.current?.getAnnotations()||[]);
  function touch(){changed.current=true;setDirty(true);setMessage('변경한 표시를 저장해 주세요.');}
  useEffect(()=>{
    const img=image.current;
    let disposed=false;
    const init=()=>{
      if(disposed||instance.current)return;
      try {
        const dimensions={width:img.naturalWidth,height:img.naturalHeight};size.current=dimensions;
        const raw=localStorage.getItem(key),saved=parseRegions(raw,regionEvidence(placeId,photo),dimensions);baseline.current=raw;
        const anno=createImageAnnotator(img,{drawingEnabled:false,autoSave:true,
          style:{fill:'#eeb642',fillOpacity:.16,stroke:'#ae6f0c',strokeWidth:2}});
        instance.current=anno;
        anno.setAnnotations(saved.marks.map(rectangleAnnotation));
        anno.on('createAnnotation',annotation=>{anno.setDrawingEnabled(false);setDrawing(false);anno.setSelected(annotation.id);touch();refresh();});
        anno.on('updateAnnotation',()=>{touch();refresh();});
        anno.on('deleteAnnotation',()=>{touch();refresh();});
        anno.on('selectionChanged',annotations=>{const a=annotations[0];setSelected(a?.id||null);setReason(a?.bodies.find(b=>b.purpose==='commenting')?.value||'');});
        setMarks(anno.getAnnotations());setReady(true);
        setMessage(saved.marks.length?`이 사진의 저장된 표시 ${saved.marks.length}개를 불러왔어요.`:'사진에서 걱정되는 부분을 표시하고 이유를 적어 보세요.');
      }catch(e){setMessage(`표시를 열지 못했어요. ${e.message}`);}
    };
    if(img.complete&&img.naturalWidth)init();else img.addEventListener('load',init);
    return()=>{disposed=true;img.removeEventListener('load',init);instance.current?.destroy();instance.current=null;};
    // The editor is keyed to a photo and unmounted when closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[key]);
  function add() {
    if(marks.length>=30){setMessage('사진 한 장에 최대 30곳까지 표시할 수 있어요.');return;}
    const {width,height}=size.current,id=crypto.randomUUID();
    instance.current.addAnnotation(rectangleAnnotation({id,rect:{x:width*.35,y:height*.35,w:width*.3,h:height*.3}}));
    instance.current.setSelected(id);touch();refresh();
  }
  function writeReason(value) {
    const anno=instance.current,a=anno.getAnnotationById(selected);if(!a)return;
    anno.updateAnnotation({...a,bodies:[{id:`${a.id}-reason`,annotation:a.id,purpose:'commenting',value}]});
    setReason(value);touch();refresh();
  }
  function adjust(axis,amount) {
    const anno=instance.current,a=anno.getAnnotationById(selected);if(!a)return;
    const g=a.target.selector.geometry,{width,height}=size.current;
    const next={x:g.x,y:g.y,w:g.w,h:g.h};
    next[axis]+=amount*(axis==='x'||axis==='w'?width:height)*.02;
    next.w=Math.max(5,Math.min(width,next.w));next.h=Math.max(5,Math.min(height,next.h));
    next.x=Math.max(0,Math.min(width-next.w,next.x));next.y=Math.max(0,Math.min(height-next.h,next.y));
    anno.updateAnnotation(rectangleAnnotation({id:a.id,rect:next,reason}));touch();refresh();
  }
  function save() {
    try{const result=saveRegions(localStorage,key,evidence,size.current,instance.current.getAnnotations(),baseline.current);baseline.current=result.raw;changed.current=false;setDirty(false);setMessage(`이 사진의 표시 ${result.packet.marks.length}개를 이 브라우저에 저장했어요.`);onSaved?.(result.packet.marks.length);}catch(e){setMessage(e.message);}
  }
  function close(){if(changed.current){setMessage('저장하지 않은 변경이 있어요. 저장하거나 ‘변경 버리고 닫기’를 눌러 주세요.');return;}onClose();}
  return <dialog className="region-dialog" ref={node=>{if(node&&!node.open)node.showModal();}} onCancel={e=>{e.preventDefault();close();}} aria-label="사진에서 걱정되는 곳 표시">
    <header><div><small>나의 사진 관찰</small><strong>{photo.title}</strong></div><button onClick={close} autoFocus>닫기 ×</button></header>
    <div className="region-layout"><div className="region-scene"><div className="region-instruction">① 사각형으로 표시 → ② 걱정되는 이유 → ③ 저장</div><div className="region-image"><img ref={image} src={photo.image} alt={`${photo.title}에 직접 표시하기`} onError={()=>setMessage('사진을 불러오지 못했어요. 닫고 다시 열어 주세요.')}/></div><p>직접 표시한 부분은 나의 관찰이에요. 실제 통과 가능 여부는 현장 확인이 필요해요.</p><a href={photo.sourceUrl} target="_blank" rel="noreferrer">이 사진의 원본 출처 ↗</a></div>
      <section className="region-panel"><h3>어느 부분이 걱정되나요?</h3><p>사진 위를 끌어 사각형을 그리거나, 표시를 추가한 뒤 위치를 옮겨 보세요.</p>
        <div className="region-actions"><button disabled={!ready} aria-pressed={drawing} onClick={()=>{const value=!drawing;instance.current.cancelSelected();instance.current.setDrawingEnabled(value);setDrawing(value);setMessage(value?'사진 위를 끌어 사각형을 그려 주세요.':'저장된 표시를 눌러 수정할 수 있어요.');}}>직접 그리기</button><button disabled={!ready} onClick={add}>사각형 추가</button></div>
        <div className="region-list" role="group" aria-label="이 사진에 표시한 곳">{marks.map((m,i)=><button key={m.id} aria-pressed={selected===m.id} onClick={()=>{instance.current.setDrawingEnabled(false);setDrawing(false);instance.current.setSelected(m.id);}}>표시 {i+1} · {m.bodies[0]?.value?.slice(0,28)||'이유를 적어 주세요'}</button>)}</div>
        {selected&&<><label htmlFor="region-reason">걱정되는 이유</label><textarea id="region-reason" value={reason} maxLength={500} onChange={e=>writeReason(e.target.value)} placeholder="예: 보도 턱이 높아 보여요. 휠체어로 올라갈 수 있는지 궁금해요."/><details className="region-position"><summary>버튼으로 위치·크기 조절</summary><div>{[['왼쪽','x',-1],['오른쪽','x',1],['위','y',-1],['아래','y',1],['너비 줄이기','w',-1],['너비 늘리기','w',1],['높이 줄이기','h',-1],['높이 늘리기','h',1]].map(([label,axis,amount])=><button key={label} onClick={()=>adjust(axis,amount)}>{label}</button>)}</div></details><button className="region-delete" onClick={()=>{instance.current.removeAnnotation(selected);instance.current.cancelSelected();setSelected(null);setReason('');touch();refresh();}}>선택한 표시 삭제</button></>}
        <button className="region-save" disabled={!ready||!dirty} onClick={save}>이 사진의 표시 저장</button>
        <p className="region-status" role="status">{message}</p><small>이 기기·브라우저에 보관해요. 다른 사람에게 공개되지 않아요.</small>
        {dirty&&<button className="region-discard" onClick={onClose}>변경 버리고 닫기</button>}
      </section></div>
  </dialog>;
}
