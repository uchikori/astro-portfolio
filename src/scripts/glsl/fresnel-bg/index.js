import { Ob } from "#/glsl/Ob";
import Fragment from "#/glsl/fresnel-bg/fragment";
import Vertex from "#/glsl/fresnel-bg/vertex";
import { utils } from "#/helper/utils";
import { uniform } from "three/tsl";

export default class extends Ob {
  beforeCreateMesh() {
    if (utils.isLowPerformanceMode()) {
      if (window.debug) {
        console.log(this.DOM.el);
      }
      this.scene.remove(this.mesh);
      throw new Error(
        "低パフォーマンスモードのためメッシュを生成しませんでした",
      );
    }
  }
  setupUniforms() {
    const _uniforms = super.setupUniforms();
    _uniforms.uReversal = uniform(0.0);
    return _uniforms;
  }

  setupTexes(uniforms) {
    const _uniforms = super.setupTexes(uniforms);

    if (utils.isSafari()) {
      _uniforms.uTexes.tex1 = _uniforms.uTexes.tex2;
    }

    return _uniforms;
  }
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  setupMesh() {
    const mesh = super.setupMesh();
    const z = parseFloat(this.DOM.el.dataset.meshPositionZ) || 0;
    mesh.position.z = z;

    return mesh;
  }
}
