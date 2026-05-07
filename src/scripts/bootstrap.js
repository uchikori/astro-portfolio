import world from "./glsl/world";
import { viewport, gui, INode } from "./helper";
import scroller from "./component/scroller";
import mouse from "./component/mouse";
import loader from "./component/loader";
import gsap from "gsap";
import {
  mountNavBtnHandler,
  mountReflectBtnHandler,
  mountScrollHandler,
} from "./component/slide-hundler";
import { initRipplePass } from "./glsl/ripple";
import { initMouseParticles } from "./glsl/mouse-particles";
import menu from "./component/menu";
import "./component/scroll-animation";

window.debug = enableDebugMode(0);

// デバッグモード:1=有効,0=無効
function enableDebugMode(debug) {
  return debug && import.meta.env.DEV;
}

export async function init() {
  //WebGLオブジェクトを格納するためのオブジェクト
  const canvas = INode.getElement("#canvas");

  // デバッグモードの場合
  if (window.debug) {
    await gui.init();
  }

  if (navigator.gpu === undefined) {
    console.log("WebGPU is not available");
  } else {
    console.log("WebGPU is available");
  }

  //viewportを初期化
  viewport.init(canvas);

  //ScrollTriggerを初期化＆ScrollSmootherを受け取る
  const smoother = scroller.init();

  loader.init();

  // ローダーアニメーションの追加
  const loading = INode.getElement(".js_loader");
  const loaderPercent = INode.getElement(".js_countNum");
  const progressBar = INode.getElement(".js_progressBar");
  const statusLabel = INode.getElement(".js_statusLabel");
  loader.addProgressAction((progress, total) => {
    const currentVal = progress / total;

    // カウントの更新
    loaderPercent.innerHTML = Math.round(currentVal * 100);

    // プログレスバーの更新
    progressBar.style.width = `${currentVal * 100}%`;

    // ステータスラベルの更新
    if (currentVal > 0.95) {
      statusLabel.textContent = "Finalizing Data";
    } else if (currentVal > 0.5) {
      statusLabel.textContent = "Processing Assets";
    }
  });
  try {
    console.log("Starting asset loading...");
    await loader.loadAllAssets();
    console.log("Assets loaded successfully.");

    // Worldを初期化
    console.log("Initializing World...");
    await world.init(canvas, viewport);
    console.log("World initialized.");

    mountNavBtnHandler(
      ".bl_fv_slider",
      ".bl_fv .js_navBtn__prev",
      ".bl_fv .js_navBtn__next",
      ".bl_fv_shader",
    );

    mountReflectBtnHandler(
      ".bl_reflect_slider",
      ".bl_reflect .js_navBtn__prev",
      ".bl_reflect .js_navBtn__next",
      ".bl_reflect_ul",
    );

    // mountScrollHandler(".bl_reflect_slider", ".bl_reflect", ".bl_reflect_ul");

    mouse.init(false, true);

    viewport.addResizeAction(() => {
      world.adjustWorldPosition(viewport);

      mouse.resize();
    });

    // レンダリングループでの更新処理を追加
    world.addRenderAction(() => {
      mouse.render();
      world.raycast();
    });

    //リプルパスを初期化(ポストプロセスエフェクト)
    // await initRipplePass(world, mouse);

    //マウスパーティクルを初期化
    console.log("Initializing Mouse Particles...");
    await initMouseParticles(world, mouse);
    console.log("Mouse Particles initialized.");

    menu.init(world, smoother);

    world.render();

    console.log("All systems ready, starting letsBegin...");
    loader.letsBegin();
  } catch (error) {
    console.error("Initialization failed:", error);
    // 致命的なエラーでも最悪ローダーだけは消して中身を見せる（デバッグ用）
    loader.letsBegin();
  }

  setTimeout(() => {
    mouse.makeVisible();
  }, 1000);

  // setTimeout(() => {
  //   const o = world.getObjByEl('[data-webgl="twist-plane"]');
  //   gsap.to(o.uniforms.uProgress, {
  //     value: 1,
  //     duration: 1,
  //     ease: "power2.out",
  //     onComplete() {
  //       world.removeObj(o);
  //     },
  //   });
  // }, 3000);

  // デバッグモードの場合
  if (window.debug) {
    gui.add(world.addOrbitControlGUI);
    // guiにコールバック関数を登録
    gui.add((lilGUI) => {
      // world.osの各オブジェクトのdebugメソッドを呼び出す
      world.os.forEach((o) => {
        if (!o.debug) return;
        // data-webgl属性を取得
        const type = INode.getDS(o.DOM.el, "webgl");
        // typeをフォルダ名にしてdebugメソッドを呼び出す
        const folder = lilGUI.addFolder(type);
        folder.close();
        o.debug(folder);
      });
    });
  }
}
