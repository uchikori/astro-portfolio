import {
  abs,
  add,
  clamp,
  cos,
  div,
  Fn,
  mod,
  mul,
  PI,
  positionLocal,
  pow,
  sin,
  sqrt,
  sub,
  vec2,
  vec3,
} from "three/tsl";
import { utils } from "../../helper";

const varying = {};

export default function Vertex(options) {
  return Fn(() => {
    const { vUv, uniforms } = options;
    const position = positionLocal.toVar();

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

    // mul(2.0, PI).div(uniforms.uSlideTotal) = 1スライドあたりのラジアン
    // sub(uniforms.uActiveSlideIdx, uniforms.uSlideIdx) = アクティブなスライドと自身のスライドとの距離
    const distFreq = mul(2.0, PI)
      .div(uniforms.uSlideTotal)
      .mul(sub(uniforms.uActiveSlideIdx, uniforms.uSlideIdx));

    // distFreqを0から2πの範囲に収める
    const distPhase = mod(distFreq, mul(2.0, PI));

    varying.vDistPhase = distPhase;

    // X軸のマイナス方向(画面の左側に向けて移動)
    position.x.assign(
      add(position.x, mul(sin(distFreq), uniforms.uParam.z, noise)),
    );
    // y軸のプラス方向（画面の上方向に向けて移動）
    position.y.assign(
      add(position.y, mul(sin(distFreq), uniforms.uParam.y, noise)),
    );

    position.x.assign(sub(position.x, mul(sin(distFreq), 600)));

    position.y.assign(add(position.y, mul(sin(distFreq), 100)));

    return position;
  })();
}

export { varying };
