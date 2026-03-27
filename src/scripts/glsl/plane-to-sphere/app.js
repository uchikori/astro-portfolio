/**
 * Three.js
 * https://threejs.org/
 */
// import * as THREE from "three";
import * as THREE from "three/webgpu";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import GUI from "lil-gui";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  add,
  attribute,
  uniform,
  uv,
  Fn,
  vec3,
  vec4,
  positionLocal,
  mul,
  float,
  sin,
  sub,
  normalize,
  normalLocal,
  normalGeometry,
} from "three/tsl";
import fragment from "./fragment";
import vertex from "./vertex";

init();
async function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    10,
    3000,
  );

  camera.position.z = 1000;

  // const renderer = new THREE.WebGLRenderer({ antialias: true });
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  // renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  await renderer.init();

  const control = new OrbitControls(camera, renderer.domElement);

  async function loadTex(url) {
    const texLoader = new THREE.TextureLoader();
    const texture = await texLoader.loadAsync(url);
    return texture;
  }

  function setupGeometry() {
    const wSeg = 30,
      hSeg = 30;

    //ジオメトリーを用意
    const sphere = new THREE.SphereGeometry(400, wSeg, hSeg);
    const plane = new THREE.PlaneGeometry(600, 300, wSeg, hSeg);
    // const plane = new THREE.TubeGeometry(100, 3, wSeg, hSeg, 1);
    const geometry = new THREE.BufferGeometry();

    // 平面の頂点位置
    geometry.setAttribute("plane", plane.getAttribute("position"));
    // uv情報
    geometry.setAttribute("uv", plane.getAttribute("uv"));
    // 球体の頂点位置
    geometry.setAttribute("sphere", sphere.getAttribute("position"));

    // 対角線上に詰められた遅延時間用の頂点データ
    const delayVertices = getDiagonalVertices(hSeg, wSeg, getValue, 0);
    //  printMat(delayVertices, wSeg + 1, '遅延時間行列');

    // 0~1までの値をstep毎に返す
    function getValue(previousValue, currentIndex) {
      let step = 1 / (hSeg + 1) / (wSeg + 1);
      return previousValue + step;
    }

    // 対角線上に頂点を詰めた配列を返す
    function getDiagonalVertices(hSeg, wSeg, getValue, defaultValue) {
      const hSeg1 = hSeg + 1,
        wSeg1 = wSeg + 1;
      let arry = [],
        currentValue = defaultValue;
      for (let i = 0; i < hSeg1 + wSeg1 - 1; i++) {
        for (
          let j = Math.min(hSeg1, i + 1) - 1;
          j >= Math.max(0, i - wSeg1 + 1);
          j--
        ) {
          let currentIndex = j * wSeg1 + i - j;
          currentValue = getValue(currentValue, currentIndex);
          arry[currentIndex] = currentValue;
        }
      }
      return arry;
    }

    console.log(delayVertices);

    geometry.setAttribute(
      "aDelay",
      new THREE.Float32BufferAttribute(delayVertices, 1),
    );

    return { geometry, delayVertices };
  }

  const { geometry, delayVertices } = setupGeometry();

  //各インスタンスの形状
  const instanceGeomety = new THREE.SphereGeometry(1, 8, 8);

  //球体の頂点数を取得
  const vertexCount = geometry.attributes.sphere.count;
  //平面の頂点数を取得

  //InstancedMeshを作成
  const material = new THREE.MeshBasicNodeMaterial();
  const instancedMesh = new THREE.InstancedMesh(
    instanceGeomety,
    material,
    vertexCount,
  );

  //planegeometryから頂点の位置情報を取得
  const planePositionArray = geometry.attributes.plane.array;
  //spheregeometryから頂点の位置情報を取得
  const spherePositionArray = geometry.attributes.sphere.array;
  //geometryからuv座標を取得
  const uvArray = geometry.attributes.uv.array;
  //InstancedMeshにplaneの頂点情報を格納するための配列を作成
  const instancePlanePositions = new Float32Array(vertexCount * 3);
  //InstancedMeshにsphereの頂点情報を格納するための配列を作成
  const instanceSpherePositions = new Float32Array(vertexCount * 3);
  //InstancedMeshに遅延情報を格納するための配列を作成
  const instanceDelays = new Float32Array(vertexCount);
  //InstancedMeshにuv座標を格納するための配列を作成
  const instanceUVs = new Float32Array(vertexCount * 2);

  for (let i = 0; i < vertexCount; i++) {
    //元の球体のi番目の頂点のx座標をinstanceMeshのi番目の頂点のx座標に代入
    instanceSpherePositions[i * 3] = spherePositionArray[i * 3];
    //元の球体のi番目の頂点のy座標をinstanceMeshのi番目の頂点のy座標に代入
    instanceSpherePositions[i * 3 + 1] = spherePositionArray[i * 3 + 1];
    //元の球体のi番目の頂点のz座標をinstanceMeshのi番目の頂点のz座標に代入
    instanceSpherePositions[i * 3 + 2] = spherePositionArray[i * 3 + 2];

    //元の平面のi番目の頂点のx座標をinstanceMeshのi番目の頂点のx座標に代入
    instancePlanePositions[i * 3] = planePositionArray[i * 3];
    //元の平面のi番目の頂点のy座標をinstanceMeshのi番目の頂点のy座標に代入
    instancePlanePositions[i * 3 + 1] = planePositionArray[i * 3 + 1];
    //元の平面のi番目の頂点のz座標をinstanceMeshのi番目の頂点のz座標に代入
    instancePlanePositions[i * 3 + 2] = planePositionArray[i * 3 + 2];

    //元の球体のi番目の頂点の遅延情報をinstanceMeshのi番目の頂点の遅延情報に代入
    instanceDelays[i] = delayVertices[i];

    //uv情報を代入
    instanceUVs[i * 2] = uvArray[i * 2];
    instanceUVs[i * 2 + 1] = uvArray[i * 2 + 1];
  }

  //instancedMeshのattibuteに頂点情報を格納
  instancedMesh.geometry.setAttribute(
    "instancePlanePosition",
    new THREE.InstancedBufferAttribute(instancePlanePositions, 3), //
  );
  instancedMesh.geometry.setAttribute(
    "instanceSpherePosition",
    new THREE.InstancedBufferAttribute(instanceSpherePositions, 3),
  );
  instancedMesh.geometry.setAttribute(
    "instanceDelay",
    new THREE.InstancedBufferAttribute(instanceDelays, 1),
  );

  instancedMesh.geometry.setAttribute(
    "instanceUV",
    new THREE.InstancedBufferAttribute(instanceUVs, 2),
  );

  console.log(instancedMesh);

  // Uniform
  const uTex = await loadTex("/img/output1.jpg");
  const uTick = uniform(0);
  const uProgress = uniform(0);
  const uPointSize = uniform(5.0);
  const uSaturation = uniform(0.7);
  const uLightness = uniform(0.67);
  const uColorTime = uniform(0.05);
  const uColorDelay = uniform(3.3);
  const uScaleTime = uniform(0.04);
  const uScaleDelay = uniform(4);

  // instanceMeshのattributeの取得
  const aInstancePlanePosition = attribute("instancePlanePosition");
  const aInstanceSpherePosition = attribute("instanceSpherePosition");
  const aInstanceDelay = attribute("instanceDelay");
  const aInstanceUV = attribute("instanceUV");

  // instancedMeshそのもののuv
  const vUv = uv();

  // シェーダーjsに渡すオプション（vBasePositionとして渡す）
  const options = {
    vUv,
    uDelay: aInstanceDelay, // vertex.jsではuDelayという名前を想定
    aPlanePosition: aInstancePlanePosition,
    aSpherePosition: aInstanceSpherePosition,
    aInstanceUV,
    uTex,
    uProgress,
    uTick,
    uPointSize,
    uSaturation,
    uLightness,
    uColorTime,
    uColorDelay,
  };
  // カスタム頂点シェーダー
  const customVertex = Fn(() => {
    //vertex関数で変形後の頂点位置を計算
    const transformedInstancePos = vertex(options);

    //小さな球体のローカル位置
    const localPos = positionLocal;

    // 頂点のサイズを適用
    const scaledLocalPos = mul(localPos, uPointSize).toVar();

    const delta = float(
      sin(sub(mul(uTick, uScaleTime), mul(aInstanceUV.y, uScaleDelay)))
        .mul(0.5)
        .add(0.5),
    );

    // 頂点のサイズを時間に応じて変形
    // scaledLocalPos.assign(mul(scaledLocalPos, delta));

    const finalPos = add(transformedInstancePos, scaledLocalPos);

    // const normalPos = add(finalPos, mul(50, delta, normal));

    return finalPos;
  })();

  material.positionNode = customVertex;

  const color = fragment(options);
  material.colorNode = color;

  // 透明度を有効化（必要に応じて）
  material.transparent = true;
  material.depthWrite = false;

  scene.add(instancedMesh);

  // 軸ヘルパー
  const axis = new THREE.AxesHelper(300);
  scene.add(axis);

  // lil gui
  const gui = new GUI();
  const folder1 = gui.addFolder("Color");
  folder1.open();

  folder1.add(uPointSize, "value", 1, 20, 0.1).name("pointSize").listen();
  folder1.add(uSaturation, "value", 0, 1, 0.01).name("saturation").listen();
  folder1.add(uLightness, "value", 0, 1, 0.01).name("lightness").listen();
  folder1.add(uColorDelay, "value", 0, 100, 1).name("colorDelay").listen();
  folder1.add(uColorTime, "value", 0.001, 1, 0.001).name("colorTime").listen();
  folder1.add(uProgress, "value", 0, 1, 0.01).name("progess").listen();
  const datObj = { next: !!uProgress.value };
  gui
    .add(datObj, "next")
    .name("Animate")
    .onChange(() => {
      gsap.to(uProgress, {
        duration: 2,
        value: datObj.next ? 1 : 0,
        ease: "power2.out",
      });
    });

  const folder2 = gui.addFolder("Scale");
  folder2.open();

  folder2.add(uScaleDelay, "value", 0, 10, 1).name("scaleDelay").listen();
  folder2.add(uScaleTime, "value", 0.001, 1, 0.001).name("scaleTime").listen();

  function animate() {
    requestAnimationFrame(animate);

    control.update();

    uTick.value++;

    renderer.render(scene, camera);
  }

  animate();
}

function printMat(targetMatrix, col = 4, label = "") {
  const mat1D = targetMatrix?.elements ?? targetMatrix?.array ?? targetMatrix;
  console.log(mat1D);
  if ((!mat1D) instanceof Array) return;
  setTimeout(() => {
    // 非同期でマトリクスが更新されるため、非同期で実行
    let mat2D = mat1D.reduce((arry2D, v, i) => {
      if (i % col === 0) {
        arry2D.push([]);
      }
      const lastArry = arry2D[arry2D.length - 1];
      lastArry.push(v);
      return arry2D;
    }, []);
    console.log(
      `%c${label}`,
      "font-size: 1.3em; color: red; background-color: #e4e4e4;",
    );
    console.table(mat2D);
  });
}
