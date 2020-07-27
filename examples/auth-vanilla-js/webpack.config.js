const path = require('path')

module.exports = {
  entry: ['webpack/hot/dev-server' , './index.js'],
  mode: 'development',
  output: {
    path: path.resolve(path.resolve(), 'dist'),
    filename: 'bundle.js',
  },
}
