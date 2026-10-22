import path from 'node:path'

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx', '.markdown'])

/**
 * Turn an absolute file path into a slug relative to the content root, without extension.
 *   /root/guides/auth/users.md  -> 'guides/auth/users'
 *   /root/guides/index.md       -> 'guides'
 *   /root/index.md              -> ''
 */
export function filePathToSlug(filePath: string, contentRoot: string): string {
  const relative = path.relative(contentRoot, filePath)
  const parsed = path.parse(relative)
  const name = MARKDOWN_EXTENSIONS.has(parsed.ext.toLowerCase()) ? parsed.name : parsed.base

  const segments = parsed.dir ? parsed.dir.split(path.sep).filter(Boolean) : []
  if (name !== 'index') segments.push(name)
  return segments.join('/')
}
