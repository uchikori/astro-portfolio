import { Ob } from "#/glsl/Ob";
import Fragment from "#/glsl/circle-image/fragment";
import Vertex from "#/glsl/circle-image/vertex";

export default class extends Ob {
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
