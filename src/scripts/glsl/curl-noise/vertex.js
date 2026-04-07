import { Fn, mul, positionLocal, add, sub, abs, vec3 } from "three/tsl";
import { utils } from "../../helper";

const varying = {};
export default function Vertex(options) {
  return Fn(() => {
    const {
      vUv,
      uniforms,
      aInstanceDelay,
      aInstancePlanePosition,
      aInstanceUV,
    } = options;

    //時間
    const time = mul(uniforms.uTick, uniforms.uSpeed);

    //元の頂点位置
    const p = aInstancePlanePosition;

    const progress = utils.parabora(uniforms.uProgress, 0.5);

    const expand = vec3(
      mul(p.x, uniforms.uExpand.x),
      mul(p.y, uniforms.uExpand.y),
      1,
    );

    //ノイズの計算
    const x = add(mul(p.x, uniforms.uCnoise.x), mul(time, 0.05));
    const y = add(mul(p.y, uniforms.uCnoise.y), mul(time, 0.05));
    const z = mul(add(p.x, p.y), uniforms.uCnoise.z);
    const noise = utils.curlNoise(vec3(x, y, z));

    //ノイズを元の頂点位置に加算
    const position = add(p, mul(noise, expand, progress));

    return position;
  })();
}

export { varying };
