import {
  vec3,
  add,
  mul,
  positionLocal,
  sub,
  div,
  clamp,
  float,
  step,
  Fn,
  select,
  distance,
  vec2,
  PI,
} from "three/tsl";

import { utils } from "../../helper";

export default function vertex(opt) {
  return Fn(() => {
    const HALF_PI = mul(PI, 0.5);
    const { uniforms, vDelay, vUv } = opt;

    // ①uProgress - vDelayでは初期値にマイナス値になる頂点が発生する
    // ②初期値がマイナスにならないようclmapで最小値を0にする
    // ③このままだとuProgress完了時にPlaneの下の方の頂点は0のままなので、下の方の頂点も1になるようにする
    // ③uProgressを1.3倍し、vDelayを0.3倍する=> 1.3 - 0.3 = 1.0
    const t = clamp(
      sub(mul(uniforms.uProgress, 1.3), mul(vDelay, 0.3)),
      0.0,
      1.0,
    );
    const progress = utils.cubicInOut(t);

    const pos = positionLocal.toVar();
    // pos.z.assign(add(pos.z, 100.0));

    //回転
    const axis = vec3(1.0, 1.0, 1.0);
    const angle = mul(4.0, progress, HALF_PI);
    // const position = rotate3D(positionLocal, axis, angle);
    pos.assign(utils.rotate3D(pos, axis, angle));

    pos.z.assign(add(pos.z, mul(progress, 250.0)));
    // ローカル座標の vec3 を返す（NodeMaterial が適切に変換します）
    return pos;
  })();
}
