import gsap from "gsap";
import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";
import { uniform, vec4 } from "three/tsl";

export default class extends Ob {
  setupUniforms() {
    const uniforms = super.setupUniforms();
    //
    uniforms.uSpeed = uniform(1.0);
    uniforms.uParam = uniform(vec4(1, 1, 1, 1));
    uniforms.uReversal = uniform(1);
    return uniforms;
  }
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  debug(folder) {
    const datObj = { next: !!this.uniforms.uProgress.value };
    folder
      .add(datObj, "next")
      .name("Animate")
      .onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          duration: 1,
          value: datObj.next ? 1 : 0,
          ease: "power2.out",
        });
      });
    folder
      .add(this.uniforms.uSpeed, "value", 0, 10, 0.1)
      .name("Speed")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "x", 0, 3, 0.1)
      .name("Noise X")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "y", 0, 3, 0.1)
      .name("Noise Y")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "z", 0, 3, 0.1)
      .name("Noise Z")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "w", 0, 3, 0.1)
      .name("Noise W")
      .listen();
    folder
      .add(this.uniforms.uReversal, "value", 0, 1, 0.1)
      .name("Reversal")
      .listen();
    folder
      .add(this.uniforms.uProgress, "value", 0, 1, 0.1)
      .name("Progress")
      .listen();
  }
}
