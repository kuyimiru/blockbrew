/**
 * ModelController.js — 3D 模型交互控制器（重写版）
 *
 * 处理射线检测、悬停高亮、UV→像素坐标转换。
 * 修复：使用 getFaceInfo 正确识别面，不再硬编码 'steve'。
 */

import * as THREE from 'three';
import { uvToPixel } from '../skin/UVMap.js';
import { getFaceInfo } from './ModelBuilder.js';

export class ModelController {
  /**
   * @param {THREE.Camera} camera
   * @param {THREE.Group[]} modelGroups
   * @param {HTMLCanvasElement} canvas
   */
  constructor(camera, modelGroups, canvas) {
    this.camera = camera;
    this.modelGroups = modelGroups;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.02;
    this.mouse = new THREE.Vector2();

    // 高亮面指示器
    this.highlightPlane = null;
    this.createHighlight();

    this.onDraw = null;
    this.onHover = null;

    this.allMeshes = [];
    this.collectMeshes();

    // 存储当前模型类型
    this.modelType = 'steve';
  }

  /** 设置模型类型（Steve/Alex），影响 UV 坐标计算 */
  setModelType(type) {
    this.modelType = type;
  }

  collectMeshes() {
    this.allMeshes = [];
    for (const group of this.modelGroups) {
      if (!group) continue;
      group.traverse((child) => {
        if (child.isMesh) this.allMeshes.push(child);
      });
    }
  }

  createHighlight() {
    const geo = new THREE.PlaneGeometry(0.15, 0.15);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xd4a843,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      depthTest: true,
      depthWrite: false,
    });
    this.highlightPlane = new THREE.Mesh(geo, mat);
    this.highlightPlane.visible = false;
    this.highlightPlane.renderOrder = 999;
  }

  getHighlightMesh() {
    return this.highlightPlane;
  }

  updateMouse(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  updateMouseFromTouch(touch) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }

  raycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.allMeshes, false);
    return intersects.length > 0 ? intersects[0] : null;
  }

  /**
   * 获取绘制目标：UV 交点 → 像素坐标
   * 修复：使用 getFaceInfo 获取正确的面名称 + 使用实例的 modelType
   * @returns {{ x: number, y: number, part: string, face: string, layer: string } | null}
   */
  getDrawTarget() {
    const hit = this.raycast();
    if (!hit) return null;

    const mesh = hit.object;
    const uv = hit.uv;
    if (!uv || !mesh.userData.bodyPart) return null;

    // 使用 ModelBuilder 导出的函数获取正确的面信息
    const { faceName, bodyPart, layer } = getFaceInfo(mesh, hit.faceIndex);

    // UV → 像素坐标（使用正确的 modelType）
    const { x, y } = uvToPixel(uv.x, uv.y, bodyPart, faceName, layer, this.modelType);

    return { x, y, part: bodyPart, face: faceName, layer };
  }

  /**
   * 更新悬停高亮（面片贴在交点表面）
   */
  updateHover() {
    const hit = this.raycast();
    if (hit && this.highlightPlane) {
      const point = hit.point.clone();
      const normal = hit.face.normal.clone();
      this.highlightPlane.position.copy(point.add(normal.multiplyScalar(0.003)));
      this.highlightPlane.lookAt(
        this.highlightPlane.position.x + normal.x,
        this.highlightPlane.position.y + normal.y,
        this.highlightPlane.position.z + normal.z
      );
      this.highlightPlane.visible = true;
    } else if (this.highlightPlane) {
      this.highlightPlane.visible = false;
    }
    if (this.onHover) this.onHover(hit);
  }

  setModelGroups(groups) {
    this.modelGroups = groups;
    this.collectMeshes();
  }

  dispose() {
    if (this.highlightPlane) {
      this.highlightPlane.geometry.dispose();
      this.highlightPlane.material.dispose();
    }
  }
}
