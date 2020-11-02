module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: false,
        loose: true,
        targets: {
          browsers: ['>2%'],
        },
      },
    ],
    '@babel/preset-react',
  ],
  plugins: ['@babel/plugin-transform-runtime', 'add-react-displayname'],
}
