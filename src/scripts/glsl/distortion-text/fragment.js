import {
  add,
  cos,
  dot,
  Fn,
  mix,
  mul,
  PI,
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

    const time = mul(uniforms.uTick, uniforms.uSpeed, 0.01);

    // ノイズの座標を計算
    // vUv.xを2倍してcosで周期的な波を作る
    // vUv.yから時間を引いて上方向に移動させる
    const noise = utils.noise2(
      vec2(
        mul(cos(mul(vUv.x, PI, 2.0)), uniforms.uParam.x),
        sub(mul(vUv.y, uniforms.uParam.y), time),
      ),
    );

    // sub(vUv, 0.5)でuv座標を-0.5~0.5の範囲に変換=>中心を0,0に
    // vec2(noise, noise)でノイズをベクトル化=>ノイズの方向をベクトル化
    // dotで内積を計算=>ノイズの方向とuv座標の方向の類似度を計算
    const d = dot(
      vec2(mul(noise, uniforms.uParam.z), mul(noise, uniforms.uParam.w)),
      vec2(sub(vUv, 0.5)),
    );

    // mul(d, 0.3, sub(1.0, uniforms.uProgress)=>ノイズの強さを制御
    // add(vUv, ...)=>ノイズの方向と強さをuv座標に足し込む
    const distortUV = add(vUv, mul(d, 0.3, sub(1.0, uniforms.uProgress)));

    const tex1 = texture(uniforms.uTexes.tex1, distortUV);

    //tex1からrgbを取り出す
    const rgb = tex1.rgb;

    //rgbを反転させる
    const rgb_inv = sub(1.0, rgb);

    //rgbと反転したrgbを混ぜる
    const color = mix(rgb, rgb_inv, sub(1.0, uniforms.uReversal));

    // const color = vec4(d, 0, 0, 1);
    // const color = tex1;
    return vec4(color, mul(tex1.a, uniforms.uProgress));
  })();
}
