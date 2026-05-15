import { uniform } from "three/tsl";
import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";
import { Group } from "three/webgpu";

export default class extends Ob {
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uIsReflect = uniform(0);
    return uniforms;
  }

  setupMesh() {
    const mesh = super.setupMesh();

    const reflect = mesh.clone();
    reflect.material = this.material.clone();

    reflect.material.alphaTest = 0;

    // //reflectメッシュ専用のuniforms
    const reflectUniforms = {
      ...this.uniforms,
      uIsReflect: uniform(1),
      uTick: this.uniforms.uTick,
    };

    // //reflectメッシュ専用のfragmentシェーダーをセット
    reflect.material.colorNode = this.setupFragment({
      vUv: this.vUv,
      uniforms: reflectUniforms,
    });

    reflect.position.y = -(this.rect.height + 8);
    reflect.scale.y = -1;

    const group = new Group();
    const z = parseFloat(this.DOM.el.dataset.meshPositionZ) || 0;
    group.position.z = z;

    group.add(mesh, reflect);

    return group;
  }
}
