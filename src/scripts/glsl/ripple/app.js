/**
 * Three.js
 * https://threejs.org/
 */
import * as THREE from "three/webgpu";
import { Mesh } from "three";
import { pass, texture, uv, vec4 } from "three/tsl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { initRipplePass } from "./pass";

(async () => {
  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    -window.innerWidth / 2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    -window.innerHeight / 2,
    -window.innerHeight,
    window.innerHeight,
  );

  camera.position.z = 10;

  const renderer = new THREE.WebGPURenderer({ antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor(0x000000);

  document.body.appendChild(renderer.domElement);

  await renderer.init();

  const controls = new OrbitControls(camera, renderer.domElement);

  async function loadTex(url) {
    const texLoader = new THREE.TextureLoader();
    const texture = await texLoader.loadAsync(url);
    return texture;
  }

  /**
   * box作成
   */
  const boxGeo = new THREE.BoxGeometry(300, 300, 300);
  const material = new THREE.MeshBasicNodeMaterial();

  //シェーダー設定
  const boxUV = uv();
  const color = vec4(boxUV, 1.0, 1.0);
  material.colorNode = color;

  //メッシュ化
  const box = new THREE.Mesh(boxGeo, material);

  /**
   * 画像作成
   */
  const imgGeo = new THREE.PlaneGeometry(480, 270);
  const imgMate = new THREE.MeshBasicNodeMaterial();

  const tex = await loadTex("/img/output1.jpg");
  const planeUV = uv();
  const imgTex = texture(tex, planeUV);

  imgMate.colorNode = imgTex;

  const img = new THREE.Mesh(imgGeo, imgMate);

  box.position.x = -200;
  img.position.x = 200;
  scene.add(box, img);

  const { getTexture, rippleEffect, renderRipple, onMouseMove } =
    await initRipplePass();
  renderer.domElement.addEventListener("mousemove", onMouseMove);

  /**
   * custom shaderを使用したポストプロセス
   */
  const postProcessing = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const ripplepass = rippleEffect(scenePassColor);
  postProcessing.outputNode = ripplepass;

  function animate() {
    requestAnimationFrame(animate);
    renderRipple(renderer);
    postProcessing.render();
    controls.update();
  }

  animate();
})();
