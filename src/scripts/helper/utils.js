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
import { Vector4 } from "three/webgpu";

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
  noise2,
  printMat,
  rotate2D,
  rotate3D,
};

/**
 * 線形補間
 * @param {*} a - 開始値
 * @param {*} b - 終了値
 * @param {*} n - 補間率
 * @returns
 */
function lerp(a, b, n) {
  let current = a * (1 - n) + b * n;
  //終了値との差が0.001以下の場合は終了値を代入
  if (Math.abs(b - current) < 0.001) current = b;
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
 * 2次元ノイズ
 * @param {*} v - 2次元ベクトル
 * @returns
 */
function noise2(v) {
  // Constants
  const C = vec4(
    0.211324865405187, // (3-sqrt(3))/6
    0.366025403784439, // (sqrt(3)-1)/2
    -0.577350269189626, // -1+2*(3-sqrt(3))/6
    0.024390243902439, // 1/41
  );

  // First corner
  const i = floor(v.add(dot(v, vec2(C.y, C.y))));
  const x0 = v.sub(i).add(dot(i, vec2(C.x, C.x)));

  // Determine which simplex
  const i1x = step(x0.y, x0.x);
  const i1y = float(1).sub(i1x);

  // Offsets for other corners
  const x1 = x0.sub(vec2(i1x, i1y)).add(C.x);
  const x2 = x0.add(C.z);

  // Permutations
  const ii = mod(i, 289);
  const p = permute(
    permute(vec3(ii.y, ii.y.add(i1y), ii.y.add(1))).add(
      vec3(ii.x, ii.x.add(i1x), ii.x.add(1)),
    ),
  );

  // Radial falloff
  const m = max(float(0.5).sub(vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2))), 0);
  const m4 = m.mul(m).mul(m).mul(m);

  // Gradients
  const x_grad = fract(p.mul(C.w)).mul(2).sub(1);
  const h = abs(x_grad).sub(0.5);
  const ox = floor(x_grad.add(0.5));
  const a0 = x_grad.sub(ox);

  // Normalize gradients
  const m4_norm = m4.mul(
    float(1.79284291400159).sub(
      float(0.85373472095314).mul(a0.mul(a0).add(h.mul(h))),
    ),
  );

  // Gradient dot products
  const g = vec3(
    a0.x.mul(x0.x).add(h.x.mul(x0.y)),
    a0.y.mul(x1.x).add(h.y.mul(x1.y)),
    a0.z.mul(x2.x).add(h.z.mul(x2.y)),
  );

  // Scale to [-1, 1] then remap to [0, 1]
  return float(130).mul(dot(m4_norm, g)).mul(0.5).add(0.5);
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

export { utils };
