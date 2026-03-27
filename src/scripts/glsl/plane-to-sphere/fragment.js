import {
  texture,
  vec4,
  vec2,
  Discard,
  pointUV,
  Fn,
  If,
  distance,
  greaterThan,
  float,
  sin,
  step,
  sub,
  add,
  mul,
  uv,
} from "three/tsl";
import { utils } from "../../helper";

export default function Fragment(options) {
  return Fn(() => {
    const { vUv, uniforms, aSpherePosition, aDelay, aSphereNormal } = options;

    const tex = texture(uniforms.uTexes.tex1, vUv);

    return tex;
  })();
}
