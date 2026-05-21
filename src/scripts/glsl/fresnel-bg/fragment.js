import {
  add,
  Discard,
  Fn,
  If,
  lessThan,
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

    const color = tex1.toVar();

    If(lessThan(color.a, 0.1), () => {
      Discard;
    });

    const rgb = mix(color.rgb, sub(1.0, color.rgb), uniforms.uReversal);
    return vec4(rgb, color.a);
  })();
}
