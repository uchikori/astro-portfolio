import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * WordPress GraphQL API helpers.
 * API 未設定時は空結果を返し、設定済みなら WordPress から取得します。
 */
const DEFAULT_PER_PAGE = 12;

/**
 * API のベース URL を返します。
 * @returns {string | null} API のベース URL
 */
function getApiBaseUrl() {
  // 環境変数から API の URL を取得する
  const url = import.meta.env.WORDPRESS_API_URL;
  // 未設定なら null を返す
  if (!url) return null;
  // 末尾の / を除去する
  const clean = url.replace(/\/$/, "");
  // /graphql で終わっていない場合は /graphql を補う
  return clean.endsWith("/graphql") ? clean : `${clean}/graphql`;
}

/**
 * API のベース URL が設定されているかを判定します。
 * @returns {boolean} 設定済みなら true
 */
export function isWordPressConfigured() {
  // API URL が取得できるかどうかで判定する
  return Boolean(getApiBaseUrl());
}

/**
 * 1ページあたりの表示件数を返します。
 * @returns {number} 1ページあたりの表示件数
 */
export function getWorksPerPage() {
  // 環境変数から 1ページあたりの件数を取得する
  const value = Number(import.meta.env.WORKS_PER_PAGE);
  // 正の数ならその値を使い、そうでなければ既定値を使う
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PER_PAGE;
}

/**
 * HTML エンティティのデコード
 * @param {*} text
 * @returns
 */
function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * HTML タグの除去
 * @param {*} html
 * @returns
 */
function stripHtml(html) {
  if (!html) return "";
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, "").trim());
}

/**
 * GraphQL のノードデータをフロント用 Work オブジェクトに変換
 * @param {*} node
 * @returns
 */
function mapWork(node) {
  // アイキャッチ画像を取得する
  const featured = node.featuredImage?.node;
  // カテゴリーを取得する
  const categories = (node.terms?.nodes ?? [])
    // category taxonomy だけに絞る
    .filter((term) => term.taxonomyName === "category")
    // フロント側で使う WorkCategory 形式に変換する
    .map((term) => ({
      id: term.databaseId,
      name: decodeHtmlEntities(term.name),
      slug: term.slug,
      count: term.count ?? 0,
    }));
  // タグを取得する
  const tags = (node.tags?.nodes ?? [])
    // tag taxonomy だけに絞る
    .filter((term) => term.taxonomyName === "post_tag")
    // フロント側で使う tag 形式に変換する
    .map((term) => ({
      id: term.databaseId,
      name: decodeHtmlEntities(term.name),
      slug: term.slug,
      count: term.count ?? 0,
    }));

  return {
    id: node.databaseId,
    slug: node.slug,
    title: stripHtml(node.title),
    content: node.content ?? "",
    excerpt: node.excerpt ?? "",
    date: node.date,
    modified: node.modified,
    thumbnailUrl: featured?.sourceUrl ?? null,
    thumbnailAlt: featured?.altText ?? "",
    categories,
    tags,
    mockupImageSp: node.mockUpImageSp?.mockupImageSp ?? null,
    mockupImageTab: node.mockUpImageTab?.mockupImageTab ?? null,
    mockupImagePc: node.mockUpImagePc?.mockupImagePc ?? null,
    mockupMovie: node.mockupMovie?.mockupMovie ?? null,
  };
}

/**
 * GraphQL のノードデータを WorkCategory オブジェクトに変換
 * @param {*} node
 * @returns
 */
function mapCategory(node) {
  return {
    id: node.databaseId,
    name: decodeHtmlEntities(node.name),
    slug: node.slug,
    count: node.count ?? 0,
  };
}

/**
 * WordPress GraphQL API を呼び出す
 * @param {*} query
 * @param {*} variables GraphQL の変数
 * @returns
 */
