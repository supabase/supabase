import path from 'node:path'
import { globby } from 'globby'

export type FrontmatterFormat = 'yaml' | 'toml'

export interface MarkdownSource {
  sourceFile: string
  slug: string
  outPath: string
  frontmatter: FrontmatterFormat
}

const OUTPUT_ROOT = 'public/markdown/guides'
const GUIDES_GLOB = 'content/guides/**/!(_)*.mdx'

export function guideSlug(sourceFile: string): string {
  return sourceFile.replace(/^content\/guides\//, '').replace(/\.mdx$/, '')
}

export async function collectMarkdownSources(): Promise<MarkdownSource[]> {
  const guideFiles = await globby([GUIDES_GLOB])

  return guideFiles.map((sourceFile) => {
    const slug = guideSlug(sourceFile)
    return { sourceFile, slug, outPath: `${OUTPUT_ROOT}/${slug}.md`, frontmatter: 'yaml' }
  })
}
