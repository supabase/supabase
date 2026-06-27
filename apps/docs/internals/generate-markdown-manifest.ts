import fs from 'node:fs/promises'
import path from 'node:path'

import { collectMarkdownSources } from './markdown-sources'

const MANIFEST_PATH = path.join(process.cwd(), 'lib', 'markdown-manifest.ts')
const RELATIVE_PATH = 'apps/docs/lib/markdown-manifest.ts'

const HEADER = `// GENERATED FILE — DO NOT EDIT.
//
// The guide slugs that have a generated markdown (.md) variant. middleware.ts
// imports this to decide whether a bot request for /guides/<slug> can be served
// markdown. It is committed (not left under __generated__) so the import resolves
// in every build context — turbo does not run the npm \`prebuild\` hook that
// regenerates it, so a gitignored file would be missing during typecheck/lint.
//
// Regenerate with: pnpm --filter docs build:markdown-manifest
// CI fails if this drifts from the content sources (docs-markdown-manifest-sync workflow).
`

async function collectSlugs(): Promise<string[]> {
  const sources = await collectMarkdownSources()
  return [...new Set(sources.map((source) => source.slug))].sort()
}

function renderManifest(slugs: string[]): string {
  return `${HEADER}\nexport const MARKDOWN_SLUGS: readonly string[] = ${JSON.stringify(slugs, null, 2)}\n`
}

async function main() {
  const slugs = await collectSlugs()
  const expected = renderManifest(slugs)

  if (process.argv.includes('--check')) {
    let actual: string | null = null
    try {
      actual = await fs.readFile(MANIFEST_PATH, 'utf8')
    } catch {
      actual = null
    }

    if (actual !== expected) {
      console.error(
        `${RELATIVE_PATH} is out of sync with the markdown content sources.\n` +
          'Run `pnpm --filter docs build:markdown-manifest` and commit the result.'
      )
      process.exit(1)
    }

    console.log(`${RELATIVE_PATH} is up to date (${slugs.length} slugs).`)
    return
  }

  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await fs.writeFile(MANIFEST_PATH, expected)
  console.log(`Wrote ${slugs.length} slugs to ${RELATIVE_PATH}`)
}

main()
