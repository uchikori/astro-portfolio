import gsap from "gsap";

import { Ob } from "../Ob.js";
import Vertex from "./vertex.js";
import Fragment from "./fragment.js";

import { utils } from "../../helper/index.js";
import {
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
} from "three/webgpu";
import {
  attribute,
  positionLocal,
  mul,
  uniform,
  float,
  sin,
  sub,
  add,
  abs,
  vec3,
} from "three/tsl";
import { vec2 } from "three/tsl";

export default class extends Ob {
  intensityVertices;

  beforeCreateMesh() {
    this.DOM.childMediaEls = [];
  }

  setupGeometry() {
    const width = Math.floor(this.rect.width), //横幅を整数に丸める
      height = Math.floor(this.rect.height), //高さを整数に丸める
      wSeg = width / 2, //横方向のセグメント数
      hSeg = height / 2; //縦方向のセグメント数

    const plane = new PlaneGeometry(width, height, wSeg, hSeg);

    // 対角線上に詰められた遅延時間用の頂点データ
    this.intensityVertices = utils.getDiagonalVertices(
      hSeg,
      wSeg,
      () => random(0, 1500),
      0,
    );
    //  printMat(delayVertices, wSeg + 1, '遅延時間行列');

    function random(a, b) {
      return a + (b - a) * Math.random();
    }

    plane.setAttribute(
      "aIntensity",
      new Float32BufferAttribute(this.intensityVertices, 1),
    );

    return plane;
  }
  /**
   * InstancedMeshをセットアップする
   * @returns {InstancedMesh, vertexCount}
   */
  setupVertexCount() {
    //geometryから頂点数を取得
    const vertexCount = this.geometry.attributes.position.count;
    //頂点数を返す
    return vertexCount;
  }
  setupMesh() {
    //InstancedMesh用のジオメトリを作成
    const instanceGeomety = new PlaneGeometry(1, 1, 2, 2);
    // 既に生成されている場合はそれを返す
    if (this._instancedMesh) return this._instancedMesh;

    // setupInstancedMeshを呼び出して頂点数とジオメトリを取得
    const vertexCount = this.setupVertexCount();

    // InstancedMeshを生成
    this._instancedMesh = new InstancedMesh(
      instanceGeomety,
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
    //uniformsからuProgressを取得
    const { uProgress } = this.uniforms;

    //planegeometryから頂点の位置情報を取得
    const planePositionArray = this.geometry.attributes.position.array;
    //geometryからuv座標を取得
    const uvArray = this.geometry.attributes.uv.array;
    //InstancedMeshにplaneの頂点情報を格納するための配列を作成
    const instancePlanePositions = new Float32Array(vertexCount * 3);
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

      //元の球体のi番目の頂点の遅延情報をinstanceMeshのi番目の頂点の遅延情報に代入
      instanceDelays[i] = this.intensityVertices[i];

      //uv情報を代入
      instanceUVs[i * 2] = uvArray[i * 2];
      instanceUVs[i * 2 + 1] = uvArray[i * 2 + 1];
    }

    //instancedMeshのattibuteに頂点情報を格納
    instancedMesh.geometry.setAttribute(
      "instancePlanePosition",
      new InstancedBufferAttribute(instancePlanePositions, 3), //
    );
    instancedMesh.geometry.setAttribute(
      "instanceDelay",
      new InstancedBufferAttribute(instanceDelays, 1),
    );
    instancedMesh.geometry.setAttribute(
      "instanceUV",
      new InstancedBufferAttribute(instanceUVs, 2),
    );

    const aInstancePlanePosition = attribute("instancePlanePosition", "vec3");
    const aInstanceDelay = attribute("instanceDelay", "float");
    const aInstanceUV = attribute("instanceUV", "vec2");

    options.aInstanceDelay = aInstanceDelay;
    options.aInstancePlanePosition = aInstancePlanePosition;
    options.aInstanceUV = aInstanceUV;

    return options;
  }
  setupUniforms() {
    //親クラスのuniformsを取得
    const uniforms = super.setupUniforms();
    //パーティクルのサイズを計算 横幅を300で割る
    const size = this.rect.width / 300;
    //uniformsにuPointSizeを追加
    uniforms.uPointSize = uniform(size * 1.1);
    //ノイズの速度
    uniforms.uSpeed = uniform(0.05);
    //ノイズの強さ
    uniforms.uCnoise = uniform(vec3(0.005, 0, 0.01));
    //ノイズの広がり
    uniforms.uExpand = uniform(vec3(1, 1, 1));
    return uniforms;
  }
  setupVertex(options) {
    const { uPointSize } = this.uniforms;
    //vertex関数で変形後の頂点位置を計算
    const transformedInstancePos = Vertex(options);

    //小さな球体のローカル位置
    const localPos = positionLocal;

    // 頂点のサイズを適用
    const scaledLocalPos = mul(localPos, uPointSize).toVar();

    const finalPos = add(transformedInstancePos, scaledLocalPos);

    return finalPos;
  }

  setupFragment(options) {
    return Fragment(options);
  }

