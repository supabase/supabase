const path = require('path')

module.exports = {
  target: 'web',
  entry: { app: ['./index.js'] },
  mode: 'development',
  output: {
    path: path.resolve(path.resolve(), 'dist'),
    filename: 'bundle.js',
  },
  devServer: {
    watchContentBase: true,
    writeToDisk: true,
  },
}
