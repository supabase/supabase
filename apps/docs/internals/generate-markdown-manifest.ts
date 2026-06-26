import fs from 'node:fs/promises'
import path from 'node:path'

import { collectMarkdownSources } from './markdown-sources'

const MANIFEST_PATH = path.join(process.cwd(), '__generated__', 'markdown-manifest.ts')

async function generateManifest() {
  const sources = await collectMarkdownSources()
  const slugs = [...new Set(sources.map((source) => source.slug))].sort()

  const fileContent = `export const MARKDOWN_SLUGS: readonly string[] = ${JSON.stringify(slugs, null, 2)}\n`

  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await fs.writeFile(MANIFEST_PATH, fileContent)
  console.log(`Wrote ${slugs.length} slugs to __generated__/markdown-manifest.ts`)
}

generateManifest()
