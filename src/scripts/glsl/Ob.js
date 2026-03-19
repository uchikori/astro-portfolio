import { uniform, uv, vec2 } from "three/tsl";
import {
  Mesh,
  PlaneGeometry,
  MeshBasicNodeMaterial,
  MeshBasicMaterial,
} from "three/webgpu";
import loader from "../component/loader";
import world from "./world";
import { utils, viewport } from "../helper";
import gsap from "gsap";

class Ob {
  static async init({ el, type }) {
    //textureを取得
    const texes = await loader.getTexByElement(el);
    // tex1が非対応拡張子の場合（loader.jsのloadVideoに記述）
    if (texes.get("tex1") === null) {
      // tex2をtex1にセット
      texes.set("tex1", texes.get("tex2"));
    }

    const o = new this({ texes, el, type }); //Obのインスタンス化

    return o;
  }
  constructor({ texes, el, type }) {
    this.DOM = {
      el,
    };
    this.texes = texes ?? [];

    // メッシュ作成前の処理
    this.beforeCreateMesh();

    //WebGLのHTML要素の座標を取得
    this.rect = el.getBoundingClientRect();

    if (!this.rect.width || !this.rect.height) {
      if (window.debug) {
        console.log("要素に1px以上の幅と高さを設定してください:", this.DOM.el);
      }
      return {};
    }

    try {
      //modelを取得
      this.models = loader.getModelByElement(el);

      // レンダーターゲット情報を初期化(モデルが一つもない場合はnullが格納されている)
      this.targetInfo = world.renderTargetManager.initRenderTarget(
        el,
        this.models,
        world.camera,
        this.rect,
      );

      this.material = this.setupMaterial();
      this.geometry = this.setupGeometry();

      this.defines = this.setupDefines();

      //uv座標
      this.vUv = uv();

      //uniformsの定義
      this.uniforms = this.setupUniforms();
      this.uniforms = this.setupTexes(this.uniforms);
      this.uniforms = this.setupResolution(this.uniforms);

      // レンダーターゲットがある場合はテクスチャ処理をスキップ
      if (!this.targetInfo) {
        //シャーダー計算に引数として渡すオプション
        const options = this.setupOptions();

        //Vertexシェーダー計算
        this.vertex = this.setupVertex(options);
        //fragmentシェーダー計算
        this.fragment = this.setupFragment(options);

        this.material.positionNode = this.vertex;
        this.material.colorNode = this.fragment;
      }

      this.mesh = this.setupMesh();

      this.initialSize = { width: this.rect.width, height: this.rect.height };

      this.options = this.targetInfo
        ? null
        : { vUv: this.vUv, uniforms: this.uniforms };

      this.disableOriginalElem();

      // メッシュにマーカーを付与
      this.mesh.__marker = type;
    } catch (e) {
      if (window.debug) {
        console.log(e);
      }
      return {};
    }
  }

  beforeCreateMesh() {}

  setupGeometry() {
    return new PlaneGeometry(this.rect.width, this.rect.height, 1, 1);
  }

  setupMaterial() {
    // レンダーターゲットを使用するオブジェクトの場合はMeshBasicMaterialを使用
    if (this.targetInfo) {
      this.material = new MeshBasicMaterial({
        map: this.targetInfo.renderTarget.texture,
        side: 2, // DoubleSide
        transparent: true,
      });
    } else {
      this.material = new MeshBasicNodeMaterial({
        transparent: true,
        alphaTest: 0.5,
      });
    }

    return this.material;
  }

  setupMesh() {
    return new Mesh(this.geometry, this.material);
  }

  setupDefines() {
    return {
      PI: Math.PI,
    };
  }

  setupUniforms() {
    return {
      uMouse: uniform(vec2(0.5, 0.5)),
      uHover: uniform(0.0),
      uTexes: {},
      uTick: uniform(0),
      uProgress: uniform(0),
    };
  }

  setupOptions() {
    return {
      vUv: this.vUv,
      uniforms: this.uniforms,
    };
  }

  setupTexes(uniforms) {
    this.texes.forEach((tex, key) => {
      //uTexesにkeyをプロパティ名としてそれぞれのtexture格納
      uniforms.uTexes[key] = tex;
    });

    return uniforms;
  }

  setupVertex(options) {
    throw new Error("このメソッドはオーバーライドして使用してください");
  }

  setupFragment(options) {
    throw new Error("このメソッドはオーバーライドして使用してください");
  }

  /**
   * 画像の解像度を設定
   * @param {*} uniforms - uniforms
   */
  setupResolution(uniforms) {
    //テクスチャを使用していない場合は終了
    if (!this.texes.get("tex1")) return uniforms;

    //画像のDOM要素を取得
    const media = this.texes.get("tex1").source.data;

    const mediaRect = {};

    // img要素の場合
    if (media instanceof HTMLImageElement) {
      mediaRect.width = media.naturalWidth;
      mediaRect.height = media.naturalHeight;
      // video要素の場合
    } else if (media instanceof HTMLVideoElement) {
      mediaRect.width = media.videoWidth;
      mediaRect.height = media.videoHeight;
    }

    const resolution = utils.getResolutionUniform(this.rect, mediaRect);

    uniforms.uResolution = uniform(resolution);

    return uniforms;
  }

  // 元の要素を非表示にする
  disableOriginalElem() {
    this.DOM.el.draggable = false;
  }

  // オブジェクトのリサイズ処理
  resize() {
    const {
      DOM: { el },
      mesh,
      geometry,
      rect,
    } = this;

    //リサイズ後のWebGLのHTMLエレメントの座標を取得
    const nextRect = el.getBoundingClientRect();
    // ワールド座標の位置を取得
    const { x, y } = this.getWorldPosition(nextRect, viewport);
    //WebGLオブジェクトの位置を更新
    mesh.position.y = y;
    mesh.position.x = x;

    //大きさの変更(元のジオメトリーの何倍のスケールにするかを計算)
    geometry.scale(
      nextRect.width / rect.width,
      nextRect.height / rect.height,
      1,
    );

    this.rect = nextRect;
  }

  //ワールド座標を割り出す関数
  getWorldPosition(rect, canvasRect) {
    const x = rect.left + rect.width / 2 - canvasRect.width / 2;
    const y = -rect.top - rect.height / 2 + canvasRect.height / 2;

    return { x, y };
  }

  //オブジェクトの位置を更新する処理
  scroll() {
    const {
      DOM: { el },
      mesh,
    } = this;

    //スクロール中のWebGLのHTMLエレメントの座標を取得
    const rect = el.getBoundingClientRect();
    // ワールド座標のy座標のみを取得
    const { x, y } = this.getWorldPosition(rect, viewport);
    //WebGLオブジェクトの位置を更新
    mesh.position.y = y;
    // mesh.position.x = x;
  }

  render(tick) {
    this.uniforms.uTick = tick;
  }

  async afterInit() {
    this.pauseVideo();
    setTimeout(() => {
      this.playVideo();
    }, 4000);
  }

  async playVideo(texId = "tex1") {
    await this.uniforms.uTexes[texId]?.source.data.play?.();
  }

  pauseVideo(texId = "tex1") {
    this.uniforms.uTexes[texId]?.source.data.pause?.();
  }

  debug(folder) {
    folder
      .add(this.uniforms.uProgress, "value", 0, 1, 0.01)
      .name("Progress")
      .listen();

    const datData = { next: !!this.uniforms.uProgress.value };
    folder
      .add(datData, "next")
      .name("Next")
      .onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          value: +datData.next,
          duration: 2,
          ease: "power2.inOut",
        });
      });
  }
}

export { Ob };
