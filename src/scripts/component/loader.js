import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LinearFilter, TextureLoader, SRGBColorSpace } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VideoTexture } from "three/webgpu";
import { INode } from "#/helper/INode";

gsap.registerPlugin(ScrollTrigger);

const texLoader = new TextureLoader();
const modelLoader = new GLTFLoader();

const textureCache = new Map();
const modelCache = new Map();

const loader = {
  init,
  loadAllAssets,
  loadImg,
  loadVideo,
  loadModel,
  getTexByElement,
  getModelByElement,
  addProgressAction,
  letsBegin,
  addLoadingAnimation,
  isLoaded: false, // 読み込み完了フラグ
};

const DOM = {};

/**
 * 初期化
 */
function init() {
  DOM.globalContainer = INode.getElement("#globalContainer");
  DOM.loader = INode.getElement(".js_loader");
  DOM.loaderPercent = INode.getElement(".js_countNum");
  DOM.progressCounter = INode.getElement(".js_progressCounter");
  DOM.loaderWrapper = INode.getElement(".js_loaderBar");
  DOM.progressBar = INode.getElement(".js_progressBar");
  DOM.statusLabel = INode.getElement(".js_statusLabel");
}

/**
 * 全てのアセットを読み込む
 */
async function loadAllAssets() {
  const els = INode.qsAll("[data-webgl]");

  for (const el of els) {
    const data = el.dataset;

    //属性値をkeyとして抽出しループ処理
    for (let key in data) {
      //texture処理
      if (key.startsWith("tex")) {
        //WebGL要素のdata属性からtextureのURLを取得
        const url = data[key];

        // textureCasheに存在しなければ追加
        if (!textureCache.has(url)) {
          textureCache.set(url, null);
        }
      }

      //model処理
      if (key.startsWith("model")) {
        //WebGL要素のdata属性からmodelのURLを取得
        const url = data[key];

        // modelCasheに存在しなければ追加
        if (!modelCache.has(url)) {
          modelCache.set(url, null);
        }
      }
    }
  }

  // textureの読み込み完了を待つためのPromiseオブジェクトを格納する
  const texPrms = [];

  textureCache.forEach((_, url) => {
    let prms;

    const loadFn = /\.(mp4|webm|ogg|mov)$/.test(url) ? loadVideo : loadImg;

    prms = loadFn(url)
      .then((tex) => {
        //textureCasheにURLとtexture情報をセットにして格納
        textureCache.set(url, tex);
      })
      .catch((e) => {
        console.error(`Media Could not Download: ${url}`, e);
      });

    texPrms.push(prms);
  });

  // modelの読み込み完了を待つためのPromiseオブジェクトを格納する
  const modelPrms = [];

  modelCache.forEach((_, url) => {
    const prms = loadModel(url).then((model) => {
      //modelCasheにURLとmodel情報をセットにして格納
      modelCache.set(url, model);
    });

    modelPrms.push(prms);
  });

  // textureとmodelの読み込み完了を待つ
  await Promise.all([...texPrms, ...modelPrms]);
}

let total = 0;
let progress = 0;
let _progressAction = null;

/**
 * 画像を読み込む
 * @param {string} url - 画像のURL
 * @returns {Promise<Texture>} - 画像のテクスチャ
 */
async function loadImg(url) {
  // 読み込み対象の画像の総数を計算
  incrementTotal();

  try {
    //textureを読み込み
    const tex = await texLoader.loadAsync(url);

    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.needsUpdate = false;

    return tex;
  } catch {
    //tryの処理でエラーが出ても
    throw new Error();
  } finally {
    //読み込み完了枚数を計算
    incrementProgress();
  }
}

/**
 * 動画を読み込む
 * @param {string} url - 動画のURL
 * @returns {Promise<VideoTexture>} - 動画のテクスチャ
 */
async function loadVideo(url) {
  const video = document.createElement("video");
  //拡張子を取得
  let extension = url.split(".").pop();
  // 拡張子がmovの場合
  if (extension === "mov") {
    // 拡張子をquicktimeに変更
    extension = "quicktime";
  }
  //ブラウザが対応していない拡張子の場合
  if (!video.canPlayType(`video/${extension}`)) {
    //"maybe", "probably"
    //""
    return null;
  }

  // 読み込み対象の画像の総数を計算
  incrementTotal();

  return new Promise((resolve, reject) => {
    // const video = document.createElement("video");

    const video = INode.htmlToEl(`<video
    autoplay
    loop
    muted
    playsinline
    defaultMuted
    crossorigin="anonymous"
    ></video>`);

    video.oncanplay = () => {
      //textureを読み込み
      const tex = new VideoTexture(video);
      // 読み込み完了枚数を計算
      incrementProgress();

      tex.magFilter = LinearFilter;
      tex.minFilter = LinearFilter;
      tex.colorSpace = SRGBColorSpace;
      video.play().catch((err) => {
        console.warn("Video play failed or was prevented:", err);
      });

      video.oncanplay = null;
      resolve(tex);
    };

    video.onerror = () => {
      console.error(`Failed to load video: ${url}`);
      // 失敗してもカウントは進めないと全体が止まる
      incrementProgress();
      reject();
    };
    video.src = url;
    // video.muted = true;
    // video.autoplay = true;
    // video.loop = true;
    // video.playsInline = true;
    // video.defaultMuted = true;
    // video.load(); // 明示的に読み込みを開始
  });
}

/**
 * 読み込み完了枚数を加算
 */
function incrementTotal() {
  total++;
}

