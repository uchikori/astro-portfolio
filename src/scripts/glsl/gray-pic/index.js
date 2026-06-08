import { Ob } from "#/glsl/Ob";
import Fragment from "#/glsl/gray-pic/fragment";
import Vertex from "#/glsl/gray-pic/vertex";

export default class extends Ob {
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }
}
