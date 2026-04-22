import {
  abs,
  add,
  clamp,
  cos,
  div,
  Fn,
  mod,
  mul,
  positionLocal,
  pow,
  sqrt,
  sub,
  vec3,
} from "three/tsl";

const varying = {};

export default function Vertex(options) {
  return Fn(() => {
    const { vUv, uniforms } = options;
    const position = positionLocal.toVar();

    //activeSlideIdxを0からスライドの数-1の範囲に収める
    const activeSlideIdx = mod(uniforms.uActiveSlideIdx, uniforms.uSlideTotal);

    // アクティブになるスライドと自分自身がどれだけ離れているかを絶対値で計算
    const dist = abs(sub(activeSlideIdx, uniforms.uSlideIdx));

    //最も遠いスライドの距離
    const deepest = div(uniforms.uSlideTotal, 2.0);

    //beach: dist=>0, deepest=>2.5, distProgress=>1
    //slider_1: dist=>1, deepest=>2.5, distProgress=>0.6
    //slider_2: dist=>2, deepest=>2.5, distProgress=>0.2
    //slider_3: dist=>3, deepest=>2.5, distProgress=>0.2
    //slider_4: dist=>4, deepest=>2.5, distProgress=>0.6
    const distProgress = div(abs(sub(dist, deepest)), deepest).toVar();

    //fragment.jsに渡すためにvaryingに格納
    varying.vDistProgress = distProgress;

    //0.8以上は1、0.8以下は0
    const scaleProgress = clamp(
      sub(distProgress, uniforms.uDist).mul(5),
      0.0,
      1.0,
    );

    //fragment.jsに渡すためにvaryingに格納
    varying.vScaleProgress = scaleProgress;

    const scale = add(mul(0.2, scaleProgress), 0.9);
    position.assign(vec3(mul(position.xy, scale), position.z));

    //円柱の側面のZ座標の移動距離を計算
    const roundZ = sub(
      uniforms.uRadius,
      //円の半径(斜辺)からX座標(底辺)を引いてルートを計算
      sqrt(sub(pow(uniforms.uRadius, 2), pow(position.x, 2))),
    );

    position.z.assign(sub(position.z, roundZ));

    const y = add(position.y, mul(cos(mul(uniforms.uTick, 0.03)), 10));

    position.y.assign(y);

    return position;
  })();
}

export { varying };
