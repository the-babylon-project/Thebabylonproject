const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    node: {
        // fs: 'empty'
    },
    resolve: {
        fallback: {
        //     path: { "path": require.resolve("path-browserify") },
        //     stream: {"stream": require.resolve("stream-browserify")},
        //     fs: false
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    }
};
