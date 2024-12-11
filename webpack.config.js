const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './public/background.js',
    output: {
        filename: 'background.js',
        path: path.resolve(__dirname, 'build'),
    },
    mode: 'production',
    target: 'web',
    experiments: {
        topLevelAwait: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: { chrome: '91' } }]
                        ]
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            "buffer": require.resolve("buffer/"),
            "assert": require.resolve("assert/"),
            "os": false,
            "fs": false,
            "path": false
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        })
    ]
};