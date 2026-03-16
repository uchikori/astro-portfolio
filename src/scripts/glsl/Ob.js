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
import Fragment from "./normal/fragment";
import Vertex from "./normal/vertex";
import FragmentGray from "./gray/fragment";
import VertexGray from "./gray/vertex";

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
    this.texes = texes;
    //WebGLのHTML要素の座標を取得
    this.rect = el.getBoundingClientRect();

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

    //uv座標
    this.vUv = uv();

    //uniformsの定義
    this.uniforms = this.setupUniforms();
    this.uniforms = this.setupTexes(this.uniforms);
    this.uniforms = this.setupResolution(this.uniforms);

    // レンダーターゲットがある場合はテクスチャ処理をスキップ
    if (!this.targetInfo) {
      //シャーダー計算に引数として渡すオプション
      // uTexes を展開してトップレベルの uniform にする
      const options = {
        vUv: this.vUv,
        uniforms: this.uniforms,
      };

      //Vertexシェーダー計算
      this.vertex = this.setupVertex(options);
      //fragmentシェーダー計算
      this.fragment = this.setupFragment(options);

      this.material.positionNode = this.vertex;
      this.material.colorNode = this.fragment;
    }

    this.mesh = this.setupMesh();
    this.mesh.position.z = 0;

    this.initialSize = { width: this.rect.width, height: this.rect.height };
    this.DOM = {
      el,
    };
    this.options = this.targetInfo
      ? null
      : { vUv: this.vUv, uniforms: this.uniforms };

    this.disableOriginalElem();
  }

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
        color: 0xff0000,
      });
    }

    return this.material;
  }

  setupMesh() {
    return new Mesh(this.geometry, this.material);
  }

  setupUniforms() {
    return {
      uMouse: uniform(vec2(0.5, 0.5)),
      uHover: uniform(0.0),
      uTexes: {},
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

  render() {}
}

export { Ob };
