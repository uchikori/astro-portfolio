import {
  Fn,
  vec2,
  vec3,
  vec4,
  float,
  floor,
  fract,
  dot,
  max,
  min,
  abs,
  mod,
  step,
  mul,
  add,
  sub,
  If,
  lessThan,
  pow,
  sin,
  cos,
  mat2,
  mat4,
  normalize,
  equal,
  div,
  greaterThan,
  equals,
  select,
} from "three/tsl";
import { Quaternion, Vector3, Vector4 } from "three/webgpu";

const utils = {
  backInOut,
  coverUv,
  cubicInOut,
  exponentialOut,
  getResolutionUniform,
  getDiagonalVertices,
  grayScale,
  hsl2rgb,
  lerp,
  curlNoise,
  noise2,
  noise3,
  printMat,
  rotate2D,
  rotate3D,
  parabora,
  pointTo,
};

/**
 * 線形補間
 * @param {*} a - 開始値
 * @param {*} b - 終了値
 * @param {*} n - 補間率
 * @returns
 */
function lerp(a, b, n, limit = 0.001) {
  let current = a * (1 - n) + b * n;
  //終了値との差がlimit以下の場合は終了値を代入
  if (Math.abs(b - current) < limit) current = b;
  return current;
}

/**
 *アスペクト比の違うDOMと画像の解像度を合わせる
 * @param {*} DOMRect - WebGLのHTML要素のサイズ
 * @param {*} originRect - 画像のサイズ
 */
function getResolutionUniform(DOMRect, originRect) {
  //DOMサイズを取得
  const { width: DOMWidth, height: DOMHeight } = DOMRect;
  const resolution = new Vector4(DOMWidth, DOMHeight, 1, 1);

  // 元画像が無い場合はDOMサイズをそのまま返す
  if (!originRect) return resolution;

  //元画像のサイズを取得
  const { width: originWidth, height: originHeight } = originRect;

  //元画像のアスペクト比を取得
  const mediaAspect = originWidth / originHeight;

  //DOMのアスペクト比を取得
  const DOMAspect = DOMWidth / DOMHeight;

  let xAspect, yAspect;

  //元画像の方が横に長い場合
  if (DOMAspect < mediaAspect) {
    xAspect = DOMAspect / mediaAspect;
    yAspect = 1;
  } else {
    //DOM要素の方が横に長い場合かアスペクト比が同一の場合;
    xAspect = 1;
    yAspect = mediaAspect / DOMAspect;
  }

  resolution.z = xAspect;
  resolution.w = yAspect;

  return resolution;
}

/**
 * 対角線上に頂点を詰めた配列を返す
 * @param {*} hSeg - 高さ方向のセグメント数
 * @param {*} wSeg - 幅方向のセグメント数
 * @param {*} getValue - 値を計算する関数
 * @param {*} defaultValue - デフォルト値
 */
function getDiagonalVertices(hSeg, wSeg, getValue, defaultValue) {
  const hSeg1 = hSeg + 1,
    wSeg1 = wSeg + 1;
  let arry = [],
    currentValue = defaultValue;
  for (let i = 0; i < hSeg1 + wSeg1 - 1; i++) {
    for (
      let j = Math.min(hSeg1, i + 1) - 1;
      j >= Math.max(0, i - wSeg1 + 1);
      j--
    ) {
      let currentIndex = j * wSeg1 + i - j;
      currentValue = getValue(currentValue, currentIndex);
      arry[currentIndex] = currentValue;
    }
  }
  return arry;
}

/**
 * 1次元配列を2次元配列に変換してコンソールに出力する
 * @param {*} targetMatrix - 1次元配列
 * @param {*} col - 列数
 * @param {*} label - ラベル
 */