/**
 * 読み込み完了枚数を計算
 */
function incrementProgress() {
  progress++;

  if (_progressAction) {
    _progressAction(progress, total);
  }

  // progressAction(progress, total);
}

/**
 * プログレスバーの処理内容を設定
 * @param {Function} _callback
 */
function addProgressAction(_callback) {
  _progressAction = _callback;
}

/**
 * 3Dモデルを読み込む
 * @param {string} url - 3DモデルのURL
 * @returns {Promise<Object>} - 3Dモデル
 */
async function loadModel(url) {
  // 読み込み対象の画像の総数を計算
  incrementTotal();
  //3Dモデルを読み込み
  const models = await modelLoader.loadAsync(url);
  // 読み込み完了枚数を計算
  incrementProgress();

  return models;
}

/**
 * WebGL要素のdata属性からテクスチャを取得
 * @param {HTMLElement} el - WebGL要素
 * @returns {Promise<Map<string, Texture>>} - テクスチャのマップ
 */
async function getTexByElement(el) {
  const texes = new Map();
  const data = el.dataset;

  let mediaLoaded = null;
  let first = true;
  //属性値をkeyとして抽出しループ処理
  for (let key in data) {
    //texture以外はスキップ
    if (!key.startsWith("tex")) continue;

    //WebGL要素のdata属性からtextureのURLを取得
    const url = data[key];
    //textureCacheからテクスチャを取得
    const tex = textureCache.get(url);

    //keyに-を含んでいる場合は除去
    key = key.replace("-", "");

    texes.set(key, tex);

    //el が <img> 要素の場合
    if (first && el instanceof HTMLImageElement) {
      //画像読み込み完了を待つ
      mediaLoaded = new Promise((resolve) => {
        // すでにロード済みの場合は即座にresolve
        // if (el.complete) {
        //   resolve();
        //   return;
        // }
        //画像読み込み完了時
        el.onload = () => {
          //resolveで画像読み込み完了を通知
          resolve();
        };
        //エラー時
        // el.onerror = () => {
        //   console.error(`[loader] Failed to load image: ${el.src}`);
        //   resolve(); // 失敗しても全体の処理は止めない
        // };
        // 念のためタイムアウト（5秒）
        // setTimeout(resolve, 5000);
      });
      //img要素のsrc属性にURLをセット
      el.src = url;

      first = false;
    }

    //el が <video> 要素の場合
    if (first && el instanceof HTMLVideoElement) {
      //画像読み込み完了を待つ
      mediaLoaded = new Promise((resolve) => {
        //画像読み込み完了時
        el.onloadeddata = () => {
          //resolveで画像読み込み完了を通知
          resolve();
        };
        //エラー時
        // el.onerror = () => {
        //   console.error(`[loader] Failed to load video: ${el.src}`);
        //   resolve();
        // };
        // 念のためタイムアウト（5秒）
        // setTimeout(resolve, 5000);
      });
      //img要素のsrc属性にURLをセット
      el.src = url;
      el.load();

      first = false;
    }
  }

  await mediaLoaded;

  return texes;
}

/**
 * WebGL要素のdata属性からモデルを取得
 * @param {HTMLElement} el - WebGL要素
 * @returns {Promise<Map<string, Object>>} - モデルのマップ
 */
function getModelByElement(el) {
  const models = new Map();
  const data = el.dataset;
  //属性値をkeyとして抽出しループ処理
  for (let key in data) {
    //model以外はスキップ
    if (!key.startsWith("model")) continue;

    //WebGL要素のdata属性からmodelのURLを取得
    const url = data[key];
    //modelを読み込み
    const model = modelCache.get(url);

    //keyに-を含んでいる場合は除去
    key = key.replace("-", "");

    models.set(key, model);
  }

  return models;
}

/**
 * ローディング完了時のアニメーション
 * @returns {Promise<void>}
 */
function loadingAnimationStart() {
  const tl = gsap.timeline();

  tl.to(DOM.statusLabel, {
    color: "#10b981",
    onUpdate: () => {
      DOM.statusLabel.textContent = "Ready";
    },
  })
    .to(DOM.progressCounter, {
      xPercent: 100,
      opacity: 0,
      duration: 0.3,
    })
    .to(
      DOM.loaderWrapper,
      {
        xPercent: -100,
        opacity: 0,
        duration: 0.3,
      },
      "<",
    )
    .to(DOM.globalContainer, {
      autoAlpha: 1,
      duration: 0,
      onComplete: () => {
        ScrollTrigger.refresh();
      },
    })
    .to(DOM.loader, {
      autoAlpha: 0,
      pointerEvents: "none",
      duration: 0.6,
      delay: 0.3,
    });

  return tl;
}

function loadingAnimationEnd(tl) {
  const page = INode.qsAll("#smooth-wrapper");

  const header = INode.qsAll(".js_header");

  return new Promise((resolve) => {
    tl.to(
      header,
      {
        y: 0,
        duration: 0.3,
        ease: "power1.inOut",
        onComplete() {
          loader.isLoaded = true;
          resolve();
        },
      },
      "<",
    );
  });
}

let loadingAnimation = null;

function addLoadingAnimation(_loadingAnimation) {
  loadingAnimation = _loadingAnimation;
}

/**
 * ローディング完了後のアニメーションを開始
 */
async function letsBegin() {
  const tl = loadingAnimationStart();

  loadingAnimation && loadingAnimation(tl);

  return await loadingAnimationEnd(tl);
}

export default loader;
