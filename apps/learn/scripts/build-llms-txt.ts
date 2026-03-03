import fs from 'fs'
import path from 'path'

const BASE_URL = 'https://supabase.com/ui/docs'

interface DocMeta {
  title: string
  description?: string
  path: string
}

console.log('🤖 Building llms.txt')

// Function to extract frontmatter from MDX files
function extractFrontmatter(content: string): { title?: string; description?: string } {
  const frontmatterRegex = /---\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)
  if (!match) return {}

  const frontmatter = match[1]
  const titleMatch = frontmatter.match(/title:\s*(.*)/)
  const descriptionMatch = frontmatter.match(/description:\s*(.*)/)

  return {
    title: titleMatch?.[1],
    description: descriptionMatch?.[1],
  }
}

// Function to recursively get all MDX files
function getMdxFiles(dir: string): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

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

// Function to get all MDX files and their metadata
function getDocFiles(): DocMeta[] {
  const docsDir = path.join(process.cwd(), 'content')
  const mdxFiles = getMdxFiles(docsDir).sort((a, b) => a.localeCompare(b))

  const docs: DocMeta[] = []

  for (const fullPath of mdxFiles) {
    console.log(fullPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const { title, description } = extractFrontmatter(content)

    if (title) {
      // Get relative path and convert to URL path
      const relativePath = path.relative(docsDir, fullPath)
      const urlPath = relativePath
        .replace(/\.mdx$/, '')
        .replace(/\/index$/, '')
        .replace(/\\/g, '/')

      docs.push({
        title,
        description,
        path: urlPath,
      })
    }
  }

  return docs
}

// Generate the llms.txt content
const docs = getDocFiles()
let content = `# Learn Supabase
Last updated: ${new Date().toISOString()}

## Overview
Library of components for your project. The components integrate with Supabase and are shadcn compatible.

## Docs
`

// Add documentation links
for (const doc of docs) {
  const url = `${BASE_URL}/${doc.path}`
  content += `- [${doc.title}](${url})`
  if (doc.description) {
    content += `\n    - ${doc.description}`
  }
  content += '\n'
}

// Write the file
const publicDir = path.join(process.cwd(), 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

fs.writeFileSync(path.join(publicDir, 'llms.txt'), content)
console.log('✅ Generated llms.txt in public directory')
