// @ts-check
import { defineConfig } from "astro/config";
import glslify from "rollup-plugin-glslify";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Astroの標準設定（出力先など）
  outDir: "./dist",
  publicDir: "./public",

  // Vite固有の設定はこちらに記述します
  vite: {
    plugins: [
      glslify({
        compress(code) {
          let needNewline = false;
          return code
            .replace(
              /\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/gs,
              ""
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
                    "$1"
                  )
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
