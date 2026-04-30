import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INode } from "../helper";

const scroller = {
  init,
};
//ScrollTrigger処理
function init() {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "bottom top",
    pin: "#canvas",
    pinSpacing: false,
    markers: true,
  });

  /**
   * FVのビデオをスクロールで変化させる
   */
  const video = INode.getElement(".hero");
  const videoContent = INode.getElement("#js-kv-video");

  if (video || videoContent) {
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      pin: videoContent,
      pinSpacing: false,
      markers: true,
    });
    gsap.to(videoContent, {
      opacity: 0,
      filter: "blur(20px)",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true, // スクロールに同期
        markers: true,
      },
    });
  }

  // ScrollSmootherの初期化;
  return ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.5, // 滑らかさ（0-3推奨）
    effects: true, // data-speed属性を有効化
    smoothTouch: 0.1, // モバイルでの滑らかさ
  });

  const el = INode.getElement("[data-webgl]");

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
}

export default scroller;
