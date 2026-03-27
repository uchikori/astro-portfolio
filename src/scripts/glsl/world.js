import { utils, INode } from "../helper";
import mouse from "../component/mouse";
import {
  WebGPURenderer,
  Scene,
  PerspectiveCamera,
  Raycaster,
  Vector2,
  Clock,
  AxesHelper,
  LinearSRGBColorSpace,
} from "three/webgpu";
import RenderTargetManager from "../component/renderTargetManager";
import { Ob } from "./Ob";

//Worldオブジェクト
const world = {
  os: [],
  addOrbitControlGUI,
  init,
  adjustWorldPosition,
  render,
  dispose,
  addObj,
  removeObj,
  getObjByEl,
  raycaster: new Raycaster(),
  pointer: new Vector2(),
  clock: new Clock(),
  renderTargetManager: null, // レンダーターゲットマネージャー
  tick: 0,
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
  //sRGBからLinearに変換
  world.renderer.outputColorSpace = LinearSRGBColorSpace;

  //WebGPURendererの初期化
  await world.renderer.init();

  // レンダーターゲットマネージャーを初期化
  world.renderTargetManager = new RenderTargetManager(world.renderer);

  //シーンを作成
  world.scene = new Scene();

  //カメラを作成
  world.camera = _setupPerspectiveCamera(viewport);

  //メッシュオブジェクトの初期化
  await _initObjects(viewport);
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
  const els = INode.qsAll("[data-webgl]");

  const prms = [...els].map(async (el) => {
    //WebGLのHTML要素のタイプを取得
    const type = INode.getDS(el, "webgl");

    // Obの初期化メソッド
    return import(`./${type}/index.js`).then(({ default: Ob }) => {
      return Ob.init({ el, type });
    });
  });

  // Obの初期化の完了を待機して
  const _os = await Promise.all(prms); // prmsはelsと同一の順序の配列

  _os.forEach((o) => {
    if (!o.mesh) return;
    addObj(o);
  });

  adjustWorldPosition(viewport);

  // 初期化後の処理
  const afterPrms = world.os.map((o) => {
    return o.afterInit();
  });

  await Promise.all(afterPrms);
}

//メッシュオブジェクトの追加
function addObj(o) {
  world.scene.add(o.mesh);
  world.os.push(o);
}

//メッシュオブジェクトの削除
function removeObj(o, dispose = true) {
  world.scene.remove(o.mesh);
  // oがosの配列の何番目かを探す
  const idx = world.os.indexOf(o);
  // idxが-1でなければ（配列にoが存在すれば）
  if (idx !== -1) {
    // osの配列からoを削除
    world.os.splice(idx, 1);
  }

  // disposeがtrueの場合
  if (dispose) {
    // メッシュのジオメトリとマテリアルを破棄
    o.mesh.material.dispose();
    o.mesh.geometry.dispose();
  }
}

//DOM要素からオブジェクトを取得
function getObjByEl(selector) {
  if (selector instanceof Ob) {
    return selector;
  }
  const targetEl = INode.getElement(selector);

  // os配列からtargetElと一致するDOM要素を持つオブジェクトを探す
  const o = world.os.find((o) => {
    return o.DOM.el === targetEl;
  });

  return o;
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

    // if(!uniforms) continue;

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

  world.tick++;

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
    o.render(world.tick);
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

let axisHelper = null;
function addOrbitControlGUI(lilGUI) {
  //OrbitControlの有効化を切り替える
  const isActive = { value: false };

  //GUIの追加
  lilGUI
    .add(isActive, "value")
    .name("OrbitControl")
    .onChange(() => {
      //isActive.valueがtrueならOrbitControlを追加
      if (isActive.value) {
        axisHelper = new AxesHelper(1000);
        world.scene.add(axisHelper);
        _attachOrbitControl();
      } else {
        //isActive.valueがfalseならOrbitControlを削除
        world.scene.remove(axisHelper);
        axisHelper.dispose();
        _detachOrbitControl();
      }
    });
}

let orbitControl;

//OrbitControlの追加
function _attachOrbitControl() {
  import("three/examples/jsm/controls/OrbitControls.js").then(
    ({ OrbitControls }) => {
      //OrbitControlのインスタンス化
      orbitControl = new OrbitControls(world.camera, world.renderer.domElement);
      // canvasのz-indexを1に設定(-1のままだとマウスでドラッグできないため)
      world.renderer.domElement.style.zIndex = 1;
    },
  );
}
//OrbitControlの削除
function _detachOrbitControl() {
  orbitControl?.dispose();
  // canvasのz-indexを-1に設定(OrbitControlを無効化するため)
  world.renderer.domElement.style.zIndex = -1;
}

export default world;
