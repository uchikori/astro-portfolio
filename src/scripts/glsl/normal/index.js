import { BoxGeometry } from "three/webgpu";
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
}
