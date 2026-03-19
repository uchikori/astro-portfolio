import { texture, vec4 } from "three/tsl";

export default function fragment(opt) {
  const { vUv, vDelay, uniforms } = opt;

  const color = texture(uniforms.uTexes.tex1, vUv);

  // const color = vec4(vDelay, 0.0, 0.0, 1.0);

  return color;
}
