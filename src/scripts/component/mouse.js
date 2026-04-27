import { Vector2 } from "three/webgpu";
import { viewport, INode, utils } from "../helper";
import { handlers } from "./mouse-animation";

//現在位置
let current = {};
//移動先
const target = {};
//現在位置から移動先への移動ベクトル
const delta = {};
const initial = {};
const DOM = {};

const distortion = { level: 500, max: 0.4 };

// マウスアクションを登録するための空のセット
const mouseMoveActions = new Set();

const mouse = {
  DOM,
  current,
  target,
  delta,
  init,
  initial,
  getClipPos,
  getMapPos,
  addMouseMoveAction,
  removeMouseMoveAction,
  tick: 0,
  render,
  speed: 0.2,
  shouldTrackMousePos: true,
  setTarget,
  startTrackMousePos,
  stopTrackMousePos,
  makeVisible,
  isUpdate,
  resize,
};

function init(hideDefaultCursor = false, applyStyle = true) {
  // マウスの初期設定
  const initial = (mouse.initial = {
    x: viewport.width / 2,
    y: viewport.height / 2,
    r: 40,
    fill: "#ffffff",
    fillOpacity: 0,
    strokeWidth: 1,
    scale: 1,
    mixBlendeMode: "difference",
  });

  //
  Object.assign(current, initial);
  Object.assign(target, initial);
  Object.assign(delta, { x: 0, y: 0, scale: 1, fillOpacity: 0 });

  // タッチデバイスの場合はデフォルトカーソルを表示
  mouse.hideDefaultCursor = utils.isTouchDevices ? false : hideDefaultCursor;
  // タッチデバイスの場合はスタイルを適用しない
  mouse.applyStyle = utils.isTouchDevices ? false : applyStyle;

  // DOMオブジェクトにsvgプロパティとしてsvgタグを設定
  DOM.svg = _createCustomCursor();
  DOM.svg.style.mixBlendMode = initial.mixBlendeMode;
  // svg内の円要素を取得
  const circles = INode.qsAll("circle", DOM.svg);
  DOM.outerCircle = circles[0];
  DOM.innerCircle = circles[1];

  // グローバルコンテナを取得
  DOM.globalContainer = INode.getElement("#globalContainer");

  // タッチデバイスじゃない場合のみ、スタイルを適用
  if (mouse.applyStyle) {
    //グローバルコンテナにsvg要素を追加
    DOM.globalContainer.append(DOM.svg);
  }

  // タッチデバイスじゃない場合のみ、デフォルトカーソルを非表示
  if (mouse.hideDefaultCursor) {
    document.body.style.cursor = "none";
  }

  // マウスを適用するDOM要素を取得
  DOM.transforms = INode.qsAll("[data-mouse]");

  _bindEvents();
}

/**
 * マウスの現在位置を更新する
 */
function _updateValue() {
  //現在位置から移動先への移動ベクトル
  delta.x = target.x - current.x;
  delta.y = target.y - current.y;
  //現在位置から移動先への拡大縮小ベクトル
  delta.scale = target.scale - current.scale;
  //現在位置から移動先への塗りつぶし濃度のベクトル
  delta.fillOpacity = target.fillOpacity - current.fillOpacity;

  //現在位置に移動先への移動ベクトルを足して移動させる
  current.x += delta.x * mouse.speed;
  current.y += delta.y * mouse.speed;
  //現在位置に移動先への拡大縮小ベクトルを足して移動させる
  current.scale += delta.scale * mouse.speed;
  //現在位置に移動先への塗りつぶし濃度のベクトルを足して移動させる
  current.fillOpacity += delta.fillOpacity * mouse.speed;

  // マウスの移動量を計算して値を小さくする
  let distort =
    Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2)) / distortion.level;
  distort = Math.min(distort, distortion.max);

  // X方向に大きく、y方向に小さくする（横長楕円形）
  current.scaleX = (1 + distort) * current.scale;
  current.scaleY = (1 - distort) * current.scale;

  // マウスの移動方向をラジアンで取得し、角度に変換
  current.rotate = (Math.atan2(delta.y, delta.x) / Math.PI) * 180;
}

/**
 * マウスのスタイルを更新する
 */
function _updateStyle() {
  if (!isUpdate()) return;
  DOM.innerCircle.setAttribute("cx", target.x);
  DOM.innerCircle.setAttribute("cy", target.y);
  DOM.outerCircle.setAttribute("cx", current.x);
  DOM.outerCircle.setAttribute("cy", current.y);
  DOM.outerCircle.setAttribute("fill-opacity", current.fillOpacity);

  // transform-originを円の中心に設定
  DOM.outerCircle.style.transformOrigin = `${current.x}px ${current.y}px`;

  // 回転の適用
  const rotate = `rotate(${current.rotate}deg)`;
  // 拡大縮小の適用
  const scale = `scale(${current.scaleX}, ${current.scaleY})`;
  // 回転と拡大縮小を適用
  DOM.outerCircle.style.transform = rotate + " " + scale;
}

