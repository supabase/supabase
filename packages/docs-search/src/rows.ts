import path from 'node:path'

import { parsePage } from './markdown.js'
import { filePathToSlug } from './routes.js'

export interface SectionRow {
  slug: string
  file_path: string
  page_title: string
  heading: string
  heading_level: number
  heading_path: string[]
  content: string
  excerpt: string
}

/** Build the DB rows for a single markdown file. Pure: no I/O. */
export function buildRows(
  markdown: string,
  filePath: string,
  contentRoot: string,
  slugPrefix = ''
): SectionRow[] {
  const slug = slugPrefix + filePathToSlug(filePath, contentRoot)
  const relativePath = path.relative(contentRoot, filePath).split(path.sep).join('/')
  const page = parsePage(markdown)
  const pageTitle = page.title || path.basename(slug) || 'Untitled'

  return page.sections.map((section) => ({
    slug,
    file_path: relativePath,
    page_title: pageTitle,
    heading: section.heading,
    heading_level: section.level,
    heading_path: section.headingPath,
    content: section.content,
    excerpt: page.excerpt,
  }))
}
