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

// True for links to this app's own pages that need the base path (and origin)
// added. Protocol-relative and /docs links are left to the default conversion.
function isLocalRootRelative(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return false
  return href !== DOCS_PATH && !href.startsWith(`${DOCS_PATH}/`)
}

function absolutizeHref(href) {
  const withBase =
    href === BASE_PATH || href.startsWith(`${BASE_PATH}/`) ? href : `${BASE_PATH}${href}`
  return `${getInternalLinkBaseUrl()}${withBase}`
}

// Rewrites root-relative links in the page body so the exported file still
// works when read outside the site — the HTML equivalent of apps/docs'
// `addBaseUrlPrefix()`.
const linkRule = createRule(
  (node) => node.name === 'a' && isLocalRootRelative(node.attribs?.href),
  ({ convertChildren, node }) => {
    const content = convertChildren(node).trim()
    if (!content) return ''
    const href = absolutizeHref(node.attribs.href)
    const title = node.attribs.title
    return title ? `[${content}](${href} "${title}")` : `[${content}](${href})`
  }
)

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
    // Paragraph spacing comes out as runs of blank lines; keep one per gap.
    const body = convertChildren(description ?? node)
      .trim()
      .replace(/\n\s*\n/g, '\n\n')
    const quoted = body
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n')
    return `\n\n> [!${type}]\n${quoted}\n\n`
  }
)

/**
 * Converts a rendered HTML page to markdown. Only the page's main content is
 * kept (`extract: true` drops navigation, headers, footers, and sidebars), and
 * root-relative links in the body are absolutized.
 *
 * @param {string} html
 */
export function htmlToMarkdown(html) {
  return convert(html, { extract: true, rules: [admonitionRule, linkRule] }).markdown
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
  try {
    const entries = await readdir(dir, { recursive: true })
    return entries
      .filter((entry) => path.basename(entry) === 'index.html')
      .map((entry) => path.join(dir, entry))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
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
