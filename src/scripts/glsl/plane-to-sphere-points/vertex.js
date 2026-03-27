import { mul, sub, clamp, Fn, mix } from "three/tsl";

import { utils } from "../../helper";

export default function Vertex(options) {
  return Fn(() => {
    const {
      vUv,
      uniforms,
      aInstancePlanePosition,
      aInstanceSpherePosition,
      aInstanceDelay,
      aInstanceUV,
    } = options;

    const delay = utils.backInOut(
      clamp(
        mul(uniforms.uProgress, 2.0).sub(aInstanceDelay),
        0.0,
        1.0,
      ),
    );

    const pos = mix(
      aInstancePlanePosition.toVar(),
      aInstanceSpherePosition.toVar(),
      delay,
    );

    return pos;
  })();
}
