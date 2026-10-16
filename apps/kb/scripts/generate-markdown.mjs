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

// Sections of supabase.com that live outside this app. Root-relative links into
// them are rendered against SITE_ORIGIN instead of the kb base path.
const SITE_SECTIONS = ['/docs', '/dashboard', '/blog', '/changelog']

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

// True when `href` is `prefix` itself or a path/query/fragment under it.
function isUnderPath(href, prefix) {
  return (
    href === prefix || ['/', '?', '#'].some((separator) => href.startsWith(`${prefix}${separator}`))
  )
}

// Root-relative (not protocol-relative) links are the ones that need resolving.
function isRootRelative(href) {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')
}

function resolveHref(href) {
  if (SITE_SECTIONS.some((prefix) => isUnderPath(href, prefix))) return `${SITE_ORIGIN}${href}`
  const withBase = isUnderPath(href, BASE_PATH) ? href : `${BASE_PATH}${href}`
  return `${getInternalLinkBaseUrl()}${withBase}`
}

// A markdown link destination ends at the first space or unbalanced ")", so a
// destination containing one of these (or a backslash or angle bracket) goes
// in <...>, with those characters backslash-escaped inside.
function formatDestination(href) {
  if (!/[\s()<>\\]/.test(href)) return href
  return `<${href.replace(/[\\<>]/g, '\\$&')}>`
}

// Titles sit inside double quotes, so quotes and backslashes are escaped.
function formatTitle(title) {
  return `"${title.replace(/[\\"]/g, '\\$&')}"`
}

// Rewrites links in the page body so the exported file still works when read
// outside the site: root-relative links get the base path (the HTML equivalent
// of apps/docs' `addBaseUrlPrefix()`), and every destination and title is
// escaped so the markdown link stays intact.
const linkRule = createRule(
  (node) => node.name === 'a' && typeof node.attribs?.href === 'string',
  ({ convertChildren, node }) => {
    const content = convertChildren(node).trim()
    if (!content) return ''
    const { href, title } = node.attribs
    const destination = formatDestination(isRootRelative(href) ? resolveHref(href) : href)
    return title
      ? `[${content}](${destination} ${formatTitle(title)})`
      : `[${content}](${destination})`
  }
)

// Admonition labels (see TYPE_LABEL in packages/ui-patterns/src/Admonition)
// mapped back to the source marker that produced them in
// src/lib/mdx/rehype-admonitions.ts (NOTE→note, TIP→success, IMPORTANT→warning,
// WARNING→danger, CAUTION→caution). "Deprecated" has no source marker.
const ALERT_TYPE_BY_LABEL = {
  Note: 'NOTE',
  Success: 'TIP',
  Warning: 'IMPORTANT',
  Danger: 'WARNING',
  Caution: 'CAUTION',
  Deprecated: 'WARNING',
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

// Concatenated text of a node and its descendants.
function textOf(node) {
  return (node.children ?? [])
    .map((child) => (child.type === 'text' ? child.data : textOf(child)))
    .join('')
}

// Astro's code blocks carry their language in `data-language` rather than a
// `language-*` class, which the package's default code block rule doesn't read.
const codeLanguageRule = createRule(
  (node) => node.name === 'pre' && node.attribs?.['data-language'],
  ({ node }) =>
    `\n\n\`\`\`${node.attribs['data-language']}\n${textOf(node).replace(/\n$/, '')}\n\`\`\`\n\n`
)

/**
 * Converts a rendered HTML page to markdown. Only the page's main content is
 * kept (`extract: true` drops navigation, headers, footers, and sidebars), and
 * root-relative links in the body are absolutized.
 *
 * @param {string} html
 */
export function htmlToMarkdown(html) {
  // The page's title and description already lead the body (as the h1 and the
  // lead paragraph), so the <head>-derived YAML frontmatter is skipped.
  return convert(html, {
    extract: true,
    frontmatter: false,
    rules: [admonitionRule, codeLanguageRule, linkRule],
  }).markdown
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
