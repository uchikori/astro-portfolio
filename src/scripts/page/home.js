import {
  mountNavBtnHandler,
  mountReflectBtnHandler,
} from "../component/slide-hundler";
import { initDistortionPass } from "../glsl/distortion-text/pass";
import { initRipplePass } from "../glsl/ripple";

export default async function ({
  world,
  mouse,
  menu,
  loader,
  viewport,
  scroller,
}) {
  // each page
  mountNavBtnHandler(
    ".bl_fv_slider",
    ".bl_fv .js_navBtn__prev",
    ".bl_fv .js_navBtn__next",
    ".bl_fv_shader",
  );

  mountReflectBtnHandler(
    ".bl_reflect_slider",
    ".bl_reflect .js_navBtn__prev",
    ".bl_reflect .js_navBtn__next",
    ".bl_reflect_ul",
  );

  // mountScrollHandler(".bl_reflect_slider", ".bl_reflect", ".bl_reflect_ul");
  loader.addLoadingAnimation(loadAnimation);

  function loadAnimation(tl) {
    // エレメントを取得
    const heroObject = world.getObjByEl(".js_hero_object");
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
          await initRipplePass(world, mouse);
          // ロード完了後にマウスパーティクルを追加
          // await initMouseParticles(world, mouse);
        },
      },
      "<",
    )
      .to(
        heroObject.mesh.position,
        {
          z: 0,
          duration: 2,
          ease: "power3.out",
        },
        "<",
      )
      // 回転アニメーション
      .to(
        animateTarget.rotation,
        {
          y: startY + Math.PI * 2,
          duration: 1,
          ease: "power3.out",
        },
        "<",
      );
  }
}
