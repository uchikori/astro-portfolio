<!--
WordPress投稿用メタ情報
title: WordPress ブロックテーマの作り方｜最小構成からtheme.json・templates・parts・patternsまで実践解説
slug: wordpress-block-theme-how-to
meta_title: WordPress ブロックテーマの作り方｜自作の最小構成とtheme.json入門
meta_description: WordPress ブロックテーマの作り方を、最小ファイル構成、style.css、theme.json、templates、parts、patterns、サイトエディターでの確認手順まで実践向けに解説します。クラシックテーマとの違いや制作案件での注意点も整理。
main_keyword: WordPress ブロックテーマ 作り方
sub_keywords: wordpress ブロックテーマ 自作, ブロックテーマ 作成, theme.json, templates, parts, patterns, サイトエディター, クラシックテーマ 違い
category: WordPress
tags: WordPress, ブロックテーマ, theme.json, サイトエディター, テーマ制作
description: WordPressのブロックテーマを自作したい方向けに、壊しにくい最小構成から制作現場でつまずきやすい点までまとめた実践記事。
internal_link_note: 親記事 drafts/wordpress-block-theme-parent.md を確認済み。公開時は /web-tips/wordpress-block-theme/ を実URLに差し替え。
-->

# WordPress ブロックテーマの作り方｜最小構成からtheme.json・templates・parts・patternsまで実践解説

WordPressでサイトを作っていると、「ブロックテーマ」という言葉を目にする機会が増えてきました。クラシックテーマに慣れている方ほど、`header.php` や `footer.php` がない構成に戸惑うかもしれません。

ブロックテーマは、サイト全体の構造をブロックで組み立て、サイトエディターからテンプレートや共通パーツ、デザイン設定を編集できるテーマ形式です。うまく設計すれば、投稿本文だけでなく、固定ページの雛形やCTA、ヘッダー、フッターまで運用しやすくなります。

この記事では、WordPress ブロックテーマの作り方を、最小構成から順番に解説します。ブロックテーマを自作したい制作者、クラシックテーマから移行したい方、リニューアル前に仕組みを理解しておきたい事業者向けの実践メモです。

ブロックテーマ全体の概要や導入判断を先に知りたい場合は、親記事の「[WordPress ブロックテーマとは？クラシックテーマとの違いと導入判断](/web-tips/wordpress-block-theme/)」を読むと全体像をつかみやすくなります。

## ブロックテーマ作成前に理解しておきたいこと

クラシックテーマでは、`index.php`、`single.php`、`page.php`、`header.php`、`footer.php` などのPHPファイルで表示を組むのが基本でした。

ブロックテーマでは、ページ全体の構造を `templates` フォルダ内のHTMLファイルで定義します。ただし、普通の静的HTMLを書くのではなく、WordPressのブロックコメントで構成された「ブロックマークアップ」を書きます。

たとえば、ヘッダーを読み込む記述は次のようになります。

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
```

この記述があると、WordPressはテーマ内の `parts/header.html` を探し、その中のブロックマークアップを読み込んで表示します。

つまりブロックテーマ制作では、「どのPHPテンプレートを作るか」よりも、「どのテンプレートに、どのブロック・パーツ・パターンを配置するか」を考えることが重要です。

### クラシックテーマとの違い

| 観点 | クラシックテーマ | ブロックテーマ |
| --- | --- | --- |
| テンプレート | PHP中心 | HTMLのブロックマークアップ中心 |
| 共通パーツ | `header.php`、`footer.php` | `parts/header.html`、`parts/footer.html` |
| 全体設定 | `functions.php`、CSS、カスタマイザー | `theme.json` とサイトエディター |
| 編集範囲 | 投稿・固定ページ中心 | サイト全体のテンプレートも編集対象 |

担当者がニュースやブログを更新するだけなら、クラシックテーマでも十分な場合があります。反対に、ページ構成や共通パーツを柔軟に育てたいサイトでは、ブロックテーマのほうが運用しやすくなることがあります。

## WordPress ブロックテーマ作成の最小ファイル構成

まずは壊しにくい最小構成から始めましょう。

```txt
my-block-theme/
├── style.css
├── theme.json
├── templates/
│   └── index.html
└── parts/
    ├── header.html
    └── footer.html
