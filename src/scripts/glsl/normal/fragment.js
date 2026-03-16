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
export default function Fragment(opt) {
  return Fn(() => {
    function coverUv(modUv, resolution) {
      return add(mul(sub(modUv, 0.5), resolution.zw), 0.5);
    }
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    const clipUv = coverUv(vUv, uniforms.uResolution);

    const tex1 = texture(uniforms.uTexes.tex1, clipUv);
    const tex2 = texture(uniforms.uTexes.tex2, clipUv);

    // どちらか存在する方をサンプル
    // const color = mix(tex1, tex2, step(0.5, clipUv.x));
    const color = tex1;
    return color;
  })();
}
