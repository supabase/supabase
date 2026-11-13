#!/usr/bin/env node
/**
 * Builds the surfaces the Supabase MCP server serves as MCP Apps:
 *
 *   dist/v1/projects.{js,css}     ui://supabase/projects-v1  sidebar + thread workspace
 *   dist/v1/panel.{js,css}        ui://supabase/panel-v1     focused conversation panels
 *   dist/v1/query-block.{js,css}  ui://supabase/query-block-v1 inline query results
 *   dist/v1/project-card.{js,css} ui://supabase/project-card-v1 create_project results, live status
 *
 * Each surface is one self-contained script and one stylesheet, with fonts and
 * images inlined, so the server can either link them from where `dist` is
 * hosted (`--apps-url`) or inline them into the document (`--apps-dir`). The
 * server renders the HTML document itself (`renderSurfaceDocument` in
 * `surfaces/contract`). `v1` is `SURFACE_VERSION`.
 *
 * `--watch` rebuilds on change. The server re-reads `--apps-dir` on every
 * resources/read, but hosts cache documents by URI: start a new chat to see
 * changes.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, runnerImport } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// The contract is TypeScript; let Vite load it. Loading sets NODE_ENV to
// development, which the production builds below must not inherit.
const nodeEnv = process.env.NODE_ENV
const { module: contract } = await runnerImport(
  join(root, '../../packages/surfaces/src/contract/index.ts')
)
if (nodeEnv === undefined) delete process.env.NODE_ENV
else process.env.NODE_ENV = nodeEnv
const { SURFACE_VERSION, SURFACE_NAMES, surfaceAssetFiles } = contract

const out = join(root, 'dist', SURFACE_VERSION)
const watch = process.argv.includes('--watch')
const only = process.argv.find((arg) => arg.startsWith('--surface='))?.slice('--surface='.length)

const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)

async function buildSurface(surface) {
  const tmp = join(root, 'dist', '.build', surface)
  process.env.SURFACE = surface
  process.env.SURFACE_OUT_DIR = tmp
  await build({
    root,
    configFile: join(root, 'vite.config.ts'),
    logLevel: 'warn',
    mode: 'production',
  })

  const files = surfaceAssetFiles(surface)
  const script = await readFile(join(tmp, files.script), 'utf8')
  let style = ''
  try {
    style = await readFile(join(tmp, files.style), 'utf8')
  } catch {}
  // The document is rendered by the server; nothing else may be emitted.
  if (/\bimport\s*\(|\bfrom\s*["']\.\.?\//.test(script.slice(0, 2000)))
    throw new Error(`${surface}: the script must not import other chunks`)
  if (script.includes('surfaces-preview-fixture'))
    throw new Error(`${surface}: preview fixtures leaked into the production build`)

  await rename(join(tmp, files.script), join(out, files.script))
  await writeFile(join(out, files.style), style)
  return {
    script: { file: files.script, hash: hash(script), bytes: Buffer.byteLength(script) },
    style: { file: files.style, hash: hash(style), bytes: Buffer.byteLength(style) },
  }
}

async function buildAll() {
  await mkdir(out, { recursive: true })
  const manifestPath = join(out, 'manifest.json')
  let previous = { surfaces: {} }
  try {
    previous = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch {}
  const surfaces = { ...previous.surfaces }
  for (const surface of only ? [only] : SURFACE_NAMES) {
    const started = Date.now()
    surfaces[surface] = await buildSurface(surface)
    const { script, style } = surfaces[surface]
    console.log(
      `${surface.padEnd(12)} ${(script.bytes / 1024).toFixed(0).padStart(6)} KB js ${(style.bytes / 1024).toFixed(0).padStart(5)} KB css  ${Date.now() - started}ms`
    )
  }
  // For deploy checks and cache purges; the server does not read it.
  await writeFile(
    manifestPath,
    JSON.stringify({ version: SURFACE_VERSION, surfaces }, null, 2) + '\n'
  )
  await rm(join(root, 'dist', '.build'), { recursive: true, force: true })
}

await buildAll()

if (watch) {
  const { watch: watchFiles } = await import('node:fs')
  const dirs = [
    join(root, 'src'),
    join(root, '..', '..', 'packages', 'surfaces', 'src'),
    join(root, '..', '..', 'packages', 'ui', 'src'),
  ]
  let timer
  let running = Promise.resolve()
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      running = running.then(() => buildAll()).catch((error) => console.error(error.message))
    }, 200)
  }
  for (const dir of dirs) watchFiles(dir, { recursive: true }, schedule)
  console.log('Watching surfaces for changes…')
}
