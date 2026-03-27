import {
  Fn,
  vec2,
  vec3,
  float,
  sin,
  cos,
  mul,
  add,
  sub,
  pow,
  mix,
  abs,
  normalize,
  length,
  dot,
  max,
  exp,
  texture,
} from "three/tsl";
import { utils } from "../../helper";

export default function fragment(options) {
  const { vUv, uniforms } = options;

  return Fn(() => {
    // Speed up time
    const t = uniforms.uTick.mul(0.035);
    const mouse = uniforms.uMouse.toVar();
    const hover = uniforms.uHover.toVar();

    // Distort UV with mouse
    const uv = vUv.toVar();
    const towardMouse = sub(uv, mouse);
    const distToMouse = length(towardMouse);
    const mouseDistortion = mul(
      towardMouse,
      exp(distToMouse.mul(-5.0)).mul(hover).mul(0.5),
    );
    uv.assign(add(uv, mouseDistortion));

    // 1) Domain Warping with layered noise
    const n1 = utils.noise2(uv.mul(2.5).add(vec2(t.mul(0.15), t.mul(0.1))));
    const n2 = utils.noise2(uv.mul(5.0).sub(vec2(n1.mul(0.8), t.mul(0.3))));

    // Final noise value for color mapping - adding more contrast
    const finalNoise = mul(n2.add(n1.mul(0.4)), 0.8);

    // 2) Chromatic Aberration & Iridescent Palette
    const pal = Fn(([idx]) => {
      const p = idx.mul(6.28318);
      // Bright, high-contrast colors
      const r = cos(p).add(1.0).mul(0.5);
      const g = cos(p.add(2.0944)).add(1.0).mul(0.5);
      const b = cos(p.add(4.1888)).add(1.0).mul(0.5);
      return vec3(r, g, b);
    });

    // Dynamic chromatic aberration that increases with hover
    const chromaticOffset = add(0.015, hover.mul(0.05));
    const nR = utils.noise2(
      uv
        .add(vec2(chromaticOffset, 0.0))
        .mul(2.0)
        .add(vec2(t.mul(0.15))),
    );
    const nG = utils.noise2(uv.mul(2.0).add(vec2(t.mul(0.15))));
    const nB = utils.noise2(
      uv
        .sub(vec2(chromaticOffset, 0.0))
        .mul(2.0)
        .add(vec2(t.mul(0.15))),
    );

    const r = pal(nR.add(t.mul(0.2))).x;
    const g = pal(nG.add(t.mul(0.2))).y;
    const b = pal(nB.add(t.mul(0.2))).z;

    let color = vec3(r, g, b).toVar();

    // 3) Fake Lighting (Specular & Fresnel) & Texture Blending
    const eps = float(0.005);
    const nL_g = utils.noise2(uv.sub(vec2(eps, 0.0)).mul(6.0));
    const nR_g = utils.noise2(uv.add(vec2(eps, 0.0)).mul(6.0));
    const nD_g = utils.noise2(uv.sub(vec2(0.0, eps)).mul(6.0));
    const nU_g = utils.noise2(uv.add(vec2(0.0, eps)).mul(6.0));

    const normal = normalize(
      vec3(sub(nL_g, nR_g), sub(nD_g, nU_g), 0.15),
    ).toVar();

    const lightDir = normalize(vec3(1.0, 1.0, 0.8));
    const viewDir = vec3(0.0, 0.0, 1.0);
    const diffuse = max(dot(normal, lightDir), 0.0);

    const halfDir = normalize(add(lightDir, viewDir));
    const spec = pow(max(dot(normal, halfDir), 0.0), 48.0).mul(1.2);

    const fresnel = pow(sub(1.1, max(dot(normal, viewDir), 0.0)), 4.0);

    // Merge lighting
    color.assign(mix(color, vec3(1.0), spec));
    color.assign(add(color, fresnel.mul(0.5)));
    color.assign(add(color, diffuse.mul(0.1)));

    // 4) Background Texture interaction (Mix slightly for depth)
    const tex = texture(uniforms.uTexes.tex1, add(vUv, mul(normal.xy, 0.02)));
    color.assign(mix(color, tex.rgb, 0.15));

    // 5) Vignette & Glow
    const dist = length(sub(vUv, 0.5));
    const vignette = pow(sub(1.2, dist), 2.5);
    color.assign(mul(color, vignette));

    // Boost Saturation & Brightness
    color.assign(pow(color, 0.75));
    color.assign(mul(color, 1.25));

    return color;
  })();
}
