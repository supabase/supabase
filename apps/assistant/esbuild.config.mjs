import { mkdirSync } from 'node:fs'
import * as esbuild from 'esbuild'

const workers = ['api']

mkdirSync('supabase/workers/api', { recursive: true })

await Promise.all(
  workers.map((name) =>
    esbuild.build({
      absWorkingDir: import.meta.dirname,
      entryPoints: [`supabase/workers/${name}/index.ts`],
      outfile: `supabase/workers/${name}/index.mjs`,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node22',
      packages: 'bundle',
      sourcemap: true,
      logLevel: 'info',
      external: ['pg-native'],
    })
  )
)
