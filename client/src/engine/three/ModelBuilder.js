/**
 * ModelBuilder.js — Minecraft 角色模型构建器
 *
 * 使用 BoxGeometry + 手动逐面 UV 覆写。
 * 参考: mineskinscraft / skinview3d 开源实现
 *
 * BoxGeometry 面顺序: +X(right), -X(left), +Y(top), -Y(bottom), +Z(front), -Z(back)
 * 每面 4 顶点, UV 属性 24 条目 (6面×4顶点×2(u,v))
 */
import * as THREE from 'three';
import { UV_INNER, UV_OUTER, BODY_PARTS } from '../skin/UVMap.js';

const SKIN_SIZE = 64, UV_INSET = 0.006, S = 1 / 16;

const PART_DIMS = {
  head: [8,8,8], body: [8,12,4], rightArm: [4,12,4], leftArm: [4,12,4], rightLeg: [4,12,4], leftLeg: [4,12,4],
};
const PART_CENTERS = {
  head: [0,28,0], body: [0,18,0], rightArm: [-6,18,0], leftArm: [6,18,0], rightLeg: [-2,6,0], leftLeg: [2,6,0],
};

/**
 * 为 BoxGeometry 的一个面设置 UV 坐标
 *
 * BoxGeometry 每面 4 顶点, UV 在属性数组中按面顺序排列。
 * 面 0(+X/right) 的 UV 在 arr[0..7], 面 1(-X/left) 在 arr[8..15], 以此类推。
 *
 * @param {Float32Array} arr - geometry.attributes.uv.array
 * @param {number} faceIdx - 0=right,1=left,2=top,3=bottom,4=front,5=back
 * @param {{x:number,y:number,w:number,h:number}} rect - UV 矩形
 * @param {{u0:number,u1:number,u2:number,u3:number,v0:number,v1:number,v2:number,v3:number}} map
 *   - map.uN: 0=使用 u0(rect左), 1=使用 u1(rect右)
 *   - map.vN: 0=使用 vBot(rect底), 1=使用 vTop(rect顶)
 */
function setFaceUV(arr, faceIdx, rect, map) {
  const base = faceIdx * 8;
  const uL = (rect.x + UV_INSET) / SKIN_SIZE;
  const uR = (rect.x + rect.w - UV_INSET) / SKIN_SIZE;
  // flipY=true: Three.js 翻转 Canvas — v=0→canvas底部, v=1→canvas顶部
  // 面部 top 应得较大 v(映射到 canvas 上部), bottom 应得较小 v(映射到 canvas 下部)
  const vT = 1 - (rect.y + UV_INSET) / SKIN_SIZE;           // 面部顶部 → 较大 v
  const vB = 1 - (rect.y + rect.h - UV_INSET) / SKIN_SIZE;  // 面部底部 → 较小 v
  const U = [uL, uR], V = [vB, vT];

  for (let vi = 0; vi < 4; vi++) {
    arr[base + vi*2] = U[map['u'+vi]];
    arr[base + vi*2 + 1] = V[map['v'+vi]];
  }
}

/**
 * BoxGeometry 每面的顶点布局 (Three.js r168):
 *
 * 面4(前 +Z): v0(-X,-Y,+Z) v1(+X,-Y,+Z) v2(-X,+Y,+Z) v3(+X,+Y,+Z)
 * 面5(后 -Z): v0(+X,-Y,-Z) v1(-X,-Y,-Z) v2(+X,+Y,-Z) v3(-X,+Y,-Z)
 * 面0(右 +X): v0(+X,-Y,-Z) v1(+X,-Y,+Z) v2(+X,+Y,-Z) v3(+X,+Y,+Z)
 * 面1(左 -X): v0(-X,-Y,+Z) v1(-X,-Y,-Z) v2(-X,+Y,+Z) v3(-X,+Y,-Z)
 * 面2(上 +Y): v0(-X,+Y,+Z) v1(-X,+Y,-Z) v2(+X,+Y,+Z) v3(+X,+Y,-Z)
 * 面3(下 -Y): v0(-X,-Y,-Z) v1(-X,-Y,+Z) v2(+X,-Y,-Z) v3(+X,-Y,+Z)
 *
 * 每面 UV 映射规则: 对于每个顶点, 确定它在面上的"左右"和"上下"位置,
 * 然后分配对应的 UV 角。
 *
 * v0 始终位于面的 (左或右, 下) 角
 * v1 位于 (相反水平, 下)
 * v2 位于 (同v0水平, 上)
 * v3 位于 (相反水平, 上)
 *
 * 对于前面(front): 左=-X, 右=+X → v0(-X)=左, v1(+X)=右
 * 对于后面(back):  从后面看, 左=+X, 右=-X → v0(+X)=_右_, v1(-X)=_左_
 * 对于右面(right): 从右看, 左=-Z, 右=+Z → v0(-Z)=左, v1(+Z)=右
 * 对于左面(left):  从左看, 左=+Z, 右=-Z → v0(+Z)=_右_, v1(-Z)=_左_
 * 对于上面(top):   从上往下看, 前=+Z(下), 后=-Z(上), 左=-X(左), 右=+X(右)
 *                   v0(-X,+Z)=左下 → u=左,v=下 ✓
 * 对于下面(bottom):从下往上看, 前=+Z(上), 后=-Z(下)
 *                   v0(-X,-Z)=左上 → 需要交换V
 */

