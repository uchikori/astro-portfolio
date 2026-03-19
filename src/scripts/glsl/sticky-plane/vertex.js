import { vec3, add, mul, positionLocal, sub, clamp } from "three/tsl";
import { utils } from "../../helper";

export default function vertex(opt) {
  const { vUv, uniforms, vDelay } = opt;
  // ①uProgress - vDelayでは初期値にマイナス値になる頂点が発生する
  // ②初期値がマイナスにならないようclmapで最小値を0にする
  // ③このままだとuProgress完了時にPlaneの下の方の頂点は0のままなので、下の方の頂点も1になるようにする
  // ③uProgressを1.3倍し、vDelayを0.3倍する=> 1.3 - 0.3 = 1.0
  const t = clamp(sub(mul(uniforms.uHover, 1.4), mul(vDelay, 0.3)), 0, 1);
  const progress = utils.backInOut(t);

  const z = add(positionLocal.z, mul(progress, 250));

  // ローカル座標の vec3 を返す（NodeMaterial が適切に変換します）
  return vec3(positionLocal.x, positionLocal.y, z);
}
