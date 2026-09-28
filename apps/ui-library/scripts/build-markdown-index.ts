import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { libraryBlocks, libraryCategories } from '../config/library'
import {
  collectMdxFiles,
  getDocSlug,
  markdownLink,
  parseLibraryDocument,
} from '../lib/library-documents'

const DOCS_BASE_URL = 'https://supabase.com/library/docs'
const LIBRARY_BASE_URL = 'https://supabase.com/library'

interface DocMeta {
  title: string
  description?: string
  path: string
}

export function getDocFiles(docsDirectory: string): DocMeta[] {
  return collectMdxFiles(docsDirectory).map((fullPath) => {
    const { data } = parseLibraryDocument(fs.readFileSync(fullPath, 'utf8'))
    if (!data.title) throw new Error(`Missing document title: ${fullPath}`)
    return {
      title: data.title,
      description: data.description,
      path: getDocSlug(path.relative(docsDirectory, fullPath)),
    }
  })
}

export function buildLlmsTxt(docs: DocMeta[], generatedAt = new Date()): string {
  const entries = docs.map((doc) => {
    const description = doc.description?.replace(/\s+/g, ' ').trim()
    return [
      `- ${markdownLink(doc.title, `${DOCS_BASE_URL}/${doc.path}.md`)}`,
      description ? `    - ${description}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  })

  return `# Supabase Library
Last updated: ${generatedAt.toISOString()}

## Overview
Library of components for your project. The components integrate with Supabase and are shadcn compatible. Each docs page is also available as markdown for agents (append .md to the URL).

Block catalog: https://supabase.com/library/index.md

## Docs
${entries.join('\n')}
`
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
        return `- ${markdownLink(block.title, `${LIBRARY_BASE_URL}${block.href}.md`)} — ${description}${frameworks}`
      })
      return [`## ${category.name}`, category.description, '', entries.join('\n')].join('\n')
    })
    .filter(Boolean)

  return `# Supabase Library
Last updated: ${generatedAt.toISOString()}

## Overview
Building blocks for your next backend. Every block is shadcn compatible and integrates with Supabase, and each one ships with a guide you can install from.

Every docs page is also available as markdown for agents (append .md to the URL). Blocks that support several frameworks share one guide per framework at ${LIBRARY_BASE_URL}/docs/<framework>/<block>.md.

Start here: ${markdownLink('Quick Start', `${LIBRARY_BASE_URL}/docs/getting-started/quickstart.md`)}, ${markdownLink('Introduction', `${LIBRARY_BASE_URL}/docs/getting-started/introduction.md`)}, ${markdownLink('FAQ', `${LIBRARY_BASE_URL}/docs/getting-started/faq.md`)}.
Full page index: ${LIBRARY_BASE_URL}/llms.txt

${sections.join('\n\n')}
`
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const publicDirectory = path.join(process.cwd(), 'public')
  fs.mkdirSync(publicDirectory, { recursive: true })
  fs.writeFileSync(
    path.join(publicDirectory, 'llms.txt'),
    buildLlmsTxt(getDocFiles(path.join(process.cwd(), 'content', 'docs')))
  )
  console.log('Generated llms.txt in public/')

  const indexOutputPath = path.join(publicDirectory, 'markdown', 'index.md')
  fs.mkdirSync(path.dirname(indexOutputPath), { recursive: true })
  fs.writeFileSync(indexOutputPath, buildIndexMarkdown())
  console.log('Generated index.md in public/markdown/')
}
