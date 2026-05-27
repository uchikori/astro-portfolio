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
import { registScrollAnimations } from "./component/scroll-animation";
import { initDistortionPass } from "./glsl/distortion-text/pass";

window.debug = enableDebugMode(1);

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
  await loader.loadAllAssets();

  // Worldを初期化
  await world.init(canvas, viewport);

  addGUI();

  const pages = await import.meta.glob("./page/*.js", { eager: true });

  const loadPage = async (name) => {
    const module = await pages[`./page/${name}.js`]();

    module.default({
      world,
      mouse,
      menu,
      loader,
      viewport,
      scroller,
    });
  };

  await loadPage("home");

  mouse.init(false, true);

  viewport.addResizeAction(async () => {
    await world.adjustWorldPosition(viewport);

    mouse.resize();
  });

  // レンダリングループでの更新処理を追加
  world.addRenderAction(() => {
    mouse.render();
    world.raycast();
  });

  registScrollAnimations();

  // await initRipplePass(world, mouse);

  //マウスパーティクルを初期化
  // await initMouseParticles(world, mouse);

  menu.init(world, smoother);

  world.render();

  await loader.letsBegin();

  //ロード完了後のアクション
  mouse.makeVisible();
}

function addGUI() {
  // デバッグモードの場合
  if (window.debug) {
    gui.add(world.addOrbitControlGUI);
    // guiにコールバック関数を登録
    gui.add((lilGUI) => {
      lilGUI.close();
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