/**
 * カスタムカーソルの要素を作成する
 * @returns {HTMLElement} カスタムカーソル要素
 */
function _createCustomCursor() {
  return INode.htmlToEl(` 
    <svg
        class="el_mousePointer"
        width="${viewport.width}"
        height="${viewport.height}"
        preserveAspectRatio="none meet"
        viewBox="0 0 ${viewport.width} ${viewport.height}"
      >
        <g class="el_mousePointer_wrapper">
          <circle
            class="el_mousePointer_outer"
            r="${current.r}"
            cx="${current.x}"
            cy="${current.y}"
            fill="${current.fill}"
            fill-opacity="${current.fillOpacity}"
            stroke="${current.fill}"
            stroke-width="${current.strokeWidth}"
            style="transform-origin:${current.x}px ${current.y}px"
          ></circle>
          <circle
            class="el_mousePointer_inner"
            r="3"
            cx="${current.x}"
            cy="${current.y}"
            fill="${current.fill}"
            style="transform-origin:${current.x}px ${current.y}px"
          ></circle>
        </g>
      </svg>`);
}

// マウスのオリジナル位置座標を更新
function _updatePosition(event) {
  // マウスの位置をクリップ座標の変換
  target.x = event.clientX;
  target.y = event.clientY;

  mouse.tick++;
}

// オリジナル位置座標からクリップ座標に変換
// -1 ~ 1
function getClipPos() {
  return {
    x: (current.x / viewport.width) * 2 - 1,
    y: -(current.y / viewport.height) * 2 + 1,
  };
}

// オリジナル位置座標からマップ座標に変換
// 0 ~ width, 0 ~ height
function getMapPos(width, height) {
  const clipPos = getClipPos();

  return {
    x: clipPos.x * width * 0.5, // -width * 0.5 ~ width * 0.5
    y: clipPos.y * height * 0.5, // -height * 0.5 ~ height * 0.5
  };
}

function render() {
  if (utils.isTouchDevices) return;
  _updateStyle();

  if (!mouse.applyStyle) return;
  _updateValue();
}

// マウスイベントをバインド
function _bindEvents() {
  const globalContainer = INode.getElement("#globalContainer");

  globalContainer.addEventListener("pointermove", (event) => {
    //登録されている全てのマウスアクションを実行
    mouseMoveActions.forEach((action) => action?.(mouse, event));

    if (mouse.shouldTrackMousePos) {
      _updatePosition(event);
    }
  });

  // data-mouse属性の要素のマウスイベントをループ処理
  DOM.transforms.forEach((el) => {
    const handlerType = INode.getDS(el, "mouse");
    const handler = handlers[handlerType];

    if (!handler) return;

    Object.entries(handler).forEach(([mouseType, action]) => {
      el.addEventListener(`pointer${mouseType}`, (event) => {
        action(mouse, event);
      });
    });
  });
}

/**
 * @desc マウスターゲットの位置座標を設定
 * @param {Object} newTarget - 新しいターゲットのプロパティ
 */
function setTarget(newTarget) {
  Object.assign(target, newTarget);
}

// マウスアクションを追加
function addMouseMoveAction(callback) {
  mouseMoveActions.add(callback);
}

// マウスアクションを削除
function removeMouseMoveAction(callback) {
  mouseMoveActions.delete(callback);
}

// マウスの追従を開始
function startTrackMousePos() {
  mouse.shouldTrackMousePos = true;
}

// マウスの追従を停止
function stopTrackMousePos() {
  mouse.shouldTrackMousePos = false;
}

function resize() {
  // スタイルが適用されている場合のみ、リサイズ処理を行う
  if (!mouse.applyStyle) return;

  // svg要素のサイズとビューポートを更新
  DOM.svg.setAttribute("width", viewport.width);
  DOM.svg.setAttribute("height", viewport.height);
  DOM.svg.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
}

// 2023/11 currentとtargetの値の差が0.0001以上の場合trueを返すように修正
function isUpdate() {
  return (
    Math.abs(current.x - target.x) > 1e-4 ||
    Math.abs(current.y - target.y) > 1e-4
  );
}

/**
 * アニメーション
 * @desc マウスを徐々に表示
 */
function makeVisible() {
  const interval = setInterval(() => {
    //スタイルが適用されていない場合はアニメーションを終了
    if (!mouse.applyStyle) return clearInterval(interval);
    //アップデートされていない場合はアニメーションを終了
    if (!isUpdate()) return;
    // svg要素の不透明度を1にする
    DOM.svg.style.opacity = 1;
    // インターバルを終了
    clearInterval(interval);
  }, 200);
}

export default mouse;
