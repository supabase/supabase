// Bundles this service into `dist/index.mjs`, the entrypoint the `node` Compute
// runtime imports and serves.
//
// Nothing is installed server-side: `supabase compute push` uploads the source
// directory as-is and the platform synthesizes `FROM <base>` + `COPY` with no
// install step. So either `node_modules/` ships in the upload, or the
// dependencies are in the bundle. This block does the latter, and points
// `[compute.mcp-server] source` at `dist/`, so the uploaded directory is two
// files instead of a vendored dependency tree.
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { build } from 'esbuild'

const OUT_DIR = 'dist'

// `index.mjs` is the name the `node` runtime looks for: the archive root must
// contain the entrypoint, and it must default-export an object with a `fetch`
// method. Renaming it deploys a directory the runtime cannot start.
const ENTRY_OUT = join(OUT_DIR, 'index.mjs')

// A `package.json` next to the bundle, so a push with no
// `[compute.mcp-server] runtime` still classifies as `node`. The CLI guesses
// the runtime from marker files and falls back to `deno` when it finds none,
// and a bundle built for node does not run under deno. Pinning `runtime` in
// config.toml is still the documented path; this is the safety net.
const OUT_MANIFEST = { private: true, type: 'module' }

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

await build({
  entryPoints: ['main.ts'],
  outfile: ENTRY_OUT,
  bundle: true,
  // The platform owns the listener: it imports the default export and serves it
  // on $PORT. This is a library, not a program, so there is no shebang or
  // top-level `listen`.
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Everything except `node:` builtins goes in the bundle. This is the whole
  // point of the build: `dist/` has no `node_modules/` to resolve against.
  packages: 'bundle',
  // Left unminified on purpose. A public instance has 50 seconds to accept
  // connections and parsing a bundle this size is a few milliseconds of that,
  // so the trade buys nothing — while readable frames in `supabase compute
  // logs` are what makes a failed request diagnosable.
  minify: false,
  logLevel: 'info',
})

await writeFile(join(OUT_DIR, 'package.json'), `${JSON.stringify(OUT_MANIFEST, null, 2)}\n`)

// Printed because packaged size is the number that moves when a dependency is
// added, and the cost lands on cold start.
const { size } = await stat(ENTRY_OUT)
console.log(`${ENTRY_OUT} ${(size / 1024).toFixed(0)} KiB`)
