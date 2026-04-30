import {
  BoxGeometry,
  MeshToonMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three/webgpu";
import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";
import { gui } from "../../helper";
import { uniform } from "three/tsl";

export default class extends Ob {
  setupRenderTargetMaterial() {
    const materialType = this.DOM.el.dataset.renderMaterial;

    if (materialType === "toon") {
      return (original) =>
        new MeshToonMaterial({
          color: original.color,
          map: original.map,
          transparent: original.transparent,
          opacity: original.opacity,
          alphaTest: original.alphaTest,
        });
    } else if (materialType === "basic") {
      return (original) =>
        new MeshBasicMaterial({
          color: original.color,
          map: original.map,
          transparent: original.transparent,
          opacity: original.opacity,
          alphaTest: original.alphaTest,
        });
    } else if (materialType === "standard") {
      const roughness = parseFloat(this.DOM.el.dataset.roughness) || 0.5;
      const metalness = parseFloat(this.DOM.el.dataset.metalness) || 0.5;
      return (original) =>
        new MeshStandardMaterial({
          color: original.color,
          map: original.map,
          transparent: original.transparent,
          opacity: original.opacity,
          alphaTest: original.alphaTest,
          roughness: roughness,
          metalness: metalness,
        });
    }

    return null; // デフォルトはGLTFオリジナルのマテリアル
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uEdge = uniform(0.5);
    return uniforms;
  }
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  async afterInit() {
    await super.afterInit();

    // HTMLから回転角度を取得（度数法）
    const rx = parseFloat(this.DOM.el.dataset.rotationX) || 0;
    const ry = parseFloat(this.DOM.el.dataset.rotationY) || 0;
    const rz = parseFloat(this.DOM.el.dataset.rotationZ) || 0;

    // ラジアンに変換してモデルに適用
    this.mesh.traverse((child) => {
      if (child.isGroup || child.isMesh) {
        // RenderTarget内のシーンにあるモデル自体を回転させる
        this.targetInfo?.scene.traverse((obj) => {
          if (obj.isGroup && obj.name.includes("Scene")) {
            obj.rotation.set(
              (rx * Math.PI) / 180,
              (ry * Math.PI) / 180,
              (rz * Math.PI) / 180,
            );
          }
        });
      }
    });
  }
  debug(folder) {
    folder.add(this.uniforms.uEdge, "value", 0, 1).step(0.01).name("uEdge");

    // マテリアルのプロパティをデバッグ（MeshStandardMaterialの場合のみ）
    this.mesh.traverse((child) => {
      if (child.material && child.material.isMeshStandardMaterial) {
        folder.add(child.material, "roughness", 0, 1).step(0.01).name("Roughness");
        folder.add(child.material, "metalness", 0, 1).step(0.01).name("Metalness");
      }
    });

    // 回転のデバッグ
    this.targetInfo?.scene.traverse((obj) => {
      if (obj.isGroup && obj.name.includes("Scene")) {
        const rotFolder = folder.addFolder("Rotation");
        rotFolder.add(obj.rotation, "x", -Math.PI, Math.PI).step(0.01).name("Rotate X");
        rotFolder.add(obj.rotation, "y", -Math.PI, Math.PI).step(0.01).name("Rotate Y");
        rotFolder.add(obj.rotation, "z", -Math.PI, Math.PI).step(0.01).name("Rotate Z");
      }
    });
  }
}
