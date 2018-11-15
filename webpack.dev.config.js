const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
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
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
    publicPath: "/js/",
    hot: true
  }
};
