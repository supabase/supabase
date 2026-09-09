import fs from 'node:fs/promises'
import path from 'node:path'

import { transformLibraryMdx } from './library-mdx-to-markdown'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'docs')
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'markdown', 'docs')
const MANIFEST_PATH = path.join(process.cwd(), 'public', 'markdown', 'manifest.json')

async function collectMdxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectMdxFiles(fullPath)))
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

async function generate() {
  const sources = await collectMdxFiles(CONTENT_DIR)
  const slugs: string[] = []

  // Wipe first so pages that were renamed or deleted don't leave stale markdown
  // behind — public/markdown is served directly, and the files outlive the manifest.
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  for (const sourceFile of sources) {
    const relativePath = path.relative(CONTENT_DIR, sourceFile)
    const slug = relativePath.replace(/\.mdx$/, '').replace(/\\/g, '/')
    const outPath = path.join(OUTPUT_DIR, `${slug}.md`)
    const raw = await fs.readFile(sourceFile, 'utf8')

    let output: string
    try {
      output = transformLibraryMdx(raw)
    } catch (err) {
      throw new Error(
        `Failed to process ${sourceFile}: ${err instanceof Error ? err.message : err}`,
        { cause: err }
      )
    }

    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, output)
    slugs.push(slug)
  }

  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(slugs, null, 2)}\n`)

  console.log(`Generated ${slugs.length} markdown files under public/markdown/docs/`)
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
