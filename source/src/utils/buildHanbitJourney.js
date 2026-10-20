import * as THREE from 'three';
import {HANBIT_MAP,HANBIT_STOPS,HANBIT_SEGMENTS,MODEL_BOUNDS,mapToWorld,geoToMap} from '../data/hanbitJourney3d.js';
import {miniatureMaterial} from './miniatureMaterials.js';

// Geometry uses the same projection as the source map. Vertical dimensions,
// street widths and small architectural details are illustrative, not surveyed.
export function buildHanbitJourney(scene) {
  const root=new THREE.Group();root.name='hanbit-geographic-miniature';scene.add(root);
  const geometries=new Set(),materials=new Map(),fadingMaterials=new Set();
  const cube=new THREE.BoxGeometry(1,1,1);geometries.add(cube);
  function material(color,fade=false) {
    const key=color+(fade?'fade':'');
    const types={'#ddd7c5':'stone','#e5dfcd':'stone','#e5e0d3':'stone','#ece8dc':'paving','#faf2da':'paving','#e9e4d7':'paving','#d6d1c1':'paving','#d6dfc7':'grass','#bdceae':'grass','#a8b0ac':'asphalt','#7e9295':'asphalt','#c5c6b4':'base','#cbd3cc':'metal','#739a9e':'glass','#8faeae':'glass'};
    const palette={'#d6dfc7':'#8c965e','#bdceae':'#758653','#7e9295':'#444b4d','#a8b0ac':'#666b65','#c5c6b4':'#c8bba6','#ddd7c5':'#b9a889','#e5e0d3':'#c1b59b','#e5dfcd':'#cbb99a','#cbd3cc':'#929c9b','#739a9e':'#294e59','#8faeae':'#345563','#ece8dc':'#c2b59d','#faf2da':'#d4c7aa','#e9e4d7':'#d1c6ae','#d6d1c1':'#bbb299'};
    if(!materials.has(key))materials.set(key,miniatureMaterial(palette[color]||color,types[color]||'plain'));
    const m=materials.get(key);if(fade)fadingMaterials.add(m);return m;
  }
  function mesh(geometry,color,point=[0,0,0],parent=root,fade=false) {
    geometries.add(geometry);const o=new THREE.Mesh(geometry,material(color,fade));o.position.set(...point);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function box(color,point,size,rotation=0,parent=root,fade=false) {const o=mesh(cube,color,point,parent,fade);o.scale.set(...size);o.rotation.y=rotation;return o;}
  function cylinder(rt,rb,h,color,point,parent=root,n=40) {return mesh(new THREE.CylinderGeometry(rt,rb,h,n),color,point,parent);}
  function line(a,b,width,color,height=.2,parent=root) {
    const av=new THREE.Vector3(...mapToWorld(a,height)),bv=new THREE.Vector3(...mapToWorld(b,height)),d=bv.clone().sub(av);
    return box(color,av.clone().add(bv).multiplyScalar(.5).toArray(),[width,.08,d.length()],Math.atan2(d.x,d.z),parent);
  }
  function clipPolygon(points) {
    let out=points;
    for(const [axis,bound,sign] of [[0,MODEL_BOUNDS[0],1],[0,MODEL_BOUNDS[2],-1],[1,MODEL_BOUNDS[1],1],[1,MODEL_BOUNDS[3],-1]]) {
      const input=out;out=[];
      for(let i=0;i<input.length;i++) {
        const a=input[i],b=input[(i+1)%input.length],insideA=(a[axis]-bound)*sign>=0,insideB=(b[axis]-bound)*sign>=0;
        if(insideA)out.push(a);
        if(insideA!==insideB){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
      }
    }
    return out;
  }
  function polygon(points,color,height=.1,depth=0,fade=false) {
    const ps=clipPolygon(points);if(ps.length<3)return;
    const shape=new THREE.Shape(ps.map(p=>{const [x,,z]=mapToWorld(p);return new THREE.Vector2(x,-z);}));
    const g=depth?new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false}):new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI/2);return mesh(g,color,[0,height,0],root,fade);
  }
  function clippedLine(a,b,width,color,height) {
    // Clip a segment independently; do not connect disconnected pieces.
    let t0=0,t1=1;const d=[b[0]-a[0],b[1]-a[1]];
    for(const [p,q] of [[-d[0],a[0]-MODEL_BOUNDS[0]],[d[0],MODEL_BOUNDS[2]-a[0]],[-d[1],a[1]-MODEL_BOUNDS[1]],[d[1],MODEL_BOUNDS[3]-a[1]]]) {
      if(p===0){if(q<0)return;continue;}const t=q/p;if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return;
    }
    line([a[0]+d[0]*t0,a[1]+d[1]*t0],[a[0]+d[0]*t1,a[1]+d[1]*t1],width,color,height);
  }
  const [left,top,right,bottom]=MODEL_BOUNDS,scale=HANBIT_MAP.scalePixelsPerMeter;
  box('#c5c6b4',[0,-2.6,0],[(right-left)/scale+4,5.2,(bottom-top)/scale+4]);
  box('#f5f0e4',[0,-.25,0],[(right-left)/scale+4,.7,(bottom-top)/scale+4]);
  const ground=mesh(new THREE.PlaneGeometry(1600,1600),'#ede6d9',[0,-5.3,0]);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  polygon([[left,top],[right,top],[right,bottom],[left,bottom]],'#d6dfc7',.12);
  polygon([[215,180],[481,160],[540,220],[540,580],[450,650],[205,650]],'#ece8dc',.19);
  const features=HANBIT_MAP.features;
  for(const f of features.filter(f=>['parking','wood','water'].includes(f.kind)))polygon(f.points,{parking:'#a8b0ac',wood:'#bdceae',water:'#a2cbd0'}[f.kind],.22);
  // Roads are deliberately darker than the pale, raised pedestrian strips.
  for(const f of features.filter(f=>f.kind==='road')) {
    const width=f.tags.highway==='service'?4.8:12.5;
    for(let i=1;i<f.points.length;i++){
      clippedLine(f.points[i-1],f.points[i],width+.65,'#d7d5c5',.27);
      clippedLine(f.points[i-1],f.points[i],width,'#7e9295',.33);
      if(f.tags.highway!=='service'){
        const a=f.points[i-1],b=f.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
        const normal=[-(b[1]-a[1])/len,(b[0]-a[0])/len];
        for(const offset of [-.32,.32,-5.85,5.85])clippedLine([a[0]+normal[0]*offset*scale,a[1]+normal[1]*offset*scale],[b[0]+normal[0]*offset*scale,b[1]+normal[1]*offset*scale],.15,Math.abs(offset)<1?'#d4b66e':'#ede9dc',.4);
        for(const offset of [-3.15,3.15])for(let d=0;d<len;d+=22){const end=Math.min(len,d+10);clippedLine([a[0]+(b[0]-a[0])*d/len+normal[0]*offset*scale,a[1]+(b[1]-a[1])*d/len+normal[1]*offset*scale],[a[0]+(b[0]-a[0])*end/len+normal[0]*offset*scale,a[1]+(b[1]-a[1])*end/len+normal[1]*offset*scale],.15,'#f5efd8',.4);}
      }
    }
  }
  for(const f of features.filter(f=>f.kind==='path')) {
    for(let i=1;i<f.points.length;i++) {
      const a=f.points[i-1],b=f.points[i];
      if(f.tags.footway==='crossing') {
        clippedLine(a,b,3.4,'#9ca5a0',.43);
        const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
        for(let d=0;d<len;d+=5.8){const t=d/len,e=Math.min(1,(d+2.8)/len);clippedLine([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e],3.1,'#fff9e6',.49);}
      } else {
        clippedLine(a,b,4.3,'#b5b09f',.43);clippedLine(a,b,3.8,'#faf2da',.53);
      }
    }
  }
  // Parking bays and a few scale vehicles; their occupancy is illustrative.
  for(const x of [755,810,870])for(let z=148;z<605;z+=26){
    if(z>320&&z<410)continue;
    line([x-13,z],[x+13,z],.16,'#f0eee0',.41);
    if((Math.round(z/26)+x)%3===0){const p=mapToWorld([x,z+10],1.1);box('#ecebe2',p,[4.5,1.6,2.15]);box('#627d85',[p[0],2.03,p[2]],[2.45,.35,1.9]);}
  }
  // Georeferenced footprints, with the connecting first floor kept open.
  for(const f of features.filter(f=>['1190791842','1190791843'].includes(f.id))) {
    polygon(f.points,'#ddd7c5',.5,10,true);
    polygon(f.points,'#eeeada',10.5,.32,true);
    const xs=f.points.map(p=>p[0]),zs=f.points.map(p=>p[1]);
    const frontX=Math.max(...xs)-5;
    for(let z=Math.min(...zs)+16;z<Math.max(...zs)-8;z+=17){const p=mapToWorld([frontX,z],6);box('#566058',p,[.36,3.35,1.65],0,root,true);box('#8faeae',[p[0]+.2,p[1],p[2]],[.1,3.05,1.38],0,root,true);box('#d3d1bd',[p[0]+.27,p[1],p[2]],[.1,.08,1.38],0,root,true);}
    for(let x=Math.min(...xs)+12;x<Math.max(...xs)-6;x+=12){const p=mapToWorld([x,Math.max(...zs)+.15],6);box('#8faeae',p,[1.9,3.8,.3],0,root,true);box('#d4cbb6',[p[0],6,p[2]+.22],[.08,3.9,.1],0,root,true);}
  }
  const bridge=features.find(f=>f.id==='1190791844');
  polygon(bridge.points,'#e5e0d3',7.6,3.3,true);
  for(const p of [[557,336],[557,379],[647,334],[652,382]])cylinder(.58,.63,7.5,'#dddcca',mapToWorld(p,4));
  const drum=mapToWorld([675,329]);cylinder(3.2,3.2,8.1,'#ddd7c5',[drum[0],4.6,drum[2]],root,48);cylinder(3.45,3.45,.28,'#b6ab93',[drum[0],8.8,drum[2]],root,48);
  box('#47726f',mapToWorld([646,343],2.45),[3.4,3.8,2.8],0,root,true);
  box('#eee8d9',mapToWorld([646,343],4.5),[3.8,.25,3.2],0,root,true);
  const sail=[new THREE.Vector3(...mapToWorld([671,319],10.9)),new THREE.Vector3(...mapToWorld([647,306],27)),new THREE.Vector3(...mapToWorld([675,381],10.9))];
  const sailGeometry=new THREE.BufferGeometry();sailGeometry.setAttribute('position',new THREE.Float32BufferAttribute(sail.flatMap(p=>p.toArray()),3));sailGeometry.computeVertexNormals();mesh(sailGeometry,'#739a9e',[0,0,0],root,true);
  for(let i=0;i<10;i++){const a=sail[0].clone().lerp(sail[1],i/10),b=sail[2].clone().lerp(sail[1],i/10);mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a,b),1,.065,5,false),'#c3cec7',[.04,0,0],root,true);}
  for(let i=0;i<=6;i++){const b=sail[0].clone().lerp(sail[2],i/6);mesh(new THREE.TubeGeometry(new THREE.LineCurve3(sail[1],b),1,.065,5,false),'#c3cec7',[.04,0,0],root,true);}
  // Flowing exhibition roofs follow the north/south building extents seen in
  // the photographs. They are separate meshes so the path can be uncovered.
  for(const [za,zb,xa,xb] of [[175,327,496,660],[381,531,551,686]]) {
    const vertices=[],indices=[];
    const roofPoint=(u,v)=>mapToWorld([xa+(xb-xa)*u,za+(zb-za)*v],12+8*Math.pow(2*v-1,2)+2.3*Math.sin(Math.PI*u));
    const rows=24;
    for(let i=0;i<=rows;i++)for(let j=0;j<=8;j++)vertices.push(...roofPoint(j/8,i/rows));
    for(let i=0;i<rows;i++)for(let j=0;j<8;j++){const a=i*9+j;indices.push(a,a+9,a+1,a+1,a+9,a+10);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,'#cbd3cc',[0,0,0],root,true);
    for(let i=0;i<=rows;i++){const p=[];for(let j=0;j<=16;j++)p.push(new THREE.Vector3(...roofPoint(j/16,i/rows)).add(new THREE.Vector3(0,.09,0)));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),16,.042,4,false),'#7f8986',[0,0,0],root,true);}
    // Steel ribs on the exposed roof edge and a glazed curved end wall.
    const facade=[];for(let i=0;i<=20;i++){const p=roofPoint(1,i/20);facade.push(p[0],10.55,p[2],...p);}
    const fi=[];for(let i=0;i<20;i++){const a=i*2;fi.push(a,a+1,a+2,a+1,a+3,a+2);}
    const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(facade,3));fg.setIndex(fi);fg.computeVertexNormals();mesh(fg,'#739a9e',[.04,0,0],root,true);
    for(let i=0;i<=12;i++){
      const a=new THREE.Vector3(...roofPoint(1,i/12)),b=a.clone();b.y=10.55;
      const rib=new THREE.LineCurve3(a,b);mesh(new THREE.TubeGeometry(rib,1,.09,5,false),'#d4d6c9',[.08,0,0],root,true);
      if(i<12){const c=new THREE.Vector3(...roofPoint(1,(i+1)/12));mesh(new THREE.TubeGeometry(new THREE.LineCurve3(b,c),1,.08,5,false),'#45595b',[.08,0,0],root,true);}
    }
  }
  // Hanbit Tower: circular plaza, tapered stone shaft, observation ring/spire.
  const tower=mapToWorld([348.37,354.54]);
  const [tx,,tz]=tower;
  for(let i=0;i<4;i++)cylinder(27-i*2,27-i*2,.16,i%2?'#d6d1c1':'#e9e4d7',[tx,.34+i*.16,tz],root,96);
  for(let i=0;i<48;i++){const a=i*Math.PI/24;line([348.37+32*Math.cos(a),354.54+32*Math.sin(a)],[348.37+95*Math.cos(a),354.54+95*Math.sin(a)],.075,'#b9b29e',1.01);}
  cylinder(3.6,8.8,35,'#e5dfcd',[tx,18.2,tz],root,64);
  for(let y=2;y<35;y+=1.7){const r=8.8-(y-1)*5.2/35;cylinder(r+.035,r+.04,.06,'#bfbba9',[tx,y,tz],root,64);}
  const ringProfile=[[7.5,0],[9.1,.5],[10.7,1.2],[11.35,2.3],[11.65,3.6],[11.25,5],[10.15,6],[8.3,6.4]].map(p=>new THREE.Vector2(...p));
  mesh(new THREE.LatheGeometry(ringProfile,96),'#739a9e',[tx,36,tz]);
  for(const [y,r] of [[36.6,9.5],[37.4,10.9],[41.7,10.6],[42.3,8.7]]){const o=mesh(new THREE.TorusGeometry(r,.18,8,96),'#d5d2c3',[tx,y,tz]);o.rotation.x=Math.PI/2;}
  for(let i=0;i<48;i++){const a=i*Math.PI/24;const p=ringProfile.map(q=>new THREE.Vector3(tx+Math.cos(a)*(q.x+.06),36+q.y,tz+Math.sin(a)*(q.x+.06)));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),12,.115,5,false),'#e7e1cf');}
  cylinder(1.5,4.6,16,'#e8e3d3',[tx,51.2,tz],root,48);
  cylinder(.12,1.5,12,'#e2d7c3',[tx,65.2,tz],root,32);
  cylinder(.05,.07,3,'#b9b1a0',[tx,72.7,tz],root,8);
  // Narrow red strips and stone panel joints recall the tower photographs.
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const p=[new THREE.Vector3(tx+Math.cos(a)*4.7,43.2,tz+Math.sin(a)*4.7),new THREE.Vector3(tx+Math.cos(a)*1.5,59.2,tz+Math.sin(a)*1.5),new THREE.Vector3(tx+Math.cos(a)*.13,71.2,tz+Math.sin(a)*.13)];
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),14,.19,5,false),'#9f5c4d');
  }
  // No surveyed ramp/door position exists: the final photo area is a ring,
  // not a fabricated ramp mesh or an animated path into a guessed door.
  const area=mesh(new THREE.RingGeometry(4.1,4.6,48),'#c69942',mapToWorld(HANBIT_STOPS[5].point,.97));area.rotation.x=-Math.PI/2;
  // Shelter follows the mapped sidewalk next to (not on) the car camera.
  const stop=mapToWorld(HANBIT_STOPS[0].point);
  box('#567574',[stop[0]-1,3.6,stop[2]],[2.8,.3,6.3]);
  for(const z of [-2.7,2.7])box('#677e79',[stop[0]-1,1.9,stop[2]+z],[.14,3.4,.14]);
  box('#aac1b8',[stop[0]-2.25,1.95,stop[2]],[.13,3.1,5.6]);
  box('#596e65',[stop[0]-1.8,.8,stop[2]],[.6,.2,4.1]);
  box('#116d62',[stop[0]+1.4,2.65,stop[2]-4],[.15,1.3,.9]);
  box('#728579',[stop[0]+1.4,1.2,stop[2]-4],[.1,2.4,.1]);
  // A few planting clusters outside the mapped walking line.
  const leaf=new THREE.IcosahedronGeometry(1,0);geometries.add(leaf);
  let seed=3301;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const treePoints=[];
  // Planting is illustrative. Keep it out of the mapped roads, building
  // footprints, and the photographed passage instead of hiding the journey.
  const inside=(p,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
  const pointDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=THREE.MathUtils.clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);};
  const plantingClear=p=>!features.some(f=>f.kind==='building'?inside(p,f.points):['path','road'].includes(f.kind)&&f.points.some((b,i)=>i>0&&pointDistance(p,f.points[i-1],b)<(f.kind==='road'?(f.tags.highway==='service'?16:31):12)))&&!HANBIT_SEGMENTS.some(s=>s.points.some((b,i)=>i>0&&pointDistance(p,s.points[i-1],b)<15));
  for(let x=203;x<473;x+=28)for(let z=112;z<644;z+=31){const p=[x+(rnd()-.5)*15,z+(rnd()-.5)*15];if(Math.hypot(p[0]-348.37,p[1]-354.54)>113&&plantingClear(p)&&rnd()>.13)treePoints.push(p);}
  for(let z=133;z<612;z+=31)for(const x of [711,883,984]){const p=[x+(rnd()-.5)*7,z+(rnd()-.5)*8];if(plantingClear(p))treePoints.push(p);}
  const foliage=new THREE.InstancedMesh(leaf,material('#ffffff'),treePoints.length*180),dummy=new THREE.Object3D(),color=new THREE.Color();root.add(foliage);foliage.castShadow=true;foliage.receiveShadow=true;
  let instance=0;
  for(const p of treePoints){
    const v=mapToWorld(p),tall=4.2+rnd()*2.1,radius=2.5+rnd()*1.2;
    cylinder(.2,.36,tall,'#756445',[v[0],tall/2+.3,v[2]],root,7);
    const earth=cylinder(radius*.75,radius*.8,.14,'#8d8b64',[v[0],.33,v[2]],root,20);earth.castShadow=false;
    for(let i=0;i<180;i++){
      const a=rnd()*Math.PI*2,h=rnd()*2-1,r=Math.sqrt(1-h*h)*radius;
      dummy.position.set(v[0]+Math.cos(a)*r*(.35+rnd()*.65),tall+h*radius*.8,v[2]+Math.sin(a)*r*(.35+rnd()*.65));
      dummy.rotation.set(rnd()*3,rnd()*3,rnd()*3);dummy.scale.setScalar(.22+rnd()*.55);dummy.updateMatrix();foliage.setMatrixAt(instance,dummy.matrix);
      color.setHSL(.19+rnd()*.09,.30+rnd()*.26,.065+rnd()*.10);foliage.setColorAt(instance++,color);
    }
  }
  foliage.instanceMatrix.needsUpdate=true;if(foliage.instanceColor)foliage.instanceColor.needsUpdate=true;foliage.computeBoundingSphere();
  // Low planting, seats and lamps give a scale reference away from the route.
  for(const p of [[274,266],[430,283],[260,426],[428,426],[295,523],[410,548],[477,151],[692,577]]){
    const v=mapToWorld(p);box('#bfb399',[v[0],.42,v[2]],[4.8,.5,1.7]);
    for(let i=0;i<8;i++){const o=mesh(leaf,'#75834e',[v[0]-1.9+i*.55,.99,v[2]]);o.scale.set(.55,.6,.73);}
  }
  for(const p of [[454,213],[460,494],[296,576],[220,389],[719,259],[866,475]]){
    const v=mapToWorld(p);cylinder(.08,.13,5,'#4d5f54',[v[0],2.7,v[2]],root,8);box('#59685c',[v[0],5.24,v[2]],[1.45,.13,.45]);
    box('#84745a',[v[0]+1.8,.83,v[2]+1.4],[2.5,.19,.72]);for(const x of [.85,2.7])box('#4c5c51',[v[0]+x,.46,v[2]+1.4],[.15,.72,.54]);
  }
  // Candidate walking lines follow source footways. Gaps stay amber/dashed.
  for(const segment of HANBIT_SEGMENTS)for(let i=1;i<segment.points.length;i++){
    const a=segment.points[i-1],b=segment.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    for(let d=0;d<len;d+=14){const end=Math.min(len,d+8);line([a[0]+(b[0]-a[0])*d/len,a[1]+(b[1]-a[1])*d/len],[a[0]+(b[0]-a[0])*end/len,a[1]+(b[1]-a[1])*end/len],.8,segment.kind==='mapped'?'#077c75':'#c4882e',1.01);}
  }
  const selection=new THREE.Group();selection.name='journey-viewing-area';root.add(selection);
  const selectedRing=mesh(new THREE.RingGeometry(2.7,3.25,40),'#08776a',[0,.85,0],selection);selectedRing.rotation.x=-Math.PI/2;
  // Static viewing cursor: never interpolate a wheelchair through photo gaps.
  const chair=new THREE.Group();chair.name='wheelchair-viewing-cursor';selection.add(chair);
  box('#147d79',[0,1.25,0],[1.3,.23,1.1],0,chair);box('#147d79',[0,1.9,.48],[1.3,1.25,.2],0,chair);
  for(const x of [-.82,.82]){const wheel=mesh(new THREE.TorusGeometry(.7,.09,8,24),'#364d50',[x,.8,.1],chair);wheel.rotation.y=Math.PI/2;cylinder(.14,.14,.2,'#586e6e',[x*.75,.2,-.9],chair,12);}
  cylinder(.35,.35,1.2,'#176b65',[0,2,0],chair,12);mesh(new THREE.SphereGeometry(.35,12,8),'#d5b994',[0,2.95,0],chair);
  chair.scale.setScalar(1.35);
  const cameraGroup=new THREE.Group();cameraGroup.name='photo-camera';root.add(cameraGroup);cameraGroup.visible=false;
  const cameraDot=mesh(new THREE.SphereGeometry(.8,16,10),'#277da3',[0,1,0],cameraGroup);
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,1,0),14,'#277da3',2.4,1.4);cameraGroup.add(arrow);
  const coneGeometry=new THREE.CircleGeometry(19,40,0,Math.PI/2);geometries.add(coneGeometry);
  const coneMaterial=new THREE.MeshBasicMaterial({color:'#4198bd',transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
  const cone=new THREE.Mesh(coneGeometry,coneMaterial);cone.rotation.x=-Math.PI/2;cone.rotation.z=Math.PI/4;cone.position.y=.8;cameraGroup.add(cone);
  function setPhoto(photo) {
    const heading=photo?.viewHeading??photo?.heading;
    cameraGroup.visible=Boolean(photo?.camera&&Number.isFinite(heading));
    if(!cameraGroup.visible)return;
    cameraGroup.position.set(...mapToWorld(geoToMap(photo.camera)));
    // Local cone faces north (-z); its camera rotation follows compass heading.
    cameraGroup.rotation.y=-heading*Math.PI/180;
  }
  function select(index){const s=HANBIT_STOPS[index];selection.visible=Boolean(s);if(s){selection.position.set(...mapToWorld(s.point));chair.visible=s.surface!=='photo-area';}}
  function revealPaths(value){fadingMaterials.forEach(m=>{m.transparent=value;m.opacity=value ? .22 : 1;m.depthWrite=!value;});}
  return {root,select,setPhoto,revealPaths,cameraDot,dispose(){root.removeFromParent();arrow.dispose();coneMaterial.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
