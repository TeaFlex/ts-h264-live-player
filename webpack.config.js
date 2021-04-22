const res = require('path').resolve;
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter((x) => {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach((mod) => {
    nodeModules[mod] = `commonjs ${mod}`;
  });

module.exports = {
    entry: "./src/index.ts",
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
        filename: 'http-live-player2.js',
        path: res(__dirname, 'public')
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    externals: nodeModules,
    target: 'node',
};