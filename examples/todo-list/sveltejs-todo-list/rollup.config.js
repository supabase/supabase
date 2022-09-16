import run from '@rollup/plugin-run'
import svelte from 'rollup-plugin-svelte'
// import { skypackResolver } from '@vinicius73/rollup-plugin-skypack-resolver'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

import json from '@rollup/plugin-json'
import injectProcessEnv from 'rollup-plugin-inject-process-env'
// env can also be done by replacing strings -> '@rollup/plugin-replace'
// import replace from '@rollup/plugin-replace'
import dotenv from 'dotenv'
dotenv.config()

export default {
  input: 'bin/prerender.js', //'bin/prerender.js',
  // input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    // format: 'es',
    name: 'app',
    file: 'public/build/bundle.js',
    //    file: 'bin/dist/prerender.js',
  },
  plugins: [
    // skypackResolver({
    //   modules: ['svelte', '@supabase/supabase-js'],
    //   cdnHost: "https://cdn.skypack.dev"
    // }),
    json(),
    svelte({}),
    resolve({
      browser: true,
      dedupe: ['svelte'], // '@supabase/supabase-js','cypress-svelte-unit-test'
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    // // in using replace for strings
    // replace({
    //   process: JSON.stringify({
    //     env: process.env
    //   })
    // }),
    injectProcessEnv(process.env),
    run(),
  ],
  onwarn(warning, warn) {
    if (warning.code === 'UNRESOLVED_IMPORT') return
    warn(warning)
  },
}