```

WordPressがブロックテーマとして認識するうえで特に重要なのは、テーマ直下の `theme.json` と、`templates/index.html` です。公式ドキュメントでも、ブロックテーマの最小テンプレートとして `index.html` が扱われています。

最初から `single.html`、`page.html`、`archive.html` まで作り込む必要はありません。まずは `index.html` で表示できる状態を作り、管理画面のサイトエディターで確認してからテンプレートを増やすほうが安全です。

## style.css の役割

ブロックテーマでも `style.css` は必要です。ただし、クラシックテーマ時代のように、すべての見た目をCSSで管理するファイルとは考えないほうがよいです。

最初はテーマ情報を書く場所として用意します。

```css
/*
Theme Name: My Block Theme
Author: Your Name
Description: A simple block theme.
Version: 1.0.0
Requires at least: 6.6
Requires PHP: 8.1
Text Domain: my-block-theme
*/
```

CSSを書いても問題ありませんが、色、フォントサイズ、余白、コンテンツ幅など、サイトエディターと連動させたいデザインルールは `theme.json` に寄せるほうが管理しやすくなります。

`style.css` は、ブロック標準機能だけでは表現しにくい細かな調整、独自クラスを付けたパターンの微調整、フォーカス表示などの補助に使うのがおすすめです。

## theme.json の基本と、設定しすぎない考え方

`theme.json` は、ブロックテーマ制作の中心になる設定ファイルです。サイト全体の色、フォント、余白、レイアウト幅、ブロックごとのスタイルなどを定義できます。

ただし、最初から細かく作り込みすぎる必要はありません。まずは「編集者に触らせたい範囲」と「テーマ側で固定したいルール」を分けることが大切です。

最小に近い `theme.json` は次のように始められます。

```json
{
  "$schema": "https://schemas.wp.org/trunk/theme.json",
  "version": 3,
  "settings": {
    "layout": {
      "contentSize": "720px",
      "wideSize": "1120px"
    },
    "color": {
      "palette": [
        { "slug": "base", "color": "#ffffff", "name": "Base" },
        { "slug": "contrast", "color": "#1f2933", "name": "Contrast" },
        { "slug": "accent", "color": "#2f7d73", "name": "Accent" }
      ]
    },
    "spacing": {
      "units": ["px", "rem", "%"]
    }
  },
  "styles": {
    "color": {
      "background": "var:preset|color|base",
      "text": "var:preset|color|contrast"
    },
    "elements": {
      "link": {
        "color": {
          "text": "var:preset|color|accent"
        }
      }
    }
  }
}
```

`settings` は編集画面で使える選択肢や機能を定義する領域です。カラーパレット、コンテンツ幅、余白単位などが入ります。

`styles` は、実際にサイトへ適用する初期デザインを定義する領域です。背景色、文字色、リンク色、ブロックごとの見た目などが入ります。

実務では、まずコンテンツ幅、基本カラー、基本フォントサイズ、余白の基準だけ決めると迷いにくくなります。見出し、ボタン、カード、CTAなどの細かい見た目は、サイト全体の設計が固まってから追加していきましょう。

## templates/index.html の最小例

`templates/index.html` は、ブロックテーマにおける最後の受け皿になるテンプレートです。投稿詳細、固定ページ、アーカイブなど、より具体的なテンプレートがない場合に使われます。

まずは、ヘッダー、本文、フッターだけで十分です。

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:post-title {"level":1} /-->
  <!-- wp:post-content /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

この状態で投稿や固定ページを表示すると、タイトルと本文が出る最低限のテーマになります。表示できることを確認してから、`page.html`、`single.html`、`archive.html`、`404.html` などを追加しましょう。

## parts/header.html と parts/footer.html の考え方

`parts` フォルダには、複数のテンプレートで使い回す共通パーツを入れます。典型的には `header.html` と `footer.html` です。

```html
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
  <!-- wp:site-title /-->
  <!-- wp:navigation /-->
</div>
<!-- /wp:group -->
```

これは `parts/header.html` の最小例です。サイトタイトルとナビゲーションだけのシンプルなヘッダーなので、最初の確認に向いています。

```html
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
  <!-- wp:paragraph -->
  <p>© My Block Theme</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

こちらは `parts/footer.html` の最小例です。実際のサイトでは、会社情報、プライバシーポリシー、お問い合わせ、SNSリンクなどを設計に合わせて追加します。

テンプレートパーツはサイトエディターから編集できる点が便利です。一方で、編集権限を持つ人が大きく変更できてしまうため、制作案件では「どこまで編集可能にするか」を事前に決めておきましょう。

## patterns の使いどころ

`patterns` は、複数のブロックを組み合わせた再利用パーツです。ファーストビュー、サービス紹介、CTA、お客様の声、FAQ、料金表の一部、記事下の導線などに向いています。

