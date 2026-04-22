import {
  Color,
  InstancedMesh,
  MeshBasicNodeMaterial,
  DynamicDrawUsage,
  Object3D,
  Vector3,
  PlaneGeometry,
  AdditiveBlending,
  InstancedBufferAttribute,
  Scene,
  OrthographicCamera,
  RenderTarget,
} from "three/webgpu";
import { Fn, vec4, uv, vec3, add, time, float, attribute, texture } from "three/tsl";

class ParticleSystem {
  constructor(count = 500) {
    this.count = count;
    this.geometry = new PlaneGeometry(1, 1);

    this.material = new MeshBasicNodeMaterial({
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.material.colorNode = Fn(() => {
      const vUv = uv();
      const dist = vUv.sub(0.5).length();
      const instanceAlpha = attribute("aAlpha");

      const glow = float(1.0).sub(dist.mul(2.0)).pow(3.0);
      const t = time.mul(0.5);
      const color = vec3(
        t.sin().add(1.5).mul(0.5),
        t.mul(0.7).cos().add(1.5).mul(0.5),
        t.mul(1.3).sin().add(1.5).mul(0.5),
      );

      return vec4(color, glow.mul(instanceAlpha));
    })();

    this.mesh = new InstancedMesh(this.geometry, this.material, count);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);

    this.alphas = new Float32Array(count);
    this.geometry.setAttribute("aAlpha", new InstancedBufferAttribute(this.alphas, 1));

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        position: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        life: 0,
        maxLife: 1,
        scale: 0,
        rotation: 0,
      });
    }

    this.dummy = new Object3D();
  }

  spawn(x, y, isHover = false) {
    const p = this.particles.find((p) => p.life <= 0);
    if (p) {
      // ホバー時は拡散範囲を広げる
      const jitter = isHover ? 40 : 15;
      p.position.set(
        x + (Math.random() - 0.5) * jitter,
        y + (Math.random() - 0.5) * jitter,
        0,
      );

      const angle = Math.random() * Math.PI * 2;
      // ホバー時は速度をアップ
      const speed = isHover ? Math.random() * 6 + 2 : Math.random() * 3 + 1;
      p.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);

      // ホバー時は寿命を少し延ばす
      p.maxLife = isHover ? Math.random() * 0.5 + 0.4 : Math.random() * 0.3 + 0.3;
      p.life = p.maxLife;

      // ホバー時はサイズを大きく
      p.scale = isHover ? Math.random() * 40 + 20 : Math.random() * 25 + 10;
      p.rotation = Math.random() * Math.PI * 2;
    }
  }

  update(delta) {
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= delta;
        p.position.add(p.velocity.clone().multiplyScalar(delta * 60));
        p.velocity.multiplyScalar(0.94); // 減速を少し強めて霧のように留まらせる
        p.rotation += delta * 3;

        const lifeRatio = p.life / p.maxLife;
        const currentScale = p.scale * lifeRatio;

        this.dummy.position.copy(p.position);
        this.dummy.rotation.z = p.rotation;
        this.dummy.scale.set(currentScale, currentScale, 1);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        this.alphas[i] = lifeRatio * 0.8; // 最大不透明度を少し抑える
      } else {
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        this.alphas[i] = 0;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.geometry.attributes.aAlpha.needsUpdate = true;
  }

  debug(folder) {
    folder.add(this.mesh, "visible").name("Visible");
    folder.add(this.material, "opacity", 0, 1).name("Opacity");
  }
}

async function initMouseParticles(world, mouseObj) {
  const scene = new Scene();
  const camera = new OrthographicCamera(
    -window.innerWidth / 2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    -window.innerHeight / 2,
    -100,
    100
  );
  camera.position.z = 10;

  const rt = new RenderTarget(window.innerWidth, window.innerHeight);
  const particles = new ParticleSystem(800); // 密度を上げるため数を増加
  scene.add(particles.mesh);

  // 遅延追従用の座標
  const lerpPos = { x: 0, y: 0 };
  const targetPos = { x: 0, y: 0 };

  mouseObj.addMouseMoveAction((mouse, event) => {
    targetPos.x = event.clientX - window.innerWidth / 2;
    targetPos.y = -event.clientY + window.innerHeight / 2;
  });

  // レンダリング処理
  function renderParticles(renderer) {
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  }
  world.addRenderAction(renderParticles);

  // ホバー状態の管理
  let isHover = false;
  window.addEventListener("pointerover", (e) => {
    const target = e.target;
    if (target.closest("a, button, [data-hover]")) {
      isHover = true;
    } else {
      isHover = false;
    }
  });

  // 毎フレームのデータ更新とスポーン
  world.addRenderAction((renderer, tick, delta) => {
    // マウス位置への遅延追従 (Lerp)
    lerpPos.x += (targetPos.x - lerpPos.x) * 0.15;
    lerpPos.y += (targetPos.y - lerpPos.y) * 0.15;

    // マウスが動いている間、継続的にスポーン
    const dist = Math.hypot(targetPos.x - lerpPos.x, targetPos.y - lerpPos.y);
    if (dist > 1) {
      // ホバー時は発生数を増やす
      const spawnCount = isHover ? 15 : 8;
      for (let i = 0; i < spawnCount; i++) {
        particles.spawn(lerpPos.x, lerpPos.y, isHover);
      }
    }

    particles.update(delta);
  });

  // ポストプロセス
  const particleEffect = (scenePass) => {
    const vUv = uv();
    const particleColor = texture(rt.texture, vUv);
    return add(scenePass, particleColor);
  };

  world.addPass(particleEffect);

  if (window.debug) {
    import("../../helper/gui").then(({ gui }) => {
      gui.add((lilGUI) => {
        const folder = lilGUI.addFolder("MouseParticles");
        particles.debug(folder);
      });
    });
  }

  return particles;
}

export { initMouseParticles };
