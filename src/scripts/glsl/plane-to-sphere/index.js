import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  PlaneGeometry,
  SphereGeometry,
} from "three/webgpu";
import { Ob } from "../Ob.js";
import Fragment from "./fragment.js";
import Vertex from "./vertex.js";
import { INode, utils } from "../../helper/index.js";
import {
  add,
  attribute,
  distance,
  mul,
  positionLocal,
  sub,
  uniform,
  vec2,
} from "three/tsl";
import gsap from "gsap";
import { viewport } from "../../helper/index.js";

export default class extends Ob {
  delayVertices;
  setupGeometry() {
    const width = this.rect.width;
    const height = this.rect.height;
    const wSeg = Math.round(width / 10);
    const hSeg = Math.round(height / 10);

    const radius = width / 10;
    //ジオメトリーを用意
    const sphere = new SphereGeometry(radius, wSeg, hSeg);
    const geometry = new PlaneGeometry(width, height, wSeg, hSeg);

    sphere.rotateY((Math.PI * 3) / 2);
    sphere.translate(0, 0, -radius);

    // SphereGeometryの頂点情報をPlaneGeometryにattributeとして追加
    geometry.setAttribute("sphere", sphere.getAttribute("position"));
    geometry.setAttribute("sphereNormal", sphere.getAttribute("normal"));

    // // 対角線上に詰められた遅延時間用の頂点データ
    // this.delayVertices = utils.getDiagonalVertices(hSeg, wSeg, getValue, 0);

    // // 0~1までの値をstep毎に返す
    // function getValue(previousValue, currentIndex) {
    //   let step = 1 / (hSeg + 1) / (wSeg + 1);
    //   return previousValue + step;
    // }

    // geometry.setAttribute(
    //   "aDelay",
    //   new Float32BufferAttribute(this.delayVertices, 1),
    // );

    return geometry;
  }

  /**
   * 頂点数を返す
   * @returns {number} 頂点数
   */
  setupVertexCount() {
    const vertexCount = this.geometry.attributes.sphere.count; //別にplaneでもいい

    return vertexCount;
  }

  /**
   * optionsをセットアップする
   * @returns {Object} options
   */
  setupOptions() {
    //親クラスのoptionsを取得
    const options = super.setupOptions();
    const aSpherePosition = attribute("sphere", "vec3");
    // const aDelay = attribute("aDelay", "float");
    const aSphereNormal = attribute("sphereNormal", "vec3");

    //optionsにattributeを格納
    options.aSpherePosition = aSpherePosition;
    // options.aDelay = aDelay;
    options.aSphereNormal = aSphereNormal;

    return options;
  }

  setupUniforms() {
    //親クラスのuniformsを取得
    const uniforms = super.setupUniforms();
    //uniformsにuPointSizeを追加
    uniforms.uPointSize = uniform(1.0);
    //uniformsにuScaleTimeを追加
    uniforms.uScaleTime = uniform(0.04);
    //uniformsにuScaleDelayを追加
    uniforms.uScaleDelay = uniform(4);
    //uniformsにuDelay1を追加
    uniforms.uDelay = uniform(0.7);
    //uniformsにuSphereScaleを追加
    uniforms.uSphereScale = uniform(2);
    //uniformsにuFreqを追加
    uniforms.uFreq = uniform(0.01);
    //uniformsにuNoiseLevelを追加
    uniforms.uNoiseLevel = uniform(0.2);
    uniforms.uNoiseFreq = uniform(1);
    uniforms.uReversal = uniform(0.0);

    return uniforms;
  }

  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  render(tick) {
    super.render(tick);

    //uHoverが0の時は処理をスキップ
    if (this.uniforms.uHover.value === 0) return;

    //最新のDOM要素のRectを取得
    const rect = INode.getRect(this.DOM.el);

    //DOM要素の座標をワールド座標に変換
    const { x, y } = this.getWorldPosition(rect, viewport);

    // メッシュのX座標をホバーに応じて少し移動
    this.mesh.position.x =
      x +
      (this.uniforms.uMouse.value.x - 0.5) * 50 * this.uniforms.uHover.value;

    // メッシュのY座標をホバーに応じて少し移動
    this.mesh.position.y =
      y +
      (this.uniforms.uMouse.value.y - 0.5) * 50 * this.uniforms.uHover.value;

    // メッシュのスケールをホバーに応じて少し拡大
    this.mesh.scale.x = 1.0 + 0.1 * this.uniforms.uHover.value;
    this.mesh.scale.y = 1.0 + 0.1 * this.uniforms.uHover.value;

    // メッシュの回転をホバーに応じて少し回転
    this.mesh.rotation.x =
      (-(this.uniforms.uMouse.value.y - 0.5) * this.uniforms.uHover.value) /
      1.5;

    this.mesh.rotation.y =
      (this.uniforms.uMouse.value.x - 0.5) * this.uniforms.uHover.value;
  }

  debug(folder) {
    folder
      .add(this.uniforms.uProgress, "value", 0, 1, 0.01)
      .name("progess")
      .listen();

    folder
      .add(this.uniforms.uSphereScale, "value", 0, 5, 0.01)
      .name("sphereScale")
      .listen();

    folder.add(this.uniforms.uDelay, "value", 0, 1, 0.1).name("delay").listen();
    folder
      .add(this.uniforms.uFreq, "value", 0, 0.1, 0.001)
      .name("freq")
      .listen();
    folder
      .add(this.uniforms.uNoiseLevel, "value", 0, 1.0, 0.0001)
      .name("noiseLevel")
      .listen();
    folder
      .add(this.uniforms.uNoiseFreq, "value", 0, 10, 0.0001)
      .name("noiseFreq")
      .listen();
    folder
      .add(this.uniforms.uReversal, "value", 0, 1, 0.0001)
      .name("reversal")
      .listen();

    const datObj = { next: !!this.uniforms.uProgress.value };
    folder
      .add(datObj, "next")
      .name("Animate")
      .onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          duration: 1,
          value: datObj.next ? 1 : 0,
          ease: "power2.out",
        });
      });
  }
}
