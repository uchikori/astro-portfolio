import {
  Fn,
  If,
  abs,
  add,
  clamp,
  div,
  dot,
  float,
  length,
  max,
  min,
  mix,
  mul,
  normalize,
  reflect,
  sin,
  smoothstep,
  sqrt,
  sub,
  texture,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { utils } from "../../helper";

function rotate(v, axis, angle) {
  return utils.rotate3D(v, axis, angle);
}

function smin(a, b, k) {
  const h = clamp(add(0.5, div(mul(sub(b, a), 0.5), k)), 0.0, 1.0);
  return sub(mix(b, a, h), mul(k, h, sub(1.0, h)));
}

function smax(a, b, k) {
  const h = clamp(sub(0.5, div(mul(sub(b, a), 0.5), k)), 0.0, 1.0);
  return add(mix(b, a, h), mul(k, h, sub(1.0, h)));
}

function smax_delta(a, b, k) {
  const h = clamp(sub(0.5, div(mul(sub(b, a), 0.5), k)), 0.0, 1.0);
  return add(mix(b, a, h), mul(k, h, sub(1.0, h)));
}

function ssub(a, b, k) {
  return smax(a, -b, k);
}

function getmatcap(eye, normal) {
  const reflected = reflect(eye, normal);
  const m = mul(2.8284271247461903, sqrt(add(reflected.z, 1.0)));

  return div(reflected.xy, m).add(0.5);
}

function sphereSDF(p, r) {
  return sub(length(p), r);
}

function boxSDF(p, b) {
  const q = sub(abs(p), b);

  return add(length(max(q, 0.0)), min(max(q.x, max(q.y, q.z)), 0.0));
}

function sdBoxFrame(_p, b, e) {
  const p = sub(abs(_p), b);
  const q = sub(abs(add(p, e)), e);

  return min(
    min(
      add(
        length(max(vec3(p.x, q.y, q.z), 0.0)),
        min(max(p.x, max(q.y, q.z)), 0.0),
      ),
      add(
        length(max(vec3(q.x, p.y, q.z), 0.0)),
        min(max(q.x, max(p.y, q.z)), 0.0),
      ),
    ),
    add(
      length(max(vec3(q.x, q.y, p.z), 0.0)),
      min(max(q.x, max(q.y, p.z)), 0.0),
    ),
  );
}

const octaSDF = Fn(([inputP, s]) => {
  const p = abs(inputP).toVar();
  const m = p.x.add(p.y).add(p.z).sub(s).toVar();
  const q = vec3(0.0).toVar();
  const result = float(0.0).toVar();

  If(mul(3.0, p.x).lessThan(m), () => {
    q.assign(p.xyz);
    const k = clamp(mul(0.5, add(sub(q.z, q.y), s)), 0.0, s);
    result.assign(length(vec3(q.x, add(sub(q.y, s), k), sub(q.z, k))));
  })
    .ElseIf(mul(3.0, p.y).lessThan(m), () => {
      q.assign(p.yzx);
      const k = clamp(mul(0.5, add(sub(q.z, q.y), s)), 0.0, s);
      result.assign(length(vec3(q.x, add(sub(q.y, s), k), sub(q.z, k))));
    })
    .ElseIf(mul(3.0, p.z).lessThan(m), () => {
      q.assign(p.zxy);
      const k = clamp(mul(0.5, add(sub(q.z, q.y), s)), 0.0, s);
      result.assign(length(vec3(q.x, add(sub(q.y, s), k), sub(q.z, k))));
    })
    .Else(() => {
      result.assign(m.mul(0.57735027));
    });

  return result;
});

function sceneSDF(p, uniforms) {
  const pRotated = rotate(p, vec3(1.0), div(uniforms.uTick, 200.0));
  const pAxisYRotated = rotate(
    pRotated,
    vec3(0.0, 1.0, 0.0),
    div(uniforms.uTick, 200.0),
  );

  const mouseOffset = mul(
    2.5,
    vec3(
      sub(
        mul(uniforms.uMouse, uniforms.uHover),
        mul(vec2(0.5), uniforms.uHover),
      ),
      0.0,
    ),
  );
  const sphereMouse = sphereSDF(sub(p, mouseOffset), 0.5);

  const octa = octaSDF(pAxisYRotated, 1.2);
  const box = sdBoxFrame(pAxisYRotated, vec3(0.6), 0.05);

  const mixVal = clamp(
    smoothstep(-0.3, 0.3, sin(mul(uniforms.uTick, 0.005))),
    0.0,
    1.0,
  );
  const mixed = mix(box, octa, mixVal);

  return smin(sphereMouse, mixed, 0.8);
}

function gradSDF(p, uniforms) {
  const eps = 0.001;

  return normalize(
    vec3(
      sub(
        sceneSDF(add(p, vec3(eps, 0.0, 0.0)), uniforms),
        sceneSDF(sub(p, vec3(eps, 0.0, 0.0)), uniforms),
      ),
      sub(
        sceneSDF(add(p, vec3(0.0, eps, 0.0)), uniforms),
        sceneSDF(sub(p, vec3(0.0, eps, 0.0)), uniforms),
      ),
      sub(
        sceneSDF(add(p, vec3(0.0, 0.0, eps)), uniforms),
        sceneSDF(sub(p, vec3(0.0, 0.0, eps)), uniforms),
      ),
    ),
  );
}

export default function Fragment(opt) {
  return Fn(() => {
    const { vUv, uniforms } = opt;

    const clipUv = utils.coverUv(vUv, uniforms.uResolution).toVar();
    clipUv.assign(sub(clipUv, 0.5).mul(2.0));

    const cPos = vec3(0.0, 0.0, 2.0);
    const lPos = vec3(2.0);
    const ray = normalize(vec3(clipUv, -1.0));
    const rPos = cPos.toVar();
    const color = vec3(0.0).toVar();
    const alpha = float(0.0).toVar();

    for (let i = 0; i < uniforms.uLoop.value; i++) {
      const hitDist = sceneSDF(rPos, uniforms).toVar();

      If(float(0.001).lessThan(hitDist), () => {
        rPos.assign(add(rPos, mul(hitDist, ray)));
      }).Else(() => {
        const ambient = 0.5;
        const sdfNormal = gradSDF(rPos, uniforms);
        const diff = mul(
          0.9,
          max(dot(normalize(sub(lPos, rPos)), sdfNormal), 0.0),
        );

        const matcapUv = getmatcap(ray, sdfNormal);
        const matcapColor = texture(uniforms.uTexes.tex1, matcapUv).rgb.toVar();

        matcapColor.assign(mul(matcapColor, add(ambient, diff)));
        color.assign(matcapColor);
        alpha.assign(uniforms.uProgress);
      });
    }

    return vec4(color, alpha);
  })();
}
