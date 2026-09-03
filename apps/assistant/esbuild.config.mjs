import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const workers = ['api']
const root = import.meta.dirname

// Stamped into the bundle and returned by `/health` so a rollout can be verified.
const buildId = new Date().toISOString()

mkdirSync('supabase/workers/api', { recursive: true })

await Promise.all(
  workers.map((name) =>
    esbuild.build({
      absWorkingDir: root,
      entryPoints: [`supabase/workers/${name}/index.ts`],
      outfile: `supabase/workers/${name}/index.mjs`,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node22',
      packages: 'bundle',
      sourcemap: true,
      logLevel: 'info',
      define: { 'process.env.ASSISTANT_BUILD_ID': JSON.stringify(buildId) },
      // CJS deps (`pg`, etc.) become `require("events")` in the ESM bundle.
      // Define Node's require before esbuild's helper runs.
      banner: {
        js: `import { createRequire } from 'node:module';
var require = createRequire(import.meta.url);
`,
      },
      alias: {
        // `ai` → `@ai-sdk/gateway` imports this at module load. Vercel-only;
        // its CJS build is what first crashed the worker (`require("path")`).
        '@vercel/oidc': join(root, 'esbuild.vercel-oidc-stub.js'),
      },
      external: ['pg-native'],
    })
  )
)
