import { initDistortionPass } from "#/glsl/distortion-text/pass";
import { initMouseParticles } from "#/glsl/mouse-particles";
import { initRipplePass } from "#/glsl/ripple";

let world = null;
let mouse = null;
let menu = null;
let loader = null;
let viewport = null;
let scroller = null;

export default async function ({
  world: _world,
  mouse: _mouse,
  menu: _menu,
  loader: _loader,
  viewport: _viewport,
  scroller: _scroller,
}) {
  world = _world;
  mouse = _mouse;
  menu = _menu;
  loader = _loader;
  viewport = _viewport;
  scroller = _scroller;

  world.addRaycastingTarget(".bl_bg");

  // each page

  // heroObjectを固定
  // heroObject.fixed = true;

  // mountScrollHandler(".bl_reflect_slider", ".bl_reflect", ".bl_reflect_ul");
  loader.addLoadingAnimation(loadAnimation);
  initTocAccordion();
}

function initTocAccordion() {
  const containers = document.querySelectorAll("#ez-toc-container");
  containers.forEach((container) => {
    const title = container.querySelector(".ez-toc-title-container");
    const list = container.querySelector("nav") || container.querySelector("ul");
    if (!title || !list) return;

    // Wrap list in a grid-transition element
    const wrapper = document.createElement("div");
    wrapper.style.display = "grid";
    wrapper.style.gridTemplateRows = "0fr";
    wrapper.style.transition = "grid-template-rows 0.3s ease, margin-top 0.3s ease";
    
    const inner = document.createElement("div");
    inner.style.overflow = "hidden";
    
    list.parentNode.insertBefore(wrapper, list);
    wrapper.appendChild(inner);
    inner.appendChild(list);

    title.addEventListener("click", () => {
      container.classList.toggle("is-open");
      if (container.classList.contains("is-open")) {
        wrapper.style.gridTemplateRows = "1fr";
        wrapper.style.marginTop = "24px";
      } else {
        wrapper.style.gridTemplateRows = "0fr";
        wrapper.style.marginTop = "0px";
      }
    });
  });
}

function loadAnimation(tl) {
  // エレメントを取得
  const heroObject = world.getObjByEl(".bl_bg");
  const distortion = world.getObjByEl(".bl_loadPP");
  if (!heroObject || !distortion) return;

  // RenderTarget内の3Dモデルを取得
  let targetModel = null;
  if (heroObject.targetInfo) {
    heroObject.targetInfo.scene.traverse((obj) => {
      if (obj.isGroup && obj.name.includes("Scene")) {
        targetModel = obj;
      }
    });
  }

  // レンダーターゲット内のモデルがあればそれを、なければmesh自体を回転させる
  const animateTarget = targetModel || heroObject.mesh;
  if (!animateTarget) return;

  const startY = animateTarget.rotation.y;

  // 手前（z軸プラス方向）の初期値を設定（ニアクリップを考慮して400）
  heroObject.mesh.position.z = 500;

  const { removePass, setProgress } = initDistortionPass(world);
  const distortionProgress = { value: 0 };

  // z位置を0に戻すアニメーション
  tl.to(
    distortionProgress,
    {
      value: 1,
      duration: 1,
      ease: "power3.out",
      onUpdate: () => {
        setProgress(distortionProgress.value);
      },
      onComplete: async () => {
        removePass();
        // ロード完了後にリプルエフェクトを追加
        await initRipplePass(world, mouse, viewport);
        // ロード完了後にマウスパーティクルを追加
        // await initMouseParticles(world, mouse);
      },
    },
    "<",
  ).to(
    heroObject.mesh.position,
    {
      z: 0,
      duration: 2,
      ease: "power3.out",
    },
    "<",
  );
}
