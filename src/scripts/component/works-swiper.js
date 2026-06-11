import Swiper from "swiper/bundle";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initWorksSwiper() {
  const container = document.querySelector(".js_works_slider");
  if (!container) return;

  const mediaQuery = window.matchMedia("(min-width: 601px)");
  let swiper = null;
  let refreshTimer = null;

  const refreshScrollTrigger = () => {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };

  const createSwiper = () =>
    new Swiper(container, {
      slidesPerView: 2,
      spaceBetween: 60,
      loop: true,
      grabCursor: true,
      speed: 1000,

      pagination: {
        el: ".bl_swiper_pagination",
        type: "bullets",
        clickable: true,
      },
      navigation: {
        nextEl: ".bl_swiper_navNext",
        prevEl: ".bl_swiper_navPrev",
      },
      breakpoints: {
        1281: {
          slidesPerView: "auto",
          spaceBetween: 120,
        },
      },
      on: {
        afterInit: refreshScrollTrigger,
        breakpoint: refreshScrollTrigger,
        resize: refreshScrollTrigger,
      },
    });

  const updateSwiper = () => {
    if (mediaQuery.matches && !swiper) {
      swiper = createSwiper();
      refreshScrollTrigger();
      return;
    }

    if (!mediaQuery.matches && swiper) {
      swiper.destroy(true, true);
      swiper = null;
      refreshScrollTrigger();
    }
  };

  updateSwiper();
  mediaQuery.addEventListener("change", updateSwiper);

  return () => {
    clearTimeout(refreshTimer);
    mediaQuery.removeEventListener("change", updateSwiper);
    swiper?.destroy(true, true);
  };
}
