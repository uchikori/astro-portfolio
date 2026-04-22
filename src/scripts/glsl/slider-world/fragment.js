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
import { varying } from "./vertex";
export default function Fragment(opt) {
  return Fn(() => {
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    const clipUv = utils.coverUv(vUv, uniforms.uResolution);

    //UVを-0.5~0.5の範囲に収める
    const minimizeUv = sub(clipUv, 0.5);

    // scaleを0.7~1.0の範囲で変化させる
    const scale = mix(0.7, 1.0, varying.vScaleProgress);

    // scaleを適用
    const scaleUv = mul(minimizeUv, scale);

    //UVを0~1の範囲に戻す
    const coverUv = add(scaleUv, 0.5);

    const tex1 = texture(uniforms.uTexes.tex1, coverUv);

    const alpha = mix(0.0, tex1.a, varying.vDistProgress);

    return vec4(tex1.rgb, alpha);
  })();
}