function printMat(targetMatrix, col = 4, label = "") {
  const mat1D = targetMatrix?.elements ?? targetMatrix?.array ?? targetMatrix;
  console.log(mat1D);
  if ((!mat1D) instanceof Array) return;
  setTimeout(() => {
    // 非同期でマトリクスが更新されるため、非同期で実行
    let mat2D = mat1D.reduce((arry2D, v, i) => {
      if (i % col === 0) {
        arry2D.push([]);
      }
      const lastArry = arry2D[arry2D.length - 1];
      lastArry.push(v);
      return arry2D;
    }, []);
    console.log(
      `%c${label}`,
      "font-size: 1.3em; color: red; background-color: #e4e4e4;",
    );
    console.table(mat2D);
  });
}

/**
 * easing function
 * @param {*} t - 時間
 * @returns
 */
function backInOut(t) {
  return Fn(() => {
    const f = float(0).toVar();

    If(lessThan(t, 0.5), () => {
      f.assign(mul(2.0, t));
    }).Else(() => {
      f.assign(sub(1.0, sub(mul(2.0, t), 1.0)));
    });

    const g = float(0).toVar();

    const calcG = sub(
      mul(f, mul(f, f)),
      mul(f, sin(mul(3.141592653589793, f))),
    );

    If(lessThan(t, 0.5), () => {
      g.assign(mul(0.5, calcG));
    }).Else(() => {
      g.assign(add(mul(0.5, sub(1.0, calcG)), 0.5));
    });

    return g;
  })();
}

/**
 * easing function
 * @param {*} t - 時間
 * @returns
 */
function cubicInOut(t) {
  return Fn(() => {
    const value = float(0).toVar();
    const t2 = sub(mul(2.0, t), 2.0);
    If(lessThan(t, 0.5), () => {
      // value.assign(mul(4.0, mul(t, mul(t, t))));
      value.assign(mul(4.0, t, t, t));
    }).Else(() => {
      value.assign(add(mul(0.5, mul(t2, t2, t2)), 1.0));
    });
    return value;
  })();
}
// function cubicInOut(t) {
//   return Fn(() => {
//     // 共通で使用する (2t - 2) の部分
//     const t2 = sub(mul(2.0, t), 2.0);

//     return select(
//       lessThan(t, 0.5),
//       // 前半: 4.0 * t * t * t
//       mul(4.0, t, t, t),
//       // 後半: 0.5 * (2t - 2)^3 + 1.0
//       // pow を使わずに mul で 3乗を計算（負の数対策）
//       add(mul(0.5, mul(t2, t2, t2)), 1.0),
//     );
//   })();
// }

function exponentialOut(t) {
  return select(equal(t, 1.0), t, sub(1.0, pow(2.0, mul(-10.0, t))));
}

/**
 * 2次元回転行列を返す
 * @param {*} angle - 回転角
 * @returns
 */
function rotation2d(angle) {
  return Fn(() => {
    const s = sin(angle);
    const c = cos(angle);

    return mat2(c, mul(s, float(-1.0)), s, c);
  })();
}

/**
 * 3次元回転行列を返す
 * @param {*} axis - 回転軸
 * @param {*} angle - 回転角
 * @returns
 */
function rotation3d(axis, angle) {
  return Fn(() => {
    const normalizedAxis = normalize(axis);
    const s = sin(angle);
    const c = cos(angle);
    const oc = sub(1.0, c);

    const x = normalizedAxis.x;
    const y = normalizedAxis.y;
    const z = normalizedAxis.z;

    return mat4(
      add(mul(oc, x, x), c),
      sub(mul(oc, x, y), mul(z, s)),
      add(mul(oc, z, x), mul(y, s)),
      float(0),
      add(mul(oc, x, y), mul(z, s)),
      add(mul(oc, y, y), c),
      sub(mul(oc, y, z), mul(x, s)),
      float(0),
      sub(mul(oc, z, x), mul(y, s)),
      add(mul(oc, y, z), mul(x, s)),
      add(mul(oc, z, z), c),
      float(0),
      float(0),
      float(0),
      float(0),
      float(1),
    );
  })();
}

