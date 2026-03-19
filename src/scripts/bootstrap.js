import world from "./glsl/world";
import { viewport, gui } from "./helper";
import scroller from "./component/scroller";
import mouse from "./component/mouse";
import loader from "./component/loader";

window.debug = enableDebugMode(1);

// デバッグモード:1=有効,0=無効
function enableDebugMode(debug) {
  return debug && import.meta.env.DEV;
}

export async function init() {
  //WebGLオブジェクトを格納するためのオブジェクト
  const canvas = document.getElementById("canvas");

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

  scroller.init();

  loader.init();

  // ローダーアニメーションの追加
  const loading = document.querySelector("#loader");
  const loaderPercent = document.querySelector("#js_countNum");
  const progressBar = document.querySelector("#js_progressBar");
  const statusLabel = document.querySelector("#js_statusLabel");
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

  mouse.init();

  world.render();

  loader.letsBegin();

  // デバッグモードの場合
  if (window.debug) {
    gui.add(world.addOrbitControlGUI);
    // guiにコールバック関数を登録
    gui.add((lilGUI) => {
      // world.osの各オブジェクトのdebugメソッドを呼び出す
      world.os.forEach((o) => {
        if (!o.debug) return;
        // data-webgl属性を取得
        const type = o.DOM.el.dataset.webgl;
        // typeをフォルダ名にしてdebugメソッドを呼び出す
        const folder = lilGUI.addFolder(type);
        folder.close();
        o.debug(folder);
      });
    });
  }
}
