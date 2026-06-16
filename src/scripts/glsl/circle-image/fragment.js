import {
  add,
  distance,
  float,
  Fn,
  mix,
  mul,
  smoothstep,
  step,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec4,
} from "three/tsl";
import { utils } from "#/helper/utils";
import { ColorManagement } from "three";
export default function Fragment(opt) {
  return Fn(() => {
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    const clipUv = utils.coverUv(vUv, uniforms.uResolution);
    const aspect = float(40.0 / 20.0);
    const center = vec2(mul(0.5, aspect), 0.5);

    const p = vec2(mul(vUv.x, aspect), vUv.y);
    const diff = sub(p, center);

    // 横長の楕円にするために x 方向の距離の変化を緩やかにする（0.6 を掛けることで横方向に引き伸ばします）
    const scaledDiff = vec2(mul(diff.x, 0.6), diff.y);
    const len = distance(scaledDiff, vec2(0.0));

    // 0.45 を上限とすることで、上下左右の端に到達する前に完全に透過（0.0）するようになります
    const circle = sub(1.0, smoothstep(0.2, 0.68, len));

    // 画像の端（四辺）で強制的に滑らかに透過させるためのマスク
    // 端から5% (0.05) の領域でなだらかに消えるようにします
    const edgeFadeX = smoothstep(0.0, 0.05, vUv.x).mul(
      sub(1.0, smoothstep(0.95, 1.0, vUv.x)),
    );
    const edgeFadeY = smoothstep(0.0, 0.05, vUv.y).mul(
      sub(1.0, smoothstep(0.95, 1.0, vUv.y)),
    );
    const edgeMask = mul(edgeFadeX, edgeFadeY);

    const tex1 = texture(uniforms.uTexes.tex1, clipUv);

    // 楕円マスクとエッジフェードマスクを掛け合わせる
    const color = mul(tex1, circle, edgeMask, 0.6);

    return color;
  })();
}
