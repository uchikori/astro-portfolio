/**
 * WordPress 未接続時の開発用モックデータ (JavaScript版)
 */

import blogThumbnail from "../assets/img/blog/blog_1.png";

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
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[0]],
    tags: [],
  },
  {
    id: 2641,
    slug: "wordpress-block-editor",
    title: "WordPress ブロックエディター 使い方入門",
    content: "<p>WordPressブロックエディター（Gutenberg）の基本操作から応用まで解説します。</p>",
    excerpt: "<p>クラシックエディターからブロックエディターへの移行と手順まとめ。</p>",
    date: "2025-06-15T09:00:00",
    modified: "2025-06-15T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[1]],
    tags: [],
  },
  {
    id: 3036,
    slug: "threejs-pointlight",
    title: "Three.jsのPointLightの明るさが変わって戸惑った話",
    content: "<p>Three.jsの物理照明モデルにおけるPointLightの減衰や明るさの挙動についての技術解説です。</p>",
    excerpt: "<p>Three.jsのPointLightの挙動と対応方法のまとめ。</p>",
    date: "2025-05-10T09:00:00",
    modified: "2025-05-10T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[0]],
    tags: [],
  },
  {
    id: 2770,
    slug: "headless-wordpress-pitfalls",
    title: "WordPressをヘッドレスCMSにする前に知っておきたい落とし穴",
    content: "<p>ヘッドレスCMSとしてWordPressを採用する際の注意点をまとめました。</p>",
    excerpt: "<p>WordPressのヘッドレスCMS運用のノウハウ紹介。</p>",
    date: "2025-04-20T09:00:00",
    modified: "2025-04-20T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "",
    categories: [MOCK_CATEGORIES[1]],
    tags: [],
  },
];

export const MOCK_BLOG_POSTS = [
  {
    id: 5001,
    slug: "threejs-pointlight-why-change",
    title: "Three.jsのPointLightの明るさが変わって戸惑った話",
    content:
      "<p>PointLight の減衰や距離の設定で、見た目が想像以上に変わることがあります。この記事では原因の整理と、実務での確認ポイントをまとめています。</p><h2>まず確認すること</h2><p>intensity、distance、decay の3つを順番に見直すだけでも、かなり挙動を把握しやすくなります。</p><h2>まとめ</h2><p>Three.js のライトは単体で見るより、周囲の環境とセットで確認するのが大切です。</p>",
    excerpt:
      "<p>PointLight の明るさが想定と違うときに、まず見るべきポイントを整理します。</p>",
    date: "2026-05-14T09:00:00",
    modified: "2026-05-14T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "PointLightの記事サムネイル",
    categories: [MOCK_CATEGORIES[0]],
  },
  {
    id: 5002,
    slug: "wordpress-block-editor-guide",
    title: "WordPress ブロックエディター 使い方入門｜全ブロックの操作手順まとめ",
    content:
      "<p>ブロックエディターの基本操作から、よく使うブロックの使い分けまでを一気に整理した入門記事です。</p><h2>この記事でわかること</h2><ul><li>段落や見出しの作り方</li><li>画像・カラム・ボタンの使い方</li><li>更新しやすい構成の考え方</li></ul>",
    excerpt:
      "<p>WordPress ブロックエディターの基本と、よく使う操作をまとめました。</p>",
    date: "2026-01-16T09:00:00",
    modified: "2026-01-16T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "ブロックエディターの記事サムネイル",
    categories: [MOCK_CATEGORIES[1]],
  },
  {
    id: 5003,
    slug: "wp-import-export-lite-migration",
    title: "初心者でも簡単！WordPressのデータ移行を「WP Import Export Lite」で自動化する手順",
    content:
      "<p>WordPress のデータ移行は、手順が多く見えて不安になりがちです。そこで、できるだけ事故を減らす流れで整理しました。</p><h2>準備</h2><p>移行元と移行先で、必要なプラグインとバックアップを先に揃えます。</p>",
    excerpt:
      "<p>WordPress の移行作業を、できるだけわかりやすい流れで解説します。</p>",
    date: "2025-10-14T09:00:00",
    modified: "2025-10-14T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "データ移行の記事サムネイル",
    categories: [MOCK_CATEGORIES[2]],
  },
  {
    id: 5004,
    slug: "wireframe-before-web-design",
    title: "Webサイト制作はワイヤーフレームから始めよう！失敗しないための必須知識",
    content:
      "<p>見た目のデザインから入る前に、情報の並びを整理しておくと、後工程がかなり楽になります。</p><h2>ワイヤーフレームの役割</h2><p>画面の優先順位を決めることが、制作の土台になります。</p>",
    excerpt:
      "<p>ワイヤーフレームを先に作るメリットと、進め方のポイントを紹介します。</p>",
    date: "2025-09-19T09:00:00",
    modified: "2025-09-19T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "ワイヤーフレームの記事サムネイル",
    categories: [MOCK_CATEGORIES[3]],
  },
  {
    id: 5005,
    slug: "git-github-for-beginners",
    title: "初心者でも理解できる！Git・GitHubとは？",
    content:
      "<p>Git と GitHub は名前が似ていますが、役割は少し違います。最初にそこを切り分けると理解しやすくなります。</p><h2>違い</h2><p>Git は履歴管理、GitHub は共有や連携のためのサービスです。</p>",
    excerpt:
      "<p>Git と GitHub の違いを、初心者向けにやさしく説明します。</p>",
    date: "2025-09-09T09:00:00",
    modified: "2025-09-09T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "Git GitHubの記事サムネイル",
    categories: [MOCK_CATEGORIES[1]],
  },
  {
    id: 5006,
    slug: "headless-wordpress-astro",
    title: "WordPressをヘッドレスCMS化して爆速サイトを作る方法【Astroでの構築例】",
    content:
      "<p>ヘッドレス構成にすると、表示速度や実装の自由度が大きく上がります。Astro と組み合わせるときの考え方を紹介します。</p><h2>構成のポイント</h2><p>CMS とフロントを分けることで、更新と表示を切り離せます。</p>",
    excerpt:
      "<p>Astro と WordPress を組み合わせたヘッドレス構成のポイントを紹介します。</p>",
    date: "2025-08-20T09:00:00",
    modified: "2025-08-20T09:00:00",
    thumbnailUrl: blogThumbnail,
    thumbnailAlt: "ヘッドレスCMSの記事サムネイル",
    categories: [MOCK_CATEGORIES[2]],
  },
];
