const path = require("path");
const merge = require("webpack-merge");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const common = Object.assign({}, require("./webpack.common"));

module.exports = merge(common, {
  "mode": "production",
  "output": {
    "filename": path.join("assets", "bundle.[chunkhash].js"),
  },
  "optimization": {
    "splitChunks": {
      "cacheGroups": {
        "litemol": {
          "test": /[\\/]litemol[\\/]/,
          "chunks": "all",
          "priority": 1,
          "filename": path.join("assets", "litemol.[chunkhash].js"),
        },
        "commons": {
          "test": /[\\/]node_modules[\\/]/,
          "chunks": "all",
          "priority": 0,
          "filename": path.join("assets", "commons.[chunkhash].js"),
        },
        "protael": {
          "test": /protael.js/,
          "chunks": "all",
          "priority": 1,
          "filename": path.join("assets", "protael.[chunkhash].js"),
        },
      },
    },
    "minimizer": [
      new OptimizeCSSAssetsPlugin({}),
      new TerserPlugin({
        "cache": true,
        "parallel": false,
        "sourceMap": false,
        "terserOptions": {
          // https://github.com/terser/terser#compress-options
          "compress": {
            "ecma": 6,
          },
        },
      }),
    ],
  },
  "module": {
    "rules": [
      {
        "test": /\.(sa|sc|c)ss$/,
        "use": [
          MiniCssExtractPlugin.loader,
          "css-loader",
        ],
      },
    ],
  },
  "plugins": [
    new CleanWebpackPlugin({}),
    new MiniCssExtractPlugin({
      "filename": path.join("assets", "main.[chunkhash].css"),
    }),
    new CopyWebpackPlugin([{
      "from": path.join(__dirname, "..", "public", "assets"),
      "to": path.join(__dirname, "..", "dist", "assets"),
    }]),
  ],
});
