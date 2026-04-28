import gsap from "gsap";
import { INode } from "../helper";

const menu = {
  init,
};

let world = null,
  scroller = null,
  isOpen = false,
  clickTl = null;
const DOM = {};

function init(_world, _scroller) {
  world = _world;
  scroller = _scroller;

  DOM.container = INode.getElement("#globalContainer");
  DOM.btn = INode.getElement(".js_hamburger");
  DOM.wraps = INode.qsAll(".js_hamburger_wrap");
  DOM.bars = INode.qsAll(".js_hamburger_bar");
  DOM.page = INode.getElement("#pageContainer");

  // メニュークリック時のタイムライン
  clickTl = _createClickTl();

  _bindEvents();
}

function _bindEvents() {
  DOM.btn.addEventListener("pointerdown", () => {
    toggle();
  });
  DOM.btn.addEventListener("mouseenter", () => {
    enter();
  });
}

function _toggleMeshVisibility(_isOpen) {
  //メッシュの取得
  const fvText = world.getObjByEl(".bl_fv_shader");

  //メッシュの表示/非表示を切り替える
  fvText.mesh.visible = _isOpen;
}

function _createClickTl() {
  const tl = gsap.timeline({
    paused: true,
    defaults: {
      duration: 0.2,
    },
  });

  tl.to(
    DOM.wraps[0],
    {
      y: 0,
      rotateZ: 225,
    },
    0,
  )
    .to(
      DOM.wraps[1],
      {
        x: "-1em",
        opacity: 0,
      },
      0,
    )
    .to(
      DOM.wraps[2],
      {
        y: 0,
        rotateZ: -45,
      },
      0,
    )
    .to(DOM.page, {
      opacity: 0,
      duration: 0.1,
    });

  return tl;
}

function toggle() {
  DOM.container.classList.toggle("js_menu_open");
  if (isOpen) {
    setTimeout(() => {
      _toggleMeshVisibility(true);
      clickTl.reverse();
      scroller.paused(false);
    }, 600);
  } else {
    setTimeout(() => {
      _toggleMeshVisibility(false);
      scroller.paused(true);
    }, 100);
    clickTl.play();
  }

  // 開閉状態を反転
  isOpen = !isOpen;
}

function enter() {
  const tl = gsap.timeline({
    defaults: {
      stagger: 0.1,
      duration: 0.1,
    },
  });

  tl.set(DOM.bars, {
    transformOrigin: "right",
  })
    .to(DOM.bars, {
      scaleX: 0,
    })
    .set(DOM.bars, {
      transformOrigin: "left",
    })
    .to(DOM.bars, {
      scaleX: 1,
    });
}
export default menu;
