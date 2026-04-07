import { mix, texture } from "three/tsl";
import { varying } from "./vertex";
import { utils } from "../../helper";
export default function fragment(options) {
  const { aInstanceUV, uniforms } = options;

  // アスペクト比を補正したUVを計算
  const correctedUv = utils.coverUv(aInstanceUV, uniforms.uResolution);

  const tex1 = texture(uniforms.texCurrent, correctedUv);
  const tex2 = texture(uniforms.texNext, correctedUv);

  const color = mix(tex1, tex2, uniforms.uProgress);

  return color;
}
