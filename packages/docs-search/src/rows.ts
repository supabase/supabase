import path from 'node:path'

import { parsePage } from './markdown.js'
import { filePathToSlug } from './routes.js'
import type { SectionRow } from './types.js'

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
