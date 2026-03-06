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

/** Remove the minimum common leading whitespace from all non-empty lines. */
function dedentBlock(text: string): string {
  const lines = text.split('\n')
  const nonEmpty = lines.filter((l) => /\S/.test(l))
  if (!nonEmpty.length) return text
  const minIndent = Math.min(...nonEmpty.map((l) => (l.match(/^([ \t]*)/) ?? ['', ''])[1].length))
  if (!minIndent) return text
  return lines.map((l) => l.slice(minIndent)).join('\n')
}

/**
 * Converts StepHikeCompact components to markdown ordered lists.
 * Each step becomes a numbered item: the title (from Details) is bolded on the item
 * line, and the full step body (Details + Code) is dedented and appended below.
 * Remaining JSX tags inside the body are later stripped by stripJsxTags.
 */
function convertStepHike(content: string): string {
  return content.replace(/<StepHikeCompact>([\s\S]*?)<\/StepHikeCompact>/g, (_, body) => {
    const items: string[] = []
    const stepRe = /<StepHikeCompact\.Step[^>]*>([\s\S]*?)<\/StepHikeCompact\.Step>/g
    let stepNum = 1
    let m: RegExpExecArray | null
    while ((m = stepRe.exec(body)) !== null) {
      const stepBody = m[1]
      const titleMatch = stepBody.match(/<StepHikeCompact\.Details[^>]+title="([^"]*)"/)
      const title = titleMatch ? titleMatch[1] : ''
      // Dedent the entire step body so nested JSX indentation is removed.
      // Remaining component tags (Details, Code, Admonition…) are stripped later.
      const inner = dedentBlock(stepBody).trim()
      const item = title ? `${stepNum}. **${title}**\n\n${inner}` : `${stepNum}. ${inner}`
      items.push(item)
      stepNum++
    }
    return items.join('\n\n')
  })
}

/**
 * Strips JSX component tags (capitalized names, dot-notation, or $-prefixed)
 * while keeping their inner content. Also strips wrapper div and a elements.
 * Removes MDX JSX comment blocks. Strips unnecessary leading indentation from
 * non-code-block lines.
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

  // Remove wrapper div and a elements used structurally in MDX (carry JSX props
  // like className which are not valid HTML; inner content such as img is preserved)
  content = content.replace(/<div(?:\s[^>]*)?\s*>/g, '')
  content = content.replace(/<\/div>/g, '')
  content = content.replace(/<a(?:\s[^>]*)?\s*>/g, '')
  content = content.replace(/<\/a>/g, '')

  // Split on fenced code blocks to handle prose and code separately.
  // For prose (even segments): strip leading whitespace (removes JSX nesting indent).
  // For code blocks (odd segments): dedent the body to remove JSX nesting indent while
  // preserving relative code structure, then normalize the closing fence.
  const segments = content.split(/(```[\s\S]*?```)/g)
  content = segments
    .map((seg, i) => {
      if (i % 2 === 0) return seg.replace(/^[ \t]+/gm, '')
      return seg.replace(
        /^(```[^\n]*\n)([\s\S]*?)(\n[ \t]*```)$/,
        (_, open, body) => open + dedentBlock(body) + '\n```'
      )
    })
    .join('')

  // Collapse lines that are only whitespace to empty lines, then deduplicate blank lines
  content = content.replace(/^[^\S\n]+$/gm, '')
  content = content.replace(/\n{3,}/g, '\n\n').trim()

  return content
}

async function generate() {
  const files = await globby(['content/guides/**/!(_)*.mdx'])
  let warnings = 0

  await Promise.all(
    files.map(async (filePath) => {
      const outPath = filePath
        .replace(/^content\/guides\//, 'public/docs/guides/')
        .replace(/\.mdx$/, '.md')

      let output: string
      try {
        const raw = await fs.promises.readFile(filePath, 'utf8')
        const { content: rawContent, data } = matter(raw)

        const withPartials = await inlinePartials(rawContent)
        const withSteps = convertStepHike(withPartials)
        const processed = stripJsxTags(withSteps)

        const header = [
          data.title ? `# ${data.title}` : '',
          data.subtitle || data.description ? `\n${data.subtitle ?? data.description}` : '',
        ]
          .filter(Boolean)
          .join('\n')

        output = header ? `${header}\n\n${processed}` : processed
      } catch (err) {
        warnings++
        console.warn(
          `[warn] Failed to process ${filePath}: ${err instanceof Error ? err.message : err}`
        )
        // Fall back to raw file content so the route still serves something
        try {
          output = await fs.promises.readFile(filePath, 'utf8')
        } catch {
          output = `<!-- failed to generate: ${filePath} -->`
        }
      }

      // content/guides/ai/vector-columns.mdx → public/docs/guides/ai/vector-columns.md
      // Placing under public/docs/ ensures the file is served at /docs/guides/...
      // matching the exact URL of the rendered page.
      await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
      await fs.promises.writeFile(outPath, output)
    })
  )

  const summary = warnings ? ` (${warnings} with warnings)` : ''
  console.log(`Generated ${files.length} markdown files under public/docs/guides/${summary}`)
}

generate()
