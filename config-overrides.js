const webpack = require('webpack');

module.exports = function override(config, env) {
  config.externals = {
    chrome: 'chrome',
  };

  config.resolve = {
    ...config.resolve,
    fallback: {
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      crypto: require.resolve('crypto-browserify'),
      vm: require.resolve('vm-browserify'),
      assert: require.resolve("assert/"),
      process: require.resolve("process/browser"),
    },
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
}