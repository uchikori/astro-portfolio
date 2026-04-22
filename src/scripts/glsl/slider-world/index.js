import {
  CylinderGeometry,
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
import { uniform } from "three/tsl";
import { DoubleSide } from "three";

export default class extends Ob {
  beforeCreateMesh() {
    const { radius, radiusScale } = this.DOM.el.dataset;
    this.radius = radius ? parseFloat(radius) : this.rect.width * (parseFloat(radiusScale) || 1.0);

    //シリンダーの回転軸を定義
    this.rotateAxis = new Vector3(0.2, 0.8, 0.2).normalize();
    //現在表示しているスライドのインデックス番号
    this.activeSlideIdx = 0;
    //現在表示しているスライドと次のスライドの角度の差
    this.diffRad = 0;
  }

  setupGeometry() {
    const planeGeo = new PlaneGeometry(
      this.rect.width,
      this.rect.height,
      // 円柱に添わせるために分割数を増やす
      10,
      10,
    );
    return planeGeo;
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uActiveSlideIdx = uniform(this.activeSlideIdx);
    uniforms.uDist = uniform(0.8);
    return uniforms;
  }

  setupMesh() {
    const cylinderGeo = new CylinderGeometry(
      this.radius,
      this.radius,
      this.rect.height,
      100,
      1,
      true,
    );

    const cylinderMate = new MeshBasicNodeMaterial({
      transparent: true,
      opacity: 0,
      alphaTest: 0.5,
      // wireframe: true,
      // color: 0xff0000,
    });
    //Cylinderのメッシュを作成(cylinderMateにはノードを設定していないのでvertex.jsやfragment.jsの影響は受けない)
    const cylinder = new Mesh(cylinderGeo, cylinderMate);

    cylinder.position.z = -this.radius;

    // Cylinderの頂点座標を取得
    const { position, normal } = cylinderGeo.attributes;
    // Cylinderの1周分の頂点数
    const ONE_LOOP = cylinderGeo.attributes.position.count / 2;
    // 1つのテクスチャあたりの頂点数
    const step = Math.floor(ONE_LOOP / this.texes.size);

    // テクスチャのインデックス番号
    let idx = 0;

    // Sliderのそれぞれのアイテムを作成
    this.texes.forEach((tex) => {
      const planeMate = this.material.clone();
      planeMate.side = DoubleSide;
      planeMate.alphaTest = 0.01;

      /****************
       * Uniformsの定義
       ****************/
      //uniformsを複製
      const planeUniforms = super.setupUniforms();
      //tex1にテクスチャを設定
      planeUniforms.uTexes.tex1 = tex;
      //uRadiusに半径を設定
      planeUniforms.uRadius = uniform(this.radius);
      //スライドのインデックス番号
      planeUniforms.uSlideIdx = uniform(idx);
      //スライドの数
      planeUniforms.uSlideTotal = uniform(this.texes.size);
      //現在表示しているスライドのインデックス番号
      planeUniforms.uActiveSlideIdx = this.uniforms.uActiveSlideIdx;
      //dist
      planeUniforms.uDist = this.uniforms.uDist;
      //tick
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

      // テクスチャのインデックスから頂点周期を計算
      const pickIdx = idx * step;
      // 頂点座標を取得
      plane.position.x = position.getX(pickIdx);
      plane.position.z = position.getZ(pickIdx);

      // メッシュの向きを設定
      const originalDir = { x: 0, y: 0, z: 1 };
      const targetDir = {
        x: normal.getX(pickIdx),
        y: 0,
        z: normal.getZ(pickIdx),
      };

      // メッシュを指定方向に向ける
      utils.pointTo(plane, originalDir, targetDir);

      //cylinderのchildrenにplaneメッシュを追加
      cylinder.add(plane);

      idx++;
    });

    //スライドの配列を作成
    this.slides = [...cylinder.children];

    utils.pointTo(cylinder, cylinder.up, this.rotateAxis);

    return cylinder;
  }
  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  goTo(idx) {
    // idx - this.activeSlideIdx=>スライドの移動枚数(整数)
    // (idx - this.activeSlideIdx) / this.slides.length=>移動枚数/スライドの数=>1スライドあたりの移動量(小数)
    // 1スライドあたりの移動量 * 2 * PI=>1スライドあたりの角度
    this.diffRad -=
      ((idx - this.activeSlideIdx) / this.slides.length) * Math.PI * 2;
    this.activeSlideIdx = idx;

    this.playVideo(idx);
  }

  render(tick) {
    super.render(tick);

    // diffRadが0でなければ回転させる
    if (this.diffRad === 0) return;

    // diffRadを0に近づける線形補間
    const rad = utils.lerp(this.diffRad, 0, 0.95, 0.00001) || this.diffRad;

    // 回転軸周りに回転させる
    this.mesh.rotateOnWorldAxis(this.rotateAxis, rad);
    // diffRadを更新
    this.diffRad -= rad;

    //activeSlideIdxを線形補間で更新
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value;
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, 0.05, 0.005);

    this.uniforms.uActiveSlideIdx.value = idx;
  }

  playVideo(idx) {
    const i = idx % this.slides.length;

    //スライドのインデックス番号からスライドを取得(マイナス指定で末尾から取得可能)
    const slide = this.slides.at(i);

    const tex1Value = slide.userData.uniforms.uTexes.tex1;

    // 全てのスライドを確認し、再生中の全ビデオを強制的に停止して暴走を防ぐ
    this.slides.forEach((s) => {
      const tex = s.userData.uniforms.uTexes.tex1;
      if (tex instanceof VideoTexture) {
        tex.source.data.pause?.();
      }
    });

    // videoテクスチャの場合
    if (tex1Value instanceof VideoTexture) {
      //videoが再生されるまで待機
      this.interval = setInterval(() => {
        // アクティブなスライドのインデックス番号と自身のインデックス番号が一致した場合
        if (slide.userData.uniforms.uActiveSlideIdx.value === idx) {
          //videoを再生
          tex1Value.source.data.play?.();
          //インターバルをクリア
          clearInterval(this.interval);
          this.interval = null;
        }
      }, 100);
    }
  }

  afterInit() {
    // 初期状態で全てのvideoを停止
    this.texes.forEach((tex) => {
      if (tex instanceof VideoTexture) {
        tex.source.data.pause?.();
      }
    });

    // 初期状態でgoToメソッドを呼ぶことでplayVideoメソッドが実行され、最初のスライドが再生される
    this.goTo(this.activeSlideIdx);
  }

  debug(folder) {
    const changeRotateAxis = () => {
      utils.pointTo(this.mesh, this.mesh.up, this.rotateAxis.normalize());
    };
    folder
      .add(this.rotateAxis, "x", -1, 1, 0.01)
      .name("rotateAxisX")
      .listen()
      .onChange(changeRotateAxis);
    folder
      .add(this.rotateAxis, "y", -1, 1, 0.01)
      .name("rotateAxisY")
      .listen()
      .onChange(changeRotateAxis);
    folder
      .add(this.rotateAxis, "z", -1, 1, 0.01)
      .name("rotateAxisZ")
      .listen()
      .onChange(changeRotateAxis);

    const sliderIdx = { value: 0 };
    folder
      .add(sliderIdx, "value", 0, this.texes.size - 1, 1)
      .name("sliderIdx")
      .listen()
      .onChange(() => {
        this.goTo(sliderIdx.value);
      });

    folder.add(this.uniforms.uDist, "value", 0, 1, 0.01).name("dist").listen();
  }
}
