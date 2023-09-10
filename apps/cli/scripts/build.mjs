import * as esbuild from "esbuild";
import inlineImage from "esbuild-plugin-inline-image";

// Can be used to get past bundling errors for scss.
// const noopSassPlugin = {
//   name: "noopsass",
//   setup(build) {
//     // Intercept import paths called "env" so esbuild doesn't attempt
//     // to map them to a file system location. Tag them with the "env-ns"
//     // namespace to reserve them for this plugin.
//     build.onResolve({ filter: /.+\.scss$/ }, (args) => ({
//       path: args.path,
//       namespace: "sass-ns",
//     }));

//     // Load paths tagged with the "env-ns" namespace and behave as if
//     // they point to a JSON file containing the environment variables.
//     build.onLoad({ filter: /.*/, namespace: "sass-ns" }, () => ({
//       contents: "{}",
//       loader: "json",
//     }));
//   },
// };

// const result =
await esbuild.build({
  entryPoints: ["index.ts"],
  bundle: true,
  platform: "node",
  target: "node16",
  // metafile: true,
  sourcemap: "linked",
  outfile: "dist/out.js",
  logLevel: "info",
  plugins: [
    inlineImage({
      limit: -1,
    }),
    // noopSassPlugin,
  ],
  loader: {
    ".wasm": "binary",
  },
});

// console.log(JSON.stringify(result.metafile, null, 2));
