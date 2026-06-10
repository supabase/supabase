import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { globby } from 'globby'
import matter from 'gray-matter'
import * as sharedDataPkg from 'shared-data'

import { getInternalLinkBaseUrl, prefixInternalLinks, withDocsBasePath } from './internal-links'
import { resolveSharedData } from '../components/SharedData.utils'

// Interop: tsx's ESM loader treats `shared-data` as CJS and exposes the
// module under `.default`, while a webpack/Next build would expose the
// named exports directly on the namespace. This script is only run by tsx,
// but the fallback keeps it robust if that ever changes.
const sharedDataModule = ((sharedDataPkg as any).default ??
  sharedDataPkg) as typeof import('shared-data')
const sharedData = {
  config: sharedDataModule.config,
  logConstants: sharedDataModule.logConstants,
}
type SharedDataKey = keyof typeof sharedData

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
 * Extracts a `title` prop value from a JSX opening-tag's attribute text.
 * Supports `title="..."`, `title='...'`, and `title={<jsx>...</jsx>}` forms.
 * For JSX titles, strips inline tags and collapses whitespace so the text
 * content remains.
 */
function extractTitleAttr(attrs: string): string | null {
  const strMatch = attrs.match(/\btitle=(?:"([^"]+)"|'([^']+)')/)
  if (strMatch) return strMatch[1] ?? strMatch[2]

  const exprIdx = attrs.indexOf('title={')
  if (exprIdx === -1) return null

  let i = exprIdx + 'title={'.length
  const inner: string[] = []
  let depth = 1
  while (i < attrs.length && depth > 0) {
    const ch = attrs[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) break
    }
    inner.push(ch)
    i++
  }
  return inner
    .join('')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Discovers components that expose a `__markdown__` string property and
 * returns a `{ name → markdown }` map. Globs `components/**` for files that
 * mention `__markdown__`, then loads each via `createRequire` so tsx's CJS
 * interop handles `shared-data` named imports. Files that fail to load
 * (e.g. heavy Next.js deps) are skipped silently — the feature degrades
 * gracefully rather than crashing the build.
 */
const scriptRequire = createRequire(import.meta.url)
async function loadMarkdownOverrides(): Promise<Record<string, string>> {
  const overrides: Record<string, string> = {}
  const files = await globby(['components/**/*.{ts,tsx}'])
  await Promise.all(
    files.map(async (file) => {
      const src = await fs.promises.readFile(file, 'utf8')
      if (!/\.__markdown__\s*=/.test(src)) return
      try {
        const mod = scriptRequire(path.resolve(file))
        for (const [name, value] of Object.entries(mod ?? {})) {
          if (typeof (value as any)?.__markdown__ === 'string') {
            overrides[name] = (value as any).__markdown__
          }
        }
      } catch {
        // Heavy deps or non-CJS-friendly modules — skip this file
      }
    })
  )
  return overrides
}

/**
 * Replaces any JSX tag whose name matches a `__markdown__` override with the
 * override string. Handles both self-closing (`<Foo />`) and paired
 * (`<Foo>…</Foo>`) forms. Done before `stripJsxTags` so the markdown content
 * survives subsequent indent normalization.
 */
