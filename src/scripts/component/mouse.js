import { Vector2 } from "three/webgpu";
import { viewport, INode } from "../helper";

//現在位置
let current = {};
//移動先
const target = {};
//現在位置から移動先への移動ベクトル
const delta = {};
const initial = {};
const DOM = {};

// マウスアクションを登録するための空のセット
const mouseMoveActions = new Set();

const mouse = {
  current,
  target,
  delta,
  init,
  getClipPos,
  getMapPos,
  addMouseMoveAction,
  removeMouseMoveAction,
  tick: 0,
  render,
};

function init() {
  // マウスの初期設定
  const initial = {
    x: viewport.width / 2,
    y: viewport.height / 2,
    r: 40,
    fill: "#ffffff",
    fillOpacity: 0,
    strokeWidth: 1,
  };

  //
  Object.assign(current, initial);
  Object.assign(target, initial);
  Object.assign(delta, { x: 0, y: 0, scale: 1, fillOpacity: 0 });

  // DOMオブジェクトにsvgプロパティとしてsvgタグを設定
  DOM.svg = _createCustomCursor();
  // svg内の円要素を取得
  const circles = INode.qsAll("circle", DOM.svg);
  DOM.outerCircle = circles[0];
  DOM.innerCircle = circles[1];

  // グローバルコンテナを取得
  DOM.globalContainer = INode.getElement("#globalContainer");
  //グローバルコンテナにsvg要素を追加
  DOM.globalContainer.append(DOM.svg);

  _bindEvents();
}

function _updateValue() {
  delta.x = target.x - current.x;
  delta.y = target.y - current.y;

  current.x += delta.x * 0.2;
  current.y += delta.y * 0.2;
}

function _updateStyle() {
  DOM.outerCircle.setAttribute("cx", current.x);
  DOM.outerCircle.setAttribute("cy", current.y);
  DOM.innerCircle.setAttribute("cx", target.x);
  DOM.innerCircle.setAttribute("cy", target.y);
}

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
