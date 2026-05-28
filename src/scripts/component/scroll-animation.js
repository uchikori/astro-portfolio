import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INode } from "../helper/INode";
import { viewport } from "../helper/viewport";
import world from "../glsl/world";
import mouse from "./mouse";

gsap.registerPlugin(ScrollTrigger);

const ACTIONS = {
  progress,
  progressParticles,
  playVideo,
  playHTMLVideo,
  pin,
  blur,
  fade,
  header,
  reversal,
  ripple,
};

let startTrigger = null;

function registScrollAnimations() {
  // mobileかどうかでスタート位置を設定
  startTrigger = viewport.isMobile() ? "top 80%" : "top 70%";

  //data-scroll-trigger属性を持つ要素を取得
  const els = INode.qsAll("[data-scroll-trigger]");

  els.forEach((el) => {
    // data-scroll-trigger属性の値を取得
    const key = INode.getDS(el, "scrollTrigger");

    // カンマ区切りの値を配列にする
    const types = key.split(",");

    // 配列の値をループで処理
    types.forEach((type) => {
      // ACTIONSオブジェクトに同名のキーがあるか確認
      ACTIONS?.[type]?.(el); //あれば実行
    });
  });
}

/**
 * スクロールに応じて、0から1まで変化させる
 * @param {*} el - data-scroll-trigger属性を持つ要素
 */
function progress(el) {
  ScrollTrigger.create({
    trigger: el,
    start: startTrigger,
    onEnter() {
      const o = world.getObjByEl(el);
      if (!o) return;

      gsap.to(o.uniforms.uProgress, {
        value: 1,
      });
    },
    onLeaveBack() {
      const o = world.getObjByEl(el);
      if (!o) return;

      gsap.to(o.uniforms.uProgress, {
        value: 0,
      });
    },
  });
}

/**
 * スクロールに応じて、要素をピン留めする
 * data-scroll-trigger-target 属性でトリガー要素を指定できる
 * @param {*} el - data-scroll-trigger属性を持つ要素
 *
 */
function pin(el) {
  // data-scroll-trigger-target 属性からトリガー要素のセレクターを取得
  const triggerSelector = INode.getDS(el, "pinTrigger");
  // セレクターの指定があればその要素を取得、なければ親要素をデフォルトにする
  const triggerEl = triggerSelector ? INode.qs(triggerSelector) : el.parentNode;

  ScrollTrigger.create({
    trigger: triggerEl,
    start: "top top",
    end: "bottom top",
    pin: el,
    pinSpacing: false,
    markers: true,
  });
}

/**
 * スクロールに応じて要素をフェードアウト＆ブラー（ぼかし）させる
 * data-scroll-trigger-target 属性でトリガー要素を指定できる
 * @param {*} el - data-scroll-trigger属性を持つ要素
 */
function blur(el) {
  const triggerSelector = INode.getDS(el, "pinTrigger");
  const triggerEl = triggerSelector ? INode.qs(triggerSelector) : el.parentNode;

  gsap.to(el, {
    opacity: 0,
    filter: "blur(20px)",
    scrollTrigger: {
      trigger: triggerEl,
      start: "top top",
      end: "bottom top",
      scrub: true,
      markers: true,
    },
  });
}

/**
 * フェードイン/フェードアウト
 * @param {*} el
 */
function fade(el) {
  ScrollTrigger.create({
    trigger: el,
    start: startTrigger,
    onEnter() {
      el.classList.add("inview");
    },
    onLeaveBack() {
      el.classList.remove("inview");
    },
  });
}

/**
 *
 * @param {*} el
 */
function progressParticles(el) {
  ScrollTrigger.create({
    trigger: el,
    start: "center center",
    end: "center center",
    onEnter() {
      const o = world.getObjByEl(el);

      if (!o) return;

      o.goTo(1, 1);
    },
    onEnterBack() {
      const o = world.getObjByEl(el);

      if (!o) return;

      o.goTo(0, 1);
    },
  });
}

