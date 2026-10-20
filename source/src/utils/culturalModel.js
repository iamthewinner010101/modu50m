import * as THREE from 'three';

// Ground footprint is georeferenced. Heights, glazing, trees and paving are symbolic.
export function buildCulturalModel(scene, site) {
  const root = new THREE.Group(); scene.add(root);
  const geometries = new Set(), materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.86,side:THREE.DoubleSide}));
    return materials.get(color);
  }
  function mesh(geometry,color,x=0,y=0,z=0,parent=root) {
    geometries.add(geometry); const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const cube = new THREE.BoxGeometry(1,1,1), leaf = new THREE.IcosahedronGeometry(1,1);
  const box=(color,x,y,z,w,h,d,parent=root)=>{const m=mesh(cube,color,x,y,z,parent);m.scale.set(w,h,d);return m;};
  function tree(x,z,scale=1) {box('#a99a80',x,1.4*scale,z,.55*scale,2.8*scale,.55*scale);const m=mesh(leaf,'#98b58c',x,4*scale,z);m.scale.set(2.1*scale,2.8*scale,2.1*scale);}
  box('#d2d6c8',0,-3,0,224,5.5,244); box('#efede3',0,-.1,0,225,.5,245);
  box('#eeeadf',0,.17,-1,218,.12,235);
  for(let x=-105;x<110;x+=7)box('#deded3',x,.27,0,.08,.025,237);
  for(let z=-115;z<122;z+=7)box('#deded3',0,.27,z,215,.025,.08);
  const roadZ=site.checkpoints[1].point[2];
  box('#cdd4cf',0,.28,roadZ,222,.1,14); box('#faf7e7',0,.39,roadZ-10,220,.2,5);
  for(let x=-100;x<105;x+=12)box('#fdfcf2',x,.37,roadZ,5,.025,.4);
  // Lawn on the approach side; not a surveyed accessible path.
  box('#bfcfa9',0,.32,Math.min(roadZ-25,52),150,.1,24);
  box('#f7f3e6',-32,.4,32,7,.2,64);
  for(const x of [-94,94])for(let z=-101;z<110;z+=14)tree(x,z,.8);
  for(const x of [-70,-50,-25,28,53,72])tree(x,roadZ-15,.9);
  const footprint = new THREE.Shape();
  site.modelFootprint.forEach((p,i)=>i?footprint.lineTo(p[0],p[2]):footprint.moveTo(p[0],p[2]));footprint.closePath();
  const height=site.id==='arts'?22:12;
  const body=mesh(new THREE.ExtrudeGeometry(footprint,{depth:height,bevelEnabled:false}),'#ddd8cb',0,height,0);body.rotation.x=Math.PI/2;
  const roof=mesh(new THREE.ShapeGeometry(footprint),'#f7f4ea',0,height+.12,0);roof.rotation.x=Math.PI/2;
  // Front glazing and overhanging roof suggest the landmark without claiming detail accuracy.
  if(site.id==='arts') {
    box('#96b4b8',7,9,-5,31,15,.45);
    for(let x=-7;x<23;x+=3)box('#f0eddf',x,9,-4.6,.35,16,.35);
    const canopy=box('#faf6e7',6,22,-5,42,2.5,16);canopy.rotation.x=-.09;
    box('#c5bdad',-18,17,-41,20,34,33);
    box('#f4f0e2',-18,34.4,-41,21,.8,34);
  } else {
    box('#9db8b5',0,5,-12,35,7,.4);
    for(let x=-16;x<18;x+=4)box('#eee9d9',x,5,-11.6,.4,8,.4);
    box('#faf7e7',0,12.8,-12,45,1.2,13);
    // Sculpture is a decorative scale cue, not an identified real artwork.
    const art=mesh(new THREE.TorusGeometry(3.3,.55,8,32),'#a1aaa1',35,4.1,9);art.rotation.y=.5;
    box('#e1dfd0',35,.8,9,8,1.1,8);
  }
  for(const [x,z] of [[-63,22],[58,27],[-10,roadZ-14]]) {box('#b3a48a',x,1.1,z,5,.5,1.4);for(const dx of [-1.7,1.7])box('#869991',x+dx,.6,z,.35,1,.6);}
  const makePath=points=>{const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return path;};
  const route=makePath(site.route),demoRoute=makePath(site.demoRoute);
  const cursor=mesh(new THREE.SphereGeometry(1.1,12,8),'#bd873c',...site.route[0]);cursor.castShadow=false;
  const viewArrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(),24,'#bc812e',3,1.6);root.add(viewArrow);
  for(const p of site.checkpoints) {const pin=mesh(new THREE.CylinderGeometry(1.6,1.6,.18,24),'#edc785',p.point[0],.55,p.point[2]);pin.castShadow=false;}
  const chair=new THREE.Group();root.add(chair);
  box('#287c7f',0,2.1,0,1.25,1.65,.85,chair);box('#5a7778',0,1.3,0,1.7,.3,1.6,chair);box('#5a7778',0,2.1,.65,1.7,1.6,.2,chair);
  mesh(new THREE.SphereGeometry(.5,12,8),'#dbc3a6',0,3.35,0,chair);
  for(const x of [-1.05,1.05]){const w=mesh(new THREE.TorusGeometry(.91,.13,8,24),'#3c555c',x,.95,.12,chair);w.rotation.y=Math.PI/2;box('#385963',x*.4,.9,-1.05,.45,1.6,.5,chair);mesh(new THREE.SphereGeometry(.23,10,8),'#3c555c',x*.7,.22,-1.25,chair);}
  chair.scale.setScalar(1.4);chair.traverse(m=>{m.castShadow=false;});chair.position.copy(demoRoute.getPoint(0));
  return {root,route,demoRoute,cursor,viewArrow,chair,hideTransit:true,dispose(){root.removeFromParent();viewArrow.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