/**
 * 2次元回転
 * @param {*} v - 回転させるベクトル
 * @param {*} angle - 回転角
 * @returns
 */
function rotate2D(v, angle) {
  return Fn(() => {
    return rotation2d(angle).mul(v);
  })();
}

/**
 * 3次元回転
 * @param {*} v - 回転させるベクトル
 * @param {*} axis - 回転軸
 * @param {*} angle - 回転角
 * @returns
 */
function rotate3D(v, axis, angle) {
  return Fn(() => {
    return mul(rotation3d(axis, angle), vec4(v, float(1.0))).xyz;
  })();
}

// mod289 function - handles both vec3 and vec4
const mod289 = Fn(([x]) => {
  return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
});

// taylorInvSqrt function - fast inverse square root approximation
const taylorInvSqrt = Fn(([r]) => {
  return float(1.79284291400159).sub(mul(float(0.85373472095314), r));
});

// Permutation function (共通)
const permute = Fn(([x]) => mod289(x.mul(34).add(1).mul(x)));

/**
 * 2次元ノイズ (Simplex Noise 2D)
 * @param {vec2} v - 入力座標
 * @returns {float} -1.0 ~ 1.0 の値を返す
 */
function noise2(v) {
  return Fn(() => {
    const C = vec4(
      0.211324865405187, // (3.0-sqrt(3.0))/6.0
      0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
      -0.577350269189626, // -1.0 + 2.0 * C.x
      0.024390243902439, // 1.0 / 41.0
    );

    // First corner
    const i = floor(add(v, dot(v, C.yy))).toVar();
    const x0 = sub(v, sub(i, dot(i, C.xx))).toVar();

    // Other corners
    const i1 = select(greaterThan(x0.x, x0.y), vec2(1.0, 0.0), vec2(0.0, 1.0));

    const x12 = add(x0.xyxy, C.xxzz).toVar();
    x12.xy.subAssign(i1);

    // Permutations
    const i_mod = mod289(i);
    const p = permute(
      add(
        permute(add(i_mod.y, vec3(0.0, i1.y, 1.0))),
        add(i_mod.x, vec3(0.0, i1.x, 1.0)),
      ),
    );

    // Radial falloff: m = m^2 * m^2
    const m = max(
      sub(0.5, vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw))),
      0.0,
    ).toVar();
    m.assign(mul(m.mul(m), m.mul(m)));

    // Gradients
    const x = sub(mul(2.0, fract(mul(p, C.www))), 1.0);
    const h = sub(abs(x), 0.5);
    const ox = floor(add(x, 0.5));
    const a0 = sub(x, ox);

    // Normalise gradients
    m.mulAssign(
      sub(1.79284291400159, mul(0.85373472095314, add(mul(a0, a0), mul(h, h)))),
    );

    // Final noise value at P
    const g = vec3(
      add(mul(a0.x, x0.x), mul(h.x, x0.y)),
      add(mul(a0.yz, x12.xz), mul(h.yz, x12.yw)),
    );

    return mul(130.0, dot(m, g));
  })();
}

/**
 * 3次元ノイズ
 * @param {*} v - 3次元ベクトル
 * @returns
 */
