import { utils } from "../helper/utils";
import { INode } from "../helper/INode";
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
  PostProcessing,
} from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import RenderTargetManager from "../component/renderTargetManager";
import { Ob } from "./Ob";
import { pass } from "three/tsl";
import gsap from "gsap";

//Worldオブジェクト
const world = {
  os: [],
  addOrbitControlGUI,
  init,
  adjustWorldPosition,
  render,
  raycast,
  dispose,
  addObj,
  removeObj,
  getObjByEl,
  raycaster: new Raycaster(),
  pointer: new Vector2(),
  clock: new Clock(),
  renderTargetManager: null, // レンダーターゲットマネージャー
  tick: 0,
  _effectFns: [], // エフェクト関数のリスト
  _updateFns: [], // 毎フレーム更新する関数のリスト
  addPass,
  removePass,
  updatePostProcessing,
  renderActions: new Set(),
  addRenderAction,
  removeRenderAction,
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

  // ポストプロセスの初期化
  world.postProcessing = new PostProcessing(world.renderer);
  const scenePass = pass(world.scene, world.camera);
  world.scenePassColor = scenePass.getTextureNode("output");

  //初期状態の出力ノードを設定（エフェクトが0個でも本来のシーンが描画されるようにする）
  updatePostProcessing();

  // メッシュオブジェクトの初期化
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

  // // eager: true を指定してビルド時にモジュールをすべて読み込んでおく（本番環境でのハングアップ防止）
  const modules = import.meta.glob("./{*/index.js,*/index.ts}", {
    eager: true,
  });

  // // 各要素の初期化を並列実行
  const prms = els.map(async (el) => {
    const type = INode.getDS(el, "webgl");
    const module = modules[`./${type}/index.js`];

    try {
      const LoadedOb = module?.default;
      if (!LoadedOb) return null;

      return await LoadedOb.init({
        el,
        type,
        renderTargetManager: world.renderTargetManager,
        camera: world.camera,
      });
    } catch (err) {
      console.error(`[world] Failed to process type="${type}":`, err);
      return null;
    }
  });

  // --- 以下、これまでの試行錯誤の履歴（コメントアウト） --

  // Obの初期化メソッド
  // const prms = [...els].map((el) => {
  //   const type = INode.getDS(el, "webgl");
  //   return import(`./${type}/index.js`).then(({ default: Ob }) => {
  //     return Ob.init({
  //       el,
  //       type,
  //       renderTargetManager: world.renderTargetManager,
  //       camera: world.camera,
  //     });
  //   });
  // });

  const _os = await Promise.all(prms);

  _os.forEach((o) => {
    // もしoが存在せず、かつ、oにmeshが存在しなければ処理を終了
    if (!o || !o.mesh) return;
    addObj(o);
  });

  await adjustWorldPosition(viewport);

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
async function adjustWorldPosition(viewport) {
  world.renderer.setSize(viewport.width, viewport.height, false);

  //メッシュの位置とサイズの変更
  const pResize = world.os.map((o) => {
    return o.resize();
  });

  //カメラ設定の変更
  const pCamera = await updateCamera(viewport);

  await Promise.all([...pResize, pCamera]);
}

//カメラの更新
async function updateCamera(viewport) {
  const { fov, aspect, near, far } = viewport;

  return new Promise((resolve) => {
    gsap.to(world.camera, {
      fov,
      near,
      far,
      aspect,
      overwrite: true,
      onUpdate() {
        world.camera.updateProjectionMatrix();
      },
      onComplete() {
        resolve(world.camera);
      },
    });
  });

  // world.camera.fov = fov;
  // world.camera.near = near;
  // world.camera.far = far;
  // world.camera.aspect = aspect;
  // world.camera.updateProjectionMatrix();
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

/**
 * requestAnimationFrameを繰り返し呼び出す関数
 */
function render() {
  requestAnimationFrame(render);

  world.tick++;

  // 経過時間を取得
  const delta = world.clock.getDelta();

  // アニメーションの更新
  world.renderTargetManager.updateAnimations(delta);

  // レンダーターゲットの描画
  world.renderTargetManager.renderAll();

  // レンダリングアクションを実行
  for (const fn of world.renderActions) {
    fn(world.renderer, world.tick, delta);
  }

  // メインシーンの描画
  world.renderer.setRenderTarget(null);
  // world.renderer.render(world.scene, world.camera);

  //ポストプロセスを適用して描画
  world.postProcessing.render();

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
  //OrbitControlのインスタンス化
  orbitControl = new OrbitControls(world.camera, world.renderer.domElement);
  // canvasのz-indexを100に設定(-1のままだとマウスでドラッグできないため)
  const el = world.renderer.domElement;
  el.style.zIndex = 100;

  //もし親要素がpin-spacerクラスを持っていたら
  if (el.parentElement && el.parentElement.classList.contains("pin-spacer")) {
    //親要素のz-indexを100に設定
    el.parentElement.style.zIndex = 100;
  }
}
//OrbitControlの削除
function _detachOrbitControl() {
  orbitControl?.dispose();
  // canvasのz-indexを-1に設定(OrbitControlを無効化するため)
  const el = world.renderer.domElement;
  el.style.zIndex = -1;
  //もし親要素がpin-spacerクラスを持っていたら
  if (el.parentElement && el.parentElement.classList.contains("pin-spacer")) {
    //親要素のz-indexを-1に設定
    el.parentElement.style.zIndex = -1;
  }
}

/**
 * ポストプロセスにエフェクト関数を追加
 * @param {*} effectFn
 * @returns
 */
function addPass(effectFn) {
  //関数以外ならエラー
  if (typeof effectFn !== "function") {
    console.error("addPass: effectFn must be a function");
    return;
  }
  //配列にエフェクト関数を追加
  world._effectFns.push(effectFn);
  //ポストプロセスを更新
  updatePostProcessing();
}

/**
 * ポストプロセスからエフェクト関数を削除
 * @param {*} effectFn
 */
function removePass(effectFn) {
  //配列からエフェクト関数を削除
  world._effectFns = world._effectFns.filter((fn) => fn !== effectFn);
  //ポストプロセスを更新
  updatePostProcessing();
}

/**
 * ポストプロセスの更新
 * @returns
 */
function updatePostProcessing() {
  //ポストプロセスがなければ終了
  if (!world.postProcessing) return;

  // scenePassColorを初期値に設定
  let node = world.scenePassColor;

  // 登録されているエフェクトを順番に適用
  for (const effectFn of world._effectFns) {
    node = effectFn(node);
  }

  // ポストプロセスの出力ノードを更新
  world.postProcessing.outputNode = node;
  // ポストプロセスを更新
  world.postProcessing.needsUpdate = true;
}

/**
 * レンダリングアクションを追加
 * @param {*} callback
 */
function addRenderAction(callback) {
  if (typeof callback !== "function") return;
  world.renderActions.add(callback);
}

/**
 * レンダリングアクションを削除
 * @param {*} callback
 */
function removeRenderAction(callback) {
  world.renderActions.delete(callback);
}

export default world;
