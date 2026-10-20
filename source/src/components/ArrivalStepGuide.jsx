import {arrivalStepGuide} from '../data/arrivalStepGuides.js';
import './ArrivalStepGuide.css';
export default function ArrivalStepGuide({route,index,variant='heading'}) {
  const guide=arrivalStepGuide(route,index);
  if(!guide)return null;
  const sourceNotice=route.steps[index].sourceNotice;
  const noticeDate=sourceNotice?.publishedAt?sourceNotice.publishedAt.slice(0,7).replace('-','.') : sourceNotice?.capturedAt?`촬영 ${sourceNotice.capturedAt.slice(0,7).replace('-','.')}`:'';
  if(variant==='details')return <details className="asg-guide asg-details">
    <summary>찾을 표지·주의할 곳</summary>
    <dl><div><dt>찾을 표지</dt><dd>{guide.landmark}</dd></div><div><dt>주의할 곳</dt><dd>{guide.inspect}</dd></div></dl>
    <p>{route.steps[index].instruction}</p>
  </details>;
  return <div className="asg-guide asg-heading" data-step={route.steps[index].id}>
    <p className="asg-direction"><strong>살펴볼 방향</strong>{guide.direction}</p>
    <div className="asg-inspect"><span>살펴볼 곳</span><ul aria-label="이 사진에서 주의해서 살펴볼 곳">{guide.inspect.split('·').map(item=><li key={item}>{item.trim()}</li>)}</ul></div>
    {sourceNotice&&<details className="asg-source-notice">
      <summary>{noticeDate} {sourceNotice.providerLabel||'공식 자료'} · {sourceNotice.title}</summary>
      <p>{sourceNotice.detail}</p>
      <div className="asg-source-links">
        {sourceNotice.documentUrl&&<a href={sourceNotice.documentUrl} target="_blank" rel="noreferrer">{sourceNotice.documentLabel||'공식 사진·위치도 보기'} ↗</a>}
        {sourceNotice.sourceUrl&&<a href={sourceNotice.sourceUrl} target="_blank" rel="noreferrer">{sourceNotice.sourceLabel||'안내 원문'} ↗</a>}
      </div>
    </details>}
  </div>;
}
