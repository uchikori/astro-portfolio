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

  if (disableScrollSmoother) {
    // スマホ: ScrollSmootherを使わず、ネイティブスクロールで動作
    // ScrollTriggerのスクロールイベントで_onScrollを実行
    ScrollTrigger.addEventListener("scrollEnd", _onScroll);
    ScrollTrigger.addEventListener("scroll", _onScroll);

    // ScrollSmootherはwrapper/content構造の維持のために初期化するが、smoothingは完全に無効
    return ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 0,
      effects: true, // data-speed属性を有効化
      smoothTouch: false,
    });
  }

  // PC: ScrollSmootherのスムーススクロールを有効化
  return ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5,
    effects: true, // data-speed属性を有効化

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
  // ScrollTrigger.update();

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
