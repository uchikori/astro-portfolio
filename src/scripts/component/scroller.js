import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const scroller = {
  init,
};
//ScrollTrigger処理
function init() {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  // ScrollSmootherの初期化;
  ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5, // 滑らかさ（0-3推奨）
    effects: true, // data-speed属性を有効化
    smoothTouch: 0.1, // モバイルでの滑らかさ
  });

  const el = document.querySelector("[data-webgl]");

  // const meshX = os[0].mesh.position.x;
  // const animation = {
  //   rotation: 0,
  //   x: meshX,
  // };
  // gsap.to(animation, {
  //   rotation: Math.PI * 2,
  //   x: meshX + 600,
  //   scrollTrigger: {
  //     trigger: el,
  //     start: "center 80%",
  //     end: "center 20%",
  //     scrub: true,
  //     pin: true,
  //     markers: true,
  //   },
  //   onUpdate() {
  //     os[0].mesh.position.x = animation.x;
  //     os[0].mesh.rotation.z = animation.rotation;
  //   },
  // });

  /**
   * FVのビデオをスクロールで変化させる
   */
  // const video = document.querySelector(".hero_kv");
  // const videoContent = document.querySelector(".hero_kv video");
  // ScrollTrigger.create({
  //   trigger: ".hero",
  //   start: "top top",
  //   end: "bottom top",
  //   pin: video,
  //   pinSpacing: false,
  //   markers: true,
  // });

  // gsap.to(videoContent, {
  //   opacity: 0,
  //   filter: "blur(10px)",
  //   scrollTrigger: {
  //     trigger: ".hero",
  //     start: "top top",
  //     end: "bottom top",
  //     scrub: true, // スクロールに同期
  //     markers: true,
  //   },
  // });
}

export default scroller;