function noise3(v) {
  return Fn(() => {
    // Constants
    const C = vec2(div(1.0, 6.0), div(1.0, 3.0));
    const D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    let i = floor(v.add(dot(v, C.yyy))).toVar();
    const x0 = v.sub(i).add(dot(i, C.xxx));

    // Other corners
    const g_step = step(x0.yzx, x0.xyz);
    const l = float(1).sub(g_step);
    const i1 = min(g_step.xyz, l.zxy);
    const i2 = max(g_step.xyz, l.zxy);

    const x1 = x0.sub(i1).add(C.xxx);
    const x2 = x0.sub(i2).add(C.yyy);
    const x3 = x0.sub(D.yyy);

    // Permutations
    i = mod289(i);

    const p = permute(
      permute(
        permute(vec4(i.z, i.z.add(i1.z), i.z.add(i2.z), i.z.add(1))).add(
          vec4(i.y, i.y.add(i1.y), i.y.add(i2.y), i.y.add(1)),
        ),
      ).add(vec4(i.x, i.x.add(i1.x), i.x.add(i2.x), i.x.add(1))),
    );

    // Gradients
    const n_ = float(0.142857142857);
    const ns = n_.mul(vec3(D.w, D.y, D.z)).sub(vec3(D.x, D.z, D.x));

    const j = p.sub(float(49).mul(floor(p.mul(ns.z).mul(ns.z))));

    const x_ = floor(j.mul(ns.z));
    const y_ = floor(j.sub(float(7).mul(x_)));

    const x = x_.mul(ns.x).add(ns.yyyy);
    const y = y_.mul(ns.x).add(ns.yyyy);
    const h = float(1).sub(abs(x)).sub(abs(y));

    const b0 = vec4(x.x, x.y, y.x, y.y);
    const b1 = vec4(x.z, x.w, y.z, y.w);

    const s0 = floor(b0).mul(2).add(1);
    const s1 = floor(b1).mul(2).add(1);
    // const sh = float(1).sub(step(h, vec4(0, 0, 0, 0)).mul(2));
    const sh = float(-1).mul(step(h, vec4(0, 0, 0, 0)));

    const a0 = vec4(b0.x, b0.z, b0.y, b0.w).add(
      vec4(s0.x, s0.z, s0.y, s0.w).mul(vec4(sh.x, sh.x, sh.y, sh.y)),
    );
    const a1 = vec4(b1.x, b1.z, b1.y, b1.w).add(
      vec4(s1.x, s1.z, s1.y, s1.w).mul(vec4(sh.z, sh.z, sh.w, sh.w)),
    );

    const p0 = vec3(a0.x, a0.y, h.x);
    const p1 = vec3(a0.z, a0.w, h.y);
    const p2 = vec3(a1.x, a1.y, h.z);
    const p3 = vec3(a1.z, a1.w, h.w);

    // Normalize gradients
    const norm_vec = vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
    const norm_factor = taylorInvSqrt(norm_vec);

    const p0_norm = p0.mul(norm_factor.x);
    const p1_norm = p1.mul(norm_factor.y);
    const p2_norm = p2.mul(norm_factor.z);
    const p3_norm = p3.mul(norm_factor.w);

    // Radial falloff
    const m = max(
      float(0.6).sub(vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
      0,
    );
    const m4 = m.mul(m).mul(m).mul(m);

    // Final noise value
    const n = dot(
      m4,
      vec4(
        dot(p0_norm, x0),
        dot(p1_norm, x1),
        dot(p2_norm, x2),
        dot(p3_norm, x3),
      ),
    );

    // Scale to [-1, 1] then remap to [0, 1]
    return float(42).mul(n);
  })();
}

/**
 * --- Curl Noise (Converted from curl-noise.glsl) ---
 * 元のGLSLの構造を維持した実装
 */

// mod289 (vec3/vec4 共通)
const _c_mod289 = Fn(([x]) => {
  return sub(x, mul(floor(mul(x, 1.0 / 289.0)), 289.0));
});

// permute
const _c_permute = Fn(([x]) => {
  return _c_mod289(mul(add(mul(x, 34.0), 1.0), x));
});

// taylorInvSqrt
const _c_taylorInvSqrt = Fn(([r]) => {
  return sub(1.79284291400159, mul(0.85373472095314, r));
});

// snoise (Simplex Noise 3D)
const _c_snoise = Fn(([v]) => {
  const C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  const i = floor(add(v, dot(v, C.yyy))).toVar();
  const x0 = add(sub(v, i), dot(i, C.xxx)).toVar();

  // Other corners
  const g = step(x0.yzx, x0.xyz).toVar();
  const l = sub(1.0, g).toVar();
  const i1 = min(g.xyz, l.zxy).toVar();
  const i2 = max(g.xyz, l.zxy).toVar();

  const x1 = add(sub(x0, i1), C.xxx).toVar();
  const x2 = add(sub(x0, i2), C.yyy).toVar();
  const x3 = sub(x0, D.yyy).toVar();

  // Permutations
  i.assign(_c_mod289(i));
  const p = _c_permute(
    add(
      _c_permute(
        add(
          _c_permute(add(i.z, vec4(0.0, i1.z, i2.z, 1.0))),
          add(i.y, vec4(0.0, i1.y, i2.y, 1.0)),
        ),
      ),
      add(i.x, vec4(0.0, i1.x, i2.x, 1.0)),
    ),
  ).toVar();

  // Gradients
  const n_ = float(0.142857142857); // 1.0/7.0
  const ns = sub(mul(n_, D.wyz), D.xzx).toVar();

  const j = sub(p, mul(49.0, floor(mul(p, mul(ns.z, ns.z))))).toVar();

  const x_ = floor(mul(j, ns.z)).toVar();
  const y_ = floor(sub(j, mul(7.0, x_))).toVar();

  const x = add(mul(x_, ns.x), ns.yyyy).toVar();
  const y = add(mul(y_, ns.x), ns.yyyy).toVar();
  const h = sub(sub(1.0, abs(x)), abs(y)).toVar();

  const b0 = vec4(x.xy, y.xy).toVar();
  const b1 = vec4(x.zw, y.zw).toVar();

  const s0 = add(mul(floor(b0), 2.0), 1.0).toVar();
  const s1 = add(mul(floor(b1), 2.0), 1.0).toVar();
  const sh = mul(-1.0, step(h, vec4(0.0))).toVar();

  const a0 = add(b0.xzyw, mul(s0.xzyw, sh.xxyy)).toVar();
  const a1 = add(b1.xzyw, mul(s1.xzyw, sh.zzww)).toVar();

  const p0 = vec3(a0.xy, h.x).toVar();
  const p1 = vec3(a0.zw, h.y).toVar();
  const p2 = vec3(a1.xy, h.z).toVar();
  const p3 = vec3(a1.zw, h.w).toVar();

  // Normalise gradients
  const norm = _c_taylorInvSqrt(
    vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)),
  ).toVar();
  p0.assign(mul(p0, norm.x));
  p1.assign(mul(p1, norm.y));
  p2.assign(mul(p2, norm.z));
  p3.assign(mul(p3, norm.w));

  // Mix final noise value
  const m = max(
    sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
    0.0,
  ).toVar();
  m.assign(mul(m, m));
  return mul(
    42.0,
    dot(mul(m, m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))),
  );
});

