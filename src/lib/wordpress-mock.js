/**
 * WordPress 未接続時の開発用モックデータ (JavaScript版)
 */

export const MOCK_CATEGORIES = [
  { id: 2004, name: "WebGL", slug: "webgl", count: 2 },
  { id: 21, name: "開発", slug: "development", count: 14 },
  { id: 107, name: "運用", slug: "operation", count: 7 },
  { id: 4, name: "設計", slug: "design", count: 2 },
];

export const MOCK_WORKS = [
  {
    id: 3181,
    slug: "threejs-webgpu-points",
    title: "【Three.js】 WebGPUで球体を頂点群表示する方法",
    content: "<p>Three.js WebGPUでPointsが使用できない代替案として、InstanceMeshを利用して球体の頂点群を表現する方法を解説します。</p>",
    excerpt: "<p>InstanceMeshを利用して球体の頂点群を表現するデモと解説。</p>",
    date: "2025-07-28T11:08:43",
    modified: "2025-07-28T11:12:09",
    thumbnailUrl: null,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[0]],
  },
  {
    id: 2641,
    slug: "wordpress-block-editor",
    title: "WordPress ブロックエディター 使い方入門",
    content: "<p>WordPressブロックエディター（Gutenberg）の基本操作から応用まで解説します。</p>",
    excerpt: "<p>クラシックエディターからブロックエディターへの移行と手順まとめ。</p>",
    date: "2025-06-15T09:00:00",
    modified: "2025-06-15T09:00:00",
    thumbnailUrl: null,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[1]],
  },
  {
    id: 3036,
    slug: "threejs-pointlight",
    title: "Three.jsのPointLightの明るさが変わって戸惑った話",
    content: "<p>Three.jsの物理照明モデルにおけるPointLightの減衰や明るさの挙動についての技術解説です。</p>",
    excerpt: "<p>Three.jsのPointLightの挙動と対応方法のまとめ。</p>",
    date: "2025-05-10T09:00:00",
    modified: "2025-05-10T09:00:00",
    thumbnailUrl: null,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[0]],
  },
  {
    id: 2770,
    slug: "headless-wordpress-pitfalls",
    title: "WordPressをヘッドレスCMSにする前に知っておきたい落とし穴",
    content: "<p>ヘッドレスCMSとしてWordPressを採用する際の注意点をまとめました。</p>",
    excerpt: "<p>WordPressのヘッドレスCMS運用のノウハウ紹介。</p>",
    date: "2025-04-20T09:00:00",
    modified: "2025-04-20T09:00:00",
    thumbnailUrl: null,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[1]],
  },
];
