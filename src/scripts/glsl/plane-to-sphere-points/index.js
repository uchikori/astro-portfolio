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

export default class extends Ob {
  delayVertices;
  setupGeometry() {
    const width = this.rect.width;
    const height = this.rect.height;
    const wSeg = Math.floor(width / 10),
      hSeg = Math.floor(height / 10);

    const radius = Math.min(width, height) / 2;
    //ジオメトリーを用意
    const sphere = new SphereGeometry(radius, wSeg, hSeg);
    const plane = new PlaneGeometry(width, height, wSeg, hSeg);

    //実際に表示するジオメトリー
    const geometry = new BufferGeometry();

    // 平面の頂点位置
    geometry.setAttribute("plane", plane.getAttribute("position"));
    // uv情報
    geometry.setAttribute("uv", plane.getAttribute("uv"));
    // 球体の頂点位置
    geometry.setAttribute("sphere", sphere.getAttribute("position"));

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

  setupMesh() {
    const instanceGeometry = new SphereGeometry(1, 8, 8);
    // 既に生成されている場合はそれを返す
    if (this._instancedMesh) return this._instancedMesh;

    // setupInstancedMeshを呼び出して頂点数とジオメトリを取得
    const vertexCount = this.setupVertexCount();

    // InstancedMeshを生成
    this._instancedMesh = new InstancedMesh(
      instanceGeometry,
      this.material,
      vertexCount,
    );

    return this._instancedMesh;
  }
  /**
   * optionsをセットアップする
   * @returns {Object} options
   */
  setupOptions() {
    //親クラスのoptionsを取得
    const options = super.setupOptions();
    //InstancedMeshを取得
    const instancedMesh = this.setupMesh();
    //頂点数を取得
    const vertexCount = this.setupVertexCount();

    //planegeometryから頂点の位置情報を取得
    const planePositionArray = this.geometry.attributes.plane.array;
    //spheregeometryから頂点の位置情報を取得
    const spherePositionArray = this.geometry.attributes.sphere.array;
    //geometryからuv座標を取得
    const uvArray = this.geometry.attributes.uv.array;
    //InstancedMeshにplaneの頂点情報を格納するための配列を作成
    const instancePlanePositions = new Float32Array(vertexCount * 3);
    //InstancedMeshにsphereの頂点情報を格納するための配列を作成
    const instanceSpherePositions = new Float32Array(vertexCount * 3);
    //InstancedMeshに遅延情報を格納するための配列を作成
    const instanceDelays = new Float32Array(vertexCount);
    //InstancedMeshにuv座標を格納するための配列を作成
    const instanceUVs = new Float32Array(vertexCount * 2);

    for (let i = 0; i < vertexCount; i++) {
      //元の平面のi番目の頂点のx座標をinstanceMeshのi番目の頂点のx座標に代入
      instancePlanePositions[i * 3] = planePositionArray[i * 3];
      //元の平面のi番目の頂点のy座標をinstanceMeshのi番目の頂点のy座標に代入
      instancePlanePositions[i * 3 + 1] = planePositionArray[i * 3 + 1];
      //元の平面のi番目の頂点のz座標をinstanceMeshのi番目の頂点のz座標に代入
      instancePlanePositions[i * 3 + 2] = planePositionArray[i * 3 + 2];

      //元の球体のi番目の頂点のx座標をinstanceMeshのi番目の頂点のx座標に代入
      instanceSpherePositions[i * 3] = spherePositionArray[i * 3];
      //元の球体のi番目の頂点のy座標をinstanceMeshのi番目の頂点のy座標に代入
      instanceSpherePositions[i * 3 + 1] = spherePositionArray[i * 3 + 1];
      //元の球体のi番目の頂点のz座標をinstanceMeshのi番目の頂点のz座標に代入
      instanceSpherePositions[i * 3 + 2] = spherePositionArray[i * 3 + 2];

      //元の球体のi番目の頂点の遅延情報をinstanceMeshのi番目の頂点の遅延情報に代入
      instanceDelays[i] = this.delayVertices[i];

      //uv情報を代入
      instanceUVs[i * 2] = uvArray[i * 2];
      instanceUVs[i * 2 + 1] = uvArray[i * 2 + 1];
    }

    //InstancedMeshにplaneの頂点情報を格納
    instancedMesh.geometry.setAttribute(
      "instancePlanePosition",
      new InstancedBufferAttribute(instancePlanePositions, 3),
    );
    //InstancedMeshにsphereの頂点情報を格納
    instancedMesh.geometry.setAttribute(
      "instanceSpherePosition",
      new InstancedBufferAttribute(instanceSpherePositions, 3),
    );
    //InstancedMeshに遅延情報を格納
    instancedMesh.geometry.setAttribute(
      "instanceDelay",
      new InstancedBufferAttribute(instanceDelays, 1),
    );
    //InstancedMeshにuv座標を格納
    instancedMesh.geometry.setAttribute(
      "instanceUV",
      new InstancedBufferAttribute(instanceUVs, 2),
    );

    const aInstancePlanePosition = attribute("instancePlanePosition", "vec3");
    const aInstanceSpherePosition = attribute("instanceSpherePosition", "vec3");
    const aInstanceDelay = attribute("instanceDelay", "float");
    const aInstanceUV = attribute("instanceUV", "vec2");

    //optionsにattributeを格納
    options.aInstancePlanePosition = aInstancePlanePosition;
    options.aInstanceSpherePosition = aInstanceSpherePosition;
    options.aInstanceDelay = aInstanceDelay;
    options.aInstanceUV = aInstanceUV;

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
    const { uniforms } = options;
    const { uPointSize } = uniforms;
    //vertex関数で変形後の頂点位置を計算
    const transformedInstancePos = Vertex(options);

    //小さな球体のローカル位置
    const localPos = positionLocal;

    //頂点のサイズを適用
    const scaledLocalPos = mul(localPos, uPointSize).toVar();

    const finalPos = add(transformedInstancePos, scaledLocalPos);

    return finalPos;
  }
  setupFragment(options) {
    return Fragment(options);
  }
}