テンプレートパーツとの違いは、「サイト構造として常に使うか」「ページ内へ挿入して使うか」です。ヘッダーやフッターは `parts`、ページごとに必要な場所へ入れるセクションは `patterns` と考えると整理しやすいです。

テーマ内の `patterns` フォルダにファイルを置くと、WordPressが自動登録できます。たとえば `patterns/cta-contact.php` は次のように始められます。

```php
<?php
/**
 * Title: Contact CTA
 * Slug: my-block-theme/contact-cta
 * Categories: call-to-action
 */
?>

<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
  <!-- wp:heading {"textAlign":"center"} -->
  <h2 class="wp-block-heading has-text-align-center">サイト制作のご相談はこちら</h2>
  <!-- /wp:heading -->

  <!-- wp:paragraph {"align":"center"} -->
  <p class="has-text-align-center">WordPress構築やブロックテーマ制作について、お気軽にご相談ください。</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

パターンは便利ですが、何でもパターンにすればよいわけではありません。編集者が迷わない単位にすることが大切です。制作案件では、「サービス紹介 3カラム」「記事下CTA」「料金案内」「採用導線」など、運用中に繰り返し使うセクションをパターン化すると効果的です。

## サイトエディターで確認する流れ

ファイルを作成したら、WordPress管理画面で確認します。

1. テーマフォルダを `wp-content/themes/` に配置する
2. 管理画面の「外観」からテーマを有効化する
3. サイトエディターを開く
4. テンプレートに `index` が表示されるか確認する
5. ヘッダー・フッターが読み込まれているか確認する
6. 投稿または固定ページを表示して、タイトルと本文が出るか確認する
7. サイトエディターで色や余白を変更し、意図した範囲だけ変わるか確認する

ブロックテーマはサイトエディターとの関係が深いため、コードだけで判断せず、管理画面から編集・保存・フロント表示まで確認しましょう。

## よくあるつまずきと対処法

### テンプレートが反映されない

サイトエディターで編集・保存したテンプレートは、データベースに保存されます。その場合、テーマファイルを変更しても、保存済みテンプレートが優先されることがあります。

ファイルを直したのに変わらないときは、サイトエディター上で対象テンプレートのカスタマイズ状態を確認し、必要に応じてリセットします。

### CSSが効かない

ブロックテーマでは、WordPress本体、`theme.json`、ブロックごとのスタイル、ユーザーが保存したスタイル、テーマのCSSが組み合わさります。

CSSが効かないときは、`!important` を増やす前に、`theme.json` で同じ見た目を定義していないか、サイトエディター側で上書き保存されていないか、対象ブロックに想定したクラスが出ているかを確認しましょう。

### 余白や幅が揃わない

余白や幅のズレは、`theme.json` の `contentSize` / `wideSize`、Groupブロックのレイアウト設定、個別ブロックの配置指定、CSSの最大幅指定が混ざっていると起きやすくなります。

最初に、本文幅、ワイド幅、フル幅セクションの扱いを決めておくと、ページごとのばらつきを減らせます。

### 更新で崩れる

WordPress本体やブロックの仕様は継続的に改善されています。ブロックテーマでは本体機能との距離が近いため、更新後に細かな表示差が出ることがあります。

コアブロックの標準機能を活かす、過剰なCSS上書きを避ける、表示確認用のテストページを用意する、本番更新前にバックアップを取る。このあたりは最低限の運用ルールにしておきたいところです。

### クラシックテーマの感覚で作ってしまう

クラシックテーマ経験者は、「全部コードで固定する」か「全部編集画面に任せる」かの両極端になりがちです。

ブロックテーマでは、テーマ側がデザインのルールを持ち、編集者がその範囲内で組み替えられる状態を作るのが理想です。ブランドカラーは `theme.json` のパレットで絞る。余白の選択肢も増やしすぎない。CTAや料金表のように崩れてほしくない部分はパターン化する。こうしたバランス設計が大切です。

## 制作案件でブロックテーマを使う場合の注意点

ブロックテーマは、制作者にもクライアントにも便利な仕組みです。ただし、案件で使う場合は、作る前に決めておきたいことがあります。

まず、どこをクライアントが編集するかを決めます。サイトエディターを開放すると、ヘッダーやフッター、テンプレートまで編集できます。これは強力ですが、同時に崩れるリスクもあります。更新したい範囲が「お知らせ」「ブログ」「実績」「一部のテキスト」だけなら、テンプレート全体の編集権限は制限したほうが安心です。

次に、デザインルールを先に決めます。ブランドカラー、見出しの階層、本文幅、セクション余白、ボタンの種類、CTAの配置、スマホ表示時の優先順位が曖昧なまま作ると、`theme.json` もパターンも場当たり的になります。

また、カスタムブロックが必要かどうかも見極めます。複雑な料金シミュレーター、絞り込み検索、独自の投稿一覧、外部API連携などは、標準ブロックだけで無理に作るより、カスタムブロックやプラグイン側の実装が向いています。

費用も、単純なテンプレート数だけでは決まりません。`theme.json` の設計、テンプレートの種類、パターン数、編集権限、マニュアル作成、公開後の保守まで含めると、同じページ数でも工数は変わります。

UCHIWA Creative Studio. の料金ページでは、ブロックテーマ構築費として `theme.json` 設計・設定、テンプレート制作、ブロックパターン制作、ページ組み立て、カスタムCSS、カスタムブロック制作などの項目を分けています。リニューアル前には、「自分たちでどこを更新したいか」「どこは崩れてほしくないか」を整理しておくと、見積もりも現実的になります。

## ブロックテーマ作成の進め方まとめ

WordPress ブロックテーマを自作するなら、次の順番で進めると失敗しにくいです。

1. クラシックテーマとの違いを理解する
2. `style.css`、`theme.json`、`templates/index.html` の最小構成を作る
3. `parts/header.html` と `parts/footer.html` を追加する
4. サイトエディターで有効化・表示・保存を確認する
5. `theme.json` で色、幅、余白などの基本ルールを整える
6. 必要に応じて `page.html`、`single.html`、`archive.html` を増やす
7. 繰り返し使うセクションを `patterns` として整理する
8. 実際の運用者が触る範囲を確認する

最初から完成形を作ろうとすると、どこで崩れているのか分かりづらくなります。まずは最小構成で表示し、ひとつずつ確認しながら育てるのが近道です。

## 関連記事としてつなげたい内部リンク案

この記事は実践寄りの「作り方」記事なので、次のような記事と内部リンクでつなぐと検索意図を分けやすくなります。

- 親記事: [WordPress ブロックテーマとは？クラシックテーマとの違いと導入判断](/web-tips/wordpress-block-theme/)
- 比較記事: WordPress ブロックテーマとクラシックテーマの違い｜どちらを選ぶべきか
- 移行記事: クラシックテーマからブロックテーマへ移行する前に確認すること
- 費用記事: WordPress ブロックテーマ制作の費用相場と見積もり項目
- 関連既存記事: [WordPress ブロックエディター 使い方入門](/web-tips/wordpress-block-editor-guide/)
- 関連既存記事: [WordPressをヘッドレスCMSにする前に知っておきたい開発・運用の落とし穴](/web-tips/wordpress-headless-cms-pitfalls/)
- サービス導線: [事業内容](/service/)
- 料金導線: [料金表](/price/)
- 相談導線: [お問い合わせ](/contact/)

## WordPress ブロックテーマ制作の相談について

ブロックテーマは、うまく設計すれば「更新しやすいサイト」を作る強い選択肢になります。特に、コーポレートサイトやサービスサイトで、運用しながらページを育てたい場合には相性がよいです。

ただし、自由に編集できることと、事業サイトとして安定して運用できることは別です。見た目を崩さずに更新できる設計、`theme.json` の整理、テンプレートとパターンの分け方、公開後の保守まで含めて考える必要があります。

UCHIWA Creative Studio. では、WordPress構築、ブロックテーマ構築、運用改善まで対応しています。自作を進めている途中で詰まった場合や、リニューアルに合わせてブロックテーマを導入したい場合は、[お問い合わせ](/contact/) からお気軽にご相談ください。

## 参考リンク

- [Introduction to theme.json - Theme Handbook | Developer.WordPress.org](https://developer.wordpress.org/themes/global-settings-and-styles/introduction-to-theme-json/)
- [Global Settings & Styles (theme.json) - Block Editor Handbook | Developer.WordPress.org](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/)
- [Theme Structure - Theme Handbook | Developer.WordPress.org](https://developer.wordpress.org/themes/core-concepts/theme-structure/)
- [Templates - Theme Handbook | Developer.WordPress.org](https://developer.wordpress.org/themes/templates/templates/)
- [Template Parts - Theme Handbook | Developer.WordPress.org](https://developer.wordpress.org/themes/templates/template-parts/)
- [Registering Patterns - Theme Handbook | Developer.WordPress.org](https://developer.wordpress.org/themes/patterns/registering-patterns/)
- [Usage in Templates - Theme Handbook | Developer.WordPress.org](https://developer.wordpress.org/themes/patterns/usage-in-templates/)