/**
 * 動画の再生
 * @param {*} el
 */
function playVideo(el) {
  const o = world.getObjByEl(el);

  if (!o) return;

  // videoのsourceを取得
  const video = o.uniforms.uTexes.tex1.source.data;
  ScrollTrigger.create({
    trigger: el,
    start: startTrigger,
    onEnter() {
      video.paused && video?.play();
    },
    onLeaveBack() {
      video.paused && video?.play();
    },
    onLeave() {
      video?.pause();
    },
    onEnterBack() {
      video?.pause();
    },
  });
}

/**
 * 通常のvideoタグをスクロール連動で再生/停止する
 * data-video-target があればそのセレクタを優先して使う
 * @param {*} el
 */
function playHTMLVideo(el) {
  // data-video-target 属性からvideoタグのセレクターを取得
  const videoSelector = INode.getDS(el, "videoTarget");
  // セレクターの指定があればその要素を取得、なければその要素自体をデフォルトにする
  const video =
    //
    (videoSelector && INode.qs(videoSelector)) ||
    (el instanceof HTMLVideoElement ? el : INode.qs("video", el));

  if (!video) return;

  ScrollTrigger.create({
    trigger: el,
    start: startTrigger,
    end: "bottom top",
    onEnter() {
      video.paused && video.play();
    },
    onLeave() {
      video.pause();
    },
    onEnterBack() {
      video.paused && video.play();
    },
    onLeaveBack() {
      video.pause();
    },
  });
}

/**
 * ヘッダーのアニメーション
 * @param {*} el
 */
function header(el) {
  ScrollTrigger.create({
    trigger: el,
    start: "bottom top",
    onLeave() {
      el.classList.add("inview");
    },
    onEnterBack() {
      el.classList.remove("inview");
    },
  });
}

/**
 * スクロールに応じて、0から1まで変化させる
 * @param {*} el - data-scroll-trigger属性を持つ要素
 */
function reversal(el) {
  gsap.set(":root", {
    "--c-text": "#DDDCDC",
    "--c-sec": "rgba(218,218,218,0.8)",
    "--c-main": "#fff",
    "--c-bg": "#110028",
  });
  ScrollTrigger.create({
    trigger: el,
    start: "top center",
    onEnter() {
      gsap.to(":root", {
        "--c-text": "#110028",
        "--c-sec": "rgba(218,218,218,0.8)",
        "--c-main": "#fff",
        "--c-bg": "#DDDCDC",
      });
    },
    onLeave() {
      gsap.to(":root", {
        "--c-text": "#DDDCDC",
        "--c-sec": "rgba(218,218,218,0.8)",
        "--c-main": "#fff",
        "--c-bg": "#110028",
      });
    },
    onEnterBack() {
      gsap.to(":root", {
        "--c-text": "#110028",
        "--c-sec": "rgba(218,218,218,0.8)",
        "--c-main": "#fff",
        "--c-bg": "#DDDCDC",
      });
    },
    onLeaveBack() {
      gsap.to(":root", {
        "--c-text": "#DDDCDC",
        "--c-sec": "rgba(218,218,218,0.8)",
        "--c-main": "#fff",
        "--c-bg": "#110028",
      });
    },
  });
}

/**
 * リプルパスの表示/非表示を切り替える
 * @param {*} el
 */
async function ripple(el) {
  //タッチデバイスでは実行しない
  if (viewport.isMobile()) return;

  //リプルパスを初期化(ポストプロセスエフェクト)
  const { initRipplePass } = await import("../glsl/ripple");
  const { addPass, removePass } = await initRipplePass(
    world,
    mouse,
    viewport,
  );

  ScrollTrigger.create({
    trigger: el,
    start: startTrigger,
    onEnter() {
      addPass();
    },
    onLeave() {
      removePass();
    },
    onEnterBack() {
      addPass();
    },
    onLeaveBack() {
      removePass();
    },
  });
}
export { registScrollAnimations };
