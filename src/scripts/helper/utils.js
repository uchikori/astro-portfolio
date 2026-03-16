import { Vector4 } from "three/webgpu";

const utils = {
  lerp,
  getResolutionUniform,
};

//線形補間
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

export { utils };
