// copied from https://github.com/Jahmilli/k6-example

import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { defineConfig, Plugin } from "vite";

import fs from "fs";
import path from "path";
import fg from "fast-glob";

const getEntryPoints = (entryPoints) => {
  const files = fg.sync(entryPoints, { absolute: true });

  const entities = files.map((file) => {
    const [key] = file.match(/(?<=k6\/).*$/) || [];
    const keyWithoutExt = key?.replace(/\.[^.]*$/, "");

    return [keyWithoutExt, file];
  });

  return Object.fromEntries(entities);
};

function inlineOpenAsString(): Plugin {
  return {
    name: "inline-open-as-string",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".js") && !id.endsWith(".ts")) return;

      return code.replace(/open\((['"])(.+?)\1\)/g, (_, _quote, relPath) => {
        const absPath = path.resolve(path.dirname(id), relPath);

        if (!fs.existsSync(absPath)) {
          throw new Error(`File not found: ${absPath}`);
        }

        const rawContent = fs.readFileSync(absPath, "utf-8");
        const safeContent = rawContent.replace(/([$`\\])/g, "\\$1");
        return `\`${safeContent}\``;
      });
    },
  };
}

export default defineConfig({
  mode: "production",
  build: {
    lib: {
      entry: getEntryPoints(["./specs/*.ts"]),
      fileName: "[name]",
      formats: ["cjs"],
    },
    outDir: "dist",
    minify: false,
    rollupOptions: {
      external: [new RegExp(/^(k6|https?\:\/\/)(\/.*)?/)],
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    inlineOpenAsString(),
    babel({
      babelHelpers: "bundled",
      exclude: /node_modules/,
    }),
    nodeResolve(),
  ],
});
