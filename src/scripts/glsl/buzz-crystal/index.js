import gsap from "gsap";
import { Ob } from "../Ob";
import Vertex from "./vertex";
import Fragment from "./fragment";

export default class extends Ob {
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }
  setupUniforms() {
    const uniforms = super.setupUniforms();
    // 
    // You can add more uniforms here for the buzz effect if needed
    // uniforms.uRefractionIndex = uniform(1.5);
    return uniforms;
  }
  
  debug(folder) {
    super.debug(folder);
    // Custom debug controls for the buzz effect
    const buzzFolder = folder.addFolder("Buzz Settings");
    buzzFolder.open();
    
    // Example: Intensity control (if we add it in fragment later)
    // buzzFolder.add(this.uniforms.uTickScale, "value", 0, 0.1, 0.001).name("Speed");
  }
}
