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
    const {
      vUv,
      uniforms,
      aInstancePlanePosition,
      aInstanceSpherePosition,
      aInstanceDelay,
      aInstanceUV,
    } = options;

    const hue = float(
      sin(
        sub(
          mul(uniforms.uTick, uniforms.uColorTime),
          mul(aInstanceDelay, uniforms.uColorDelay),
        ),
      )
        .mul(0.5)
        .add(0.5),
    );

    const rgb = utils.hsl2rgb(hue, uniforms.uSaturation, uniforms.uLightness);

    const color = vec4(rgb, 1.0);

    return color;
  })();
}
