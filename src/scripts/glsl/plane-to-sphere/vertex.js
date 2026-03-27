import { mul, sub, clamp, Fn, mix, positionLocal } from "three/tsl";

import { utils } from "../../helper";

export default function Vertex(options) {
  return Fn(() => {
    const { vUv, uniforms, aSpherePosition, aDelay, aSphereNormal } = options;

    const delay = utils.backInOut(
      clamp(mul(uniforms.uProgress, 2.0).sub(aDelay), 0.0, 1.0),
    );

    const aPlanePosition = positionLocal;

    const pos = mix(aPlanePosition, aSpherePosition, delay);

    return pos;
  })();
}
