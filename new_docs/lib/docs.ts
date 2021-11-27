import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const docsDirectory = join(process.cwd(), 'docs')

export function getDocsBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, '')
  const docsDirectory = join(process.cwd(), 'docs')
  let fullPath = join(docsDirectory, `${realSlug}.md`)

  if (!fs.existsSync(fullPath)) {
    console.log('file not found, redirect to 404')
    fullPath = join(docsDirectory, '404.md')
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const { data, content } = matter(fileContents)

  return { slug: realSlug, meta: data, content }
}

export function getAllDocs() {
  const slugs = fs.readdirSync(docsDirectory)
  const docs = slugs.map((slug) => getDocsBySlug(slug))

  return docs
}
