const merge = require("webpack-merge");
const common = Object.assign({}, require("./webpack.common"));

module.exports = merge(common, {
  "mode": "development",
  "devtool": "eval",
  "devServer": {
    "hot": true,
  },
  "module": {
    "rules": [
      {
        "enforce": "pre",
        "test": /\.(js|jsx)$/,
        "exclude": /node_modules/,
        "use": ["babel-loader"] // , "eslint-loader"
      },
      {
        "test": /\.(sa|sc|c)ss$/,
        "loader": "style-loader!css-loader",
      },
    ],
  },
});
