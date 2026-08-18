/**
 * Lightbox – 記事本文内の画像をクリックで拡大表示する
 *
 * 使い方:
 *   import { initLightbox } from "#/component/lightbox";
 *   initLightbox(".bl_blogDetail_content");
 */

const TRANSITION_MS = 300;

let overlay = null;
let imgEl = null;
let captionEl = null;
let closeBtn = null;
let isOpen = false;

/* ── DOM を一度だけ構築 ─────────────────────── */
function ensureDOM() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.className = "bl_lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "画像拡大表示");

  // 閉じるボタン
  closeBtn = document.createElement("button");
  closeBtn.className = "bl_lightbox_close";
  closeBtn.setAttribute("aria-label", "閉じる");
  closeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  // 画像
  imgEl = document.createElement("img");
  imgEl.className = "bl_lightbox_img";

  // キャプション
  captionEl = document.createElement("p");
  captionEl.className = "bl_lightbox_caption";

  overlay.appendChild(closeBtn);
  overlay.appendChild(imgEl);
  overlay.appendChild(captionEl);
  document.body.appendChild(overlay);

  /* ── イベント ─────────────────────────────── */
  // 背景 or 閉じるボタンで閉じる
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target === closeBtn || closeBtn.contains(e.target)) {
      closeLightbox();
    }
  });

  // Escape キーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeLightbox();
  });
}

/* ── 開く / 閉じる ──────────────────────────── */
function openLightbox(src, alt) {
  ensureDOM();

  // 高画質ソース: srcset / data-full があればそちらを優先
  imgEl.src = src;
  imgEl.alt = alt || "";

  if (alt) {
    captionEl.textContent = alt;
    captionEl.style.display = "";
  } else {
    captionEl.textContent = "";
    captionEl.style.display = "none";
  }

  // スクロールロック
  document.documentElement.style.overflow = "hidden";

  // 表示
  overlay.classList.add("is-active");
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
  });
  isOpen = true;
}

function closeLightbox() {
  if (!isOpen) return;
  overlay.classList.remove("is-visible");

  setTimeout(() => {
    overlay.classList.remove("is-active");
    imgEl.src = "";
    document.documentElement.style.overflow = "";
  }, TRANSITION_MS);
  isOpen = false;
}

/* ── 初期化 ─────────────────────────────────── */
export function initLightbox(containerSelector = ".bl_blogDetail_content") {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // コンテンツ内の img を収集（picture 内の img も含む）
  const images = container.querySelectorAll("img");

  images.forEach((img) => {
    // すでにリンクで囲まれている画像はスキップ
    if (img.closest("a")) return;

    // 二重初期化防止
    if (img.dataset.lightbox === "bound") return;
    img.dataset.lightbox = "bound";

    img.style.cursor = "zoom-in";
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.setAttribute("aria-label", "クリックで画像を拡大");

    img.addEventListener("click", () => {
      // 最大解像度のソースを探す
      const fullSrc = getFullResSrc(img);
      openLightbox(fullSrc, img.alt);
    });

    // キーボードアクセシビリティ
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const fullSrc = getFullResSrc(img);
        openLightbox(fullSrc, img.alt);
      }
    });
  });
}

/**
 * srcset から最大幅の URL を取得、なければ src にフォールバック
 */
function getFullResSrc(img) {
  // data-full 属性があればそれを使用
  if (img.dataset.full) return img.dataset.full;

  // <picture> 内にある場合、最大解像度の source を探す
  const picture = img.closest("picture");
  if (picture) {
    const sources = picture.querySelectorAll("source");
    let bestSrc = null;
    let bestWidth = 0;

    sources.forEach((source) => {
      const srcset = source.getAttribute("srcset");
      if (!srcset) return;

      srcset.split(",").forEach((entry) => {
        const parts = entry.trim().split(/\s+/);
        const url = parts[0];
        const descriptor = parts[1] || "";
        const w = parseInt(descriptor) || 0;
        if (w > bestWidth) {
          bestWidth = w;
          bestSrc = url;
        }
      });
    });

    if (bestSrc) return bestSrc;
  }

  // img の srcset から最大解像度を探す
  const srcset = img.getAttribute("srcset");
  if (srcset) {
    let bestSrc = null;
    let bestWidth = 0;

    srcset.split(",").forEach((entry) => {
      const parts = entry.trim().split(/\s+/);
      const url = parts[0];
      const descriptor = parts[1] || "";
      const w = parseInt(descriptor) || 0;
      if (w > bestWidth) {
        bestWidth = w;
        bestSrc = url;
      }
    });

    if (bestSrc) return bestSrc;
  }

  return img.src;
}
