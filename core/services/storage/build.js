// biome-ignore lint/style/noCommonJs: build script runs as CommonJS
const { build } = require('esbuild')

build({
  entryPoints: ['./src/**/*.ts'],
  bundle: false,
  outdir: 'dist',
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  loader: { '.ts': 'ts' },
}).catch((e) => {
  console.error(e)
  process.exit(1)
})
