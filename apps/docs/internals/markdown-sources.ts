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
const TROUBLESHOOTING_GLOB = 'content/troubleshooting/!(_)*.mdx'

export function guideSlug(sourceFile: string): string {
  return sourceFile.replace(/^content\/guides\//, '').replace(/\.mdx$/, '')
}

export function troubleshootingSlug(sourceFile: string): string {
  return `troubleshooting/${path.basename(sourceFile, '.mdx')}`
}

export async function collectMarkdownSources(): Promise<MarkdownSource[]> {
  const [guideFiles, troubleshootingFiles] = await Promise.all([
    globby([GUIDES_GLOB]),
    globby([TROUBLESHOOTING_GLOB]),
  ])

  const guides: MarkdownSource[] = guideFiles.map((sourceFile) => {
    const slug = guideSlug(sourceFile)
    return { sourceFile, slug, outPath: `${OUTPUT_ROOT}/${slug}.md`, frontmatter: 'yaml' }
  })

  const troubleshooting: MarkdownSource[] = troubleshootingFiles.map((sourceFile) => {
    const slug = troubleshootingSlug(sourceFile)
    return { sourceFile, slug, outPath: `${OUTPUT_ROOT}/${slug}.md`, frontmatter: 'toml' }
  })

  return [...guides, ...troubleshooting]
}
