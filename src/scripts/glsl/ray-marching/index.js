import { Ob } from "#/glsl/Ob";
import Fragment from "#/glsl/ray-marching/fragment";
import Vertex from "#/glsl/ray-marching/vertex";
import { viewport } from "#/helper/viewport";
import { uniform } from "three/tsl";
import gsap from "gsap";

export default class extends Ob {
  setupUniforms() {
    const uniforms = super.setupUniforms();

    uniforms.uLoop = uniform(15);
    uniforms.uProgress = uniform(1.0);

    uniforms.uDPR = uniform(viewport.devicePixelRatio);

    return uniforms;
  }
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  debug(folder) {
    folder
      .add(this.uniforms.uProgress, "value", 0, 1, 0.01)
      .name("progress")
      .listen();
    const datObj = { next: !!this.uniforms.uProgress.value };
    folder
      .add(datObj, "next")
      .name("Animate")
      .onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          value: +datObj.next,
          duration: 1.0,
          ease: "power4.inOut",
        });
      });
  }
}
