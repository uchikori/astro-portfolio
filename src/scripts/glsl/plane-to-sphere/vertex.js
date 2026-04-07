import {
  mul,
  sub,
  clamp,
  Fn,
  mix,
  positionLocal,
  distance,
  vec2,
  add,
  vec3,
} from "three/tsl";

import { utils } from "../../helper";

const varying = {};

export default function Vertex(options) {
  return Fn(() => {
    const { vUv, uniforms, aSpherePosition, aSphereNormal } = options;

    const time = mul(uniforms.uTick, uniforms.uFreq);

    //中心からの距離で遅延時間を計算(中心から遠いほど遅れる)
    const delay = mul(distance(vUv, vec2(0.5)), uniforms.uDelay);
    //遅延時間を考慮したプログレスを計算
    // uProgress - delay だと最終的に1にならない頂点が出てしまう
    // uProgress * (1.0 + delay2) - delay で1以上になる
    const progress = sub(
      mul(uniforms.uProgress, add(1.0, uniforms.uDelay)),
      delay,
    );

    // 0.0 ~ 1.0 にクランプ
    const vProgress = clamp(progress, 0.0, 1.0);

    // Fragmentに渡すプログレス
    varying.vProgress = vProgress;

    // 球のスケール変換
    let sphere = mul(aSpherePosition, uniforms.uSphereScale).toVar();

    // ノイズ
    const noise = utils.noise3(
      vec3(
        mul(aSphereNormal.x, uniforms.uNoiseFreq),
        mul(aSphereNormal.y, uniforms.uNoiseFreq),
        mul(sub(aSphereNormal.z, time), uniforms.uNoiseFreq),
      ),
    );

    // 凹凸の陰影を表現するための計算
    const vSphereNormal = mul(
      aSphereNormal,
      add(1.0, mul(noise, uniforms.uNoiseLevel, 2.0)), // 倍率を上げて陰影を強調
    );

    // Fragmentに法線を渡す
    varying.vSphereNormal = vSphereNormal;

    // 変位量を大きく（300.0倍など）調整
    // sphere.assign(add(sphere, mul(sphere, noise, uniforms.uNoiseLevel)));
    const s = add(sphere, mul(aSphereNormal, noise, uniforms.uNoiseLevel, 80));

    // 平面
    const plane = positionLocal;

    const pos = mix(s, plane, vProgress);

    return pos;
  })();
}

export { varying };