async function wpGraphQLFetch(query, variables = {}) {
  // API のベース URL を取得する
  const url = getApiBaseUrl();
  // URL が未設定ならエラーにする
  if (!url) {
    throw new Error("WORDPRESS_API_URL is not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // 認証情報があれば Basic 認証を付与する
  const authUser = import.meta.env.WORDPRESS_AUTH_USER;
  const authPass = import.meta.env.WORDPRESS_AUTH_PASSWORD;
  if (authUser && authPass) {
    headers.Authorization = `Basic ${btoa(`${authUser}:${authPass}`)}`;
  }

  // GraphQL エンドポイントへリクエストする
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  // HTTP エラーは例外にする
  if (!response.ok) {
    throw new Error(
      `WordPress GraphQL error: ${response.status} ${response.statusText} (${url})`,
    );
  }

  // レスポンス JSON を読む
  const result = await response.json();
  // GraphQL エラーも例外にする
  if (result.errors) {
    throw new Error(`GraphQL Query Errors: ${JSON.stringify(result.errors)}`);
  }

  // data を返す
  return result.data;
}

// ビルド時のモジュールレベルキャッシュ（同一プロセス内で1回だけ API を呼ぶ）
let _worksListCache = null;

// すべての Works を GraphQL で取得
function fetchAllGraphQLWorks() {
  if (_worksListCache) return _worksListCache;
  const query = `
    query GetWorks {
      posts(first: 100) {
        nodes {
          databaseId
          slug
          title
          content
          excerpt
          date
          modified
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          terms {
            nodes {
              databaseId
              name
              slug
              taxonomyName
              count
            }
          }
          tags {
            nodes {
              databaseId
              name
              slug
              taxonomyName
              count
            }
          }
        }
      }
    }
  `;
  _worksListCache = wpGraphQLFetch(query).then((data) =>
    (data.posts?.nodes ?? []).map(mapWork),
  );
  return _worksListCache;
}

// 指定 ID の Work を GraphQL で取得
async function fetchGraphQLWorkById(id) {
  const query = `
    query GetWork($id: ID!) {
      post(id: $id, idType: DATABASE_ID) {
        databaseId
        slug
        title
        content
        excerpt
        date
        modified
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        terms {
          nodes {
            databaseId
            name
            slug
            taxonomyName
            count
          }
        }
        tags {
          nodes {
            databaseId
            name
            slug
            taxonomyName
            count
          }
        }
        galleryNumber {
          galleryNum
        }
        galleryMetaGroup {
          galleryMetaGroup {
            galleryRole
            galleryTech
            galleryType
            galleryYear
          }
        }
        englishTitle {
          englishTitle
        }
        mockUpMovie {
          mockupMovie {
            mediaItemUrl
          }
        }
        mockUpImageTab {
          mockupImageTab {
            altText
            mediaItemUrl
          }
        }
        mockUpImageSp {
          mockupImageSp {
            altText
            mediaItemUrl
          }
        }
        mockUpPc {
          mockupImagePc {
            altText
            mediaItemUrl
          }
        }
        cssMockupImage {
          cssMockupImage {
            altText
            mediaItemUrl
          }
        }
        linkBtn {
          linkBtn
        }
      }
    }
  `;
  const data = await wpGraphQLFetch(query, { id: String(id) });
  return data.post ? mapWork(data.post) : null;
}

// カテゴリーキャッシュ
let _categoriesCache = null;

// すべてのカテゴリーを GraphQL で取得
function fetchGraphQLCategories() {
  if (_categoriesCache) return _categoriesCache;
  const query = `
    query GetCategories {
      categories {
        nodes {
          databaseId
          name
          slug
          count
        }
      }
    }
  `;
  _categoriesCache = wpGraphQLFetch(query).then((data) =>
    (data.categories?.nodes ?? []).map(mapCategory),
  );
  return _categoriesCache;
}

/**
 * Works をページングする
 * @param {*} works
 * @param {*} page
 * @param {*} perPage
 * @returns
 */
function paginateWorks(works, page, perPage) {
  // 総件数を数える
  const total = works.length;
  // 総ページ数を計算する
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  // 現在ページを範囲内に収める
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  // 現在のページの取得開始位置を計算する
  const start = (currentPage - 1) * perPage;

  return {
    works: works.slice(start, start + perPage), // star=>開始番号, start + perPage=>何個取得するか
    total,
    totalPages,
    currentPage,
    perPage,
  };
}

/**
 * Works 一覧を取得する
 * @returns
 */
export async function fetchWorks(options = {}) {
  // ページ番号を決める
  const page = options.page ?? 1;
  // 1ページあたり件数を決める
  const perPage = options.perPage ?? getWorksPerPage();

  // API 未設定なら空一覧を返す
  if (!isWordPressConfigured()) {
    return paginateWorks([], page, perPage);
  }

  try {
    // WordPress から一覧を取得する
    let works = await fetchAllGraphQLWorks();
    // カテゴリースラッグ指定があれば絞り込む
    if (options.categorySlug) {
      works = works.filter((work) =>
        work.categories.some((cat) => cat.slug === options.categorySlug),
      );
    }
    // ページングした結果を返す
    return paginateWorks(works, page, perPage);
  } catch (error) {
    console.error("[wordpress] GraphQL fetchWorks error:", error);
    return paginateWorks([], page, perPage);
  }
}

/**
 * getStaticPaths 用に Works の ID を取得する
 */
export async function fetchAllWorkIds() {
  // API 未設定なら空配列を返す
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    // WordPress から取得した ID を返す
    const works = await fetchAllGraphQLWorks();
    return works.map((work) => work.id);
  } catch (error) {
    console.error("[wordpress] GraphQL fetchAllWorkIds error:", error);
    return [];
  }
}

/**
 * Work ID から詳細を取得する
 */
export async function fetchWorkById(id) {
  // API 未設定なら null を返す
  if (!isWordPressConfigured()) {
    return null;
  }

  try {
    // WordPress から詳細を取得する
    return await fetchGraphQLWorkById(id);
  } catch (error) {
    console.error("[wordpress] GraphQL fetchWorkById error:", error);
    return null;
  }
}

/**
 * Works カテゴリー一覧を取得する
 */
export async function fetchWorkCategories() {
  // API 未設定なら空配列を返す
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    // WordPress からカテゴリーを取得する
    return await fetchGraphQLCategories();
  } catch (error) {
    console.error("[wordpress] GraphQL fetchWorkCategories error:", error);
    return [];
  }
}

