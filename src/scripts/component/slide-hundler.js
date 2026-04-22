import gsap from "gsap";
import world from "../glsl/world";
import { INode } from "../helper";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function mountNavBtnHandler(
  sliderSelector,
  prevBtnSelector,
  nextBtnSelector,
  textSelector,
) {
  const prevEl = INode.getElement(prevBtnSelector);
  const nextEl = INode.getElement(nextBtnSelector);

  const slider = world.getObjByEl(sliderSelector);
  const text = world.getObjByEl(textSelector);

  if (!prevEl || !nextEl || !slider || !text) return;

  function goTo(idx) {
    slider.goTo(idx);
    text.goTo(idx);
  }

  prevEl.addEventListener("click", () => {
    const idx = slider.activeSlideIdx - 1;
    goTo(idx);
  });

  nextEl.addEventListener("click", () => {
    const idx = slider.activeSlideIdx + 1;
    goTo(idx);
  });
}

function mountReflectBtnHandler(
  sliderSelector,
  prevBtnSelector,
  nextBtnSelector,
  textSelector,
) {
  const prevEl = INode.getElement(prevBtnSelector);
  const nextEl = INode.getElement(nextBtnSelector);

  const slider = world.getObjByEl(sliderSelector);
  const slideUl = INode.getElement(textSelector);

  if (!prevEl || !nextEl || !slider || !slideUl) return;

  const slideList = [...slideUl.children];

  let translateX = 50;
  let currentIdx = 0;

  slideList.forEach((slide, i) => {
    slide.style.transform = `translateX(-${i * translateX}px)`;
  });

  function goTo(idx) {
    slider.goTo(idx);
    // 新しいスライドを表示
    slideList[idx].style.opacity = 1;
    // 前のスライドを非表示
    if (currentIdx !== idx) {
      slideList[currentIdx].style.opacity = 0;
    }

    // 文字列の移動
    slideUl.style.transform = `translateX(${idx * translateX}px)`;

    currentIdx = idx;
  }

  prevEl.addEventListener("click", () => {
    let idx = slider.activeSlideIdx - 1;
    idx = (slideList.length + idx) % slideList.length;
    console.log(idx);

    goTo(idx);
  });

  nextEl.addEventListener("click", () => {
    let idx = slider.activeSlideIdx + 1;
    idx = idx % slideList.length;
    console.log(idx);

    goTo(idx);
  });
}

function mountScrollHandler(sliderSelector, triggerSelector, textSelector) {
  const slider = world.getObjByEl(sliderSelector);
  const slideUl = INode.getElement(textSelector);

  if (!slider || !slideUl) return;

  const slideList = [...slideUl.children];

  let translateX = 50;
  let currentIdx = 0;

  slideList.forEach((slide, i) => {
    slide.style.transform = `translateX(${i * translateX}px)`;
  });

  function goTo(idx) {
    slider.goTo(idx);

    // 新しいスライドを表示
    slideList[idx].style.opacity = 1;
    // 前のスライドを非表示
    if (currentIdx !== idx) {
      slideList[currentIdx].style.opacity = 0;
    }

    // 文字列の移動
    slideUl.style.transform = `translateX(${-idx * translateX}px)`;

    currentIdx = idx;
  }

  const slides = { idx: 0 };

  gsap.to(slides, {
    idx: slideList.length - 1,
    scrollTrigger: {
      trigger: triggerSelector,
      start: "top top",
      end: "+=3000",
      pin: true,
      scrub: 1,
      markers: true,
      onUpdate: () => {
        let idx = Math.round(slides.idx);
        idx = (slideList.length + idx) % slideList.length;
        if (currentIdx === idx) return;
        goTo(idx);
      },
    },
  });

  // prevEl.addEventListener("click", () => {
  //   let idx = slider.activeSlideIdx - 1;
  //   idx = (slideList.length + idx) % slideList.length;
  //   goTo(idx);
  // });
}

export { mountNavBtnHandler, mountReflectBtnHandler, mountScrollHandler };
