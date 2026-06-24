import { MOCK_CATEGORIES, MOCK_WORKS } from "./wordpress-mock";

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

// すべての Works を GraphQL で取得
async function fetchAllGraphQLWorks() {
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
        }
      }
    }
  `;
  const data = await wpGraphQLFetch(query);
  return (data.posts?.nodes ?? []).map(mapWork);
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
            link
            name
            slug
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

// すべてのカテゴリーを GraphQL で取得
async function fetchGraphQLCategories() {
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
  const data = await wpGraphQLFetch(query);
  return (data.categories?.nodes ?? []).map(mapCategory);
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
    // 取得失敗時は既存モックへ退避する
    console.error(
      "[wordpress] GraphQL fetchWorks error, fallback to mock:",
      error,
    );
    return paginateWorks(MOCK_WORKS, page, perPage);
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
    // 取得失敗時はモック ID へ退避する
    console.error(
      "[wordpress] GraphQL fetchAllWorkIds error, fallback to mock:",
      error,
    );
    return MOCK_WORKS.map((work) => work.id);
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
    // 取得失敗時はモックから探す
    console.error(
      "[wordpress] GraphQL fetchWorkById error, fallback to mock:",
      error,
    );
    return MOCK_WORKS.find((work) => work.id === id) ?? null;
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
    // 取得失敗時はモックへ退避する
    console.error(
      "[wordpress] GraphQL fetchWorkCategories error, fallback to mock:",
      error,
    );
    return MOCK_CATEGORIES;
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
