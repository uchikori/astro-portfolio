import world from "../glsl/world";

const viewport = {
  init,
};

const DOM = {};

// viewport.initが既に一度でも実行されたかどうか
let initialized = false;

function init(canvas, cameraZ = 2000, near = 1500, far = 4000) {
  let rect = canvas.getBoundingClientRect();

  DOM.canvas = canvas;

  //canvasの幅と高さをviewportに格納
  viewport.width = rect.width;
  viewport.height = rect.height;
  viewport.near = near;
  viewport.far = far;
  viewport.cameraZ = cameraZ;
  viewport.aspect = rect.width / rect.height;
  //fovを計算
  //arctan => 三角形の比率が分かっている場合にその比率から角度を求める逆関数
  //***cameraのz座標が変わっても視野角がそれに合わせて変わればメッシュの見え方は変わらない***
  viewport.rad = 2 * Math.atan(viewport.height / 2 / cameraZ);
  //radianを角度に変換
  viewport.fov = viewport.rad * (180 / Math.PI);

  viewport.devicePixelRatio = window.devicePixelRatio;

  // viewport.initの呼び出しが初回の場合
  if (!initialized) {
    //リサイズイベントをハ登録
    _bindResizeEvents();

    // 初期化済みフラグをtrueに
    initialized = true;
  }

  return viewport;
}

//viewportの更新
function update() {
  const { near, far, cameraZ } = viewport;
  viewport.init(DOM.canvas, cameraZ, near, far);
}

//リサイズイベント
function _bindResizeEvents() {
  let timerID = null;

  /**
   * まず1実行され前回のリサイズイベントをキャンセルする
   * 次にリサイズイベントを500ミリ秒後に実行する
   * 結果としてリサイズイベントはリサイズ後500ミリ秒で実行される
   */
  window.addEventListener("resize", () => {
    // 1:リサイズ処理をキャンセル
    clearTimeout(timerID);

    // 2:リサイズ処理を500ミリ秒後に実行
    timerID = setTimeout(() => {
      _onResize();
    }, 500);
  });
}

// 画面のリサイズ時
function _onResize() {
  // viewportの更新
  update();
  // 更新されたviewportを使ってメッシュの位置とサイズとカメラを更新
  world.adjustWorldPosition(viewport);
}
export { viewport };
