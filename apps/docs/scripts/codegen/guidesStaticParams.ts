/*
 * Codegen: enumerates published guide MDX files into a static JSON.
 *
 * Why: Turbopack's static analyzer treats `readdir(join(STATIC_BASE, dynamic))`
 * as a webpack-style context module and tries to bundle every reachable file.
 * Replacing the runtime readdir with a build-time JSON makes the path opaque
 * to the analyzer.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { globby } from 'globby'

const DOCS_DIR = process.cwd()
const GUIDES_DIR = join(DOCS_DIR, 'content/guides')
const OUTPUT_FILE = join(DOCS_DIR, '__generated__/guidesStaticParams.json')

type GuidesStaticParamsManifest = {
  /** Slug paths (no `.mdx` extension, POSIX separators) relative to content/guides/. */
  paths: string[]
}

async function generate(): Promise<GuidesStaticParamsManifest> {
  const mdxFiles = await globby(['**/*.mdx'], {
    cwd: GUIDES_DIR,
    ignore: ['**/_*.mdx'],
  })
  const paths = mdxFiles.map((file) => file.replace(/\.mdx$/, '')).sort()
  return { paths }
}

async function main() {
  const manifest = await generate()
  await mkdir(dirname(OUTPUT_FILE), { recursive: true })
  await writeFile(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
  console.log(`Generated ${relative(DOCS_DIR, OUTPUT_FILE)} (${manifest.paths.length} paths)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
