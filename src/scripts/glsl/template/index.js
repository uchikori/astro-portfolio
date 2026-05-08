import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";

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
