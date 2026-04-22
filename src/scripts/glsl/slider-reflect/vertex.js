import { add, cos, Fn, mul, positionLocal } from "three/tsl";

export default function Vertex(options) {
  return Fn(() => {
    const { uniforms } = options;

    const position = positionLocal.toVar();

    position.y.assign(add(position.y, cos(mul(uniforms.uTick, 0.04)).mul(2)));

    return position;
  })();
}
