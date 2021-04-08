const path = require("path");
const webpack = require("webpack");
const WebpackBar = require('webpackbar')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: {
    app: path.resolve(__dirname, "../src/index.tsx"),
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
  },
  resolve: {
    modules: [path.resolve(__dirname, '../node_modules')],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".sass"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [
          "thread-loader",
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              include: path.resolve(__dirname, "../src"),
            },
          },
        ],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: "asset/inline",
      },
    ],
  },
  plugins:[
    new CleanWebpackPlugin(),
    new webpack.DllReferencePlugin({
      manifest: require('../dll/vendor-manifest.json'),
      context: path.resolve(__dirname, '..')
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html',
    }),
    new WebpackBar(),
  ]
};
