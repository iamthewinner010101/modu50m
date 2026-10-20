import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Geographic placement is independent of the illustrative architecture/landscaping.
// Techniques researched: TinyTopo (OSM layers) and pictorial-map (separate assets).
// Original implementation; reference URLs and pinned commits are in outputs/miniature-v26.
export const groundToWorld = (map, point, height = 0) => new THREE.Vector3(
  (point[0] - 550) / map.scalePixelsPerMeter, height, (point[1] - 380) / map.scalePixelsPerMeter,
);

export function clipFootprint(points, width = 1100, height = 760) {
  let out = points;
  for (const [axis, edge, sign] of [[0, 0, 1], [0, width, -1], [1, 0, 1], [1, height, -1]]) {
    const input = out; out = [];
    input.forEach((b, i) => {
      const a = input[(i + input.length - 1) % input.length];
      const insideA = (a[axis] - edge) * sign >= 0, insideB = (b[axis] - edge) * sign >= 0;
      if (insideA !== insideB) {
        const t = (edge - a[axis]) / (b[axis] - a[axis]);
        out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
      if (insideB) out.push(b);
    });
  }
  return out;
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

export function buildRouteDiorama(map, placeId) {
  const root = new THREE.Group(), materials = new Map(), resources = new Set();
  const scale = map.scalePixelsPerMeter, width = 1100 / scale, depth = 760 / scale;
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const leafShape = new THREE.IcosahedronGeometry(1, 1), trunkShape = new THREE.CylinderGeometry(.18, .3, 1, 5);
  resources.add(unitBox); resources.add(leafShape); resources.add(trunkShape);
  const batches = new Map();
  let seed = placeId === 'hanbit' ? 93050 : 200250;
  const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  function material(color, options = {}) {
    const key = color + JSON.stringify(options);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness: .77, ...options}));
    return materials.get(key);
  }
  function add(geometry, mat, position, parent = root) {
    resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, typeof mat === 'string' ? material(mat) : mat);
    mesh.position.copy(position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function box(x, y, z, sx, sy, sz, color, rotation = 0, parent = root) {
    const mesh = add(unitBox, color, new THREE.Vector3(x, y, z), parent);
    mesh.scale.set(sx, sy, sz); mesh.rotation.y = rotation; return mesh;
  }
  function cylinder(x, y, z, top, bottom, height, color, segments = 48, parent = root) {
    return add(new THREE.CylinderGeometry(top, bottom, height, segments), color, new THREE.Vector3(x, y, z), parent);
  }
  function rod(a, b, radius, color, parent = root) {
    const d = b.clone().sub(a);
    const m = add(new THREE.CylinderGeometry(radius, radius, d.length(), 6), color, a.clone().add(b).multiplyScalar(.5), parent);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
  }
  function instance(kind, color, position, size, ry = 0) {
    const key = `${kind}:${color}`;
    if (!batches.has(key)) batches.set(key, {kind, color, items: []});
    batches.get(key).items.push({position, size, ry});
  }
  const foliage = ['#789563', '#91a76f', '#a8b77b', '#6f8e61', '#bac58b'];
  function tree(px, py, size = 1) {
    const p = groundToWorld(map, [px, py]);
    const h = 5.8 * size;
    instance('trunk', '#8e7d63', [p.x, h * .4, p.z], [size, h * .8, size]);
    for (let i = 0; i < 13; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 2.3 * size;
      const l = (1.15 + rand() * .8) * size;
      instance('leaf', foliage[Math.floor(rand() * foliage.length)],
        [p.x + Math.cos(a) * r, h * .7 + (1 - r / (3 * size)) * 2.6 * size + rand() * size, p.z + Math.sin(a) * r],
        [l, l * .85, l], rand() * Math.PI);
    }
  }
  function footprint(points, height, color, base = .12) {
    const clipped = clipFootprint(points);
    if (clipped.length < 3) return null;
    const shape = new THREE.Shape(clipped.map(p => { const v = groundToWorld(map, p); return new THREE.Vector2(v.x, -v.z); }));
    const geometry = new THREE.ExtrudeGeometry(shape, {depth: height, bevelEnabled: false});
    geometry.rotateX(-Math.PI / 2);
    return add(geometry, color, new THREE.Vector3(0, base, 0));
  }

  // Detailed, deterministic paving texture: geographic lines use the source coordinates.
  const canvas = document.createElement('canvas'); canvas.width = 2750; canvas.height = 1900;
  const ctx = canvas.getContext('2d'); ctx.scale(2.5, 2.5);
  ctx.fillStyle = '#e5e9d9'; ctx.fillRect(0, 0, 1100, 760);
  function path(points, close = false) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); if (close) ctx.closePath();
  }
  function line(points, color, size) { path(points); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  const groundColors = {wood: '#ccd7b5', parking: '#cacdc5', water: '#a1c7c7'};
  for (const f of map.features.filter(f => groundColors[f.kind])) {
    path(f.points, true); ctx.fillStyle = groundColors[f.kind]; ctx.fill();
    if (f.kind === 'parking') {
      ctx.save(); ctx.clip(); ctx.strokeStyle = '#eff0e5'; ctx.lineWidth = .65;
      for (let x = 0; x < 1100; x += scale * 2.8) for (let y = 0; y < 760; y += scale * 18) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + scale * 5); ctx.stroke();
      }
      ctx.restore();
    }
  }
  const roads = map.features.filter(f => ['road', 'path'].includes(f.kind));
  for (const f of roads) {
    const meters = f.kind === 'path' ? 3 : f.tags.highway === 'service' ? 6 : 11;
    line(f.points, '#f2ecdd', (meters + 3) * scale);
    line(f.points, f.kind === 'path' ? '#f8f2e5' : '#acb8b1', meters * scale);
    if (f.kind === 'road' && f.tags.highway !== 'service') {
      ctx.setLineDash([scale * 3, scale * 3]); line(f.points, '#f9f5dc', .22 * scale); ctx.setLineDash([]);
    }
  }
  if (placeId === 'hanbit') {
    const [cx, cy] = map.labels[0].point;
    ctx.beginPath(); ctx.arc(cx, cy, 39 * scale, 0, Math.PI * 2); ctx.fillStyle = '#eae6d9'; ctx.fill();
    for (let r = 12; r < 39; r += 2.3) {
      ctx.beginPath(); ctx.arc(cx, cy, r * scale, 0, Math.PI * 2); ctx.strokeStyle = r % 4 < 2 ? '#d3d1c3' : '#f5f0e6'; ctx.lineWidth = .8; ctx.stroke();
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 24) line([[cx + Math.cos(a) * 12 * scale, cy + Math.sin(a) * 12 * scale], [cx + Math.cos(a) * 39 * scale, cy + Math.sin(a) * 39 * scale]], '#cfcec1', .7);
  }
  for (let i = 0; i < 40000; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff0b' : '#6f76590b'; ctx.fillRect(rand() * 1100, rand() * 760, .6, .6);
  }
  // The line deliberately stops at the end of the published KTO polyline.
  line(map.mapPath, '#fffcf3', 4.5 * scale);
  ctx.setLineDash([3 * scale, 2 * scale]); line(map.mapPath, '#218c7e', 1.4 * scale); ctx.setLineDash([]);
  const groundTexture = new THREE.CanvasTexture(canvas); groundTexture.colorSpace = THREE.SRGBColorSpace; groundTexture.anisotropy = 8; resources.add(groundTexture);
  const surfaceMaterial = new THREE.MeshStandardMaterial({map: groundTexture, roughness: .98}); materials.set('surface', surfaceMaterial);
  add(new RoundedBoxGeometry(width, 5, depth, 2, 1.2), '#d8d5c8', new THREE.Vector3(0, -2.85, 0));
  add(new RoundedBoxGeometry(width, .85, depth, 2, .35), '#f5f0e4', new THREE.Vector3(0, -.15, 0));
  const ground = add(new THREE.PlaneGeometry(width - .6, depth - .6), surfaceMaterial, new THREE.Vector3(0, .3, 0)); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;

  // Actual footprints are retained, including clipped neighboring buildings.
  const buildings = map.features.filter(f => f.kind === 'building');
  const specialized = new Set(placeId === 'hanbit' ? ['469022520', '1190791842', '1190791843', '1190791844'] : ['479719844', '479719845', '760447015']);
  for (const f of buildings.filter(f => !specialized.has(f.id))) {
    const h = Math.min(15, Number(f.tags['building:levels'] || 2) * 3.3);
    footprint(f.points, h, '#dad7c6'); footprint(f.points, .4, '#efeee2', h + .15);
    const ps = clipFootprint(f.points);
    for (let i = 1; i < ps.length; i++) {
      const a = groundToWorld(map, ps[i - 1]), b = groundToWorld(map, ps[i]);
      const length = a.distanceTo(b); if (length < 7) continue;
      const angle = -Math.atan2(b.z - a.z, b.x - a.x);
      for (let d = 3; d < length - 2; d += 4.2) {
        const p = a.clone().lerp(b, d / length);
        box(p.x, h * .56, p.z, 1.7, 1.7, .18, '#7e9994', angle);
      }
    }
  }

  if (placeId === 'hanbit') {
    const center = groundToWorld(map, map.labels[0].point), tx = center.x, tz = center.z;
    const stoneCanvas = document.createElement('canvas'); stoneCanvas.width = 512; stoneCanvas.height = 512;
    const sc = stoneCanvas.getContext('2d'); sc.fillStyle = '#eae3d3'; sc.fillRect(0, 0, 512, 512);
    sc.strokeStyle = '#c8c1b1'; sc.lineWidth = 1;
    for (let y = 0; y < 512; y += 32) {
      sc.beginPath(); sc.moveTo(0, y); sc.lineTo(512, y); sc.stroke();
      for (let x = (y % 64 ? 16 : 0); x < 512; x += 32) { sc.beginPath(); sc.moveTo(x, y); sc.lineTo(x, y + 32); sc.stroke(); }
    }
    const stone = new THREE.CanvasTexture(stoneCanvas); stone.colorSpace = THREE.SRGBColorSpace; resources.add(stone);
    const stoneMat = new THREE.MeshStandardMaterial({map: stone, roughness: .85}); materials.set('towerStone', stoneMat);
    cylinder(tx, .6, tz, 11, 11, .65, '#e0d9c7');
    add(new THREE.CylinderGeometry(5.6, 9.6, 34, 96), stoneMat, new THREE.Vector3(tx, 17.6, tz));
    const profile = [[6, 34], [9, 35], [14, 36], [16, 38], [16.4, 40], [15.8, 43], [13.7, 45], [8, 46]].map(([r,y]) => new THREE.Vector2(r,y));
    add(new THREE.LatheGeometry(profile, 96), material('#94adaf', {metalness: .38, roughness: .29}), new THREE.Vector3(tx, 0, tz));
    for (const [y, r] of [[36,14], [37.3,15.5], [43.5,15.3], [45,13.7]]) {
      const ring = add(new THREE.TorusGeometry(r, .28, 6, 96), '#eae9dc', new THREE.Vector3(tx, y, tz)); ring.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 40; i++) {
      const a = i * Math.PI / 20;
      const points = profile.map(v => new THREE.Vector3(tx + Math.cos(a) * (v.x + .08), v.y, tz + Math.sin(a) * (v.x + .08)));
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, .18, 5, false), '#e8e7dc', new THREE.Vector3());
    }
    cylinder(tx, 65.5, tz, .18, 5.2, 39, '#dfdfd5');
    cylinder(tx, 87.7, tz, .045, .35, 5.4, '#adb7b1', 12);
    for (let y = 48; y < 84; y += 3.5) {
      const r = 5.2 * (85 - y) / 39 + .06;
      const ring = add(new THREE.TorusGeometry(Math.max(.15, r), .10, 5, 48), '#b4b6ae', new THREE.Vector3(tx, y, tz)); ring.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      rod(new THREE.Vector3(tx+Math.cos(a)*5.25,46,tz+Math.sin(a)*5.25),new THREE.Vector3(tx,85,tz),.075,'#f3f0e7');
    }
    // The red vertical detail is an architectural cue, not a path or entrance marker.
    rod(new THREE.Vector3(tx,2,tz+9.4), new THREE.Vector3(tx,34,tz+5.7),.37,'#995b4d');
    rod(new THREE.Vector3(tx,47,tz+5.1), new THREE.Vector3(tx,84,tz+.25),.22,'#995b4d');
    box(tx, 1.9, tz + 9.4, 3.4, 3.1, .5, '#4f7c7d');
    for (const dx of [-1.8, 0, 1.8]) box(tx+dx,1.9,tz+9.7,.12,3.4,.12,'#e5e6d9');

    for (const id of ['1190791842','1190791843']) {
      const f = buildings.find(b => b.id === id); if (!f) continue;
      footprint(f.points, 8.5, '#e3d8c3');
      const wp = f.points.map(p => groundToWorld(map,p));
      const zs = wp.map(v=>v.z), xs=wp.map(v=>v.x), zmin=Math.min(...zs), zmax=Math.max(...zs), xmin=Math.min(...xs), xmax=Math.max(...xs);
      const roofY=(x,z)=>12.5 + 6.5*Math.pow(Math.cos((z-zmin)/(zmax-zmin)*Math.PI),2) + 1.4*(x-xmin)/(xmax-xmin);
      const vertices=[];
      // Subdivide the footprint into thin strips so the roof is a curved surface.
      for(let z=zmin;z<zmax;z+=.9){
        let polygon=wp.map(p=>[p.x,p.z]);
        for(const [edge,sign] of [[z,1],[Math.min(z+.9,zmax),-1]]){
          const input=polygon; polygon=[];
          input.forEach((b,i)=>{const a=input[(i+input.length-1)%input.length];const ai=(a[1]-edge)*sign>=0,bi=(b[1]-edge)*sign>=0;
            if(ai!==bi){const t=(edge-a[1])/(b[1]-a[1]);polygon.push([a[0]+t*(b[0]-a[0]),edge]);}if(bi)polygon.push(b);});
        }
        if(polygon.length<3)continue;
        const contour=polygon.map(p=>new THREE.Vector2(...p));
        for(const tri of THREE.ShapeUtils.triangulateShape(contour,[]))for(const i of tri){const [x,zz]=polygon[i];vertices.push(x,roofY(x,zz),zz);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
      add(g,material('#ced3cf',{metalness:.24,roughness:.48,side:THREE.DoubleSide}),new THREE.Vector3());
      for(let z=zmin+1;z<zmax;z+=2.2){
        const intersections=[];
        for(let i=1;i<wp.length;i++){const a=wp[i-1],b=wp[i];if((a.z<=z&&b.z>z)||(b.z<=z&&a.z>z))intersections.push(a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z));}
        intersections.sort((a,b)=>a-b);
        if(intersections.length>=2)rod(new THREE.Vector3(intersections[0],roofY(intersections[0],z)+.05,z),new THREE.Vector3(intersections.at(-1),roofY(intersections.at(-1),z)+.05,z),.055,'#acb7b4');
      }
      for(let z=zmin+4;z<zmax-2;z+=5.5){
        const x=xmin+(id==='1190791842'?5:1);
        if(insidePolygon(x,z,wp.map(p=>[p.x,p.z]))){
          rod(new THREE.Vector3(x,8.5,z),new THREE.Vector3(x,roofY(x,z),z),.18,'#566e72');
          rod(new THREE.Vector3(x,8.5,z),new THREE.Vector3(x,roofY(x,z+2.5),Math.min(z+2.5,zmax)),.12,'#566e72');
        }
      }
    }
    const connector=buildings.find(b=>b.id==='1190791844');
    if(connector){footprint(connector.points,10,'#82aead');footprint(connector.points,.5,'#e5e5d9',10.15);}
    // Planting seen around the circular plaza. Exact trees/railings are illustrative.
    for(let a=0;a<Math.PI*2;a+=.18){const px=map.labels[0].point[0]+Math.cos(a)*44*scale, py=map.labels[0].point[1]+Math.sin(a)*44*scale;
      if(px>70&&px<520&&py>60&&py<690)tree(px,py,.65+rand()*.25);}
  } else {
    for(const id of ['479719844','479719845']){const f=buildings.find(b=>b.id===id);if(f){footprint(f.points,7,'#d9d4bc');footprint(f.points,1,'#89b4a0',7.2);}}
    // Gate facade spans the OSM entrance canopy. It is a photo-based reconstruction.
    const a=groundToWorld(map,[617.18,581.67]), b=groundToWorld(map,[668.66,507.74]);
    const gate=new THREE.Group();gate.position.copy(a.clone().add(b).multiplyScalar(.5));gate.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);root.add(gate);
    const span=a.distanceTo(b), half=span/2;
    for(const x of [-half,half]){
      cylinder(x,5.8,0,3.5,3.5,11.6,'#e6d7bd',8,gate);
      cylinder(x,12,0,4.3,4.3,1,'#dfc88e',8,gate);
      add(new THREE.SphereGeometry(4.2,24,16,0,Math.PI*2,0,Math.PI/2),material('#94b19a',{metalness:.12}),new THREE.Vector3(x,12.5,0),gate);
      cylinder(x,17,0,.1,.45,2.5,'#ddbc6e',12,gate);
      for(const side of [-1,1])box(x+side*3.55,5.8,0,.15,2.8,1.5,'#759d96',0,gate);
    }
    for(let x=-half+4;x<half-2;x+=4){box(x,3,0,.55,6,1.5,'#e5d9c4',0,gate);box(x,6.4,0,4.4,1,2.5,'#d6c7a5',0,gate);}
    box(0,9.4,0,8.5,4.2,4,'#d6cfbf',0,gate);
    for(const x of [-5,5]){
      cylinder(x,9,0,1.6,1.6,9,'#d8cbd3',16,gate);
      cylinder(x,15,0,0,2.2,5.5,'#709cba',24,gate);
    }
    cylinder(0,15.4,0,0,3.7,7,'#89b4c6',4,gate).rotation.y=Math.PI/4;
    box(0,9.5,-2.05,5.6,1.2,.2,'#718d89',0,gate);
    for(const x of [-2.2,0,2.2])box(x,11.2,-2.1,.8,1.6,.1,'#718f9e',0,gate);
    // Woodland placement is restricted to mapped woodland and away from mapped roads.
  }

  const wood=map.features.filter(f=>f.kind==='wood');
  function nearRoad(x,y){return roads.some(f=>f.points.some((p,i)=>{
    if(!i)return false;const a=f.points[i-1],dx=p[0]-a[0],dy=p[1]-a[1],l=dx*dx+dy*dy;
    const t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;
    return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<scale*8;
  }));}
  let count=0;
  for(let y=28;y<735;y+=placeId==='hanbit'?34:28)for(let x=28;x<1070;x+=placeId==='hanbit'?34:28){
    const px=x+(rand()-.5)*15,py=y+(rand()-.5)*15;
    if(wood.some(f=>insidePolygon(px,py,f.points))&&!nearRoad(px,py)&&!buildings.some(f=>insidePolygon(px,py,f.points))&&count<360){tree(px,py,.75+rand()*.5);count++;}
  }
  // Bus shelter at the registered stop area: illustrative shape, source-linked location.
  const bus=groundToWorld(map,map.markers[0].mapPoint);
  box(bus.x,3.2,bus.z,6,.22,2.8,'#668f84');
  for(const dx of [-2.7,2.7])box(bus.x+dx,1.7,bus.z,.14,3.2,.14,'#6c817a');
  box(bus.x,1.8,bus.z+.85,5.7,2.7,.1,'#b8d1c5');

  for(const batch of batches.values()){
    const geometry=batch.kind==='leaf'?leafShape:trunkShape;
    const inst=new THREE.InstancedMesh(geometry,material(batch.color),batch.items.length),dummy=new THREE.Object3D();
    batch.items.forEach((v,i)=>{dummy.position.set(...v.position);dummy.scale.set(...v.size);dummy.rotation.y=v.ry;dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});
    inst.castShadow=true;inst.receiveShadow=true;root.add(inst);
  }
  const markers=map.markers.map(m=>{
    const group=new THREE.Group(),p=groundToWorld(map,m.mapPoint);group.position.copy(p);root.add(group);
    const disc=cylinder(0,.75,0,2,2,.7,'#107d71',32,group);
    const ring=add(new THREE.TorusGeometry(3,.24,6,48),'#ffffed',new THREE.Vector3(0,.65,0),group);ring.rotation.x=Math.PI/2;
    const halo=add(new THREE.RingGeometry(3.2,5.8,48),material('#dbb75c',{transparent:true,opacity:.5,side:THREE.DoubleSide}),new THREE.Vector3(0,.5,0),group);halo.rotation.x=-Math.PI/2;
    return {data:m,group,disc,halo,point:p};
  });
  return {root,width,depth,markers,
    select(index){markers.forEach(m=>{const active=m.data.steps.includes(index);m.halo.visible=active;m.disc.scale.setScalar(active?1.4:1);});},
    dispose(){root.removeFromParent();resources.forEach(r=>r.dispose());materials.forEach(m=>m.dispose());},
  };
}
