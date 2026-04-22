import {
  BoxGeometry,
  MeshToonMaterial,
  MeshBasicMaterial,
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
  debug(folder) {
    folder.add(this.uniforms.uEdge, "value", 0, 1).step(0.01).name("uEdge");
  }
}
