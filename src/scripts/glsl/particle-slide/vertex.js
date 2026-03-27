import { Fn, mul, positionLocal, add, sub } from "three/tsl";
import { utils } from "../../helper";

export default function Vertex(options) {
  return Fn(() => {
    const {
      vUv,
      aInstanceDelay,
      aInstancePlanePosition,
      vProgress,
      aInstanceUV,
    } = options;

    const speed = utils.exponentialOut(vProgress);
    const position = aInstancePlanePosition.toVar();

    // uv - 0.5 => x: -0.5 ~ 0.5 y -0.5 ~ 0.5
    // xyDirectionはxy座標ともに-1 ~ 1の範囲を取り得る
    const xyDirection = sub(aInstanceUV, 0.5).mul(2.0);

    position.z = mul(speed, aInstanceDelay);
    const xy = mul(xyDirection, position.z);
    position.xy = add(position.xy, xy);

    return position;
  })();
}
