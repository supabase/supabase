const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  entry: {
    'index.js': './src/index.js',
    'Components/index.js': './src/Components.js',
    'Docs/index.js': './src/Docs.js',
  },
  output: {
    path: __dirname,
    filename: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  externals: [
    { react: { root: 'React', amd: 'react', commonjs: 'react', commonjs2: 'react' } },
    {
      'react-dom': {
        root: 'ReactDOM',
        amd: 'react-dom',
        commonjs: 'react-dom',
        commonjs2: 'react-dom',
      },
    },
    {
      tailwindcss: {
        root: 'tailwindcss',
        amd: 'tailwindcss',
        commonjs: 'tailwindcss',
        commonjs2: 'tailwindcss',
      },
    },
  ],
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          cacheDirectory: true,
          presets: ['@babel/preset-react'],
        },
      },
      {
        test: /\.mdx?$/,
        use: ['babel-loader', '@mdx-js/loader'],
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
}
