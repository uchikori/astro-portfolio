import { mix, mul, sub, step, add, texture, vec2, Fn } from "three/tsl";
import { utils } from "../../helper";

export default function fragment(options) {
  return Fn(() => {
    const { vUv, uniforms, noiseFn, maskFn, mixFn } = options;

    // 1) Noise (default uses noise2 with scaled UVs)
    const nBase = utils.noise2(
      vec2(
        // UV座標にノイズスケールを掛けて、ノイズの密度を調整する
        mul(vUv.x, uniforms.uNoiseScale.x),
        mul(vUv.y, uniforms.uNoiseScale.y),
      ),
    );

    //ノイズの範囲を0.0〜1.0に正規化
    const nBaseNormalize = sub(mul(nBase, 0.5), 0.5);
    //進捗を足す
    const nBaseProgress = add(nBaseNormalize, uniforms.uProgress);

    // 2) マスクの作成（どちらの画像を表示するかを決める 0.0〜1.0 の白黒画像）
    const mask =
      // デフォルトの挙動: ノイズを使って徐々に画像が浮き上がる「ディゾルブ」効果
      // 【ロジックの解説】
      // ① sub(nBase, 1.0): ノイズ(0〜1)から1を引くことで、全域を一旦マイナス(-1〜0)にする
      // ② add(..., uHover): そこに進捗(0〜1)を足す。進捗が増えるほど数値が 0 に近づいていく
      // ③ step(0.0, ...): 値が 0.0 を超えた瞬間に 1.0 を返す（＝画像が切り替わる）
      // これにより、ノイズの明るい部分から順番に次の画像へパッと切り替わるようなエフェクトになる
      step(0.0, nBaseProgress);

    // 3) Textures
    const c0 = texture(uniforms.uTexes.tex1, vUv);
    const c1 = texture(uniforms.uTexes.tex2, vUv);

    // 4) Mix (default: mix(c0, c1, mask))
    const mixed = mixFn
      ? mixFn({ c0, c1, mask, vUv, uProgress: uniforms.uProgress })
      : mix(c0, c1, mask);

    return mixed;
  })();
}
