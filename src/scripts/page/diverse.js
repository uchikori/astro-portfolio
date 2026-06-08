let world = null;
let mouse = null;
let menu = null;
let loader = null;
let viewport = null;
let scroller = null;
let particles = null;
let planeToSphere = null;

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

  world.addRaycastingTarget("#planeToSphere");

  // Objの取得
  particles = world.getObjByEl("#particles");
  planeToSphere = world.getObjByEl("#planeToSphere");

  if (planeToSphere) {
    // planeToSphere.fixed = true;
  }

  // 1フレーム遅らせて初期表示を設定（afterInitの非表示設定を上書き）
  requestAnimationFrame(() => {
    if (particles) {
      if (particles.uniforms && particles.uniforms.uProgress) {
        particles.uniforms.uProgress.value = 0.5;
      }
      if (particles.mesh) {
        particles.mesh.visible = true;
      }
      if (particles.DOM && particles.DOM.el) {
        particles.DOM.el.nextElementSibling?.remove();
      }
    }
  });

  // addLoadingAnimationは同期的に実行しないと、bootstrap.js内のloader.letsBegin()に間に合わないため外に出します
  loader.addLoadingAnimation(loadAnimation);
}

function loadAnimation(tl) {
  tl.set(
    {},
    {
      onComplete() {
        // particles.uniforms.uProgress.value = 0.5;
        if (particles && typeof particles.goTo === "function") {
          particles.goTo(0, 0.3);
        }
      },
    },
  );
}
