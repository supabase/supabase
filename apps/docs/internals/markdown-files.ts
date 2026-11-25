import { globby } from 'globby'

export const MARKDOWN_DIR = 'public/markdown'

// Aggregate files written next to the per-page markdown, never part of it themselves.
export const SITEMAP_FILE = 'sitemap.md'
export const FULL_FILE = 'full.md'

// Sorted paths (relative to MARKDOWN_DIR) of every generated page, shared by the sitemap and
// full-content scripts so both cover exactly the same files.
export async function listMarkdownFiles() {
  return (
    await globby(['**/*.md', `!${SITEMAP_FILE}`, `!${FULL_FILE}`], { cwd: MARKDOWN_DIR })
  ).sort()
}
