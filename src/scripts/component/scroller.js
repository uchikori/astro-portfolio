import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INode } from "#/helper/INode";
import { utils } from "#/helper/utils";

const scroller = {
  init,
  scrolling: false,
};
//ScrollTrigger処理
function init(disableScrollSmoother = false) {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // ScrollSmootherの初期化（disableScrollSmootherがtrueの場合はスムーススクロールを無効化するが、ScrollSmoother自体は初期化する）
  return ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: disableScrollSmoother ? 0 : 1.5, // スムーススクロールの無効化
    effects: true, // data-speed属性を有効化
    smoothTouch: disableScrollSmoother ? false : 0.1, // モバイルでのスムーススクロールの無効化

    //
    onUpdate: (self) => {
      _onScroll();
    },
  });
}

//クラス名
const marker = "hl_disableHover";
//スクロール中にbodyに追加するクラス
const bodyClassList = document.body.classList;
//タイムアウトID
let timeoutId = null;

/**
 * スクロール中の処理
 */
function _onScroll() {
  ScrollTrigger.update();

  // タッチデバイスでなければスクロール中にクラスを追加してホバーを無効化する
  if (!utils.isTouchDevices) {
    _disableHover(50);
  }
}

/**
 * マウスカーソルの無効化
 */
function _disableHover(duration = 200) {
  //クラスが追加されていない場合
  if (!bodyClassList.contains(marker)) {
    // クラスを追加
    bodyClassList.add(marker);

    //スクロールフラグをtrueに
    scroller.scrolling = true;

    //以前のタイムアウトをクリア
    clearTimeout(timeoutId);
    //1秒後にクラスを削除
    timeoutId = setTimeout(() => {
      bodyClassList.remove(marker);
      scroller.scrolling = false;
    }, duration);
  }
}

export default scroller;
