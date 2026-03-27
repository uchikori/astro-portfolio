import { Vector2 } from "three/webgpu";
import { viewport, INode } from "../helper";

const current = new Vector2();

const mouse = {
  current,
  init,
  getClipPos,
};

function init() {
  _bindEvents();
}

// マウスのオリジナル位置座標を更新
function _updatePosition(event) {
  // マウスの位置をクリップ座標の変換
  current.x = event.clientX;
  current.y = event.clientY;
}

// オリジナル位置座標からクリップ座標に変換
function getClipPos() {
  return {
    x: (current.x / viewport.width) * 2 - 1,
    y: -(current.y / viewport.height) * 2 + 1,
  };
}

// マウスイベントをバインド
function _bindEvents() {
  const globalContainer = INode.getElement("#globalContainer");
  globalContainer.addEventListener("pointermove", (event) => {
    _updatePosition(event);
  });
}

export default mouse;
