import * as THREE from 'three';
import { HANBIT_GEOMETRY, HANBIT_MAP, projectHanbit } from '../data/hanbitModelAreas.js';

// One ground coordinate system for OSM footprints, camera origins and the tower.
// Vertical dimensions are display choices, not surveyed building heights.
const bounds = { left: 20, right: 700, top: 35, bottom: 585 };
export const hanbitWorld = ([x, y], height = 0) => new THREE.Vector3(x - 360, height, y - 310);
const footprint = feature => feature.coordinates.map(([lat, lon]) => projectHanbit({ lat, lon }));

function clipPolygon(input) {
  let polygon = input;
  for (const [axis, edge, keepGreater] of [[0, bounds.left, true], [0, bounds.right, false], [1, bounds.top, true], [1, bounds.bottom, false]]) {
    const output = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const aIn = keepGreater ? a[axis] >= edge : a[axis] <= edge;
      const bIn = keepGreater ? b[axis] >= edge : b[axis] <= edge;
      if (aIn) output.push(a);
      if (aIn !== bIn) { const t = (edge - a[axis]) / (b[axis] - a[axis]); output.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
    }
    polygon = output;
  }
  return polygon;
}

function shapeFor(polygon) {
  const shape = new THREE.Shape();
  polygon.forEach(([x, y], index) => { shape[index ? 'lineTo' : 'moveTo'](x - 360, 310 - y); });
  shape.closePath();
  return shape;
}

function groundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2040; canvas.height = 1650;
  const ctx = canvas.getContext('2d');
  ctx.scale(3, 3); ctx.translate(-20, -35);
  ctx.fillStyle = '#dce6cf'; ctx.fillRect(20, 35, 680, 550);
  const path = feature => { ctx.beginPath(); footprint(feature).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
  const features = HANBIT_GEOMETRY.features;
  for (const feature of features) {
    const tags = feature.tags;
    if (!(tags.leisure || tags.landuse || ['parking', 'fountain'].includes(tags.amenity))) continue;
    path(feature); ctx.closePath();
    ctx.fillStyle = tags.amenity === 'fountain' ? '#579ea1' : tags.amenity === 'parking' ? '#aebdaf' : '#bdd2a9'; ctx.fill();
  }
  // Fine paving on the map's existing open ground, not an invented walking route.
  ctx.save(); ctx.globalAlpha = .15; ctx.strokeStyle = '#a4b398'; ctx.lineWidth = .35;
  for (let x = 20; x < 700; x += 12) { ctx.beginPath(); ctx.moveTo(x, 35); ctx.lineTo(x, 585); ctx.stroke(); }
  for (let y = 35; y < 585; y += 12) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(700, y); ctx.stroke(); }
  ctx.restore();
  for (const feature of features.filter(f => f.tags.highway)) {
    const drive = !['footway', 'path', 'pedestrian', 'steps', 'cycleway'].includes(feature.tags.highway);
    const width = drive ? feature.tags.highway === 'service' ? 6 : 21 : 3;
    path(feature); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = drive ? '#f9f8ed' : '#c7ccb9'; ctx.lineWidth = width + 3; ctx.stroke();
    ctx.strokeStyle = drive ? '#788d86' : '#f8f3e4'; ctx.lineWidth = width; ctx.stroke();
    if (drive && feature.tags.highway !== 'service') {
      ctx.strokeStyle = '#ede8c9'; ctx.lineWidth = .75; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function buildHanbitMiniature(scene) {
  const group = new THREE.Group(); scene.add(group);
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...extra });
  const ivory = material('#eee8d7'), wall = material('#d7d1bf'), roof = material('#f8f5e7');
  const glass = material('#83b6b3', { roughness: .35, metalness: .15 });
  const bronze = material('#b7a787', { roughness: .5, metalness: .15 });
  const put = (geometry, mat, position, parent = group) => {
    const mesh = new THREE.Mesh(geometry, mat); if (position) mesh.position.copy(position);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const slabShape = new THREE.Shape();
  const w = 340, h = 275, r = 18;
  slabShape.moveTo(-w + r, -h); slabShape.lineTo(w - r, -h); slabShape.quadraticCurveTo(w, -h, w, -h + r);
  slabShape.lineTo(w, h - r); slabShape.quadraticCurveTo(w, h, w - r, h); slabShape.lineTo(-w + r, h);
  slabShape.quadraticCurveTo(-w, h, -w, h - r); slabShape.lineTo(-w, -h + r); slabShape.quadraticCurveTo(-w, -h, -w + r, -h);
  const slab = new THREE.ExtrudeGeometry(slabShape, { depth: 11, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 3, steps: 1 });
  slab.rotateX(-Math.PI / 2);
  put(slab, material('#cdd8c4'), new THREE.Vector3(0, -13, 0));
  const ground = new THREE.ShapeGeometry(slabShape); ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position, uv = ground.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w) / (2 * w), 1 - (pos.getZ(i) + h) / (2 * h));
  const texture = groundTexture();
  const top = put(ground, material('#ffffff', { map: texture }), new THREE.Vector3(0, .1, 0)); top.castShadow = false;

  const labels = [{ name: '한빛탑', point: hanbitWorld(HANBIT_MAP.origin, 4) }, { name: '물빛광장', point: hanbitWorld([280, 424], 1) }, { name: '엑스포로', point: hanbitWorld([425, 570], 1) }];
  let buildingCount = 0;
  for (const feature of HANBIT_GEOMETRY.features.filter(f => f.tags.building && f.id !== '469022520')) {
    const polygon = clipPolygon(footprint(feature)); if (polygon.length < 3) continue;
    const area = Math.abs(polygon.reduce((sum, p, i) => { const q = polygon[(i + 1) % polygon.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    if (area < 8) continue;
    const pavilion = ['1190791842', '1190791843'].includes(feature.id);
    const height = pavilion ? 19 : feature.tags.building === 'roof' ? 7 : area > 10000 ? 29 : 16;
    const shape = shapeFor(polygon);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSize: .7, bevelThickness: .6, bevelSegments: 1, steps: 1 }); geometry.rotateX(-Math.PI / 2);
    put(geometry, [roof, wall]); buildingCount++;
    if (pavilion) {
      // Curved roof styling remains within the measured OSM footprint.
      const roofGeometry = new THREE.ShapeGeometry(shape, 12); roofGeometry.rotateX(-Math.PI / 2);
      const vertices = roofGeometry.attributes.position;
      const xs = polygon.map(p => p[0] - 360); const min = Math.min(...xs), max = Math.max(...xs);
      for (let i = 0; i < vertices.count; i++) vertices.setY(i, height + 3 + Math.pow((vertices.getX(i) - (min + max) / 2) / Math.max((max - min) / 2, 1), 2) * 8);
      roofGeometry.computeVertexNormals();
      put(roofGeometry, material('#aabfba', { metalness: .18, roughness: .5, side: THREE.DoubleSide }));
      const center = polygon.reduce((p, q) => [p[0] + q[0] / polygon.length, p[1] + q[1] / polygon.length], [0, 0]);
      labels.push({ name: feature.id === '1190791842' ? '기념관' : '대전통일관', point: hanbitWorld(center, height + 13) });
    }
  }

  const tower = new THREE.Group(); tower.position.copy(hanbitWorld(HANBIT_MAP.origin)); group.add(tower);
  const cylinder = (topRadius, bottomRadius, height, y, mat, segments = 48) => put(new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments), mat, new THREE.Vector3(0, y, 0), tower);
  cylinder(22, 24, 2, 1, ivory); cylinder(18, 20, 2, 3, ivory);
  cylinder(5.6, 11.5, 62, 35, ivory);
  cylinder(17, 21, 3.5, 66.5, bronze);
  cylinder(20, 20, 7, 72, glass);
  cylinder(21.5, 20.5, 2.5, 77, ivory);
  cylinder(7.5, 17, 5, 80.5, ivory);
  cylinder(.4, 6.5, 37, 101, bronze);
  for (let i = 0; i < 24; i++) {
    const angle = i / 24 * Math.PI * 2;
    put(new THREE.CylinderGeometry(.55, .55, 7.5, 6), ivory, new THREE.Vector3(Math.cos(angle) * 20.2, 72, Math.sin(angle) * 20.2), tower);
  }

  const trunk = material('#918572'), foliage = [material('#8aaa78'), material('#9db88b'), material('#7fa472')];
  let treeCount = 0;
  for (const feature of HANBIT_GEOMETRY.features.filter(f => f.tags.natural === 'tree_row')) {
    const path = footprint(feature);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const count = Math.max(1, Math.floor(length / 11));
      for (let j = 0; j < count; j++) {
        const p = [a[0] + (b[0] - a[0]) * (j + .5) / count, a[1] + (b[1] - a[1]) * (j + .5) / count];
        if (p[0] < 25 || p[0] > 695 || p[1] < 40 || p[1] > 580) continue;
        put(new THREE.CylinderGeometry(.65, .9, 7, 6), trunk, hanbitWorld(p, 3.5));
        const crown = put(new THREE.IcosahedronGeometry(4.5, 1), foliage[treeCount % 3], hanbitWorld(p, 9)); crown.scale.y = 1.35;
        treeCount++;
      }
    }
  }
  const backdrop = put(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ color: '#365341', opacity: .14 }), new THREE.Vector3(0, -16, 0)); backdrop.rotation.x = -Math.PI / 2; backdrop.castShadow = false;
  return { group, labels, buildingCount, treeCount, texture };
}

export function createViewDirection(selection) {
  const group = new THREE.Group();
  group.position.copy(hanbitWorld(selection.point, 1.5));
  group.rotation.y = -selection.viewHeading * Math.PI / 180;
  const shape = new THREE.Shape();
  const half = selection.fov * Math.PI / 360;
  shape.moveTo(0, 0);
  for (let i = 0; i <= 28; i++) { const a = -half + i / 28 * 2 * half; shape.lineTo(Math.sin(a) * 75, Math.cos(a) * 75); }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape); geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#e4b83e', transparent: true, opacity: .38, depthWrite: false, side: THREE.DoubleSide })); group.add(mesh);
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, .8, 0), 54, '#087466', 10, 7); group.add(arrow);
  return group;
}

export function disposeHanbitObject(group) {
  const geometries = new Set(), materials = new Set();
  group.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) for (const item of Array.isArray(object.material) ? object.material : [object.material]) materials.add(item); });
  geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
}
