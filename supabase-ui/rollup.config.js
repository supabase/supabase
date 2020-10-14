import babel from '@rollup/plugin-babel'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import del from 'rollup-plugin-delete'
import pkg from './package.json'

export default {
  input: pkg.source,
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'esm' },
  ],
  plugins: [
    postcss({
      plugins: require('./postcss.config').plugins,
      minimize: true,
      sourceMap: 'inline',
    }),
    external(),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
    }),
    del({ targets: ['dist/*'] }),
  ],
  external: [
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
  ],
}
