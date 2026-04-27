import { length, mix, mul, smoothstep, sub, texture, vec4 } from "three/tsl";
import { utils } from "../../helper";

export default function Fragment(options) {
  const { aInstanceUV, uniforms } = options;

  const correctedUv = utils.coverUv(aInstanceUV, uniforms.uResolution);

  // UV空間での影響範囲を計算（ピクセルではなく画面の割合で計算）
  const holeRadiusUv = uniforms.uHoleRadius.div(uniforms.uPlaneSize.x);
  const influenceRadiusUv = holeRadiusUv.mul(uniforms.uFeather);
  const mouseDist = length(sub(aInstanceUV, uniforms.uMouse));

  // 滑らかなグラデーションマスク (中心が0、外側が1)
  const distRatio = smoothstep(0.0, influenceRadiusUv, mouseDist);

  const color = texture(uniforms.uTexes.tex1, correctedUv);

  // 中心に近いほど透明になるグラデーション
  // 完全に透明にはせず、一番近いところで 0.2 程度残すことで自然に見せます
  const alphaMask = mix(1.0, mix(0.2, 1.0, distRatio), uniforms.uHover);

  const finalAlpha = mul(color.a, alphaMask, uniforms.uHover);

  return vec4(color.rgb, finalAlpha);
}