  setupTexes(uniforms) {
    //親クラスのテクスチャを取得
    const newUniforms = super.setupTexes(uniforms);
    //現在のテクスチャをtex1に設定
    newUniforms.texCurrent = this.uniforms.uTexes.tex1;
    //次のテクスチャを初期値として第2テクスチャか、なければ第1テクスチャに設定 (TSLのtexture()はnullを受け付けません)
    newUniforms.texNext =
      this.uniforms.uTexes.tex2 ?? this.uniforms.uTexes.tex1;
    return newUniforms;
  }

  // 実行中フラグ
  running = false;
  goTo(idx, duration = 2) {
    // 有効なテクスチャ数を取得
    const texKeys = Object.keys(this.uniforms.uTexes).filter((key) =>
      key.startsWith("tex"),
    );
    const texCount = texKeys.length || 1;

    // インデックスをテクスチャ数で割った余りを計算
    const _idx = (((idx % texCount) + texCount) % texCount) + 1;

    // 実行中ならreturn
    if (this.running) return;
    // 実行中フラグを立てる
    this.running = true;

    // 次のテクスチャを取得
    const nextTex = this.uniforms.uTexes["tex" + _idx];
    // uniformsにtexNextプロパティを追加
    this.uniforms.texNext = nextTex;

    gsap.to(this.uniforms.uProgress, {
      value: 1,
      duration,
      ease: "none",
      onStart: () => {
        // this.DOM.el.nextElementSibling?.remove();
        this.DOM.childMediaEls.forEach((el) => {
          el.style.opacity = 0;
          el.pause?.();
        });
        this.mesh.visible = true;
      },
      onComplete: () => {
        // 次のテクスチャを現在のテクスチャに設定
        this.uniforms.texCurrent = this.uniforms.texNext;
        // progressを0に戻す
        this.uniforms.uProgress.value = 0;
        // 次のテクスチャの画像要素を取得
        const activeEl = this.getChildMediaEl(_idx - 1);
        activeEl.style.opacity = 1;

        // メッシュを非表示
        this.mesh.visible = false;
        // 実行中フラグを戻す
        this.running = false;

        //動画が止まっていたら再生
        if (activeEl.paused) {
          activeEl.play?.();
        }
      },
    });
  }

  getChildMediaEl(idx) {
    return this.DOM.childMediaEls[idx];
  }

  afterInit() {
    let isFirst = true;
    this.texes.forEach((tex) => {
      const mediaEl = tex.source.data.cloneNode(true);
      //クラス名を追加
      mediaEl.classList.add("js_particleChild");
      // tex1以外は非表示にする
      if (!isFirst) {
        mediaEl.style.opacity = 0;
      }
      isFirst = false;
      // 親要素を取得
      const parentElement = this.DOM.el.parentElement;
      // childMediaElsに追加
      this.DOM.childMediaEls.push(mediaEl);
      // 親要素に画像要素の複製を追加
      parentElement.append(mediaEl);
    });
    // メッシュを1フレーム描画させてシェーダーのコンパイルを済ませてから非表示にする
    requestAnimationFrame(() => {
      this.mesh.visible = false;
    });
  }

  resize() {
    super.resize();

    // パーティクルのサイズを再計算
    const size = this.rect.width / 300;
    this.uniforms.uPointSize.value = size * 1.1;

    // ジオメトリから最新の頂点位置を取得して上書き
    const attr = this.mesh.geometry.attributes.instancePlanePosition;
    const planePositionArray = this.geometry.attributes.position.array;

    for (let i = 0; i < attr.count; i++) {
      attr.array[i * 3] = planePositionArray[i * 3];
      attr.array[i * 3 + 1] = planePositionArray[i * 3 + 1];
      attr.array[i * 3 + 2] = planePositionArray[i * 3 + 2];
    }

    // GPUに更新を通知
    attr.needsUpdate = true;
  }
  debug(folder) {
    folder.add(this.uniforms.uProgress, "value", 0, 1, 0.1).name("progress");

    const sliderIdx = { value: 0 };
    folder
      .add(sliderIdx, "value", -12, 12, 1)
      .name("goTo")
      .listen()
      .onChange(() => {
        this.goTo(sliderIdx.value);
      });

    // curl-noise/index.js

    folder.add(this.uniforms.uSpeed, "value", 0, 0.1, 0.001).name("speed");

    // Vector3 の場合は .value.x / .value.y / .value.z を操作する
    folder
      .add(this.uniforms.uCnoise.value, "x", 0, 0.01, 0.001)
      .name("cnoiseX");
    folder
      .add(this.uniforms.uCnoise.value, "y", 0, 0.01, 0.001)
      .name("cnoiseY");
    folder
      .add(this.uniforms.uCnoise.value, "z", 0, 0.01, 0.001)
      .name("cnoiseZ");

    // uExpand も vec3 なので同様に .value.x などを指定する必要があります
    // もし全体の大きさを一括で変えたい場合は .value の x, y, z 全体を操作するか、
    // もしくは x だけをGUIに出して反映させる形になります
    folder.add(this.uniforms.uExpand.value, "x", 0, 10, 1).name("expandX");
    folder.add(this.uniforms.uExpand.value, "y", 0, 10, 1).name("expandY");
  }
}
