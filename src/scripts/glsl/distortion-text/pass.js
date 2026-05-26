import { uv, uniform, vec4 } from "three/tsl";
import Fragment from "./fragment";

function initDistortionPass(world) {
  const o = world.getObjByEl(".bl_loadPP");
  if (!o) return;

  // ポストプロセス用のエフェクト関数を定義 (通常のJS関数として引数を受け取る)
  const distortionEffect = (scenePass) => {
    return Fragment({
      vUv: uv(),
      uniforms: {
        ...o.uniforms,
        uParam: uniform(vec4(6, 6, 1, 1)),
        tDiffuse: scenePass, // 画面全体のカラーバッファ（または前段のパスの出力）を渡す
      },
    });
  };

  // ポストプロセスに登録
  world.addPass(distortionEffect);
}

export { initDistortionPass };
