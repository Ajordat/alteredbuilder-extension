const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        popup: './src/popup.js', // Entry point for popup script
        background: './src/background.js', // Entry point for background script
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js', // Output bundles for each entry
    },
    module: {
        rules: [
            {
                test: /\.css$/, // For CSS files
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif)$/, // For images
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'popup.html', // Output file in dist/
            chunks: ['popup'], // Include only the popup script
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/manifest.json', to: 'manifest.json' }, // Copy manifest
                { from: 'src/assets', to: 'assets' }, // Copy assets like icons
            ],
        }),
    ],
    mode: 'development', // Set to 'production' for optimized builds
};
