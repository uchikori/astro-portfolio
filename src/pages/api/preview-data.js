export default async function handler(req, res) {
  //1. クエリパラメータから記事IDを取得
  const { id } = req.query;

  // 記事IDがなければ400エラー
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  const WP_USER = import.meta.env.WORDPRESS_USER;
  const WP_PASSWORD = import.meta.env.WORDPRESS_PASSWORD;
  const WP_GRAPHQL_URL = import.meta.env.WORDPRESS_API_URL;

  // 認証情報の作成（Basic認証）
  const token = Buffer.from(`${WP_USER}:${WP_PASSWORD}`).toString("base64");

  // 投稿のステータスを取得
  const statusQuery = `
    query getStatus($id: ID!) {
      webTips(id: $id, idType: DATABASE_ID) {
        status
      }
    }
  `;

  // IDを渡して該当投稿のステータスを取得
  const statusResponse = await fetch(WP_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify({
      query: statusQuery,
      variables: { id },
    }),
  });

  // ステータス情報の結果を取得
  const statusData = await statusResponse.json();

  // GraphQLでエラーが出た場合
  if (statusData.errors) {
    console.error(statusData.errors);
    return res
      .status(500)
      .json({ error: "Status fetch failed", details: statusData.errors });
  }

  // 投稿のステータス(publish or draft)
  const postStatus = statusData.data?.webTips?.status;

  // 投稿のステータスが取得できない場合はエラー
  if (!postStatus) {
    return res.status(404).json({ error: "Post not found" });
  }

  // ----------------------------
  // ② 記事状態に応じて asPreview を切り替える
  // ----------------------------
  const isPreview = postStatus !== "publish"; // 公開でなければ preview 扱い

  // WordPressへのクエリ発行
  const query = `
       query getDraft($id: ID! $asPreview: Boolean) {
         webTips(id: $id, idType: DATABASE_ID, asPreview: $asPreview) {
                databaseId
                title
                content
                excerpt
                modified
                dateGmt
                lastEditedBy {
                    node {
                        name
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
                date
                featuredImage {
                    node {
                        altText
                        mediaItemUrl
                    }
                }
            }
        }
      `;

  // ----------------------------
  // ③ 本体データ取得（asPreview: true/false）
  // ----------------------------
  try {
    // WordPressへクエリを送信
    const response = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { id, asPreview: isPreview },
      }),
    });

    // JSONとしてパースし直す (ここでJSONエラーが出ないかチェック)
    const data = await response.json();

    // ... (GraphQLエラーチェック) ...
    if (data.errors) {
      console.error("GraphQL Error:", data.errors);
      return res
        .status(500)
        .json({ error: "GraphQL query failed", details: data.errors });
    }

    // const data = await response.json();

    //フロントエンドにデータを返す
    res.status(200).json(data.data.webTips);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
