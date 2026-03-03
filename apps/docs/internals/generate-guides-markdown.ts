import fs from 'fs'
import path from 'path'
import { globby } from 'globby'
import matter from 'gray-matter'

const PARTIALS_DIR = path.join(process.cwd(), 'content', '_partials')

/**
 * Reads <$Partial path="..." /> tags and replaces them with the file contents.
 * Recurses to handle nested partials.
 */
async function inlinePartials(content: string): Promise<string> {
  const partialRegex = /<\$Partial\s+path="([^"]+)"[^/]*\/>/g
  const matches = [...content.matchAll(partialRegex)]
  for (const [fullMatch, partialPath] of matches) {
    try {
      const raw = await fs.promises.readFile(path.join(PARTIALS_DIR, partialPath), 'utf8')
      const { content: partialBody } = matter(raw)
      const inlined = await inlinePartials(partialBody)
      content = content.replace(fullMatch, inlined)
    } catch {
      content = content.replace(fullMatch, '')
    }
  }
  return content
}

/**
 * Strips JSX component tags (capitalized names, dot-notation, or $-prefixed)
 * while keeping their inner content. Also strips wrapper <div> elements.
 * Removes MDX JSX comment blocks.
 */
function stripJsxTags(content: string): string {
  // Remove MDX/JSX comments {/* ... */}
  content = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

  // Remove self-closing JSX components: <Component ... /> or <$Directive ... />
  content = content.replace(/<[\$A-Z][\w.]*(?:\s[^>]*)?\s*\/>/gs, '')

  // Remove opening JSX component tags (possibly multi-line): <Component ...>
  content = content.replace(/<[\$A-Z][\w.]*(?:\s[^>]*)?\s*>/gs, '')

  // Remove closing JSX component tags: </Component>
  content = content.replace(/<\/[\$A-Z][\w.]*>/g, '')

  // Remove wrapper <div> and <a> elements used structurally in MDX (they carry JSX props
  // like className which are not valid HTML; inner content such as <img> is preserved)
  content = content.replace(/<div(?:\s[^>]*)?\s*>/g, '')
  content = content.replace(/<\/div>/g, '')
  content = content.replace(/<a(?:\s[^>]*)?\s*>/g, '')
  content = content.replace(/<\/a>/g, '')

  // Collapse lines that are only whitespace to empty lines, then deduplicate blank lines
  content = content.replace(/^[^\S\n]+$/gm, '')
  content = content.replace(/\n{3,}/g, '\n\n').trim()

  return content
}

async function generate() {
  const files = await globby(['content/guides/**/!(_)*.mdx'])

  await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.promises.readFile(filePath, 'utf8')
      const { content: rawContent, data } = matter(raw)

      const withPartials = await inlinePartials(rawContent)
      const processed = stripJsxTags(withPartials)

      const header = [
        data.title ? `# ${data.title}` : '',
        data.subtitle || data.description ? `\n${data.subtitle ?? data.description}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const output = header ? `${header}\n\n${processed}` : processed

      // content/guides/ai/vector-columns.mdx → public/docs/guides/ai/vector-columns.md
      // Placing under public/docs/ ensures the file is served at /docs/guides/...
      // matching the exact URL of the rendered page.
      const outPath = filePath
        .replace(/^content\/guides\//, 'public/docs/guides/')
        .replace(/\.mdx$/, '.md')

      await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
      await fs.promises.writeFile(outPath, output)
    })
  )

  console.log(`Generated ${files.length} markdown files under public/docs/guides/`)
}

generate()
