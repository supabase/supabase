import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { libraryBlocks, libraryCategories } from '../config/library'

const BASE_URL = 'https://supabase.com/library'

function markdownLink(title: string, href: string) {
  const escaped = title.replace(/\s+/g, ' ').replace(/([\\\[\]])/g, '\\$1')
  return `[${escaped}](${BASE_URL}${href}.md)`
}

/**
 * The homepage catalog as markdown, so an agent can list every block without
 * rendering the page. Mirrors the categories and blocks in `config/library.ts`.
 */
export function buildIndexMarkdown(generatedAt = new Date()): string {
  const sections = libraryCategories
    .map((category) => {
      const blocks = libraryBlocks.filter((block) => block.category === category.name)
      const entries = blocks.map((block) => {
        const description = block.description.replace(/\s+/g, ' ').trim()
        // Framework variants follow the URL pattern spelled out in the overview,
        // so listing the slugs beats repeating a near-identical link per framework.
        const frameworks = block.supportedFrameworks?.length
          ? ` Frameworks: ${block.supportedFrameworks.join(', ')}.`
          : block.frameworkLabel
            ? ` Framework: ${block.frameworkLabel}.`
            : ''
        return `- ${markdownLink(block.title, block.href)} — ${description}${frameworks}`
      })
      return [`## ${category.name}`, category.description, '', entries.join('\n')].join('\n')
    })
    .filter(Boolean)

  return `# Supabase Library
Last updated: ${generatedAt.toISOString()}

## Overview
Building blocks for your next backend. Every block is shadcn compatible and integrates with Supabase, and each one ships with a guide you can install from.

Every docs page is also available as markdown for agents (append .md to the URL). Blocks that support several frameworks share one guide per framework at ${BASE_URL}/docs/<framework>/<block>.md.

Start here: ${markdownLink('Quick Start', '/docs/getting-started/quickstart')}, ${markdownLink('Introduction', '/docs/getting-started/introduction')}, ${markdownLink('FAQ', '/docs/getting-started/faq')}.
Full page index: ${BASE_URL}/llms.txt

${sections.join('\n\n')}
`
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const outputPath = path.join(process.cwd(), 'public', 'markdown', 'index.md')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, buildIndexMarkdown())
  console.log('Generated index.md in public/markdown/')
}
