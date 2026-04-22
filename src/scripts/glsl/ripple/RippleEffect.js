import { add, Fn, mul, texture, uv } from "three/tsl";

export default function RippleEffect(scenePassColor) {
  return Fn(() => {
    const vUv = uv();
    const texRipple = rt.texture;

    const ripple = texture(texRipple, vUv);

    const rippleUv = add(vUv, mul(ripple.r, 0.1));

    const color = texture(scenePassColor, rippleUv);

    return color;
  })();
}
