import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INode } from "../helper/INode";

const scroller = {
  init,
  scrolling: false,
};
//ScrollTrigger処理
function init() {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // ScrollSmootherの初期化;
  return ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5, // 滑らかさ（0-3推奨）
    effects: true, // data-speed属性を有効化
    smoothTouch: 0.1, // モバイルでの滑らかさ

    //
    onUpdate: (self) => {
      _onScroll();
    },
  });

  const el = INode.getElement("[data-webgl]");
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

  //スクロール中にクラスを追加
  _disableHover(50);
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
