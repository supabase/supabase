import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { collectMdxFiles, getDocSlug, parseLibraryDocument } from './library-documents'

const BASE_URL = 'https://supabase.com/library/docs'

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
    const title = doc.title.replace(/\s+/g, ' ').replace(/([\\\[\]])/g, '\\$1')
    const description = doc.description?.replace(/\s+/g, ' ').trim()
    return [`- [${title}](${BASE_URL}/${doc.path}.md)`, description ? `    - ${description}` : '']
      .filter(Boolean)
      .join('\n')
  })

  return `# Supabase Library
Last updated: ${generatedAt.toISOString()}

## Overview
Library of components for your project. The components integrate with Supabase and are shadcn compatible. Each docs page is also available as markdown for agents (append .md to the URL).

## Docs
${entries.join('\n')}
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
}
