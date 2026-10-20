import * as THREE from 'three';
import { ROUTE, DEMO_ROUTE, TOWER } from '../data/hanbitPrecinct.js';

// A deliberately simplified, design-space model; no survey precision is implied.
export function buildHanbitModel(scene) {
  const root = new THREE.Group(); scene.add(root);
  const geometries = new Set(), materials = new Map(), batches = new Map();
  const shapes = { box: new THREE.BoxGeometry(1, 1, 1), tree: new THREE.IcosahedronGeometry(1, 1), sphere: new THREE.SphereGeometry(1, 12, 8) };
  Object.values(shapes).forEach(g => geometries.add(g));
  function mat(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .84 }));
    return materials.get(color);
  }
  function mesh(geometry, color, x, y, z, parent = root) {
    geometries.add(geometry); const object = new THREE.Mesh(geometry, mat(color));
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function item(kind, color, x, y, z, sx, sy, sz, rotation = 0) {
    const key = `${kind}-${color}`;
    if (!batches.has(key)) batches.set(key, { kind, color, instances: [] });
    batches.get(key).instances.push({ x, y, z, sx, sy, sz, rotation });
  }
  const box = (color, x, y, z, sx, sy, sz, rotation = 0) => item('box', color, x, y, z, sx, sy, sz, rotation);
  let seed = 5026;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const tree = (x, z, s = 1) => {
    box('#9f947f', x, 1.3 * s, z, .48 * s, 2.8 * s, .48 * s);
    item('tree', ['#75956f', '#a4b78a', '#839b72'][Math.floor(random() * 3)], x, 3.6 * s, z, 1.9 * s, 2.6 * s, 1.85 * s, random());
  };
  const cylinder = (rTop, rBottom, height, color, x, y, z, segments = 64) => mesh(new THREE.CylinderGeometry(rTop, rBottom, height, segments), color, x, y, z);
  box('#d4d6c9', 0, -3.2, 0, 242, 5.6, 196);
  box('#eeeee4', 0, -.25, 0, 243, .5, 197);
  box('#ece8dd', -10, .08, 5, 219, .12, 184);
  // The river/bridge from V1 were geographically misleading at this scale.
  // Context is schematic, registered around tower and Roadview camera anchors.
  for (let x = -115; x < 120; x += 7) box('#dedbd1', x, .17, 0, .08, .025, 184);
  for (let z = -90; z < 96; z += 7) box('#dedbd1', 0, .18, z, 235, .025, .08);
  // East-side street, pedestrian edge and parking access (illustrative widths).
  box('#c9ceca', 82, .2, 0, 29, .15, 192);
  box('#faf4dc', 64, .42, 0, 7, .5, 190);
  for (let z = -88; z < 92; z += 12) box('#fcfcf2', 83, .31, z, .5, .02, 5);
  box('#cbd0cc', 34, .21, 8, 80, .15, 18);
  for (let z = 1; z < 17; z += 3) box('#fffff1', 65, .72, z, 10, .03, 1.7);
  // Parking areas; dimensions and individual bays are schematic.
  for (const z of [-30, 38]) {
    box('#dddeda', 18, .23, z, 66, .12, 31);
    for (let x = -12; x < 49; x += 7) {
      box('#f7f7ed', x, .32, z, .25, .03, 12);
      box(['#dbe3de', '#b4c6c4', '#f4f0e4'][Math.floor(random()*3)], x + 3, 1.3, z, 3, 2, 6);
    }
  }
  // Trees and simplified planting, not surveyed obstacles.
  for (const [x, z, w, d] of [[-96, 46, 22, 64], [15, 78, 73, 12], [4, -77, 174, 14]]) {
    box('#faf8ed', x, .3, z, w, .5, d);
    box('#bcc9a5', x, .59, z, w - 1.4, .12, d - 1.4);
    for (let dx = -w/2+5; dx < w/2-2; dx+=9) for (let dz=-d/2+5; dz<d/2-2; dz+=10) tree(x+dx,z+dz,.85+random()*.25);
  }
  for (const z of [-66, -44, 32, 64, 84]) tree(60, z, .9);
  // Bus shelter visible at checkpoint 01.
  box('#617f7b', 60, 6, 43, 5, .5, 9);
  box('#b6ccca', 57.8, 3.2, 43, .25, 5.4, 9);
  for (const z of [39, 47]) box('#6f847e', 62, 3, z, .3, 6, .3);
  // Hanbit-inspired landmark, maintained at district scale rather than a close-up.
  const [tx, , tz] = TOWER.point;
  cylinder(18.7, 18.7, .22, '#faf8ef', tx, .32, tz);
  cylinder(16.1, 16.1, .25, '#deddd0', tx, .54, tz);
  cylinder(13.5, 13.5, .18, '#f6f2e7', tx, .76, tz);
  cylinder(4.8, 9.4, 23, '#e7e4d7', tx, 12.35, tz, 48);
  for (let i = 0; i < 15; i++) {
    const y = 1.3 + i * 1.48, radius = 9.4 - (y - .85) / 23 * 4.6;
    cylinder(radius + .055, radius + .065, .075, '#cbcabb', tx, y, tz);
  }
  cylinder(10.9, 8.9, 2.1, '#e8e8dc', tx, 24.35, tz);
  cylinder(10.8, 10.8, 2.8, '#92b8c1', tx, 26.7, tz);
  cylinder(11.25, 11.25, .6, '#f7f5e9', tx, 28.3, tz);
  for (let i = 0; i < 36; i++) {
    const angle = i * Math.PI / 18;
    box('#f3f0e5', tx + Math.cos(angle) * 10.85, 26.7, tz + Math.sin(angle) * 10.85, .22, 2.9, .22, angle);
  }
  cylinder(3, 6.2, 3.2, '#ecebdf', tx, 30.1, tz);
  cylinder(.18, 3, 17, '#dfdfd2', tx, 40.15, tz, 32);
  cylinder(.07, .12, 3.2, '#a8b3a6', tx, 50.2, tz, 8);
  // Lower exhibition frontage is a symbolic reconstruction from the Roadview,
  // not a confirmed door or measured building footprint.
  for (const [x,z,w,d,h] of [[-48,-22,29,20,10],[-48,20,29,20,10]]) {
    box('#e5e0d5',x,h/2,z,w,h,d);
    box('#f8f4e9',x,h+.3,z,w+1,.6,d+1);
    for (let dz=-d/2+2;dz<d/2;dz+=4) box('#a3b9b9',x+w/2+.05,h*.5,z+dz,.12,5,2.6);
  }
  // Curved canopy silhouette is decorative; no entrance marker is placed on it.
  for (const side of [-1,1]) {
    const points = Array.from({length:25},(_,i)=>new THREE.Vector3(-70 + i*2.1,12+Math.sin(i/24*Math.PI)*8,side*31));
    const curve = new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve,32,.6,8,false),'#9bb6b4',0,0,0);
    for(let i=0;i<24;i++) {
      const a=points[i],b=points[i+1];
      box('#c8d8d1',(a.x+b.x)/2,(a.y+b.y)/2,side*31,2.5,.7,12);
    }
  }
  // Low seating and lighting on either side of the paved approach.
  for (const [x, z] of [[-82, 20], [-82, 55], [-17, 64], [49, 67]]) {
    box('#baaa8b', x, 1.2, z, 5, .5, 1.4);
    for (const dx of [-1.7, 1.7]) box('#a9b0a2', x + dx, .65, z, .4, 1, .8);
    box('#879a95', x + 5, 3, z, .2, 6, .2);
    item('sphere', '#faf8e9', x + 5, 6.2, z, .7, .7, .7);
  }
  // Small still figures establish miniature scale, not traffic or location data.
  for (const [x, z] of [[-62, 67], [-28, 60], [-92, -34], [53, -51], [-26, 32]]) {
    box('#c7b79b', x, 1.15, z, .65, 1.45, .5);
    item('sphere', '#ddc6aa', x, 2.2, z, .42, .42, .42);
    for (const dx of [-.18, .18]) box('#82908d', x + dx, .4, z, .2, .8, .25);
  }
  for (const batch of batches.values()) {
    const instances = new THREE.InstancedMesh(shapes[batch.kind], mat(batch.color), batch.instances.length);
    const dummy = new THREE.Object3D();
    batch.instances.forEach((v, index) => { dummy.position.set(v.x, v.y, v.z); dummy.scale.set(v.sx, v.sy, v.sz); dummy.rotation.y = v.rotation; dummy.updateMatrix(); instances.setMatrixAt(index, dummy.matrix); });
    instances.castShadow = true; instances.receiveShadow = true; root.add(instances);
  }
  const route = new THREE.CurvePath();
  for (let i = 1; i < ROUTE.length; i++) route.add(new THREE.LineCurve3(new THREE.Vector3(...ROUTE[i - 1]), new THREE.Vector3(...ROUTE[i])));
  // Camera replay line, not a wheelchair route.
  const demoRoute = new THREE.CurvePath();
  for (let i=1;i<DEMO_ROUTE.length;i++) demoRoute.add(new THREE.LineCurve3(new THREE.Vector3(...DEMO_ROUTE[i-1]),new THREE.Vector3(...DEMO_ROUTE[i])));
  const cursor = mesh(new THREE.SphereGeometry(1.2,12,8), '#b7863a', ...ROUTE[0]);
  cursor.castShadow = false;
  const viewArrow = new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(),30,'#bc812e',4,2);
  root.add(viewArrow);
  const routeMaterial = mat('#248e8e');
  for (let distance = 0; distance < route.getLength(); distance += 2.7) {
    const a = route.getPoint(distance / route.getLength()), b = route.getPoint(Math.min(1, (distance + 1.45) / route.getLength()));
    const segment = new THREE.LineCurve3(a, b);
    const geometry = new THREE.TubeGeometry(segment, 1, .19, 6, false); geometries.add(geometry);
    root.add(new THREE.Mesh(geometry, routeMaterial));
  }
  const chair = new THREE.Group(); root.add(chair);
  const body = (color, x, y, z, sx, sy, sz) => { const m = mesh(shapes.box, color, x, y, z, chair); m.scale.set(sx, sy, sz); return m; };
  body('#597b7e', 0, 1.6, 0, 1.9, .25, 1.7); body('#597b7e', 0, 2.3, .65, 1.9, 1.35, .25);
  for (const x of [-1.15, 1.15]) {
    const wheel = mesh(new THREE.TorusGeometry(.95, .12, 8, 24), '#365257', x, 1.02, .1, chair); wheel.rotation.y = Math.PI / 2;
    const push = mesh(new THREE.TorusGeometry(.73, .055, 6, 24), '#b6c3bf', x * 1.06, 1.02, .1, chair); push.rotation.y = Math.PI / 2;
    const hub = mesh(new THREE.CylinderGeometry(.1, .1, 1.8, 8), '#a2b5b4', x, 1.02, .1, chair); hub.rotation.x = Math.PI / 2;
    const front = mesh(new THREE.SphereGeometry(.26, 10, 8), '#53646a', x * .67, .3, -1.3, chair); front.scale.x = .5;
  }
  body('#087e83', 0, 2.55, .07, 1.35, 1.8, .85);
  const head = mesh(shapes.sphere, '#dbc2a7', 0, 3.92, -.03, chair); head.scale.set(.55, .6, .55);
  const hair = mesh(new THREE.SphereGeometry(.56, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#4b4c45', 0, 4.04, -.03, chair);
  hair.scale.y = .8;
  for (const x of [-.43, .43]) { body('#3e626a', x, 1.6, -1, .56, .5, 1.3); body('#3e626a', x, .95, -1.52, .5, 1, .5); body('#eee7d7', x, .4, -1.65, .55, .3, .85); }
  // Static plaza shadows are baked once at render time. Avoid a stale moving shadow.
  chair.traverse(object => { object.castShadow = false; });
  chair.scale.setScalar(1.6); chair.position.copy(demoRoute.getPoint(0));
  return { root, chair, route, demoRoute, cursor, viewArrow, dispose() { root.removeFromParent(); viewArrow.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); } };
}