/**
 * curlNoise
 * @param {vec3} p - position
 * @returns {vec3}
 */
function curlNoise(p) {
  return Fn(() => {
    const e = float(0.1);

    const n1 = _c_snoise(vec3(p.x, add(p.y, e), p.z)).toVar();
    const n2 = _c_snoise(vec3(p.x, sub(p.y, e), p.z)).toVar();
    const n3 = _c_snoise(vec3(p.x, p.y, add(p.z, e))).toVar();
    const n4 = _c_snoise(vec3(p.x, p.y, sub(p.z, e))).toVar();
    const n5 = _c_snoise(vec3(add(p.x, e), p.y, p.z)).toVar();
    const n6 = _c_snoise(vec3(sub(p.x, e), p.y, p.z)).toVar();

    const x = add(sub(sub(n2, n1), n4), n3).toVar();
    const y = add(sub(sub(n4, n3), n6), n5).toVar();
    const z = add(sub(sub(n6, n5), n2), n1).toVar();

    const divisor = div(1.0, mul(2.0, e));
    return normalize(mul(vec3(x, y, z), divisor));
  })();
}

/**
 * グレースケール
 * @param {*} tex - テクスチャ
 * @returns
 */
function grayScale(tex) {
  return Fn(() => {
    const gray = vec3(0.299, 0.587, 0.114);
    const grayT = vec4(vec3(dot(tex.rbg, gray)), tex.a);
    return grayT;
  })();
}

