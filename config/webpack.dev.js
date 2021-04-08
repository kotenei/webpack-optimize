const path = require("path");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const commonConfig = require("./webpack.common");

module.exports = merge(commonConfig, {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  output: {
    filename: "[name].js",
    // webpack 输出包中生成路径信息 会给捆绑数千个模块的项目带来垃圾收集的压力 这里设为false
    pathinfo: false,
  },
  // 缓存生成的webpack模块和块，以提高构建速度
  cache: {
    type: "memory",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.scss$/,
        exclude: /(node_modules)/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              ident: "postcss",
              importLoaders: 1, // 0 => no loaders (default); 1 => postcss-loader; 2 => postcss-loader, sass-loader
              plugins: () => [require("autoprefixer")()],
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../dll"),
          to: path.resolve(__dirname, "../dist"),
        },
      ],
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],

  optimization: {
    runtimeChunk: true,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    usedExports: true,
  },
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, "../dist"),
    open: false,
    hot: true,
    quiet: true,
    port: 8000,
  },
});
