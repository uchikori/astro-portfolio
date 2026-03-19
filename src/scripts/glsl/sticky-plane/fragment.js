import { texture } from "three/tsl";

export default function fragment(opt) {
  const { vUv, vDelay, uniforms } = opt;

  const tex1 = texture(uniforms.uTexes.tex1, vUv);

  const color = tex1;

  return color;
}