/**
 * アスペクト比を合わせたUVを返す
 * @param {*} modUv - UV
 * @param {*} resolution - 解像度
 * @returns
 */
function coverUv(modUv, resolution) {
  return Fn(() => {
    return add(mul(sub(modUv, 0.5), resolution.zw), 0.5);
  })();
}

function hue2rgb(f1, f2, hue) {
  return Fn(() => {
    const customHue = hue.toVar();
    If(lessThan(customHue, 0.0), () => {
      customHue.assign(customHue.add(1.0));
    }).ElseIf(greaterThan(customHue, 1.0), () => {
      customHue.assign(customHue.sub(1.0));
    });

    const res = float(0).toVar();

    If(lessThan(mul(6.0, customHue), 1.0), () => {
      res.assign(add(f1, mul(sub(f2, f1), 6.0, customHue)));
    })
      .ElseIf(lessThan(mul(2.0, customHue), 1.0), () => {
        res.assign(f2);
      })
      .ElseIf(lessThan(mul(3.0, customHue), 2.0), () => {
        res.assign(
          add(f1, mul(sub(f2, f1), sub(div(2.0, 3.0), customHue), 6.0)),
        );
      })
      .Else(() => {
        res.assign(f1);
      });

    return res;
  })();
}

function hsl2rgb(hsl) {
  return Fn(() => {
    const rgb = vec3(0).toVar();
    const h = hsl.x;
    const s = hsl.y;
    const l = hsl.z;

    If(equal(s, 0.0), () => {
      rgb.assign(vec3(l, l, l));
    }).Else(() => {
      const f2 = float(0.0).toVar();

      If(lessThan(l, 0.5), () => {
        f2.assign(mul(l, add(1.0, s)));
      }).Else(() => {
        f2.assign(l.add(s).sub(mul(l, s)));
      });

      const f1 = l.mul(2.0).sub(f2);

      const r = hue2rgb(f1, f2, h.add(div(1.0, 3.0)));
      const g = hue2rgb(f1, f2, h);
      const b = hue2rgb(f1, f2, h.sub(div(1.0, 3.0)));

      rgb.assign(vec3(r, g, b));
    });

    return rgb;
  })();
}

/**
 * 放物線
 * @param {*} x
 * @param {*} k
 * @returns
 */
function parabora(x, k) {
  return Fn(() => {
    return pow(mul(4.0, mul(x, sub(1.0, x))), k);
  })();
}

/**
 * メッシュを指定方向に向ける関数
 * クォータニオンを使用して回転を計算
 * @param {Object} _mesh - 回転対象のメッシュ
 * @param {Object} originalDir - 元の方向ベクトル
 * @param {Object} targetDir - 目標方向ベクトル
 */
function pointTo(_mesh, originalDir, targetDir) {
  // 回転軸の計算
  const _originalDir = new Vector3(
    originalDir.x,
    originalDir.y,
    originalDir.z,
  ).normalize();
  // console.log(_originalDir);
  const _targetDir = new Vector3(
    targetDir.x,
    targetDir.y,
    targetDir.z,
  ).normalize();
  // console.log(_targetDir);

  // 2つのベクトルの外積を計算して回転軸を得る
  const dir = new Vector3().crossVectors(_originalDir, _targetDir).normalize();

  // 回転角の計算
  const dot = _originalDir.dot(_targetDir); //内積 |a||b|cosθより|a|と|b|がnormalize()により1なのでdot=cosθとなる
  const rad = Math.acos(dot); //回転させるべき角度 acos=>cosθ=xのときθを返す

  // クォータニオンの作成
  const q = new Quaternion();
  q.setFromAxisAngle(dir, rad);

  // メッシュを回転
  _mesh.rotation.setFromQuaternion(q);
}
export { utils };
