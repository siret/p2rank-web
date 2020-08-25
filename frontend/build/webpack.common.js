const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  "entry": {
    "analyze": path.join(__dirname, "..", "src", "analyze", "index.ts"),
    "index": path.join(__dirname, "..", "src", "index", "index.js"),
  },
  "output": {
    "path": path.join(__dirname, "..", "dist"),
    "publicPath": "./",
  },
  "resolve": {
    "extensions": [".js", ".jsx", ".ts", ".tsx"],
  },
  "module": {
    "rules": [
      {
        "test": /\.jsx?$/,
        "use": "babel-loader",
      },
      {
        "test": /\.tsx?$/,
        "use": "ts-loader",
        "exclude": /node_modules/,
      },
    ],
  },
  "plugins": [
    new HtmlWebpackPlugin({
      "filename": "about.html",
      "template": path.join(__dirname, "..", "public", "about.html"),
      "inject": false,
    }),
    new HtmlWebpackPlugin({
      "filename": "analyze.html",
      "template": path.join(__dirname, "..", "public", "analyze.html"),
      "inject": true,
      "chunks": ["analyze"],
    }),
    new HtmlWebpackPlugin({
      "filename": "help.html",
      "template": path.join(__dirname, "..", "public", "help.html"),
      "inject": false,
    }),
    new HtmlWebpackPlugin({
      "filename": "index.html",
      "template": path.join(__dirname, "..", "public", "index.html"),
      "inject": true,
      "chunks": ["index"],
    }),
    new HtmlWebpackPlugin({
      "filename": "privacy.html",
      "template": path.join(__dirname, "..", "public", "privacy.html"),
      "inject": false,
    }),
    new HtmlWebpackPlugin({
      "filename": "terms.html",
      "template": path.join(__dirname, "..", "public", "terms.html"),
      "inject": false,
    }),
  ],
};
