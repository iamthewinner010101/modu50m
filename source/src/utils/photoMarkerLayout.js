// Button centers may move; the photo's observation anchors never move.
export function layoutPhotoMarkers(items,width,height,diameter=44,gap=6) {
  const placed=[],half=diameter/2+3,spacing=diameter+gap;
  const clamp=(n,limit)=>Math.max(Math.min(half,limit/2),Math.min(limit-half,n));
  const overlaps=(x,y)=>placed.some(p=>Math.abs(p.center[0]-x)<spacing&&Math.abs(p.center[1]-y)<spacing);
  return items.map(item=>{
    const original=item.position;
    if(!Array.isArray(original)||original.length!==2||!original.every(Number.isFinite))return null;
    if(!(width>0&&height>0))return {position:[...original],anchor:null,center:null,shifted:false};
    const anchor=[original[0]*width/100,original[1]*height/100];
    let center=[clamp(anchor[0],width),clamp(anchor[1],height)];
    if(overlaps(...center)) {
      const candidates=[];
      for(let radius=spacing;radius<=Math.max(width,height)+spacing;radius+=spacing) {
        for(const [dx,dy] of [[0,-radius],[-radius,0],[radius,0],[0,radius],[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]]) {
          const x=clamp(anchor[0]+dx,width),y=clamp(anchor[1]+dy,height);
          if(!overlaps(x,y))candidates.push([x,y]);
        }
        if(candidates.length)break;
      }
      candidates.sort((a,b)=>Math.hypot(a[0]-anchor[0],a[1]-anchor[1])-Math.hypot(b[0]-anchor[0],b[1]-anchor[1]));
      if(candidates.length)center=candidates[0];
    }
    const marker={position:[center[0]*100/width,center[1]*100/height],anchor,center,shifted:Math.hypot(center[0]-anchor[0],center[1]-anchor[1])>.5};
    placed.push(marker);return marker;
  });
}