function convertMarkdownComponents(content: string, overrides: Record<string, string>): string {
  const names = Object.keys(overrides)
  if (names.length === 0) return content
  const alt = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  content = content.replace(
    new RegExp(`<(${alt})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'g'),
    (_, name) => overrides[name]
  )
  content = content.replace(new RegExp(`<(${alt})\\b[^>]*\\/>`, 'g'), (_, name) => overrides[name])
  return content
}

/**
 * Inlines `<SharedData data="key">path</SharedData>` with the resolved value
 * from the `shared-data` package. Only matches plain-text children (no `<` or
 * `{`), so the render-function variant `<SharedData data="…">{(d) => …}</SharedData>`
 * is left untouched and falls through to `stripJsxTags`.
 */
function convertSharedData(content: string): string {
  return content.replace(
    /<SharedData\s+data="([^"]+)">([^<{]+)<\/SharedData>/g,
    (full, key, path) => {
      const dataset = sharedData[key as SharedDataKey]
      if (!dataset) return full
      const value = resolveSharedData(dataset, path.trim())
      return value === undefined ? full : String(value)
    }
  )
}

/**
 * Replaces `<InfoTooltip ...>children</InfoTooltip>` with just its children,
 * discarding the `tooltipContent` prop. Walks the opening tag with brace
 * awareness so JSX expression props like `tooltipContent={<>…</>}` don't
 * terminate parsing on a stray `>` (e.g. from `<br />` inside the prop).
 */
function convertInfoTooltip(content: string): string {
  const openTagName = '<InfoTooltip'
  const closeTag = '</InfoTooltip>'
  let result = ''
  let cursor = 0
  while (cursor < content.length) {
    const start = content.indexOf(openTagName, cursor)
    if (start === -1) {
      result += content.slice(cursor)
      break
    }
    const after = content[start + openTagName.length]
    if (after && !/[\s>]/.test(after)) {
      // Different component starting with "InfoTooltip" — skip this match
      result += content.slice(cursor, start + openTagName.length)
      cursor = start + openTagName.length
      continue
    }
    result += content.slice(cursor, start)

    let i = start + openTagName.length
    let depth = 0
    while (i < content.length) {
      const ch = content[i]
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) break
      i++
    }
    if (i >= content.length) {
      result += content.slice(start)
      break
    }
    const openEnd = i + 1
    const closeIdx = content.indexOf(closeTag, openEnd)
    if (closeIdx === -1) {
      result += content.slice(start, openEnd)
      cursor = openEnd
      continue
    }
    result += content.slice(openEnd, closeIdx)
    cursor = closeIdx + closeTag.length
  }
  return result
}

/**
 * Converts `<Link href="..."><GlassPanel|IconPanel title="...">desc</...></Link>`
 * blocks into markdown bullet lines: `- [title](href). description`. Without
 * this, the rendered output keeps prop syntax (className, passHref, etc.) since
 * stripping JSX tags discards inner text from props but leaves panel children
 * floating without context. Applied to all guides so resource-card grids render
 * consistently in the markdown view.
 */
function convertLinkPanels(content: string): string {
  return content.replace(/<Link\b([\s\S]*?)>([\s\S]*?)<\/Link>/g, (full, linkAttrs, body) => {
    const hrefMatch = linkAttrs.match(/\bhref="([^"]+)"/)
    if (!hrefMatch) return full
    const href = withDocsBasePath(hrefMatch[1])

      const panelOpen = body.match(/<(GlassPanel|IconPanel)\b/)
      if (!panelOpen) return full
      const panelName = panelOpen[1]
      const panelStart = panelOpen.index ?? 0

      // Walk past the opening tag, respecting both JSX `{}` expression depth
      // (so `title={<span>...</span>}` doesn't terminate early) and quoted
      // attribute values (so `>` inside `className="[&>div]..."` is ignored).
      let i = panelStart + panelOpen[0].length
      let depth = 0
      let quote: string | null = null
      while (i < body.length) {
        const ch = body[i]
        if (quote) {
          if (ch === quote) quote = null
        } else if (ch === '"' || ch === "'") {
          quote = ch
        } else if (ch === '{') {
          depth++
        } else if (ch === '}') {
          depth--
        } else if (ch === '>' && depth === 0) {
          break
        }
        i++
      }
      if (i >= body.length) return full

      const panelAttrs = body.slice(panelStart + panelOpen[0].length, i)
      const title = extractTitleAttr(panelAttrs)
      if (!title) return full

      // Self-closing panels (`<GlassPanel ... />`) carry no description.
      const isSelfClosing = panelAttrs.trimEnd().endsWith('/')
      let description = ''
      if (!isSelfClosing) {
        const closingTag = `</${panelName}>`
        const closeIdx = body.indexOf(closingTag, i)
        if (closeIdx === -1) return full
        description = body
          .slice(i + 1, closeIdx)
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      return `- [${title}](${href})${description ? `. ${description}` : ''}`
    }
  )
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
  const linkBaseUrl = getInternalLinkBaseUrl()
  const markdownOverrides = await loadMarkdownOverrides()
  let warnings = 0

  await Promise.all(
    files.map(async (filePath) => {
      const outPath = filePath
        .replace(/^content\/guides\//, 'public/markdown/guides/')
        .replace(/\.mdx$/, '.md')

      let output: string
      try {
        const raw = await fs.promises.readFile(filePath, 'utf8')
        const { content: rawContent, data } = matter(raw)

        const withPartials = await inlinePartials(rawContent)
        const withSteps = convertStepHike(withPartials)
        const withTooltips = convertInfoTooltip(withSteps)
        const withSharedData = convertSharedData(withTooltips)
        const withOverrides = convertMarkdownComponents(withSharedData, markdownOverrides)
        const withLinks = convertLinkPanels(withOverrides)
        const stripped = stripJsxTags(withLinks)
        const processed = prefixInternalLinks(stripped, linkBaseUrl)

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

      // content/guides/ai/vector-columns.mdx → public/markdown/guides/ai/vector-columns.md
      // Placing under public/markdown/ ensures the file is served at /docs/guides/...
      // matching the exact URL of the rendered page.
      await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
      await fs.promises.writeFile(outPath, output)
    })
  )

  const summary = warnings ? ` (${warnings} with warnings)` : ''
  console.log(`Generated ${files.length} markdown files under public/markdown/guides/${summary}`)
}

generate()