/**
 * カテゴリースラッグからカテゴリー情報を取得する
 */
export async function fetchWorkCategoryBySlug(slug) {
  // すべてのカテゴリーから対象を探す
  const categories = await fetchWorkCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

/**
 * 2ページ目以降のパスを返す
 */
export function getPaginationPaths(totalPages) {
  if (totalPages <= 1) return [];
  return Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
}

/**
 * Works 一覧のベース URL を返す
 */
export function getWorksBasePath(categorySlug) {
  if (categorySlug) {
    return `/works/category/${categorySlug}`;
  }
  return "/works";
}

/**
 * Works 一覧のページ URL を返す
 */
export function getWorksListUrl(page, categorySlug) {
  const base = getWorksBasePath(categorySlug);
  if (page <= 1) return base;
  return `${base}/page/${page}`;
}

/**
 * Work 詳細の URL を返す
 */
export function getWorkDetailUrl(id) {
  return `/works/${id}`;
}

/**
 * カテゴリーページの URL を返す
 */
export function getWorkCategoryUrl(slug, page = 1) {
  return getWorksListUrl(page, slug);
}

/**
 * カテゴリータグの URL を返す
 */
export function getWorkCategoryTagUrl(slug) {
  return `/works/category/${slug}`;
}

/**
 * 同一タグの関連作品をランダムで取得する
 * @param {number} workId 対象の作品 ID
 * @param {number} limit 取得件数
 * @returns {Promise<Array>}
 */
export async function fetchRelatedWorksByTags(workId, limit = 3) {
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    const work = await fetchWorkById(workId);
    if (!work || work.tags.length === 0) {
      return [];
    }

    const allWorks = await fetchAllGraphQLWorks();

    const relatedWorks = allWorks.filter((w) => {
      if (w.id === workId) {
        return false;
      }
      return work.tags.some((tag) => w.tags.some((wTag) => wTag.id === tag.id));
    });

    const shuffled = relatedWorks.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("[wordpress] fetchRelatedWorksByTags error:", error);
    return [];
  }
}

// ============================================================
// web-tips (allWebTips カスタム投稿) 関連
// ============================================================

/**
 * GraphQL のノードデータをフロント用 web-tips オブジェクトに変換
 */
function mapWebTips(node) {
  // アイキャッチ画像を取得する
  const featured = node.featuredImage?.node;
  // タクソノミー=classのクラスを取得する
  const classes = (node.terms?.nodes ?? [])
    // classタクソノミーだけを抽出
    .filter((term) => term.taxonomyName === "class")
    // classタクソノミーをフロント用の形式に変換
    .map((term) => ({
      id: term.databaseId,
      name: decodeHtmlEntities(term.name),
      slug: term.slug,
      count: term.count ?? 0,
    }));

  return {
    id: node.databaseId,
    slug: node.slug,
    title: stripHtml(node.title),
    content: node.content ?? "",
    excerpt: node.excerpt ?? "",
    date: node.date,
    modified: node.modified,
    thumbnailUrl: featured?.mediaItemUrl ?? null,
    thumbnailAlt: featured?.altText ?? "",
    classes,
  };
}

