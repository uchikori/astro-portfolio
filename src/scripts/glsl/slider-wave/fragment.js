import {
  add,
  cos,
  Fn,
  mix,
  mul,
  smoothstep,
  step,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec4,
} from "three/tsl";
import { utils } from "../../helper";
import { varying } from "./vertex";
export default function Fragment(opt) {
  return Fn(() => {
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    const clipUv = utils.coverUv(vUv, uniforms.uResolution);

    const tex1 = texture(uniforms.uTexes.tex1, clipUv);

    const alpha = smoothstep(0.8, 1.0, cos(varying.vDistPhase));

    const tex1Alpha = mul(tex1.a, alpha);

    return vec4(tex1.rgb, tex1Alpha);
  })();
}
