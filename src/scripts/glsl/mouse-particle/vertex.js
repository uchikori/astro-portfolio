import {
  Fn,
  add,
  length,
  mul,
  normalize,
  smoothstep,
  sub,
  vec2,
  vec3,
} from "three/tsl";

// マウスとの距離や方向を計算するベース関数
function getMouseSpace(options) {
  const { uniforms, aInstancePlanePosition } = options;

  const planePos = aInstancePlanePosition;
  const planeSize = uniforms.uPlaneSize;
  const mouseUv = uniforms.uMouse;
  const mousePlane = vec2(
    mul(sub(mouseUv.x, 0.5), planeSize.x),
    mul(sub(mouseUv.y, 0.5), planeSize.y),
  );

  const awayFromMouse = sub(planePos.xy, mousePlane);
  const distPlane = length(awayFromMouse);
  const safeDirection = normalize(add(awayFromMouse, vec2(0.0001, 0.0001)));
  const holeRadiusPx = uniforms.uHoleRadius;

  return {
    distPlane,
    holeRadiusPx,
    safeDirection,
  };
}

// パーティクルの大きさを滑らかに変化させる関数
function getHoleScale(options) {
  return Fn(() => {
    const { uniforms } = options;
    const { distPlane, holeRadiusPx } = getMouseSpace(options);

    // Featherの値を使って、影響範囲を広めに取ります
    const influenceRadius = mul(holeRadiusPx, uniforms.uFeather, 0.2);

    // 中心(0.0)から影響範囲の端(1.0)までの滑らかなグラデーション
    const distRatio = smoothstep(0.0, influenceRadius, distPlane);

    // マウスに近いほど少し縮小させる（中心で最大0.5倍になるように設定）
    const scaleDown = mul(sub(1.0, distRatio), uniforms.uHover, 0.5);

    return sub(1.0, scaleDown);
  })();
}

// パーティクルの位置（逃げる動き）を計算するメイン関数
export default function Vertex(options) {
  return Fn(() => {
    const { uniforms, aInstancePlanePosition } = options;
    const { distPlane, holeRadiusPx, safeDirection } = getMouseSpace(options);

    // ふんわりとした影響範囲を計算
    const influenceRadius = mul(holeRadiusPx, uniforms.uFeather);

    // 中心から外側へのグラデーション (中心付近が0、外側が1)
    const distRatio = smoothstep(0.0, influenceRadius, distPlane);

    // 力を反転 (中心が1、外側が0) ＝ マウスを避ける力場
    const repulsion = sub(1.0, distRatio);

    // ★ポイント：repulsion を2乗して、より滑らかな（カーブの効いた）力の減衰を作る
    const smoothRepulsion = mul(repulsion, repulsion);

    // 押し出す強さを計算
    const strength = mul(uniforms.uStrength, smoothRepulsion, uniforms.uHover);

    // 少し上に持ち上げる力（ふんわり感を強調します）
    const lift = mul(smoothRepulsion, uniforms.uHover, 25.0);

    // 元の位置に、逃げる動きと持ち上がる動きを足して返す
    return add(
      aInstancePlanePosition,
      vec3(
        mul(safeDirection.x, strength),
        mul(safeDirection.y, strength),
        lift,
      ),
    );
  })();
}

export { getHoleScale };
