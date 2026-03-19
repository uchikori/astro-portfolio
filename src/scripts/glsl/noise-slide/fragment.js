import { mix, mul, sub, step, add, texture, vec2 } from "three/tsl";
import { utils } from "../../helper";

export default function fragment(options) {
  const { vUv, uniforms, noiseFn, maskFn, mixFn } = options;

  // 1) Noise (default uses noise2 with scaled UVs)
  const nBase = noiseFn
    ? // noiseFnが渡された場合は、noiseFnを返す
      noiseFn({
        vUv,
        uNoiseScale: uniforms.uNoiseScale,
        uTick: uniforms.uTick,
        uProgress: uniforms.uProgress,
      })
    : // noiseFnが渡されない場合は、utils.noise2を計算する
      utils.noise2(
        vec2(
          // UV座標にノイズスケールを掛けて、ノイズの密度を調整する
          mul(vUv.x, uniforms.uNoiseScale.x),
          mul(vUv.y, uniforms.uNoiseScale.y),
        ),
      );

  // 2) マスクの作成（どちらの画像を表示するかを決める 0.0〜1.0 の白黒画像）
  const mask = maskFn
    ? // 外部から maskFn が渡された場合はそのカスタム関数を使用
      maskFn({
        n: nBase,
        vUv,
        uNoiseScale: uniforms.uNoiseScale,
        uTick: uniforms.uTick,
        uProgress: uniforms.uProgress,
      })
    : // デフォルトの挙動: ノイズを使って徐々に画像が浮き上がる「ディゾルブ」効果
      // 【ロジックの解説】
      // ① sub(nBase, 1.0): ノイズ(0〜1)から1を引くことで、全域を一旦マイナス(-1〜0)にする
      // ② add(..., uHover): そこに進捗(0〜1)を足す。進捗が増えるほど数値が 0 に近づいていく
      // ③ step(0.0, ...): 値が 0.0 を超えた瞬間に 1.0 を返す（＝画像が切り替わる）
      // これにより、ノイズの明るい部分から順番に次の画像へパッと切り替わるようなエフェクトになる
      step(0.0, add(sub(nBase, 1.0), uniforms.uHover));

  // 3) Textures
  const c0 = texture(uniforms.uTexes.tex1, vUv);
  const c1 = texture(uniforms.uTexes.tex2, vUv);

  // 4) Mix (default: mix(c0, c1, mask))
  const mixed = mixFn
    ? mixFn({ c0, c1, mask, vUv, uProgress: uniforms.uProgress })
    : mix(c0, c1, mask);

  return mixed;
}
