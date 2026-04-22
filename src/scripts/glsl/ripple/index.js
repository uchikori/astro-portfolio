/**
 * Three.js
 * https://threejs.org/
 */
import {
  Color,
  MeshBasicNodeMaterial,
  OrthographicCamera,
  PlaneGeometry,
  PostProcessing,
  RenderTarget,
  Scene,
  TextureLoader,
} from "three/webgpu";
import { Mesh } from "three";
import { add, Fn, log, mul, pass, texture, uniform, uv } from "three/tsl";
import { viewport } from "../../helper";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class Ripple {
  constructor(tex, vp) {
    const ripple = { width: vp.width / 10, height: vp.height / 10 };

    this.geo = new PlaneGeometry(ripple.width, ripple.height);
    this.material = new MeshBasicNodeMaterial({
      transparent: 1,
      map: tex,
    });
    this.mesh = new Mesh(this.geo, this.material);

    this.mesh.visible = false;
    this.isUsed = false;
  }

  start(mouse) {
    const { mesh, material } = this;
    this.isUsed = true;
    mesh.visible = true;

    mesh.position.x = mouse.x;
    mesh.position.y = mouse.y;

    mesh.scale.x = mesh.scale.y = 0.2;
    material.opacity = 0.8;
    mesh.rotation.z = 2 * Math.PI * Math.random();

    this.animate();
  }

  animate() {
    const { mesh, material } = this;
    mesh.scale.x = mesh.scale.y = mesh.scale.x + 0.07;
    material.opacity *= 0.97;
    mesh.rotation.z += 0.003;

    if (material.opacity <= 0.01) {
      // ループ終了
      this.isUsed = false;
      mesh.visible = false;
    } else {
      requestAnimationFrame(() => {
        this.animate();
      });
    }
  }
}

async function initRipplePass(world, mouseObj) {
  const scene = new Scene();
  scene.background = new Color(0x000000);

  const vp = {
    width: viewport.width / 10,
    height: viewport.height / 10,
  };

  const camera = new OrthographicCamera(
    -vp.width / 2,
    vp.width / 2,
    vp.height / 2,
    -vp.height / 2,
    -0,
    2,
  );

  camera.position.z = 1;

  const rt = new RenderTarget();

  rt.setSize(vp.width, vp.height);

  // const controls = new OrbitControls(camera, renderer.domElement);

  async function loadTex(url) {
    const texLoader = new TextureLoader();
    const texture = await texLoader.loadAsync(url);
    return texture;
  }
  const tex = await loadTex("/img/disps/ripple.png");

  //ripple複製
  const rippleCount = 50;
  const ripples = [];
  for (let i = 0; i < rippleCount; i++) {
    const ripple = new Ripple(tex, vp);
    scene.add(ripple.mesh);
    ripples.push(ripple);
  }

  //マウスアクションにコールバック関数を登録
  mouseObj.addMouseMoveAction(onMouseMove);

  // マウスイベント
  function onMouseMove(mouse, event) {
    // ((mouse.x = event.clientX - window.innerWidth / 2),
    //   (mouse.y = -event.clientY + window.innerHeight / 2));

    const position = mouse.getMapPos(vp.width, vp.height);

    //frameごとに加算されるmouse.tickを5で割り、余りが0のタイミング
    if (mouse.tick % 5 === 0) {
      //ripples配列の中からisUsed=falseの最初のrippleを探す
      const _ripple = ripples.find((ripple) => {
        return !ripple.isUsed;
      });

      //isUsed=falseのrippleが見つからなければ何も処理しない
      if (!_ripple) {
        return;
      }

      _ripple.start(position);
    }
  }

  function renderRipple(_renderer) {
    _renderer.setRenderTarget(rt);
    _renderer.render(scene, camera);
    _renderer.setRenderTarget(null);

    // mouseObj.tick++;
  }

  function getTexture() {
    return rt.texture;
  }

  // 毎フレームのデータ更新
  // world.addUpdate(renderRipple);
  world.addRenderAction(renderRipple);
  // ポストプロセス
  const rippleEffect = Fn(([scenePass]) => {
    const vUv = uv();
    const texRipple = rt.texture;

    const ripple = texture(texRipple, vUv);

    const rippleUv = add(vUv, mul(ripple.r, 0.1));

    const color = texture(scenePass, rippleUv);

    return color;
  });

  world.addPass(rippleEffect);

  return {
    rt,
    getTexture,
  };
}

export { initRipplePass };
