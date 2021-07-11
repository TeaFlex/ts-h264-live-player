const res = require('path').resolve;

module.exports = {
    entry: "./src/index.ts",
    mode: "development",
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [res(__dirname, 'src')],
            }
        ]
    },
    output: {
        filename: 'ts-http-live-player.js',
        path: res(__dirname, 'public'),
        // libraryTarget: "var",
        // library: "Live"
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        fallback: {
          fs: false,
          lapack: false,
        }
    },
    plugins: [
    ]
};