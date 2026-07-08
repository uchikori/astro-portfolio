// @ts-check
import { defineConfig } from "astro/config";
import glslify from "rollup-plugin-glslify";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";
import sitemap from "@astrojs/sitemap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = loadEnv(process.env.NODE_ENV, __dirname, "CF_");

// https://astro.build/config
export default defineConfig({
  site: env.CF_PAGES_URL || "https://www.uchiwa-design.net",
  // Astroの標準設定（出力先など）
  outDir: "./dist",
  publicDir: "./public",
  image: {
    domains: ["shin-pf.uchiwa-design.net"],
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "shin-pf.uchiwa-design.net",
    //   },
    // ],
  },
  server: {
    host: true,
  },
  integrations: [sitemap()],

  // Vite固有の設定はこちらに記述します
  vite: {
    plugins: [
      glslify({
        compress(code) {
          let needNewline = false;
          return code
            .replace(
              /\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/gs,
              "",
            )
            .split(/\n+/)
            .reduce((result, line) => {
              line = line.trim().replace(/\s{2,}|\t/, " ");
              if (line.charAt(0) === "#" || /else/.test(line)) {
                if (needNewline) {
                  result.push("\n");
                }
                result.push(line, "\n");
                needNewline = false;
              } else {
                result.push(
                  line.replace(
                    /\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|-|!|;)\s*/g,
                    "$1",
                  ),
                );
                needNewline = true;
              }
              return result;
            }, [])
            .join(process.env.NODE_ENV === "development" ? "\n" : "")
            .replace(/\n+/g, "\n");
        },
      }),
    ],
    resolve: {
      alias: [
        {
          find: "#",
          replacement: path.resolve(__dirname, "src/scripts"),
        },
      ],
    },
    server: {
      host: true,
    },
  },
});
