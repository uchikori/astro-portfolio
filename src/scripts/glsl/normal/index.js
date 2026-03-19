import { BoxGeometry } from "three/webgpu";
import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";
import { gui } from "../../helper";
import { uniform } from "three/tsl";

export default class extends Ob {
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
