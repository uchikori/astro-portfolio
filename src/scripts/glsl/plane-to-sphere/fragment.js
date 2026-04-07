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
  mix,
  vec3,
  dot,
  cos,
} from "three/tsl";
import { utils } from "../../helper";
import { varying } from "./vertex";

export default function Fragment(options) {
  return Fn(() => {
    const { vUv, uniforms, aSpherePosition, aSphereNormal } = options;

    // PlaneGeometryの色設定
    const cUv = utils.coverUv(vUv, uniforms.uResolution);
    const tex = texture(uniforms.uTexes.tex1, cUv);
    const gray = utils.grayScale(tex);
    const planeColor = mix(gray, tex, uniforms.uHover);

    // SphereGeometryの色設定
    let ray = vec3(
      cos(mul(uniforms.uTick, 0.01, 0.3)),
      sin(mul(uniforms.uTick, 0.01, 0.3)),
      1.0,
    );
    const fresnel = vec3(dot(ray, varying.vSphereNormal)).mul(0.5);
    const sphereRGB = mix(fresnel, sub(1.0, fresnel), uniforms.uReversal);
    const sphereColor = vec4(sphereRGB, 1.0);

    const color = mix(sphereColor, planeColor, varying.vProgress);

    return color;
  })();
}
