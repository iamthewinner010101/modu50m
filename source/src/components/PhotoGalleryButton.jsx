import {useEffect,useRef,useState} from 'react';
import 'photoswipe/style.css';
import './PhotoGalleryButton.css';
import imageDimensions from '../data/journeyPhotoDimensions.generated.json' with {type:'json'};
import {prepareGalleryPhotos} from '../utils/photoGalleryData.js';

const dimensions=new Map();
function measure(src) {
  if(!dimensions.has(src))dimensions.set(src,new Promise((resolve,reject)=>{
    const img=new Image();
    const finish=(error)=>{clearTimeout(timeout);img.onload=null;img.onerror=null;if(error){dimensions.delete(src);reject(error);}else resolve({width:img.naturalWidth,height:img.naturalHeight});};
    const timeout=setTimeout(()=>finish(new Error('사진 준비 시간이 초과됐어요.')),6000);
    img.onload=()=>finish();img.onerror=()=>finish(new Error('사진을 불러오지 못했어요.'));img.src=src;
  }));
  return dimensions.get(src);
}
function element(tag,text,cls) {const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}

export default function PhotoGalleryButton({photos,index=0,children,className='rp-zoom',onNavigate,preserveContentWhileLoading=false}) {
  const viewer=useRef(null),alive=useRef(false),button=useRef(null);
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;viewer.current?.destroy();};},[]);
  async function open() {
    setLoading(true);setError('');
    try {
      const [{default:PhotoSwipe},data]=await Promise.all([import('photoswipe'),prepareGalleryPhotos(photos,imageDimensions,measure)]);
      if(!alive.current)return;
      const pswp=new PhotoSwipe({dataSource:data,index,loop:false,mainClass:'journey-lightbox',bgOpacity:1,secondaryZoomLevel:2,maxZoomLevel:4,
        closeTitle:'사진 닫기',zoomTitle:'사진 확대·축소',arrowPrevTitle:'이전 사진',arrowNextTitle:'다음 사진',
        errorMsg:'사진을 불러오지 못했어요.',showHideAnimationType:'fade',showAnimationDuration:160,hideAnimationDuration:120,
        paddingFn:size=>({top:65,bottom:size.x<650?260:230,left:size.x<650?10:70,right:size.x<650?10:70}),
        wheelToZoom:false,returnFocus:true});
      viewer.current=pswp;
      let caption;
      const update=()=>{
        if(!caption)return;
        const p=data[pswp.currIndex];
        const eyebrow=element('small',p.stepTitle||'지금 선택한 구역의 실제 사진');
        const heading=element('strong',p.title);
        const note=element('p',`${p.context?'주변 비교 사진 · 연결 확인 중. ':''}${p.scope}`);
        const observations=element('div',null,'jg-observations');
        p.observations?.forEach((o,i)=>observations.append(element('span',`${String.fromCharCode(65+i)} · ${o.label}: ${o.detail}`)));
        const credit=element('span',p.credit,'jg-credit');
        const source=element('a',p.sourceLabel||'사진 원본 출처 ↗');source.href=p.sourceUrl;source.target='_blank';source.rel='noreferrer';
        const role=p.evidenceRole?element('b',`${p.evidenceRole.label}${p.evidenceRole.detail!==p.scope?` · ${p.evidenceRole.detail}`:''}`,'jg-role'):null;
        caption.replaceChildren(...[eyebrow,heading,role,note,observations,credit,source].filter(Boolean));
      };
      pswp.on('uiRegister',()=>pswp.ui.registerElement({name:'route-caption',order:9,isButton:false,appendTo:'root',onInit:el=>{caption=el;el.setAttribute('aria-live','polite');update();}}));
      const overlays=new Map();
      const overlay=content=>{
        if(!content.slide||content.data.loadFailed)return;
        let layer=overlays.get(content);
        if(!layer){
          layer=element('div',null,'jg-image-observations');layer.setAttribute('aria-hidden','true');
          content.data.observations?.forEach((o,i)=>{if(!o.position)return;const dot=element('b',String.fromCharCode(65+i));dot.style.left=`${o.position[0]}%`;dot.style.top=`${o.position[1]}%`;layer.append(dot);});
          overlays.set(content,layer);
        }
        layer.style.width=`${content.displayedImageWidth}px`;layer.style.height=`${content.displayedImageHeight}px`;
        content.slide.container.append(layer);
      };
      pswp.on('contentAppend',({content})=>overlay(content));
      pswp.on('contentResize',({content,width,height})=>{const layer=overlays.get(content);if(layer){layer.style.width=`${width}px`;layer.style.height=`${height}px`;}});
      pswp.on('change',update);
      pswp.on('destroy',()=>{viewer.current=null;if(alive.current){button.current?.focus({preventScroll:true});onNavigate?.(data[pswp.currIndex]);}});
      pswp.init();update();
    } catch(e){if(alive.current)setError(e.message);}
    finally{if(alive.current)setLoading(false);}
  }
  return <><button ref={button} className={className} onClick={open} disabled={loading||!photos.length} aria-busy={loading}>{loading&&!preserveContentWhileLoading?'사진 준비 중…':children}</button>{error&&<p role="alert">{error}</p>}</>;
}
