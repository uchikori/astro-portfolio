import { Vector2 } from "three/webgpu";
import { viewport, INode } from "../helper";
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
};

function init() {
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

  // DOMオブジェクトにsvgプロパティとしてsvgタグを設定
  DOM.svg = _createCustomCursor();
  DOM.svg.style.mixBlendMode = initial.mixBlendeMode;
  // svg内の円要素を取得
  const circles = INode.qsAll("circle", DOM.svg);
  DOM.outerCircle = circles[0];
  DOM.innerCircle = circles[1];

  // グローバルコンテナを取得
  DOM.globalContainer = INode.getElement("#globalContainer");
  //グローバルコンテナにsvg要素を追加
  DOM.globalContainer.append(DOM.svg);

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
  _updateStyle();
  _updateValue();
}

// マウスイベントをバインド
function _bindEvents() {
  const globalContainer = INode.getElement("#globalContainer");
  globalContainer.addEventListener("pointermove", (event) => {
    _updatePosition(event);

    //登録されている全てのマウスアクションを実行
    mouseMoveActions.forEach((action) => action?.(mouse, event));
  });

  // data-mouse属性の要素のマウスイベントをループ処理
  DOM.transforms.forEach((el) => {
    const handlerType = INode.getDS(el, "mouse");
    const handler = handlers[handlerType];

    if (!handler) return;

    Object.entries(handler).forEach(([mouseType, action]) => {
      console.log(mouseType, action);
    });

    el.addEventListener("pointerenter", (event) => {
      const el = event.currentTarget;
      const scale = INode.getDS(el, "mouseScale");

      target.scale = Number(scale);
      target.fillOpacity = 1;
    });

    el.addEventListener("pointerleave", (event) => {
      const el = event.currentTarget;
      target.scale = mouse.initial.scale;
      target.fillOpacity = mouse.initial.fillOpacity;
    });
  });
}

// マウスアクションを追加
function addMouseMoveAction(callback) {
  mouseMoveActions.add(callback);
}

// マウスアクションを削除
function removeMouseMoveAction(callback) {
  mouseMoveActions.delete(callback);
}

export default mouse;
