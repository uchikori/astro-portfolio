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
import { utils } from "../../helper/index.js";
import { add, attribute, mul, positionLocal, uniform } from "three/tsl";
import gsap from "gsap";

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

    // SphereGeometryの頂点情報をPlaneGeometryにattributeとして追加
    geometry.setAttribute("sphere", sphere.getAttribute("position"));
    geometry.setAttribute("sphereNormal", sphere.getAttribute("normal"));

    // 対角線上に詰められた遅延時間用の頂点データ
    this.delayVertices = utils.getDiagonalVertices(hSeg, wSeg, getValue, 0);

    // 0~1までの値をstep毎に返す
    function getValue(previousValue, currentIndex) {
      let step = 1 / (hSeg + 1) / (wSeg + 1);
      return previousValue + step;
    }

    geometry.setAttribute(
      "aDelay",
      new Float32BufferAttribute(this.delayVertices, 1),
    );

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
    const aDelay = attribute("aDelay", "float");
    const aSphereNormal = attribute("sphereNormal", "vec3");

    //optionsにattributeを格納
    options.aSpherePosition = aSpherePosition;
    options.aDelay = aDelay;
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
    //uniformsにuSaturationを追加
    uniforms.uSaturation = uniform(0.7);
    //uniformsにuLightnessを追加
    uniforms.uLightness = uniform(0.67);
    //uniformsにuColorTimeを追加
    uniforms.uColorTime = uniform(0.05);
    //uniformsにuColorDelayを追加
    uniforms.uColorDelay = uniform(3.3);

    return uniforms;
  }

  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  debug(folder) {
    folder
      .add(this.uniforms.uProgress, "value", 0, 1, 0.01)
      .name("progess")
      .listen();
    const datObj = { next: !!this.uniforms.uProgress.value };
    folder
      .add(datObj, "next")
      .name("Animate")
      .onChange(() => {
        gsap.to(this.uniforms.uProgress, {
          duration: 2,
          value: datObj.next ? 1 : 0,
          ease: "power2.out",
        });
      });
  }
}