// UV 映射表: 每面 8 个值 [u0,u1,u2,u3, v0,v1,v2,v3]
// u值: 0=纹理左边(u0), 1=纹理右边(u1)
// v值: 0=纹理下边(vBot), 1=纹理上边(vTop)
const FACE_UV_MAPS = [
  // 面0: right (+X), 从右看: 左=-Z, 右=+Z
  // v0(-Z,-Y)=左下=左→u0, v1(+Z,-Y)=右下=右→u1, v2(-Z,+Y)=左上→u0, v3(+Z,+Y)=右上→u1
  { u0:0,u1:1,u2:0,u3:1, v0:0,v1:0,v2:1,v3:1 },
  // 面1: left (-X), 从左看: 左=+Z, 右=-Z
  // v0(+Z,-Y)=_右_下→u1, v1(-Z,-Y)=_左_下→u0, v2(+Z,+Y)=_右_上→u1, v3(-Z,+Y)=_左_上→u0
  { u0:1,u1:0,u2:1,u3:0, v0:0,v1:0,v2:1,v3:1 },
  // 面2: top (+Y), 从上往下看: 前=+Z(在屏幕下方), 后=-Z(上方), 左=-X, 右=+X
  // v0(-X,+Z)=左下→u0,vBot, v1(-X,-Z)=左上→u0,vTop, v2(+X,+Z)=右下→u1,vBot, v3(+X,-Z)=右上→u1,vTop
  { u0:0,u1:0,u2:1,u3:1, v0:0,v1:1,v2:0,v3:1 },
  // 面3: bottom (-Y), 从下往上看: 前=+Z(在上方), 后=-Z(下方), 左=-X, 右=+X
  // v0(-X,-Z)=左上→u0,vTop, v1(-X,+Z)=左下→u0,vBot, v2(+X,-Z)=右上→u1,vTop, v3(+X,+Z)=右下→u1,vBot
  { u0:0,u1:0,u2:1,u3:1, v0:1,v1:0,v2:1,v3:0 },
  // 面4: front (+Z), 从前面看: 左=-X, 右=+X
  // v0(-X,-Y)=左下→u0,vBot, v1(+X,-Y)=右下→u1,vBot, v2(-X,+Y)=左上→u0,vTop, v3(+X,+Y)=右上→u1,vTop
  { u0:0,u1:1,u2:0,u3:1, v0:0,v1:0,v2:1,v3:1 },
  // 面5: back (-Z), 从后面看: 左=+X, 右=-X
  // v0(+X,-Y)=_右_下→u1, v1(-X,-Y)=_左_下→u0, v2(+X,+Y)=_右_上→u1, v3(-X,+Y)=_左_上→u0
  { u0:1,u1:0,u2:1,u3:0, v0:0,v1:0,v2:1,v3:1 },
];

// 面名称映射: BoxGeometry面索引 → Minecraft面名
const FACE_NAMES = ['right', 'left', 'top', 'bottom', 'front', 'back'];

/**
 * 创建带正确 UV 映射的 BoxGeometry
 */
function createSkinnedBox(w, h, d, uvRects) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const arr = geo.attributes.uv.array;

  for (let fi = 0; fi < 6; fi++) {
    const faceName = FACE_NAMES[fi];
    const rect = uvRects[faceName];
    if (!rect) continue;
    setFaceUV(arr, fi, rect, FACE_UV_MAPS[fi]);
  }

  geo.attributes.uv.needsUpdate = true;
  geo.userData = { faceOrder: FACE_NAMES };
  return geo;
}

/** 构建单个部位组 (内层或外层) */
function buildPart(partId, dims, uvRects, texture, isOuter) {
  const group = new THREE.Group();
  const expand = isOuter ? 0.0005 : 0;
  const W = dims[0] * S + expand*2;
  const H = dims[1] * S + expand*2;
  const D = dims[2] * S + expand*2;

  const geo = createSkinnedBox(W, H, D, uvRects);
  const mat = new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.55, metalness: 0.02,
    side: THREE.DoubleSide,
    ...(isOuter ? { transparent: true, depthWrite: false, alphaTest: 0.05, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 } : {}),
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = { bodyPart: partId, layer: isOuter ? 'outer' : 'inner' };
  mesh.castShadow = true; mesh.receiveShadow = true;

  // 网格线
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: isOuter ? 0x444444 : 0x333333, transparent: true, opacity: 0.3 })
  );
  mesh.add(edges);
  group.add(mesh);
  return group;
}

/** 构建完整模型 */
export function buildModel(texture, modelType = 'steve') {
  const innerGroup = new THREE.Group(); innerGroup.name = 'inner';
  const outerGroup = new THREE.Group(); outerGroup.name = 'outer';
  const allMeshes = [];

  for (const partId of BODY_PARTS) {
    let dims = [...PART_DIMS[partId]];
    if (modelType === 'alex' && (partId === 'rightArm' || partId === 'leftArm')) dims[0] = 3;

    const innerPart = buildPart(partId, dims, UV_INNER[partId].faces, texture, false);
    setPartPos(innerPart, partId); innerGroup.add(innerPart);
    innerPart.traverse(c => { if (c.isMesh) allMeshes.push(c); });

    const outerPart = buildPart(partId, dims, UV_OUTER[partId].faces, texture, true);
    setPartPos(outerPart, partId); outerGroup.add(outerPart);
    outerPart.traverse(c => { if (c.isMesh) allMeshes.push(c); });
  }

  return { innerGroup, outerGroup, allMeshes };
}

function setPartPos(group, partId) {
  const [cx, cy, cz] = PART_CENTERS[partId];
  group.position.set(cx * S, cy * S, cz * S);
}

export function getFaceInfo(mesh, faceIndex) {
  const faceOrder = mesh.geometry.userData?.faceOrder || FACE_NAMES;
  const faceIdx = Math.floor((faceIndex || 0) / 2);
  return {
    faceName: faceOrder[faceIdx] || '?',
    bodyPart: mesh.userData?.bodyPart || '?',
    layer: mesh.userData?.layer || 'inner',
  };
}
