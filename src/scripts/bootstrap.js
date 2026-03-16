import world from "./glsl/world";
import { viewport } from "./helper";
import scroller from "./component/scroller";
import mouse from "./component/mouse";
import loader from "./component/loader";

//WebGLオブジェクトを格納するためのオブジェクト
const canvas = document.getElementById("canvas");

export async function init() {
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

    // if (currentVal >= 1) {
    //   statusLabel.textContent = "Ready";
    //   statusLabel.classList.add("hl_isCompleted");

    //   setTimeout(() => {
    //     loading.classList.add("hl_isHidden");
    //   }, 500);
    // }

    console.log(progress, total);
  });
  await loader.loadAllAssets();

  // Worldを初期化
  await world.init(canvas, viewport);

  mouse.init();

  world.render();

  loader.letsBegin();
}