/**
 * GraphQL のノードデータを class オブジェクトに変換
 * @param {*} node
 * @returns
 */
function mapClass(node) {
  return {
    id: node.databaseId,
    name: decodeHtmlEntities(node.name),
    slug: node.slug,
    count: node.count ?? 0,
  };
}

/**
 * 1ページあたりの表示件数を返します。
 * @returns {number} 1ページあたりの表示件数
 */
export function getWebTipsPerPage() {
  // 環境変数から 1ページあたりの件数を取得する
  const value = Number(import.meta.env.WEB_TIPS_PER_PAGE);
  // 正の数ならその値を使い、そうでなければ既定値を使う
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PER_PAGE;
}

/**
 * ページネーション
 * @param {*} posts
 * @param {*} page
 * @param {*} perPage
 * @returns
 */
function paginateBlogPosts(posts, page, perPage) {
  // 全体数を計算する
  const total = posts.length;
  // 最大ページ数を計算する
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  // 現在のページ数を計算する
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  // 開始位置を計算する
  const start = (currentPage - 1) * perPage;

  return {
    posts: posts.slice(start, start + perPage),
    total,
    totalPages,
    currentPage,
    perPage,
  };
}

/**
 * 作成日降順で並び替え
 * @param {*} posts
 * @returns
 */
