import * as esbuild from "esbuild";
import inlineImage from "esbuild-plugin-inline-image";

await esbuild.build({
  entryPoints: ["index.ts"],
  bundle: true,
  platform: "node",
  outfile: "dist/out.js",
  plugins: [
    inlineImage({
      limit: -1,
    }),
  ],
});
