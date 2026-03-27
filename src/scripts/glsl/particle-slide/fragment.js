import { mix, texture } from "three/tsl";

export default function fragment(options) {
  const { aInstanceUV, uniforms } = options;

  // アスペクト比を補正したUVを計算
  const correctedUv = aInstanceUV
    .sub(0.5)
    .mul(uniforms.uResolution.zw)
    .add(0.5);

  const tex1 = texture(uniforms.texCurrent, aInstanceUV);
  const tex2 = texture(uniforms.texNext, aInstanceUV);

  const color = mix(tex1, tex2, uniforms.uProgress);

  return color;
}
