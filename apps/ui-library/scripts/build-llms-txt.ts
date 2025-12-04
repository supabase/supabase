import fs from 'fs'
import path from 'path'

const BASE_URL = 'https://supabase.com/ui/docs'
const DOCS_DIR = path.join(process.cwd(), 'content/docs')
const OUTPUT_DIR = path.join(process.cwd(), 'public')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'llms.txt')

interface DocMeta {
  title: string
  description?: string
  path: string
}

console.log('🤖 Building llms.txt')

// Parse frontmatter safely
function extractFrontmatter(content: string): { title?: string; description?: string } {
  const fmRegex = /^---\n([\s\S]*?)\n---/m
  const match = content.match(fmRegex)
  if (!match) return {}

  const lines = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const result: { title?: string; description?: string } = {}

  for (const line of lines) {
    if (line.startsWith('title:')) {
      result.title = line.replace('title:', '').trim()
    } else if (line.startsWith('description:')) {
      result.description = line.replace('description:', '').trim()
    }
  }

  return result
}

// Recursively collect MDX files
function getMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getMdxFiles(fullPath))
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

// Build metadata list
function getDocFiles(): DocMeta[] {
  const mdxFiles = getMdxFiles(DOCS_DIR).sort()

  const docs: DocMeta[] = []
  for (const file of mdxFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const { title, description } = extractFrontmatter(content)

    if (!title) continue

    const relativePath = path.relative(DOCS_DIR, file)
    const urlPath = relativePath
      .replace(/\.mdx$/, '')
      .replace(/\/index$/, '')
      .replace(/\\/g, '/')

    docs.push({ title, description, path: urlPath })
  }

  return docs
}

// Build llms.txt
const docs = getDocFiles()

let content = `# Supabase UI Library
Last updated: ${new Date().toISOString()}

## Overview
Library of components for your project. The components integrate with Supabase and are shadcn compatible.

## Docs
`

for (const doc of docs) {
  const url = `${BASE_URL}/${doc.path}`
  content += `- [${doc.title}](${url})\n`
  if (doc.description) {
    content += `  - ${doc.description}\n`
  }
}

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

fs.writeFileSync(OUTPUT_FILE, content)
console.log('✅ Generated llms.txt in public/')
