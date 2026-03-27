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
import { utils } from "../../helper/utils";

export default function Fragment(opt) {
  return Fn(() => {
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    const clipUv = utils.coverUv(vUv, uniforms.uResolution);

    const tex1 = texture(uniforms.uTexes.tex1, clipUv);
    const gray = utils.grayScale(tex1);

    // どちらか存在する方をサンプル
    const color = mix(tex1, gray, uniforms.uHover);
    return color;
  })();
}
