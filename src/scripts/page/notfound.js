import {
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  CanvasTexture,
  Color
} from "three/webgpu";
import {
  Fn,
  uv,
  texture,
  vec4,
  vec2,
  mul,
  add,
  sub,
  sin,
  fract,
  step,
  uniform,
  float,
} from "three/tsl";
import { utils } from "#/helper/utils";

export default async function init({ world, mouse, loader, viewport, scroller }) {
  // 背景色
  world.renderer.setClearColor(0x050505, 1);

  // ── 3D テキストメッシュ「404」 ──
  const textCanvas = document.createElement("canvas");
  textCanvas.width = 2048;
  textCanvas.height = 1024;
  const ctx = textCanvas.getContext("2d");
  ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  
  // フォントサイズを大きくし、グロー効果（シャドウ）を追加して視認性を上げる
  ctx.font = "bold 600px 'Orbitron', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // アクセントカラー（オレンジ）を使用
  ctx.fillStyle = "#ed9723";
  ctx.shadowColor = "#ed9723";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.fillText("404", textCanvas.width / 2, textCanvas.height / 2);

  const textTexture = new CanvasTexture(textCanvas);

  // viewportの幅に比例した大きなサイズにする（例として幅の80%程度）
  const planeWidth = viewport.width > 768 ? viewport.width * 0.6 : viewport.width * 0.8;
  const planeHeight = planeWidth * 0.5; // Canvasのアスペクト比(2048:1024 = 2:1)に合わせる
  const geometry = new PlaneGeometry(planeWidth, planeHeight, 1, 1);
  
  const material = new MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    depthTest: false,
  });

  const textMesh = new Mesh(geometry, material);
  textMesh.position.z = 0; // 基準位置に置く
  world.scene.add(textMesh);

  // ── 浮遊デブリ ──
  const debris = [];
  const debrisGeo = new PlaneGeometry(0.3, 0.04);
  const debrisMat = new MeshBasicMaterial({ color: 0xed9723, transparent: true, opacity: 0.6 });
  
  const rangeX = viewport.width * 1.5;
  const rangeY = viewport.height * 1.5;
  
  for (let i = 0; i < 80; i++) {
    const m = new Mesh(debrisGeo, debrisMat.clone());
    m.material.opacity = 0.2 + Math.random() * 0.6;
    m.position.set(
      (Math.random() - 0.5) * rangeX,
      (Math.random() - 0.5) * rangeY,
      (Math.random() - 0.5) * 8 - 4
    );
    m.rotation.z = Math.random() * Math.PI * 2;
    m.scale.x = 0.5 + Math.random() * 2;
    m.userData = {
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.01,
      vr: (Math.random() - 0.5) * 0.01,
    };
    world.scene.add(m);
    debris.push(m);
  }

  // ── ポストプロセス用 uniform ──
  const uTime = uniform(0);
  const uGlitchStrength = uniform(0);

  // ── グリッチ・ポストプロセスエフェクト ──
  const glitchEffect = (sceneColorNode) => {
    return Fn(() => {
      const vUv = uv();
      const time = uTime;
      const strength = uGlitchStrength;

      // ブロックノイズ: Y方向にバンドを走らせる
      const blockNoise = utils.noise2(
        vec2(
          mul(fract(mul(time, 3.7)), 100.0),
          mul(vUv.y, 12.0)
        )
      );

      // ブロックバンドのマスク（ノイズがしきい値を超えたエリアだけグリッチ）
      const bandMask = step(0.6, blockNoise);

      // RGBシフト量 = バンドマスク × 強度 × 基本量
      const shiftAmount = mul(bandMask, strength, 0.08);

      // RGBそれぞれを水平方向にずらしてサンプリング
      const rUv = add(vUv, vec2(shiftAmount, 0.0));
      const bUv = sub(vUv, vec2(shiftAmount, 0.0));

      const r = texture(sceneColorNode, rUv).r;
      const g = texture(sceneColorNode, vUv).g;
      const b = texture(sceneColorNode, bUv).b;

      // スキャンライン
      const scanline = mul(sin(add(mul(vUv.y, 400.0), mul(time, 20.0))), 0.03);

      // 全体を少しずらすジッター（強度に応じて）
      const jitterUv = add(vUv, vec2(mul(strength, mul(sin(mul(time, 100.0)), 0.01)), 0.0));
      const jittered = texture(sceneColorNode, jitterUv);

      // グリッチしない部分は元の色、する部分はRGBシフト色
      const glitchColor = vec4(
        sub(r, scanline),
        sub(g, scanline),
        sub(b, scanline),
        1.0
      );

      // bandMaskでブレンド
      const finalR = add(mul(sub(1.0, bandMask), jittered.r), mul(bandMask, glitchColor.r));
      const finalG = add(mul(sub(1.0, bandMask), jittered.g), mul(bandMask, glitchColor.g));
      const finalB = add(mul(sub(1.0, bandMask), jittered.b), mul(bandMask, glitchColor.b));

      return vec4(finalR, finalG, finalB, 1.0);
    })();
  };

  // ポストプロセスに登録
  if(world.addPass) {
      world.addPass(glitchEffect);
  }

  // ── JS側の毎フレーム更新 ──
  let glitchTimer = 0;
  let isGlitching = false;
  let glitchDuration = 0;
  const initScale = textMesh.scale.x;
  const anchor = document.getElementById("notfound-anchor");

  const update = () => {
    const t = world.clock.getElapsedTime();
    const dt = world.clock.getDelta();
    uTime.value = t;

    // ── グリッチの発生ロジック（ランダムに断続的に激しくなる） ──
    glitchTimer += dt;
    if (!isGlitching) {
      // 通常時: ベースの弱いグリッチ（視認性確保のため弱めに設定）
      uGlitchStrength.value = 0.08 + Math.sin(t * 3.0) * 0.05;
      // 一定間隔でランダムに強いグリッチを発生
      if (glitchTimer > 2.0 + Math.random() * 4.0) {
        isGlitching = true;
        glitchDuration = 0.1 + Math.random() * 0.4;
        glitchTimer = 0;
      }
    } else {
      // グリッチ発動中: 強い値を設定
      uGlitchStrength.value = 0.6 + Math.random() * 0.4;
      if (glitchTimer > glitchDuration) {
        isGlitching = false;
        glitchTimer = 0;
      }
    }

    // アンカー要素からWebGLでのY座標を算出（スムーズスクロールに追従）
    const anchorRect = anchor ? anchor.getBoundingClientRect() : { top: window.innerHeight * 0.45 };
    const targetY = (window.innerHeight / 2 - anchorRect.top) * (viewport.height / window.innerHeight);

    // ── テキストメッシュのアニメーション ──
    textMesh.position.y = targetY + Math.sin(t * 1.5) * 0.15;
    textMesh.rotation.z = Math.sin(t * 1.0) * 0.015;
    
    // グリッチ時はテキストも激しくブレる
    if (isGlitching) {
      textMesh.position.x = (Math.random() - 0.5) * (viewport.width * 0.02);
      textMesh.position.y = targetY + (Math.random() - 0.5) * (viewport.width * 0.01);
      textMesh.scale.x = initScale + (Math.random() - 0.5) * 0.1;
    } else {
      textMesh.position.x *= 0.9; // 元に戻す
      textMesh.scale.x = initScale;
    }

    // ── デブリのアニメーション ──
    debris.forEach(m => {
      m.position.x += m.userData.vx;
      m.position.y += m.userData.vy;
      m.rotation.z += m.userData.vr;
      
      if (m.position.x > 12) m.position.x = -12;
      if (m.position.x < -12) m.position.x = 12;
      if (m.position.y > 7) m.position.y = -7;
      if (m.position.y < -7) m.position.y = 7;
    });
  };

  world.addRenderAction(update);
}
