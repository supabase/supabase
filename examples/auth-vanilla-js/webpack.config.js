const path = require('path')

module.exports = {
  entry: './index.js',
  mode: 'development',
  output: {
    path: path.resolve(path.resolve(), 'dist'),
    filename: 'bundle.js',
  },
}
