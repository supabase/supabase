import path from 'node:path'

/**
 * Content id for a file under a collection folder: its path without the .md/.mdx
 * extension, with `/` separators. Shared by the collections in src/content.config.ts
 * and anything that builds a URL from a content file (e.g. the sitemap).
 */
export function toContentId(entry: string): string {
  return entry
    .replace(/\.mdx?$/, '')
    .split(path.sep)
    .join('/')
}
