import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  Vector3,
  VideoTexture,
} from "three/webgpu";
import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";
import { utils } from "../../helper";
import { uniform, vec4 } from "three/tsl";
import { DoubleSide } from "three";

export default class extends Ob {
  beforeCreateMesh() {
    //現在表示しているスライドのインデックス番号
    this.activeSlideIdx = 0;
  }

  setupGeometry() {
    const planeGeo = new PlaneGeometry(
      this.rect.width,
      this.rect.height,
      // 円柱に添わせるために分割数を増やす
      70,
      10,
    );
    return planeGeo;
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uActiveSlideIdx = uniform(this.activeSlideIdx);
    uniforms.uParam = uniform(vec4(1, 1, 100, 100));
    uniforms.uSpeed = uniform(1.0);
    return uniforms;
  }

  setupMesh() {
    const group = new Group();
    // テクスチャのインデックス番号
    let idx = 0;

    // Sliderのそれぞれのアイテムを作成
    this.texes.forEach((tex) => {
      const planeMate = this.material.clone();
      planeMate.side = DoubleSide;

      /****************
       * Uniformsの定義
       ****************/
      //uniformsを複製
      const planeUniforms = super.setupUniforms();
      //tex1にテクスチャを設定
      planeUniforms.uTexes.tex1 = tex;
      //スライドのインデックス番号
      planeUniforms.uSlideIdx = uniform(idx);
      //スライドの数
      planeUniforms.uSlideTotal = uniform(this.texes.size);
      //現在表示しているスライドのインデックス番号
      planeUniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx;

      planeUniforms.uParam = this.uniforms.uParam;
      planeUniforms.uSpeed = this.uniforms.uSpeed;
      planeUniforms.uTick = this.uniforms.uTick;

      // 画像の解像度に合わせて uResolution を更新（これをしないと画像が伸びます）
      this.setupResolution(planeUniforms);

      // vertexとfragmentに渡すoptionsを作成
      const options = { vUv: this.vUv, uniforms: planeUniforms };

      // vertexとfragmentにシェーダーを設定
      planeMate.positionNode = this.setupVertex(options);
      planeMate.colorNode = this.setupFragment(options);

      const planeGeo = this.geometry;
      const plane = new Mesh(planeGeo, planeMate);

      // 他の関数(renderなど)からplaneUniformsの値を変更できるようにuserDataに格納
      plane.userData.uniforms = planeUniforms;

      //cylinderのchildrenにplaneメッシュを追加
      group.add(plane);

      idx++;
    });

    //スライドの配列を作成
    this.slides = [...group.children];

    return group;
  }
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  goTo(idx) {
    this.activeSlideIdx = idx;
  }

  render(tick) {
    super.render(tick);

    //activeSlideIdxを線形補間で更新
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value;
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, 0.07, 0.005);

    this.uniforms.uActiveSlideIdx.value = idx;
  }

  afterInit() {
    // 初期状態でgoToメソッドを呼ぶことでplayVideoメソッドが実行され、最初のスライドが再生される
    this.goTo(this.activeSlideIdx);
  }

  debug(folder) {
    const sliderIdx = { value: 0 };
    folder
      .add(sliderIdx, "value", 0, this.texes.size - 1, 1)
      .name("sliderIdx")
      .listen()
      .onChange(() => {
        this.goTo(sliderIdx.value);
      });
    folder
      .add(this.uniforms.uSpeed, "value", 0, 10, 0.1)
      .name("Speed")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "x", 0, 3, 0.1)
      .name("Noise X")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "y", 0, 3, 0.1)
      .name("Noise Y")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "z", 0, 500, 0.1)
      .name("Noise Z")
      .listen();
    folder
      .add(this.uniforms.uParam.value, "w", 0, 500, 0.1)
      .name("Noise W")
      .listen();
  }
}
