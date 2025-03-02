const path = require('path');
const webpack = require('webpack')


const common = {
    module: {
        rules: [

            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ],
                        "plugins": [
                            "@babel/plugin-proposal-class-properties",
                        ]
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.txt$/i,
                use: 'raw-loader',
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif|pdf)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 100000,
                        name: '[name].[ext]'
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        })
    ],
    externals: {fs: "commonjs fs"}
}
const frontend = {
    entry: [
        './src/index.js'
    ],
    output: {
        path: path.resolve(__dirname, '../static/src/js'),
        filename: 'package.js'
    }
};
const store = {
    entry: [
        './src/store_front_end.js'
    ],
    output: {
        path: path.resolve(__dirname, '../static/src/js'),
        filename: 'pdf-invoice-frontend-button.js'
    }
};

const config = {}

module.exports = [
    Object.assign({}, common, frontend),
    Object.assign({}, common, store),
];