export function sortPostsByDateDesc(posts) {
  return [...posts].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

/**
 * クラスをビルドする
 * @param {*} posts
 * @returns
 */
export function buildWebTipsClasses(posts) {
  // 空のマップを作成する
  const classMap = new Map();

  // postsをループする
  for (const post of posts) {
    // postが持つclasses配列をループする
    for (const cls of post.classes ?? []) {
      // classをクラスマップから取得する
      const current = classMap.get(cls.slug);
      // classMapにクラスを更新する
      classMap.set(cls.slug, {
        id: cls.id,
        name: cls.name,
        slug: cls.slug,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [...classMap.values()].sort((left, right) => right.count - left.count);
}

// web-tips リストキャッシュ
let _blogPostsListCache = null;

/**
 * 全ての web-tips を取得する
 * @returns {Promise<Array>}
 */
function fetchAllGraphQLBlogPosts() {
  if (_blogPostsListCache) return _blogPostsListCache;
  const query = `
    query GetWebTips {
      allWebTips(first: 1000) {
        nodes {
          databaseId
          slug
          title
          excerpt
          date
          modified
          featuredImage {
            node {
              mediaItemUrl
              altText
            }
          }
          terms {
            nodes {
              databaseId
              name
              slug
              taxonomyName
              count
            }
          }
        }
      }
    }
  `;
  _blogPostsListCache = wpGraphQLFetch(query).then((data) =>
    (data.allWebTips?.nodes ?? []).map(mapWebTips),
  );
  return _blogPostsListCache;
}

/**
 * 指定された ID を持つ web-tips を取得する
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function fetchGraphQLWebTipById(id) {
  const query = `
    query GetWebTip($id: ID!) {
      webTips(id: $id, idType: DATABASE_ID) {
        databaseId
        slug
        title
        content
        excerpt
        date
        modified
        featuredImage {
          node {
            mediaItemUrl
            altText
          }
        }
        terms {
          nodes {
            databaseId
            name
            slug
            taxonomyName
            count
          }
        }
      }
    }
  `;
  const data = await wpGraphQLFetch(query, { id: String(id) });
  return data.webTips ? mapWebTips(data.webTips) : null;
}

// classキャッシュ
let _classesCache = null;

/**
 * すべてのclassを取得
 * @returns {Promise<Array>}
 */
function fetchAllGraphQLClasses() {
  if (_classesCache) return _classesCache;
  const query = `
    query GetClasses {
      allType {
        nodes {
          databaseId
          name
          slug
          count
        }
      }
    }
  `;
  _classesCache = wpGraphQLFetch(query).then((data) =>
    (data.allType?.nodes ?? []).map(mapClass),
  );
  return _classesCache;
}

/**
 * web-tips を取得する
 * @param {*} options
 * @returns
 */
export async function fetchBlogPosts(options = {}) {
  // 現在のページを取得
  const page = options.page ?? 1;
  // 1ページあたりの表示件数を取得
  const perPage = options.perPage ?? getWebTipsPerPage();

  // WordPressが設定されていない場合は、空の配列を返す
  if (!isWordPressConfigured()) {
    return paginateBlogPosts([], page, perPage);
  }

  try {
    // 全ての web-tips を取得して、作成日降順で並び替える
    let posts = sortPostsByDateDesc(await fetchAllGraphQLBlogPosts());
    // optionsにカテゴリが指定されている場合は、カテゴリで絞り込む
    if (options.categorySlug) {
      // 指定されたカテゴリと投稿の持つslugが一致するものをフィルタリング
      posts = posts.filter((post) =>
        post.classes.some((cls) => cls.slug === options.categorySlug),
      );
    }
    // ページネーションを適用する
    return paginateBlogPosts(posts, page, perPage);
    // エラーハンドリング
  } catch (error) {
    console.error("[wordpress] GraphQL fetchBlogPosts error:", error);
    return paginateBlogPosts([], page, perPage);
  }
}

/**
 * 全ての web-tips の ID を取得する
 * @returns {Promise<Array>}
 */
export async function fetchAllBlogIds() {
  // WordPressが設定されていない場合は、空の配列を返す
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    // 全ての web-tips を取得する
    const posts = await fetchAllGraphQLBlogPosts();
    // IDだけを取り出して返す
    return posts.map((post) => post.id);
    // エラーハンドリング
  } catch (error) {
    console.error("[wordpress] GraphQL fetchAllBlogIds error:", error);
    return [];
  }
}

/**
 * 指定された ID を持つ web-tips を取得する
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function fetchBlogPostById(id) {
  if (!isWordPressConfigured()) {
    return null;
  }

  try {
    return await fetchGraphQLWebTipById(id);
  } catch (error) {
    console.error("[wordpress] GraphQL fetchBlogPostById error:", error);
    return null;
  }
}

/**
 * web-tips のカテゴリを取得する
 * @returns {Promise<Array>}
 */
export async function fetchBlogCategories() {
  // WordPressが設定されていない場合は、空の配列を返す
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    const classes = await fetchGraphQLAllClasses();
    return buildWebTipsClasses(posts);
  } catch (error) {
    console.error("[wordpress] GraphQL fetchBlogCategories error:", error);
    return [];
  }
}

/**
 * Works カテゴリー一覧を取得する
 */
export async function fetchWebTipsClasses() {
  // API 未設定なら空配列を返す
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    // WordPress からカテゴリーを取得する
    return await fetchAllGraphQLClasses();
  } catch (error) {
    console.error("[wordpress] GraphQL fetchWebTipsClasses error:", error);
    return [];
  }
}

/**
 * 指定された ID を持つ web-tips に関連する web-tips を取得する
 * @param {number} postId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchRelatedBlogPostsByTags(postId, limit = 3) {
  // WordPressが設定されていない場合は、空の配列を返す
  if (!isWordPressConfigured()) {
    return [];
  }

  try {
    // 指定された ID を持つ web-tips を取得する
    const post = await fetchBlogPostById(postId);

    // 指定された ID を持つ web-tips のクラス（ターム）を取得する
    const referenceClasses = post?.classes ?? [];
    // 指定された ID を持つ web-tips が存在しない場合は、空の配列を返す
    if (!post || referenceClasses.length === 0) {
      return [];
    }

    // 全ての web-tips を取得する
    const allPosts = await fetchAllGraphQLBlogPosts();
    // 指定された ID を持つ web-tips 以外の、指定された ID を持つ web-tips とクラス（ターム）が一致するものをフィルタリングする
    const relatedPosts = allPosts.filter((entry) => {
      if (entry.id === postId) return false; // 指定された ID を持つ web-tips 自身は除外する

      // 指定された web-tips のクラス（ターム）と、エントリのクラス（ターム）のいずれかが一致する場合は true を返す
      return referenceClasses.some((cls) =>
        (entry.classes ?? []).some((entryCls) => entryCls.slug === cls.slug),
      );
    });

    // 結果を日付降順で並び替え、limitで指定された数だけ返す
    return sortPostsByDateDesc(relatedPosts).slice(0, limit);
    // エラーハンドリング
  } catch (error) {
    console.error("[wordpress] fetchRelatedBlogPostsByTags error:", error);
    return [];
  }
}

/**
 * web-tips のベースパスを取得する
 * @returns {string}
 */
export function getBlogBasePath(categorySlug) {
  if (categorySlug) {
    return `/web-tips/class/${categorySlug}`;
  }
  return "/web-tips";
}

/**
 * web-tips のリストページの URL を取得する
 * @param {number} page
 * @returns {string}
 */
export function getBlogListUrl(page, categorySlug) {
  const base = getBlogBasePath(categorySlug);
  if (page <= 1) return base;
  return `${base}/page/${page}`;
}

/**
 * web-tips の詳細ページの URL を取得する
 * @param {number} id
 * @returns {string}
 */
export function getBlogDetailUrl(id) {
  return `/web-tips/${id}`;
}

/**
 * 全ての web-tips をソート済み（日付降順）で取得する
 * @returns {Promise<Array>}
 */
export async function fetchAllBlogPosts() {
  if (!isWordPressConfigured()) {
    return [];
  }
  try {
    return sortPostsByDateDesc(await fetchAllGraphQLBlogPosts());
  } catch (error) {
    console.error("[wordpress] GraphQL fetchAllBlogPosts error:", error);
    return [];
  }
}

/**
 * Works のキャッシュ済みリストを返す（getStaticPaths 内での関連 works 計算用）
 * @returns {Promise<Array>}
 */
export async function fetchAllWorksRaw() {
  if (!isWordPressConfigured()) {
    return [];
  }
  try {
    return await fetchAllGraphQLWorks();
  } catch (error) {
    console.error("[wordpress] fetchAllWorksRaw error:", error);
    return [];
  }
}

/**
 * web-tips のキャッシュ済みリストを返す（getStaticPaths 内での関連 posts 計算用）
 * @returns {Promise<Array>}
 */
export async function fetchAllBlogPostsRaw() {
  if (!isWordPressConfigured()) {
    return [];
  }
  try {
    return await fetchAllGraphQLBlogPosts();
  } catch (error) {
    console.error("[wordpress] fetchAllBlogPostsRaw error:", error);
    return [];
  }
}

/**
 * web-tips のカテゴリのURIを返す
 * @param {*} slug
 * @returns
 */
export function getBlogCategoryUri(slug, page = 1) {
  return getBlogListUrl(page, slug);
}

// ============================================================
// analytics
// ============================================================
/**
 * Google Analytics 4 からページビュー数を取得する関数
 */
export async function fetchPageViews() {
  const propertyId = import.meta.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const startDate = "90daysAgo";
  const endDate = "today";
  const privateKey = import.meta.env.PRIVATE_KEY;

  if (!propertyId) {
    console.warn("[Analytics] GOOGLE_ANALYTICS_PROPERTY_ID is not set");
    return [];
  }

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: import.meta.env.CLIENT_EMAIL,
        private_key: privateKey.split(String.raw`\n`).join("\n"),
      },
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: "pagePath" }],
      dateRanges: [{ startDate, endDate }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "BEGINS_WITH",
            value: "/web-tips/" /* ブログページに共通するパス */,
          },
        },
      },
      metrics: [
        {
          name: "screenPageViews",
        },
      ],
      orderBys: [
        {
          desc: true,
          metric: {
            metricName: "screenPageViews",
          },
        },
      ],
    });

    // pagePath から記事IDを抽出する（例: /web-tips/123 → 123）
    const rankingEntries = (response.rows ?? [])
      .map((row) => {
        const pagePath = row.dimensionValues[0].value;
        const pageViews = parseInt(row.metricValues[0].value, 10);
        // /web-tips/{id} の形式から数値IDを抽出する
        const parts = pagePath.split("/").filter((s) => s !== "");
        // parts = ["web-tips", "123"] のような配列になる
        if (parts.length === 2 && parts[0] === "web-tips") {
          const id = parseInt(parts[1], 10);
          if (Number.isFinite(id)) {
            return { id, pageViews };
          }
        }
        return null;
      })
      .filter(Boolean);

    // 上位5件のIDを取得する
    const topEntries = rankingEntries.slice(0, 5);

    // 各記事の詳細を取得する
    const posts = await Promise.all(
      topEntries.map(async (entry) => {
        const post = await fetchGraphQLWebTipById(entry.id);
        if (!post) return null;
        // pageViews を付与して返す
        return { ...post, pageViews: entry.pageViews };
      }),
    );

    // null を除外して返す
    return posts.filter(Boolean);
  } catch (error) {
    console.error("[Analytics] Failed to fetch page views:", error);
    return [];
  }
}
