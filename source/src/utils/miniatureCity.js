import * as THREE from 'three';

// Artistic model coordinates. Deliberately NOT a projection of facility GPS data.
export const MINIATURE_POINTS = [[39, 1, 35], [-95, 1, 22], [78, 1, -62]];
export const DEMO_ROUTE = [[-10, 1, 65], [-10, 1, 35], [39, 1, 35]];

export function buildMiniatureCity(scene) {
  const geometries = new Set();
  const materials = new Map();
  const batches = new Map();
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const treeGeometry = new THREE.IcosahedronGeometry(1, 1);
  geometries.add(boxGeometry); geometries.add(treeGeometry);
  const material = color => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .86 }));
    return materials.get(color);
  };
  function item(kind, color, x, y, z, sx, sy, sz) {
    const key = `${kind}:${color}`;
    if (!batches.has(key)) batches.set(key, { kind, color, instances: [] });
    batches.get(key).instances.push({ x, y, z, sx, sy, sz });
  }
  const box = (color, x, y, z, sx, sy, sz) => item('box', color, x, y, z, sx, sy, sz);
  const mesh = (geometry, color, x, y, z) => {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; scene.add(object); return object;
  };
  let seed = 502026;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const tree = (x, z, s = 1) => {
    box('#a49a7e', x, 1.3 * s, z, .45 * s, 2.6 * s, .45 * s);
    item('tree', ['#91af76', '#769c68', '#a4ba83'][Math.floor(random() * 3)], x, 3.3 * s, z, 1.65 * s, 2.3 * s, 1.65 * s);
  };
  box('#e8eadf', 0, -1.1, 0, 330, 2, 310);
  box('#73bdce', -49, -.1, 0, 31, .7, 310);
  for (const x of [-67, -31]) {
    box('#d1d7ba', x, .05, 0, 5, .7, 310);
    box('#f3eee2', x, .46, 0, 2, .08, 310);
    for (let z = -147; z < 155; z += 8) tree(x, z, .9);
  }
  // Street network, pavements, crossings, river embankments.
  const streetsX = [-142, -105, -10, 35, 80, 125];
  const streetsZ = [-125, -80, -35, 10, 55, 100, 145];
  for (const x of streetsX) {
    box('#c4cbce', x, .05, 0, 9, .2, 310);
    for (const side of [-1, 1]) box('#fbf9ee', x + side * 5.3, .23, 0, 1.6, .4, 310);
    for (let z = -150; z < 150; z += 7) box('#f4f4e9', x, .18, z, .22, .06, 3);
  }
  for (const z of streetsZ) {
    for (const [x, width] of [[-120, 92], [64, 190]]) {
      box('#c4cbce', x, .05, z, width, .2, 9);
      for (const side of [-1, 1]) box('#fbf9ee', x, .23, z + side * 5.3, width, .4, 1.6);
    }
    for (const x of streetsX) for (let k = -3; k <= 3; k++) box('#ffffff', x + k, .2, z + 7, .5, .05, 3);
  }
  // Park around a newly constructed Hanbit-inspired landmark.
  box('#b8cba0', 34, .22, -58, 74, .5, 111);
  mesh(new THREE.CylinderGeometry(18, 18, .4, 64), '#eeeae0', 30, .7, -61);
  mesh(new THREE.CylinderGeometry(13, 14, .6, 64), '#d5e2da', 30, 1.15, -61);
  mesh(new THREE.CylinderGeometry(4.4, 7.3, 22, 12), '#f4f2e9', 30, 12.4, -61);
  mesh(new THREE.CylinderGeometry(10.2, 9.6, 2.8, 48), '#fafbf7', 30, 24.5, -61);
  mesh(new THREE.CylinderGeometry(10.3, 10.3, 1.1, 48), '#81b4d1', 30, 25.3, -61);
  mesh(new THREE.ConeGeometry(3.6, 25, 12), '#ecefe8', 30, 38.7, -61);
  mesh(new THREE.ConeGeometry(1.5, 25.5, 8), '#7faec8', 30, 39, -61);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    box('#ffffff', 30 + Math.cos(angle) * 9.6, 25, -61 + Math.sin(angle) * 9.6, .9, 2.6, .9);
  }
  for (let i = 0; i < 110; i++) {
    const x = random() * 65 - 1, z = random() * 101 - 106;
    if (Math.hypot(x - 30, z + 61) > 20) tree(x, z, .8 + random() * .4);
  }
  // Real 3D arched bridge: decks, two arches, and vertical suspension members.
  for (const z of [-35, 100]) {
    box('#eceee7', -49, 2, z, 43, 2, 9);
    box('#bcc7cb', -49, 3.05, z, 43, .2, 6.5);
    for (const side of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 40; i++) points.push(new THREE.Vector3(-70 + i * 1.05, 3 + Math.sin(i / 40 * Math.PI) * 14, z + side * 4));
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, .55, 8, false), '#fafcf9', 0, 0, 0);
      for (let i = 3; i < 40; i += 4) {
        const h = Math.sin(i / 40 * Math.PI) * 14;
        box('#f9fbf6', -70 + i * 1.05, 3 + h / 2, z + side * 4, .22, h, .22);
      }
    }
  }
  let buildingCount = 0;
  for (let x = -158; x < 155; x += 15) for (let z = -144; z < 148; z += 15) {
    if (x > -75 && x < -22) continue;
    if (x > -5 && x < 71 && z > -113 && z < -1) continue;
    if (streetsX.some(v => Math.abs(v - x) < 10) || streetsZ.some(v => Math.abs(v - z) < 10)) continue;
    const w = 8 + random() * 3, d = 8 + random() * 3, h = 7 + random() ** 2 * 32;
    box('#f4f3ed', x, h / 2 + .6, z, w, h, d);
    box('#d6dce0', x, h + .8, z, w - 1.4, .35, d - 1.4);
    box('#e7e9e6', x + 1, h + 1.8, z, w * .34, 2, d * .35);
    for (let y = 3; y < h; y += 3) {
      box('#a9c1ce', x, y, z + d / 2 + .04, w * .72, 1.3, .1);
      box('#abc3cf', x + w / 2 + .04, y, z, .1, 1.3, d * .72);
      box('#b8ccd5', x, y, z - d / 2 - .04, w * .72, 1.3, .1);
      box('#b1c5ce', x - w / 2 - .04, y, z, .1, 1.3, d * .72);
    }
    for (const side of [-1, 1]) tree(x + side * 6, z + 6, .65 + random() * .3);
    buildingCount++;
  }
  // Low civic hall near the first schematic pin.
  box('#f2eee4', 52, 4, 32, 24, 8, 18);
  box('#d4dde0', 52, 8.25, 32, 25, .6, 19);
  box('#8cb0bd', 52, 3.9, 41.1, 20, 5.5, .15);
  for (let x = 43; x < 63; x += 4) box('#f6f3e9', x, 4, 41.4, .8, 7, 1);
  for (const batch of batches.values()) {
    const instance = new THREE.InstancedMesh(batch.kind === 'tree' ? treeGeometry : boxGeometry, material(batch.color), batch.instances.length);
    const dummy = new THREE.Object3D();
    batch.instances.forEach((value, index) => {
      dummy.position.set(value.x, value.y, value.z); dummy.scale.set(value.sx, value.sy, value.sz); dummy.updateMatrix(); instance.setMatrixAt(index, dummy.matrix);
    });
    instance.castShadow = true; instance.receiveShadow = true; scene.add(instance);
  }
  const routeGeometry = new THREE.BufferGeometry().setFromPoints(DEMO_ROUTE.map(p => new THREE.Vector3(...p)));
  geometries.add(routeGeometry);
  const routeMaterial = new THREE.LineDashedMaterial({ color: '#2272e7', dashSize: 2, gapSize: 1.3 });
  const routeLine = new THREE.Line(routeGeometry, routeMaterial); routeLine.computeLineDistances(); scene.add(routeLine);
  return { buildingCount, dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); routeMaterial.dispose(); } };
}
