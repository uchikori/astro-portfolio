import {
  add,
  Fn,
  mix,
  mul,
  step,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec4,
} from "three/tsl";

import { utils } from "../../helper";
export default function Fragment(opt) {
  return Fn(() => {
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    const clipUv = utils.coverUv(vUv, uniforms.uResolution);

    const tex1 = texture(uniforms.uTexes.tex1, clipUv);
    const tex2 = texture(uniforms.uTexes.tex2, clipUv);

    // どちらか存在する方をサンプル
    // const color = mix(tex1, tex2, step(0.5, clipUv.x));
    const color = tex1.toVar();

    color.a.assign(
      mul(color.a, mix(1.0, sub(1.0, vUv.y).mul(0.6), uniforms.uIsReflect)),
    );

    return color;
  })();
}
