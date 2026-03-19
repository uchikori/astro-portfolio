import { add, mix, mul, pow, sub, texture, vec2 } from "three/tsl";

//0〜1 の入力に対して、中央が最大になるカーブを作る関数
//（0で開始、0.5で頂点1.0、1で終了）をする放物線は、数学的にはy = 4x(1-x)という式で表現
function parabola(x, k) {
  return pow(mul(4.0, x, sub(1.0, x)), k);
}

export default function fragment(options) {
  const { vUv, uniforms } = options;

  // 歪み用テクスチャ
  const texDisp = texture(uniforms.uTexes.texDisp, vUv);

  // 歪み
  let disp = texDisp.r;
  // 歪みの値をuProgressの進行度に合わせて変化させる
  // Uprogress(0.0) -> disp(0.0), Uprogress(1.0) -> disp(1.0)
  disp = mul(disp, parabola(uniforms.uProgress, 1.0));

  // 歪みをUVのy座標のみに適用(disp分だけ上にずらす)
  const dispUvPlus = vec2(vUv.x, add(vUv.y, disp));
  // 歪みをUVのy座標のみに適用(disp分だけ下にずらす)
  const dispUvMinus = vec2(vUv.x, sub(vUv.y, disp));

  const texCurrent = texture(uniforms.uTexes.tex1, dispUvPlus);
  const texnNext = texture(uniforms.uTexes.tex2, dispUvMinus);

  const color = mix(texCurrent, texnNext, uniforms.uProgress);

  return color;
}
