const path = require("path");

module.exports = {
  mode: "production",
  entry: "./js/app.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  output: {
    filename: "app.min.js",
    path: path.resolve(__dirname, "dist/js")
  }
};
