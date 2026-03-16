import { utils } from "../helper";
import mouse from "../component/mouse";
import {
  WebGPURenderer,
  Scene,
  PerspectiveCamera,
  Raycaster,
  Vector2,
  Clock,
} from "three/webgpu";
import loader from "../component/loader";
import RenderTargetManager from "../component/renderTargetManager";
import { Ob } from "./Ob";
import normal from "./normal";
import gray from "./gray";

//Worldオブジェクト
const world = {
  os: [],
  init,
  adjustWorldPosition,
  render,
  dispose,
  raycaster: new Raycaster(),
  pointer: new Vector2(),
  clock: new Clock(),
  renderTargetManager: null, // レンダーターゲットマネージャー
};

async function init(canvas, viewport) {
  //WebGPURenderer
  world.renderer = new WebGPURenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  world.renderer.setSize(viewport.width, viewport.height, false);
  world.renderer.setPixelRatio(viewport.devicePixelRatio);
  world.renderer.setClearColor(0x000000, 0);

  //WebGPURendererの初期化
  await world.renderer.init();

  // レンダーターゲットマネージャーを初期化
  world.renderTargetManager = new RenderTargetManager(world.renderer);

  //シーンを作成
  world.scene = new Scene();

  //カメラを作成
  world.camera = _setupPerspectiveCamera(viewport);

  //メッシュオブジェクトの初期化
  _initObjects(viewport);
}

//カメラの設定
function _setupPerspectiveCamera(viewport) {
  const { fov, aspect, near, far, cameraZ } = viewport;
  //カメラを作成
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = cameraZ;

  return camera;
}

//メッシュオブジェクトの初期化
async function _initObjects(viewport) {
  //WebGLのHTML要素を取得
  const els = document.querySelectorAll("[data-webgl]");

  const prms = [...els].map(async (el) => {
    //WebGLのHTML要素のタイプを取得
    const type = el.dataset.webgl;

    // Obの初期化メソッド
    let o = null;
    // data-webgl=の値によって読み込むシェーダー処理を分ける
    if (type === "gray") {
      o = await gray.init({ el, type });
    } else {
      o = await normal.init({ el, type });
    }
    // const o = await Ob.init({ el, type });

    world.scene.add(o.mesh);
    world.os.push(o);

    return o;
  });

  await Promise.all(prms);

  adjustWorldPosition(viewport);
}

//メッシュの位置とサイズとカメラ設定の変更
function adjustWorldPosition(viewport) {
  world.renderer.setSize(viewport.width, viewport.height, false);

  //メッシュの位置とサイズの変更
  world.os.forEach((o) => {
    o.resize();
  });

  //カメラ設定の変更
  updateCamera(viewport);
}

//カメラの更新
function updateCamera(viewport) {
  const { fov, aspect, near, far } = viewport;
  world.camera.fov = fov;
  world.camera.near = near;
  world.camera.far = far;
  world.camera.aspect = aspect;
  world.camera.updateProjectionMatrix();

  return world.camera;
}

//レイキャスティング
function raycast() {
  const clipPos = mouse.getClipPos();

  // Raycasterをカメラとマウスポインタの位置に基づいて更新します。
  world.raycaster.setFromCamera(clipPos, world.camera);

  // レイと交差したメッシュオブジェクトを配列として格納
  const intersects = world.raycaster.intersectObjects(world.scene.children);
  //交差したオブジェクトの最前面に存在するメッシュを取得
  const intersect = intersects[0];

  // os(すべてのオブジェクト)をループ処理
  world.os.forEach((o) => {
    // レンダーターゲットを使用しているオブジェクトはスキップ
    if (!o.options) return;

    // oからmeshとoptionsを分割代入
    const { mesh, options } = o;

    //optionsからuHoverとuMouseを分割代入
    const { uniforms } = options;

    const { uHover, uMouse } = uniforms;

    // 交差したメッシュオブジェクトとoのmeshが同一なら
    if (intersect?.object === mesh) {
      //uMouseのvalueに交差したオブジェクトのUV値を格納
      uMouse.value = intersect.uv;
      //終了値を1.0に設定
      uHover.__endValue = 1.0;
    } else {
      //終了値を0.0に設定
      uHover.__endValue = 0.0;
    }

    uHover.value = utils.lerp(uHover.value, uHover.__endValue, 0.1);
  });
}

function render() {
  requestAnimationFrame(render);

  const delta = world.clock.getDelta();

  // アニメーションの更新
  world.renderTargetManager.updateAnimations(delta);

  // レンダーターゲットの描画
  world.renderTargetManager.renderAll();

  // メインシーンの描画
  world.renderer.setRenderTarget(null);
  world.renderer.render(world.scene, world.camera);

  //レイキャスティング
  raycast();

  //スクロール処理
  for (let i = world.os.length - 1; i >= 0; i--) {
    const o = world.os[i];
    o.scroll();
    o.render();
  }

  // OrbitControlsの更新
  world.renderTargetManager.updateControls();
}

function dispose() {
  // レンダーターゲットマネージャーのクリーンアップ
  if (world.renderTargetManager) {
    world.renderTargetManager.dispose();
  }

  // 他のリソースのクリーンアップ
  world.os.length = 0;
}

export default world;
