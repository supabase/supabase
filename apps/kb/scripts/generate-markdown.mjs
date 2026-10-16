#!/usr/bin/env node
// Post-build step: converts every rendered guide, topic, and troubleshooting
// page in dist/ into a plain .md file under dist/markdown/, for agents/tools
// that want the page's content without the site chrome. The HTML is converted
// with markdown-for-agents (`extract: true` keeps only the main content), so
// this has to run after `astro build` — see vercel.json for the redirect and
// negotiated rewrites that serve these files at `<page>.md`.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { convert, createRule } from 'markdown-for-agents'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { BASE_PATH } from '../src/lib/constants.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(SCRIPT_DIR, '..', 'dist')
const OUTPUT_DIR = path.join(DIST_DIR, 'markdown')

// One directory per route section in dist/, matching the vercel.json redirects.
const SECTIONS = ['guides', 'topics', 'troubleshooting']

// Used to turn root-relative links into full URLs so the exported file still
// makes sense read on its own.
const SITE_ORIGIN = 'https://supabase.com'

// Root-relative links under this path point at the docs app, so they're kept
// as-is rather than being prefixed with the kb base path.
const DOCS_PATH = '/docs'

// Single processor reused for every file: parses GFM markdown to an mdast
// tree and serializes it back, same extensions on both ends so nothing
// (tables, strikethrough, alert blockquotes) gets mangled in the round trip.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', listItemIndent: 'one', emphasis: '_', rule: '-' })

/**
 * Absolute base URL to prepend to root-relative links, mirroring apps/docs'
 * `getInternalLinkBaseUrl()`. Empty in local dev/CI (outside Vercel), which
 * keeps links relative there — resolved instead against whatever host is
 * serving the build.
 *
 * Resolution order:
 *  - `VERCEL_ENV=production` → `https://supabase.com`
 *  - `VERCEL_ENV=preview`    → `https://${VERCEL_URL}`
 *  - anything else          → ''
 */
export function getInternalLinkBaseUrl() {
  const env = process.env.VERCEL_ENV
  if (env === 'production') return SITE_ORIGIN
  if (env === 'preview' && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
}

/**
 * Rewrites root-relative markdown links into full, absolute URLs by parsing
 * the body to an mdast tree, visiting its `link` nodes, and serializing it
 * back — the AST equivalent of apps/docs' `addBaseUrlPrefix()`, so this file
 * still makes sense read outside of the site (no regex over the raw text).
 * Links into /docs are left root-relative: that section is served from the
 * docs app, not under this app's base path.
 *
 * @param {string} body
 */
export function absolutizeLinks(body) {
  const tree = processor.parse(body)
  const baseUrl = getInternalLinkBaseUrl()

  visit(tree, 'link', (node) => {
    if (!node.url.startsWith('/') || node.url.startsWith('//')) return
    if (node.url === DOCS_PATH || node.url.startsWith(`${DOCS_PATH}/`)) return
    const withBase =
      node.url === BASE_PATH || node.url.startsWith(`${BASE_PATH}/`)
        ? node.url
        : `${BASE_PATH}${node.url}`
    node.url = `${baseUrl}${withBase}`
  })

  return String(processor.stringify(tree))
}

// Admonition labels (see TYPE_LABEL in packages/ui-patterns/src/Admonition)
// mapped to the GitHub alert type that keeps the same meaning in markdown.
const ALERT_TYPE_BY_LABEL = {
  Note: 'NOTE',
  Success: 'TIP',
  Warning: 'WARNING',
  Deprecated: 'WARNING',
  Caution: 'CAUTION',
  Danger: 'CAUTION',
}

function findDescendant(node, predicate) {
  for (const child of node.children ?? []) {
    if (predicate(child)) return child
    const found = findDescendant(child, predicate)
    if (found) return found
  }
  return undefined
}

// Rewrites the rendered <Admonition> (a `role="alert"` div carrying its label
// in `aria-label`) as a GitHub alert blockquote, dropping the icon markup and
// keeping only the body from its `alert-description` slot.
const admonitionRule = createRule(
  (node) => node.attribs?.['data-slot'] === 'alert' && node.attribs.role === 'alert',
  ({ convertChildren, node }) => {
    const type = ALERT_TYPE_BY_LABEL[node.attribs['aria-label']] ?? 'NOTE'
    const description = findDescendant(
      node,
      (child) => child.attribs?.['data-slot'] === 'alert-description'
    )
    const body = convertChildren(description ?? node).trim()
    const quoted = body
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n')
    return `\n\n> [!${type}]\n${quoted}\n\n`
  }
)

/**
 * Splits the YAML frontmatter block that markdown-for-agents prepends (from
 * the page's `<head>`) off the body, so the frontmatter isn't handed to the
 * markdown parser, which would read it as a thematic break and paragraphs.
 *
 * @param {string} markdown
 */
export function splitFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return { frontmatter: '', body: markdown }

  const closingIndex = markdown.indexOf('\n---\n', 4)
  if (closingIndex === -1) return { frontmatter: '', body: markdown }

  const end = closingIndex + '\n---\n'.length
  return { frontmatter: markdown.slice(0, end), body: markdown.slice(end) }
}

/**
 * Converts a rendered HTML page to markdown. Only the page's main content is
 * kept (`extract: true` drops navigation, headers, footers, and sidebars), and
 * root-relative links in the body are absolutized.
 *
 * @param {string} html
 */
export function htmlToMarkdown(html) {
  const { markdown } = convert(html, { extract: true, rules: [admonitionRule] })
  const { frontmatter, body } = splitFrontmatter(markdown)
  return `${frontmatter}${restoreAlertMarkers(absolutizeLinks(body))}`
}

// remark-stringify escapes the `[` in GitHub alert markers (`> [!NOTE]`),
// which GitHub would then render as literal text, so put the marker back.
// Only the five alert types at the start of a blockquote line are touched.
const ESCAPED_ALERT_MARKER = /^(>\s*)\\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gm

function restoreAlertMarkers(markdown) {
  return markdown.replace(ESCAPED_ALERT_MARKER, '$1[!$2]')
}

/**
 * Maps a page's built HTML path (relative to dist/) to its markdown export
 * path, e.g. `guides/sample-guide/index.html` → `guides/sample-guide.md`.
 *
 * @param {string} htmlPath
 */
export function toMarkdownPath(htmlPath) {
  return `${path.dirname(htmlPath)}.md`
}

async function findIndexPages(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }

  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return findIndexPages(fullPath)
      if (entry.name === 'index.html') return [fullPath]
      return []
    })
  )
  return files.flat()
}

async function writeFileEnsuringDir(outputPath, contents) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, contents)
}

async function main() {
  const pages = (
    await Promise.all(SECTIONS.map((section) => findIndexPages(path.join(DIST_DIR, section))))
  ).flat()

  if (pages.length === 0) {
    throw new Error('No rendered pages found under dist/. Run `astro build` before this script.')
  }

  await Promise.all(
    pages.map(async (file) => {
      const html = await readFile(file, 'utf-8')
      const relativePath = path.relative(DIST_DIR, file)
      const outputPath = path.join(OUTPUT_DIR, toMarkdownPath(relativePath))
      await writeFileEnsuringDir(outputPath, htmlToMarkdown(html))
    })
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
