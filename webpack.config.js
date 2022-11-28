// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");

const isProduction = process.env.NODE_ENV == "production";

const config = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app.js",
  },

  target: "node",
  module: {
    rules: [
      {
        test: /\.(ts|tsx|test.ts)$/i,
        loader: "ts-loader",
        //exclude: ["/node_modules/"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", "..."],
    modules: [path.resolve(__dirname, "/src"), "node_modules/"],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
