import {
  RenderTarget,
  Scene,
  Box3,
  Vector3,
  AnimationMixer,
  MathUtils,
  Color,
} from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointLight, AmbientLight, DirectionalLight } from "three/webgpu";
import { RGBAFormat } from "three";
import { gui } from "../helper";

/**
 * レンダーターゲットマネージャー
 * 3Dモデルのレンダーターゲット描画を管理するクラス
 */
class RenderTargetManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.targets = new Map(); // DOM要素 -> レンダーターゲット情報
    this.mixers = []; // アニメーションミキサー
  }

  /**
   * 指定された要素に対してレンダーターゲットを初期化
   * @param {HTMLElement} el - HTML要素
   * @param {Map} models - モデルデータ
   * @param {Object} worldCamera - メインカメラ
   * @returns {Object} レンダーターゲット情報
   */
  initRenderTarget(el, models, worldCamera, rect) {
    // モデルが一つもない場合はnullを返す
    if (models.size === 0) return null;

    const targetInfo = {
      renderTarget: null,
      scene: null,
      camera: null,
      controls: null,
      mixer: null,
      element: el,
    };

    // レンダーターゲットを作成
    targetInfo.renderTarget = new RenderTarget(rect.width, rect.height, {
      format: RGBAFormat, // RGBAフォーマットで透明をサポート
    });
    // targetInfo.renderTarget = new RenderTarget(3840, 3840, {
    //   format: RGBAFormat, // RGBAフォーマットで透明をサポート
    // });
    targetInfo.renderTarget.texture.flipY = false;
    targetInfo.renderTarget.texture.rotation = Math.PI;
    targetInfo.renderTarget.texture.center.set(0.5, 0.5);
    targetInfo.renderTarget.texture.generateMipmaps = false; // 透明テクスチャではMipMapを無効化

    // シーンを作成
    targetInfo.scene = new Scene();
    targetInfo.scene.background = null;

    // カメラを作成
    targetInfo.camera = worldCamera.clone();
    targetInfo.camera.aspect = 1;
    // メインカメラの near/far (2D 用の大きい値) を引き継ぐと、
    // モデルを近距離に置いたとき近クリップで全部切れて「真っ黒」になりやすいので上書きする
    // targetInfo.camera.near = 0.01;
    // targetInfo.camera.far = 1000;
    // targetInfo.camera.fov = 75;
    // targetInfo.camera.updateProjectionMatrix();

    // OrbitControlsを先に設定（モデルの center を target に合わせるため）
    this._setupControls(targetInfo, el);

    // モデルをシーンに追加
    this._addModelsToScene(targetInfo, models);

    // ライトを設定
    this._setupLights(targetInfo.scene);

    // マップに保存
    this.targets.set(el, targetInfo);
    this.gui(targetInfo);

    return targetInfo;
  }

  /**
   * モデルをシーンに追加
   * @private
   */
  _addModelsToScene(targetInfo, models) {
    models.forEach((gltf, key) => {
      if (gltf && gltf.scene) {
        const model = gltf.scene;

        // モデルのサイズを計算してカメラ位置を調整
        const box = new Box3().setFromObject(model);
        const center = new Vector3();
        box.getCenter(center);
        const size = new Vector3();
        box.getSize(size);

        // カメラとコントロールをモデルの中心に合わせる
        targetInfo.controls?.target.copy(center);

        // モデル全体が収まる距離をざっくりフィットさせる
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = MathUtils.degToRad(targetInfo.camera.fov);
        const fitHeightDistance = maxDim / (2 * Math.tan(fov / 2));
        const fitWidthDistance =
          fitHeightDistance / (targetInfo.camera.aspect || 1);
        const distance = 1.4 * Math.max(fitHeightDistance, fitWidthDistance);

        targetInfo.camera.position.set(center.x, center.y, center.z + distance);
        targetInfo.camera.near = Math.max(0.01, distance / 100);
        targetInfo.camera.far = distance * 100;
        targetInfo.camera.lookAt(center);
        targetInfo.camera.updateProjectionMatrix();
        targetInfo.controls?.update();

        targetInfo.scene.add(model);

        // アニメーションを設定
        if (gltf.animations && gltf.animations.length > 0) {
          targetInfo.mixer = new AnimationMixer(model);
          const action = targetInfo.mixer.clipAction(gltf.animations[0]);
          action.play();
          this.mixers.push(targetInfo.mixer);
        }
      }
    });
  }

  /**
   * ライトを設定
   * @private
   */
  _setupLights(scene) {
    const light1 = new PointLight(0xffffff, 5, 0);
    light1.position.set(-0.5, 2.1, 0.5);
    scene.add(light1);

    const light2 = new PointLight(0xffffff, 5, 0);
    light2.position.set(0.5, 0, 1);
    scene.add(light2);

    const light3 = new PointLight(0xffffff, 5, 0);
    light3.position.set(-10, -20, -10);
    scene.add(light3);

    const ambientLight = new AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 0, 0);
    scene.add(dirLight);
  }

  /**
   * OrbitControlsを設定
   * @private
   */
  _setupControls(targetInfo, el) {
    targetInfo.controls = new OrbitControls(targetInfo.camera, el);
    targetInfo.controls.enableZoom = false;
    targetInfo.controls.enableDamping = true;
    targetInfo.controls.dampingFactor = 0.1;

    // 上下回転を禁止
    targetInfo.controls.minPolarAngle = Math.PI / 2;
    targetInfo.controls.maxPolarAngle = Math.PI / 2;
  }

  /**
   * すべてのレンダーターゲットを描画
   */
  renderAll() {
    this.targets.forEach((targetInfo) => {
      if (targetInfo.renderTarget && targetInfo.scene && targetInfo.camera) {
        this.renderer.setRenderTarget(targetInfo.renderTarget);
        this.renderer.render(targetInfo.scene, targetInfo.camera);
      }
    });
  }

  /**
   * アニメーションを更新
   * @param {number} delta - デルタ時間
   */
  updateAnimations(delta) {
    this.mixers.forEach((mixer) => {
      mixer.update(delta);
    });
  }

  /**
   * すべてのコントロールを更新
   */
  updateControls() {
    this.targets.forEach((targetInfo) => {
      if (targetInfo.controls) {
        targetInfo.controls.update();
      }
    });
  }

  /**
   * 指定された要素のレンダーターゲット情報を取得
   * @param {HTMLElement} el - HTML要素
   * @returns {Object|null} レンダーターゲット情報
   */
  getTargetInfo(el) {
    return this.targets.get(el) || null;
  }

  /**
   * クリーンアップ
   */
  dispose() {
    this.targets.forEach((targetInfo) => {
      if (targetInfo.controls) {
        targetInfo.controls.dispose();
      }
      if (targetInfo.renderTarget) {
        targetInfo.renderTarget.dispose();
      }
    });
    this.targets.clear();
    this.mixers.length = 0;
  }

  gui(targetInfo) {
    // const gui = new GUI();

    // const folder = gui.addFolder("RenderTarget");
    // folder.add(targetInfo.camera.position, "x", -10, 10).step(0.01);
    // folder.add(targetInfo.camera.position, "y", -10, 10).step(0.01);
    // folder.add(targetInfo.camera.position, "z", -10, 10).step(0.01);

    gui.add((lilGUI) => {
      const folder = lilGUI.addFolder("RenderTargetCamera");
      folder.add(targetInfo.camera.position, "x", -10, 10).step(0.01);
      folder.add(targetInfo.camera.position, "y", -10, 10).step(0.01);
      folder.add(targetInfo.camera.position, "z", -10, 10).step(0.01);
    });
  }
}

export default RenderTargetManager;
